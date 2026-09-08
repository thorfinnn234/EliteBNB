import { ArrowRight, CalendarDays, CheckCircle2, MapPin, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Shows the guest's next itinerary as a travel preview instead of a database
 * row. Booking status and dates remain display data until backend responses are
 * connected in a later phase.
 */
export default function UpcomingTrip({ actionTo = "/user/trips", trip }) {
  return (
    <article className="elite-upcoming-trip">
      <div className="elite-upcoming-trip__media">
        <img src={trip.image} alt={trip.imageAlt} loading="lazy" />
      </div>

      <div className="elite-upcoming-trip__content">
        <p className="elite-upcoming-trip__eyebrow">Your next escape</p>
        <div>
          <span className="elite-upcoming-trip__status">
            <CheckCircle2 size={15} aria-hidden="true" />
            {trip.status}
          </span>
          <h3>{trip.name}</h3>
          <p className="elite-upcoming-trip__location">
            <MapPin size={15} aria-hidden="true" />
            {trip.location}
          </p>
        </div>

        <dl className="elite-upcoming-trip__details">
          <div>
            <dt>
              <CalendarDays size={15} aria-hidden="true" />
              Dates
            </dt>
            <dd>
              {trip.checkIn} - {trip.checkOut}
            </dd>
          </div>
          <div>
            <dt>
              <UsersRound size={15} aria-hidden="true" />
              Guests
            </dt>
            <dd>
              {trip.guests} · {trip.nights}
            </dd>
          </div>
        </dl>

        <p className="elite-upcoming-trip__note">{trip.note}</p>

        <Link to={actionTo} className="elite-upcoming-trip__action">
          View trip
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
