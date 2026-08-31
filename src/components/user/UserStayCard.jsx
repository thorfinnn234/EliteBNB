import { ArrowRight, Heart, Star } from "lucide-react";
import { Link } from "react-router-dom";

const supportedStayCardVariants = new Set([
  "feature-wide",
  "feature-tall",
  "featured",
  "landscape",
  "lead",
  "portrait",
  "standard",
  "tall",
  "wide",
]);

/**
 * Normalizes visual card variants so mock presentation data can request a
 * masonry shape without letting an unexpected value create stray class names.
 */
function getStayCardVariant(variant) {
  return supportedStayCardVariants.has(variant) ? variant : "standard";
}

/**
 * Renders a reusable authenticated listing card for recommendations, saved
 * stays, and future search surfaces. It mirrors the public card vocabulary
 * while staying compact enough for product workflows.
 */
export default function UserStayCard({ stay, compact = false, variant }) {
  const visualVariant = getStayCardVariant(variant ?? stay.variant);

  return (
    <article
      className={`elite-user-stay-card elite-user-stay-card--${visualVariant}${
        compact ? " is-compact" : ""
      }`}
    >
      <Link to={`/property/${stay.id}`} className="elite-user-stay-card__media">
        <img src={stay.image} alt={stay.imageAlt} loading="lazy" />
        <span className="elite-user-stay-card__overlay" aria-hidden="true" />
        <span className="elite-user-stay-card__action">
          Details
          <ArrowRight size={14} aria-hidden="true" />
        </span>
      </Link>

      <button
        type="button"
        className="elite-user-stay-card__save"
        aria-label={`Save ${stay.name} to wishlist`}
      >
        <Heart size={17} aria-hidden="true" />
      </button>

      <div className="elite-user-stay-card__body">
        <div>
          <p className="elite-user-stay-card__location">{stay.location}</p>
          <h3>{stay.name}</h3>
          {stay.descriptor ? (
            <p className="elite-user-stay-card__descriptor">
              {stay.descriptor}
            </p>
          ) : null}
        </div>

        {stay.rating ? (
          <span className="elite-user-stay-card__rating">
            <Star size={14} fill="currentColor" aria-hidden="true" />
            {stay.rating}
          </span>
        ) : null}
      </div>

      <p className="elite-user-stay-card__price">
        <strong>{stay.price}</strong>
        <small>{stay.qualifier ?? "/ night"}</small>
      </p>
    </article>
  );
}
