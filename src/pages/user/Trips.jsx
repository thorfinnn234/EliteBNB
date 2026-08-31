import { ArrowRight, CalendarDays, CheckCircle2, MapPin, UsersRound } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ContentSkeleton,
  SectionEmptyState,
  SectionErrorState,
} from "../../components/user/UserFeedbackStates";
import UserPageHeader from "../../components/user/UserPageHeader";
import UserStatusTabs from "../../components/user/UserStatusTabs";
import { userTripsData } from "../../data/userHomeData";
import "./UserHome.css";
import "./UserPages.css";

/**
 * Renders one guest itinerary as a visual travel card.
 * The card avoids cancellation rules because those must be decided by backend
 * booking state in a later integration pass.
 */
function TripCard({ prominent = false, trip }) {
  return (
    <article className={`elite-trip-card${prominent ? " is-prominent" : ""}`}>
      <Link to={`/property/${trip.propertyId}`} className="elite-trip-card__media">
        <img src={trip.image} alt={trip.imageAlt} loading="lazy" />
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
          <Link to={`/property/${trip.propertyId}`}>
            View trip
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
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
  const searchPath = previewMode ? "/dev/user-preview/explore" : "/search";
  const { emptyStates, presentationState, tabs, trips } = userTripsData;
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
          nextTrip ? <img src={nextTrip.image} alt="" loading="lazy" /> : null
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
              prominent={activeTab === "upcoming" && index === 0}
              trip={trip}
            />
          ))}
        </div>
      ) : (
        <SectionEmptyState {...emptyState} />
      )}
    </section>
  );
}
