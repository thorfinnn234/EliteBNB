import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Displays one destination as an image-led editorial panel.
 * The content is always available on touch devices and progressively revealed on hover.
 */
export default function DestinationPanel({ destination }) {
  return (
    <article className="elite-destination-panel">
      <img
        src={destination.image}
        alt={destination.imageAlt}
        loading="lazy"
      />
      <div className="elite-destination-panel__overlay" />
      <div className="elite-destination-panel__content">
        <p>{destination.count}</p>
        <h3>{destination.name}</h3>
        <span>{destination.description}</span>
        <Link to={`/search?where=${encodeURIComponent(destination.name)}`}>
          Explore stays
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
