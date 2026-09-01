import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  MessageSquareText,
  RefreshCcw,
  Star,
} from "lucide-react";

import { bookingService } from "../../services/bookingService";
import { reviewService } from "../../services/reviewService";

export default function Reviews() {
  const navigate = useNavigate();

  const [reviews, setReviews] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [reviewsResult, bookingsResult] =
        await Promise.allSettled([
          reviewService.getMine(),
          bookingService.getMine(),
        ]);

      if (reviewsResult.status === "fulfilled") {
        setReviews(reviewsResult.value.data || []);
      } else if (reviewsResult.reason?.response?.status === 404) {
        setReviews([]);
      } else {
        throw reviewsResult.reason;
      }

      if (bookingsResult.status === "fulfilled") {
        setBookings(bookingsResult.value.data || []);
      } else {
        throw bookingsResult.reason;
      }
    } catch (err) {
      console.error("Failed to load reviews:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "We couldn't load your reviews right now."
      );
    } finally {
      setLoading(false);
    }
  };

  const reviewedBookingIds = useMemo(() => {
    return new Set(
      reviews.map((review) => review.bookingId)
    );
  }, [reviews]);

  const reviewableBookings = useMemo(() => {
    return bookings.filter(
      (booking) =>
        booking.status === "COMPLETED" &&
        !reviewedBookingIds.has(booking.id)
    );
  }, [bookings, reviewedBookingIds]);

  const handleOpenReview = (booking) => {
    setSelectedBooking(booking);
    setRating(5);
    setComment("");
    setSubmitError("");
  };

  const handleCloseReview = () => {
    if (submitting) return;

    setSelectedBooking(null);
    setRating(5);
    setComment("");
    setSubmitError("");
  };

  const handleSubmitReview = async () => {
    if (!selectedBooking) return;

    if (!comment.trim()) {
      setSubmitError("Please write a short review.");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError("");

      const response = await reviewService.create({
        bookingId: selectedBooking.id,
        rating,
        comment: comment.trim(),
      });

      setReviews((current) => [
        response.data,
        ...current,
      ]);

      handleCloseReview();
    } catch (err) {
      console.error("Failed to submit review:", err);

      setSubmitError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "We couldn't submit your review."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return "";

    return new Intl.DateTimeFormat("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  };

  return (
    <main className="min-h-screen bg-[#FAF9F6]">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        {/* HEADER */}
        <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4A72C]">
              Your experience
            </p>

            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#172554] sm:text-4xl">
              Reviews & Ratings
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-[#64748B]">
              Share feedback about completed stays and
              revisit reviews you've already written.
            </p>
          </div>

          {!loading && (
            <button
              type="button"
              onClick={loadData}
              className="flex w-fit items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-semibold text-[#172554] transition hover:border-[#D4A72C]"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>
          )}
        </section>

        {/* LOADING */}
        {loading && (
          <section className="mt-8 space-y-5">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-3xl border border-[#E5E7EB] bg-white p-6"
              >
                <div className="h-5 w-1/3 animate-pulse rounded bg-[#E5E7EB]" />
                <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-[#E5E7EB]" />
                <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-[#E5E7EB]" />
              </div>
            ))}
          </section>
        )}

        {/* ERROR */}
        {!loading && error && (
          <section className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
            <h2 className="text-xl font-extrabold text-red-700">
              Unable to load reviews
            </h2>

            <p className="mt-2 text-sm text-red-600">
              {String(error)}
            </p>

            <button
              type="button"
              onClick={loadData}
              className="mt-5 rounded-xl bg-[#172554] px-5 py-2.5 text-sm font-bold text-white"
            >
              Try again
            </button>
          </section>
        )}

        {!loading && !error && (
          <>
            {/* ELIGIBLE BOOKINGS */}
            <section className="mt-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4A72C]">
                    Ready for feedback
                  </p>

                  <h2 className="mt-1 text-2xl font-extrabold text-[#172554]">
                    Stays you can review
                  </h2>
                </div>

                <span className="text-sm text-[#64748B]">
                  {reviewableBookings.length}
                </span>
              </div>

              {reviewableBookings.length === 0 ? (
                <div className="mt-5 rounded-3xl border border-[#E5E7EB] bg-white p-8 text-center">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-[#D4A72C]" />

                  <h3 className="mt-4 text-lg font-extrabold text-[#172554]">
                    You're all caught up
                  </h3>

                  <p className="mt-2 text-sm text-[#64748B]">
                    Completed stays that haven't been reviewed
                    will appear here.
                  </p>
                </div>
              ) : (
                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  {reviewableBookings.map((booking) => (
                    <article
                      key={booking.id}
                      className="rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-[#D4A72C]">
                            Completed stay
                          </p>

                          <h3 className="mt-2 text-xl font-extrabold text-[#172554]">
                            {booking.propertyTitle}
                          </h3>
                        </div>

                        <div className="rounded-xl bg-[#FFF8E1] p-3">
                          <CalendarDays className="h-5 w-5 text-[#D4A72C]" />
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-4 text-sm text-[#64748B]">
                        <span>
                          {formatDate(booking.checkIn)}
                        </span>

                        <span>→</span>

                        <span>
                          {formatDate(booking.checkOut)}
                        </span>
                      </div>

                      <div className="mt-6 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenReview(booking)
                          }
                          className="rounded-xl bg-[#172554] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1E3A8A]"
                        >
                          Leave review
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/user/property/${booking.propertyId}`
                            )
                          }
                          className="rounded-xl border border-[#E5E7EB] bg-white px-5 py-2.5 text-sm font-bold text-[#172554] transition hover:border-[#D4A72C]"
                        >
                          View property
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* EXISTING REVIEWS */}
            <section className="mt-12">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4A72C]">
                    Your feedback
                  </p>

                  <h2 className="mt-1 text-2xl font-extrabold text-[#172554]">
                    Reviews you've written
                  </h2>
                </div>

                <span className="text-sm text-[#64748B]">
                  {reviews.length}
                </span>
              </div>

              {reviews.length === 0 ? (
                <div className="mt-5 rounded-3xl border border-[#E5E7EB] bg-white px-6 py-14 text-center">
                  <MessageSquareText className="mx-auto h-8 w-8 text-[#D4A72C]" />

                  <h3 className="mt-4 text-xl font-extrabold text-[#172554]">
                    No reviews yet
                  </h3>

                  <p className="mt-2 text-sm text-[#64748B]">
                    Your reviews will appear here after you
                    complete a stay and share your feedback.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-5">
                  {reviews.map((review) => (
                    <article
                      key={review.id}
                      className="rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-sm"
                    >
                      <div className="flex flex-col justify-between gap-4 sm:flex-row">
                        <div>
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/user/property/${review.propertyId}`
                              )
                            }
                            className="text-left"
                          >
                            <h3 className="text-xl font-extrabold text-[#172554] transition hover:text-[#D4A72C]">
                              {review.propertyTitle}
                            </h3>
                          </button>

                          <p className="mt-2 text-xs text-[#94A3B8]">
                            Reviewed {formatDate(review.createdAt)}
                          </p>
                        </div>

                        <StarRating rating={review.rating} />
                      </div>

                      <p className="mt-5 leading-7 text-[#475569]">
                        {review.comment}
                      </p>

                      {review.hostResponse && (
                        <div className="mt-5 rounded-2xl bg-[#F8FAFC] p-5">
                          <p className="text-xs font-bold uppercase tracking-wide text-[#D4A72C]">
                            Host response
                          </p>

                          <p className="mt-2 text-sm leading-6 text-[#475569]">
                            {review.hostResponse}
                          </p>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* REVIEW MODAL */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4A72C]">
              Rate your stay
            </p>

            <h2 className="mt-2 text-2xl font-extrabold text-[#172554]">
              {selectedBooking.propertyTitle}
            </h2>

            <p className="mt-2 text-sm text-[#64748B]">
              How was your EliteBNB experience?
            </p>

            {/* STARS */}
            <div className="mt-6">
              <p className="text-sm font-bold text-[#172554]">
                Your rating
              </p>

              <div className="mt-3 flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className="transition hover:scale-110"
                    aria-label={`${value} star rating`}
                  >
                    <Star
                      className={`h-8 w-8 ${
                        value <= rating
                          ? "fill-[#D4A72C] text-[#D4A72C]"
                          : "text-[#CBD5E1]"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* COMMENT */}
            <div className="mt-6">
              <label className="text-sm font-bold text-[#172554]">
                Tell us about your stay
              </label>

              <textarea
                value={comment}
                onChange={(e) =>
                  setComment(e.target.value)
                }
                maxLength={1500}
                rows={5}
                placeholder="What did you enjoy? How was the property and host?"
                className="mt-3 w-full resize-none rounded-2xl border border-[#E5E7EB] p-4 text-sm text-[#111827] outline-none transition placeholder:text-[#94A3B8] focus:border-[#D4A72C]"
              />

              <p className="mt-2 text-right text-xs text-[#94A3B8]">
                {comment.length}/1500
              </p>
            </div>

            {submitError && (
              <p className="mt-3 text-sm font-medium text-red-600">
                {String(submitError)}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={handleCloseReview}
                className="rounded-xl border border-[#E5E7EB] px-5 py-2.5 text-sm font-bold text-[#64748B] transition hover:text-[#172554] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitReview}
                className="min-w-[130px] rounded-xl bg-[#D4A72C] px-5 py-2.5 text-sm font-extrabold text-[#172554] transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
              >
                {submitting
                  ? "Submitting..."
                  : "Submit review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={`h-4 w-4 ${
            value <= rating
              ? "fill-[#D4A72C] text-[#D4A72C]"
              : "text-[#CBD5E1]"
          }`}
        />
      ))}

      <span className="ml-2 text-sm font-bold text-[#172554]">
        {rating}/5
      </span>
    </div>
  );
}
