import {
  AlertTriangle,
  Building2,
  CalendarClock,
  ClipboardList,
  CreditCard,
  Eye,
  FileClock,
  FileSearch,
  Mail,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Tag,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { adminService } from "../../services/adminService";
import "./AuditLogs.css";

const emptyFilters = {
  action: "",
  adminId: "",
  search: "",
  targetId: "",
  targetType: "",
};

const initialAuditState = {
  auditLogs: [],
  error: "",
  loading: true,
};

const auditActions = [
  "USER_STATUS_UPDATED",
  "PROPERTY_STATUS_UPDATED",
  "BOOKING_STATUS_UPDATED",
  "PAYMENT_STATUS_UPDATED",
  "REPORT_STATUS_UPDATED",
  "REPORT_MODERATION_ACTION",
  "HOST_VERIFICATION_UPDATED",
  "PROPERTY_APPROVAL_UPDATED",
  "REFUND_STATUS_UPDATED",
  "PLATFORM_SETTING_UPDATED",
];

const idFilterLabels = {
  adminId: "Admin ID",
  targetId: "Target ID",
};

/**
 * Builds the audit-log query from only finalized backend-supported filters.
 * Audit logs are intentionally read-only and do not support pagination,
 * sorting, exports, date filters, or rollback actions in this phase.
 */
function buildAuditQuery(filters) {
  return Object.entries(filters).reduce((query, [key, value]) => {
    const trimmedValue = String(value || "").trim();

    if (trimmedValue) {
      query[key] = trimmedValue;
    }

    return query;
  }, {});
}

/**
 * Performs light numeric validation for ID filters so accidental words are not
 * sent as backend IDs. The backend still owns authorization and visibility.
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
 * Accepts the finalized array response while tolerating conventional wrappers
 * if audit records are nested by the backend later.
 */
function normalizeAuditLogList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.auditLogs)) return payload.auditLogs;
  if (Array.isArray(payload?.logs)) return payload.logs;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;

  return [];
}

/**
 * Normalizes one AuditLogResponse from GET /admin/audit-logs/{id}.
 */
function normalizeAuditLogRecord(payload) {
  if (!payload) return null;
  if (payload.auditLog) return payload.auditLog;
  if (payload.log) return payload.log;
  if (payload.data && !Array.isArray(payload.data)) return payload.data;

  return payload;
}

/**
 * Pulls a concise, operator-safe message from Axios/backend failures.
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
 * Converts backend enum values to human-readable labels while preserving the
 * original enum strings for filter requests.
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
 * Formats audit timestamps with date and time because audit history depends on
 * precise ordering, even though the UI does not invent sorting controls.
 */
function formatDateTime(value) {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not recorded";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Displays a truthful audit reference derived directly from the backend id.
 */
function getAuditReference(auditLog) {
  return auditLog?.id ? `Audit #${auditLog.id}` : "Audit record";
}

/**
 * Builds initials from the genuine Admin name or email for a small identity
 * treatment. AuditLogResponse does not include avatar imagery.
 */
function getAdminInitials(auditLog) {
  const source = auditLog?.adminName || auditLog?.adminEmail || "Admin";
  const parts = source
    .replace(/@.*/, "")
    .split(/\s|\.|_/)
    .filter(Boolean);

  return (parts[0]?.[0] || "A").concat(parts[1]?.[0] || "").toUpperCase();
}

/**
 * Produces a compact Admin label without inventing profile data.
 */
function getAdminLabel(auditLog) {
  return auditLog?.adminName || auditLog?.adminEmail || "Admin not recorded";
}

/**
 * Builds a target reference from only targetType and targetId. The audit
 * contract does not support hydrating targets from other Admin resources here.
 */
function getTargetLabel(auditLog) {
  if (!auditLog?.targetType && !auditLog?.targetId) return "Target not recorded";

  const type = auditLog?.targetType ? formatEnum(auditLog.targetType) : "Target";
  return auditLog?.targetId ? `${type} #${auditLog.targetId}` : type;
}

/**
 * Keeps dense ledger descriptions readable while preserving the full backend
 * description inside Inspect.
 */
function truncateText(value, maxLength = 118) {
  if (!value) return "No description recorded";

  const text = String(value);
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text;
}

/**
 * Renders action icons through static branches so React compiler rules do not
 * see dynamic component construction during render.
 */
function renderActionIcon(action, size = 15) {
  if (action === "USER_STATUS_UPDATED") {
    return <UserRound size={size} aria-hidden="true" />;
  }
  if (
    action === "PROPERTY_STATUS_UPDATED" ||
    action === "PROPERTY_APPROVAL_UPDATED"
  ) {
    return <Building2 size={size} aria-hidden="true" />;
  }
  if (action === "BOOKING_STATUS_UPDATED") {
    return <CalendarClock size={size} aria-hidden="true" />;
  }
  if (action === "PAYMENT_STATUS_UPDATED") {
    return <CreditCard size={size} aria-hidden="true" />;
  }
  if (action === "REFUND_STATUS_UPDATED") {
    return <WalletCards size={size} aria-hidden="true" />;
  }
  if (
    action === "REPORT_STATUS_UPDATED" ||
    action === "REPORT_MODERATION_ACTION"
  ) {
    return <FileSearch size={size} aria-hidden="true" />;
  }
  if (action === "HOST_VERIFICATION_UPDATED") {
    return <ShieldCheck size={size} aria-hidden="true" />;
  }
  if (action === "PLATFORM_SETTING_UPDATED") {
    return <Settings size={size} aria-hidden="true" />;
  }

  return <ClipboardList size={size} aria-hidden="true" />;
}

/**
 * Action labels are metadata, not severity or success/failure indicators, so
 * this badge stays restrained and text-led.
 */
function AuditActionBadge({ action }) {
  const normalizedAction = action || "UNKNOWN";

  return (
    <span
      className={`elite-admin-audit__badge elite-admin-audit__badge--${normalizedAction}`}
    >
      {renderActionIcon(normalizedAction)}
      {formatEnum(normalizedAction)}
    </span>
  );
}

/**
 * Small Admin identity block for rows/cards. It uses only adminName/adminEmail
 * from the AuditLogResponse and never invents avatars.
 */
function AdminIdentity({ auditLog }) {
  return (
    <div className="elite-admin-audit__admin">
      <span aria-hidden="true">{getAdminInitials(auditLog)}</span>
      <div>
        <strong>{getAdminLabel(auditLog)}</strong>
        <small>{auditLog.adminEmail || "Email not recorded"}</small>
      </div>
    </div>
  );
}

/**
 * Desktop audit ledger row. It exposes the most useful traceability fields
 * while keeping the full backend description available in the read-only drawer.
 */
function AuditLedgerRow({ auditLog, onInspect }) {
  return (
    <article className="elite-admin-audit__row" role="listitem">
      <div className="elite-admin-audit__reference">
        <span>Reference</span>
        <strong>{getAuditReference(auditLog)}</strong>
        <small>{formatDateTime(auditLog.createdAt)}</small>
      </div>

      <div className="elite-admin-audit__action">
        <span>Action</span>
        <AuditActionBadge action={auditLog.action} />
      </div>

      <AdminIdentity auditLog={auditLog} />

      <div className="elite-admin-audit__target">
        <span>Target</span>
        <strong>{getTargetLabel(auditLog)}</strong>
        <small>{auditLog.targetType || "Type not recorded"}</small>
      </div>

      <div className="elite-admin-audit__description">
        <span>Description</span>
        <p title={auditLog.description || ""}>
          {truncateText(auditLog.description)}
        </p>
      </div>

      <div className="elite-admin-audit__actions">
        <button onClick={() => onInspect(auditLog)} type="button">
          <Eye size={16} aria-hidden="true" />
          Inspect
        </button>
      </div>
    </article>
  );
}

/**
 * Mobile audit card prevents the dense desktop ledger from creating horizontal
 * overflow on narrow Admin screens.
 */
function AuditMobileCard({ auditLog, onInspect }) {
  return (
    <article className="elite-admin-audit__mobile-card">
      <div className="elite-admin-audit__mobile-topline">
        <strong>{getAuditReference(auditLog)}</strong>
        <AuditActionBadge action={auditLog.action} />
      </div>
      <p title={auditLog.description || ""}>{truncateText(auditLog.description)}</p>
      <dl>
        <div>
          <dt>Admin</dt>
          <dd>{getAdminLabel(auditLog)}</dd>
        </div>
        <div>
          <dt>Target</dt>
          <dd>{getTargetLabel(auditLog)}</dd>
        </div>
        <div>
          <dt>Recorded</dt>
          <dd>{formatDateTime(auditLog.createdAt)}</dd>
        </div>
      </dl>
      <button onClick={() => onInspect(auditLog)} type="button">
        <Eye size={16} aria-hidden="true" />
        Inspect record
      </button>
    </article>
  );
}

/**
 * Detail field for the read-only drawer. Missing backend values are rendered
 * honestly rather than filled with placeholder facts.
 */
function DetailItem({ icon: Icon, label, value }) {
  const hasValue = value !== null && value !== undefined && value !== "";

  return (
    <div className="elite-admin-audit__detail-item">
      {Icon && <Icon size={17} aria-hidden="true" />}
      <span>{label}</span>
      <strong>{hasValue ? value : "Not provided"}</strong>
    </div>
  );
}

/**
 * Viewport-safe read-only drawer for one AuditLogResponse. It deliberately
 * contains no rollback, delete, edit, export, or target-hydration controls.
 */
function AuditDetailDrawer({ auditLog, error, loading, onClose, onRetry }) {
  if (!auditLog) return null;

  return (
    <div className="elite-admin-audit__drawer-overlay" role="presentation">
      <aside
        aria-labelledby="admin-audit-detail-title"
        aria-modal="true"
        className="elite-admin-audit__drawer"
        role="dialog"
      >
        <button
          aria-label="Close audit log detail"
          className="elite-admin-audit__drawer-close"
          onClick={onClose}
          type="button"
        >
          <X size={19} aria-hidden="true" />
        </button>

        <header className="elite-admin-audit__drawer-header">
          <span>Read-only record</span>
          <h3 id="admin-audit-detail-title">{getAuditReference(auditLog)}</h3>
          <p>
            Audit logs are backend-authored history records. This drawer
            exposes the recorded action exactly as provided, without rollback or
            mutation controls.
          </p>
          <AuditActionBadge action={auditLog.action} />
        </header>

        {loading && (
          <div className="elite-admin-audit__drawer-loading" role="status">
            Loading audit detail...
          </div>
        )}

        {error && (
          <div className="elite-admin-audit__drawer-error" role="alert">
            <AlertTriangle size={18} aria-hidden="true" />
            <div>
              <strong>Detail could not be refreshed.</strong>
              <p>{error}</p>
              <button onClick={() => onRetry(auditLog)} type="button">
                Retry detail
              </button>
            </div>
          </div>
        )}

        {!loading && (
          <>
            <section
              aria-label="Audit record"
              className="elite-admin-audit__detail-section"
            >
              <span>Audit record</span>
              <div className="elite-admin-audit__detail-grid">
                <DetailItem label="Audit ID" value={auditLog.id} icon={FileClock} />
                <DetailItem
                  label="Action"
                  value={formatEnum(auditLog.action)}
                  icon={ClipboardList}
                />
                <DetailItem
                  label="Recorded"
                  value={formatDateTime(auditLog.createdAt)}
                  icon={CalendarClock}
                />
              </div>
            </section>

            <section
              aria-label="Administrator"
              className="elite-admin-audit__detail-section"
            >
              <span>Administrator</span>
              <div className="elite-admin-audit__detail-grid">
                <DetailItem label="Admin ID" value={auditLog.adminId} icon={UserRound} />
                <DetailItem label="Admin name" value={auditLog.adminName} />
                <DetailItem label="Admin email" value={auditLog.adminEmail} icon={Mail} />
              </div>
            </section>

            <section
              aria-label="Audit target"
              className="elite-admin-audit__detail-section"
            >
              <span>Target</span>
              <div className="elite-admin-audit__target-summary">
                <Tag size={24} aria-hidden="true" />
                <div>
                  <strong>{getTargetLabel(auditLog)}</strong>
                  <small>
                    Target references are shown exactly as recorded; this page
                    does not hydrate or link to external target records.
                  </small>
                </div>
              </div>
              <div className="elite-admin-audit__detail-grid">
                <DetailItem label="Target type" value={auditLog.targetType} icon={Tag} />
                <DetailItem label="Target ID" value={auditLog.targetId} />
              </div>
            </section>

            <section
              aria-label="Recorded description"
              className="elite-admin-audit__detail-section"
            >
              <span>Recorded description</span>
              <div className="elite-admin-audit__long-field">
                <p>{auditLog.description || "No description was recorded."}</p>
              </div>
            </section>

            <section className="elite-admin-audit__readonly-panel">
              <span>Observation only</span>
              <p>
                The finalized audit-log contract is read-only. There is no
                rollback, restore, delete, edit, export, or re-run action
                available from this workspace.
              </p>
            </section>
          </>
        )}
      </aside>
    </div>
  );
}

/**
 * Phase 10 Admin Audit Logs workspace.
 * It turns backend-authored Admin action history into a searchable read-only
 * ledger without inventing mutations, charts, exports, or target hydration.
 */
export default function AuditLogs() {
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [auditState, setAuditState] = useState(initialAuditState);
  const [detailState, setDetailState] = useState({
    auditLog: null,
    error: "",
    loading: false,
    open: false,
  });
  const [filterError, setFilterError] = useState("");
  const [pendingFilters, setPendingFilters] = useState(emptyFilters);
  const [reloadToken, setReloadToken] = useState(0);

  const hasActiveFilters = useMemo(
    () => Object.values(appliedFilters).some((value) => String(value).trim()),
    [appliedFilters]
  );
  const totalLabel = auditState.loading
    ? "Loading audit logs"
    : `${auditState.auditLogs.length} ${
        auditState.auditLogs.length === 1 ? "record" : "records"
      }${hasActiveFilters ? " matching filters" : ""}`;

  useBodyScrollLock(detailState.open);

  useEffect(() => {
    let active = true;

    /**
     * Loads the read-only audit ledger with only applied backend query params.
     */
    async function loadAuditLogs() {
      try {
        const response = await adminService.getAuditLogs(
          buildAuditQuery(appliedFilters)
        );

        if (!active) return;

        setAuditState({
          auditLogs: normalizeAuditLogList(response.data),
          error: "",
          loading: false,
        });
      } catch (error) {
        if (!active) return;

        setAuditState({
          auditLogs: [],
          error: getErrorMessage(error, "Unable to load Admin audit logs."),
          loading: false,
        });
      }
    }

    loadAuditLogs();

    return () => {
      active = false;
    };
  }, [appliedFilters, reloadToken]);

  /**
   * Applies filters explicitly after lightweight ID validation. The targetType
   * filter remains free text because no authoritative enum was supplied.
   */
  const handleFilterSubmit = (event) => {
    event.preventDefault();

    const invalidIds = getInvalidIdFilters(pendingFilters);

    if (invalidIds.length) {
      setFilterError(`${invalidIds.join(", ")} must be numeric.`);
      return;
    }

    setFilterError("");
    setAuditState((current) => ({ ...current, error: "", loading: true }));
    setAppliedFilters({ ...pendingFilters });
  };

  /**
   * Keeps toolbar edits local until the operator explicitly applies filters.
   */
  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setPendingFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /**
   * Clears both visible filter inputs and the active backend query state.
   */
  const handleClearFilters = () => {
    setPendingFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setFilterError("");
    setAuditState((current) => ({ ...current, error: "", loading: true }));
  };

  /**
   * Retries the current audit-log query without changing applied filters.
   */
  const handleRetry = () => {
    setFilterError("");
    setAuditState((current) => ({ ...current, error: "", loading: true }));
    setReloadToken((current) => current + 1);
  };

  /**
   * Opens a read-only detail drawer with row data immediately, then hydrates it
   * through GET /admin/audit-logs/{id}.
   */
  const handleOpenDetail = async (auditLog) => {
    setDetailState({
      auditLog,
      error: "",
      loading: true,
      open: true,
    });

    try {
      const response = await adminService.getAuditLog(auditLog.id);
      const detailAuditLog = normalizeAuditLogRecord(response.data);

      setDetailState({
        auditLog: detailAuditLog || auditLog,
        error: "",
        loading: false,
        open: true,
      });
    } catch (error) {
      setDetailState({
        auditLog,
        error: getErrorMessage(error, "Unable to load this audit record."),
        loading: false,
        open: true,
      });
    }
  };

  const handleCloseDetail = () => {
    setDetailState({
      auditLog: null,
      error: "",
      loading: false,
      open: false,
    });
  };

  /**
   * Reuses the same detail loader for drawer retry so the detail endpoint stays
   * authoritative.
   */
  const handleDetailRetry = async (auditLog) => {
    if (!auditLog?.id) return;
    await handleOpenDetail(auditLog);
  };

  return (
    <main className="elite-admin-audit" aria-labelledby="admin-audit-title">
      <header className="elite-admin-audit__header">
        <div>
          <span>SYSTEM TRAIL</span>
          <h2 id="admin-audit-title">Audit Logs</h2>
          <p>
            Review the read-only history of recorded Admin actions across
            EliteBNB, including who acted, what target was affected, and when
            the action entered the system trail.
          </p>
        </div>
        <aside aria-label="Loaded audit-log count">
          <FileClock size={22} aria-hidden="true" />
          <strong>{totalLabel}</strong>
          <small>History records returned by the current query</small>
        </aside>
      </header>

      <form className="elite-admin-audit__filters" onSubmit={handleFilterSubmit}>
        <div className="elite-admin-audit__filter-row elite-admin-audit__filter-row--primary">
          <label className="elite-admin-audit__search-field">
            <span>Search audit logs</span>
            <Search size={17} aria-hidden="true" />
            <input
              name="search"
              onChange={handleFilterChange}
              placeholder="Action, Admin, target, or description"
              type="search"
              value={pendingFilters.search}
            />
          </label>

          <label className="elite-admin-audit__select-field">
            <span>Action</span>
            <select
              name="action"
              onChange={handleFilterChange}
              value={pendingFilters.action}
            >
              <option value="">All actions</option>
              {auditActions.map((action) => (
                <option key={action} value={action}>
                  {formatEnum(action)}
                </option>
              ))}
            </select>
          </label>

          <div className="elite-admin-audit__filter-actions">
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

        <div className="elite-admin-audit__filter-row elite-admin-audit__filter-row--secondary">
          <label className="elite-admin-audit__input-field">
            <span>Target type</span>
            <input
              name="targetType"
              onChange={handleFilterChange}
              placeholder="Backend target type"
              value={pendingFilters.targetType}
            />
          </label>

          <label className="elite-admin-audit__input-field">
            <span>Target ID</span>
            <input
              inputMode="numeric"
              name="targetId"
              onChange={handleFilterChange}
              placeholder="Optional"
              value={pendingFilters.targetId}
            />
          </label>

          <label className="elite-admin-audit__input-field">
            <span>Admin ID</span>
            <input
              inputMode="numeric"
              name="adminId"
              onChange={handleFilterChange}
              placeholder="Optional"
              value={pendingFilters.adminId}
            />
          </label>
        </div>

        {filterError && (
          <div className="elite-admin-audit__filter-error" role="alert">
            <AlertTriangle size={16} aria-hidden="true" />
            {filterError}
          </div>
        )}
      </form>

      <section
        aria-label="Admin audit-log ledger"
        className="elite-admin-audit__ledger"
      >
        <div className="elite-admin-audit__ledger-heading">
          <div>
            <span>Read-only ledger</span>
            <h3>Recorded administrative history</h3>
          </div>
          <button onClick={handleRetry} type="button">
            <RefreshCw size={16} aria-hidden="true" />
            Refresh
          </button>
        </div>

        {auditState.loading && (
          <div className="elite-admin-audit__skeleton-list" role="status">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                className="elite-admin-audit__skeleton-row"
                key={`audit-skeleton-${index}`}
              />
            ))}
            <span className="sr-only">Loading Admin audit logs</span>
          </div>
        )}

        {!auditState.loading && auditState.error && (
          <div className="elite-admin-audit__empty-state" role="alert">
            <AlertTriangle size={24} aria-hidden="true" />
            <h3>Audit logs could not be loaded</h3>
            <p>{auditState.error}</p>
            <button onClick={handleRetry} type="button">
              Retry audit logs
            </button>
          </div>
        )}

        {!auditState.loading &&
          !auditState.error &&
          auditState.auditLogs.length === 0 && (
            <div className="elite-admin-audit__empty-state">
              <FileClock size={24} aria-hidden="true" />
              <h3>
                {hasActiveFilters ? "No matching audit records" : "No audit records yet"}
              </h3>
              <p>
                {hasActiveFilters
                  ? "No read-only audit records match the current backend-supported filters."
                  : "The backend returned no recorded Admin action history for this query."}
              </p>
              {hasActiveFilters && (
                <button onClick={handleClearFilters} type="button">
                  Clear filters
                </button>
              )}
            </div>
          )}

        {!auditState.loading &&
          !auditState.error &&
          auditState.auditLogs.length > 0 && (
            <>
              <div className="elite-admin-audit__table" role="list">
                {auditState.auditLogs.map((auditLog) => (
                  <AuditLedgerRow
                    auditLog={auditLog}
                    key={auditLog.id}
                    onInspect={handleOpenDetail}
                  />
                ))}
              </div>

              <div className="elite-admin-audit__mobile-list">
                {auditState.auditLogs.map((auditLog) => (
                  <AuditMobileCard
                    auditLog={auditLog}
                    key={auditLog.id}
                    onInspect={handleOpenDetail}
                  />
                ))}
              </div>
            </>
          )}
      </section>

      <AuditDetailDrawer
        auditLog={detailState.open ? detailState.auditLog : null}
        error={detailState.error}
        loading={detailState.loading}
        onClose={handleCloseDetail}
        onRetry={handleDetailRetry}
      />
    </main>
  );
}
