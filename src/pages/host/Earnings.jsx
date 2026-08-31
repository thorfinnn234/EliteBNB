import { useEffect, useState } from "react";
import {
  Wallet,
  Clock3,
  CircleCheckBig,
  CalendarDays,
  TrendingUp,
} from "lucide-react";
import api from "../../services/api";

export default function Earnings() {
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadEarnings = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/host/earnings");

        setEarnings(response.data);
      } catch (err) {
        console.error("Failed to load earnings:", err);

        setError(
          err.response?.data?.message ||
            "Unable to load your earnings."
        );
      } finally {
        setLoading(false);
      }
    };

    loadEarnings();
  }, []);

  const formatCurrency = (amount = 0) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <section className="min-h-[50vh] bg-[#FAF9F6] p-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-10 text-center text-[#64748B]">
            Loading earnings...
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="min-h-[50vh] bg-[#FAF9F6] p-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error}
          </div>
        </div>
      </section>
    );
  }

  const stats = [
    {
      title: "Total earnings",
      value: formatCurrency(earnings?.totalEarnings),
      description: "Confirmed and completed reservations",
      icon: Wallet,
    },
    {
      title: "Confirmed revenue",
      value: formatCurrency(earnings?.confirmedRevenue),
      description: "Revenue from confirmed stays",
      icon: TrendingUp,
    },
    {
      title: "Completed revenue",
      value: formatCurrency(earnings?.completedRevenue),
      description: "Revenue from completed stays",
      icon: CircleCheckBig,
    },
    {
      title: "Pending revenue",
      value: formatCurrency(earnings?.pendingRevenue),
      description: "Awaiting reservation confirmation",
      icon: Clock3,
    },
  ];

  return (
    <section className="min-h-screen bg-[#FAF9F6] p-5 md:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#D4A72C]">
            HOST
          </p>

          <h1 className="mt-2 text-3xl font-extrabold text-[#172554] md:text-4xl">
            Earnings
          </h1>

          <p className="mt-2 max-w-2xl text-[#64748B]">
            Track revenue generated from your EliteBNB
            properties and reservations.
          </p>
        </div>

        {/* Main earnings */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-[#172554] p-7 text-white shadow-sm md:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-medium text-white/70">
                Your earnings
              </p>

              <p className="mt-3 text-4xl font-extrabold md:text-5xl">
                {formatCurrency(earnings?.totalEarnings)}
              </p>

              <p className="mt-3 text-sm text-white/60">
                Confirmed + completed reservation revenue
              </p>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
              <Wallet size={27} />
            </div>
          </div>
        </div>

        {/* Revenue cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.title}
                className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FAF9F6] text-[#172554]">
                    <Icon size={21} />
                  </div>
                </div>

                <p className="mt-5 text-sm font-medium text-[#64748B]">
                  {stat.title}
                </p>

                <p className="mt-1 text-2xl font-extrabold text-[#172554]">
                  {stat.value}
                </p>

                <p className="mt-2 text-xs leading-5 text-[#94A3B8]">
                  {stat.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Reservation summary */}
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#64748B]">
                  Total reservations
                </p>

                <p className="mt-2 text-3xl font-extrabold text-[#172554]">
                  {earnings?.totalReservations ?? 0}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FAF9F6] text-[#D4A72C]">
                <CalendarDays size={23} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#64748B]">
                  Completed reservations
                </p>

                <p className="mt-2 text-3xl font-extrabold text-[#172554]">
                  {earnings?.completedReservations ?? 0}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FAF9F6] text-[#D4A72C]">
                <CircleCheckBig size={23} />
              </div>
            </div>
          </div>
        </div>

        {/* Revenue breakdown */}
        <div className="mt-6 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#172554]">
              Revenue breakdown
            </h2>

            <p className="mt-1 text-sm text-[#64748B]">
              Current reservation revenue by booking status.
            </p>
          </div>

          <div className="divide-y divide-[#E5E7EB]">
            <RevenueRow
              label="Confirmed"
              amount={earnings?.confirmedRevenue}
            />

            <RevenueRow
              label="Completed"
              amount={earnings?.completedRevenue}
            />

            <RevenueRow
              label="Pending"
              amount={earnings?.pendingRevenue}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function RevenueRow({ label, amount = 0 }) {
  const formattedAmount = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);

  return (
    <div className="flex items-center justify-between py-4">
      <span className="text-sm font-medium text-[#64748B]">
        {label}
      </span>

      <span className="font-bold text-[#172554]">
        {formattedAmount}
      </span>
    </div>
  );
}