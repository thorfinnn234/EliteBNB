import { useEffect, useMemo, useState } from "react";
import {
  Search,
  MapPin,
  Users,
  BedDouble,
  Bath,
  Heart,
  CalendarDays,
} from "lucide-react";

import { propertyService } from "../../services/propertyService";
import { favoriteService } from "../../services/favoriteService";
import { useNavigate } from "react-router-dom";
const PROPERTY_TYPES = [
  "ALL",
  "APARTMENT",
  "HOUSE",
  "VILLA",
  "HOTEL",
  "CABIN",
  "STUDIO",
  "GUEST_HOUSE",
];

export default function UserHome() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedType, setSelectedType] = useState("ALL");
  const [location, setLocation] = useState("");
  const [guests, setGuests] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [savedPropertyIds, setSavedPropertyIds] = useState(new Set());
  const [savingFavoriteId, setSavingFavoriteId] = useState(null);
  const [favoriteError, setFavoriteError] = useState("");
  const [favoriteSuccess, setFavoriteSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await propertyService.getAll();

      setProperties(response.data || []);

      try {
        const favoritesResponse = await favoriteService.getMine();
        const favoriteIds = (favoritesResponse.data || []).map(
          (favorite) => favorite.propertyId
        );

        setSavedPropertyIds(new Set(favoriteIds));
      } catch (favoriteErr) {
        console.error("Failed to load favorites:", favoriteErr);
      }
    } catch (err) {
      console.error("Failed to load properties:", err);
      setError("We could not load available stays right now.");
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const matchesType =
        selectedType === "ALL" ||
        property.propertyType === selectedType;

      const matchesLocation =
        !location.trim() ||
        property.location
          ?.toLowerCase()
          .includes(location.trim().toLowerCase());

      const matchesGuests =
        !guests ||
        Number(property.maxGuests) >= Number(guests);

      return matchesType && matchesLocation && matchesGuests;
    });
  }, [properties, selectedType, location, guests]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(price || 0);
  };

  const formatPropertyType = (type) => {
    if (!type) return "";

    return type
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const toggleFavorite = async (propertyId) => {
    if (!propertyId) return;

    const isSaved = savedPropertyIds.has(propertyId);
    const property = properties.find((item) => item.id === propertyId);

    try {
      setSavingFavoriteId(propertyId);
      setFavoriteError("");
      setFavoriteSuccess("");

      if (isSaved) {
        await favoriteService.remove(propertyId);
      } else {
        await favoriteService.add(propertyId);
      }

      setSavedPropertyIds((current) => {
        const next = new Set(current);

        if (isSaved) {
          next.delete(propertyId);
        } else {
          next.add(propertyId);
        }

        return next;
      });

      if (!isSaved) {
        setFavoriteSuccess(
          `${property?.title || "Property"} added to favorites.`
        );
      }
    } catch (err) {
      console.error("Failed to update favorite:", err);

      setFavoriteError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "We couldn't update your wishlist."
      );
    } finally {
      setSavingFavoriteId(null);
    }
  };

  useEffect(() => {
    if (!favoriteSuccess) return undefined;

    const timeoutId = window.setTimeout(() => {
      setFavoriteSuccess("");
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [favoriteSuccess]);

  return (
    <main className="min-h-screen bg-[#FAF9F6]">
      {/* HERO */}
      <section className="border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#D4A72C]">
              EliteBNB
            </p>

            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#172554] sm:text-5xl">
              Find a stay worth remembering.
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-[#64748B]">
              Discover beautiful homes, apartments and unique stays for your
              next trip.
            </p>
          </div>

          {/* SEARCH BAR */}
          <div className="mt-8 grid gap-3 rounded-3xl border border-[#E5E7EB] bg-white p-3 shadow-sm lg:grid-cols-[1.4fr_1fr_1fr_0.7fr_auto]">
            <div className="flex items-center gap-3 rounded-2xl px-4 py-3">
              <MapPin className="h-5 w-5 text-[#D4A72C]" />

              <div className="w-full">
                <label className="block text-xs font-bold text-[#172554]">
                  Where
                </label>

                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Search destination"
                  className="mt-1 w-full bg-transparent text-sm text-[#111827] outline-none placeholder:text-[#94A3B8]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border-t border-[#E5E7EB] px-4 py-3 lg:border-l lg:border-t-0">
              <CalendarDays className="h-5 w-5 text-[#D4A72C]" />

              <div className="w-full">
                <label className="block text-xs font-bold text-[#172554]">
                  Check in
                </label>

                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="mt-1 w-full bg-transparent text-sm text-[#64748B] outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border-t border-[#E5E7EB] px-4 py-3 lg:border-l lg:border-t-0">
              <CalendarDays className="h-5 w-5 text-[#D4A72C]" />

              <div className="w-full">
                <label className="block text-xs font-bold text-[#172554]">
                  Check out
                </label>

                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="mt-1 w-full bg-transparent text-sm text-[#64748B] outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border-t border-[#E5E7EB] px-4 py-3 lg:border-l lg:border-t-0">
              <Users className="h-5 w-5 text-[#D4A72C]" />

              <div className="w-full">
                <label className="block text-xs font-bold text-[#172554]">
                  Guests
                </label>

                <input
                  type="number"
                  min="1"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  placeholder="Add guests"
                  className="mt-1 w-full bg-transparent text-sm text-[#111827] outline-none placeholder:text-[#94A3B8]"
                />
              </div>
            </div>

            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#172554] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#1E3A8A]"
            >
              <Search className="h-4 w-4" />
              Search
            </button>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* PROPERTY TYPES */}
        <div className="flex gap-3 overflow-x-auto pb-3">
          {PROPERTY_TYPES.map((type) => {
            const active = selectedType === type;

            return (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`whitespace-nowrap rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "border-[#172554] bg-[#172554] text-white"
                    : "border-[#E5E7EB] bg-white text-[#64748B] hover:border-[#D4A72C] hover:text-[#172554]"
                }`}
              >
                {type === "ALL" ? "All stays" : formatPropertyType(type)}
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#D4A72C]">
              Discover
            </p>

            <h2 className="mt-1 text-2xl font-extrabold text-[#172554]">
              Stays you may love
            </h2>
          </div>

          {!loading && !error && (
            <p className="text-sm text-[#64748B]">
              {filteredProperties.length}{" "}
              {filteredProperties.length === 1 ? "property" : "properties"}
            </p>
          )}
        </div>

        {favoriteError && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {String(favoriteError)}
          </div>
        )}

        {favoriteSuccess && (
          <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {favoriteSuccess}
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index}>
                <div className="aspect-[4/3] animate-pulse rounded-3xl bg-[#E5E7EB]" />
                <div className="mt-4 h-4 w-3/4 animate-pulse rounded bg-[#E5E7EB]" />
                <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-[#E5E7EB]" />
              </div>
            ))}
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 px-6 py-10 text-center">
            <h3 className="font-bold text-red-700">
              Unable to load properties
            </h3>

            <p className="mt-2 text-sm text-red-600">{error}</p>

            <button
              type="button"
              onClick={loadProperties}
              className="mt-5 rounded-xl bg-[#172554] px-5 py-2.5 text-sm font-bold text-white"
            >
              Try again
            </button>
          </div>
        )}

        {/* EMPTY */}
        {!loading && !error && filteredProperties.length === 0 && (
          <div className="mt-8 rounded-3xl border border-[#E5E7EB] bg-white px-6 py-16 text-center">
            <Search className="mx-auto h-8 w-8 text-[#D4A72C]" />

            <h3 className="mt-4 text-xl font-extrabold text-[#172554]">
              No stays found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#64748B]">
              Try another destination, property type or guest count.
            </p>
          </div>
        )}

        {/* PROPERTY GRID */}
        {!loading && !error && filteredProperties.length > 0 && (
          <div className="mt-7 grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProperties.map((property) => (
              <article
                key={property.id}
                onClick={() => navigate(`/user/property/${property.id}`)}
                className="group cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-3xl bg-[#E5E7EB]">
                  {property.images?.[0] ? (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center text-sm text-[#64748B]">
                      No image available
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={savingFavoriteId === property.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(property.id);
                    }}
                    className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:scale-105"
                    aria-label={
                      savedPropertyIds.has(property.id)
                        ? "Remove from wishlist"
                        : "Save to wishlist"
                    }
                  >
                    {savingFavoriteId === property.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#172554] border-t-transparent" />
                    ) : (
                      <Heart
                        className={`h-5 w-5 ${
                          savedPropertyIds.has(property.id)
                            ? "fill-[#D4A72C] text-[#D4A72C]"
                            : "text-[#172554]"
                        }`}
                      />
                    )}
                  </button>

                  <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-[#172554] shadow-sm backdrop-blur">
                    {formatPropertyType(property.propertyType)}
                  </div>
                </div>

                <div className="pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-extrabold text-[#172554]">
                        {property.title}
                      </h3>

                      <div className="mt-1 flex items-center gap-1.5 text-sm text-[#64748B]">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="truncate">
                          {property.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-[#64748B]">
                    <span className="flex items-center gap-1">
                      <BedDouble className="h-4 w-4" />
                      {property.bedrooms} beds
                    </span>

                    <span className="flex items-center gap-1">
                      <Bath className="h-4 w-4" />
                      {property.bathrooms} baths
                    </span>

                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {property.maxGuests} guests
                    </span>
                  </div>

                  <p className="mt-4 text-sm text-[#64748B]">
                    <span className="text-lg font-extrabold text-[#172554]">
                      {formatPrice(property.pricePerNight)}
                    </span>{" "}
                    / night
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
