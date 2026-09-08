import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Standardizes section labels, headings, descriptions, and optional actions
 * across the authenticated guest home without making every section look alike.
 */
export default function UserSectionHeading({
  eyebrow,
  title,
  description,
  actionLabel,
  actionTo,
  className = "",
}) {
  return (
    <div className={`elite-user-section-heading ${className}`}>
      <div>
        {eyebrow ? (
          <p className="elite-user-section-heading__eyebrow">{eyebrow}</p>
        ) : null}
        <h2>{title}</h2>
        {description ? (
          <p className="elite-user-section-heading__description">
            {description}
          </p>
        ) : null}
      </div>

      {actionLabel && actionTo ? (
        <Link to={actionTo} className="elite-user-section-heading__action">
          {actionLabel}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}
