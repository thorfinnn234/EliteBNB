import { ArrowRight, Heart, MapPin, Star, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ContentSkeleton,
  SectionEmptyState,
  SectionErrorState,
} from "../../components/user/UserFeedbackStates";
import UserPageHeader from "../../components/user/UserPageHeader";
import UserStayCard from "../../components/user/UserStayCard";
import { userWishlistData } from "../../data/userHomeData";
import { favoriteService } from "../../services/favoriteService";
import {
  mapFavoriteToStay,
  normalizeApiList,
} from "../../utils/userBackendMappers";
import "./UserHome.css";
import "./UserPages.css";

/**
 * Highlights one saved property as the emotional anchor of the collection.
 * Production routes can remove the stay through the favorite service, while
 * preview mode keeps the same interaction safely presentational.
 */
function FeaturedSavedStay({ onRemove, removingId, stay }) {
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
          <button
            type="button"
            aria-label={`Remove ${stay.name} from saved stays`}
            disabled={removingId === stay.id}
            onClick={() => onRemove(stay)}
          >
            <X size={16} aria-hidden="true" />
            {removingId === stay.id ? "Removing..." : "Remove"}
          </button>
        </div>
      </div>
    </article>
  );
}

/**
 * Shows a saved stay inside the broader collection grid.
 * The remove affordance calls the favorite service in production and remains
 * safely inert in DEV preview mode.
 */
function SavedCollectionCard({ onRemove, removingId, stay }) {
  return (
    <div className={`elite-saved-card elite-saved-card--${stay.variant ?? "standard"}`}>
      <UserStayCard stay={stay} variant={stay.variant} />
      <button
        type="button"
        className="elite-saved-card__remove"
        aria-label={`Remove ${stay.name} from saved stays`}
        disabled={removingId === stay.id}
        onClick={() => onRemove(stay)}
      >
        <Heart size={15} fill="currentColor" aria-hidden="true" />
        {removingId === stay.id ? "Removing" : "Saved"}
      </button>
    </div>
  );
}

/**
 * Replaces the Wishlist placeholder with a visual saved-stays collection.
 * Preview mode only adjusts recovery links; the saved data remains isolated
 * presentation content while production routes load favorite-service data.
 */
export default function Wishlist({ previewMode = false }) {
  const searchPath = previewMode ? "/dev/user-preview/explore" : "/search";
  const [removingId, setRemovingId] = useState(null);
  const [productionStays, setProductionStays] = useState([]);
  const [productionState, setProductionState] = useState({
    isLoading: !previewMode,
    error: false,
  });

  /**
   * Loads the real favorite list for production routes while preserving the
   * isolated mock collection for DEV preview.
   */
  useEffect(() => {
    if (previewMode) {
      return undefined;
    }

    let isMounted = true;

    async function loadFavorites() {
      try {
        setProductionState({ isLoading: true, error: false });

        const response = await favoriteService.getMine();
        const favorites = normalizeApiList(response.data).map(
          (favorite, index) =>
            mapFavoriteToStay(
              favorite,
              userWishlistData.stays[index],
              userWishlistData.stays[index]?.variant
            )
        );

        if (isMounted) {
          setProductionStays(favorites);
          setProductionState({ isLoading: false, error: false });
        }
      } catch (error) {
        console.error("Failed to load saved stays:", error);

        if (isMounted) {
          setProductionStays([]);
          setProductionState({ isLoading: false, error: true });
        }
      }
    }

    loadFavorites();

    return () => {
      isMounted = false;
    };
  }, [previewMode]);

  const { emptyState } = userWishlistData;
  const presentationState = previewMode
    ? userWishlistData.presentationState
    : productionState;
  const stays = previewMode ? userWishlistData.stays : productionStays;
  const featuredSavedStay = previewMode
    ? userWishlistData.featuredSavedStay
    : productionStays[0] ?? null;
  const heroDetails = [
    { label: "Saved stays", value: String(stays.length) },
    {
      label: "Featured",
      value: featuredSavedStay?.location ?? "Collection pending",
    },
    { label: "Mood", value: "Private collection" },
  ];
  const resolvedEmptyState = {
    ...emptyState,
    actionTo: searchPath,
  };

  /**
   * Removes a saved property through the real favorite service in production.
   * Preview mode keeps the button presentational so it cannot mutate backend
   * or auth state during visual review.
   */
  const handleRemoveFavorite = async (stay) => {
    if (previewMode) return;

    try {
      setRemovingId(stay.id);
      await favoriteService.remove(stay.propertyId ?? stay.id);

      setProductionStays((currentStays) =>
        currentStays.filter((currentStay) => currentStay.id !== stay.id)
      );
    } catch (error) {
      console.error("Failed to remove saved stay:", error);
      setProductionState({ isLoading: false, error: true });
    } finally {
      setRemovingId(null);
    }
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
        media={
          featuredSavedStay ? (
            <img src={featuredSavedStay.image} alt="" loading="lazy" />
          ) : null
        }
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
          <FeaturedSavedStay
            onRemove={handleRemoveFavorite}
            removingId={removingId}
            stay={featuredSavedStay}
          />

          <div className="elite-saved-grid" data-user-page-reveal>
            {stays.map((stay) => (
              <SavedCollectionCard
                key={stay.id}
                onRemove={handleRemoveFavorite}
                removingId={removingId}
                stay={stay}
              />
            ))}
          </div>
        </>
      ) : (
        <SectionEmptyState {...resolvedEmptyState} />
      )}
    </section>
  );
}
