import {
  ArrowLeft,
  ArrowRight,
  Bath,
  BedDouble,
  CalendarCheck,
  Clock3,
  Home,
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  ShieldAlert,
  UsersRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ContentSkeleton,
  SectionErrorState,
} from "../../components/user/UserFeedbackStates";
import { bookingService } from "../../services/bookingService";
import { propertyService } from "../../services/propertyService";
import {
  formatEnumLabel,
  formatNaira,
  getPropertyImage,
  getPropertyLocation,
  normalizeApiList,
} from "../../utils/userBackendMappers";
import "./UserPages.css";

const reservationStatusCopy = {
  CONFIRMED: {
    label: "Confirmed",
    title: "Your stay is confirmed.",
    description:
      "This reservation is active in your EliteBNB trips. Keep the dates and guest count close as you prepare for arrival.",
  },
  PENDING: {
    label: "Pending",
    title: "Your reservation is awaiting confirmation.",
    description:
      "This booking is still pending, so the page avoids confirmed-stay language until the backend status changes.",
  },
  COMPLETED: {
    label: "Completed",
    title: "This stay is complete.",
    description:
      "Your reservation remains here as part of your travel history. Reviews are handled through the dedicated Reviews experience.",
  },
  CANCELLED: {
    label: "Cancelled",
    title: "This reservation was cancelled.",
    description:
      "The booking is retained for history, but upcoming-stay actions are intentionally reduced for cancelled reservations.",
  },
  DEFAULT: {
    label: "Status",
    title: "Reservation status received.",
    description:
      "EliteBNB is showing the booking status returned by the backend without adding assumptions.",
  },
};

/**
 * Formats genuine backend dates into a readable itinerary label while hiding
 * invalid values instead of manufacturing a schedule.
 */
function formatReservationDate(value, fallback = "Date unavailable") {
  if (!value) return fallback;

  const rawValue = String(value);
  const date = rawValue.includes("T")
    ? new Date(rawValue)
    : new Date(`${rawValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Counts reservation nights from the real check-in/check-out fields. This is
 * display-only math; backend booking validation remains authoritative.
 */
function getReservationNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return null;

  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  const difference = end.getTime() - start.getTime();

  if (Number.isNaN(difference) || difference <= 0) return null;

  return Math.ceil(difference / (1000 * 60 * 60 * 24));
}

/**
 * Keeps status-specific presentation tied to real backend status values.
 * Unknown values are still shown truthfully instead of being remapped.
 */
function getReservationStatus(booking) {
  const code = String(booking?.status || "").toUpperCase();
  const fallbackLabel = formatEnumLabel(code, "Status unavailable");

  return {
    code,
    label: reservationStatusCopy[code]?.label || fallbackLabel,
    title: reservationStatusCopy[code]?.title || reservationStatusCopy.DEFAULT.title,
    description:
      reservationStatusCopy[code]?.description ||
      reservationStatusCopy.DEFAULT.description,
  };
}

/**
 * Reads the property ID from supported booking DTO shapes. The route never
 * creates a property ID locally because View Property must target a real stay.
 */
function getBookingPropertyId(booking) {
  return booking?.propertyId ?? booking?.property?.id ?? null;
}

/**
 * Builds a property title from the booking first, then the hydrated property.
 * This lets the reservation remain useful if property enrichment fails.
 */
function getReservationTitle(booking, property) {
  return (
    booking?.propertyTitle ||
    booking?.propertyName ||
    property?.title ||
    property?.name ||
    "Property unavailable"
  );
}

/**
 * Creates a compact accommodation snapshot using only fields supplied by the
 * hydrated PropertyResponse. Missing facts are omitted entirely.
 */
function getReservationPropertyFacts(property) {
  return [
    {
      icon: UsersRound,
      label: "Capacity",
      value: property?.maxGuests ? `${property.maxGuests} guests` : "",
    },
    {
      icon: BedDouble,
      label: "Bedrooms",
      value: property?.bedrooms ? `${property.bedrooms}` : "",
    },
    {
      icon: Bath,
      label: "Bathrooms",
      value: property?.bathrooms ? `${property.bathrooms}` : "",
    },
    {
      icon: Home,
      label: "Property type",
      value: formatEnumLabel(property?.propertyType),
    },
  ].filter((fact) => Boolean(fact.value));
}

/**
 * Presents one reservation metadata item. The component stays intentionally
 * small because the surrounding layout carries the itinerary hierarchy.
 */
function ReservationFact({ icon: Icon, label, value }) {
  return (
    <div className="elite-reservation-fact">
      <Icon size={17} aria-hidden="true" />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

/**
 * Truthful placeholder for future host conversations. It prepares the UI slot
 * without saving local messages, creating fake threads, or calling endpoints
 * that do not exist yet.
 */
function MessageHostDialog({ hostName, onClose }) {
  return (
    <div className="elite-reservation-modal" role="presentation" onMouseDown={onClose}>
      <section
        aria-labelledby="reservation-message-title"
        aria-modal="true"
        className="elite-reservation-modal__panel"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close message host panel"
          className="elite-reservation-modal__close"
          onClick={onClose}
        >
          <X size={17} aria-hidden="true" />
        </button>

        <span className="elite-reservation-modal__icon">
          <MessageCircle size={22} aria-hidden="true" />
        </span>
        <p className="elite-reservation-kicker">Message host</p>
        <h2 id="reservation-message-title">
          Host conversations are coming to this space.
        </h2>
        <p>
          Messaging with {hostName || "your host"} will be available here once
          EliteBNB enables guest-host conversations. No message has been sent.
        </p>
      </section>
    </div>
  );
}

/**
 * Confirms pending cancellation on the details page. This mirrors the Trips
 * list behavior: cancellation is a status transition, never a local deletion.
 */
function CancelReservationDialog({
  error,
  isCancelling,
  onClose,
  onConfirm,
  propertyTitle,
}) {
  return (
    <div className="elite-reservation-modal" role="presentation" onMouseDown={onClose}>
      <section
        aria-labelledby="reservation-cancel-title"
        aria-modal="true"
        className="elite-reservation-modal__panel"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close cancellation dialog"
          className="elite-reservation-modal__close"
          disabled={isCancelling}
          onClick={onClose}
        >
          <X size={17} aria-hidden="true" />
        </button>

        <span className="elite-reservation-modal__icon elite-reservation-modal__icon--danger">
          <ShieldAlert size={22} aria-hidden="true" />
        </span>
        <p className="elite-reservation-kicker">Pending reservation</p>
        <h2 id="reservation-cancel-title">
          Cancel this pending reservation?
        </h2>
        <p>
          This will remove {propertyTitle} from your active trips. The booking
          record will remain in your history as cancelled.
        </p>

        {error ? (
          <p className="elite-reservation-modal__error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="elite-reservation-modal__actions">
          <button type="button" disabled={isCancelling} onClick={onClose}>
            Keep trip
          </button>
          <button type="button" disabled={isCancelling} onClick={onConfirm}>
            {isCancelling ? "Cancelling..." : "Cancel reservation"}
          </button>
        </div>
      </section>
    </div>
  );
}

/**
 * Renders a real reservation document for an existing booking. Ownership is
 * resolved by loading `/bookings/my` and finding the requested booking in that
 * authenticated list instead of inventing or relying on an unconfirmed
 * user-facing booking-by-ID endpoint.
 */
export default function ReservationDetails() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [property, setProperty] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [propertyError, setPropertyError] = useState(false);
  const [messagePanelOpen, setMessagePanelOpen] = useState(false);
  const [cancelPanelOpen, setCancelPanelOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  /**
   * Loads the user's own bookings, verifies the requested ID is present, then
   * hydrates the reservation with the genuine property record for imagery,
   * location, facts, and amenities.
   */
  const loadReservation = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      setNotFound(false);
      setPropertyError(false);
      setBooking(null);
      setProperty(null);

      const bookingsResponse = await bookingService.getMine();
      const bookings = normalizeApiList(bookingsResponse.data);
      const matchedBooking = bookings.find(
        (candidate) => String(candidate?.id) === String(bookingId)
      );

      if (!matchedBooking) {
        setNotFound(true);
        return;
      }

      setBooking(matchedBooking);

      const propertyId = getBookingPropertyId(matchedBooking);

      if (!propertyId) {
        setPropertyError(true);
        return;
      }

      try {
        const propertyResponse = await propertyService.getById(propertyId);

        setProperty(propertyResponse.data);
      } catch (propertyLoadError) {
        console.error("Failed to hydrate reservation property:", propertyLoadError);
        setPropertyError(true);
      }
    } catch (reservationError) {
      console.error("Failed to load reservation:", reservationError);
      setError(
        reservationError?.response?.data?.message ||
          "We couldn't load this reservation right now."
      );
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    let isCurrentEffect = true;

    window.queueMicrotask(() => {
      if (isCurrentEffect) {
        loadReservation();
      }
    });

    return () => {
      isCurrentEffect = false;
    };
  }, [loadReservation]);

  const status = useMemo(() => getReservationStatus(booking), [booking]);
  const propertyId = getBookingPropertyId(booking);
  const nights = getReservationNights(booking?.checkIn, booking?.checkOut);
  const guestCount = Number(booking?.guests ?? booking?.numberOfGuests ?? 0);
  const guestLabel = guestCount
    ? `${guestCount} guest${guestCount === 1 ? "" : "s"}`
    : "Guest count unavailable";
  const propertyTitle = getReservationTitle(booking, property);
  const propertyLocation = property
    ? getPropertyLocation(property, "Location unavailable")
    : booking?.location || "Location unavailable";
  const propertyImage = property ? getPropertyImage(property) : "";
  const propertyFacts = useMemo(
    () => getReservationPropertyFacts(property),
    [property]
  );
  const amenities = Array.isArray(property?.amenities)
    ? property.amenities.map((amenity) => formatEnumLabel(amenity, amenity))
    : [];
  const canCancelReservation = status.code === "PENDING";

  /**
   * Calls the new USER-only cancellation endpoint. The backend validates both
   * ownership and pending-only status, so the UI updates only after success.
   */
  const confirmCancelReservation = async () => {
    if (!booking?.id || !canCancelReservation) return;

    try {
      setIsCancelling(true);
      setCancelError("");

      const response = await bookingService.cancel(booking.id);

      setBooking((currentBooking) => ({
        ...currentBooking,
        ...response.data,
      }));
      setCancelPanelOpen(false);
    } catch (error) {
      console.error("Failed to cancel reservation:", error);
      setCancelError(
        error?.response?.data?.message ||
          "We couldn't cancel this pending reservation."
      );
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <section className="elite-user-page elite-reservation-detail" data-user-page>
        <ContentSkeleton variant="trip" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="elite-user-page elite-reservation-detail" data-user-page>
        <SectionErrorState
          title="We couldn't load this reservation."
          description={error}
          onRetry={loadReservation}
        />
      </section>
    );
  }

  if (notFound || !booking) {
    return (
      <section className="elite-user-page elite-reservation-detail" data-user-page>
        <div className="elite-reservation-empty">
          <ShieldAlert size={28} aria-hidden="true" />
          <p className="elite-reservation-kicker">Reservation unavailable</p>
          <h1>This booking is not in your trips.</h1>
          <p>
            EliteBNB only opens reservations returned by your authenticated
            booking list, so another guest's booking cannot be displayed here.
          </p>
          <Link to="/user/trips">
            Back to trips
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="elite-user-page elite-reservation-detail" data-user-page>
      <button
        type="button"
        className="elite-reservation-back"
        onClick={() => navigate("/user/trips")}
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back to trips
      </button>

      {/* =========================================================
      RESERVATION HERO
      Uses the real booking plus hydrated property data to present this as an
      existing itinerary, not a fresh booking form.
      ========================================================= */}
      <section
        className={`elite-reservation-hero elite-reservation-hero--${status.code.toLowerCase() || "default"}`}
        data-user-page-reveal
      >
        <figure className="elite-reservation-hero__media">
          {propertyImage ? (
            <img src={propertyImage} alt={`${propertyTitle} reservation`} />
          ) : (
            <span>
              <ImageIcon size={28} aria-hidden="true" />
              Property image unavailable
            </span>
          )}
        </figure>

        <div className="elite-reservation-hero__content">
          <div className="elite-reservation-hero__topline">
            <span className="elite-reservation-kicker">
              Reservation #{booking.id}
            </span>
            <span className="elite-reservation-status">{status.label}</span>
          </div>

          <h1>{propertyTitle}</h1>

          <p className="elite-reservation-location">
            <MapPin size={17} aria-hidden="true" />
            {propertyLocation}
          </p>

          <div className="elite-reservation-hero__facts">
            <ReservationFact
              icon={CalendarCheck}
              label="Check in"
              value={formatReservationDate(booking.checkIn)}
            />
            <ReservationFact
              icon={Clock3}
              label="Check out"
              value={formatReservationDate(booking.checkOut)}
            />
            <ReservationFact
              icon={UsersRound}
              label="Stay"
              value={`${nights ? `${nights} night${nights === 1 ? "" : "s"}` : "Duration unavailable"} · ${guestLabel}`}
            />
          </div>
        </div>
      </section>

      <div className="elite-reservation-grid" data-user-page-reveal>
        <article className="elite-reservation-panel elite-reservation-panel--status">
          <p className="elite-reservation-kicker">Current state</p>
          <h2>{status.title}</h2>
          <p>{status.description}</p>

          {status.code === "COMPLETED" ? (
            <Link to="/user/reviews" className="elite-reservation-inline-link">
              Open reviews
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          ) : null}

          {canCancelReservation ? (
            <button
              type="button"
              className="elite-reservation-cancel-button"
              disabled={isCancelling}
              onClick={() => {
                setCancelError("");
                setCancelPanelOpen(true);
              }}
            >
              {isCancelling ? "Cancelling..." : "Cancel trip"}
            </button>
          ) : null}
        </article>

        <article className="elite-reservation-panel elite-reservation-panel--total">
          <p className="elite-reservation-kicker">Reservation total</p>
          <strong>{formatNaira(booking.totalAmount, "Total unavailable")}</strong>
          <span>
            This reflects the backend booking total. Payment method, fees, and
            paid status are not displayed unless returned by the API.
          </span>
        </article>
      </div>

      <section className="elite-reservation-itinerary" data-user-page-reveal>
        <div className="elite-reservation-itinerary__header">
          <p className="elite-reservation-kicker">Stay timeline</p>
          <h2>Your dates at a glance.</h2>
        </div>

        <div className="elite-reservation-timeline">
          <div>
            <span>Check in</span>
            <strong>{formatReservationDate(booking.checkIn)}</strong>
          </div>
          <i aria-hidden="true" />
          <div>
            <span>Check out</span>
            <strong>{formatReservationDate(booking.checkOut)}</strong>
          </div>
        </div>

        <dl className="elite-reservation-summary">
          <div>
            <dt>Nights</dt>
            <dd>{nights ?? "Unavailable"}</dd>
          </div>
          <div>
            <dt>Guests</dt>
            <dd>{guestCount || "Unavailable"}</dd>
          </div>
          <div>
            <dt>Booked</dt>
            <dd>{formatReservationDate(booking.createdAt, "Date unavailable")}</dd>
          </div>
        </dl>
      </section>

      <section className="elite-reservation-property" data-user-page-reveal>
        <div>
          <p className="elite-reservation-kicker">Residence snapshot</p>
          <h2>Useful stay details, without reopening checkout.</h2>
          {propertyError ? (
            <p>
              The booking loaded successfully, but the linked property could not
              be refreshed right now.
            </p>
          ) : (
            <p>
              These details come from the current property record attached to
              your reservation.
            </p>
          )}
        </div>

        {propertyFacts.length ? (
          <div className="elite-reservation-property__facts">
            {propertyFacts.map((fact) => (
              <ReservationFact
                key={fact.label}
                icon={fact.icon}
                label={fact.label}
                value={fact.value}
              />
            ))}
          </div>
        ) : null}

        {amenities.length ? (
          <div className="elite-reservation-amenities">
            {amenities.slice(0, 8).map((amenity) => (
              <span key={amenity}>{amenity}</span>
            ))}
          </div>
        ) : null}

        <div className="elite-reservation-actions">
          {propertyId ? (
            <Link to={`/user/property/${propertyId}`}>
              View property
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          ) : null}

          <button type="button" onClick={() => setMessagePanelOpen(true)}>
            <MessageCircle size={16} aria-hidden="true" />
            Message host
          </button>
        </div>
      </section>

      {messagePanelOpen ? (
        <MessageHostDialog
          hostName={property?.hostName}
          onClose={() => setMessagePanelOpen(false)}
        />
      ) : null}

      {cancelPanelOpen ? (
        <CancelReservationDialog
          error={cancelError}
          isCancelling={isCancelling}
          onClose={() => {
            if (!isCancelling) {
              setCancelPanelOpen(false);
              setCancelError("");
            }
          }}
          onConfirm={confirmCancelReservation}
          propertyTitle={propertyTitle}
        />
      ) : null}
    </section>
  );
}
