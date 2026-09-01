import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  MapPin,
  RefreshCcw,
  Users,
  WalletCards,
  XCircle,
  CheckCircle2,
} from "lucide-react";

import { bookingService } from "../../services/bookingService";
import { propertyService } from "../../services/propertyService";

const TABS = [
  { id: "ALL", label: "All trips" },
  { id: "PENDING", label: "Pending" },
  { id: "CONFIRMED", label: "Upcoming" },
  { id: "COMPLETED", label: "Completed" },
  { id: "CANCELLED", label: "Cancelled" },
];

export default function Trips() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [propertyDetails, setPropertyDetails] = useState({});
  const [activeTab, setActiveTab] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await bookingService.getMine();
      const bookingData = response.data || [];

      setBookings(bookingData);

      const uniquePropertyIds = [
        ...new Set(
          bookingData
            .map((booking) => booking.propertyId)
            .filter(Boolean)
        ),
      ];

      const propertyResponses = await Promise.allSettled(
        uniquePropertyIds.map((propertyId) =>
          propertyService.getById(propertyId)
        )
      );

      const propertyMap = {};

      propertyResponses.forEach((result, index) => {
        const propertyId = uniquePropertyIds[index];

        if (result.status === "fulfilled") {
          propertyMap[propertyId] = result.value.data;
        }
      });

      setPropertyDetails(propertyMap);
    } catch (err) {
      console.error("Failed to load trips:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "We couldn't load your trips right now."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = useMemo(() => {
    if (activeTab === "ALL") {
      return bookings;
    }

    return bookings.filter(
      (booking) => booking.status === activeTab
    );
  }, [bookings, activeTab]);

  const sortedBookings = useMemo(() => {
    return [...filteredBookings].sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [filteredBookings]);

  const getCount = (status) => {
    if (status === "ALL") return bookings.length;

    return bookings.filter(
      (booking) => booking.status === status
    ).length;
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(price || 0);

  const formatDate = (date) => {
    if (!date) return "";

    return new Intl.DateTimeFormat("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(`${date}T00:00:00`));
  };

  const getNumberOfNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;

    const start = new Date(`${checkIn}T00:00:00`);
    const end = new Date(`${checkOut}T00:00:00`);

    const difference = end.getTime() - start.getTime();

    if (difference <= 0) return 0;

    return Math.ceil(
      difference / (1000 * 60 * 60 * 24)
    );
  };

  return (
    <main className="min-h-screen bg-[#FAF9F6]">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        {/* HEADER */}
        <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4A72C]">
              Your journeys
            </p>

            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#172554] sm:text-4xl">
              My Trips
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-[#64748B]">
              Keep track of your upcoming, pending and completed
              EliteBNB reservations.
            </p>
          </div>

          {!loading && (
            <button
              type="button"
              onClick={loadTrips}
              className="flex w-fit items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-semibold text-[#172554] transition hover:border-[#D4A72C]"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>
          )}
        </section>

        {/* SUMMARY */}
        {!loading && !error && bookings.length > 0 && (
          <section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              icon={Clock3}
              value={getCount("PENDING")}
              label="Pending"
            />

            <SummaryCard
              icon={CalendarDays}
              value={getCount("CONFIRMED")}
              label="Upcoming"
            />

            <SummaryCard
              icon={CheckCircle2}
              value={getCount("COMPLETED")}
              label="Completed"
            />

            <SummaryCard
              icon={XCircle}
              value={getCount("CANCELLED")}
              label="Cancelled"
            />
          </section>
        )}

        {/* TABS */}
        <section className="mt-8 flex gap-2 overflow-x-auto pb-2">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "border-[#172554] bg-[#172554] text-white"
                    : "border-[#E5E7EB] bg-white text-[#64748B] hover:border-[#D4A72C] hover:text-[#172554]"
                }`}
              >
                {tab.label}

                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                    active
                      ? "bg-white/15 text-white"
                      : "bg-[#F1F5F9] text-[#64748B]"
                  }`}
                >
                  {getCount(tab.id)}
                </span>
              </button>
            );
          })}
        </section>

        {/* LOADING */}
        {loading && (
          <section className="mt-8 space-y-5">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-3xl border border-[#E5E7EB] bg-white"
              >
                <div className="grid md:grid-cols-[260px_1fr]">
                  <div className="h-56 animate-pulse bg-[#E5E7EB] md:h-full" />

                  <div className="p-6">
                    <div className="h-5 w-32 animate-pulse rounded bg-[#E5E7EB]" />
                    <div className="mt-4 h-7 w-2/3 animate-pulse rounded bg-[#E5E7EB]" />
                    <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-[#E5E7EB]" />
                    <div className="mt-8 h-16 animate-pulse rounded-2xl bg-[#F1F5F9]" />
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ERROR */}
        {!loading && error && (
          <section className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
            <h2 className="text-xl font-extrabold text-red-700">
              Unable to load trips
            </h2>

            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={loadTrips}
              className="mt-5 rounded-xl bg-[#172554] px-5 py-2.5 text-sm font-bold text-white"
            >
              Try again
            </button>
          </section>
        )}

        {/* NO BOOKINGS AT ALL */}
        {!loading &&
          !error &&
          bookings.length === 0 && (
            <section className="mt-8 rounded-3xl border border-[#E5E7EB] bg-white px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF8E1]">
                <CalendarDays className="h-7 w-7 text-[#D4A72C]" />
              </div>

              <h2 className="mt-5 text-2xl font-extrabold text-[#172554]">
                No trips yet
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#64748B]">
                When you reserve an EliteBNB property,
                your booking will appear here.
              </p>

              <button
                type="button"
                onClick={() => navigate("/user/home")}
                className="mt-6 rounded-xl bg-[#D4A72C] px-6 py-3 text-sm font-extrabold text-[#172554]"
              >
                Explore stays
              </button>
            </section>
          )}

        {/* EMPTY FILTER */}
        {!loading &&
          !error &&
          bookings.length > 0 &&
          sortedBookings.length === 0 && (
            <section className="mt-8 rounded-3xl border border-[#E5E7EB] bg-white px-6 py-14 text-center">
              <CalendarDays className="mx-auto h-7 w-7 text-[#D4A72C]" />

              <h2 className="mt-4 text-xl font-extrabold text-[#172554]">
                Nothing here yet
              </h2>

              <p className="mt-2 text-sm text-[#64748B]">
                You don't have any {activeTab.toLowerCase()} trips.
              </p>
            </section>
          )}

        {/* BOOKINGS */}
        {!loading &&
          !error &&
          sortedBookings.length > 0 && (
            <section className="mt-8 space-y-5">
              {sortedBookings.map((booking) => {
                const property =
                  propertyDetails[booking.propertyId];

                const propertyImage =
                  property?.images?.[0];

                const nights = getNumberOfNights(
                  booking.checkIn,
                  booking.checkOut
                );

                return (
                  <article
                    key={booking.id}
                    className="overflow-hidden rounded-3xl border border-[#E5E7EB] bg-white shadow-sm transition hover:shadow-md"
                  >
                    <div className="grid md:grid-cols-[280px_minmax(0,1fr)]">
                      {/* IMAGE */}
                      <div
                        onClick={() =>
                          navigate(
                            `/user/property/${booking.propertyId}`
                          )
                        }
                        className="group h-56 cursor-pointer overflow-hidden bg-[#E5E7EB] md:h-full md:min-h-[290px]"
                      >
                        {propertyImage ? (
                          <img
                            src={propertyImage}
                            alt={booking.propertyTitle}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-[#64748B]">
                            Property image
                          </div>
                        )}
                      </div>

                      {/* CONTENT */}
                      <div className="p-5 sm:p-6">
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                          <div>
                            <StatusBadge status={booking.status} />

                            <h2 className="mt-3 text-xl font-extrabold text-[#172554] sm:text-2xl">
                              {booking.propertyTitle}
                            </h2>

                            {property?.location && (
                              <p className="mt-2 flex items-center gap-1.5 text-sm text-[#64748B]">
                                <MapPin className="h-4 w-4 text-[#D4A72C]" />
                                {property.location}
                              </p>
                            )}
                          </div>

                          <div className="sm:text-right">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
                              Total
                            </p>

                            <p className="mt-1 text-xl font-extrabold text-[#172554]">
                              {formatPrice(
                                booking.totalAmount
                              )}
                            </p>
                          </div>
                        </div>

                        {/* TRIP DETAILS */}
                        <div className="mt-6 grid gap-3 rounded-2xl bg-[#F8FAFC] p-4 sm:grid-cols-3">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wide text-[#94A3B8]">
                              Check-in
                            </p>

                            <p className="mt-1 text-sm font-bold text-[#172554]">
                              {formatDate(
                                booking.checkIn
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wide text-[#94A3B8]">
                              Check-out
                            </p>

                            <p className="mt-1 text-sm font-bold text-[#172554]">
                              {formatDate(
                                booking.checkOut
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wide text-[#94A3B8]">
                              Stay
                            </p>

                            <p className="mt-1 text-sm font-bold text-[#172554]">
                              {nights}{" "}
                              {nights === 1
                                ? "night"
                                : "nights"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-[#64748B]">
                          <span className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-[#D4A72C]" />
                            {booking.guests}{" "}
                            {booking.guests === 1
                              ? "guest"
                              : "guests"}
                          </span>

                          <span className="flex items-center gap-2">
                            <WalletCards className="h-4 w-4 text-[#D4A72C]" />
                            Booking #{booking.id}
                          </span>
                        </div>

                        {/* ACTIONS */}
                        <div className="mt-6 flex flex-wrap gap-3 border-t border-[#E5E7EB] pt-5">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/user/property/${booking.propertyId}`
                              )
                            }
                            className="flex items-center gap-2 rounded-xl bg-[#172554] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#1E3A8A]"
                          >
                            View property
                            <ChevronRight className="h-4 w-4" />
                          </button>

                          {booking.status ===
                            "COMPLETED" && (
                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  "/user/reviews"
                                )
                              }
                              className="rounded-xl border border-[#E5E7EB] bg-white px-5 py-2.5 text-sm font-bold text-[#172554] transition hover:border-[#D4A72C]"
                            >
                              Leave a review
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          )}
      </div>
    </main>
  );
}

function SummaryCard({ icon: Icon, value, label }) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-extrabold text-[#172554]">
            {value}
          </p>

          <p className="mt-1 text-sm text-[#64748B]">
            {label}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF8E1]">
          <Icon className="h-5 w-5 text-[#D4A72C]" />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    PENDING:
      "border-amber-200 bg-amber-50 text-amber-700",
    CONFIRMED:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    COMPLETED:
      "border-blue-200 bg-blue-50 text-blue-700",
    CANCELLED:
      "border-red-200 bg-red-50 text-red-700",
  };

  const labels = {
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
        styles[status] ||
        "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      {labels[status] || status}
    </span>
  );
}