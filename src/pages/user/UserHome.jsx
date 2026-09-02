import DiscoveryChips from "../../components/user/DiscoveryChips";
import FeaturedStay from "../../components/user/FeaturedStay";
import GuestSearch from "../../components/user/GuestSearch";
import SavedPreview from "../../components/user/SavedPreview";
import UpcomingTrip from "../../components/user/UpcomingTrip";
import {
  ContentSkeleton,
  SectionEmptyState,
  SectionErrorState,
} from "../../components/user/UserFeedbackStates";
import UserSectionHeading from "../../components/user/UserSectionHeading";
import UserStayCard from "../../components/user/UserStayCard";
import { useAuth } from "../../hooks/useAuth";
import { userHomeData } from "../../data/userHomeData";
import { useEffect, useState } from "react";
import { bookingService } from "../../services/bookingService";
import { favoriteService } from "../../services/favoriteService";
import { propertyService } from "../../services/propertyService";
import {
  mapBookingToTrip,
  mapFavoriteToStay,
  mapPropertyToStay,
  normalizeApiList,
} from "../../utils/userBackendMappers";
import "./UserHome.css";

/**
 * Extracts a friendly first name from the authenticated user shape.
 * The auth integration may receive different backend field names, so this
 * helper gracefully falls back without hardcoding a sample user.
 */
function getFirstName(user) {
  if (user?.firstName) return user.firstName;
  if (user?.name) return user.name.split(" ")[0];
  if (user?.email) return user.email.split("@")[0];

  return "";
}

/**
 * Finds the first booking that still belongs in the guest's upcoming journey
 * space. Backend status rules stay authoritative; this only groups returned
 * data for the existing home preview card.
 */
function getFirstUpcomingBooking(bookings) {
  return normalizeApiList(bookings).find((booking) => {
    const status = String(booking?.status || "").toUpperCase();

    return status !== "COMPLETED" && status !== "CANCELLED";
  });
}

/**
 * Builds the accepted User Home presentation shape from backend service
 * responses. Missing endpoints become section-level errors rather than
 * replacing the full page with fallback mock data.
 */
function buildProductionHome({
  bookingsResult,
  favoritesResult,
  propertiesResult,
}) {
  const properties =
    propertiesResult.status === "fulfilled"
      ? normalizeApiList(propertiesResult.value.data)
      : [];
  const favorites =
    favoritesResult.status === "fulfilled"
      ? normalizeApiList(favoritesResult.value.data)
      : [];
  const bookings =
    bookingsResult.status === "fulfilled"
      ? normalizeApiList(bookingsResult.value.data)
      : [];
  const [leadProperty, ...supportingProperties] = properties;
  const firstUpcomingBooking = getFirstUpcomingBooking(bookings);

  return {
    featuredStay: leadProperty
      ? {
          ...mapPropertyToStay(
            leadProperty,
            userHomeData.featuredStay,
            userHomeData.featuredStay.variant
          ),
          eyebrow: userHomeData.featuredStay.eyebrow,
          reason: userHomeData.featuredStay.reason,
        }
      : null,
    recommendations: supportingProperties
      .slice(0, userHomeData.recommendations.length)
      .map((property, index) =>
        mapPropertyToStay(
          property,
          userHomeData.recommendations[index],
          userHomeData.recommendations[index]?.variant
        )
      ),
    savedStays: favorites
      .slice(0, userHomeData.savedStays.length)
      .map((favorite, index) =>
        mapFavoriteToStay(
          favorite,
          userHomeData.savedStays[index],
          userHomeData.savedStays[index]?.variant
        )
      ),
    upcomingTrip: firstUpcomingBooking
      ? mapBookingToTrip(firstUpcomingBooking, userHomeData.upcomingTrip)
      : null,
    presentationState: {
      isLoading: false,
      errors: {
        featuredStay: propertiesResult.status === "rejected",
        recommendations: propertiesResult.status === "rejected",
        upcomingTrip: bookingsResult.status === "rejected",
        savedStays: favoritesResult.status === "rejected",
      },
    },
  };
}

/**
 * Renders the first authenticated guest dashboard experience.
 * It combines discovery, recommendation, trip, and saved-stay modules while
 * keeping mock presentation data isolated for later API replacement.
 */
export default function UserHome({ previewMode = false, previewUser }) {
  const { user } = useAuth();
  const [productionHome, setProductionHome] = useState(null);
  const [productionState, setProductionState] = useState({
    isLoading: !previewMode,
    errors: {
      featuredStay: false,
      recommendations: false,
      upcomingTrip: false,
      savedStays: false,
    },
  });
  const firstName = getFirstName(previewUser ?? user);
  const greeting = firstName ? `Welcome back, ${firstName}.` : "Welcome back.";
  const searchPath = previewMode ? "/dev/user-preview/explore" : "/search";
  const savedPath = previewMode ? "/dev/user-preview/saved" : "/user/wishlist";
  const tripsPath = previewMode ? "/dev/user-preview/trips" : "/user/trips";
  /**
   * Production pages use the backend services that arrived from `origin/main`.
   * Development preview mode deliberately skips those calls so visual QA stays
   * independent of AuthContext, tokens, and a running backend.
   */
  useEffect(() => {
    if (previewMode) {
      return undefined;
    }

    let isMounted = true;

    async function loadUserHome() {
      setProductionState((currentState) => ({
        ...currentState,
        isLoading: true,
      }));

      const [propertiesResult, favoritesResult, bookingsResult] =
        await Promise.allSettled([
          propertyService.getAll(),
          favoriteService.getMine(),
          bookingService.getMine(),
        ]);

      if (!isMounted) return;

      const nextHome = buildProductionHome({
        bookingsResult,
        favoritesResult,
        propertiesResult,
      });

      setProductionHome(nextHome);
      setProductionState(nextHome.presentationState);
    }

    loadUserHome();

    return () => {
      isMounted = false;
    };
  }, [previewMode]);

  const homeSource =
    previewMode || !productionHome
      ? userHomeData
      : {
          ...userHomeData,
          ...productionHome,
          presentationState: productionState,
        };

  const {
    briefing,
    discoveryShortcuts,
    emptyStates,
    featuredStay,
    presentationState,
    recommendations,
    savedStays,
    upcomingTrip,
  } = homeSource;

  const { errors, isLoading } = presentationState;

  /**
   * Keeps empty-state recovery links inside the preview route family when the
   * backend-free development preview is active.
   */
  const getPreviewAwareEmptyState = (emptyState) => ({
    ...emptyState,
    actionTo: emptyState.actionTo === "/search" ? searchPath : emptyState.actionTo,
  });

  return (
    <div className="elite-user-home">
      <section
        className="elite-user-home__intro"
        aria-labelledby="elite-user-home-title"
        data-user-home-reveal
      >
        <div className="elite-user-home__intro-copy">
          <p className="elite-user-home__eyebrow">Private guest workspace</p>
          <h2 id="elite-user-home-title">{greeting}</h2>
          <p>
            Where should we take you next? Your current briefing is shaped
            around restful coastlines, precise hospitality and stays worth
            returning to.
          </p>
        </div>
        <div className="elite-user-home__intro-note" aria-label="Guest briefing">
          <div>
            <span>{briefing.label}</span>
            <strong>{briefing.title}</strong>
          </div>
          <p>{briefing.detail}</p>
        </div>
        <div
          className="elite-user-home__intro-search"
          aria-label="Search for a stay"
        >
          <GuestSearch searchPath={searchPath} />
        </div>
        {featuredStay ? (
          <div className="elite-user-home__intro-window" aria-hidden="true">
            <img src={featuredStay.image} alt="" loading="lazy" />
          </div>
        ) : null}
      </section>

      <div className="elite-user-home__primary-grid">
        <section className="elite-user-home__featured" data-user-home-reveal>
          {isLoading ? (
            <ContentSkeleton variant="featured" />
          ) : errors.featuredStay ? (
            <SectionErrorState
              title="We couldn't load your selected stay."
              description="Your recommendations will be available again shortly."
            />
          ) : featuredStay ? (
            <FeaturedStay stay={featuredStay} />
          ) : (
            <SectionEmptyState
              {...getPreviewAwareEmptyState(emptyStates.recommendations)}
            />
          )}
        </section>

        <aside className="elite-user-home__side-stack" data-user-home-reveal>
          <section className="elite-user-home__panel">
            {isLoading ? (
              <ContentSkeleton variant="trip" />
            ) : errors.upcomingTrip ? (
              <SectionErrorState
                title="We couldn't load your trip."
                description="Your booking preview can be retried from Trips."
              />
            ) : upcomingTrip ? (
              <UpcomingTrip actionTo={tripsPath} trip={upcomingTrip} />
            ) : (
              <SectionEmptyState
                {...getPreviewAwareEmptyState(emptyStates.upcomingTrip)}
              />
            )}
          </section>

          <section className="elite-user-home__panel">
            <UserSectionHeading
              eyebrow="Saved"
              title="Return to what caught your eye"
              actionLabel="View all"
              actionTo={savedPath}
            />

            {isLoading ? (
              <ContentSkeleton count={2} />
            ) : errors.savedStays ? (
              <SectionErrorState
                title="We couldn't load saved stays."
                description="Saved stays will be available again shortly."
              />
            ) : savedStays.length ? (
              <SavedPreview actionTo={savedPath} stays={savedStays} />
            ) : (
              <SectionEmptyState
                {...getPreviewAwareEmptyState(emptyStates.savedStays)}
              />
            )}
          </section>
        </aside>
      </div>

      <section
        className="elite-user-home__section elite-user-home__section--recommendations"
        data-user-home-reveal
      >
        <UserSectionHeading
          eyebrow="Recommended"
          title="Stays to consider next"
          description="A small edit of residences with the design, location and calm that define EliteBNB."
          actionLabel="View all"
          actionTo={searchPath}
        />

        {isLoading ? (
          <ContentSkeleton count={4} />
        ) : errors.recommendations ? (
          <SectionErrorState
            title="We couldn't load these stays."
            description="Try again soon or continue exploring all stays."
          />
        ) : recommendations.length ? (
          <div className="elite-user-home__card-grid">
            {recommendations.map((stay) => (
              <UserStayCard key={stay.id} stay={stay} variant={stay.variant} />
            ))}
          </div>
        ) : (
          <SectionEmptyState
            {...getPreviewAwareEmptyState(emptyStates.recommendations)}
          />
        )}
      </section>

      <section
        className="elite-user-home__section elite-user-home__section--discovery"
        data-user-home-reveal
      >
        <UserSectionHeading
          eyebrow="Explore by mood"
          title="Choose the shape of the stay"
          description="Move by mood first, then narrow the details when a place begins to feel right."
        />
        <DiscoveryChips searchPath={searchPath} shortcuts={discoveryShortcuts} />
      </section>
    </div>
  );
}
