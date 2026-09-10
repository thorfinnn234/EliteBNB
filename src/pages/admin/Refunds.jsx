import {
  AlertTriangle,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  Mail,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Tag,
  UserRound,
  WalletCards,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { adminService } from "../../services/adminService";
import "./Refunds.css";

const emptyFilters = {
  bookingId: "",
  paymentId: "",
  requestedById: "",
  search: "",
  status: "",
};

const initialRefundState = {
  error: "",
  loading: true,
  refunds: [],
};

const refundStatuses = [
  "REQUESTED",
  "APPROVED",
  "PROCESSING",
  "REFUNDED",
  "REJECTED",
];
const finalRefundStatuses = ["REFUNDED", "REJECTED"];
const refundProviders = ["PAYSTACK", "MANUAL"];

const idFilterLabels = {
  bookingId: "Booking ID",
  paymentId: "Payment ID",
  requestedById: "Requested By ID",
};

const nairaFormatter = new Intl.NumberFormat("en-NG", {
  currency: "NGN",
  maximumFractionDigits: 0,
  style: "currency",
});

/**
 * Builds a refund query from only finalized backend-supported filters.
 * There is no pagination, sorting, or date filtering in the Admin refund
 * contract, so this helper deliberately omits those concerns.
 */
function buildRefundQuery(filters) {
  return Object.entries(filters).reduce((query, [key, value]) => {
    const trimmedValue = String(value || "").trim();

    if (trimmedValue) {
      query[key] = trimmedValue;
    }

    return query;
  }, {});
}

/**
 * Prevents obviously meaningless ID filters from being sent while leaving
 * authorization and record ownership decisions to the backend.
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
 * if the backend later nests refund records under a collection key.
 */
function normalizeRefundList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.refunds)) return payload.refunds;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;

  return [];
}

/**
 * Normalizes one RefundResponse from GET /admin/refunds/{id}.
 */
function normalizeRefundRecord(payload) {
  if (!payload) return null;
  if (payload.refund) return payload.refund;
  if (payload.data && !Array.isArray(payload.data)) return payload.data;

  return payload;
}

/**
 * Pulls a concise, user-safe message from Axios/backend failures.
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
 * Converts backend enum values into readable labels without changing the raw
 * enum value used by PATCH requests.
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
 * Formats backend dates and timestamps for the refund ledger.
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
 * RefundResponse does not include currency, so refund amounts follow the
 * project/backend Naira convention without inventing multi-currency metadata.
 */
function formatRefundAmount(value) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return "Not recorded";

  return nairaFormatter.format(parsed);
}

/**
 * Displays a truthful refund reference derived directly from the backend id.
 */
function getRefundReference(refund) {
  return refund?.id ? `Refund #${refund.id}` : "Refund";
}

/**
 * Displays a payment reference only when the refund DTO provides one.
 */
function getPaymentReference(refund) {
  if (refund?.paymentReference) return refund.paymentReference;
  return refund?.paymentId ? `Payment #${refund.paymentId}` : "Payment not recorded";
}

/**
 * Synchronizes one refund after a detail refresh or status mutation response.
 */
function mergeUpdatedRefund(refunds, updatedRefund) {
  if (!updatedRefund?.id) return refunds;

  return refunds.map((refund) =>
    String(refund.id) === String(updatedRefund.id)
      ? { ...refund, ...updatedRefund }
      : refund
  );
}

/**
 * Returns the backend-allowed target statuses while enforcing the two finalized
 * business rules: final states stop further action, and non-requested refunds
 * cannot be returned to REQUESTED.
 */
function getStatusTargets(refund) {
  const currentStatus = refund?.status;

  if (finalRefundStatuses.includes(currentStatus)) return [];

  return refundStatuses.filter((status) => {
    if (status === currentStatus) return false;
    if (currentStatus !== "REQUESTED" && status === "REQUESTED") return false;

    return true;
  });
}

/**
 * Provider details matter for processing and final refund settlement, but they
 * are intentionally hidden for pure rejection decisions.
 */
function shouldShowProviderFields(status) {
  return status === "PROCESSING" || status === "REFUNDED";
}

/**
 * Refund state badge with text labels so the meaning is never color-only.
 */
function RefundStatusBadge({ status }) {
  const normalizedStatus = status || "UNKNOWN";
  const Icon =
    normalizedStatus === "REFUNDED" || normalizedStatus === "APPROVED"
      ? CheckCircle2
      : normalizedStatus === "REJECTED"
        ? XCircle
        : normalizedStatus === "PROCESSING"
          ? RefreshCw
          : Clock3;

  return (
    <span
      className={`elite-admin-refunds__badge elite-admin-refunds__badge--status-${normalizedStatus}`}
    >
      <Icon size={14} aria-hidden="true" />
      {formatEnum(normalizedStatus)}
    </span>
  );
}

/**
 * Provider appears as metadata, not as a workflow status.
 */
function ProviderBadge({ provider }) {
  if (!provider) return <small>Provider not recorded</small>;

  return (
    <span className="elite-admin-refunds__provider">
      <CreditCard size={14} aria-hidden="true" />
      {formatEnum(provider)}
    </span>
  );
}

/**
 * One refund ledger row. It surfaces the recovery exception without presenting
 * provider metadata or internal ticket numbers the backend does not return.
 */
function RefundLedgerRow({ refund, onInspect, onStatusRequest }) {
  const statusTargets = getStatusTargets(refund);

  return (
    <article className="elite-admin-refunds__row" role="listitem">
      <div className="elite-admin-refunds__reference">
        <span>Refund</span>
        <strong title={getRefundReference(refund)}>
          {getRefundReference(refund)}
        </strong>
        <small title={getPaymentReference(refund)}>
          {getPaymentReference(refund)}
        </small>
      </div>

      <div className="elite-admin-refunds__amount">
        <span>Amount</span>
        <strong title={formatRefundAmount(refund?.amount)}>
          {formatRefundAmount(refund?.amount)}
        </strong>
        <small>{refund?.bookingId ? `Booking #${refund.bookingId}` : "Booking not recorded"}</small>
      </div>

      <div className="elite-admin-refunds__context">
        <span>Property</span>
        <strong title={refund?.propertyTitle || "Property not recorded"}>
          {refund?.propertyTitle || "Property not recorded"}
        </strong>
        <small title={refund?.reason || "Reason not recorded"}>
          {refund?.reason || "Reason not recorded"}
        </small>
      </div>

      <div className="elite-admin-refunds__context">
        <span>Requester</span>
        <strong title={refund?.requestedByName || "Requester not recorded"}>
          {refund?.requestedByName || "Requester not recorded"}
        </strong>
        <small title={refund?.requestedByEmail || "Email not recorded"}>
          {refund?.requestedByEmail || "Email not recorded"}
        </small>
      </div>

      <div className="elite-admin-refunds__states">
        <span>Status</span>
        <RefundStatusBadge status={refund?.status} />
        <ProviderBadge provider={refund?.provider} />
      </div>

      <div className="elite-admin-refunds__meta">
        <span>Timeline</span>
        <strong>
          {refund?.processedAt
            ? `Processed ${formatDate(refund.processedAt)}`
            : `Created ${formatDate(refund?.createdAt)}`}
        </strong>
        <small>{refund?.processedByName || "Processor not recorded"}</small>
      </div>

      <div className="elite-admin-refunds__actions">
        <button type="button" onClick={() => onInspect(refund)}>
          <Eye size={16} aria-hidden="true" />
          Inspect
        </button>
        {statusTargets.length > 0 ? (
          <button type="button" onClick={() => onStatusRequest(refund)}>
            Update status
          </button>
        ) : (
          <small>Final state</small>
        )}
      </div>
    </article>
  );
}

/**
 * Mobile refund card preserves the same real fields with a readable hierarchy
 * instead of squeezing the desktop ledger into narrow screens.
 */
function RefundMobileCard({ refund, onInspect, onStatusRequest }) {
  const statusTargets = getStatusTargets(refund);

  return (
    <article className="elite-admin-refunds__mobile-card" role="listitem">
      <div className="elite-admin-refunds__mobile-header">
        <span>{getRefundReference(refund)}</span>
        <RefundStatusBadge status={refund?.status} />
      </div>

      <strong>{formatRefundAmount(refund?.amount)}</strong>
      <p>{refund?.propertyTitle || "Property not recorded"}</p>

      <div className="elite-admin-refunds__mobile-grid">
        <span>
          <small>Requester</small>
          {refund?.requestedByName || "Requester not recorded"}
        </span>
        <span>
          <small>Payment</small>
          {getPaymentReference(refund)}
        </span>
        <span>
          <small>Booking</small>
          {refund?.bookingId ? `Booking #${refund.bookingId}` : "Not recorded"}
        </span>
        <span>
          <small>Provider</small>
          {formatEnum(refund?.provider)}
        </span>
      </div>

      <small className="elite-admin-refunds__mobile-reason">
        {refund?.reason || "Reason not recorded"}
      </small>

      <div className="elite-admin-refunds__actions">
        <button type="button" onClick={() => onInspect(refund)}>
          <Eye size={16} aria-hidden="true" />
          Inspect
        </button>
        {statusTargets.length > 0 && (
          <button type="button" onClick={() => onStatusRequest(refund)}>
            Update status
          </button>
        )}
      </div>
    </article>
  );
}

/**
 * One labeled DTO field inside the refund inspection drawer.
 */
function DetailItem({ icon: Icon, label, value }) {
  const displayValue =
    value === null || value === undefined || value === "" ? "Not recorded" : value;

  return (
    <div>
      {Icon ? <Icon size={17} aria-hidden="true" /> : <Tag size={17} aria-hidden="true" />}
      <span>
        <small>{label}</small>
        {displayValue}
      </span>
    </div>
  );
}

/**
 * Detail drawer presents the authoritative RefundResponse and keeps processing
 * controls separate from read-only payment and booking context.
 */
function RefundDetailDrawer({ detailState, onClose, onStatusRequest }) {
  const refund = detailState.refund;
  const statusTargets = getStatusTargets(refund);

  return (
    <div className="elite-admin-refunds__overlay" role="presentation">
      <aside
        aria-labelledby="admin-refund-detail-title"
        aria-modal="true"
        className="elite-admin-refunds__drawer"
        role="dialog"
      >
        <button
          aria-label="Close refund detail"
          className="elite-admin-refunds__drawer-close"
          onClick={onClose}
          type="button"
        >
          <X size={18} aria-hidden="true" />
        </button>

        {detailState.loading && (
          <div className="elite-admin-refunds__drawer-state" role="status">
            <RefreshCw size={22} aria-hidden="true" />
            Loading refund record...
          </div>
        )}

        {!detailState.loading && detailState.error && (
          <div className="elite-admin-refunds__drawer-state" role="alert">
            <AlertTriangle size={22} aria-hidden="true" />
            {detailState.error}
          </div>
        )}

        {!detailState.loading && refund && (
          <>
            <header className="elite-admin-refunds__drawer-header">
              <span>Refund record</span>
              <h3 id="admin-refund-detail-title">
                {getRefundReference(refund)}
              </h3>
              <p>
                Recovery oversight for the refund request, its payment linkage,
                requester context, and processing outcome returned by the
                backend.
              </p>
              <div className="elite-admin-refunds__drawer-badges">
                <RefundStatusBadge status={refund.status} />
                <ProviderBadge provider={refund.provider} />
              </div>
            </header>

            <section
              aria-label="Refund information"
              className="elite-admin-refunds__detail-section"
            >
              <span>Refund</span>
              <p>{refund.reason || "No refund reason was recorded."}</p>
              <div className="elite-admin-refunds__detail-grid">
                <DetailItem label="Refund ID" value={refund.id} icon={WalletCards} />
                <DetailItem
                  label="Amount"
                  value={formatRefundAmount(refund.amount)}
                  icon={WalletCards}
                />
                <DetailItem label="Status" value={formatEnum(refund.status)} />
                <DetailItem label="Created" value={formatDate(refund.createdAt)} />
                <DetailItem label="Updated" value={formatDate(refund.updatedAt)} />
              </div>
            </section>

            <section
              aria-label="Payment information"
              className="elite-admin-refunds__detail-section"
            >
              <span>Payment</span>
              <div className="elite-admin-refunds__detail-grid">
                <DetailItem label="Payment ID" value={refund.paymentId} icon={CreditCard} />
                <DetailItem label="Payment reference" value={refund.paymentReference} />
              </div>
            </section>

            <section
              aria-label="Booking and property information"
              className="elite-admin-refunds__detail-section"
            >
              <span>Booking / Property</span>
              <div className="elite-admin-refunds__detail-grid">
                <DetailItem label="Booking ID" value={refund.bookingId} icon={CalendarClock} />
                <DetailItem label="Property ID" value={refund.propertyId} icon={Building2} />
                <DetailItem label="Property title" value={refund.propertyTitle} />
              </div>
            </section>

            <section
              aria-label="Requester information"
              className="elite-admin-refunds__detail-section"
            >
              <span>Requester</span>
              <div className="elite-admin-refunds__detail-grid">
                <DetailItem label="Requester ID" value={refund.requestedById} icon={UserRound} />
                <DetailItem label="Requester name" value={refund.requestedByName} />
                <DetailItem label="Requester email" value={refund.requestedByEmail} icon={Mail} />
              </div>
            </section>

            <section
              aria-label="Processing information"
              className="elite-admin-refunds__detail-section"
            >
              <span>Processing</span>
              <div className="elite-admin-refunds__detail-grid">
                <DetailItem label="Provider" value={formatEnum(refund.provider)} icon={CreditCard} />
                <DetailItem label="Provider reference" value={refund.providerReference} />
                <DetailItem label="Admin note" value={refund.adminNote} />
                <DetailItem label="Processed by ID" value={refund.processedById} icon={UserRound} />
                <DetailItem label="Processed by" value={refund.processedByName} />
                <DetailItem label="Processed at" value={formatDate(refund.processedAt)} />
              </div>
            </section>

            <section className="elite-admin-refunds__status-panel">
              <span>Status governance</span>
              {statusTargets.length === 0 ? (
                <p>
                  This refund is in a final state. Refunded and rejected records
                  remain available for inspection but cannot be changed here.
                </p>
              ) : (
                <>
                  <p>
                    Update the refund lifecycle using only backend-supported
                    fields. Once a refund leaves Requested, it cannot be moved
                    back to Requested.
                  </p>
                  <button type="button" onClick={() => onStatusRequest(refund)}>
                    Update refund status
                  </button>
                </>
              )}
            </section>
          </>
        )}
      </aside>
    </div>
  );
}

/**
 * Confirmation modal collects only the supported status/provider/reference/note
 * fields. Rejection requires an Admin note as frontend clarity validation.
 */
function StatusMutationModal({
  form,
  error,
  loading,
  onCancel,
  onConfirm,
  onFormChange,
  onTargetChange,
  request,
  targetStatus,
}) {
  if (!request) return null;

  const targetOptions = getStatusTargets(request.refund);
  const finalState = finalRefundStatuses.includes(targetStatus);
  const showProviderFields = shouldShowProviderFields(targetStatus);

  return (
    <div className="elite-admin-refunds__confirm-overlay" role="presentation">
      <section
        aria-labelledby="admin-refund-status-title"
        aria-modal="true"
        className="elite-admin-refunds__confirm"
        role="dialog"
      >
        <span className="elite-admin-refunds__confirm-icon" aria-hidden="true">
          {targetStatus === "REJECTED" ? <XCircle size={23} /> : <WalletCards size={23} />}
        </span>
        <h3 id="admin-refund-status-title">Update refund status?</h3>
        <p>
          {getRefundReference(request.refund)} is currently{" "}
          {formatEnum(request.refund?.status)}. Choose a supported target state
          and add only the processing fields the backend accepts.
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

        {showProviderFields && (
          <div className="elite-admin-refunds__confirm-grid">
            <label>
              <span>Provider</span>
              <select
                name="provider"
                onChange={onFormChange}
                value={form.provider}
              >
                <option value="">No provider selected</option>
                {refundProviders.map((provider) => (
                  <option key={provider} value={provider}>
                    {formatEnum(provider)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Provider reference</span>
              <input
                name="providerReference"
                onChange={onFormChange}
                placeholder="Optional"
                type="text"
                value={form.providerReference}
              />
            </label>
          </div>
        )}

        <label>
          <span>Admin note</span>
          <textarea
            name="adminNote"
            onChange={onFormChange}
            placeholder={
              targetStatus === "REJECTED"
                ? "Explain the rejection decision"
                : "Optional processing note"
            }
            value={form.adminNote}
          />
        </label>

        <p>
          {finalState
            ? `${formatEnum(targetStatus)} is a final refund state. Confirm only after review.`
            : "Refund provider actions are not run directly from this page."}
        </p>

        {error && (
          <div className="elite-admin-refunds__confirm-error" role="alert">
            <AlertTriangle size={16} aria-hidden="true" />
            {error}
          </div>
        )}

        <div className="elite-admin-refunds__confirm-actions">
          <button disabled={loading} onClick={onCancel} type="button">
            Keep current status
          </button>
          <button
            className={targetStatus === "REJECTED" ? "is-rejected" : "is-primary"}
            disabled={loading || targetOptions.length === 0}
            onClick={onConfirm}
            type="button"
          >
            {loading ? "Submitting..." : "Confirm status update"}
          </button>
        </div>
      </section>
    </div>
  );
}

/**
 * Phase 8 Admin Refunds workspace.
 * It uses the finalized refund endpoints and treats refunds as retained
 * financial exception records rather than deleteable transactions.
 */
export default function Refunds() {
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [detailState, setDetailState] = useState({
    error: "",
    loading: false,
    open: false,
    refund: null,
  });
  const [filterError, setFilterError] = useState("");
  const [mutationState, setMutationState] = useState({
    error: "",
    loading: false,
    success: "",
  });
  const [pendingFilters, setPendingFilters] = useState(emptyFilters);
  const [refundState, setRefundState] = useState(initialRefundState);
  const [reloadToken, setReloadToken] = useState(0);
  const [statusForm, setStatusForm] = useState({
    adminNote: "",
    provider: "",
    providerReference: "",
  });
  const [statusRequest, setStatusRequest] = useState(null);
  const [targetStatus, setTargetStatus] = useState("APPROVED");

  const hasActiveFilters = useMemo(
    () => Object.values(appliedFilters).some((value) => String(value).trim()),
    [appliedFilters]
  );
  const totalLabel = refundState.loading
    ? "Loading refunds"
    : `${refundState.refunds.length} ${
        refundState.refunds.length === 1 ? "refund" : "refunds"
      }${hasActiveFilters ? " matching filters" : ""}`;

  useBodyScrollLock(detailState.open || Boolean(statusRequest));

  useEffect(() => {
    let active = true;

    /**
     * Loads the current refund ledger with only the applied backend filters.
     */
    async function loadRefunds() {
      try {
        const response = await adminService.getRefunds(
          buildRefundQuery(appliedFilters)
        );

        if (!active) return;

        setRefundState({
          error: "",
          loading: false,
          refunds: normalizeRefundList(response.data),
        });
      } catch (error) {
        if (!active) return;

        setRefundState({
          error: getErrorMessage(error, "Unable to load Admin refund records."),
          loading: false,
          refunds: [],
        });
      }
    }

    loadRefunds();

    return () => {
      active = false;
    };
  }, [appliedFilters, reloadToken]);

  /**
   * Applies filters only after simple ID validation succeeds.
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
    setRefundState((current) => ({ ...current, error: "", loading: true }));
    setAppliedFilters({ ...pendingFilters });
  };

  /**
   * Keeps toolbar edits local until Apply filters is submitted.
   */
  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setPendingFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /**
   * Clears both the visible toolbar and backend query state.
   */
  const handleClearFilters = () => {
    setPendingFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setFilterError("");
    setMutationState({ error: "", loading: false, success: "" });
    setRefundState((current) => ({ ...current, error: "", loading: true }));
  };

  /**
   * Retries the current filtered refund query.
   */
  const handleRetry = () => {
    setFilterError("");
    setMutationState({ error: "", loading: false, success: "" });
    setRefundState((current) => ({ ...current, error: "", loading: true }));
    setReloadToken((current) => current + 1);
  };

  /**
   * Opens with ledger data immediately, then replaces it with the authoritative
   * detail response.
   */
  const handleOpenDetail = async (refund) => {
    setDetailState({
      error: "",
      loading: true,
      open: true,
      refund,
    });

    try {
      const response = await adminService.getRefundById(refund.id);
      const detailRefund = normalizeRefundRecord(response.data);

      setDetailState({
        error: "",
        loading: false,
        open: true,
        refund: detailRefund || refund,
      });
    } catch (error) {
      setDetailState({
        error: getErrorMessage(error, "Unable to load this refund record."),
        loading: false,
        open: true,
        refund,
      });
    }
  };

  const handleCloseDetail = () => {
    setDetailState({
      error: "",
      loading: false,
      open: false,
      refund: null,
    });
  };

  /**
   * Starts the confirmation flow only for non-final refunds with valid targets.
   */
  const handleStatusRequest = (refund) => {
    const targetOptions = getStatusTargets(refund);

    if (targetOptions.length === 0) return;

    setMutationState({ error: "", loading: false, success: "" });
    setTargetStatus(targetOptions[0]);
    setStatusForm({
      adminNote: refund?.adminNote || "",
      provider: refund?.provider || "",
      providerReference: refund?.providerReference || "",
    });
    setStatusRequest({ refund });
  };

  const handleCancelStatusRequest = () => {
    if (mutationState.loading) return;
    setStatusRequest(null);
    setMutationState({ error: "", loading: false, success: "" });
  };

  /**
   * Keeps provider/note fields controlled inside the confirmation dialog.
   */
  const handleStatusFormChange = (event) => {
    const { name, value } = event.target;

    setStatusForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /**
   * Sends only the backend-supported status/provider/reference/note fields and
   * waits for confirmation before syncing list and drawer state.
   */
  const handleConfirmStatusChange = async () => {
    if (!statusRequest || !targetStatus) return;

    if (targetStatus === "REJECTED" && statusForm.adminNote.trim().length < 3) {
      setMutationState({
        error: "Add an Admin note before rejecting this refund.",
        loading: false,
        success: "",
      });
      return;
    }

    setMutationState({ error: "", loading: true, success: "" });

    const payload = {
      status: targetStatus,
    };

    if (shouldShowProviderFields(targetStatus) && statusForm.provider) {
      payload.provider = statusForm.provider;
    }

    if (
      shouldShowProviderFields(targetStatus) &&
      statusForm.providerReference.trim()
    ) {
      payload.providerReference = statusForm.providerReference.trim();
    }

    if (statusForm.adminNote.trim()) {
      payload.adminNote = statusForm.adminNote.trim();
    }

    try {
      const response = await adminService.updateRefundStatus(
        statusRequest.refund.id,
        payload
      );
      const updatedRefund = normalizeRefundRecord(response.data);
      const successReference = getRefundReference(
        updatedRefund || statusRequest.refund
      );

      if (updatedRefund) {
        setRefundState((current) => ({
          ...current,
          refunds: mergeUpdatedRefund(current.refunds, updatedRefund),
        }));

        setDetailState((current) => ({
          ...current,
          refund:
            current.refund &&
            String(current.refund.id) === String(updatedRefund.id)
              ? { ...current.refund, ...updatedRefund }
              : current.refund,
        }));
      }

      setStatusRequest(null);
      setMutationState({
        error: "",
        loading: false,
        success: `${successReference} was updated to ${formatEnum(targetStatus)}.`,
      });

      /* Refetch after local sync so active status filters remain authoritative
         if the updated refund no longer belongs in the current queue. */
      setReloadToken((current) => current + 1);
    } catch (error) {
      setMutationState({
        error: getErrorMessage(error, "Unable to update this refund status."),
        loading: false,
        success: "",
      });
    }
  };

  return (
    <section
      className="elite-admin-refunds"
      aria-labelledby="admin-refunds-title"
    >
      <header className="elite-admin-refunds__header">
        <div>
          <span>Recovery operations</span>
          <h2 id="admin-refunds-title">Refunds</h2>
          <p>
            Review refund requests, payment linkage, guest recovery context,
            processing state, and settlement outcome with calm financial
            oversight.
          </p>
        </div>
        <aside aria-label="Loaded refund count">
          <WalletCards size={22} aria-hidden="true" />
          <strong>{totalLabel}</strong>
          <small>Live refund records</small>
        </aside>
      </header>

      <form
        className="elite-admin-refunds__filters"
        onSubmit={handleFilterSubmit}
      >
        <div className="elite-admin-refunds__filter-row elite-admin-refunds__filter-row--primary">
          <div className="elite-admin-refunds__search-field">
            <Search size={17} aria-hidden="true" />
            <label htmlFor="admin-refund-search">Search refunds</label>
            <input
              id="admin-refund-search"
              name="search"
              onChange={handleFilterChange}
              placeholder="Refund, payment, requester, or property"
              type="search"
              value={pendingFilters.search}
            />
          </div>

          <label className="elite-admin-refunds__select-field">
            <span>Status</span>
            <select
              name="status"
              onChange={handleFilterChange}
              value={pendingFilters.status}
            >
              <option value="">All statuses</option>
              {refundStatuses.map((status) => (
                <option key={status} value={status}>
                  {formatEnum(status)}
                </option>
              ))}
            </select>
          </label>

          <div className="elite-admin-refunds__filter-actions">
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
        </div>

        <div className="elite-admin-refunds__filter-row elite-admin-refunds__filter-row--secondary">
          <label className="elite-admin-refunds__input-field">
            <span>Booking ID</span>
            <input
              inputMode="numeric"
              name="bookingId"
              onChange={handleFilterChange}
              placeholder="Optional"
              type="text"
              value={pendingFilters.bookingId}
            />
          </label>

          <label className="elite-admin-refunds__input-field">
            <span>Payment ID</span>
            <input
              inputMode="numeric"
              name="paymentId"
              onChange={handleFilterChange}
              placeholder="Optional"
              type="text"
              value={pendingFilters.paymentId}
            />
          </label>

          <label className="elite-admin-refunds__input-field">
            <span>Requested By ID</span>
            <input
              inputMode="numeric"
              name="requestedById"
              onChange={handleFilterChange}
              placeholder="Optional"
              type="text"
              value={pendingFilters.requestedById}
            />
          </label>
        </div>
      </form>

      {filterError && (
        <div className="elite-admin-refunds__feedback is-error" role="alert">
          <AlertTriangle size={17} aria-hidden="true" />
          {filterError}
        </div>
      )}
      {mutationState.error && !statusRequest && (
        <div className="elite-admin-refunds__feedback is-error" role="alert">
          <AlertTriangle size={17} aria-hidden="true" />
          {mutationState.error}
        </div>
      )}
      {mutationState.success && (
        <div className="elite-admin-refunds__feedback is-success" role="status">
          <CheckCircle2 size={17} aria-hidden="true" />
          {mutationState.success}
        </div>
      )}

      <section
        className="elite-admin-refunds__ledger"
        aria-label="Refund ledger"
      >
        <div className="elite-admin-refunds__ledger-heading">
          <div>
            <span>Recovery queue</span>
            <h3>Refund records</h3>
          </div>
          <button
            aria-label="Refresh refund ledger"
            disabled={refundState.loading}
            onClick={handleRetry}
            type="button"
          >
            <RefreshCw size={16} aria-hidden="true" />
            Refresh
          </button>
        </div>

        {refundState.loading && (
          <div
            className="elite-admin-refunds__skeleton"
            aria-label="Loading refunds"
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <span key={index} />
            ))}
          </div>
        )}

        {!refundState.loading && refundState.error && (
          <div className="elite-admin-refunds__empty-state" role="alert">
            <AlertTriangle size={24} aria-hidden="true" />
            <h3>Unable to load refunds</h3>
            <p>{refundState.error}</p>
            <button onClick={handleRetry} type="button">
              Retry
            </button>
          </div>
        )}

        {!refundState.loading &&
          !refundState.error &&
          refundState.refunds.length === 0 && (
            <div className="elite-admin-refunds__empty-state" role="status">
              <WalletCards size={24} aria-hidden="true" />
              <h3>{hasActiveFilters ? "No matching refunds" : "No refunds yet"}</h3>
              <p>
                {hasActiveFilters
                  ? "No refund matched the current backend filters."
                  : "The backend returned an empty refund queue."}
              </p>
              {hasActiveFilters && (
                <button onClick={handleClearFilters} type="button">
                  Clear filters
                </button>
              )}
            </div>
          )}

        {!refundState.loading &&
          !refundState.error &&
          refundState.refunds.length > 0 && (
            <>
              <div
                className="elite-admin-refunds__list elite-admin-refunds__list--desktop"
                role="list"
              >
                {refundState.refunds.map((refund) => (
                  <RefundLedgerRow
                    key={refund.id}
                    refund={refund}
                    onInspect={handleOpenDetail}
                    onStatusRequest={handleStatusRequest}
                  />
                ))}
              </div>

              <div className="elite-admin-refunds__mobile-list" role="list">
                {refundState.refunds.map((refund) => (
                  <RefundMobileCard
                    key={refund.id}
                    refund={refund}
                    onInspect={handleOpenDetail}
                    onStatusRequest={handleStatusRequest}
                  />
                ))}
              </div>
            </>
          )}
      </section>

      {detailState.open && (
        <RefundDetailDrawer
          detailState={detailState}
          onClose={handleCloseDetail}
          onStatusRequest={handleStatusRequest}
        />
      )}

      <StatusMutationModal
        form={statusForm}
        error={mutationState.error}
        loading={mutationState.loading}
        onCancel={handleCancelStatusRequest}
        onConfirm={handleConfirmStatusChange}
        onFormChange={handleStatusFormChange}
        onTargetChange={setTargetStatus}
        request={statusRequest}
        targetStatus={targetStatus}
      />
    </section>
  );
}
