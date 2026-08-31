import {
  Plus,
  Search,
  SlidersHorizontal,
  Pencil,
  Trash2,
  Eye,
  MapPin,
  BedDouble,
  Power,
  PowerOff,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { propertyService } from "../../services/propertyService";

export default function HostListings() {
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [changingStatusId, setChangingStatusId] = useState(null);
  const loadListings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await propertyService.getMyProperties();

      setListings(response.data);
    } catch (err) {
      console.error("Failed to load listings:", err);

      setError(err.response?.data?.message || "Unable to load your listings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const title = listing.title || "";
      const location =
        listing.location || listing.city || listing.address || "";

      const status = listing.status || "ACTIVE";

      const matchesSearch =
        title.toLowerCase().includes(search.toLowerCase()) ||
        location.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" ||
        status.toUpperCase() === statusFilter.toUpperCase();

      return matchesSearch && matchesStatus;
    });
  }, [listings, search, statusFilter]);

  const handleDelete = async (listingId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this listing?",
    );

    if (!confirmed) return;

    try {
      setDeletingId(listingId);

      await propertyService.delete(listingId);

      setListings((current) =>
        current.filter((listing) => listing.id !== listingId),
      );
    } catch (err) {
      console.error("Failed to delete listing:", err);

      alert(err.response?.data?.message || "Unable to delete this listing.");
    } finally {
      setDeletingId(null);
    }
  };


  const handleStatusChange = async (listing) => {
  const currentStatus =
    listing.status?.toUpperCase() || "ACTIVE";

  const newStatus =
    currentStatus === "ACTIVE"
      ? "INACTIVE"
      : "ACTIVE";

  const action =
    newStatus === "ACTIVE"
      ? "activate"
      : "deactivate";

  const confirmed = window.confirm(
    `Are you sure you want to ${action} "${listing.title}"?`
  );

  if (!confirmed) return;

  try {
    setChangingStatusId(listing.id);

    await propertyService.update(listing.id, {
      status: newStatus,
    });

    setListings((current) =>
      current.map((item) =>
        item.id === listing.id
          ? {
              ...item,
              status: newStatus,
            }
          : item
      )
    );
  } catch (err) {
    console.error(
      "Failed to change listing status:",
      err
    );

    alert(
      err.response?.data?.message ||
        `Unable to ${action} this listing.`
    );
  } finally {
    setChangingStatusId(null);
  }
};


  const getImage = (listing) => {
    if (listing.coverImage) {
      return listing.coverImage;
    }

    if (Array.isArray(listing.images) && listing.images.length > 0) {
      const firstImage = listing.images[0];

      if (typeof firstImage === "string") {
        return firstImage;
      }

      if (firstImage?.url) {
        return firstImage.url;
      }
    }

    return "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80";
  };

  const getLocation = (listing) => {
    const parts = [
      listing.address,
      listing.city,
      listing.state,
      listing.country,
    ].filter(Boolean);

    return parts.length > 0
      ? parts.join(", ")
      : listing.location || "Location unavailable";
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const activeListings = listings.filter(
    (listing) => (listing.status || "").toUpperCase() === "ACTIVE",
  ).length;

  if (loading) {
    return (
      <section className="min-h-screen bg-[#FAF9F6] p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-10 text-center text-[#64748B]">
            Loading your listings...
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#FAF9F6] p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
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
            onClick={() => navigate("/host/listings/create")}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#D4A72C] px-5 py-3 font-semibold text-white transition hover:bg-[#b88d1d]"
          >
            <Plus size={19} />
            Add Listing
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#64748B]">Total Listings</p>

            <p className="mt-2 text-3xl font-bold text-[#172554]">
              {listings.length}
            </p>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#64748B]">
              Active Listings
            </p>

            <p className="mt-2 text-3xl font-bold text-[#172554]">
              {activeListings}
            </p>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-1">
            <p className="text-sm font-medium text-[#64748B]">
              Property Portfolio
            </p>

            <p className="mt-2 text-3xl font-bold text-[#172554]">
              {listings.length}
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row">
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

            <div className="flex items-center gap-2">
              <SlidersHorizontal size={18} className="text-[#64748B]" />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#172554] outline-none focus:border-[#D4A72C]"
              >
                <option value="All">All Listings</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {filteredListings.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredListings.map((listing) => (
              <div
                key={listing.id}
                className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={getImage(listing)}
                    alt={listing.title}
                    className="h-full w-full object-cover"
                  />

                  <span
                    className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${
                      (listing.status || "").toUpperCase() === "ACTIVE"
                        ? "bg-green-50 text-green-700"
                        : (listing.status || "").toUpperCase() === "INACTIVE"
                          ? "bg-slate-100 text-slate-700"
                          : "bg-yellow-50 text-yellow-700"
                    }`}
                  >
                    {listing.status || "ACTIVE"}
                  </span>
                </div>

                <div className="p-5">
                  <h2 className="text-xl font-bold text-[#172554]">
                    {listing.title}
                  </h2>

                  <div className="mt-2 flex items-start gap-1 text-sm text-[#64748B]">
                    <MapPin size={16} className="mt-0.5 shrink-0" />
                    <span>{getLocation(listing)}</span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[#64748B]">
                    <span className="flex items-center gap-1">
                      <BedDouble size={16} />
                      {listing.bedrooms || 0} bedrooms
                    </span>

                    <span>
                      {listing.propertyType || listing.type || "Property"}
                    </span>
                  </div>

                  <div className="my-5 border-t border-[#F1F5F9]" />

                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-xl font-bold text-[#172554]">
                        {formatPrice(listing.pricePerNight)}
                      </span>

                      <span className="text-sm text-[#64748B]"> / night</span>
                    </div>

                    <span className="text-sm text-[#64748B]">
                      Up to {listing.maxGuests || 0} guests
                    </span>
                  </div>

                  <div className="mt-4 flex justify-end rounded-xl bg-[#FAF9F6] p-3 text-sm">
                    <button
                      type="button"
                      onClick={() => navigate(`/property/${listing.id}`)}
                      className="flex items-center gap-1 font-semibold text-[#D4A72C] hover:underline"
                    >
                      <Eye size={15} />
                      View
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/host/listings/${listing.id}/edit`)
                      }
                      className="flex items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm font-semibold text-[#172554] transition hover:bg-[#FAF9F6]"
                    >
                      <Pencil size={16} />
                      Edit
                    </button>

                    <button
                      type="button"
                      disabled={changingStatusId === listing.id}
                      onClick={() => handleStatusChange(listing)}
                      className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        (listing.status || "").toUpperCase() === "ACTIVE"
                          ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                          : "border-green-200 text-green-700 hover:bg-green-50"
                      }`}
                    >
                      {(listing.status || "").toUpperCase() === "ACTIVE" ? (
                        <PowerOff size={16} />
                      ) : (
                        <Power size={16} />
                      )}

                      {changingStatusId === listing.id
                        ? "Updating..."
                        : (listing.status || "").toUpperCase() === "ACTIVE"
                          ? "Deactivate"
                          : "Activate"}
                    </button>

                    <button
                      type="button"
                      disabled={deletingId === listing.id}
                      onClick={() => handleDelete(listing.id)}
                      className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-red-100 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                      {deletingId === listing.id
                        ? "Deleting..."
                        : "Delete Listing"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FAF9F6]">
              <Search size={25} className="text-[#D4A72C]" />
            </div>

            <h2 className="mt-5 text-xl font-bold text-[#172554]">
              No listings found
            </h2>

            <p className="mt-2 text-sm text-[#64748B]">
              {listings.length === 0
                ? "You haven't created any listings yet."
                : "Try changing your search or filter."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
