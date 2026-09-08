import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  MapPin,
  ShieldAlert,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ContentSkeleton,
  SectionEmptyState,
  SectionErrorState,
} from "../../components/user/UserFeedbackStates";
import UserPageHeader from "../../components/user/UserPageHeader";
import UserStatusTabs from "../../components/user/UserStatusTabs";
import { userTripsData } from "../../data/userHomeData";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { bookingService } from "../../services/bookingService";
import { propertyService } from "../../services/propertyService";
import { groupTripsByStatus } from "../../utils/userBackendMappers";
import { normalizeApiList } from "../../utils/userBackendMappers";
import "./UserHome.css";
import "./UserPages.css";

const emptyTripGroups = {
  upcoming: [],
  completed: [],
  cancelled: [],
};

/**
 * Renders one guest itinerary as a visual travel card.
 * The card avoids cancellation rules because those must be decided by backend
 * booking state in a later integration pass.
 */
function TripCard({
  cancelling = false,
  onCancelTrip,
  prominent = false,
  previewMode = false,
  trip,
}) {
  const propertyPath = previewMode ? "/property" : "/user/property";
  const propertyDetailsPath = `${propertyPath}/${trip.propertyId}`;
  const reservationDetailsPath =
    !previewMode && trip.id ? `/user/trips/${trip.id}` : propertyDetailsPath;
  const canCancelPendingTrip =
    !previewMode && trip.statusCode === "PENDING" && onCancelTrip;

  return (
    <article className={`elite-trip-card${prominent ? " is-prominent" : ""}`}>
      <Link to={reservationDetailsPath} className="elite-trip-card__media">
        {trip.image ? (
          <img src={trip.image} alt={trip.imageAlt} loading="lazy" />
        ) : (
          <span className="elite-trip-card__media-empty">No image available</span>
        )}
      </Link>

      <div className="elite-trip-card__content">
        <span className="elite-trip-card__status">
          <CheckCircle2 size={15} aria-hidden="true" />
          {trip.status}
        </span>
        <div>
          <p className="elite-trip-card__location">
            <MapPin size={15} aria-hidden="true" />
            {trip.location}
          </p>
          <h3>{trip.name}</h3>
          <p>{trip.note}</p>
        </div>

        <dl className="elite-trip-card__details">
          <div>
            <dt>
              <CalendarDays size={15} aria-hidden="true" />
              Dates
            </dt>
            <dd>{trip.dates}</dd>
          </div>
          <div>
            <dt>
              <UsersRound size={15} aria-hidden="true" />
              Stay
            </dt>
            <dd>
              {trip.guests} · {trip.nights}
            </dd>
          </div>
        </dl>

        <div className="elite-trip-card__footer">
          <span>Ref {trip.reference}</span>
          <div className="elite-trip-card__links">
            {trip.propertyId ? (
              <Link
                to={propertyDetailsPath}
                className="elite-trip-card__property-link"
              >
                View property
              </Link>
            ) : null}
            <Link to={reservationDetailsPath}>
              View trip
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
            {canCancelPendingTrip ? (
              <button
                type="button"
                className="elite-trip-card__cancel"
                disabled={cancelling}
                onClick={() => onCancelTrip(trip)}
              >
                {cancelling ? "Cancelling..." : "Cancel trip"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * Confirms pending cancellation without using `window.confirm`. The copy makes
 * clear that the backend preserves the booking row as cancelled history.
 */
function CancelTripDialog({
  error,
  isCancelling,
  onClose,
  onConfirm,
  trip,
}) {
  if (!trip) return null;

  return (
    <div className="elite-trip-cancel-modal" role="presentation" onMouseDown={onClose}>
      <section
        aria-labelledby="trip-cancel-title"
        aria-modal="true"
        className="elite-trip-cancel-modal__panel"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close cancellation dialog"
          className="elite-trip-cancel-modal__close"
          disabled={isCancelling}
          onClick={onClose}
        >
          <X size={17} aria-hidden="true" />
        </button>

        <span className="elite-trip-cancel-modal__icon">
          <ShieldAlert size={22} aria-hidden="true" />
        </span>
        <p className="elite-user-page-header__eyebrow">Pending reservation</p>
        <h2 id="trip-cancel-title">Cancel this pending reservation?</h2>
        <p>
          This will remove {trip.name} from your active trips. The booking
          record will remain in your history as cancelled.
        </p>

        {error ? (
          <p className="elite-trip-cancel-modal__error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="elite-trip-cancel-modal__actions">
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
 * Adds a compact itinerary-board element to the Trips hero.
 * It uses existing mock trip presentation fields only, so cancellation rules
 * and booking authority remain future backend responsibilities.
 */
function TripHeroTicket({ trip }) {
  if (!trip) {
    return (
      <div className="elite-trips-hero-ticket">
        <span>Next journey</span>
        <strong>Open calendar</strong>
        <small>Choose an EliteBNB stay to begin.</small>
      </div>
    );
  }

  return (
    <div className="elite-trips-hero-ticket">
      <span>Next journey</span>
      <strong>{trip.name}</strong>
      <dl>
        <div>
          <dt>Destination</dt>
          <dd>{trip.location}</dd>
        </div>
        <div>
          <dt>Dates</dt>
          <dd>{trip.dates}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{trip.status}</dd>
        </div>
      </dl>
    </div>
  );
}

/**
 * Replaces the starter Trips placeholder with a guest-focused itinerary view.
 * Production protection stays in AppRoutes; preview mode only changes empty
 * state links so visual review remains inside the development route family.
 */
export default function Trips({ previewMode = false }) {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [productionTrips, setProductionTrips] = useState(emptyTripGroups);
  const [productionState, setProductionState] = useState({
    isLoading: !previewMode,
    error: false,
  });
  const [cancelDialogTrip, setCancelDialogTrip] = useState(null);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [cancelError, setCancelError] = useState("");
  const searchPath = previewMode ? "/dev/user-preview/explore" : "/user/explore";
  const { emptyStates, tabs } = userTripsData;

  useBodyScrollLock(Boolean(cancelDialogTrip));

  /**
   * Loads authenticated bookings only for production USER routes. Preview
   * remains isolated to presentation data, while backend failures become the
   * existing section-level error state.
   */
  useEffect(() => {
    if (previewMode) {
      return undefined;
    }

    let isMounted = true;

    async function loadTrips() {
      try {
        setProductionState({ isLoading: true, error: false });

        const response = await bookingService.getMine();
        const bookings = normalizeApiList(response.data);
        const propertyCache = new Map();
        const enrichedBookings = await Promise.all(
          bookings.map(async (booking) => {
            const propertyId = booking?.propertyId;

            if (!propertyId) return booking;

            if (!propertyCache.has(propertyId)) {
              propertyCache.set(
                propertyId,
                propertyService.getById(propertyId).then(
                  (propertyResponse) => propertyResponse.data,
                  () => null
                )
              );
            }

            const property = await propertyCache.get(propertyId);

            return property ? { ...booking, property } : booking;
          })
        );

        if (!isMounted) return;

        setProductionTrips(groupTripsByStatus(enrichedBookings));
        setProductionState({ isLoading: false, error: false });
      } catch (error) {
        console.error("Failed to load user trips:", error);

        if (isMounted) {
          setProductionTrips(emptyTripGroups);
          setProductionState({ isLoading: false, error: true });
        }
      }
    }

    loadTrips();

    return () => {
      isMounted = false;
    };
  }, [previewMode]);

  /**
   * Opens the cancellation confirmation only for backend-confirmed PENDING
   * trips. Backend ownership and status rules remain authoritative.
   */
  const openCancelDialog = (trip) => {
    if (trip.statusCode !== "PENDING") return;

    setCancelDialogTrip(trip);
    setCancelError("");
  };

  /**
   * Cancels after confirmation and waits for the backend response before
   * moving the trip out of active itinerary state. This avoids pretending a
   * cancellation succeeded when the server rejects ownership or status.
   */
  const confirmCancelTrip = async () => {
    if (!cancelDialogTrip?.id) return;

    try {
      setCancellingBookingId(cancelDialogTrip.id);
      setCancelError("");

      await bookingService.cancel(cancelDialogTrip.id);

      setProductionTrips((currentGroups) => {
        const removeBooking = (list) =>
          list.filter((trip) => String(trip.id) !== String(cancelDialogTrip.id));
        const cancelledTrip = {
          ...cancelDialogTrip,
          status: "Cancelled",
          statusCode: "CANCELLED",
          note: "Pending reservation cancelled.",
        };

        return {
          upcoming: removeBooking(currentGroups.upcoming),
          completed: removeBooking(currentGroups.completed),
          cancelled: [cancelledTrip, ...removeBooking(currentGroups.cancelled)],
        };
      });

      setCancelDialogTrip(null);
    } catch (error) {
      console.error("Failed to cancel pending trip:", error);
      setCancelError(
        error?.response?.data?.message ||
          "We couldn't cancel this pending reservation."
      );
    } finally {
      setCancellingBookingId(null);
    }
  };

  const presentationState = previewMode
    ? userTripsData.presentationState
    : productionState;
  const trips = previewMode ? userTripsData.trips : productionTrips;
  const currentTrips = trips[activeTab] ?? [];
  const nextTrip = trips.upcoming[0];
  const heroDetails = [
    { label: "Next stay", value: nextTrip?.location ?? "To be chosen" },
    { label: "Dates", value: nextTrip?.dates ?? "Open calendar" },
    { label: "Mode", value: "Journey board" },
  ];
  const emptyState = {
    ...emptyStates[activeTab],
    actionTo: emptyStates[activeTab]?.actionTo ? searchPath : undefined,
  };

  return (
    <section className="elite-user-page elite-user-trips" data-user-page>
      <UserPageHeader
        eyebrow="Trips"
        tone="journey"
        signature="18 SEP"
        detailItems={heroDetails}
        title="Your journey, beautifully arranged."
        description="Upcoming escapes stay prominent, while completed and cancelled reservations remain close enough to revisit without becoming booking records."
        media={
          nextTrip && nextTrip.image ? (
            <img src={nextTrip.image} alt="" loading="lazy" />
          ) : null
        }
        action={<TripHeroTicket trip={nextTrip} />}
      />

      <div className="elite-user-page__surface" data-user-page-reveal>
        <UserStatusTabs
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={tabs}
        />
      </div>

      {presentationState.isLoading ? (
        <ContentSkeleton count={3} />
      ) : presentationState.error ? (
        <SectionErrorState
          title="We couldn't load your trips."
          description="Your itinerary can be retried once the bookings service responds."
        />
      ) : currentTrips.length ? (
        <div className="elite-trip-list" data-user-page-reveal>
          {currentTrips.map((trip, index) => (
            <TripCard
              key={trip.id}
              cancelling={String(cancellingBookingId) === String(trip.id)}
              onCancelTrip={openCancelDialog}
              prominent={activeTab === "upcoming" && index === 0}
              previewMode={previewMode}
              trip={trip}
            />
          ))}
        </div>
      ) : (
        <SectionEmptyState {...emptyState} />
      )}

      <CancelTripDialog
        error={cancelError}
        isCancelling={Boolean(cancellingBookingId)}
        onClose={() => {
          if (!cancellingBookingId) {
            setCancelDialogTrip(null);
            setCancelError("");
          }
        }}
        onConfirm={confirmCancelTrip}
        trip={cancelDialogTrip}
      />
    </section>
  );
}
