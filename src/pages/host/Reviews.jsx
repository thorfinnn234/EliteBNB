import { useEffect, useState } from "react";
import { Calendar, Star } from "lucide-react";
import { reviewService } from "../../services/reviewService";

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const formatDate = (value) => {
  if (!value) return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
};

const getInitials = (name) =>
  name
    ?.trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "G";

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [sortBy, setSortBy] = useState("recent");
  const [filterRating, setFilterRating] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseDraft, setResponseDraft] = useState("");
  const [responseError, setResponseError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const result = await reviewService.getHostReviews();
        setReviews(Array.isArray(result.data) ? result.data : []);
      } catch (error) {
        setLoadError(getErrorMessage(error, "Unable to load guest reviews."));
      } finally {
        setIsLoading(false);
      }
    };

    loadReviews();
  }, []);

  const totalReviews = reviews.length;
  const averageRating = totalReviews
    ? reviews.reduce((total, review) => total + Number(review.rating || 0), 0) /
      totalReviews
    : 0;
  const distribution = reviews.reduce(
    (counts, review) => {
      const rating = Number(review.rating);
      if (rating >= 1 && rating <= 5) counts[rating] += 1;
      return counts;
    },
    { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  );

  const displayedReviews = reviews
    .filter(
      (review) =>
        filterRating === "all" || Number(review.rating) === Number(filterRating),
    )
    .sort((first, second) => {
      if (sortBy === "rating-high") return second.rating - first.rating;
      if (sortBy === "rating-low") return first.rating - second.rating;
      return (
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime()
      );
    });

  const renderStars = (rating) =>
    Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        size={16}
        className={
          index < rating
            ? "fill-[#D4A72C] text-[#D4A72C]"
            : "text-[#E5E7EB]"
        }
      />
    ));

  const startResponse = (review) => {
    setRespondingTo(review.id);
    setResponseDraft(review.hostResponse || "");
    setResponseError("");
  };

  const submitResponse = async (reviewId) => {
    const response = responseDraft.trim();
    if (!response) {
      setResponseError("Please enter a response before submitting.");
      return;
    }

    setIsSubmitting(true);
    setResponseError("");
    try {
      const result = await reviewService.respond(reviewId, response);
      const updatedReview = result.data;
      setReviews((currentReviews) =>
        currentReviews.map((review) =>
          review.id === reviewId ? updatedReview : review,
        ),
      );
      setRespondingTo(null);
      setResponseDraft("");
    } catch (error) {
      setResponseError(
        getErrorMessage(
          error,
          "Unable to submit your response. Please try again.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="min-h-screen bg-[#FAF9F6] p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#D4A72C]">
            FEEDBACK
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-[#172554] md:text-4xl">
            Reviews
          </h1>
          <p className="mt-2 text-[#64748B]">
            See what guests are saying about your properties.
          </p>
        </div>

        {loadError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            {loadError}
          </div>
        ) : (
          <>
            <div className="mb-8 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-[#64748B]">
                  Overall Rating
                </p>
                <div className="mt-4">
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-bold text-[#172554]">
                      {isLoading ? "-" : averageRating.toFixed(1)}
                    </span>
                    <div className="mb-1 flex gap-1">
                      {renderStars(Math.round(averageRating))}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-[#64748B]">
                    Based on {isLoading ? "-" : totalReviews} reviews
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
                <p className="mb-4 text-sm font-medium text-[#64748B]">
                  Rating Distribution
                </p>
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center gap-3">
                      <span className="w-8 text-sm font-medium text-[#172554]">
                        {rating}⭐
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#E5E7EB]">
                        <div
                          className="h-full bg-[#D4A72C]"
                          style={{
                            width: `${totalReviews ? (distribution[rating] / totalReviews) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-[#64748B]">
                        {isLoading ? "-" : distribution[rating]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
              <div className="border-b border-[#E5E7EB] p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <h2 className="font-bold text-[#172554]">Guest Reviews</h2>
                  <div className="flex gap-3">
                    <select
                      value={sortBy}
                      onChange={(event) => setSortBy(event.target.value)}
                      className="rounded-lg border border-[#E5E7EB] bg-[#FAF9F6] px-3 py-2 text-sm text-[#172554] focus:border-[#D4A72C] focus:outline-none"
                    >
                      <option value="recent">Most Recent</option>
                      <option value="rating-high">Highest Rated</option>
                      <option value="rating-low">Lowest Rated</option>
                    </select>
                    <select
                      value={filterRating}
                      onChange={(event) => setFilterRating(event.target.value)}
                      className="rounded-lg border border-[#E5E7EB] bg-[#FAF9F6] px-3 py-2 text-sm text-[#172554] focus:border-[#D4A72C] focus:outline-none"
                    >
                      <option value="all">All Ratings</option>
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <option key={rating} value={rating}>
                          {rating} Stars
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="p-10 text-center text-sm text-[#64748B]">
                  Loading guest reviews...
                </div>
              ) : displayedReviews.length === 0 ? (
                <div className="p-10 text-center">
                  <h3 className="font-semibold text-[#172554]">
                    {totalReviews
                      ? "No reviews match this filter"
                      : "No guest reviews yet"}
                  </h3>
                  <p className="mt-2 text-sm text-[#64748B]">
                    {totalReviews
                      ? "Try selecting a different rating."
                      : "Reviews will appear here after completed guest stays."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#E5E7EB]">
                  {displayedReviews.map((review) => (
                    <div key={review.id} className="p-6">
                      <div className="flex items-start gap-4">
                        {review.guestProfileImageUrl ? (
                          <img
                            src={review.guestProfileImageUrl}
                            alt={review.guestName || "Guest"}
                            className="h-12 w-12 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#D4A72C] to-[#b88d1d] text-sm font-bold text-white">
                            {getInitials(review.guestName)}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-[#172554]">
                                {review.guestName || "Guest"}
                              </h3>
                              <div className="mt-1 flex items-center gap-2">
                                <div className="flex gap-1">
                                  {renderStars(review.rating)}
                                </div>
                                <span className="text-xs text-[#64748B]">
                                  {review.rating} out of 5
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="flex items-center gap-1 text-xs text-[#64748B]">
                                <Calendar size={12} />
                                {formatDate(review.createdAt)}
                              </p>
                              <p className="mt-1 text-xs font-medium text-[#94A3B8]">
                                {review.propertyTitle || "Property unavailable"}
                              </p>
                            </div>
                          </div>
                          <p className="mt-3 text-sm text-[#475569]">
                            {review.comment}
                          </p>

                          {review.hostResponse ? (
                            <div className="mt-4 border-l-2 border-[#D4A72C] pl-4">
                              <p className="text-xs font-semibold uppercase tracking-wide text-[#D4A72C]">
                                Your response
                              </p>
                              <p className="mt-1 text-sm text-[#475569]">
                                {review.hostResponse}
                              </p>
                            </div>
                          ) : respondingTo === review.id ? (
                            <div className="mt-4 max-w-2xl">
                              <textarea
                                value={responseDraft}
                                onChange={(event) =>
                                  setResponseDraft(event.target.value)
                                }
                                rows={3}
                                placeholder="Write a response to your guest"
                                className="w-full rounded-lg border border-[#E5E7EB] bg-[#FAF9F6] p-3 text-sm text-[#172554] focus:border-[#D4A72C] focus:outline-none"
                              />
                              {responseError && (
                                <p className="mt-2 text-sm text-red-600">
                                  {responseError}
                                </p>
                              )}
                              <div className="mt-2 flex gap-3">
                                <button
                                  type="button"
                                  onClick={() => submitResponse(review.id)}
                                  disabled={isSubmitting}
                                  className="rounded-lg bg-[#172554] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {isSubmitting
                                    ? "Submitting..."
                                    : "Submit response"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRespondingTo(null)}
                                  disabled={isSubmitting}
                                  className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#64748B]"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startResponse(review)}
                              className="mt-3 text-sm font-medium text-[#D4A72C] hover:underline"
                            >
                              Respond
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
