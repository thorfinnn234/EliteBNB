const dashboardStats = [
  {
    title: "Total Earnings",
    value: "$8,560",
    change: "+12.5%",
    description: "vs last month",
  },
  {
    title: "Upcoming Bookings",
    value: "16",
    change: "+3",
    description: "vs last month",
  },
  {
    title: "Occupancy Rate",
    value: "72%",
    change: "+6%",
    description: "vs last month",
  },
  {
    title: "Total Views",
    value: "1,248",
    change: "+18%",
    description: "vs last month",
  },
];

const bookings = [
  {
    guest: "Emma Thompson",
    property: "Oceanview Villa",
    date: "May 20 – May 25",
    guests: "2 guests",
    status: "Confirmed",
  },
  {
    guest: "Liam Johnson",
    property: "The Sapphire Loft",
    date: "May 26 – May 30",
    guests: "3 guests",
    status: "Confirmed",
  },
  {
    guest: "Noah Williams",
    property: "Palace Residence",
    date: "Jun 02 – Jun 07",
    guests: "2 guests",
    status: "Pending",
  },
  {
    guest: "Olivia Brown",
    property: "Regal Retreat",
    date: "Jun 10 – Jun 15",
    guests: "4 guests",
    status: "Confirmed",
  },
];

const listings = [
  {
    name: "Oceanview Villa",
    location: "Clifton, Cape Town",
    price: "$320 / night",
  },
  {
    name: "The Sapphire Loft",
    location: "Dubai Marina",
    price: "$410 / night",
  },
  {
    name: "Palace Residence",
    location: "Paris, France",
    price: "$352 / night",
  },
];

export default function HostDashboard() {
  return (
    <section className="min-h-screen bg-[#FAF9F6] p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#D4A72C]">
              HOST DASHBOARD
            </p>

            <h1 className="mt-2 text-3xl font-extrabold text-[#172554] md:text-4xl">
              Welcome back, Victor 👋
            </h1>

            <p className="mt-2 text-[#64748B]">
              Here's what's happening with your listings.
            </p>
          </div>

          <button className="rounded-xl bg-[#D4A72C] px-5 py-3 font-semibold text-white transition hover:bg-[#b88d1d]">
            + Add Listing
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dashboardStats.map((stat) => (
            <div
              key={stat.title}
              className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-medium text-[#64748B]">
                {stat.title}
              </p>

              <h2 className="mt-3 text-2xl font-bold text-[#172554]">
                {stat.value}
              </h2>

              <p className="mt-2 text-sm">
                <span className="font-semibold text-green-600">
                  {stat.change}
                </span>{" "}
                <span className="text-[#94A3B8]">{stat.description}</span>
              </p>
            </div>
          ))}
        </div>

        {/* Bookings */}
        <div className="mt-6 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#172554]">
                Upcoming Bookings
              </h2>
              <p className="mt-1 text-sm text-[#64748B]">
                Keep track of your latest reservations.
              </p>
            </div>

            <button className="text-sm font-semibold text-[#D4A72C] hover:underline">
              View all →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-sm text-[#64748B]">
                  <th className="px-3 py-3 font-medium">Guest</th>
                  <th className="px-3 py-3 font-medium">Property</th>
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Guests</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                </tr>
              </thead>

              <tbody>
                {bookings.map((booking) => (
                  <tr
                    key={`${booking.guest}-${booking.property}`}
                    className="border-b border-[#F1F5F9] last:border-0"
                  >
                    <td className="px-3 py-4 font-semibold text-[#172554]">
                      {booking.guest}
                    </td>

                    <td className="px-3 py-4 text-[#475569]">
                      {booking.property}
                    </td>

                    <td className="px-3 py-4 text-sm text-[#64748B]">
                      {booking.date}
                    </td>

                    <td className="px-3 py-4 text-sm text-[#64748B]">
                      {booking.guests}
                    </td>

                    <td className="px-3 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          booking.status === "Confirmed"
                            ? "bg-green-50 text-green-700"
                            : "bg-yellow-50 text-yellow-700"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Analytics */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Earnings Overview */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#172554]">
                  Earnings Overview
                </h2>
                <p className="mt-1 text-sm text-[#64748B]">
                  Your earnings this month.
                </p>
              </div>

              <select className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm outline-none">
                <option>This month</option>
                <option>Last month</option>
                <option>This year</option>
              </select>
            </div>

            <div className="mt-8">
              <p className="text-3xl font-bold text-[#172554]">$8,560</p>

              {/* Simple mock chart */}
              <div className="mt-6 flex h-40 items-end gap-2">
                {[35, 48, 42, 65, 58, 72, 68, 82, 75, 90].map(
                  (height, index) => (
                    <div
                      key={index}
                      className="flex-1 rounded-t-md bg-[#D4A72C]"
                      style={{ height: `${height}%` }}
                    />
                  )
                )}
              </div>

              <div className="mt-3 flex justify-between text-xs text-[#94A3B8]">
                <span>May 1</span>
                <span>May 8</span>
                <span>May 15</span>
                <span>May 22</span>
                <span>May 29</span>
              </div>
            </div>
          </div>

          {/* Listing Performance */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-[#172554]">
              Listing Performance
            </h2>

            <p className="mt-1 text-sm text-[#64748B]">
              Overview of your listings.
            </p>

            <div className="mt-8 flex items-center gap-8">
              <div className="flex h-40 w-40 items-center justify-center rounded-full border-[18px] border-[#172554]">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#172554]">1,407</p>
                  <p className="text-xs text-[#64748B]">Total views</p>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-semibold text-[#172554]">1,248</p>
                  <p className="text-[#64748B]">Views</p>
                </div>

                <div>
                  <p className="font-semibold text-[#172554]">16</p>
                  <p className="text-[#64748B]">Bookings</p>
                </div>

                <div>
                  <p className="font-semibold text-[#172554]">45</p>
                  <p className="text-[#64748B]">Inquiries</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Your Listings */}
        <div className="mt-6 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#172554]">
                Your Listings
              </h2>

              <p className="mt-1 text-sm text-[#64748B]">
                Manage your properties.
              </p>
            </div>

            <button className="text-sm font-semibold text-[#D4A72C] hover:underline">
              View all →
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {listings.map((listing) => (
              <div
                key={listing.name}
                className="rounded-xl border border-[#E5E7EB] p-4 transition hover:shadow-md"
              >
                <div className="flex h-32 items-center justify-center rounded-lg bg-[#E2E8F0] text-sm text-[#64748B]">
                  Property Image
                </div>

                <h3 className="mt-4 font-bold text-[#172554]">
                  {listing.name}
                </h3>

                <p className="mt-1 text-sm text-[#64748B]">
                  {listing.location}
                </p>

                <div className="mt-3 flex items-center justify-between">
                  <span className="font-semibold text-[#172554]">
                    {listing.price}
                  </span>

                  <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                    Active
                  </span>
                </div>
              </div>
            ))}

            {/* Add listing card */}
            <button className="flex min-h-[230px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#CBD5E1] text-[#64748B] transition hover:border-[#D4A72C] hover:text-[#D4A72C]">
              <span className="text-3xl">+</span>
              <span className="mt-2 font-semibold">Add new listing</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
