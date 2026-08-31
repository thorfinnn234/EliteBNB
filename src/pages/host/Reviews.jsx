import { useState } from "react";
import { Star, ThumbsUp, Calendar } from "lucide-react";

export default function Reviews() {
  const [sortBy, setSortBy] = useState("recent");
  const [filterRating, setFilterRating] = useState("all");

  const reviews = [
    {
      id: 1,
      guestName: "Sarah Johnson",
      rating: 5,
      date: "2 weeks ago",
      property: "Oceanview Villa",
      comment: "Absolutely stunning property! The views are breathtaking and the host was very responsive. Highly recommend!",
      helpful: 24,
      avatar: "SJ",
    },
    {
      id: 2,
      guestName: "Michael Chen",
      rating: 4,
      date: "1 month ago",
      property: "The Sapphire Loft",
      comment: "Great location and beautiful interiors. The only minor issue was the WiFi connection, but overall excellent.",
      helpful: 12,
      avatar: "MC",
    },
    {
      id: 3,
      guestName: "Emma Wilson",
      rating: 5,
      date: "1 month ago",
      property: "Palace Residence",
      comment: "Amazing experience! The host was incredibly welcoming and the property exceeded all expectations.",
      helpful: 18,
      avatar: "EW",
    },
    {
      id: 4,
      guestName: "David Brown",
      rating: 3,
      date: "2 months ago",
      property: "Oceanview Villa",
      comment: "Good property but some amenities mentioned in the listing were not available. Would appreciate clarity.",
      helpful: 5,
      avatar: "DB",
    },
  ];

  const stats = {
    averageRating: 4.3,
    totalReviews: 48,
    distribution: {
      5: 36,
      4: 8,
      3: 3,
      2: 1,
      1: 0,
    },
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={16}
        className={i < rating ? "fill-[#D4A72C] text-[#D4A72C]" : "text-[#E5E7EB]"}
      />
    ));
  };

  return (
    <section className="min-h-screen bg-[#FAF9F6] p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
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

        {/* Rating Summary */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          {/* Overall Rating */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-[#64748B]">Overall Rating</p>
            <div className="mt-4">
              <div className="flex items-end gap-2">
                <span className="text-5xl font-bold text-[#172554]">
                  {stats.averageRating}
                </span>
                <div className="mb-1 flex gap-1">
                  {renderStars(Math.round(stats.averageRating))}
                </div>
              </div>
              <p className="mt-2 text-sm text-[#64748B]">
                Based on {stats.totalReviews} reviews
              </p>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-[#64748B] mb-4">Rating Distribution</p>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-3">
                  <span className="w-8 text-sm font-medium text-[#172554]">
                    {rating}⭐
                  </span>
                  <div className="flex-1 h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#D4A72C]"
                      style={{
                        width: `${(stats.distribution[rating] / stats.totalReviews) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-[#64748B]">
                    {stats.distribution[rating]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
          {/* Filters */}
          <div className="border-b border-[#E5E7EB] p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-bold text-[#172554]">Guest Reviews</h2>
              </div>
              <div className="flex gap-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-lg border border-[#E5E7EB] bg-[#FAF9F6] px-3 py-2 text-sm text-[#172554] focus:border-[#D4A72C] focus:outline-none"
                >
                  <option value="recent">Most Recent</option>
                  <option value="rating-high">Highest Rated</option>
                  <option value="rating-low">Lowest Rated</option>
                </select>

                <select
                  value={filterRating}
                  onChange={(e) => setFilterRating(e.target.value)}
                  className="rounded-lg border border-[#E5E7EB] bg-[#FAF9F6] px-3 py-2 text-sm text-[#172554] focus:border-[#D4A72C] focus:outline-none"
                >
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                </select>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="divide-y divide-[#E5E7EB]">
            {reviews.map((review) => (
              <div key={review.id} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#D4A72C] to-[#b88d1d] flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {review.avatar}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-[#172554]">
                          {review.guestName}
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
                          {review.date}
                        </p>
                        <p className="mt-1 text-xs font-medium text-[#94A3B8]">
                          {review.property}
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-[#475569]">
                      {review.comment}
                    </p>

                    <button className="mt-3 flex items-center gap-1 text-sm font-medium text-[#D4A72C] hover:underline">
                      <ThumbsUp size={14} />
                      Helpful ({review.helpful})
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
