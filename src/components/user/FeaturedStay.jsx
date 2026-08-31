import { ArrowRight, Heart, MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Presents the strongest personalized stay recommendation on the guest home.
 * It uses prepared property data and links to the existing property details
 * route, leaving pricing and availability authority to the backend later.
 */
export default function FeaturedStay({ stay }) {
  return (
    <article className="elite-featured-stay">
      <Link to={`/property/${stay.id}`} className="elite-featured-stay__media">
        <img src={stay.image} alt={stay.imageAlt} loading="eager" />
        <span className="elite-featured-stay__shade" aria-hidden="true" />
      </Link>

      <div className="elite-featured-stay__content">
        <div className="elite-featured-stay__intro">
          <p>{stay.eyebrow}</p>
          <span>{stay.reason}</span>
        </div>

        <div>
          <p className="elite-featured-stay__location">
            <MapPin size={15} aria-hidden="true" />
            {stay.location}
          </p>
          <h2>{stay.name}</h2>
          <p className="elite-featured-stay__description">
            {stay.description}
          </p>
        </div>

        <ul className="elite-featured-stay__attributes" aria-label="Stay attributes">
          {stay.attributes.map((attribute) => (
            <li key={attribute}>{attribute}</li>
          ))}
        </ul>

        <div className="elite-featured-stay__meta">
          <span className="elite-featured-stay__rating">
            <Star size={16} fill="currentColor" aria-hidden="true" />
            {stay.rating}
          </span>
          <p>
            <strong>{stay.price}</strong>
            <small>{stay.qualifier}</small>
          </p>
        </div>

        <div className="elite-featured-stay__actions">
          <Link to={`/property/${stay.id}`}>
            View stay
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <button
            type="button"
            aria-label={`Save ${stay.name} to wishlist`}
          >
            <Heart size={18} aria-hidden="true" />
            Save
          </button>
        </div>
      </div>
    </article>
  );
}
