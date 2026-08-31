import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Displays a compact saved-stays preview so wishlist content feels available
 * without competing with the primary recommendation area.
 */
export default function SavedPreview({ actionTo = "/user/wishlist", stays }) {
  return (
    <div className="elite-saved-preview">
      {stays.slice(0, 3).map((stay, index) => (
        <Link
          to={`/property/${stay.id}`}
          className="elite-saved-preview__item"
          key={stay.id}
          style={{ "--saved-index": index }}
        >
          <img src={stay.image} alt={stay.imageAlt} loading="lazy" />
          <span>
            <strong>{stay.name}</strong>
            <small>
              {stay.location} · {stay.price}
            </small>
          </span>
        </Link>
      ))}

      <Link to={actionTo} className="elite-saved-preview__action">
        View saved stays
        <ArrowRight size={15} aria-hidden="true" />
      </Link>
    </div>
  );
}
