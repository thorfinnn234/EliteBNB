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
  Users as GuestsIcon,
  WalletCards,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { adminService } from "../../services/adminService";
import "./Bookings.css";

const emptyFilters = {
  from: "",
  guestId: "",
  hostId: "",
  propertyId: "",
  search: "",
  status: "",
  to: "",
};

const initialBookingState = {
  bookings: [],
  error: "",
  loading: true,
};

const bookingStatuses = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];

const idFilterLabels = {
  guestId: "Guest ID",
  hostId: "Host ID",
  propertyId: "Property ID",
};

const nairaFormatter = new Intl.NumberFormat("en-NG", {
  currency: "NGN",
  maximumFractionDigits: 0,
  style: "currency",
});

/**
 * Builds the Admin booking query from only the backend-supported filters.
 * Numeric ID filters are validated before this runs so meaningless values are
 * not sent to the API.
 */
function buildBookingQuery(filters) {
  return Object.entries(filters).reduce((query, [key, value]) => {
    const trimmedValue = String(value || "").trim();

    if (trimmedValue) {
      query[key] = trimmedValue;
    }

    return query;
  }, {});
}

/**
 * Finds optional ID filters that are present but not numeric.
 * The backend owns authorization and data rules; this only prevents accidental
 * requests like "abc" in an ID field.
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
 * Keeps the date-range fields coherent before a backend request.
 */
function getDateRangeError(filters) {
  if (!filters.from || !filters.to) return "";

  const fromDate = new Date(filters.from);
  const toDate = new Date(filters.to);

  if (
    Number.isNaN(fromDate.getTime()) ||
    Number.isNaN(toDate.getTime()) ||
    fromDate <= toDate
  ) {
    return "";
  }

  return "The start date must be before the end date.";
}

/**
 * Accepts the finalized array response while tolerating a conventional wrapper
 * if the backend later nests records under a collection key.
 */
function normalizeBookingList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.bookings)) return payload.bookings;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;

  return [];
}

/**
 * Normalizes one AdminBookingResponse from GET /admin/bookings/{id}.
 * The page displays only fields defined by that DTO.
 */
function normalizeBookingRecord(payload) {
  if (!payload) return null;
  if (payload.booking) return payload.booking;
  if (payload.data && !Array.isArray(payload.data)) return payload.data;

  return payload;
}

/**
 * Pulls an operator-safe message from Axios/backend failures.
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
 * Converts enum values into readable labels while preserving backend enum
 * values for PATCH requests.
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
 * Formats backend timestamps for the reservation ledger.
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
 * Builds a concise date range from genuine check-in/check-out values.
 */
function formatStayDates(booking) {
  return `${formatDate(booking?.checkIn)} - ${formatDate(booking?.checkOut)}`;
}

/**
 * Calculates nights strictly as presentation context from genuine dates.
 * The derived value is never sent back to the booking API.
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
 * Formats genuine currency amounts. Reservation totals default to Nigerian
 * Naira, while linked payment values use paymentCurrency when provided.
 */
function formatMoney(value, currency = "NGN") {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return "Not recorded";

  try {
    return new Intl.NumberFormat("en-NG", {
      currency: currency || "NGN",
      maximumFractionDigits: 0,
      style: "currency",
    }).format(parsed);
  } catch {
    return nairaFormatter.format(parsed);
  }
}

/**
 * Displays a truthful booking reference derived directly from the backend id.
 */
function getBookingReference(booking) {
  return booking?.id ? `Booking #${booking.id}` : "Booking";
}

/**
 * Updates one booking after a successful detail refresh or status mutation.
 */
function mergeUpdatedBooking(bookings, updatedBooking) {
  if (!updatedBooking?.id) return bookings;

  return bookings.map((booking) =>
    String(booking.id) === String(updatedBooking.id)
      ? { ...booking, ...updatedBooking }
      : booking
  );
}

/**
 * Booking lifecycle badge. The text label remains visible so meaning is not
 * conveyed by color alone.
 */
function BookingStatusBadge({ status }) {
  const normalizedStatus = status || "UNKNOWN";
  const Icon =
    normalizedStatus === "CONFIRMED"
      ? CheckCircle2
      : normalizedStatus === "CANCELLED"
        ? XCircle
        : normalizedStatus === "COMPLETED"
          ? CalendarClock
          : Clock3;

  return (
    <span
      className={`elite-admin-bookings__badge elite-admin-bookings__badge--booking-${normalizedStatus}`}
    >
      <Icon size={14} aria-hidden="true" />
      {formatEnum(normalizedStatus)}
    </span>
  );
}

/**
 * Linked payment badge is intentionally separate from booking lifecycle state.
 * This page reads payment context but never mutates payment status.
 */
function PaymentStatusBadge({ status }) {
  const normalizedStatus = status || "UNKNOWN";

  return (
    <span
      className={`elite-admin-bookings__badge elite-admin-bookings__badge--payment-${normalizedStatus}`}
    >
      <CreditCard size={14} aria-hidden="true" />
      {formatEnum(normalizedStatus)}
    </span>
  );
}

/**
 * One desktop ledger row. No property imagery is requested because
 * AdminBookingResponse does not include coverImageUrl.
 */
function BookingLedgerRow({ booking, onInspect, onStatusRequest }) {
  const nights = calculateNights(booking?.checkIn, booking?.checkOut);

  return (
    <tr>
      <td>
        <div className="elite-admin-bookings__reference">
          <span title={getBookingReference(booking)}>
            {getBookingReference(booking)}
          </span>
          <small>Created {formatDate(booking?.createdAt)}</small>
        </div>
      </td>
      <td>
        <div className="elite-admin-bookings__property">
          <strong title={booking?.propertyTitle || "Untitled property"}>
            {booking?.propertyTitle || "Untitled property"}
          </strong>
          <small title={booking?.propertyLocation || "Location not recorded"}>
            <MapPin size={14} aria-hidden="true" />
            {booking?.propertyLocation || "Location not recorded"}
          </small>
        </div>
      </td>
      <td>
        <div className="elite-admin-bookings__person">
          <strong title={booking?.guestName || "Guest not recorded"}>
            {booking?.guestName || "Guest not recorded"}
          </strong>
          <small title={booking?.guestEmail || "No guest email"}>
            {booking?.guestEmail || "No guest email"}
          </small>
        </div>
      </td>
      <td>
        <div className="elite-admin-bookings__dates">
          <strong title={formatStayDates(booking)}>
            {formatStayDates(booking)}
          </strong>
          <small>
            {nights ? `${nights} night${nights === 1 ? "" : "s"}` : "Nights not derived"} ·{" "}
            {booking?.guests || "No"} guest{booking?.guests === 1 ? "" : "s"}
          </small>
        </div>
      </td>
      <td>
        <div className="elite-admin-bookings__amount">
          <strong title={formatMoney(booking?.totalAmount)}>
            {formatMoney(booking?.totalAmount)}
          </strong>
          <small title={booking?.hostName || "Host not recorded"}>
            {booking?.hostName || "Host not recorded"}
          </small>
        </div>
      </td>
      <td>
        <div className="elite-admin-bookings__status-stack">
          <BookingStatusBadge status={booking?.status} />
          <PaymentStatusBadge status={booking?.paymentStatus} />
        </div>
      </td>
      <td>
        <div className="elite-admin-bookings__actions">
          <button type="button" onClick={() => onInspect(booking)}>
            <Eye size={16} aria-hidden="true" />
            Inspect
          </button>
          <button
            type="button"
            onClick={() => onStatusRequest(booking)}
          >
            Change status
          </button>
        </div>
      </td>
    </tr>
  );
}

/**
 * Mobile reservation card keeps operational fields readable without squeezing
 * the desktop ledger into a narrow viewport.
 */
function BookingMobileCard({ booking, onInspect, onStatusRequest }) {
  const nights = calculateNights(booking?.checkIn, booking?.checkOut);

  return (
    <article className="elite-admin-bookings__mobile-card">
      <div className="elite-admin-bookings__mobile-header">
        <span>{getBookingReference(booking)}</span>
        <BookingStatusBadge status={booking?.status} />
      </div>
      <h3>{booking?.propertyTitle || "Untitled property"}</h3>
      <p>
        <MapPin size={15} aria-hidden="true" />
        {booking?.propertyLocation || "Location not recorded"}
      </p>
      <div className="elite-admin-bookings__mobile-grid">
        <span>
          <small>Guest</small>
          {booking?.guestName || "Guest not recorded"}
        </span>
        <span>
          <small>Dates</small>
          {formatStayDates(booking)}
        </span>
        <span>
          <small>Stay</small>
          {nights ? `${nights} night${nights === 1 ? "" : "s"}` : "Not derived"} ·{" "}
          {booking?.guests || "No"} guest{booking?.guests === 1 ? "" : "s"}
        </span>
        <span>
          <small>Total</small>
          {formatMoney(booking?.totalAmount)}
        </span>
      </div>
      <PaymentStatusBadge status={booking?.paymentStatus} />
      <div className="elite-admin-bookings__actions">
        <button type="button" onClick={() => onInspect(booking)}>
          <Eye size={16} aria-hidden="true" />
          Inspect
        </button>
        <button type="button" onClick={() => onStatusRequest(booking)}>
          Change status
        </button>
      </div>
    </article>
  );
}

/**
 * One labeled DTO field inside the booking inspection drawer.
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
 * Detail drawer presents the authoritative AdminBookingResponse and keeps
 * booking lifecycle controls separate from read-only payment information.
 */
function BookingDetailDrawer({
  detailState,
  onClose,
  onStatusRequest,
}) {
  const booking = detailState.booking;
  const nights = calculateNights(booking?.checkIn, booking?.checkOut);

  return (
    <div className="elite-admin-bookings__overlay" role="presentation">
      <aside
        aria-labelledby="admin-booking-detail-title"
        aria-modal="true"
        className="elite-admin-bookings__drawer"
        role="dialog"
      >
        <button
          aria-label="Close booking detail"
          className="elite-admin-bookings__drawer-close"
          onClick={onClose}
          type="button"
        >
          <X size={18} aria-hidden="true" />
        </button>

        {detailState.loading && (
          <div className="elite-admin-bookings__drawer-state" role="status">
            <RefreshCw size={22} aria-hidden="true" />
            Loading booking record...
          </div>
        )}

        {!detailState.loading && detailState.error && (
          <div className="elite-admin-bookings__drawer-state" role="alert">
            <AlertTriangle size={22} aria-hidden="true" />
            {detailState.error}
          </div>
        )}

        {!detailState.loading && booking && (
          <>
            <header className="elite-admin-bookings__drawer-header">
              <span>Reservation record</span>
              <h3 id="admin-booking-detail-title">
                {getBookingReference(booking)}
              </h3>
              <p>
                Administrative oversight for this reservation lifecycle and its
                linked read-only payment state.
              </p>
              <div className="elite-admin-bookings__drawer-badges">
                <BookingStatusBadge status={booking.status} />
                <PaymentStatusBadge status={booking.paymentStatus} />
              </div>
            </header>

            <section
              aria-label="Reservation information"
              className="elite-admin-bookings__detail-section"
            >
              <span>Reservation</span>
              <div className="elite-admin-bookings__detail-grid">
                <DetailItem label="Booking ID" value={booking.id} />
                <DetailItem label="Status" value={formatEnum(booking.status)} />
                <DetailItem label="Check-in" value={formatDate(booking.checkIn)} icon={CalendarClock} />
                <DetailItem label="Check-out" value={formatDate(booking.checkOut)} icon={CalendarClock} />
                <DetailItem
                  label="Derived stay length"
                  value={
                    nights
                      ? `${nights} night${nights === 1 ? "" : "s"}`
                      : "Not derived"
                  }
                  icon={Clock3}
                />
                <DetailItem label="Guests" value={booking.guests} icon={GuestsIcon} />
                <DetailItem label="Reservation total" value={formatMoney(booking.totalAmount)} icon={WalletCards} />
                <DetailItem label="Created" value={formatDate(booking.createdAt)} />
                <DetailItem label="Updated" value={formatDate(booking.updatedAt)} />
              </div>
            </section>

            <section
              aria-label="Property information"
              className="elite-admin-bookings__detail-section"
            >
              <span>Property</span>
              <div className="elite-admin-bookings__detail-grid">
                <DetailItem label="Property ID" value={booking.propertyId} icon={Building2} />
                <DetailItem label="Property title" value={booking.propertyTitle} />
                <DetailItem label="Location" value={booking.propertyLocation} icon={MapPin} />
              </div>
            </section>

            <section
              aria-label="Guest information"
              className="elite-admin-bookings__detail-section"
            >
              <span>Guest</span>
              <div className="elite-admin-bookings__detail-grid">
                <DetailItem label="Guest ID" value={booking.guestId} icon={UserRound} />
                <DetailItem label="Guest name" value={booking.guestName} />
                <DetailItem label="Guest email" value={booking.guestEmail} icon={Mail} />
              </div>
            </section>

            <section
              aria-label="Host information"
              className="elite-admin-bookings__detail-section"
            >
              <span>Host</span>
              <div className="elite-admin-bookings__detail-grid">
                <DetailItem label="Host ID" value={booking.hostId} icon={UserRound} />
                <DetailItem label="Host name" value={booking.hostName} />
                <DetailItem label="Host email" value={booking.hostEmail} icon={Mail} />
              </div>
            </section>

            <section
              aria-label="Read-only payment information"
              className="elite-admin-bookings__detail-section"
            >
              <span>Payment</span>
              <p>
                Payment fields are shown for reservation context only. Payment
                actions belong to the later Admin Payments and Refunds phases.
              </p>
              <div className="elite-admin-bookings__detail-grid">
                <DetailItem label="Payment ID" value={booking.paymentId} icon={CreditCard} />
                <DetailItem label="Payment status" value={formatEnum(booking.paymentStatus)} />
                <DetailItem
                  label="Payment amount"
                  value={formatMoney(booking.paymentAmount, booking.paymentCurrency)}
                  icon={WalletCards}
                />
                <DetailItem label="Payment currency" value={booking.paymentCurrency} />
              </div>
            </section>

            <section className="elite-admin-bookings__status-panel">
              <span>Booking lifecycle</span>
              <p>
                Change only the booking status here. The backend remains the
                authority for valid lifecycle updates.
              </p>
              <button type="button" onClick={() => onStatusRequest(booking)}>
                Change booking status
              </button>
            </section>
          </>
        )}
      </aside>
    </div>
  );
}

/**
 * Confirmation modal prevents casual status mutation. It does not collect
 * cancellation reasons or payment instructions because the backend contract
 * accepts only a booking status value.
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

  const destructive = targetStatus === "CANCELLED";
  const targetOptions = bookingStatuses.filter(
    (status) => status !== request.booking?.status
  );

  return (
    <div className="elite-admin-bookings__confirm-overlay" role="presentation">
      <section
        aria-labelledby="admin-booking-status-title"
        aria-modal="true"
        className="elite-admin-bookings__confirm"
        role="dialog"
      >
        <span className="elite-admin-bookings__confirm-icon" aria-hidden="true">
          {destructive ? <XCircle size={23} /> : <CalendarClock size={23} />}
        </span>
        <h3 id="admin-booking-status-title">Change booking status?</h3>
        <p>
          {getBookingReference(request.booking)} is currently{" "}
          {formatEnum(request.booking?.status)}. Choose the supported lifecycle
          state to send to the Admin booking endpoint.
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
          Payment status remains read-only on this page. No refund, payment, or
          cancellation-reason action will be sent.
        </p>

        {error && (
          <div className="elite-admin-bookings__confirm-error" role="alert">
            <AlertTriangle size={16} aria-hidden="true" />
            {error}
          </div>
        )}

        <div className="elite-admin-bookings__confirm-actions">
          <button disabled={loading} onClick={onCancel} type="button">
            Keep current status
          </button>
          <button
            className={destructive ? "is-cancelled" : "is-confirmed"}
            disabled={loading}
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
 * Phase 6 Admin Bookings workspace.
 * It uses the finalized reservation endpoints only and keeps payment data
 * strictly read-only until the later Admin Payments/Refunds phases.
 */
export default function Bookings() {
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [bookingState, setBookingState] = useState(initialBookingState);
  const [detailState, setDetailState] = useState({
    booking: null,
    error: "",
    loading: false,
    open: false,
  });
  const [filterError, setFilterError] = useState("");
  const [mutationState, setMutationState] = useState({
    error: "",
    loading: false,
    success: "",
  });
  const [pendingFilters, setPendingFilters] = useState(emptyFilters);
  const [reloadToken, setReloadToken] = useState(0);
  const [statusRequest, setStatusRequest] = useState(null);
  const [targetStatus, setTargetStatus] = useState("CONFIRMED");

  const hasActiveFilters = useMemo(
    () => Object.values(appliedFilters).some((value) => String(value).trim()),
    [appliedFilters]
  );
  const totalLabel = bookingState.loading
    ? "Loading reservations"
    : `${bookingState.bookings.length} ${
        bookingState.bookings.length === 1 ? "booking" : "bookings"
      }${hasActiveFilters ? " matching filters" : ""}`;

  useBodyScrollLock(detailState.open || Boolean(statusRequest));

  useEffect(() => {
    let active = true;

    async function loadBookings() {
      try {
        const response = await adminService.getBookings(
          buildBookingQuery(appliedFilters)
        );

        if (!active) return;

        setBookingState({
          bookings: normalizeBookingList(response.data),
          error: "",
          loading: false,
        });
      } catch (error) {
        if (!active) return;

        setBookingState({
          bookings: [],
          error: getErrorMessage(
            error,
            "Unable to load Admin reservation records."
          ),
          loading: false,
        });
      }
    }

    loadBookings();

    return () => {
      active = false;
    };
  }, [appliedFilters, reloadToken]);

  /**
   * Applies supported filters only after local ID/date validation succeeds.
   */
  const handleFilterSubmit = (event) => {
    event.preventDefault();

    const invalidIds = getInvalidIdFilters(pendingFilters);
    const dateError = getDateRangeError(pendingFilters);

    if (invalidIds.length || dateError) {
      setFilterError(
        invalidIds.length
          ? `${invalidIds.join(", ")} must be numeric.`
          : dateError
      );
      return;
    }

    setFilterError("");
    setMutationState({ error: "", loading: false, success: "" });
    setBookingState((current) => ({ ...current, error: "", loading: true }));
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
    setBookingState((current) => ({ ...current, error: "", loading: true }));
  };

  /**
   * Retries the current filtered booking request without changing filters.
   */
  const handleRetry = () => {
    setFilterError("");
    setMutationState({ error: "", loading: false, success: "" });
    setBookingState((current) => ({ ...current, error: "", loading: true }));
    setReloadToken((current) => current + 1);
  };

  /**
   * Opens with ledger data immediately, then replaces it with the authoritative
   * GET /admin/bookings/{id} response.
   */
  const handleOpenDetail = async (booking) => {
    setDetailState({
      booking,
      error: "",
      loading: true,
      open: true,
    });

    try {
      const response = await adminService.getBookingById(booking.id);
      const detailBooking = normalizeBookingRecord(response.data);

      setDetailState({
        booking: detailBooking || booking,
        error: "",
        loading: false,
        open: true,
      });
    } catch (error) {
      setDetailState({
        booking,
        error: getErrorMessage(error, "Unable to load this booking record."),
        loading: false,
        open: true,
      });
    }
  };

  const handleCloseDetail = () => {
    setDetailState({
      booking: null,
      error: "",
      loading: false,
      open: false,
    });
  };

  /**
   * Opens the confirmation flow and selects the first available status target.
   */
  const handleStatusRequest = (booking) => {
    const nextTarget =
      bookingStatuses.find((status) => status !== booking?.status) || "PENDING";

    setMutationState({ error: "", loading: false, success: "" });
    setTargetStatus(nextTarget);
    setStatusRequest({ booking });
  };

  const handleCancelStatusRequest = () => {
    if (mutationState.loading) return;
    setStatusRequest(null);
    setMutationState({ error: "", loading: false, success: "" });
  };

  /**
   * Sends the exact Admin booking status body and waits for backend
   * confirmation before synchronizing the ledger and any open drawer.
   */
  const handleConfirmStatusChange = async () => {
    if (!statusRequest || !targetStatus) return;

    setMutationState({ error: "", loading: true, success: "" });

    try {
      const response = await adminService.updateBookingStatus(
        statusRequest.booking.id,
        { status: targetStatus }
      );
      const updatedBooking = normalizeBookingRecord(response.data);
      const successReference = getBookingReference(
        updatedBooking || statusRequest.booking
      );

      if (updatedBooking) {
        setBookingState((current) => ({
          ...current,
          bookings: mergeUpdatedBooking(current.bookings, updatedBooking),
        }));

        setDetailState((current) => ({
          ...current,
          booking:
            current.booking &&
            String(current.booking.id) === String(updatedBooking.id)
              ? { ...current.booking, ...updatedBooking }
              : current.booking,
        }));
      }

      setStatusRequest(null);
      setMutationState({
        error: "",
        loading: false,
        success: `${successReference} was updated to ${formatEnum(targetStatus)}.`,
      });

      /* Refetch after local synchronization so active backend filters remain
         authoritative if the changed status no longer belongs in the result. */
      setReloadToken((current) => current + 1);
    } catch (error) {
      setMutationState({
        error: getErrorMessage(error, "Unable to update this booking status."),
        loading: false,
        success: "",
      });
    }
  };

  return (
    <section
      className="elite-admin-bookings"
      aria-labelledby="admin-bookings-title"
    >
      <header className="elite-admin-bookings__header">
        <div>
          <span>Reservation operations</span>
          <h2 id="admin-bookings-title">Bookings</h2>
          <p>
            Oversee EliteBNB reservations, guest and host relationships,
            lifecycle status, and linked payment state from one operational
            ledger.
          </p>
        </div>
        <aside aria-label="Loaded booking count">
          <CalendarClock size={22} aria-hidden="true" />
          <strong>{totalLabel}</strong>
          <small>Live reservation records</small>
        </aside>
      </header>

      <form
        className="elite-admin-bookings__filters"
        onSubmit={handleFilterSubmit}
      >
        <div className="elite-admin-bookings__filter-row elite-admin-bookings__filter-row--primary">
          <div className="elite-admin-bookings__search-field">
            <Search size={17} aria-hidden="true" />
            <label htmlFor="admin-booking-search">Search bookings</label>
            <input
              id="admin-booking-search"
              name="search"
              onChange={handleFilterChange}
              placeholder="Booking, guest, host, or property"
              type="search"
              value={pendingFilters.search}
            />
          </div>

          <label className="elite-admin-bookings__select-field">
            <span>Status</span>
            <select
              name="status"
              onChange={handleFilterChange}
              value={pendingFilters.status}
            >
              <option value="">All statuses</option>
              {bookingStatuses.map((status) => (
                <option key={status} value={status}>
                  {formatEnum(status)}
                </option>
              ))}
            </select>
          </label>

          <div className="elite-admin-bookings__filter-actions">
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

        <div className="elite-admin-bookings__filter-row elite-admin-bookings__filter-row--secondary">
          <label className="elite-admin-bookings__input-field">
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

          <label className="elite-admin-bookings__input-field">
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

          <label className="elite-admin-bookings__input-field">
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

          <label className="elite-admin-bookings__input-field">
            <span>From</span>
            <input
              name="from"
              onChange={handleFilterChange}
              type="date"
              value={pendingFilters.from}
            />
          </label>

          <label className="elite-admin-bookings__input-field">
            <span>To</span>
            <input
              name="to"
              onChange={handleFilterChange}
              type="date"
              value={pendingFilters.to}
            />
          </label>
        </div>
      </form>

      {filterError && (
        <div className="elite-admin-bookings__feedback is-error" role="alert">
          <AlertTriangle size={17} aria-hidden="true" />
          {filterError}
        </div>
      )}
      {mutationState.error && !statusRequest && (
        <div className="elite-admin-bookings__feedback is-error" role="alert">
          <AlertTriangle size={17} aria-hidden="true" />
          {mutationState.error}
        </div>
      )}
      {mutationState.success && (
        <div className="elite-admin-bookings__feedback is-success" role="status">
          <CheckCircle2 size={17} aria-hidden="true" />
          {mutationState.success}
        </div>
      )}

      <section
        className="elite-admin-bookings__ledger"
        aria-label="Reservation ledger"
      >
        <div className="elite-admin-bookings__ledger-heading">
          <span>Reservation ledger</span>
          <button
            aria-label="Refresh booking ledger"
            disabled={bookingState.loading}
            onClick={handleRetry}
            type="button"
          >
            <RefreshCw size={16} aria-hidden="true" />
            Refresh
          </button>
        </div>

        {bookingState.loading && (
          <div
            className="elite-admin-bookings__skeleton"
            aria-label="Loading bookings"
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <span key={index} />
            ))}
          </div>
        )}

        {!bookingState.loading && bookingState.error && (
          <div className="elite-admin-bookings__empty-state" role="alert">
            <AlertTriangle size={24} aria-hidden="true" />
            <h3>Unable to load bookings</h3>
            <p>{bookingState.error}</p>
            <button onClick={handleRetry} type="button">
              Retry
            </button>
          </div>
        )}

        {!bookingState.loading &&
          !bookingState.error &&
          bookingState.bookings.length === 0 && (
            <div className="elite-admin-bookings__empty-state" role="status">
              <CalendarClock size={24} aria-hidden="true" />
              <h3>{hasActiveFilters ? "No matching bookings" : "No bookings yet"}</h3>
              <p>
                {hasActiveFilters
                  ? "No reservation matched the current backend filters."
                  : "The backend returned an empty reservation ledger."}
              </p>
              {hasActiveFilters && (
                <button onClick={handleClearFilters} type="button">
                  Clear filters
                </button>
              )}
            </div>
          )}

        {!bookingState.loading &&
          !bookingState.error &&
          bookingState.bookings.length > 0 && (
            <>
              <div className="elite-admin-bookings__table-wrap">
                <table className="elite-admin-bookings__table">
                  <colgroup>
                    <col className="elite-admin-bookings__col-reference" />
                    <col className="elite-admin-bookings__col-property" />
                    <col className="elite-admin-bookings__col-guest" />
                    <col className="elite-admin-bookings__col-dates" />
                    <col className="elite-admin-bookings__col-amount" />
                    <col className="elite-admin-bookings__col-status" />
                    <col className="elite-admin-bookings__col-actions" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th scope="col">Reference</th>
                      <th scope="col">Property</th>
                      <th scope="col">Guest</th>
                      <th scope="col">Dates</th>
                      <th scope="col">Amount / host</th>
                      <th scope="col">Status</th>
                      <th scope="col">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookingState.bookings.map((booking) => (
                      <BookingLedgerRow
                        booking={booking}
                        key={booking.id}
                        onInspect={handleOpenDetail}
                        onStatusRequest={handleStatusRequest}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="elite-admin-bookings__mobile-list">
                {bookingState.bookings.map((booking) => (
                  <BookingMobileCard
                    booking={booking}
                    key={booking.id}
                    onInspect={handleOpenDetail}
                    onStatusRequest={handleStatusRequest}
                  />
                ))}
              </div>
            </>
          )}
      </section>

      {detailState.open && (
        <BookingDetailDrawer
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
