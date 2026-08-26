import {
  Plus,
  Search,
  SlidersHorizontal,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  MapPin,
  BedDouble,
} from "lucide-react";

import { useState } from "react";

const listings = [
  {
    id: 1,
    name: "Oceanview Villa",
    location: "Clifton, Cape Town",
    type: "Villa",
    bedrooms: 4,
    price: "$320",
    status: "Active",
    views: 428,
    bookings: 8,
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 2,
    name: "The Sapphire Loft",
    location: "Dubai Marina",
    type: "Apartment",
    bedrooms: 2,
    price: "$410",
    status: "Active",
    views: 316,
    bookings: 5,
    image:
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 3,
    name: "Palace Residence",
    location: "Paris, France",
    type: "Residence",
    bedrooms: 3,
    price: "$352",
    status: "Pending",
    views: 221,
    bookings: 2,
    image:
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=800&q=80",
  },
];

export default function HostListings() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredListings = listings.filter((listing) => {
    const matchesSearch =
      listing.name.toLowerCase().includes(search.toLowerCase()) ||
      listing.location.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || listing.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <section className="min-h-screen bg-[#FAF9F6] p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#D4A72C]">
              HOST
            </p>

            <h1 className="mt-2 text-3xl font-extrabold text-[#172554] md:text-4xl">
              My Listings
            </h1>

            <p className="mt-2 text-[#64748B]">
              Manage and keep track of your properties.
            </p>
          </div>

          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-xl bg-[#D4A72C] px-5 py-3 font-semibold text-white transition hover:bg-[#b88d1d]"
          >
            <Plus size={19} />
            Add Listing
          </button>
        </div>

        {/* Summary */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#64748B]">
              Total Listings
            </p>

            <p className="mt-2 text-3xl font-bold text-[#172554]">
              {listings.length}
            </p>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#64748B]">
              Active Listings
            </p>

            <p className="mt-2 text-3xl font-bold text-[#172554]">
              {listings.filter((listing) => listing.status === "Active").length}
            </p>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-1">
            <p className="text-sm font-medium text-[#64748B]">
              Total Bookings
            </p>

            <p className="mt-2 text-3xl font-bold text-[#172554]">
              {listings.reduce(
                (total, listing) => total + listing.bookings,
                0
              )}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]"
              />

              <input
                type="text"
                placeholder="Search your listings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAF9F6] py-3 pl-11 pr-4 text-sm text-[#172554] outline-none transition focus:border-[#D4A72C] focus:ring-2 focus:ring-[#D4A72C]/20"
              />
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal
                size={18}
                className="text-[#64748B]"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#172554] outline-none focus:border-[#D4A72C]"
              >
                <option value="All">All Listings</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Listings */}
        {filteredListings.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredListings.map((listing) => (
              <div
                key={listing.id}
                className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                {/* Image */}
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={listing.image}
                    alt={listing.name}
                    className="h-full w-full object-cover transition duration-300 hover:scale-105"
                  />

                  {/* Status */}
                  <span
                    className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${
                      listing.status === "Active"
                        ? "bg-green-50 text-green-700"
                        : "bg-yellow-50 text-yellow-700"
                    }`}
                  >
                    {listing.status}
                  </span>

                  {/* More */}
                  <button
                    type="button"
                    className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-[#172554] shadow-sm backdrop-blur transition hover:bg-white"
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h2 className="text-xl font-bold text-[#172554]">
                    {listing.name}
                  </h2>

                  <div className="mt-2 flex items-center gap-1 text-sm text-[#64748B]">
                    <MapPin size={16} />
                    {listing.location}
                  </div>

                  <div className="mt-3 flex items-center gap-4 text-sm text-[#64748B]">
                    <span className="flex items-center gap-1">
                      <BedDouble size={16} />
                      {listing.bedrooms} bedrooms
                    </span>

                    <span>{listing.type}</span>
                  </div>

                  <div className="my-5 border-t border-[#F1F5F9]" />

                  {/* Price */}
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-xl font-bold text-[#172554]">
                        {listing.price}
                      </span>

                      <span className="text-sm text-[#64748B]">
                        {" "}
                        / night
                      </span>
                    </div>

                    <span className="text-sm text-[#64748B]">
                      {listing.bookings} bookings
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="mt-4 flex justify-between rounded-xl bg-[#FAF9F6] p-3 text-sm">
                    <div>
                      <p className="font-semibold text-[#172554]">
                        {listing.views}
                      </p>

                      <p className="text-xs text-[#64748B]">
                        Views
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold text-[#172554]">
                        {listing.bookings}
                      </p>

                      <p className="text-xs text-[#64748B]">
                        Bookings
                      </p>
                    </div>

                    <button
                      type="button"
                      className="flex items-center gap-1 font-semibold text-[#D4A72C] hover:underline"
                    >
                      <Eye size={15} />
                      View
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className="flex items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm font-semibold text-[#172554] transition hover:border-[#D4A72C] hover:text-[#D4A72C]"
                    >
                      <Pencil size={16} />
                      Edit
                    </button>

                    <button
                      type="button"
                      className="flex items-center justify-center gap-2 rounded-xl border border-red-100 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="rounded-2xl border border-[#E5E7EB] bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FAF9F6]">
              <Search size={25} className="text-[#D4A72C]" />
            </div>

            <h2 className="mt-5 text-xl font-bold text-[#172554]">
              No listings found
            </h2>

            <p className="mt-2 text-sm text-[#64748B]">
              Try changing your search or filter.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
