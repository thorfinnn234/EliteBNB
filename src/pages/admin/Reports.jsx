import {
  AlertTriangle,
  Ban,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Eye,
  FileSearch,
  Flag,
  Gavel,
  Mail,
  MessageSquareText,
  RefreshCw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Tag,
  Undo2,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { adminService } from "../../services/adminService";
import "./Reports.css";

const emptyFilters = {
  reason: "",
  reporterId: "",
  search: "",
  status: "",
  targetType: "",
};

const initialReportState = {
  error: "",
  loading: true,
  reports: [],
};

const reportStatuses = ["OPEN", "IN_REVIEW", "RESOLVED", "DISMISSED"];
const reportTargetTypes = ["USER", "PROPERTY", "REVIEW", "BOOKING"];
const reportReasons = [
  "FRAUD",
  "SAFETY",
  "HARASSMENT",
  "INAPPROPRIATE_CONTENT",
  "MISLEADING_LISTING",
  "PAYMENT_ISSUE",
  "OTHER",
];

const moderationActionsByTargetType = {
  BOOKING: ["DISMISS_REPORT"],
  PROPERTY: ["SUSPEND_PROPERTY", "REACTIVATE_PROPERTY", "DISMISS_REPORT"],
  REVIEW: ["HIDE_REVIEW", "RESTORE_REVIEW", "DISMISS_REPORT"],
  USER: ["SUSPEND_USER", "REACTIVATE_USER", "DISMISS_REPORT"],
};

const restrictiveModerationActions = [
  "SUSPEND_USER",
  "SUSPEND_PROPERTY",
  "HIDE_REVIEW",
];

const idFilterLabels = {
  reporterId: "Reporter ID",
};

/**
 * Builds a report query from only the finalized backend-supported filters.
 * The reports contract has no pagination, sorting, or date filters, so those
 * concerns intentionally stay out of this Admin workspace.
 */
function buildReportQuery(filters) {
  return Object.entries(filters).reduce((query, [key, value]) => {
    const trimmedValue = String(value || "").trim();

    if (trimmedValue) {
      query[key] = trimmedValue;
    }

    return query;
  }, {});
}

/**
 * Keeps optional ID filters useful without pretending the frontend owns
 * authorization or record visibility decisions.
 */
function getInvalidIdFilters(filters) {
  return Object.entries(idFilterLabels)
    .filter(([key]) => {
      const value = String(filters[key] || "").trim();
      return value && !/^\d+$/.test(value);
    })
    .map(([, label]) => label);
}

/**
 * Accepts the finalized array response while tolerating common collection
 * wrappers if the backend later nests report records under a conventional key.
 */
function normalizeReportList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.reports)) return payload.reports;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;

  return [];
}

/**
 * Normalizes one ModerationReportResponse from GET /admin/reports/{id}.
 */
function normalizeReportRecord(payload) {
  if (!payload) return null;
  if (payload.report) return payload.report;
  if (payload.data && !Array.isArray(payload.data)) return payload.data;

  return payload;
}

/**
 * Pulls a concise, operator-safe message out of Axios/backend failures.
 */
function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

/**
 * Converts backend enum values into readable labels while preserving the raw
 * enum strings for PATCH/POST requests.
 */
function formatEnum(value) {
  if (!value) return "Not recorded";

  return String(value)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * Formats report timestamps without inventing SLA or severity metadata.
 */
function formatDate(value) {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not recorded";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Displays a truthful report reference derived directly from the backend id.
 */
function getReportReference(report) {
  return report?.id ? `Report #${report.id}` : "Report";
}

/**
 * Builds a concise target label from genuine target fields. This avoids
 * fabricating user/property/review/booking detail that the report DTO does not
 * actually provide.
 */
function getTargetLabel(report) {
  if (report?.targetSummary) return report.targetSummary;

  if (report?.targetType === "USER") {
    return (
      report.reportedUserName ||
      report.reportedUserEmail ||
      (report.reportedUserId ? `User #${report.reportedUserId}` : null) ||
      (report.targetId ? `User #${report.targetId}` : "User target")
    );
  }

  if (report?.targetType === "PROPERTY") {
    return (
      report.reportedPropertyTitle ||
      (report.reportedPropertyId
        ? `Property #${report.reportedPropertyId}`
        : null) ||
      (report.targetId ? `Property #${report.targetId}` : "Property target")
    );
  }

  if (report?.targetType === "REVIEW") {
    return (
      (report.reportedReviewId ? `Review #${report.reportedReviewId}` : null) ||
      (report.targetId ? `Review #${report.targetId}` : "Review target")
    );
  }

  if (report?.targetType === "BOOKING") {
    return (
      (report.reportedBookingId
        ? `Booking #${report.reportedBookingId}`
        : null) ||
      (report.targetId ? `Booking #${report.targetId}` : "Booking target")
    );
  }

  return "Target not recorded";
}

/**
 * Keeps long report summaries readable in dense rows without losing the full
 * value inside the drawer.
 */
function truncateText(value, maxLength = 112) {
  if (!value) return "Not recorded";

  const text = String(value);
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text;
}

/**
 * Synchronizes one report after a detail refresh, workflow status update, or
 * moderation response without losing list-only fields.
 */
function mergeUpdatedReport(reports, updatedReport) {
  if (!updatedReport?.id) return reports;

  return reports.map((report) =>
    String(report.id) === String(updatedReport.id)
      ? { ...report, ...updatedReport }
      : report
  );
}

/**
 * Report workflow status and moderation actions are separate backend
 * operations, so this helper only returns status targets for the PATCH route.
 */
function getStatusTargets(report) {
  return reportStatuses.filter((status) => status !== report?.status);
}

/**
 * Returns the moderation actions that are meaningful for the reported target
 * type. Booking reports intentionally expose only DISMISS_REPORT because the
 * backend contract has no booking moderation action.
 */
function getModerationActions(report) {
  return moderationActionsByTargetType[report?.targetType] || ["DISMISS_REPORT"];
}

/**
 * Frontend note requirements protect operators from accidental destructive
 * decisions while leaving backend validation authoritative.
 */
function requiresAdminNote(action) {
  return restrictiveModerationActions.includes(action);
}

/**
 * Renders target-type icons through a switch instead of returning a component
 * constructor during render, which keeps React compiler rules happy.
 */
function renderTargetIcon(targetType, size = 14) {
  if (targetType === "USER") return <UserRound size={size} aria-hidden="true" />;
  if (targetType === "PROPERTY") {
    return <Building2 size={size} aria-hidden="true" />;
  }
  if (targetType === "REVIEW") {
    return <MessageSquareText size={size} aria-hidden="true" />;
  }
  if (targetType === "BOOKING") {
    return <CalendarClock size={size} aria-hidden="true" />;
  }

  return <Tag size={size} aria-hidden="true" />;
}

/**
 * Renders moderation action icons without creating dynamic components during
 * render. Restrictive, restorative, and dismissive actions keep distinct
 * visual language while using only supported backend action names.
 */
function renderModerationActionIcon(action) {
  if (restrictiveModerationActions.includes(action)) {
    return <Ban size={16} aria-hidden="true" />;
  }
  if (action.startsWith("REACTIVATE") || action.startsWith("RESTORE")) {
    return <Undo2 size={16} aria-hidden="true" />;
  }

  return <CheckCircle2 size={16} aria-hidden="true" />;
}

/**
 * Status badge with textual labels so the state is not communicated by color
 * alone.
 */
function ReportStatusBadge({ status }) {
  const normalizedStatus = status || "UNKNOWN";
  const Icon =
    normalizedStatus === "RESOLVED"
      ? CheckCircle2
      : normalizedStatus === "DISMISSED"
        ? XCircle
        : normalizedStatus === "IN_REVIEW"
          ? Clock3
          : AlertTriangle;

  return (
    <span
      className={`elite-admin-reports__badge elite-admin-reports__badge--status-${normalizedStatus}`}
    >
      <Icon size={14} aria-hidden="true" />
      {formatEnum(normalizedStatus)}
    </span>
  );
}

/**
 * Target type badge keeps report metadata visually separate from workflow
 * status.
 */
function TargetBadge({ targetType }) {
  const normalizedTarget = targetType || "UNKNOWN";

  return (
    <span
      className={`elite-admin-reports__badge elite-admin-reports__badge--target-${normalizedTarget}`}
    >
      {renderTargetIcon(normalizedTarget)}
      {formatEnum(normalizedTarget)}
    </span>
  );
}

/**
 * Compact metadata badge for report reasons. Reasons are not severity scores,
 * so the visual treatment stays neutral and text-led.
 */
function ReasonBadge({ reason }) {
  return (
    <span className="elite-admin-reports__badge elite-admin-reports__badge--reason">
      <Flag size={14} aria-hidden="true" />
      {formatEnum(reason)}
    </span>
  );
}

/**
 * Desktop moderation queue row. It surfaces only the investigation fields an
 * Admin needs to scan quickly; the full report remains available in the drawer.
 */
function ReportQueueRow({ onInspect, report }) {
  const targetLabel = getTargetLabel(report);
  const closed = report.status === "RESOLVED" || report.status === "DISMISSED";

  return (
    <article
      className={`elite-admin-reports__row${closed ? " is-closed" : ""}`}
      role="listitem"
    >
      <div className="elite-admin-reports__reference">
        <span>Reference</span>
        <strong>{getReportReference(report)}</strong>
        <small>Created {formatDate(report.createdAt)}</small>
      </div>

      <div className="elite-admin-reports__target">
        <TargetBadge targetType={report.targetType} />
        <strong title={targetLabel}>{truncateText(targetLabel, 82)}</strong>
        <small title={report.description || ""}>
          {truncateText(report.description, 96)}
        </small>
      </div>

      <div className="elite-admin-reports__reason">
        <span>Reason</span>
        <ReasonBadge reason={report.reason} />
      </div>

      <div className="elite-admin-reports__reporter">
        <span>Reporter</span>
        <strong>{report.reporterName || "Reporter not recorded"}</strong>
        <small>{report.reporterEmail || "Email not recorded"}</small>
      </div>

      <div className="elite-admin-reports__state">
        <span>Status</span>
        <ReportStatusBadge status={report.status} />
      </div>

      <div className="elite-admin-reports__actions">
        <button onClick={() => onInspect(report)} type="button">
          <Eye size={16} aria-hidden="true" />
          Inspect
        </button>
      </div>
    </article>
  );
}

/**
 * Mobile report card keeps the same genuine data hierarchy without forcing a
 * dense desktop ledger into narrow viewports.
 */
function ReportMobileCard({ onInspect, report }) {
  const targetLabel = getTargetLabel(report);
  const closed = report.status === "RESOLVED" || report.status === "DISMISSED";

  return (
    <article
      className={`elite-admin-reports__mobile-card${closed ? " is-closed" : ""}`}
    >
      <div className="elite-admin-reports__mobile-topline">
        <strong>{getReportReference(report)}</strong>
        <ReportStatusBadge status={report.status} />
      </div>
      <div className="elite-admin-reports__mobile-badges">
        <TargetBadge targetType={report.targetType} />
        <ReasonBadge reason={report.reason} />
      </div>
      <h3 title={targetLabel}>{truncateText(targetLabel, 86)}</h3>
      <p title={report.description || ""}>{truncateText(report.description, 124)}</p>
      <dl>
        <div>
          <dt>Reporter</dt>
          <dd>{report.reporterName || "Not recorded"}</dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>{formatDate(report.createdAt)}</dd>
        </div>
      </dl>
      <button onClick={() => onInspect(report)} type="button">
        <Eye size={16} aria-hidden="true" />
        Inspect report
      </button>
    </article>
  );
}

/**
 * Reusable detail field that handles missing backend values truthfully.
 */
function DetailItem({ icon: Icon, label, value }) {
  const hasValue = value !== null && value !== undefined && value !== "";

  return (
    <div className="elite-admin-reports__detail-item">
      {Icon && <Icon size={17} aria-hidden="true" />}
      <span>{label}</span>
      <strong>{hasValue ? value : "Not provided"}</strong>
    </div>
  );
}

/**
 * Builds the target-specific detail fields allowed by the report DTO. This is
 * where review moderation deliberately stays report-based because there is no
 * standalone Admin review endpoint.
 */
function getRelatedTargetFields(report) {
  if (report?.targetType === "USER") {
    return [
      { label: "Reported user ID", value: report.reportedUserId, icon: UserRound },
      { label: "Reported user", value: report.reportedUserName },
      { label: "Reported user email", value: report.reportedUserEmail, icon: Mail },
    ];
  }

  if (report?.targetType === "PROPERTY") {
    return [
      {
        label: "Reported property ID",
        value: report.reportedPropertyId,
        icon: Building2,
      },
      { label: "Property title", value: report.reportedPropertyTitle },
    ];
  }

  if (report?.targetType === "REVIEW") {
    return [
      {
        label: "Reported review ID",
        value: report.reportedReviewId,
        icon: MessageSquareText,
      },
      { label: "Reported review comment", value: report.reportedReviewComment },
    ];
  }

  if (report?.targetType === "BOOKING") {
    return [
      {
        label: "Reported booking ID",
        value: report.reportedBookingId,
        icon: CalendarClock,
      },
    ];
  }

  return [];
}

/**
 * Viewport-safe drawer for one moderation report. It separates report workflow
 * status from target moderation actions so Admin does not confuse the two
 * backend operations.
 */
function ReportDetailDrawer({
  error,
  loading,
  onClose,
  onModerationRequest,
  onRetry,
  onStatusRequest,
  report,
}) {
  if (!report) return null;

  const statusTargets = getStatusTargets(report);
  const moderationActions = getModerationActions(report);
  const relatedTargetFields = getRelatedTargetFields(report);

  return (
    <div className="elite-admin-reports__drawer-overlay" role="presentation">
      <aside
        aria-labelledby="admin-report-detail-title"
        aria-modal="true"
        className="elite-admin-reports__drawer"
        role="dialog"
      >
        <button
          aria-label="Close report detail"
          className="elite-admin-reports__drawer-close"
          onClick={onClose}
          type="button"
        >
          <X size={19} aria-hidden="true" />
        </button>

        <header className="elite-admin-reports__drawer-header">
          <span>Investigation file</span>
          <h3 id="admin-report-detail-title">{getReportReference(report)}</h3>
          <p>
            Review the genuine report context, update the report workflow, or
            take one backend-supported moderation action against the target.
          </p>
          <div className="elite-admin-reports__drawer-badges">
            <ReportStatusBadge status={report.status} />
            <TargetBadge targetType={report.targetType} />
          </div>
        </header>

        {loading && (
          <div className="elite-admin-reports__drawer-loading" role="status">
            Loading report detail...
          </div>
        )}

        {error && (
          <div className="elite-admin-reports__drawer-error" role="alert">
            <AlertTriangle size={18} aria-hidden="true" />
            <div>
              <strong>Detail could not be refreshed.</strong>
              <p>{error}</p>
              <button onClick={() => onRetry(report)} type="button">
                Retry detail
              </button>
            </div>
          </div>
        )}

        {!loading && (
          <>
            <section
              aria-label="Report information"
              className="elite-admin-reports__detail-section"
            >
              <span>Report</span>
              <div className="elite-admin-reports__detail-grid">
                <DetailItem label="Report ID" value={report.id} icon={FileSearch} />
                <DetailItem label="Reason" value={formatEnum(report.reason)} icon={Flag} />
                <DetailItem label="Status" value={formatEnum(report.status)} />
                <DetailItem
                  label="Created"
                  value={formatDate(report.createdAt)}
                  icon={Clock3}
                />
                <DetailItem label="Updated" value={formatDate(report.updatedAt)} />
                <DetailItem label="Resolved" value={formatDate(report.resolvedAt)} />
              </div>
              <div className="elite-admin-reports__long-field">
                <span>Description</span>
                <p>{report.description || "No description was provided."}</p>
              </div>
            </section>

            <section
              aria-label="Reporter information"
              className="elite-admin-reports__detail-section"
            >
              <span>Reporter</span>
              <div className="elite-admin-reports__detail-grid">
                <DetailItem label="Reporter ID" value={report.reporterId} icon={UserRound} />
                <DetailItem label="Reporter name" value={report.reporterName} />
                <DetailItem label="Reporter email" value={report.reporterEmail} icon={Mail} />
              </div>
            </section>

            <section
              aria-label="Reported target"
              className="elite-admin-reports__detail-section"
            >
              <span>Target</span>
              <div className="elite-admin-reports__target-summary">
                {renderTargetIcon(report.targetType, 24)}
                <div>
                  <strong>{getTargetLabel(report)}</strong>
                  <small>
                    {formatEnum(report.targetType)} target
                    {report.targetId ? ` · ID ${report.targetId}` : ""}
                  </small>
                </div>
              </div>
              <div className="elite-admin-reports__detail-grid">
                <DetailItem label="Target type" value={formatEnum(report.targetType)} />
                <DetailItem label="Target ID" value={report.targetId} icon={Tag} />
                <DetailItem label="Target summary" value={report.targetSummary} />
              </div>
            </section>

            {relatedTargetFields.length > 0 && (
              <section
                aria-label={`${formatEnum(report.targetType)} report context`}
                className="elite-admin-reports__detail-section"
              >
                <span>{formatEnum(report.targetType)} context</span>
                <div className="elite-admin-reports__detail-grid">
                  {relatedTargetFields.map((field) => (
                    <DetailItem
                      icon={field.icon}
                      key={field.label}
                      label={field.label}
                      value={field.value}
                    />
                  ))}
                </div>
              </section>
            )}

            <section
              aria-label="Admin note"
              className="elite-admin-reports__detail-section"
            >
              <span>Admin note</span>
              <div className="elite-admin-reports__long-field">
                <p>{report.adminNote || "No Admin note has been recorded."}</p>
              </div>
            </section>

            <section className="elite-admin-reports__control-panel">
              <span>Report workflow</span>
              <p>
                Workflow status tracks the investigation state only. It does
                not suspend, restore, hide, or otherwise moderate the target.
              </p>
              {statusTargets.length > 0 && (
                <button onClick={() => onStatusRequest(report)} type="button">
                  <SlidersHorizontal size={16} aria-hidden="true" />
                  Change report status
                </button>
              )}
            </section>

            <section className="elite-admin-reports__control-panel">
              <span>Target moderation</span>
              <p>
                Moderation actions are limited to the reported target type and
                are confirmed by the backend before the queue is synchronized.
              </p>
              <div className="elite-admin-reports__moderation-actions">
                {moderationActions.map((action) => {
                  return (
                    <button
                      className={`elite-admin-reports__moderation-action elite-admin-reports__moderation-action--${action}`}
                      key={action}
                      onClick={() => onModerationRequest(report, action)}
                      type="button"
                    >
                      {renderModerationActionIcon(action)}
                      {formatEnum(action)}
                    </button>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </aside>
    </div>
  );
}

/**
 * Confirmation modal for report workflow status changes. It sends only the
 * status/adminNote payload supported by PATCH /admin/reports/{id}/status.
 */
function StatusMutationModal({
  adminNote,
  error,
  loading,
  onCancel,
  onConfirm,
  onNoteChange,
  onTargetChange,
  request,
  targetStatus,
}) {
  if (!request) return null;

  const targetOptions = getStatusTargets(request.report);

  return (
    <div className="elite-admin-reports__confirm-overlay" role="presentation">
      <section
        aria-labelledby="admin-report-status-title"
        aria-modal="true"
        className="elite-admin-reports__confirm"
        role="dialog"
      >
        <span className="elite-admin-reports__confirm-icon" aria-hidden="true">
          <SlidersHorizontal size={23} />
        </span>
        <h3 id="admin-report-status-title">Change report status?</h3>
        <p>
          {getReportReference(request.report)} is currently{" "}
          {formatEnum(request.report?.status)}. This updates the report
          workflow only; target moderation actions are handled separately.
        </p>

        <label>
          <span>Target status</span>
          <select
            onChange={(event) => onTargetChange(event.target.value)}
            value={targetStatus}
          >
            {targetOptions.map((status) => (
              <option key={status} value={status}>
                {formatEnum(status)}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Admin note (optional)</span>
          <textarea
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder="Add internal context for this workflow change"
            rows={4}
            value={adminNote}
          />
        </label>

        {error && (
          <div className="elite-admin-reports__confirm-error" role="alert">
            <AlertTriangle size={16} aria-hidden="true" />
            {error}
          </div>
        )}

        <div className="elite-admin-reports__confirm-actions">
          <button disabled={loading} onClick={onCancel} type="button">
            Keep current status
          </button>
          <button
            disabled={loading || targetOptions.length === 0}
            onClick={onConfirm}
            type="button"
          >
            {loading ? "Submitting..." : "Confirm status change"}
          </button>
        </div>
      </section>
    </div>
  );
}

/**
 * Confirmation modal for backend-supported moderation actions. Destructive
 * actions require a frontend note for operator clarity, but backend validation
 * remains authoritative.
 */
function ModerationActionModal({
  adminNote,
  error,
  loading,
  onCancel,
  onConfirm,
  onNoteChange,
  request,
}) {
  if (!request) return null;

  const noteRequired = requiresAdminNote(request.action);
  const destructive = restrictiveModerationActions.includes(request.action);
  const restorative =
    request.action.startsWith("REACTIVATE") || request.action.startsWith("RESTORE");
  const Icon = destructive ? Ban : restorative ? Undo2 : Gavel;

  return (
    <div className="elite-admin-reports__confirm-overlay" role="presentation">
      <section
        aria-labelledby="admin-report-moderation-title"
        aria-modal="true"
        className="elite-admin-reports__confirm"
        role="dialog"
      >
        <span
          className={`elite-admin-reports__confirm-icon${
            destructive ? " is-destructive" : ""
          }`}
          aria-hidden="true"
        >
          <Icon size={23} />
        </span>
        <h3 id="admin-report-moderation-title">
          Confirm {formatEnum(request.action)}
        </h3>
        <p>
          This action applies to {getTargetLabel(request.report)} through{" "}
          {getReportReference(request.report)}. The backend remains
          authoritative for the final moderation result.
        </p>

        <label>
          <span>{noteRequired ? "Admin note" : "Admin note (optional)"}</span>
          <textarea
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder={
              noteRequired
                ? "Add clear context before taking this restrictive action"
                : "Optional internal context for this moderation action"
            }
            rows={4}
            value={adminNote}
          />
        </label>

        {noteRequired && (
          <p className="elite-admin-reports__confirm-hint">
            This note requirement is a frontend safety guard for destructive
            moderation actions.
          </p>
        )}

        {error && (
          <div className="elite-admin-reports__confirm-error" role="alert">
            <AlertTriangle size={16} aria-hidden="true" />
            {error}
          </div>
        )}

        <div className="elite-admin-reports__confirm-actions">
          <button disabled={loading} onClick={onCancel} type="button">
            Keep report unchanged
          </button>
          <button
            className={
              destructive
                ? "is-destructive"
                : restorative
                  ? "is-restorative"
                  : "is-dismiss"
            }
            disabled={loading}
            onClick={onConfirm}
            type="button"
          >
            {loading ? "Submitting..." : `Confirm ${formatEnum(request.action)}`}
          </button>
        </div>
      </section>
    </div>
  );
}

/**
 * Phase 9 Admin Reports workspace.
 * It connects the trust-and-safety moderation queue to the finalized Admin
 * report endpoints without introducing fake severity, standalone review APIs,
 * or unsupported target actions.
 */
export default function Reports() {
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [detailState, setDetailState] = useState({
    error: "",
    loading: false,
    open: false,
    report: null,
  });
  const [filterError, setFilterError] = useState("");
  const [moderationNote, setModerationNote] = useState("");
  const [moderationRequest, setModerationRequest] = useState(null);
  const [mutationState, setMutationState] = useState({
    error: "",
    loading: false,
    success: "",
  });
  const [pendingFilters, setPendingFilters] = useState(emptyFilters);
  const [reloadToken, setReloadToken] = useState(0);
  const [reportState, setReportState] = useState(initialReportState);
  const [statusNote, setStatusNote] = useState("");
  const [statusRequest, setStatusRequest] = useState(null);
  const [targetStatus, setTargetStatus] = useState("IN_REVIEW");

  const hasActiveFilters = useMemo(
    () => Object.values(appliedFilters).some((value) => String(value).trim()),
    [appliedFilters]
  );
  const totalLabel = reportState.loading
    ? "Loading reports"
    : `${reportState.reports.length} ${
        reportState.reports.length === 1 ? "report" : "reports"
      }${hasActiveFilters ? " matching filters" : ""}`;

  useBodyScrollLock(
    detailState.open || Boolean(statusRequest) || Boolean(moderationRequest)
  );

  useEffect(() => {
    let active = true;

    /**
     * Loads the moderation queue with only backend-supported query parameters.
     */
    async function loadReports() {
      try {
        const response = await adminService.getReports(
          buildReportQuery(appliedFilters)
        );

        if (!active) return;

        setReportState({
          error: "",
          loading: false,
          reports: normalizeReportList(response.data),
        });
      } catch (error) {
        if (!active) return;

        setReportState({
          error: getErrorMessage(error, "Unable to load Admin reports."),
          loading: false,
          reports: [],
        });
      }
    }

    loadReports();

    return () => {
      active = false;
    };
  }, [appliedFilters, reloadToken]);

  /**
   * Applies filters explicitly after lightweight ID validation so operators do
   * not trigger a backend request on every search keystroke.
   */
  const handleFilterSubmit = (event) => {
    event.preventDefault();

    const invalidIds = getInvalidIdFilters(pendingFilters);

    if (invalidIds.length) {
      setFilterError(`${invalidIds.join(", ")} must be numeric.`);
      return;
    }

    setFilterError("");
    setMutationState({ error: "", loading: false, success: "" });
    setReportState((current) => ({ ...current, error: "", loading: true }));
    setAppliedFilters({ ...pendingFilters });
  };

  /**
   * Keeps toolbar input local until the Admin explicitly applies the filters.
   */
  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setPendingFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /**
   * Clears both visible filter inputs and the active backend query.
   */
  const handleClearFilters = () => {
    setPendingFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setFilterError("");
    setMutationState({ error: "", loading: false, success: "" });
    setReportState((current) => ({ ...current, error: "", loading: true }));
  };

  /**
   * Retries the current report query without changing applied filters.
   */
  const handleRetry = () => {
    setFilterError("");
    setMutationState({ error: "", loading: false, success: "" });
    setReportState((current) => ({ ...current, error: "", loading: true }));
    setReloadToken((current) => current + 1);
  };

  /**
   * Opens the drawer with queue data immediately, then hydrates it from the
   * authoritative report detail endpoint.
   */
  const handleOpenDetail = async (report) => {
    setDetailState({
      error: "",
      loading: true,
      open: true,
      report,
    });

    try {
      const response = await adminService.getReportById(report.id);
      const detailReport = normalizeReportRecord(response.data);

      setDetailState({
        error: "",
        loading: false,
        open: true,
        report: detailReport || report,
      });
    } catch (error) {
      setDetailState({
        error: getErrorMessage(error, "Unable to load this report record."),
        loading: false,
        open: true,
        report,
      });
    }
  };

  const handleCloseDetail = () => {
    setDetailState({
      error: "",
      loading: false,
      open: false,
      report: null,
    });
  };

  /**
   * Re-fetches the open drawer after a detail load failure or post-mutation
   * synchronization request.
   */
  const handleDetailRetry = async (report) => {
    if (!report?.id) return;
    await handleOpenDetail(report);
  };

  /**
   * Starts a workflow-status change while keeping moderation actions separate.
   */
  const handleStatusRequest = (report) => {
    const targetOptions = getStatusTargets(report);

    if (targetOptions.length === 0) return;

    setStatusNote(report?.adminNote || "");
    setTargetStatus(targetOptions[0]);
    setMutationState({ error: "", loading: false, success: "" });
    setStatusRequest({ report });
  };

  /**
   * Starts a target-aware moderation action. The action has already been
   * filtered by target type before this handler receives it.
   */
  const handleModerationRequest = (report, action) => {
    setModerationNote(report?.adminNote || "");
    setMutationState({ error: "", loading: false, success: "" });
    setModerationRequest({ action, report });
  };

  /**
   * Cancels whichever confirmation flow is currently open.
   */
  const handleCancelMutation = () => {
    if (mutationState.loading) return;

    setStatusRequest(null);
    setModerationRequest(null);
    setStatusNote("");
    setModerationNote("");
    setMutationState({ error: "", loading: false, success: "" });
  };

  /**
   * Applies report workflow status via PATCH /admin/reports/{id}/status and
   * synchronizes the queue only after the backend confirms the change.
   */
  const handleConfirmStatusChange = async () => {
    if (!statusRequest?.report?.id || !targetStatus) return;

    setMutationState({ error: "", loading: true, success: "" });

    try {
      const payload = {
        adminNote: statusNote.trim(),
        status: targetStatus,
      };
      const response = await adminService.updateReportStatus(
        statusRequest.report.id,
        payload
      );
      const updatedReport =
        normalizeReportRecord(response.data) ||
        {
          ...statusRequest.report,
          ...payload,
        };

      setReportState((current) => ({
        ...current,
        reports: mergeUpdatedReport(current.reports, updatedReport),
      }));
      setDetailState((current) =>
        current.report?.id && String(current.report.id) === String(updatedReport.id)
          ? { ...current, report: { ...current.report, ...updatedReport } }
          : current
      );
      setMutationState({
        error: "",
        loading: false,
        success: `${getReportReference(updatedReport)} moved to ${formatEnum(
          updatedReport.status
        )}.`,
      });
      setStatusRequest(null);
      setStatusNote("");
      setReloadToken((current) => current + 1);
    } catch (error) {
      setMutationState({
        error: getErrorMessage(error, "Unable to update this report status."),
        loading: false,
        success: "",
      });
    }
  };

  /**
   * Applies target moderation through POST /admin/reports/{id}/moderate. The UI
   * never pretends target state changed before the backend responds.
   */
  const handleConfirmModeration = async () => {
    if (!moderationRequest?.report?.id || !moderationRequest.action) return;

    const trimmedNote = moderationNote.trim();

    if (requiresAdminNote(moderationRequest.action) && trimmedNote.length < 3) {
      setMutationState({
        error: "Add a meaningful Admin note before this restrictive action.",
        loading: false,
        success: "",
      });
      return;
    }

    setMutationState({ error: "", loading: true, success: "" });

    try {
      const payload = {
        action: moderationRequest.action,
        adminNote: trimmedNote,
      };
      const response = await adminService.moderateReport(
        moderationRequest.report.id,
        payload
      );
      const updatedReport =
        normalizeReportRecord(response.data) ||
        {
          ...moderationRequest.report,
          adminNote: payload.adminNote,
        };

      setReportState((current) => ({
        ...current,
        reports: mergeUpdatedReport(current.reports, updatedReport),
      }));
      setDetailState((current) =>
        current.report?.id && String(current.report.id) === String(updatedReport.id)
          ? { ...current, report: { ...current.report, ...updatedReport } }
          : current
      );
      setMutationState({
        error: "",
        loading: false,
        success: `${formatEnum(payload.action)} submitted for ${getReportReference(
          updatedReport
        )}.`,
      });
      setModerationRequest(null);
      setModerationNote("");
      setReloadToken((current) => current + 1);
    } catch (error) {
      setMutationState({
        error: getErrorMessage(error, "Unable to submit this moderation action."),
        loading: false,
        success: "",
      });
    }
  };

  return (
    <main className="elite-admin-reports" aria-labelledby="admin-reports-title">
      <header className="elite-admin-reports__header">
        <div>
          <span>TRUST &amp; SAFETY</span>
          <h2 id="admin-reports-title">Reports</h2>
          <p>
            Review member-submitted concerns, investigate reported platform
            activity, and take only the moderation actions supported by the
            EliteBNB Admin backend.
          </p>
        </div>
        <aside aria-label="Loaded report count">
          <ShieldAlert size={22} aria-hidden="true" />
          <strong>{totalLabel}</strong>
          <small>Moderation records returned by the current query</small>
        </aside>
      </header>

      <form
        className="elite-admin-reports__filters"
        onSubmit={handleFilterSubmit}
      >
        <div className="elite-admin-reports__filter-row elite-admin-reports__filter-row--primary">
          <label className="elite-admin-reports__search-field">
            <span>Search reports</span>
            <Search size={17} aria-hidden="true" />
            <input
              name="search"
              onChange={handleFilterChange}
              placeholder="Reporter, target, reason, or report context"
              type="search"
              value={pendingFilters.search}
            />
          </label>

          <label className="elite-admin-reports__select-field">
            <span>Status</span>
            <select
              name="status"
              onChange={handleFilterChange}
              value={pendingFilters.status}
            >
              <option value="">All statuses</option>
              {reportStatuses.map((status) => (
                <option key={status} value={status}>
                  {formatEnum(status)}
                </option>
              ))}
            </select>
          </label>

          <label className="elite-admin-reports__select-field">
            <span>Target type</span>
            <select
              name="targetType"
              onChange={handleFilterChange}
              value={pendingFilters.targetType}
            >
              <option value="">All targets</option>
              {reportTargetTypes.map((targetType) => (
                <option key={targetType} value={targetType}>
                  {formatEnum(targetType)}
                </option>
              ))}
            </select>
          </label>

          <div className="elite-admin-reports__filter-actions">
            <button type="submit">
              <SlidersHorizontal size={16} aria-hidden="true" />
              Apply filters
            </button>
            {hasActiveFilters && (
              <button onClick={handleClearFilters} type="button">
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="elite-admin-reports__filter-row elite-admin-reports__filter-row--secondary">
          <label className="elite-admin-reports__select-field">
            <span>Reason</span>
            <select
              name="reason"
              onChange={handleFilterChange}
              value={pendingFilters.reason}
            >
              <option value="">All reasons</option>
              {reportReasons.map((reason) => (
                <option key={reason} value={reason}>
                  {formatEnum(reason)}
                </option>
              ))}
            </select>
          </label>

          <label className="elite-admin-reports__input-field">
            <span>Reporter ID</span>
            <input
              inputMode="numeric"
              name="reporterId"
              onChange={handleFilterChange}
              placeholder="Optional"
              value={pendingFilters.reporterId}
            />
          </label>
        </div>

        {filterError && (
          <div className="elite-admin-reports__filter-error" role="alert">
            <AlertTriangle size={16} aria-hidden="true" />
            {filterError}
          </div>
        )}
      </form>

      {mutationState.success && !statusRequest && !moderationRequest && (
        <div className="elite-admin-reports__feedback" role="status">
          <CheckCircle2 size={17} aria-hidden="true" />
          {mutationState.success}
        </div>
      )}

      <section
        aria-label="Admin moderation queue"
        className="elite-admin-reports__ledger"
      >
        <div className="elite-admin-reports__ledger-heading">
          <div>
            <span>Moderation queue</span>
            <h3>Investigate reported activity</h3>
          </div>
          <button onClick={handleRetry} type="button">
            <RefreshCw size={16} aria-hidden="true" />
            Refresh
          </button>
        </div>

        {reportState.loading && (
          <div className="elite-admin-reports__skeleton-list" role="status">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                className="elite-admin-reports__skeleton-row"
                key={`report-skeleton-${index}`}
              />
            ))}
            <span className="sr-only">Loading Admin reports</span>
          </div>
        )}

        {!reportState.loading && reportState.error && (
          <div className="elite-admin-reports__empty-state" role="alert">
            <AlertTriangle size={24} aria-hidden="true" />
            <h3>Reports could not be loaded</h3>
            <p>{reportState.error}</p>
            <button onClick={handleRetry} type="button">
              Retry reports
            </button>
          </div>
        )}

        {!reportState.loading &&
          !reportState.error &&
          reportState.reports.length === 0 && (
            <div className="elite-admin-reports__empty-state">
              <FileSearch size={24} aria-hidden="true" />
              <h3>{hasActiveFilters ? "No matching reports" : "No reports yet"}</h3>
              <p>
                {hasActiveFilters
                  ? "No moderation reports match the current backend-supported filters."
                  : "There are no member-submitted moderation reports in the current response."}
              </p>
              {hasActiveFilters && (
                <button onClick={handleClearFilters} type="button">
                  Clear filters
                </button>
              )}
            </div>
          )}

        {!reportState.loading &&
          !reportState.error &&
          reportState.reports.length > 0 && (
            <>
              <div className="elite-admin-reports__table" role="list">
                {reportState.reports.map((report) => (
                  <ReportQueueRow
                    key={report.id}
                    onInspect={handleOpenDetail}
                    report={report}
                  />
                ))}
              </div>

              <div className="elite-admin-reports__mobile-list">
                {reportState.reports.map((report) => (
                  <ReportMobileCard
                    key={report.id}
                    onInspect={handleOpenDetail}
                    report={report}
                  />
                ))}
              </div>
            </>
          )}
      </section>

      <ReportDetailDrawer
        error={detailState.error}
        loading={detailState.loading}
        onClose={handleCloseDetail}
        onModerationRequest={handleModerationRequest}
        onRetry={handleDetailRetry}
        onStatusRequest={handleStatusRequest}
        report={detailState.open ? detailState.report : null}
      />

      <StatusMutationModal
        adminNote={statusNote}
        error={statusRequest ? mutationState.error : ""}
        loading={mutationState.loading}
        onCancel={handleCancelMutation}
        onConfirm={handleConfirmStatusChange}
        onNoteChange={setStatusNote}
        onTargetChange={setTargetStatus}
        request={statusRequest}
        targetStatus={targetStatus}
      />

      <ModerationActionModal
        adminNote={moderationNote}
        error={moderationRequest ? mutationState.error : ""}
        loading={mutationState.loading}
        onCancel={handleCancelMutation}
        onConfirm={handleConfirmModeration}
        onNoteChange={setModerationNote}
        request={moderationRequest}
      />
    </main>
  );
}
