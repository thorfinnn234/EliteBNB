import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Renders layout-matched loading placeholders for User Home sections.
 * The skeleton keeps perceived structure stable while real API data is pending.
 */
export function ContentSkeleton({ variant = "cards", count = 3 }) {
  if (variant === "featured") {
    return (
      <div className="elite-user-skeleton elite-user-skeleton--featured">
        <span />
        <div>
          <i />
          <i />
          <i />
        </div>
      </div>
    );
  }

  if (variant === "trip") {
    return (
      <div className="elite-user-skeleton elite-user-skeleton--trip">
        <span />
        <div>
          <i />
          <i />
          <i />
        </div>
      </div>
    );
  }

  return (
    <div className="elite-user-skeleton-grid" aria-label="Loading stays">
      {Array.from({ length: count }).map((_, index) => (
        <div
          className="elite-user-skeleton elite-user-skeleton--card"
          key={`stay-skeleton-${index}`}
        >
          <span />
          <i />
          <i />
        </div>
      ))}
    </div>
  );
}

/**
 * Provides a focused recovery state for a single dashboard section.
 * A failed section should not collapse the entire authenticated home.
 */
export function SectionErrorState({
  title = "We couldn't load this section.",
  description = "Please try again in a moment.",
  onRetry,
}) {
  return (
    <div className="elite-user-feedback elite-user-feedback--error" role="status">
      <h3>{title}</h3>
      <p>{description}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}

/**
 * Shows useful next steps when a guest has no data for a dashboard section.
 * Empty states stay action-oriented without inventing analytics or fake counts.
 */
export function SectionEmptyState({ title, description, actionLabel, actionTo }) {
  return (
    <div className="elite-user-feedback">
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && actionTo ? (
        <Link to={actionTo}>
          {actionLabel}
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}
