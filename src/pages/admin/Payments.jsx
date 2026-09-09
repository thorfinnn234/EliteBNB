import {
  AlertTriangle,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  Mail,
  MapPin,
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
import "./Payments.css";

const emptyFilters = {
  bookingId: "",
  guestId: "",
  hostId: "",
  propertyId: "",
  provider: "",
  search: "",
  status: "",
};

const initialPaymentState = {
  error: "",
  loading: true,
  payments: [],
};

const paymentStatuses = ["PENDING", "SUCCESS", "FAILED"];
const paymentMutationTargets = ["PENDING", "FAILED"];
const paymentProviders = ["PAYSTACK"];

const idFilterLabels = {
  bookingId: "Booking ID",
  guestId: "Guest ID",
  hostId: "Host ID",
  propertyId: "Property ID",
};

/**
 * Builds the Admin payment query from only reliable backend-supported filters.
 * Date filters are intentionally omitted from this UI because the backend
 * currently accepts from/to but does not apply them.
 */
function buildPaymentQuery(filters) {
  return Object.entries(filters).reduce((query, [key, value]) => {
    const trimmedValue = String(value || "").trim();

    if (trimmedValue) {
      query[key] = trimmedValue;
    }

    return query;
  }, {});
}

/**
 * Finds optional numeric filters that contain non-numeric input.
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
 * if the backend later nests payment records under a collection key.
 */
function normalizePaymentList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.payments)) return payload.payments;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;

  return [];
}

/**
 * Normalizes one AdminPaymentResponse from GET /admin/payments/{id}.
 */
function normalizePaymentRecord(payload) {
  if (!payload) return null;
  if (payload.payment) return payload.payment;
  if (payload.data && !Array.isArray(payload.data)) return payload.data;

  return payload;
}

/**
 * Pulls a safe operator-facing error message from Axios/backend failures.
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
 * enum value for requests.
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
 * Formats timestamps returned by AdminPaymentResponse.
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
 * Calculates stay length only as frontend presentation context from genuine
 * booking dates that arrive with the payment DTO.
 */
function calculateNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return null;

  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const dayMs = 1000 * 60 * 60 * 24;
  const nights = Math.round((end.getTime() - start.getTime()) / dayMs);

  return Number.isFinite(nights) && nights > 0 ? nights : null;
}

/**
 * Formats payment amounts with the actual backend currency. If currency is
 * missing, the number is shown without inventing a currency label.
 */
function formatMoney(value, currency) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return "Not recorded";

  if (!currency) {
    return new Intl.NumberFormat("en-NG", {
      maximumFractionDigits: 0,
    }).format(parsed);
  }

  try {
    return new Intl.NumberFormat("en-NG", {
      currency,
      maximumFractionDigits: 0,
      style: "currency",
    }).format(parsed);
  } catch {
    return `${currency} ${new Intl.NumberFormat("en-NG", {
      maximumFractionDigits: 0,
    }).format(parsed)}`;
  }
}

/**
 * Builds a truthful display reference from the backend reference when present.
 */
function getPaymentReference(payment) {
  if (payment?.reference) return payment.reference;
  return payment?.id ? `Payment #${payment.id}` : "Payment";
}

/**
 * Builds a concise booking label from the genuine booking id.
 */
function getBookingLabel(payment) {
  return payment?.bookingId ? `Booking #${payment.bookingId}` : "Booking not recorded";
}

/**
 * Payment rows can be updated from either detail refreshes or status mutation
 * responses without losing any existing list-only fields.
 */
function mergeUpdatedPayment(payments, updatedPayment) {
  if (!updatedPayment?.id) return payments;

  return payments.map((payment) =>
    String(payment.id) === String(updatedPayment.id)
      ? { ...payment, ...updatedPayment }
      : payment
  );
}

/**
 * Returns backend-supported manual status targets. SUCCESS is deliberately
 * excluded because Paystack verification owns successful payment state.
 */
function getManualStatusTargets(payment) {
  if (payment?.status === "SUCCESS") return [];

  return paymentMutationTargets.filter((status) => status !== payment?.status);
}

/**
 * Payment status badge with visible text so status is not communicated by color.
 */
function PaymentStatusBadge({ status }) {
  const normalizedStatus = status || "UNKNOWN";
  const Icon =
    normalizedStatus === "SUCCESS"
      ? CheckCircle2
      : normalizedStatus === "FAILED"
        ? XCircle
        : Clock3;

  return (
    <span
      className={`elite-admin-payments__badge elite-admin-payments__badge--payment-${normalizedStatus}`}
    >
      <Icon size={14} aria-hidden="true" />
      {formatEnum(normalizedStatus)}
    </span>
  );
}

/**
 * Booking lifecycle badge stays visually separate from payment state.
 */
function BookingStatusBadge({ status }) {
  const normalizedStatus = status || "UNKNOWN";

  return (
    <span
      className={`elite-admin-payments__badge elite-admin-payments__badge--booking-${normalizedStatus}`}
    >
      <CalendarClock size={14} aria-hidden="true" />
      {formatEnum(normalizedStatus)}
    </span>
  );
}

/**
 * Provider badge is metadata, not a payment-state signal.
 */
function ProviderBadge({ provider }) {
  return (
    <span className="elite-admin-payments__provider">
      <CreditCard size={14} aria-hidden="true" />
      {formatEnum(provider)}
    </span>
  );
}

/**
 * One payment ledger row. The layout emphasizes amount and settlement state
 * while keeping booking, guest, property and host context scannable.
 */
function PaymentLedgerRow({ payment, onInspect, onStatusRequest }) {
  const statusTargets = getManualStatusTargets(payment);

  return (
    <article className="elite-admin-payments__row" role="listitem">
      <div className="elite-admin-payments__reference">
        <span>Reference</span>
        <strong title={getPaymentReference(payment)}>
          {getPaymentReference(payment)}
        </strong>
        <small title={getBookingLabel(payment)}>{getBookingLabel(payment)}</small>
      </div>

      <div className="elite-admin-payments__amount">
        <span>Amount</span>
        <strong title={formatMoney(payment?.amount, payment?.currency)}>
          {formatMoney(payment?.amount, payment?.currency)}
        </strong>
        <small>{payment?.currency || "Currency not recorded"}</small>
      </div>

      <div className="elite-admin-payments__states">
        <span>Status</span>
        <PaymentStatusBadge status={payment?.status} />
        <BookingStatusBadge status={payment?.bookingStatus} />
      </div>

      <div className="elite-admin-payments__context">
        <span>Guest / property</span>
        <strong title={payment?.guestName || "Guest not recorded"}>
          {payment?.guestName || "Guest not recorded"}
        </strong>
        <small title={payment?.propertyTitle || "Property not recorded"}>
          {payment?.propertyTitle || "Property not recorded"}
        </small>
      </div>

      <div className="elite-admin-payments__context">
        <span>Host / location</span>
        <strong title={payment?.hostName || "Host not recorded"}>
          {payment?.hostName || "Host not recorded"}
        </strong>
        <small title={payment?.propertyLocation || "Location not recorded"}>
          {payment?.propertyLocation || "Location not recorded"}
        </small>
      </div>

      <div className="elite-admin-payments__meta">
        <span>Provider</span>
        <ProviderBadge provider={payment?.provider} />
        <small>
          {payment?.paidAt
            ? `Paid ${formatDate(payment.paidAt)}`
            : `Created ${formatDate(payment?.createdAt)}`}
        </small>
      </div>

      <div className="elite-admin-payments__actions">
        <button type="button" onClick={() => onInspect(payment)}>
          <Eye size={16} aria-hidden="true" />
          Inspect
        </button>
        {statusTargets.length > 0 ? (
          <button type="button" onClick={() => onStatusRequest(payment)}>
            Change status
          </button>
        ) : (
          <small>Paystack verified</small>
        )}
      </div>
    </article>
  );
}

/**
 * Mobile card keeps the payment reference, amount and status dominant without
 * squeezing the desktop finance ledger into a small viewport.
 */
function PaymentMobileCard({ payment, onInspect, onStatusRequest }) {
  const statusTargets = getManualStatusTargets(payment);

  return (
    <article className="elite-admin-payments__mobile-card" role="listitem">
      <div className="elite-admin-payments__mobile-header">
        <span title={getPaymentReference(payment)}>
          {getPaymentReference(payment)}
        </span>
        <PaymentStatusBadge status={payment?.status} />
      </div>

      <strong>{formatMoney(payment?.amount, payment?.currency)}</strong>
      <p>{getBookingLabel(payment)}</p>

      <div className="elite-admin-payments__mobile-grid">
        <span>
          <small>Guest</small>
          {payment?.guestName || "Guest not recorded"}
        </span>
        <span>
          <small>Property</small>
          {payment?.propertyTitle || "Property not recorded"}
        </span>
        <span>
          <small>Host</small>
          {payment?.hostName || "Host not recorded"}
        </span>
        <span>
          <small>Provider</small>
          {formatEnum(payment?.provider)}
        </span>
      </div>

      <div className="elite-admin-payments__mobile-statuses">
        <BookingStatusBadge status={payment?.bookingStatus} />
        <small>
          {payment?.paidAt
            ? `Paid ${formatDate(payment.paidAt)}`
            : `Created ${formatDate(payment?.createdAt)}`}
        </small>
      </div>

      <div className="elite-admin-payments__actions">
        <button type="button" onClick={() => onInspect(payment)}>
          <Eye size={16} aria-hidden="true" />
          Inspect
        </button>
        {statusTargets.length > 0 && (
          <button type="button" onClick={() => onStatusRequest(payment)}>
            Change status
          </button>
        )}
      </div>
    </article>
  );
}

/**
 * One labeled field inside the payment inspection drawer.
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
 * Detail drawer presents only AdminPaymentResponse fields. Provider internals,
 * refunds and card metadata are intentionally omitted because the backend does
 * not return them for this phase.
 */
function PaymentDetailDrawer({ detailState, onClose, onStatusRequest }) {
  const payment = detailState.payment;
  const nights = calculateNights(payment?.checkIn, payment?.checkOut);
  const statusTargets = getManualStatusTargets(payment);

  return (
    <div className="elite-admin-payments__overlay" role="presentation">
      <aside
        aria-labelledby="admin-payment-detail-title"
        aria-modal="true"
        className="elite-admin-payments__drawer"
        role="dialog"
      >
        <button
          aria-label="Close payment detail"
          className="elite-admin-payments__drawer-close"
          onClick={onClose}
          type="button"
        >
          <X size={18} aria-hidden="true" />
        </button>

        {detailState.loading && (
          <div className="elite-admin-payments__drawer-state" role="status">
            <RefreshCw size={22} aria-hidden="true" />
            Loading payment record...
          </div>
        )}

        {!detailState.loading && detailState.error && (
          <div className="elite-admin-payments__drawer-state" role="alert">
            <AlertTriangle size={22} aria-hidden="true" />
            {detailState.error}
          </div>
        )}

        {!detailState.loading && payment && (
          <>
            <header className="elite-admin-payments__drawer-header">
              <span>Payment record</span>
              <h3 id="admin-payment-detail-title">
                {getPaymentReference(payment)}
              </h3>
              <p>
                Financial oversight for this payment, its booking linkage, and
                the guest, property and host context returned by the backend.
              </p>
              <div className="elite-admin-payments__drawer-badges">
                <PaymentStatusBadge status={payment.status} />
                <ProviderBadge provider={payment.provider} />
              </div>
            </header>

            <section
              aria-label="Payment information"
              className="elite-admin-payments__detail-section"
            >
              <span>Payment</span>
              <div className="elite-admin-payments__detail-grid">
                <DetailItem label="Payment ID" value={payment.id} icon={CreditCard} />
                <DetailItem label="Reference" value={payment.reference} />
                <DetailItem
                  label="Amount"
                  value={formatMoney(payment.amount, payment.currency)}
                  icon={WalletCards}
                />
                <DetailItem label="Currency" value={payment.currency} />
                <DetailItem label="Status" value={formatEnum(payment.status)} />
                <DetailItem label="Provider" value={formatEnum(payment.provider)} icon={CreditCard} />
                <DetailItem label="Paid at" value={formatDate(payment.paidAt)} />
                <DetailItem label="Created" value={formatDate(payment.createdAt)} />
              </div>
            </section>

            <section
              aria-label="Booking information"
              className="elite-admin-payments__detail-section"
            >
              <span>Booking</span>
              <div className="elite-admin-payments__detail-grid">
                <DetailItem label="Booking ID" value={payment.bookingId} icon={CalendarClock} />
                <DetailItem label="Booking status" value={formatEnum(payment.bookingStatus)} />
                <DetailItem label="Check-in" value={formatDate(payment.checkIn)} icon={CalendarClock} />
                <DetailItem label="Check-out" value={formatDate(payment.checkOut)} icon={CalendarClock} />
                <DetailItem
                  label="Derived stay length"
                  value={
                    nights
                      ? `${nights} night${nights === 1 ? "" : "s"}`
                      : "Not derived"
                  }
                  icon={Clock3}
                />
              </div>
            </section>

            <section
              aria-label="Guest information"
              className="elite-admin-payments__detail-section"
            >
              <span>Guest</span>
              <div className="elite-admin-payments__detail-grid">
                <DetailItem label="Guest ID" value={payment.guestId} icon={UserRound} />
                <DetailItem label="Guest name" value={payment.guestName} />
                <DetailItem label="Guest email" value={payment.guestEmail} icon={Mail} />
              </div>
            </section>

            <section
              aria-label="Property information"
              className="elite-admin-payments__detail-section"
            >
              <span>Property</span>
              <div className="elite-admin-payments__detail-grid">
                <DetailItem label="Property ID" value={payment.propertyId} icon={Building2} />
                <DetailItem label="Property title" value={payment.propertyTitle} />
                <DetailItem label="Location" value={payment.propertyLocation} icon={MapPin} />
              </div>
            </section>

            <section
              aria-label="Host information"
              className="elite-admin-payments__detail-section"
            >
              <span>Host</span>
              <div className="elite-admin-payments__detail-grid">
                <DetailItem label="Host ID" value={payment.hostId} icon={UserRound} />
                <DetailItem label="Host name" value={payment.hostName} />
                <DetailItem label="Host email" value={payment.hostEmail} icon={Mail} />
              </div>
            </section>

            <section className="elite-admin-payments__status-panel">
              <span>Status governance</span>
              {payment.status === "SUCCESS" ? (
                <p>
                  Successful payments are verified through Paystack and cannot
                  be manually set or changed by Admin from this workspace.
                </p>
              ) : (
                <>
                  <p>
                    Admin can only move this payment between Pending and Failed.
                    Payment success must come from Paystack verification.
                  </p>
                  {statusTargets.length > 0 && (
                    <button type="button" onClick={() => onStatusRequest(payment)}>
                      Change payment status
                    </button>
                  )}
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
 * Confirmation modal protects financial status changes from accidental clicks.
 * It sends only the backend-supported status body and never offers SUCCESS.
 */
function StatusMutationModal({
  error,
  loading,
  onCancel,
  onConfirm,
  onTargetChange,
  request,
  targetStatus,
}) {
  if (!request) return null;

  const targetOptions = getManualStatusTargets(request.payment);
  const seriousFailureState = targetStatus === "FAILED";

  return (
    <div className="elite-admin-payments__confirm-overlay" role="presentation">
      <section
        aria-labelledby="admin-payment-status-title"
        aria-modal="true"
        className="elite-admin-payments__confirm"
        role="dialog"
      >
        <span className="elite-admin-payments__confirm-icon" aria-hidden="true">
          {seriousFailureState ? <XCircle size={23} /> : <Clock3 size={23} />}
        </span>
        <h3 id="admin-payment-status-title">Change payment status?</h3>
        <p>
          {getPaymentReference(request.payment)} is currently{" "}
          {formatEnum(request.payment?.status)}. Choose one backend-supported
          Admin status target.
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

        <p>
          SUCCESS is intentionally unavailable here. Successful payment state is
          established by Paystack verification, not manual Admin action.
        </p>

        {error && (
          <div className="elite-admin-payments__confirm-error" role="alert">
            <AlertTriangle size={16} aria-hidden="true" />
            {error}
          </div>
        )}

        <div className="elite-admin-payments__confirm-actions">
          <button disabled={loading} onClick={onCancel} type="button">
            Keep current status
          </button>
          <button
            className={seriousFailureState ? "is-failed" : "is-pending"}
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
 * Phase 7 Admin Payments workspace.
 * It uses the finalized financial oversight endpoints and keeps Paystack
 * success verification, refunds and provider internals out of scope.
 */
export default function Payments() {
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [detailState, setDetailState] = useState({
    error: "",
    loading: false,
    open: false,
    payment: null,
  });
  const [filterError, setFilterError] = useState("");
  const [mutationState, setMutationState] = useState({
    error: "",
    loading: false,
    success: "",
  });
  const [paymentState, setPaymentState] = useState(initialPaymentState);
  const [pendingFilters, setPendingFilters] = useState(emptyFilters);
  const [reloadToken, setReloadToken] = useState(0);
  const [statusRequest, setStatusRequest] = useState(null);
  const [targetStatus, setTargetStatus] = useState("FAILED");

  const hasActiveFilters = useMemo(
    () => Object.values(appliedFilters).some((value) => String(value).trim()),
    [appliedFilters]
  );
  const totalLabel = paymentState.loading
    ? "Loading payments"
    : `${paymentState.payments.length} ${
        paymentState.payments.length === 1 ? "payment" : "payments"
      }${hasActiveFilters ? " matching filters" : ""}`;

  useBodyScrollLock(detailState.open || Boolean(statusRequest));

  useEffect(() => {
    let active = true;

    /**
     * Loads the current financial ledger with only the applied, supported
     * backend query parameters.
     */
    async function loadPayments() {
      try {
        const response = await adminService.getPayments(
          buildPaymentQuery(appliedFilters)
        );

        if (!active) return;

        setPaymentState({
          error: "",
          loading: false,
          payments: normalizePaymentList(response.data),
        });
      } catch (error) {
        if (!active) return;

        setPaymentState({
          error: getErrorMessage(error, "Unable to load Admin payment records."),
          loading: false,
          payments: [],
        });
      }
    }

    loadPayments();

    return () => {
      active = false;
    };
  }, [appliedFilters, reloadToken]);

  /**
   * Applies filters explicitly after lightweight ID validation. Search is sent
   * as typed apart from whitespace trimming inside buildPaymentQuery.
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
    setPaymentState((current) => ({ ...current, error: "", loading: true }));
    setAppliedFilters({ ...pendingFilters });
  };

  /**
   * Keeps toolbar changes local until the operator applies them.
   */
  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setPendingFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /**
   * Clears both visible filter inputs and the backend query state.
   */
  const handleClearFilters = () => {
    setPendingFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setFilterError("");
    setMutationState({ error: "", loading: false, success: "" });
    setPaymentState((current) => ({ ...current, error: "", loading: true }));
  };

  /**
   * Retries the current payment query without changing the active filters.
   */
  const handleRetry = () => {
    setFilterError("");
    setMutationState({ error: "", loading: false, success: "" });
    setPaymentState((current) => ({ ...current, error: "", loading: true }));
    setReloadToken((current) => current + 1);
  };

  /**
   * Opens the drawer with row data immediately and then hydrates it with the
   * authoritative detail endpoint.
   */
  const handleOpenDetail = async (payment) => {
    setDetailState({
      error: "",
      loading: true,
      open: true,
      payment,
    });

    try {
      const response = await adminService.getPaymentById(payment.id);
      const detailPayment = normalizePaymentRecord(response.data);

      setDetailState({
        error: "",
        loading: false,
        open: true,
        payment: detailPayment || payment,
      });
    } catch (error) {
      setDetailState({
        error: getErrorMessage(error, "Unable to load this payment record."),
        loading: false,
        open: true,
        payment,
      });
    }
  };

  const handleCloseDetail = () => {
    setDetailState({
      error: "",
      loading: false,
      open: false,
      payment: null,
    });
  };

  /**
   * Starts the mutation flow only when the payment has a legitimate Admin target.
   */
  const handleStatusRequest = (payment) => {
    const targetOptions = getManualStatusTargets(payment);

    if (targetOptions.length === 0) return;

    setMutationState({ error: "", loading: false, success: "" });
    setTargetStatus(targetOptions[0]);
    setStatusRequest({ payment });
  };

  const handleCancelStatusRequest = () => {
    if (mutationState.loading) return;
    setStatusRequest(null);
    setMutationState({ error: "", loading: false, success: "" });
  };

  /**
   * Sends the exact supported PATCH body and waits for the backend before
   * updating the ledger, drawer and success feedback.
   */
  const handleConfirmStatusChange = async () => {
    if (!statusRequest || !targetStatus) return;

    setMutationState({ error: "", loading: true, success: "" });

    try {
      const response = await adminService.updatePaymentStatus(
        statusRequest.payment.id,
        { status: targetStatus }
      );
      const updatedPayment = normalizePaymentRecord(response.data);
      const successReference = getPaymentReference(
        updatedPayment || statusRequest.payment
      );

      if (updatedPayment) {
        setPaymentState((current) => ({
          ...current,
          payments: mergeUpdatedPayment(current.payments, updatedPayment),
        }));

        setDetailState((current) => ({
          ...current,
          payment:
            current.payment &&
            String(current.payment.id) === String(updatedPayment.id)
              ? { ...current.payment, ...updatedPayment }
              : current.payment,
        }));
      }

      setStatusRequest(null);
      setMutationState({
        error: "",
        loading: false,
        success: `${successReference} was updated to ${formatEnum(targetStatus)}.`,
      });

      /* A refetch keeps active backend filters authoritative if the changed
         payment no longer belongs in the current filtered ledger. */
      setReloadToken((current) => current + 1);
    } catch (error) {
      setMutationState({
        error: getErrorMessage(error, "Unable to update this payment status."),
        loading: false,
        success: "",
      });
    }
  };

  return (
    <section
      className="elite-admin-payments"
      aria-labelledby="admin-payments-title"
    >
      <header className="elite-admin-payments__header">
        <div>
          <span>Financial operations</span>
          <h2 id="admin-payments-title">Payments</h2>
          <p>
            Review EliteBNB payment records, booking linkage, guest and host
            context, and payment state without exposing unsupported settlement
            actions.
          </p>
        </div>
        <aside aria-label="Loaded payment count">
          <WalletCards size={22} aria-hidden="true" />
          <strong>{totalLabel}</strong>
          <small>Live payment records</small>
        </aside>
      </header>

      <form
        className="elite-admin-payments__filters"
        onSubmit={handleFilterSubmit}
      >
        <div className="elite-admin-payments__filter-row elite-admin-payments__filter-row--primary">
          <div className="elite-admin-payments__search-field">
            <Search size={17} aria-hidden="true" />
            <label htmlFor="admin-payment-search">Search payments</label>
            <input
              id="admin-payment-search"
              name="search"
              onChange={handleFilterChange}
              placeholder="Reference, guest, property, or host"
              type="search"
              value={pendingFilters.search}
            />
          </div>

          <label className="elite-admin-payments__select-field">
            <span>Status</span>
            <select
              name="status"
              onChange={handleFilterChange}
              value={pendingFilters.status}
            >
              <option value="">All statuses</option>
              {paymentStatuses.map((status) => (
                <option key={status} value={status}>
                  {formatEnum(status)}
                </option>
              ))}
            </select>
          </label>

          <label className="elite-admin-payments__select-field">
            <span>Provider</span>
            <select
              name="provider"
              onChange={handleFilterChange}
              value={pendingFilters.provider}
            >
              <option value="">All providers</option>
              {paymentProviders.map((provider) => (
                <option key={provider} value={provider}>
                  {formatEnum(provider)}
                </option>
              ))}
            </select>
          </label>

          <div className="elite-admin-payments__filter-actions">
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

        <div className="elite-admin-payments__filter-row elite-admin-payments__filter-row--secondary">
          <label className="elite-admin-payments__input-field">
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

          <label className="elite-admin-payments__input-field">
            <span>Guest ID</span>
            <input
              inputMode="numeric"
              name="guestId"
              onChange={handleFilterChange}
              placeholder="Optional"
              type="text"
              value={pendingFilters.guestId}
            />
          </label>

          <label className="elite-admin-payments__input-field">
            <span>Property ID</span>
            <input
              inputMode="numeric"
              name="propertyId"
              onChange={handleFilterChange}
              placeholder="Optional"
              type="text"
              value={pendingFilters.propertyId}
            />
          </label>

          <label className="elite-admin-payments__input-field">
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
        </div>
      </form>

      {filterError && (
        <div className="elite-admin-payments__feedback is-error" role="alert">
          <AlertTriangle size={17} aria-hidden="true" />
          {filterError}
        </div>
      )}
      {mutationState.error && !statusRequest && (
        <div className="elite-admin-payments__feedback is-error" role="alert">
          <AlertTriangle size={17} aria-hidden="true" />
          {mutationState.error}
        </div>
      )}
      {mutationState.success && (
        <div className="elite-admin-payments__feedback is-success" role="status">
          <CheckCircle2 size={17} aria-hidden="true" />
          {mutationState.success}
        </div>
      )}

      <section
        className="elite-admin-payments__ledger"
        aria-label="Payment ledger"
      >
        <div className="elite-admin-payments__ledger-heading">
          <div>
            <span>Settlement ledger</span>
            <h3>Payment records</h3>
          </div>
          <button
            aria-label="Refresh payment ledger"
            disabled={paymentState.loading}
            onClick={handleRetry}
            type="button"
          >
            <RefreshCw size={16} aria-hidden="true" />
            Refresh
          </button>
        </div>

        {paymentState.loading && (
          <div
            className="elite-admin-payments__skeleton"
            aria-label="Loading payments"
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <span key={index} />
            ))}
          </div>
        )}

        {!paymentState.loading && paymentState.error && (
          <div className="elite-admin-payments__empty-state" role="alert">
            <AlertTriangle size={24} aria-hidden="true" />
            <h3>Unable to load payments</h3>
            <p>{paymentState.error}</p>
            <button onClick={handleRetry} type="button">
              Retry
            </button>
          </div>
        )}

        {!paymentState.loading &&
          !paymentState.error &&
          paymentState.payments.length === 0 && (
            <div className="elite-admin-payments__empty-state" role="status">
              <WalletCards size={24} aria-hidden="true" />
              <h3>{hasActiveFilters ? "No matching payments" : "No payments yet"}</h3>
              <p>
                {hasActiveFilters
                  ? "No payment matched the current backend filters."
                  : "The backend returned an empty payment ledger."}
              </p>
              {hasActiveFilters && (
                <button onClick={handleClearFilters} type="button">
                  Clear filters
                </button>
              )}
            </div>
          )}

        {!paymentState.loading &&
          !paymentState.error &&
          paymentState.payments.length > 0 && (
            <>
              <div
                className="elite-admin-payments__list elite-admin-payments__list--desktop"
                role="list"
              >
                {paymentState.payments.map((payment) => (
                  <PaymentLedgerRow
                    key={payment.id}
                    payment={payment}
                    onInspect={handleOpenDetail}
                    onStatusRequest={handleStatusRequest}
                  />
                ))}
              </div>

              <div className="elite-admin-payments__mobile-list" role="list">
                {paymentState.payments.map((payment) => (
                  <PaymentMobileCard
                    key={payment.id}
                    payment={payment}
                    onInspect={handleOpenDetail}
                    onStatusRequest={handleStatusRequest}
                  />
                ))}
              </div>
            </>
          )}
      </section>

      {detailState.open && (
        <PaymentDetailDrawer
          detailState={detailState}
          onClose={handleCloseDetail}
          onStatusRequest={handleStatusRequest}
        />
      )}

      <StatusMutationModal
        error={mutationState.error}
        loading={mutationState.loading}
        onCancel={handleCancelStatusRequest}
        onConfirm={handleConfirmStatusChange}
        onTargetChange={setTargetStatus}
        request={statusRequest}
        targetStatus={targetStatus}
      />
    </section>
  );
}
