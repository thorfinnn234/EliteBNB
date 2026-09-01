import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { bookingService } from "../../services/bookingService";
import { paymentService } from "../../services/paymentService";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  CalendarDays,
  ChevronRight,
  Heart,
  Home,
  MapPin,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Wifi,
  Car,
  Waves,
  Dumbbell,
  Snowflake,
  CookingPot,
  Tv,
  WashingMachine,
  BriefcaseBusiness,
  Building2,
} from "lucide-react";

import { propertyService } from "../../services/propertyService";
import { favoriteService } from "../../services/favoriteService";

const AMENITY_ICONS = {
  WIFI: Wifi,
  POOL: Waves,
  PARKING: Car,
  AIR_CONDITIONING: Snowflake,
  KITCHEN: CookingPot,
  GYM: Dumbbell,
  SECURITY: ShieldCheck,
  BALCONY: Building2,
  TV: Tv,
  WASHING_MACHINE: WashingMachine,
  WORKSPACE: BriefcaseBusiness,
  ELEVATOR: Building2,
};

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [saved, setSaved] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [favoriteError, setFavoriteError] = useState("");
  const [favoriteSuccess, setFavoriteSuccess] = useState("");

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  useEffect(() => {
    loadProperty();
  }, [id]);

  const loadProperty = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await propertyService.getById(id);

      setProperty(response.data);

      try {
        const favoriteResponse = await favoriteService.getStatus(id);
        setSaved(Boolean(favoriteResponse.data?.saved));
      } catch (favoriteErr) {
        console.error("Failed to load favorite status:", favoriteErr);
      }
    } catch (err) {
      console.error("Failed to load property:", err);

      setError(
        err?.response?.data?.message ||
          "We couldn't load this property right now.",
      );
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(price || 0);

  const formatText = (value) => {
    if (!value) return "";

    return value
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const today = new Date().toISOString().split("T")[0];

  const numberOfNights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;

    const start = new Date(`${checkIn}T00:00:00`);
    const end = new Date(`${checkOut}T00:00:00`);

    const difference = end.getTime() - start.getTime();

    if (difference <= 0) return 0;

    return Math.ceil(difference / (1000 * 60 * 60 * 24));
  }, [checkIn, checkOut]);

  const subtotal =
    property && numberOfNights > 0
      ? Number(property.pricePerNight || 0) * numberOfNights
      : 0;

  const handleReserve = async () => {
  if (!checkIn || !checkOut) {
    setBookingError(
      "Please select your check-in and check-out dates."
    );
    return;
  }

  if (new Date(checkOut) <= new Date(checkIn)) {
    setBookingError(
      "Check-out must be after check-in."
    );
    return;
  }

  if (Number(guests) < 1) {
    setBookingError(
      "Please select at least one guest."
    );
    return;
  }

  if (Number(guests) > Number(property.maxGuests)) {
    setBookingError(
      `This property allows a maximum of ${property.maxGuests} guests.`
    );
    return;
  }

  try {
    setBookingLoading(true);
    setBookingError("");

    // 1. Create pending booking
    const bookingResponse =
      await bookingService.create({
        propertyId: Number(property.id),
        checkIn,
        checkOut,
        guests: Number(guests),
      });

    const booking = bookingResponse.data;

    if (!booking?.id) {
      throw new Error(
        "Booking was created but no booking ID was returned."
      );
    }

    // 2. Initialize Paystack payment
    const paymentResponse =
      await paymentService.initialize(
        booking.id
      );

    const authorizationUrl =
      paymentResponse.data?.authorizationUrl;

    if (!authorizationUrl) {
      throw new Error(
        "Paystack checkout URL was not returned."
      );
    }

    // 3. Send customer to Paystack checkout
    window.location.href = authorizationUrl;

  } catch (err) {
    console.error(
      "Reservation/payment initialization failed:",
      err
    );

    setBookingError(
      err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "We couldn't start your payment. Please try again."
    );

    setBookingLoading(false);
  }
};
  const toggleFavorite = async () => {
    try {
      setSavingFavorite(true);
      setFavoriteError("");
      setFavoriteSuccess("");

      if (saved) {
        await favoriteService.remove(id);
      } else {
        await favoriteService.add(id);
      }

      setSaved((current) => !current);

      if (!saved) {
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
      setSavingFavorite(false);
    }
  };

  useEffect(() => {
    if (!favoriteSuccess) return undefined;

    const timeoutId = window.setTimeout(() => {
      setFavoriteSuccess("");
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [favoriteSuccess]);

if (loading) {
    return (
      <main className="min-h-screen bg-[#FAF9F6]">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          <div className="h-8 w-32 animate-pulse rounded-lg bg-[#E5E7EB]" />

          <div className="mt-8 h-10 w-2/3 animate-pulse rounded-lg bg-[#E5E7EB]" />

          <div className="mt-3 h-5 w-1/3 animate-pulse rounded-lg bg-[#E5E7EB]" />

          <div className="mt-8 grid gap-3 lg:grid-cols-2">
            <div className="aspect-[4/3] animate-pulse rounded-3xl bg-[#E5E7EB]" />

            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse rounded-3xl bg-[#E5E7EB]"
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !property) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#FAF9F6] px-5">
        <div className="max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-extrabold text-[#172554]">
            Property unavailable
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#64748B]">
            {error || "This property could not be found."}
          </p>

          <button
            type="button"
            onClick={() => navigate("/user/home")}
            className="mt-6 rounded-xl bg-[#172554] px-6 py-3 text-sm font-bold text-white"
          >
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  const images = property.images || [];

  return (
    <main className="min-h-screen bg-[#FAF9F6]">
      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:px-10">
        {/* BACK */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-[#64748B] transition hover:text-[#172554]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to stays
        </button>

        {/* TITLE */}
        <section className="mt-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#172554] px-3 py-1.5 text-xs font-bold text-white">
                {formatText(property.propertyType)}
              </span>

              <span className="flex items-center gap-1 rounded-full bg-[#FFF8E1] px-3 py-1.5 text-xs font-bold text-[#9A7210]">
                <Sparkles className="h-3.5 w-3.5" />
                Elite stay
              </span>
            </div>

            <h1 className="max-w-4xl text-3xl font-extrabold tracking-tight text-[#172554] sm:text-4xl">
              {property.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#64748B]">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-[#D4A72C]" />
                {property.location}
              </span>

              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-[#D4A72C] text-[#D4A72C]" />
                New listing
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-semibold text-[#172554] transition hover:border-[#D4A72C]"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>

            <button
              type="button"
              disabled={savingFavorite}
              onClick={toggleFavorite}
              className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-semibold text-[#172554] transition hover:border-[#D4A72C]"
            >
              {savingFavorite ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#172554] border-t-transparent" />
              ) : (
                <Heart
                  className={`h-4 w-4 ${
                    saved ? "fill-[#D4A72C] text-[#D4A72C]" : "text-[#172554]"
                  }`}
                />
              )}
              {saved ? "Saved" : "Save"}
            </button>
          </div>
        </section>

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

        {/* IMAGE GALLERY */}
        <section className="mt-7 overflow-hidden rounded-3xl">
          {images.length > 0 ? (
            <div className="grid h-[420px] gap-2 sm:h-[500px] lg:grid-cols-2">
              <div className="h-full overflow-hidden bg-[#E5E7EB]">
                <img
                  src={images[0]}
                  alt={property.title}
                  className="h-full w-full object-cover transition duration-500 hover:scale-[1.02]"
                />
              </div>

              <div className="hidden grid-cols-2 gap-2 lg:grid">
                {[1, 2, 3, 4].map((index) => (
                  <div
                    key={index}
                    className="relative overflow-hidden bg-[#E5E7EB]"
                  >
                    {images[index] ? (
                      <img
                        src={images[index]}
                        alt={`${property.title} ${index + 1}`}
                        className="h-full w-full object-cover transition duration-500 hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-[#EEF0F4]">
                        <Home className="h-8 w-8 text-[#CBD5E1]" />
                      </div>
                    )}

                    {index === 4 && images.length > 5 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#172554]">
                          +{images.length - 5} photos
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-[420px] items-center justify-center bg-[#E5E7EB]">
              <div className="text-center">
                <Home className="mx-auto h-10 w-10 text-[#94A3B8]" />
                <p className="mt-3 text-sm text-[#64748B]">
                  No property images available
                </p>
              </div>
            </div>
          )}
        </section>

        {/* DETAILS + BOOKING */}
        <section className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* LEFT */}
          <div>
            {/* HOST */}
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4A72C]">
                  Your host
                </p>

                <h2 className="mt-2 text-2xl font-extrabold text-[#172554]">
                  Hosted by {property.hostName}
                </h2>

                <p className="mt-2 text-sm text-[#64748B]">
                  A beautiful EliteBNB stay prepared for your next trip.
                </p>
              </div>

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#172554] text-lg font-extrabold text-white">
                {property.hostName?.charAt(0)?.toUpperCase() || "H"}
              </div>
            </div>

            {/* QUICK DETAILS */}
            <div className="grid grid-cols-2 gap-3 border-b border-[#E5E7EB] py-7 sm:grid-cols-4">
              <DetailBox
                icon={Users}
                value={property.maxGuests}
                label="Guests"
              />

              <DetailBox
                icon={BedDouble}
                value={property.bedrooms}
                label="Bedrooms"
              />

              <DetailBox
                icon={Bath}
                value={property.bathrooms}
                label="Bathrooms"
              />

              <DetailBox
                icon={Home}
                value={formatText(property.propertyType)}
                label="Property"
              />
            </div>

            {/* DESCRIPTION */}
            <div className="border-b border-[#E5E7EB] py-8">
              <h2 className="text-2xl font-extrabold text-[#172554]">
                About this place
              </h2>

              <p className="mt-4 whitespace-pre-line text-[15px] leading-8 text-[#475569]">
                {property.description || "No description has been provided."}
              </p>
            </div>

            {/* AMENITIES */}
            <div className="border-b border-[#E5E7EB] py-8">
              <h2 className="text-2xl font-extrabold text-[#172554]">
                What this place offers
              </h2>

              {property.amenities?.length > 0 ? (
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {property.amenities.map((amenity) => {
                    const Icon = AMENITY_ICONS[amenity] || Sparkles;

                    return (
                      <div
                        key={amenity}
                        className="flex items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-4"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF8E1] text-[#B8860B]">
                          <Icon className="h-5 w-5" />
                        </div>

                        <span className="text-sm font-semibold text-[#334155]">
                          {formatText(amenity)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-4 text-sm text-[#64748B]">
                  No amenities have been listed yet.
                </p>
              )}
            </div>

            {/* REVIEWS PLACEHOLDER */}
            <div className="py-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D4A72C]">
                    Guest experiences
                  </p>

                  <h2 className="mt-2 text-2xl font-extrabold text-[#172554]">
                    Reviews
                  </h2>
                </div>

                <Star className="h-7 w-7 fill-[#D4A72C] text-[#D4A72C]" />
              </div>

              <div className="mt-6 rounded-3xl border border-[#E5E7EB] bg-white p-6">
                <h3 className="font-bold text-[#172554]">No reviews yet</h3>

                <p className="mt-2 text-sm leading-6 text-[#64748B]">
                  Once guests complete their stays, their verified reviews will
                  appear here.
                </p>
              </div>
            </div>
          </div>

          {/* BOOKING CARD */}
          <aside className="lg:relative">
            <div className="rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-[0_20px_60px_rgba(23,37,84,0.10)] lg:sticky lg:top-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <span className="text-2xl font-extrabold text-[#172554]">
                    {formatPrice(property.pricePerNight)}
                  </span>

                  <span className="ml-1 text-sm text-[#64748B]">/ night</span>
                </div>

                <span className="flex items-center gap-1 text-sm font-semibold text-[#172554]">
                  <Star className="h-4 w-4 fill-[#D4A72C] text-[#D4A72C]" />
                  New
                </span>
              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border border-[#CBD5E1]">
                <div className="grid grid-cols-2">
                  <label className="border-r border-[#CBD5E1] p-3">
                    <span className="block text-[10px] font-extrabold uppercase tracking-wide text-[#172554]">
                      Check-in
                    </span>

                    <input
                      type="date"
                      min={today}
                      value={checkIn}
                      onChange={(event) => {
                        setCheckIn(event.target.value);

                        if (checkOut && event.target.value >= checkOut) {
                          setCheckOut("");
                        }
                      }}
                      className="mt-1 w-full bg-transparent text-xs text-[#475569] outline-none"
                    />
                  </label>

                  <label className="p-3">
                    <span className="block text-[10px] font-extrabold uppercase tracking-wide text-[#172554]">
                      Check-out
                    </span>

                    <input
                      type="date"
                      min={checkIn || today}
                      value={checkOut}
                      onChange={(event) => setCheckOut(event.target.value)}
                      className="mt-1 w-full bg-transparent text-xs text-[#475569] outline-none"
                    />
                  </label>
                </div>

                <label className="flex items-center justify-between border-t border-[#CBD5E1] p-3">
                  <div>
                    <span className="block text-[10px] font-extrabold uppercase tracking-wide text-[#172554]">
                      Guests
                    </span>

                    <span className="mt-1 block text-xs text-[#64748B]">
                      Maximum {property.maxGuests}
                    </span>
                  </div>

                  <select
                    value={guests}
                    onChange={(event) => setGuests(Number(event.target.value))}
                    className="rounded-lg bg-[#FAF9F6] px-3 py-2 text-sm font-bold text-[#172554] outline-none"
                  >
                    {Array.from(
                      { length: Number(property.maxGuests) || 1 },
                      (_, index) => index + 1,
                    ).map((guestCount) => (
                      <option key={guestCount} value={guestCount}>
                        {guestCount}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <button
  type="button"
  onClick={handleReserve}
  disabled={bookingLoading}
  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D4A72C] px-5 py-4 text-sm font-extrabold text-[#172554] transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
>
  {bookingLoading ? "Creating reservation..." : "Reserve"}

  {!bookingLoading && (
    <ChevronRight className="h-4 w-4" />
  )}
</button>

{bookingError && (
  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
    <p className="text-xs font-semibold text-red-600">
      {bookingError}
    </p>
  </div>
)}

              <p className="mt-3 text-center text-xs text-[#64748B]">
                You'll be redirected to Paystack to complete your payment securely.
              </p>

              {numberOfNights > 0 && (
                <div className="mt-6 space-y-4 border-t border-[#E5E7EB] pt-5">
                  <div className="flex justify-between gap-4 text-sm text-[#64748B]">
                    <span>
                      {formatPrice(property.pricePerNight)} × {numberOfNights}{" "}
                      {numberOfNights === 1 ? "night" : "nights"}
                    </span>

                    <span>{formatPrice(subtotal)}</span>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#E5E7EB] pt-4">
                    <span className="font-extrabold text-[#172554]">Total</span>

                    <span className="text-lg font-extrabold text-[#172554]">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#F8FAFC] p-4">
                <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A72C]" />

                <p className="text-xs leading-5 text-[#64748B]">
                  Your selected dates will be checked against the property's
                  real availability before your reservation is created.
                </p>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function DetailBox({ icon: Icon, value, label }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <Icon className="h-5 w-5 text-[#D4A72C]" />

      <p className="mt-3 truncate text-base font-extrabold text-[#172554]">
        {value}
      </p>

      <p className="mt-1 text-xs text-[#64748B]">{label}</p>
    </div>
  );
}
