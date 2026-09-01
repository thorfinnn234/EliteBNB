import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bath,
  BedDouble,
  Heart,
  MapPin,
  RefreshCcw,
  Trash2,
  Users,
} from "lucide-react";

import { favoriteService } from "../../services/favoriteService";

export default function Wishlist() {
  const navigate = useNavigate();

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await favoriteService.getMine();

      setFavorites(response.data || []);
    } catch (err) {
      console.error("Failed to load wishlist:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "We couldn't load your wishlist right now."
      );
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (propertyId) => {
    try {
      setRemovingId(propertyId);

      await favoriteService.remove(propertyId);

      setFavorites((current) =>
        current.filter(
          (favorite) => favorite.propertyId !== propertyId
        )
      );
    } catch (err) {
      console.error("Failed to remove favorite:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "We couldn't remove this property."
      );
    } finally {
      setRemovingId(null);
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(price || 0);

  return (
    <main className="min-h-screen bg-[#FAF9F6]">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        {/* HEADER */}
        <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4A72C]">
              Saved stays
            </p>

            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#172554] sm:text-4xl">
              Wishlist
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-[#64748B]">
              Keep your favourite EliteBNB properties in one place
              and come back whenever you're ready to book.
            </p>
          </div>

          {!loading && (
            <button
              type="button"
              onClick={loadWishlist}
              className="flex w-fit items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-semibold text-[#172554] transition hover:border-[#D4A72C]"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>
          )}
        </section>

        {/* COUNT */}
        {!loading && !error && favorites.length > 0 && (
          <div className="mt-7 flex items-center gap-2 text-sm text-[#64748B]">
            <Heart className="h-4 w-4 fill-[#D4A72C] text-[#D4A72C]" />

            <span>
              {favorites.length} saved{" "}
              {favorites.length === 1 ? "property" : "properties"}
            </span>
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <section className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-3xl border border-[#E5E7EB] bg-white"
              >
                <div className="h-56 animate-pulse bg-[#E5E7EB]" />

                <div className="p-5">
                  <div className="h-6 w-2/3 animate-pulse rounded bg-[#E5E7EB]" />
                  <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-[#E5E7EB]" />
                  <div className="mt-6 h-10 animate-pulse rounded-xl bg-[#F1F5F9]" />
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ERROR */}
        {!loading && error && (
          <section className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
            <h2 className="text-xl font-extrabold text-red-700">
              Unable to load wishlist
            </h2>

            <p className="mt-2 text-sm text-red-600">
              {String(error)}
            </p>

            <button
              type="button"
              onClick={loadWishlist}
              className="mt-5 rounded-xl bg-[#172554] px-5 py-2.5 text-sm font-bold text-white"
            >
              Try again
            </button>
          </section>
        )}

        {/* EMPTY */}
        {!loading && !error && favorites.length === 0 && (
          <section className="mt-8 rounded-3xl border border-[#E5E7EB] bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF8E1]">
              <Heart className="h-8 w-8 text-[#D4A72C]" />
            </div>

            <h2 className="mt-5 text-2xl font-extrabold text-[#172554]">
              Your wishlist is empty
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#64748B]">
              Save properties you love and they'll appear here for
              easy access later.
            </p>

            <button
              type="button"
              onClick={() => navigate("/user/home")}
              className="mt-6 rounded-xl bg-[#D4A72C] px-6 py-3 text-sm font-extrabold text-[#172554] transition hover:opacity-90"
            >
              Explore stays
            </button>
          </section>
        )}

        {/* PROPERTY GRID */}
        {!loading && !error && favorites.length > 0 && (
          <section className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {favorites.map((favorite) => (
              <article
                key={favorite.id}
                className="group overflow-hidden rounded-3xl border border-[#E5E7EB] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                {/* IMAGE */}
                <div className="relative h-56 overflow-hidden bg-[#E5E7EB]">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/user/property/${favorite.propertyId}`
                      )
                    }
                    className="h-full w-full"
                  >
                    {favorite.coverImageUrl ? (
                      <img
                        src={favorite.coverImageUrl}
                        alt={favorite.propertyTitle}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-[#64748B]">
                        No property image
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={removingId === favorite.propertyId}
                    onClick={() =>
                      removeFavorite(favorite.propertyId)
                    }
                    className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-md transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="Remove from wishlist"
                  >
                    {removingId === favorite.propertyId ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#172554] border-t-transparent" />
                    ) : (
                      <Heart className="h-5 w-5 fill-[#D4A72C] text-[#D4A72C]" />
                    )}
                  </button>

                  <span className="absolute bottom-4 left-4 rounded-full bg-[#172554]/90 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
                    {favorite.propertyType
                      ?.replaceAll("_", " ")
                      .toLowerCase()
                      .replace(/\b\w/g, (letter) =>
                        letter.toUpperCase()
                      )}
                  </span>
                </div>

                {/* CONTENT */}
                <div className="p-5">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/user/property/${favorite.propertyId}`
                      )
                    }
                    className="block w-full text-left"
                  >
                    <h2 className="truncate text-xl font-extrabold text-[#172554]">
                      {favorite.propertyTitle}
                    </h2>
                  </button>

                  <p className="mt-2 flex items-center gap-1.5 text-sm text-[#64748B]">
                    <MapPin className="h-4 w-4 shrink-0 text-[#D4A72C]" />
                    <span className="truncate">
                      {favorite.location}
                    </span>
                  </p>

                  {/* DETAILS */}
                  <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-y border-[#F1F5F9] py-4 text-xs font-semibold text-[#64748B]">
                    <span className="flex items-center gap-1.5">
                      <BedDouble className="h-4 w-4 text-[#D4A72C]" />
                      {favorite.bedrooms}{" "}
                      {favorite.bedrooms === 1 ? "bed" : "beds"}
                    </span>

                    <span className="flex items-center gap-1.5">
                      <Bath className="h-4 w-4 text-[#D4A72C]" />
                      {favorite.bathrooms}{" "}
                      {favorite.bathrooms === 1 ? "bath" : "baths"}
                    </span>

                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-[#D4A72C]" />
                      {favorite.maxGuests} guests
                    </span>
                  </div>

                  {/* PRICE */}
                  <div className="mt-5 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xl font-extrabold text-[#172554]">
                        {formatPrice(favorite.pricePerNight)}
                      </p>

                      <p className="text-xs text-[#64748B]">
                        per night
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/user/property/${favorite.propertyId}`
                        )
                      }
                      className="rounded-xl bg-[#172554] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#1E3A8A]"
                    >
                      View stay
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={removingId === favorite.propertyId}
                    onClick={() =>
                      removeFavorite(favorite.propertyId)
                    }
                    className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-[#64748B] transition hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove from wishlist
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}