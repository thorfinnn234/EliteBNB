import { ArrowRight, PenLine, Star, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ContentSkeleton,
  SectionEmptyState,
  SectionErrorState,
} from "../../components/user/UserFeedbackStates";
import UserPageHeader from "../../components/user/UserPageHeader";
import { userReviewsData } from "../../data/userHomeData";
import "./UserHome.css";
import "./UserPages.css";

/**
 * Renders star icons for submitted reviews without exposing them as controls.
 */
function StaticRating({ rating }) {
  return (
    <span className="elite-review-rating" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          size={14}
          fill={index < rating ? "currentColor" : "none"}
          key={`rating-${index}`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

/**
 * Displays one completed review as guest-written travel context.
 */
function SubmittedReviewCard({ review }) {
  return (
    <article className="elite-review-card">
      <img src={review.image} alt={review.imageAlt} loading="lazy" />
      <div>
        <div className="elite-review-card__topline">
          <StaticRating rating={review.rating} />
          <span>{review.date}</span>
        </div>
        <h3>{review.property}</h3>
        <p className="elite-review-card__location">{review.location}</p>
        <p className="elite-review-card__text">“{review.text}”</p>
        <Link to={`/property/${review.propertyId}`}>
          Open stay
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

/**
 * Presents a completed stay that can be reviewed in the preview interface.
 */
function ReadyReviewCard({ stay, onWriteReview }) {
  return (
    <article className="elite-ready-review">
      <img src={stay.image} alt={stay.imageAlt} loading="lazy" />
      <div>
        <p>{stay.completedDate}</p>
        <h3>{stay.property}</h3>
        <span>{stay.location}</span>
      </div>
      <button type="button" onClick={() => onWriteReview(stay)}>
        <PenLine size={16} aria-hidden="true" />
        Write a review
      </button>
    </article>
  );
}

/**
 * Renders an accessible presentation-only review form.
 * It validates local input and demonstrates submit/loading states without
 * creating a fake backend review submission.
 */
function ReviewModal({
  error,
  isSubmitting,
  onChangeRating,
  onChangeText,
  onClose,
  onSubmit,
  rating,
  stay,
  text,
}) {
  if (!stay) return null;

  return (
    <div
      className="elite-review-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="elite-review-modal-title"
    >
      <div className="elite-review-modal__panel">
        <button
          type="button"
          className="elite-review-modal__close"
          aria-label="Close review form"
          onClick={onClose}
        >
          <X size={18} aria-hidden="true" />
        </button>

        <p className="elite-user-page-header__eyebrow">Ready to review</p>
        <h3 id="elite-review-modal-title">{stay.property}</h3>
        <p>{stay.location}</p>

        <form onSubmit={onSubmit}>
          <fieldset>
            <legend>Your rating</legend>
            <div className="elite-review-modal__stars">
              {Array.from({ length: 5 }).map((_, index) => {
                const starValue = index + 1;

                return (
                  <button
                    type="button"
                    aria-label={`${starValue} star${starValue > 1 ? "s" : ""}`}
                    aria-pressed={rating === starValue}
                    className={rating >= starValue ? "is-active" : ""}
                    key={starValue}
                    onClick={() => onChangeRating(starValue)}
                  >
                    <Star size={20} fill="currentColor" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label>
            Review
            <textarea
              value={text}
              onChange={(event) => onChangeText(event.target.value)}
              rows={5}
              placeholder="Share what made the stay memorable."
            />
          </label>

          {error ? <p className="elite-review-modal__error">{error}</p> : null}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving draft..." : "Submit review"}
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * Replaces the Reviews placeholder with submitted and ready-to-review states.
 * The modal demonstrates form validation and submit feedback while leaving
 * eligibility and persistence to the future backend integration.
 */
export default function Reviews() {
  const [activeStay, setActiveStay] = useState(null);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const submitTimerRef = useRef(null);
  const { emptyStates, presentationState, readyToReview, submitted } =
    userReviewsData;
  const heroMemory = submitted[0] ?? readyToReview[0];
  const heroDetails = [
    { label: "Written", value: String(submitted.length) },
    { label: "Ready", value: String(readyToReview.length) },
    { label: "Tone", value: "Travel journal" },
  ];

  /**
   * Removes any pending preview submit timer when the page unmounts.
   */
  useEffect(() => {
    return () => {
      window.clearTimeout(submitTimerRef.current);
    };
  }, []);

  /**
   * Lets keyboard users dismiss the modal with Escape.
   */
  useEffect(() => {
    if (!activeStay) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setActiveStay(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeStay]);

  /**
   * Opens the local review form and clears previous validation state.
   */
  const handleOpenReview = (stay) => {
    setActiveStay(stay);
    setFormError("");
    setIsSubmitting(false);
    setRating(0);
    setReviewText("");
  };

  /**
   * Closes the modal and resets the local presentation form.
   */
  const handleCloseReview = () => {
    setActiveStay(null);
    setFormError("");
    setIsSubmitting(false);
  };

  /**
   * Validates the preview form locally and briefly shows submit state.
   */
  const handleSubmitReview = (event) => {
    event.preventDefault();

    if (!rating) {
      setFormError("Choose a rating before submitting.");
      return;
    }

    if (reviewText.trim().length < 20) {
      setFormError("Write at least 20 characters about the stay.");
      return;
    }

    setFormError("");
    setIsSubmitting(true);
    submitTimerRef.current = window.setTimeout(() => {
      setIsSubmitting(false);
      setActiveStay(null);
    }, 450);
  };

  return (
    <section className="elite-user-page elite-user-reviews" data-user-page>
      <UserPageHeader
        eyebrow="Reviews"
        tone="memory"
        signature="STORIES"
        detailItems={heroDetails}
        title="Stories from your stays, kept in your own words."
        description="Reviews become a quiet travel journal here: what you wrote, what is ready to capture, and what should shape the next recommendation."
        media={
          heroMemory ? (
            <figure className="elite-review-hero-memory">
              <img
                src={heroMemory.image}
                alt=""
                loading="lazy"
              />
              <figcaption>
                <span>{heroMemory.location}</span>
                <strong>
                  {heroMemory.property ?? heroMemory.propertyName}
                </strong>
              </figcaption>
            </figure>
          ) : null
        }
      />

      {presentationState.isLoading ? (
        <ContentSkeleton count={3} />
      ) : presentationState.error ? (
        <SectionErrorState
          title="We couldn't load your reviews."
          description="Try again shortly."
        />
      ) : (
        <div className="elite-reviews-layout">
          <section className="elite-user-page__surface" data-user-page-reveal>
            <div className="elite-user-section-heading">
              <div>
                <p className="elite-user-section-heading__eyebrow">
                  Your reviews
                </p>
                <h2>Shared after checkout</h2>
              </div>
            </div>
            {submitted.length ? (
              <div className="elite-review-list">
                {submitted.map((review) => (
                  <SubmittedReviewCard key={review.id} review={review} />
                ))}
              </div>
            ) : (
              <SectionEmptyState {...emptyStates.submitted} />
            )}
          </section>

          <aside className="elite-user-page__surface" data-user-page-reveal>
            <div className="elite-user-section-heading">
              <div>
                <p className="elite-user-section-heading__eyebrow">
                  Ready to review
                </p>
                <h2>Recently completed</h2>
              </div>
            </div>
            {readyToReview.length ? (
              <div className="elite-ready-review-list">
                {readyToReview.map((stay) => (
                  <ReadyReviewCard
                    key={stay.id}
                    onWriteReview={handleOpenReview}
                    stay={stay}
                  />
                ))}
              </div>
            ) : (
              <SectionEmptyState {...emptyStates.readyToReview} />
            )}
          </aside>
        </div>
      )}

      <ReviewModal
        error={formError}
        isSubmitting={isSubmitting}
        onChangeRating={setRating}
        onChangeText={setReviewText}
        onClose={handleCloseReview}
        onSubmit={handleSubmitReview}
        rating={rating}
        stay={activeStay}
        text={reviewText}
      />
    </section>
  );
}
