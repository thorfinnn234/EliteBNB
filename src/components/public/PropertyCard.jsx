import { ArrowRight, Heart, Star } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Presents a premium stay preview for homepage curation and future listing grids.
 * It expects prepared display data and links into the existing property route.
 */
export default function PropertyCard({
  id,
  image,
  imageAlt,
  hoverImage,
  location,
  name,
  rating,
  price,
}) {
  return (
    <article className="elite-property-card">
      <Link to={`/property/${id}`} className="elite-property-card__media">
        <img
          className="elite-property-card__image elite-property-card__image--primary"
          src={image}
          alt={imageAlt}
          loading="lazy"
        />
        {hoverImage ? (
          <img
            className="elite-property-card__image elite-property-card__image--secondary"
            src={hoverImage}
            alt=""
            loading="lazy"
          />
        ) : null}
        <span className="elite-property-card__media-shade" aria-hidden="true" />
        <span className="elite-property-card__action">
          View stay
          <ArrowRight size={15} aria-hidden="true" />
        </span>
      </Link>

      <button
        type="button"
        className="elite-property-card__wish"
        aria-label={`Save ${name} to wishlist`}
      >
        <Heart size={18} aria-hidden="true" />
      </button>

      <div className="elite-property-card__body">
        <div className="elite-property-card__details">
          <p className="elite-property-card__location">{location}</p>
          <h3>{name}</h3>
        </div>
        <span className="elite-property-card__rating">
          <Star size={15} fill="currentColor" aria-hidden="true" />
          {rating}
        </span>
      </div>

      <p className="elite-property-card__price">
        <span>{price}</span>
        <small>/ night</small>
      </p>
    </article>
  );
}
