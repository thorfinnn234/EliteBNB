import {
  AlertTriangle,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Eye,
  FileText,
  Mail,
  MessageCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { adminService } from "../../services/adminService";
import { supportMessagingService } from "../../services/supportMessagingService";
import {
  getSupportConversationId,
  normalizeSupportConversationPayload,
} from "../../utils/supportMessagingMappers";
import "./Hosts.css";

const emptyFilters = {
  hostId: "",
  search: "",
  status: "",
};

const initialVerificationState = {
  error: "",
  loading: true,
  pendingCount: null,
  records: [],
};

/**
 * Sends only backend-supported host-verification filters.
 * There is no pagination or ordering contract for this endpoint, so the page
 * keeps those controls out of the UI instead of inventing client assumptions.
 */
function buildVerificationQuery(filters) {
  return Object.entries(filters).reduce((query, [key, value]) => {
    const trimmedValue = String(value || "").trim();

    if (trimmedValue) {
      query[key] = trimmedValue;
    }

    return query;
  }, {});
}

/**
 * Accepts the finalized array response while tolerating a conventional wrapper
 * if the backend later nests records under a collection key.
 */
function normalizeVerificationList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.hostVerifications)) return payload.hostVerifications;
  if (Array.isArray(payload?.verifications)) return payload.verifications;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;

  return [];
}

/**
 * Normalizes the detail response from GET /admin/host-verifications/{id}.
 * The UI never manufactures missing verification fields; it only formats this DTO.
 */
function normalizeVerificationRecord(payload) {
  if (!payload) return null;
  if (payload.hostVerification) return payload.hostVerification;
  if (payload.verification) return payload.verification;
  if (payload.data && !Array.isArray(payload.data)) return payload.data;

  return payload;
}

/**
 * Pulls an operator-safe error message from Axios/backend failures.
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
 * Presents the strongest real identity value available for the applicant.
 * No profile images are invented because HostVerificationResponse has none.
 */
function getHostDisplayName(record) {
  return (
    record?.hostName ||
    record?.legalName ||
    record?.businessName ||
    record?.hostEmail ||
    "Unnamed host"
  );
}

/**
 * Creates a refined initials mark from genuine host-verification fields.
 */
function getHostInitials(record) {
  const source = getHostDisplayName(record);
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

/**
 * Formats backend timestamps for review context while avoiding false precision
 * when a date is missing or invalid.
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
 * Safely detects image-like verification documents by URL/extension only.
 * Non-image documents get an open-document card instead of a fabricated preview.
 */
function isImageDocument(documentUrl) {
  if (!documentUrl) return false;
  if (/^data:image\//i.test(documentUrl)) return true;

  const cleanUrl = String(documentUrl).split("?")[0].toLowerCase();

  return /\.(avif|gif|jpe?g|png|webp|bmp)$/i.test(cleanUrl);
}

/**
 * Keeps document links limited to browser-openable HTTP(S), relative, or image
 * data URLs. Unsupported strings are displayed as unavailable instead.
 */
function getDocumentHref(documentUrl) {
  if (!documentUrl) return "";
  if (/^(https?:\/\/|\/|data:image\/)/i.test(documentUrl)) return documentUrl;

  return "";
}

/**
 * Partitions pending cases to the top without adding an unsupported ordering
 * control. This preserves trust-queue priority while keeping backend data and
 * filters untouched.
 */
function prioritizePendingRecords(records) {
  const pending = records.filter((record) => record.status === "PENDING");
  const reviewed = records.filter((record) => record.status !== "PENDING");

  return [...pending, ...reviewed];
}

/**
 * Replaces one verification record after a successful backend mutation or
 * detail refresh so the open drawer and queue stay synchronized.
 */
function mergeUpdatedVerification(records, updatedRecord) {
  if (!updatedRecord?.id) return records;

  return records.map((record) =>
    String(record.id) === String(updatedRecord.id)
      ? { ...record, ...updatedRecord }
      : record
  );
}

/**
 * Visual badge for PENDING, VERIFIED, and REJECTED states.
 * Text is always shown so the meaning is not color-only.
 */
function VerificationStatusBadge({ status }) {
  const normalizedStatus = status || "UNKNOWN";
  const Icon =
    normalizedStatus === "VERIFIED"
      ? CheckCircle2
      : normalizedStatus === "REJECTED"
        ? XCircle
        : Clock3;

  return (
    <span
      className={`elite-admin-hosts__status elite-admin-hosts__status--${normalizedStatus}`}
    >
      <Icon size={14} aria-hidden="true" />
      {normalizedStatus}
    </span>
  );
}

/**
 * Shared initials avatar for applicant rows and detail drawers.
 */
function HostIdentityMark({ record, size = "default" }) {
  return (
    <span className={`elite-admin-hosts__avatar elite-admin-hosts__avatar--${size}`}>
      {getHostInitials(record)}
    </span>
  );
}

/**
 * Shows one desktop verification row. Reviewed cases remain inspectable, while
 * direct Verify/Reject controls are available only for PENDING records.
 */
function VerificationTableRow({
  onInspect,
  onReviewRequest,
  record,
}) {
  const submittedDate = formatDate(record?.createdAt);

  return (
    <tr>
      <td>
        <div className="elite-admin-hosts__identity">
          <HostIdentityMark record={record} />
          <span>
            <strong>{getHostDisplayName(record)}</strong>
            <small>{record?.hostEmail || "No host email"}</small>
          </span>
        </div>
      </td>
      <td>
        <div className="elite-admin-hosts__business">
          <span>{record?.legalName || "Legal name not provided"}</span>
          <small>{record?.businessName || "No business name"}</small>
        </div>
      </td>
      <td>
        <span className="elite-admin-hosts__document-type">
          <FileText size={15} aria-hidden="true" />
          {record?.documentType || "Document"}
        </span>
      </td>
      <td>
        <VerificationStatusBadge status={record?.status} />
      </td>
      <td>{submittedDate}</td>
      <td>
        <div className="elite-admin-hosts__actions">
          <button type="button" onClick={() => onInspect(record)}>
            <Eye size={16} aria-hidden="true" />
            Inspect
          </button>
          {record?.status === "PENDING" && (
            <>
              <button
                className="elite-admin-hosts__review-button elite-admin-hosts__review-button--verify"
                onClick={() => onReviewRequest(record, "VERIFIED")}
                type="button"
              >
                Verify
              </button>
              <button
                className="elite-admin-hosts__review-button elite-admin-hosts__review-button--reject"
                onClick={() => onReviewRequest(record, "REJECTED")}
                type="button"
              >
                Reject
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

/**
 * Mobile verification card keeps the same genuine data and review controls
 * without forcing a wide operational table into a narrow viewport.
 */
function VerificationMobileCard({
  onInspect,
  onReviewRequest,
  record,
}) {
  return (
    <article className="elite-admin-hosts__mobile-card">
      <div className="elite-admin-hosts__mobile-card-header">
        <div className="elite-admin-hosts__identity">
          <HostIdentityMark record={record} />
          <span>
            <strong>{getHostDisplayName(record)}</strong>
            <small>{record?.hostEmail || "No host email"}</small>
          </span>
        </div>
        <VerificationStatusBadge status={record?.status} />
      </div>

      <div className="elite-admin-hosts__mobile-card-body">
        <span>{record?.legalName || "Legal name not provided"}</span>
        <span>{record?.businessName || "No business name"}</span>
        <span>{record?.documentType || "Document"}</span>
        <span>Submitted {formatDate(record?.createdAt)}</span>
      </div>

      <div className="elite-admin-hosts__actions">
        <button type="button" onClick={() => onInspect(record)}>
          <Eye size={16} aria-hidden="true" />
          Inspect
        </button>
        {record?.status === "PENDING" && (
          <>
            <button
              className="elite-admin-hosts__review-button elite-admin-hosts__review-button--verify"
              onClick={() => onReviewRequest(record, "VERIFIED")}
              type="button"
            >
              Verify
            </button>
            <button
              className="elite-admin-hosts__review-button elite-admin-hosts__review-button--reject"
              onClick={() => onReviewRequest(record, "REJECTED")}
              type="button"
            >
              Reject
            </button>
          </>
        )}
      </div>
    </article>
  );
}

/**
 * Document card previews genuine images and gracefully falls back to a safe
 * open-document action for PDFs or other non-image submissions.
 */
function VerificationDocument({
  onPreviewImage,
  record,
}) {
  const documentHref = getDocumentHref(record?.documentUrl);
  const imagePreviewable = isImageDocument(record?.documentUrl);
  const documentLabel = `${record?.documentType || "Verification document"} for ${getHostDisplayName(record)}`;

  if (!documentHref) {
    return (
      <div className="elite-admin-hosts__document-card">
        <FileText size={24} aria-hidden="true" />
        <h4>Document unavailable</h4>
        <p>The backend did not return a browser-openable document URL.</p>
      </div>
    );
  }

  if (imagePreviewable) {
    return (
      <div className="elite-admin-hosts__document-preview">
        <button
          aria-label={`Open larger preview for ${documentLabel}`}
          onClick={() =>
            onPreviewImage({
              alt: documentLabel,
              url: record.documentUrl,
            })
          }
          type="button"
        >
          <img src={record.documentUrl} alt={documentLabel} />
        </button>
        <a href={documentHref} target="_blank" rel="noreferrer noopener">
          <ExternalLink size={15} aria-hidden="true" />
          Open source document
        </a>
      </div>
    );
  }

  return (
    <div className="elite-admin-hosts__document-card">
      <FileText size={24} aria-hidden="true" />
      <h4>{record?.documentType || "Verification document"}</h4>
      <p>This document is not an image preview. Open it in a new tab for review.</p>
      <a href={documentHref} target="_blank" rel="noreferrer noopener">
        <ExternalLink size={15} aria-hidden="true" />
        Open document
      </a>
    </div>
  );
}

/**
 * Review drawer presents the selected verification using the authoritative
 * detail endpoint. Already-reviewed records are inspect-only by design.
 */
function VerificationDrawer({
  detailState,
  onClose,
  onMessageHost,
  onPreviewImage,
  onReviewRequest,
  supportError,
  supportLoading,
}) {
  const record = detailState.record;

  return (
    <div className="elite-admin-hosts__overlay" role="presentation">
      <aside
        aria-labelledby="admin-host-verification-detail-title"
        aria-modal="true"
        className="elite-admin-hosts__drawer"
        role="dialog"
      >
        <button
          aria-label="Close host verification detail"
          className="elite-admin-hosts__drawer-close"
          onClick={onClose}
          type="button"
        >
          <X size={18} aria-hidden="true" />
        </button>

        {detailState.loading && (
          <div className="elite-admin-hosts__drawer-state" role="status">
            <RefreshCw size={22} aria-hidden="true" />
            Loading verification record...
          </div>
        )}

        {!detailState.loading && detailState.error && (
          <div className="elite-admin-hosts__drawer-state" role="alert">
            <AlertTriangle size={22} aria-hidden="true" />
            {detailState.error}
          </div>
        )}

        {!detailState.loading && record && (
          <>
            <header className="elite-admin-hosts__drawer-header">
              <HostIdentityMark record={record} size="large" />
              <span>Trust review</span>
              <h3 id="admin-host-verification-detail-title">
                {getHostDisplayName(record)}
              </h3>
              <p>
                Review the submitted identity and business fields exactly as
                returned by the backend before approving host access.
              </p>
              <VerificationStatusBadge status={record.status} />
            </header>

            <section
              aria-label="Host identity"
              className="elite-admin-hosts__detail-section"
            >
              <span>Host identity</span>
              <div className="elite-admin-hosts__detail-grid">
                <DetailItem label="Host name" value={record.hostName} />
                <DetailItem label="Host email" value={record.hostEmail} icon={Mail} />
                <DetailItem label="Legal name" value={record.legalName} />
              </div>
            </section>

            <section
              aria-label="Business information"
              className="elite-admin-hosts__detail-section"
            >
              <span>Business information</span>
              <div className="elite-admin-hosts__detail-grid">
                <DetailItem
                  label="Business name"
                  value={record.businessName}
                  icon={Building2}
                />
                <DetailItem label="Host ID" value={record.hostId} />
              </div>
            </section>

            <section
              aria-label="Verification document"
              className="elite-admin-hosts__detail-section"
            >
              <span>Verification document</span>
              <VerificationDocument
                onPreviewImage={onPreviewImage}
                record={record}
              />
            </section>

            <section
              aria-label="Submission review status"
              className="elite-admin-hosts__detail-section"
            >
              <span>Submission status</span>
              <div className="elite-admin-hosts__detail-grid">
                <DetailItem label="Submitted" value={formatDate(record.createdAt)} icon={CalendarClock} />
                <DetailItem label="Reviewed" value={formatDate(record.reviewedAt)} />
                <DetailItem label="Reviewed by" value={record.reviewedByName} />
                <DetailItem label="Admin note" value={record.adminNote} />
              </div>
            </section>

            <section className="elite-admin-hosts__review-panel">
              <span>Review outcome</span>
              <div className="elite-admin-hosts__support-bridge">
                <p>
                  Open this Host's dedicated EliteBNB support conversation if
                  the review needs clarification outside the Admin note.
                </p>
                <button
                  disabled={supportLoading || !record.hostId}
                  onClick={() => onMessageHost(record)}
                  type="button"
                >
                  <MessageCircle size={16} aria-hidden="true" />
                  {supportLoading ? "Opening support..." : "Message Host"}
                </button>
              </div>

              {supportError ? (
                <div className="elite-admin-hosts__confirm-error" role="alert">
                  <AlertTriangle size={16} aria-hidden="true" />
                  {supportError}
                </div>
              ) : null}

              {record.status === "PENDING" ? (
                <>
                  <p>
                    PENDING submissions can be verified or rejected. The backend
                    records the final status and Admin note.
                  </p>
                  <div className="elite-admin-hosts__review-panel-actions">
                    <button
                      className="elite-admin-hosts__primary-action elite-admin-hosts__primary-action--verify"
                      onClick={() => onReviewRequest(record, "VERIFIED")}
                      type="button"
                    >
                      Verify host
                    </button>
                    <button
                      className="elite-admin-hosts__primary-action elite-admin-hosts__primary-action--reject"
                      onClick={() => onReviewRequest(record, "REJECTED")}
                      type="button"
                    >
                      Reject submission
                    </button>
                  </div>
                </>
              ) : (
                <p>
                  This submission has already been reviewed. It remains
                  inspectable for trust and safety context, but the page does
                  not offer repeat transitions without a backend requirement.
                </p>
              )}
            </section>
          </>
        )}
      </aside>
    </div>
  );
}

/**
 * One labeled DTO field inside the drawer. Missing values are shown honestly
 * instead of hidden behind placeholder facts.
 */
function DetailItem({ icon: Icon, label, value }) {
  return (
    <div>
      {Icon ? <Icon size={17} aria-hidden="true" /> : <FileText size={17} aria-hidden="true" />}
      <span>
        <small>{label}</small>
        {value || "Not provided"}
      </span>
    </div>
  );
}

/**
 * Confirmation modal owns adminNote input and frontend-only rejection note
 * validation. The backend still decides whether the transition is allowed.
 */
function ReviewConfirmationModal({
  adminNote,
  error,
  loading,
  onCancel,
  onConfirm,
  onNoteChange,
  request,
}) {
  if (!request) return null;

  const approving = request.status === "VERIFIED";
  const recordName = getHostDisplayName(request.record);

  return (
    <div className="elite-admin-hosts__confirm-overlay" role="presentation">
      <section
        aria-labelledby="admin-host-review-confirm-title"
        aria-modal="true"
        className="elite-admin-hosts__confirm"
        role="dialog"
      >
        <span className="elite-admin-hosts__confirm-icon" aria-hidden="true">
          {approving ? <ShieldCheck size={23} /> : <XCircle size={23} />}
        </span>
        <h3 id="admin-host-review-confirm-title">
          {approving ? "Verify this host?" : "Reject this submission?"}
        </h3>
        <p>
          {approving
            ? `${recordName} will move to VERIFIED after the backend confirms the review outcome.`
            : `${recordName} will move to REJECTED after the backend confirms the review outcome.`}
        </p>

        <label>
          <span>{approving ? "Admin note (optional)" : "Admin note"}</span>
          <textarea
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder={
              approving
                ? "Optional internal note for this approval"
                : "Add a clear reason for rejecting this host submission"
            }
            rows={4}
            value={adminNote}
          />
        </label>

        {error && (
          <div className="elite-admin-hosts__confirm-error" role="alert">
            <AlertTriangle size={16} aria-hidden="true" />
            {error}
          </div>
        )}

        <div className="elite-admin-hosts__confirm-actions">
          <button disabled={loading} onClick={onCancel} type="button">
            Keep pending
          </button>
          <button
            className={approving ? "is-verify" : "is-reject"}
            disabled={loading}
            onClick={onConfirm}
            type="button"
          >
            {loading
              ? "Submitting..."
              : approving
                ? "Verify host"
                : "Reject submission"}
          </button>
        </div>
      </section>
    </div>
  );
}

/**
 * Large document preview remains viewport-fixed so Admins can inspect image
 * submissions without losing their place in the review drawer.
 */
function DocumentImageModal({ onClose, preview }) {
  if (!preview?.url) return null;

  return (
    <div className="elite-admin-hosts__image-overlay" role="presentation">
      <section
        aria-label="Verification document image preview"
        aria-modal="true"
        className="elite-admin-hosts__image-modal"
        role="dialog"
      >
        <button
          aria-label="Close document image preview"
          onClick={onClose}
          type="button"
        >
          <X size={18} aria-hidden="true" />
        </button>
        <img src={preview.url} alt={preview.alt} />
      </section>
    </div>
  );
}

/**
 * Phase 4 Host Verification workspace.
 * Production data comes only from the finalized Admin host-verification API.
 */
export default function Hosts() {
  const navigate = useNavigate();
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [detailState, setDetailState] = useState({
    error: "",
    loading: false,
    open: false,
    record: null,
  });
  const [documentPreview, setDocumentPreview] = useState(null);
  const [pendingFilters, setPendingFilters] = useState(emptyFilters);
  const [reloadToken, setReloadToken] = useState(0);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewRequest, setReviewRequest] = useState(null);
  const [supportState, setSupportState] = useState({
    error: "",
    loading: false,
  });
  const [mutationState, setMutationState] = useState({
    error: "",
    loading: false,
    success: "",
  });
  const [verificationState, setVerificationState] = useState(
    initialVerificationState
  );

  const filteredRecords = useMemo(
    () => prioritizePendingRecords(verificationState.records),
    [verificationState.records]
  );
  const pendingInCurrentView = filteredRecords.filter(
    (record) => record.status === "PENDING"
  ).length;
  const pendingCount =
    verificationState.pendingCount ?? pendingInCurrentView;
  const pendingCountLabel =
    verificationState.pendingCount === null
      ? `${pendingCount} pending in current view`
      : `${pendingCount} pending review${pendingCount === 1 ? "" : "s"}`;
  const hasActiveFilters = useMemo(
    () => Object.values(appliedFilters).some((value) => String(value).trim()),
    [appliedFilters]
  );
  const totalLabel = verificationState.loading
    ? "Loading reviews"
    : `${filteredRecords.length} ${
        filteredRecords.length === 1 ? "record" : "records"
      }${hasActiveFilters ? " matching filters" : ""}`;

  useBodyScrollLock(
    detailState.open || Boolean(reviewRequest) || Boolean(documentPreview)
  );

  useEffect(() => {
    let active = true;

    async function loadVerifications() {
      const [listResult, pendingResult] = await Promise.allSettled([
        adminService.getHostVerifications(buildVerificationQuery(appliedFilters)),
        adminService.getPendingHostVerifications(),
      ]);

      if (!active) return;

      const pendingCountFromBackend =
        pendingResult.status === "fulfilled"
          ? normalizeVerificationList(pendingResult.value.data).length
          : null;

      if (listResult.status === "fulfilled") {
        setVerificationState({
          error: "",
          loading: false,
          pendingCount: pendingCountFromBackend,
          records: normalizeVerificationList(listResult.value.data),
        });
        return;
      }

      setVerificationState({
        error: getErrorMessage(
          listResult.reason,
          "Unable to load host verification records."
        ),
        loading: false,
        pendingCount: pendingCountFromBackend,
        records: [],
      });
    }

    loadVerifications();

    return () => {
      active = false;
    };
  }, [appliedFilters, reloadToken]);

  /**
   * Applies only supported backend filters after the Admin submits the toolbar.
   */
  const handleFilterSubmit = (event) => {
    event.preventDefault();
    setMutationState({ error: "", loading: false, success: "" });
    setVerificationState((current) => ({
      ...current,
      error: "",
      loading: true,
    }));
    setAppliedFilters({ ...pendingFilters });
  };

  /**
   * Keeps filter edits local until Apply filters is pressed.
   */
  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setPendingFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /**
   * Returns the review queue to the unfiltered backend list.
   */
  const handleClearFilters = () => {
    setPendingFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setMutationState({ error: "", loading: false, success: "" });
    setVerificationState((current) => ({
      ...current,
      error: "",
      loading: true,
    }));
  };

  /**
   * Retries the current backend-filtered request without changing filters.
   */
  const handleRetry = () => {
    setMutationState({ error: "", loading: false, success: "" });
    setVerificationState((current) => ({
      ...current,
      error: "",
      loading: true,
    }));
    setReloadToken((current) => current + 1);
  };

  /**
   * Opens with row data for instant context, then refreshes the drawer from
   * GET /admin/host-verifications/{id}.
   */
  const handleOpenDetail = async (record) => {
    setDetailState({
      error: "",
      loading: true,
      open: true,
      record,
    });

    try {
      const response = await adminService.getHostVerificationById(record.id);
      const detailRecord = normalizeVerificationRecord(response.data);

      setDetailState({
        error: "",
        loading: false,
        open: true,
        record: detailRecord || record,
      });
    } catch (error) {
      setDetailState({
        error: getErrorMessage(
          error,
          "Unable to load this verification record."
        ),
        loading: false,
        open: true,
        record,
      });
    }
  };

  const handleCloseDetail = () => {
    setDetailState({
      error: "",
      loading: false,
      open: false,
      record: null,
    });
    setSupportState({ error: "", loading: false });
  };

  /**
   * Captures the desired review outcome and defers the PATCH request until the
   * Admin confirms the modal.
   */
  const handleReviewRequest = (record, status) => {
    setMutationState({ error: "", loading: false, success: "" });
    setSupportState({ error: "", loading: false });
    setReviewNote(record?.adminNote || "");
    setReviewRequest({
      record,
      status,
    });
  };

  const handleCancelReviewRequest = () => {
    if (mutationState.loading) return;
    setReviewNote("");
    setReviewRequest(null);
    setMutationState({ error: "", loading: false, success: "" });
  };

  /**
   * Opens the dedicated Host/Admin support thread for this verification record.
   * The backend create-or-get endpoint owns the one-thread-per-Host rule, so the
   * frontend only needs a real hostId and returned conversation id.
   */
  const handleMessageHost = async (record) => {
    if (!record?.hostId) {
      setSupportState({
        error: "This verification record does not include a Host ID.",
        loading: false,
      });
      return;
    }

    try {
      setSupportState({ error: "", loading: true });

      const response =
        await supportMessagingService.createOrGetHostSupportConversation(
          record.hostId
        );
      const normalizedThread = normalizeSupportConversationPayload(
        response.data
      );
      const conversationId = getSupportConversationId(
        normalizedThread.conversation
      );

      if (!conversationId) {
        throw new Error("The backend did not return a support conversation id.");
      }

      navigate(
        `/admin/host-support?conversation=${encodeURIComponent(
          conversationId
        )}`
      );
    } catch (error) {
      setSupportState({
        error: getErrorMessage(
          error,
          "Unable to open this Host support conversation."
        ),
        loading: false,
      });
    }
  };

  /**
   * Sends the backend-supported status/adminNote body. Rejection note validation
   * is frontend UX only; backend remains the final authority for review rules.
   */
  const handleConfirmReview = async () => {
    if (!reviewRequest) return;

    const trimmedNote = reviewNote.trim();

    if (reviewRequest.status === "REJECTED" && trimmedNote.length < 6) {
      setMutationState({
        error: "Add a clear admin note before rejecting this submission.",
        loading: false,
        success: "",
      });
      return;
    }

    setMutationState({ error: "", loading: true, success: "" });

    try {
      const response = await adminService.updateHostVerificationStatus(
        reviewRequest.record.id,
        trimmedNote
          ? {
              adminNote: trimmedNote,
              status: reviewRequest.status,
            }
          : {
              status: reviewRequest.status,
            }
      );
      const updatedRecord = normalizeVerificationRecord(response.data);
      const reviewedName = getHostDisplayName(
        updatedRecord || reviewRequest.record
      );

      if (updatedRecord) {
        setVerificationState((current) => ({
          ...current,
          records: mergeUpdatedVerification(current.records, updatedRecord),
        }));

        setDetailState((current) => ({
          ...current,
          record:
            current.record && String(current.record.id) === String(updatedRecord.id)
              ? { ...current.record, ...updatedRecord }
              : current.record,
        }));
      }

      setReviewNote("");
      setReviewRequest(null);
      setMutationState({
        error: "",
        loading: false,
        success: `${reviewedName} is now ${reviewRequest.status.toLowerCase()}.`,
      });

      /* Refetch after local synchronization so filtered queues remain honest
         when a pending item becomes VERIFIED or REJECTED. */
      setReloadToken((current) => current + 1);
    } catch (error) {
      setMutationState({
        error: getErrorMessage(
          error,
          "Unable to update this host verification."
        ),
        loading: false,
        success: "",
      });
    }
  };

  return (
    <section
      className="elite-admin-hosts"
      aria-labelledby="admin-host-verification-title"
    >
      <header className="elite-admin-hosts__header">
        <div>
          <span>Trust & verification</span>
          <h2 id="admin-host-verification-title">Host Verification</h2>
          <p>
            Review host identity and business submissions before approving
            access to EliteBNB property-management tools.
          </p>
        </div>
        <aside aria-label="Host verification counts">
          <ShieldCheck size={22} aria-hidden="true" />
          <strong>{totalLabel}</strong>
          <small>{pendingCountLabel}</small>
        </aside>
      </header>

      <form
        className="elite-admin-hosts__filters"
        onSubmit={handleFilterSubmit}
      >
        <div className="elite-admin-hosts__search-field">
          <Search size={17} aria-hidden="true" />
          <label htmlFor="admin-host-search">Search submissions</label>
          <input
            id="admin-host-search"
            name="search"
            onChange={handleFilterChange}
            placeholder="Host, email, legal or business name"
            type="search"
            value={pendingFilters.search}
          />
        </div>

        <label className="elite-admin-hosts__select-field">
          <span>Status</span>
          <select
            name="status"
            onChange={handleFilterChange}
            value={pendingFilters.status}
          >
            <option value="">All statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </label>

        <label className="elite-admin-hosts__host-id-field">
          <span>Host ID</span>
          <input
            inputMode="numeric"
            name="hostId"
            onChange={handleFilterChange}
            placeholder="Optional"
            type="text"
            value={pendingFilters.hostId}
          />
        </label>

        <div className="elite-admin-hosts__filter-actions">
          <button type="submit">
            <SlidersHorizontal size={16} aria-hidden="true" />
            Apply filters
          </button>
          {(hasActiveFilters ||
            Object.values(pendingFilters).some((value) =>
              String(value).trim()
            )) && (
            <button onClick={handleClearFilters} type="button">
              Clear
            </button>
          )}
        </div>
      </form>

      {mutationState.error && !reviewRequest && (
        <div className="elite-admin-hosts__feedback is-error" role="alert">
          <AlertTriangle size={17} aria-hidden="true" />
          {mutationState.error}
        </div>
      )}
      {mutationState.success && (
        <div className="elite-admin-hosts__feedback is-success" role="status">
          <CheckCircle2 size={17} aria-hidden="true" />
          {mutationState.success}
        </div>
      )}

      <section
        className="elite-admin-hosts__queue"
        aria-label="Host verification queue"
      >
        <div className="elite-admin-hosts__queue-heading">
          <span>Review queue</span>
          <button
            aria-label="Refresh host verification queue"
            disabled={verificationState.loading}
            onClick={handleRetry}
            type="button"
          >
            <RefreshCw size={16} aria-hidden="true" />
            Refresh
          </button>
        </div>

        {verificationState.loading && (
          <div className="elite-admin-hosts__skeleton" aria-label="Loading host verifications">
            {Array.from({ length: 5 }).map((_, index) => (
              <span key={index} />
            ))}
          </div>
        )}

        {!verificationState.loading && verificationState.error && (
          <div className="elite-admin-hosts__empty-state" role="alert">
            <AlertTriangle size={24} aria-hidden="true" />
            <h3>Unable to load host submissions</h3>
            <p>{verificationState.error}</p>
            <button onClick={handleRetry} type="button">
              Retry
            </button>
          </div>
        )}

        {!verificationState.loading &&
          !verificationState.error &&
          filteredRecords.length === 0 && (
            <div className="elite-admin-hosts__empty-state" role="status">
              <ShieldCheck size={24} aria-hidden="true" />
              <h3>
                {hasActiveFilters
                  ? "No matching host submissions"
                  : "No verification records"}
              </h3>
              <p>
                {hasActiveFilters
                  ? "No host verification record matched the current backend filters."
                  : "The backend returned an empty verification queue."}
              </p>
              {hasActiveFilters && (
                <button onClick={handleClearFilters} type="button">
                  Clear filters
                </button>
              )}
            </div>
          )}

        {!verificationState.loading &&
          !verificationState.error &&
          filteredRecords.length > 0 && (
            <>
              <div className="elite-admin-hosts__table-wrap">
                <table className="elite-admin-hosts__table">
                  <thead>
                    <tr>
                      <th scope="col">Host</th>
                      <th scope="col">Identity / business</th>
                      <th scope="col">Document</th>
                      <th scope="col">Status</th>
                      <th scope="col">Submitted</th>
                      <th scope="col">Review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record) => (
                      <VerificationTableRow
                        key={record.id}
                        onInspect={handleOpenDetail}
                        onReviewRequest={handleReviewRequest}
                        record={record}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="elite-admin-hosts__mobile-list">
                {filteredRecords.map((record) => (
                  <VerificationMobileCard
                    key={record.id}
                    onInspect={handleOpenDetail}
                    onReviewRequest={handleReviewRequest}
                    record={record}
                  />
                ))}
              </div>
            </>
          )}
      </section>

      {detailState.open && (
        <VerificationDrawer
          detailState={detailState}
          onClose={handleCloseDetail}
          onMessageHost={handleMessageHost}
          onPreviewImage={setDocumentPreview}
          onReviewRequest={handleReviewRequest}
          supportError={supportState.error}
          supportLoading={supportState.loading}
        />
      )}

      <ReviewConfirmationModal
        adminNote={reviewNote}
        error={mutationState.error}
        loading={mutationState.loading}
        onCancel={handleCancelReviewRequest}
        onConfirm={handleConfirmReview}
        onNoteChange={setReviewNote}
        request={reviewRequest}
      />

      <DocumentImageModal
        onClose={() => setDocumentPreview(null)}
        preview={documentPreview}
      />
    </section>
  );
}
