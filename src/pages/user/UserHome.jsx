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
 * Renders the first authenticated guest dashboard experience.
 * It combines discovery, recommendation, trip, and saved-stay modules while
 * keeping mock presentation data isolated for later API replacement.
 */
export default function UserHome({ previewMode = false, previewUser }) {
  const { user } = useAuth();
  const firstName = getFirstName(previewUser ?? user);
  const greeting = firstName ? `Welcome back, ${firstName}.` : "Welcome back.";
  const searchPath = previewMode ? "/dev/user-preview/explore" : "/search";
  const savedPath = previewMode ? "/dev/user-preview/saved" : "/user/wishlist";
  const tripsPath = previewMode ? "/dev/user-preview/trips" : "/user/trips";
  const {
    briefing,
    discoveryShortcuts,
    emptyStates,
    featuredStay,
    presentationState,
    recommendations,
    savedStays,
    upcomingTrip,
  } = userHomeData;

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
