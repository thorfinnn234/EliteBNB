import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Clock3,
  Plus,
  Wallet,
} from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import { propertyService } from "../../services/propertyService";
import { bookingService } from "../../services/bookingService";
import { hostDashboardService } from "../../services/hostDashboardService";

export default function HostDashboard() {
  const navigate = useNavigate();
  const auth = useAuth();

  const currentUser = auth?.user;

  const userFirstName =
    currentUser?.firstName ||
    currentUser?.first_name ||
    currentUser?.name?.split(" ")[0] ||
    currentUser?.fullName?.split(" ")[0] ||
    "Host";

  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalReservations: 0,
    pendingReservations: 0,
    confirmedReservations: 0,
    completedReservations: 0,
    cancelledReservations: 0,
    totalEarnings: 0,
  });

  const [reservations, setReservations] = useState([]);
  const [listings, setListings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          dashboardResponse,
          reservationsResponse,
          listingsResponse,
          earningsResponse,
        ] = await Promise.all([
          hostDashboardService.getDashboard(),
          bookingService.getHostReservations(),
          propertyService.getMyProperties(),
          hostDashboardService.getEarnings(),
        ]);

        const dashboardStats = dashboardResponse.data || {};
        const earningsStats = earningsResponse.data || {};

        setStats({
          ...dashboardStats,
          totalEarnings:
            earningsStats.totalEarnings ??
            dashboardStats.totalEarnings ??
            dashboardStats.totalRevenue ??
            dashboardStats.earnings ??
            0,
          completedReservations:
            dashboardStats.completedReservations ??
            earningsStats.completedReservations ??
            0,
        });
        setReservations(reservationsResponse.data || []);
        setListings(listingsResponse.data || []);
      } catch (err) {
        console.error(
          "Failed to load host dashboard:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Unable to load your dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const formatMoney = (amount) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));

  const formatDate = (date) => {
    if (!date) return "";

    return new Intl.DateTimeFormat("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(`${date}T00:00:00`));
  };

  const formatStatus = (status) => {
    if (!status) return "";

    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  const getStatusClasses = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-50 text-green-700";

      case "PENDING":
        return "bg-yellow-50 text-yellow-700";

      case "COMPLETED":
        return "bg-blue-50 text-blue-700";

      case "CANCELLED":
        return "bg-red-50 text-red-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const upcomingReservations = useMemo(() => {
    return reservations
      .filter(
        (booking) =>
          booking.status === "PENDING" ||
          booking.status === "CONFIRMED"
      )
      .sort(
        (a, b) =>
          new Date(a.checkIn) -
          new Date(b.checkIn)
      )
      .slice(0, 5);
  }, [reservations]);

  const recentListings = listings.slice(0, 3);

  const dashboardCards = [
    {
      title: "Total Earnings",
      value: formatMoney(stats.totalEarnings),
      subtitle: `${stats.completedReservations || 0} completed stays`,
      icon: Wallet,
    },
    {
      title: "Total Listings",
      value: stats.totalListings || 0,
      subtitle: `${stats.activeListings || 0} active listings`,
      icon: Building2,
    },
    {
      title: "Reservations",
      value: stats.totalReservations || 0,
      subtitle: `${stats.confirmedReservations || 0} confirmed`,
      icon: CalendarDays,
    },
    {
      title: "Pending Requests",
      value: stats.pendingReservations || 0,
      subtitle: "Awaiting your response",
      icon: Clock3,
    },
  ];

  if (loading) {
    return (
      <section className="min-h-screen bg-[#FAF9F6] p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-10 text-center shadow-sm">
            <p className="font-semibold text-[#172554]">
              Loading your dashboard...
            </p>

            <p className="mt-2 text-sm text-[#64748B]">
              Fetching your listings and reservations.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#FAF9F6] p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#D4A72C]">
              HOST DASHBOARD
            </p>

            <h1 className="mt-2 text-3xl font-extrabold text-[#172554] md:text-4xl">
              Welcome back, {userFirstName} 👋
            </h1>

            <p className="mt-2 text-[#64748B]">
              Here's what's happening with your
              EliteBNB properties.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/host/listings/create")
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D4A72C] px-5 py-3 font-semibold text-white transition hover:bg-[#b88d1d]"
          >
            <Plus size={18} />
            Add Listing
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* SUMMARY CARDS */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {dashboardCards.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.title}
                className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#64748B]">
                      {stat.title}
                    </p>

                    <h2 className="mt-3 text-2xl font-bold text-[#172554]">
                      {stat.value}
                    </h2>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#D4A72C]/10 text-[#D4A72C]">
                    <Icon size={21} />
                  </div>
                </div>

                <p className="mt-3 text-sm text-[#94A3B8]">
                  {stat.subtitle}
                </p>
              </div>
            );
          })}
        </div>

        {/* RESERVATIONS */}
        <div className="mt-6 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">

          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#172554]">
                Upcoming Reservations
              </h2>

              <p className="mt-1 text-sm text-[#64748B]">
                Your pending and confirmed stays.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/host/reservations")
              }
              className="flex items-center gap-1 text-sm font-semibold text-[#D4A72C] hover:underline"
            >
              View all
              <ArrowRight size={15} />
            </button>
          </div>

          {upcomingReservations.length === 0 ? (
            <div className="rounded-xl bg-[#FAF9F6] px-5 py-10 text-center">
              <CalendarDays
                size={30}
                className="mx-auto text-[#94A3B8]"
              />

              <p className="mt-3 font-semibold text-[#172554]">
                No upcoming reservations
              </p>

              <p className="mt-1 text-sm text-[#64748B]">
                New reservations will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">

                <thead>
                  <tr className="border-b border-[#E5E7EB] text-sm text-[#64748B]">
                    <th className="px-3 py-3 font-medium">
                      Guest
                    </th>

                    <th className="px-3 py-3 font-medium">
                      Property
                    </th>

                    <th className="px-3 py-3 font-medium">
                      Stay
                    </th>

                    <th className="px-3 py-3 font-medium">
                      Guests
                    </th>

                    <th className="px-3 py-3 font-medium">
                      Amount
                    </th>

                    <th className="px-3 py-3 font-medium">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {upcomingReservations.map(
                    (booking) => (
                      <tr
                        key={booking.id}
                        className="border-b border-[#F1F5F9] last:border-0"
                      >
                        <td className="px-3 py-4 font-semibold text-[#172554]">
                          {booking.guestName ||
                            booking.guest?.firstName ||
                            "Guest"}
                        </td>

                        <td className="px-3 py-4 text-[#475569]">
                          {booking.propertyTitle ||
                            booking.property?.title ||
                            "Property"}
                        </td>

                        <td className="px-3 py-4 text-sm text-[#64748B]">
                          {formatDate(
                            booking.checkIn
                          )}{" "}
                          –{" "}
                          {formatDate(
                            booking.checkOut
                          )}
                        </td>

                        <td className="px-3 py-4 text-sm text-[#64748B]">
                          {booking.numberOfGuests ??
                            booking.guests ??
                            "-"}
                        </td>

                        <td className="px-3 py-4 font-semibold text-[#172554]">
                          {formatMoney(
                            booking.totalAmount
                          )}
                        </td>

                        <td className="px-3 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                              booking.status
                            )}`}
                          >
                            {formatStatus(
                              booking.status
                            )}
                          </span>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RESERVATION BREAKDOWN */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-[#172554]">
              Reservation Overview
            </h2>

            <p className="mt-1 text-sm text-[#64748B]">
              Current status of your reservations.
            </p>

            <div className="mt-6 space-y-4">
              {[
                [
                  "Pending",
                  stats.pendingReservations,
                  "bg-yellow-500",
                ],
                [
                  "Confirmed",
                  stats.confirmedReservations,
                  "bg-green-500",
                ],
                [
                  "Completed",
                  stats.completedReservations,
                  "bg-blue-500",
                ],
                [
                  "Cancelled",
                  stats.cancelledReservations,
                  "bg-red-500",
                ],
              ].map(([label, value, color]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-xl bg-[#FAF9F6] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${color}`}
                    />

                    <span className="text-sm font-medium text-[#64748B]">
                      {label}
                    </span>
                  </div>

                  <span className="font-bold text-[#172554]">
                    {value || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* LISTING OVERVIEW */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-[#172554]">
              Listing Overview
            </h2>

            <p className="mt-1 text-sm text-[#64748B]">
              Quick snapshot of your properties.
            </p>

            <div className="mt-8">
              <p className="text-4xl font-extrabold text-[#172554]">
                {stats.totalListings || 0}
              </p>

              <p className="mt-1 text-sm text-[#64748B]">
                Total properties
              </p>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-green-50 p-4">
                  <p className="text-2xl font-bold text-green-700">
                    {stats.activeListings || 0}
                  </p>

                  <p className="mt-1 text-sm text-green-700/70">
                    Active
                  </p>
                </div>

                <div className="rounded-xl bg-[#FAF9F6] p-4">
                  <p className="text-2xl font-bold text-[#172554]">
                    {Math.max(
                      0,
                      (stats.totalListings || 0) -
                        (stats.activeListings || 0)
                    )}
                  </p>

                  <p className="mt-1 text-sm text-[#64748B]">
                    Inactive
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LISTINGS */}
        <div className="mt-6 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">

          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#172554]">
                Your Listings
              </h2>

              <p className="mt-1 text-sm text-[#64748B]">
                Your recently added properties.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/host/listings")
              }
              className="flex items-center gap-1 text-sm font-semibold text-[#D4A72C] hover:underline"
            >
              View all
              <ArrowRight size={15} />
            </button>
          </div>

          {recentListings.length === 0 ? (
            <button
              type="button"
              onClick={() =>
                navigate("/host/listings/new")
              }
              className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#CBD5E1] py-12 text-[#64748B] transition hover:border-[#D4A72C] hover:text-[#D4A72C]"
            >
              <Plus size={30} />

              <span className="mt-2 font-semibold">
                Create your first listing
              </span>
            </button>
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              {recentListings.map((listing) => (
                <div
                  key={listing.id}
                  className="overflow-hidden rounded-xl border border-[#E5E7EB] transition hover:shadow-md"
                >
                  <div className="h-40 bg-[#E2E8F0]">
                    {listing.imageUrls?.length >
                    0 ? (
                      <img
                        src={
                          listing.imageUrls[0]
                        }
                        alt={listing.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-[#64748B]">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold text-[#172554]">
                        {listing.title}
                      </h3>

                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                          listing.status ===
                          "ACTIVE"
                            ? "bg-green-50 text-green-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {formatStatus(
                          listing.status
                        )}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-[#64748B]">
                      {listing.location}
                    </p>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="font-bold text-[#172554]">
                        {formatMoney(
                          listing.pricePerNight
                        )}
                        <span className="text-xs font-normal text-[#64748B]">
                          {" "}
                          / night
                        </span>
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/host/listings/${listing.id}/edit`
                          )
                        }
                        className="text-xs font-semibold text-[#D4A72C]"
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {recentListings.length < 3 && (
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/host/listings/new"
                    )
                  }
                  className="flex min-h-[250px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#CBD5E1] text-[#64748B] transition hover:border-[#D4A72C] hover:text-[#D4A72C]"
                >
                  <Plus size={28} />

                  <span className="mt-2 font-semibold">
                    Add new listing
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
