import { ArrowRight, Heart, MapPin, Star, X } from "lucide-react";
import { Link } from "react-router-dom";
import {
  ContentSkeleton,
  SectionEmptyState,
  SectionErrorState,
} from "../../components/user/UserFeedbackStates";
import UserPageHeader from "../../components/user/UserPageHeader";
import UserStayCard from "../../components/user/UserStayCard";
import { userWishlistData } from "../../data/userHomeData";
import "./UserHome.css";
import "./UserPages.css";

/**
 * Highlights one saved property as the emotional anchor of the collection.
 * It remains presentational; actual saved-state mutations will come from the
 * backend wishlist service in a later phase.
 */
function FeaturedSavedStay({ stay }) {
  return (
    <article className="elite-saved-feature" data-user-page-reveal>
      <Link to={`/property/${stay.id}`} className="elite-saved-feature__media">
        <img src={stay.image} alt={stay.imageAlt} loading="lazy" />
        <span aria-hidden="true" />
      </Link>

      <div className="elite-saved-feature__content">
        <p className="elite-user-page-header__eyebrow">Saved for later</p>
        <p className="elite-saved-feature__location">
          <MapPin size={15} aria-hidden="true" />
          {stay.location}
        </p>
        <h3>{stay.name}</h3>
        <p>{stay.descriptor}</p>
        <div className="elite-saved-feature__meta">
          <span>
            <Star size={15} fill="currentColor" aria-hidden="true" />
            {stay.rating}
          </span>
          <strong>
            {stay.price}
            <small>{stay.qualifier}</small>
          </strong>
        </div>
        <div className="elite-saved-feature__actions">
          <Link to={`/property/${stay.id}`}>
            Open stay
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
          <button type="button" aria-label={`Remove ${stay.name} from saved stays`}>
            <X size={16} aria-hidden="true" />
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}

/**
 * Shows a saved stay inside the broader collection grid.
 * The remove affordance is visual-only until API-backed wishlist mutation is
 * connected, but it uses the same accessible button semantics as production.
 */
function SavedCollectionCard({ stay }) {
  return (
    <div className={`elite-saved-card elite-saved-card--${stay.variant ?? "standard"}`}>
      <UserStayCard stay={stay} variant={stay.variant} />
      <button
        type="button"
        className="elite-saved-card__remove"
        aria-label={`Remove ${stay.name} from saved stays`}
      >
        <Heart size={15} fill="currentColor" aria-hidden="true" />
        Saved
      </button>
    </div>
  );
}

/**
 * Replaces the Wishlist placeholder with a visual saved-stays collection.
 * Preview mode only adjusts recovery links; the saved data remains isolated
 * presentation content until the backend wishlist service is available.
 */
export default function Wishlist({ previewMode = false }) {
  const searchPath = previewMode ? "/dev/user-preview/explore" : "/search";
  const { emptyState, featuredSavedStay, presentationState, stays } =
    userWishlistData;
  const heroDetails = [
    { label: "Saved stays", value: String(stays.length) },
    { label: "Featured", value: featuredSavedStay.location },
    { label: "Mood", value: "Private collection" },
  ];
  const resolvedEmptyState = {
    ...emptyState,
    actionTo: searchPath,
  };

  return (
    <section className="elite-user-page elite-user-saved" data-user-page>
      <UserPageHeader
        eyebrow="Saved"
        tone="collection"
        signature="PRIVATE"
        detailItems={heroDetails}
        title="Your private collection."
        description="Layered stays, saved for the moment when the right dates and the right reason arrive together."
        media={<img src={featuredSavedStay.image} alt="" loading="lazy" />}
      />

      {presentationState.isLoading ? (
        <ContentSkeleton count={4} />
      ) : presentationState.error ? (
        <SectionErrorState
          title="We couldn't load saved stays."
          description="Try again shortly or continue exploring."
        />
      ) : stays.length ? (
        <>
          <FeaturedSavedStay stay={featuredSavedStay} />

          <div className="elite-saved-grid" data-user-page-reveal>
            {stays.map((stay) => (
              <SavedCollectionCard key={stay.id} stay={stay} />
            ))}
          </div>
        </>
      ) : (
        <SectionEmptyState {...resolvedEmptyState} />
      )}
    </section>
  );
}
