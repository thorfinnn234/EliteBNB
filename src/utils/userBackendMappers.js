/**
 * Returns an array from common API list response shapes.
 * This lets User pages accept plain arrays, paged `content`, or wrapped `data`
 * responses without coupling the visual components to one backend envelope.
 */
export function normalizeApiList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;

  return [];
}

/**
 * Formats Nigerian Naira values for stay cards while keeping the raw numeric
 * value available for frontend-only sorting and filtering.
 */
export function formatNaira(value, fallback = "₦0") {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return fallback;
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Converts enum-like backend strings into readable labels for UI filters and
 * metadata without changing the underlying request/response contracts.
 */
export function formatEnumLabel(value, fallback = "") {
  if (!value) return fallback;

  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * Reads the strongest available property image from the currently observed
 * Host/User DTO variants.
 */
export function getPropertyImage(property) {
  if (property?.coverImage) return property.coverImage;
  if (property?.coverImageUrl) return property.coverImageUrl;
  if (property?.imageUrl) return property.imageUrl;
  if (Array.isArray(property?.imageUrls) && property.imageUrls.length) {
    return property.imageUrls[0];
  }

  const firstImage = property?.images?.[0];

  if (typeof firstImage === "string") return firstImage;

  return firstImage?.imageUrl || firstImage?.url || "";
}

/**
 * Builds the location label expected by User stay cards from flat or address
 * based property responses.
 */
export function getPropertyLocation(property, fallback = "Location pending") {
  const locationParts = [
    property?.address,
    property?.city,
    property?.state,
    property?.country,
  ]
    .filter(Boolean)
    .join(", ");

  return property?.location || locationParts || fallback;
}

/**
 * Maps a backend property DTO into the reusable EliteBNB stay-card shape.
 * Fallback values keep the accepted visual shell stable while real backend
 * data gradually replaces presentation data.
 */
export function mapPropertyToStay(property, fallback = {}, variant) {
  const propertyId = property?.id ?? property?.propertyId ?? fallback.id;
  const title =
    property?.title || property?.name || property?.propertyName || fallback.name;
  const priceNumber = Number(
    property?.pricePerNight ?? property?.price ?? fallback.priceNumber ?? 0
  );
  const ratingNumber = Number(
    property?.averageRating ?? property?.rating ?? fallback.ratingNumber ?? 0
  );
  const amenities = Array.isArray(property?.amenities)
    ? property.amenities.map((amenity) => formatEnumLabel(amenity, amenity))
    : fallback.amenities ?? [];
  const maxGuests =
    property?.maxGuests ?? property?.guestCapacity ?? fallback.maxGuests;

  return {
    ...fallback,
    id: propertyId,
    propertyId,
    name: title || "EliteBNB stay",
    location: getPropertyLocation(property, fallback.location),
    propertyType: formatEnumLabel(property?.propertyType, fallback.propertyType),
    rating: ratingNumber ? ratingNumber.toFixed(2).replace(/0$/, "") : fallback.rating,
    ratingNumber: ratingNumber || fallback.ratingNumber || 0,
    price: formatNaira(priceNumber, fallback.price),
    priceNumber: priceNumber || fallback.priceNumber || 0,
    qualifier: fallback.qualifier ?? "/ night",
    bedrooms: Number(property?.bedrooms ?? fallback.bedrooms ?? 0),
    bathrooms: Number(property?.bathrooms ?? fallback.bathrooms ?? 0),
    maxGuests,
    amenities,
    attributes:
      fallback.attributes ??
      [
        maxGuests ? `${maxGuests} guests` : null,
        property?.bedrooms ? `${property.bedrooms} bedrooms` : null,
        amenities[0],
      ].filter(Boolean),
    image: getPropertyImage(property) || fallback.image,
    imageAlt:
      property?.title || property?.name
        ? `${title} property photograph`
        : fallback.imageAlt,
    description:
      property?.description || fallback.description || fallback.descriptor,
    descriptor:
      property?.shortDescription ||
      property?.description ||
      fallback.descriptor ||
      fallback.description,
    variant: variant ?? fallback.variant ?? "standard",
  };
}

/**
 * Maps a favorite/wishlist response into the same property-card shape.
 * Backends may return a nested property or a favorite object containing flat
 * property fields, so both paths are supported.
 */
export function mapFavoriteToStay(favorite, fallback = {}, variant) {
  const property = favorite?.property ?? favorite;
  const mappedStay = mapPropertyToStay(property, fallback, variant);

  return {
    ...mappedStay,
    favoriteId: favorite?.favoriteId ?? favorite?.id,
    id: property?.id ?? favorite?.propertyId ?? mappedStay.id,
  };
}

/**
 * Calculates a readable night count from booking dates when the backend does
 * not already provide a formatted duration.
 */
function getNightCount(checkIn, checkOut) {
  if (!checkIn || !checkOut) return "";

  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  const difference = end.getTime() - start.getTime();

  if (Number.isNaN(difference) || difference <= 0) return "";

  const nights = Math.ceil(difference / (1000 * 60 * 60 * 24));

  return `${nights} night${nights === 1 ? "" : "s"}`;
}

/**
 * Formats dates for itinerary cards without assuming a specific backend
 * display format.
 */
function formatTripDateRange(checkIn, checkOut, fallback = "Dates pending") {
  if (!checkIn || !checkOut) return fallback;

  const formatter = new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return `${formatter.format(new Date(`${checkIn}T00:00:00`))} - ${formatter.format(
    new Date(`${checkOut}T00:00:00`)
  )}`;
}

/**
 * Maps booking DTOs into the visual trip-card shape used by the accepted
 * itinerary page.
 */
export function mapBookingToTrip(booking, fallback = {}) {
  const property = booking?.property ?? {};
  const propertyId =
    booking?.propertyId ?? property?.id ?? fallback.propertyId ?? fallback.id;
  const checkIn = booking?.checkIn ?? booking?.checkInDate;
  const checkOut = booking?.checkOut ?? booking?.checkOutDate;
  const status = booking?.status ?? fallback.status;

  return {
    ...fallback,
    id: booking?.id ?? fallback.id,
    propertyId,
    name:
      booking?.propertyTitle ||
      booking?.propertyName ||
      property?.title ||
      property?.name ||
      fallback.name ||
      "EliteBNB stay",
    location: getPropertyLocation(property, booking?.location ?? fallback.location),
    image: getPropertyImage(property) || fallback.image,
    imageAlt:
      property?.title || property?.name
        ? `${property.title || property.name} property photograph`
        : fallback.imageAlt,
    dates: booking?.dates || formatTripDateRange(checkIn, checkOut, fallback.dates),
    nights: booking?.nights || getNightCount(checkIn, checkOut) || fallback.nights,
    guests: `${booking?.numberOfGuests ?? booking?.guests ?? fallback.guests ?? 1} guests`,
    status: formatEnumLabel(status, fallback.status),
    statusCode: String(status || "").toUpperCase(),
    reference:
      booking?.bookingReference ||
      booking?.reference ||
      booking?.id ||
      fallback.reference,
    note:
      booking?.note ||
      fallback.note ||
      "Your itinerary will update as the booking moves forward.",
  };
}

/**
 * Places mapped trips into the existing Upcoming, Completed, and Cancelled
 * buckets according to the backend status value.
 */
export function groupTripsByStatus(bookings, fallbacks = []) {
  return normalizeApiList(bookings).reduce(
    (groups, booking, index) => {
      const mappedTrip = mapBookingToTrip(booking, fallbacks[index]);
      const status = mappedTrip.statusCode;

      if (status === "COMPLETED") {
        groups.completed.push(mappedTrip);
      } else if (status === "CANCELLED") {
        groups.cancelled.push(mappedTrip);
      } else {
        groups.upcoming.push(mappedTrip);
      }

      return groups;
    },
    { upcoming: [], completed: [], cancelled: [] }
  );
}

/**
 * Maps review DTOs into the journal-card shape used by the accepted Reviews UI.
 */
export function mapReviewToSubmitted(review, fallback = {}) {
  const property = review?.property ?? {};
  const propertyId =
    review?.propertyId ?? property?.id ?? fallback.propertyId ?? fallback.id;
  const createdAt = review?.createdAt ?? review?.reviewDate ?? review?.date;

  return {
    ...fallback,
    id: review?.id ?? fallback.id,
    propertyId,
    property:
      review?.propertyTitle ||
      review?.propertyName ||
      property?.title ||
      property?.name ||
      fallback.property,
    location: getPropertyLocation(property, review?.location ?? fallback.location),
    rating: Number(review?.rating ?? fallback.rating ?? 0),
    date: createdAt
      ? new Intl.DateTimeFormat("en-NG", {
          dateStyle: "medium",
        }).format(new Date(createdAt))
      : fallback.date,
    image: getPropertyImage(property) || fallback.image,
    imageAlt:
      property?.title || property?.name
        ? `${property.title || property.name} property photograph`
        : fallback.imageAlt,
    text: review?.comment || review?.text || fallback.text,
  };
}

/**
 * Converts a completed booking into a review prompt without deciding backend
 * eligibility. The backend should eventually supply the authoritative list.
 */
export function mapBookingToReviewPrompt(booking, fallback = {}) {
  const mappedTrip = mapBookingToTrip(booking, fallback);

  return {
    ...fallback,
    id: booking?.id ?? fallback.id,
    bookingId: booking?.id ?? fallback.bookingId,
    propertyId: mappedTrip.propertyId,
    property: mappedTrip.name,
    location: mappedTrip.location,
    completedDate: mappedTrip.dates,
    image: mappedTrip.image,
    imageAlt: mappedTrip.imageAlt,
  };
}

/**
 * Normalizes a user/profile response into the local editable profile shape.
 */
export function mapUserProfile(profile, fallback = {}) {
  const nameParts = profile?.name?.split(" ") ?? [];

  return {
    ...fallback,
    firstName: profile?.firstName ?? nameParts[0] ?? fallback.firstName ?? "",
    lastName:
      profile?.lastName ?? nameParts.slice(1).join(" ") ?? fallback.lastName ?? "",
    email: profile?.email ?? fallback.email ?? "",
    phone: profile?.phoneNumber ?? profile?.phone ?? fallback.phone ?? "",
    role: profile?.role ?? fallback.role ?? "USER",
  };
}
