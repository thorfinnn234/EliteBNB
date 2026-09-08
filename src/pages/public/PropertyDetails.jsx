import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Bath,
  BedDouble,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  Car,
  ChevronRight,
  CookingPot,
  DoorOpen,
  Dumbbell,
  Heart,
  Home as HomeIcon,
  Image as ImageIcon,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Share2,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Star,
  Tv,
  Users,
  WashingMachine,
  Waves,
  Wifi,
  X,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { bookingService } from "../../services/bookingService";
import { favoriteService } from "../../services/favoriteService";
import { paymentService } from "../../services/paymentService";
import { propertyService } from "../../services/propertyService";
import { reviewService } from "../../services/reviewService";
import "./PropertyDetails.css";

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

/**
 * Keeps role checks stable across backend payloads and AuthContext state.
 * The page uses this only for frontend gating; backend role guards remain
 * authoritative for protected favorite, booking, and review operations.
 */
function normalizeRole(role) {
  return typeof role === "string" ? role.toUpperCase() : "";
}

/**
 * Converts enum-style backend values into readable labels without inventing
 * display copy. This is used for property type, status, and amenities.
 */
function formatText(value) {
  if (!value) return "";

  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * Formats real backend price values as Nigerian Naira. Missing values receive
 * a truthful fallback instead of a fabricated zero-price listing.
 */
function formatPrice(price, fallback = "Price unavailable") {
  const numericPrice = Number(price);

  if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
    return fallback;
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(numericPrice);
}

/**
 * Reads image URLs from the backend shapes currently used by PropertyResponse
 * and property-image uploads. Empty strings are filtered before rendering.
 */
function getImageSource(image) {
  return typeof image === "string"
    ? image
    : image?.imageUrl || image?.url || image?.secureUrl || "";
}

/**
 * Builds a stable gallery list from real backend images only. The public
 * production page intentionally avoids demo-image fallbacks.
 */
function getGalleryImages(property) {
  if (!Array.isArray(property?.images)) return [];

  return property.images
    .map((image, index) => ({
      id: image?.id ?? `${getImageSource(image)}-${index}`,
      src: getImageSource(image),
      alt:
        image?.altText ||
        image?.caption ||
        `${property.title || "EliteBNB property"} photo ${index + 1}`,
    }))
    .filter((image) => Boolean(image.src));
}

/**
 * Wraps gallery movement around the real image list. This keeps previous/next
 * controls predictable without duplicating backend images or inventing media.
 */
function getWrappedGalleryIndex(index, imageCount) {
  if (!imageCount) return 0;

  return ((index % imageCount) + imageCount) % imageCount;
}

/**
 * Tracks the user's reduced-motion preference so the carousel can disable
 * autoplay while still rendering a complete, usable gallery immediately.
 */
function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;

    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    mediaQuery.addEventListener("change", updatePreference);

    return () => {
      mediaQuery.removeEventListener("change", updatePreference);
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Returns a compact set of real accommodation facts. Missing values are left
 * out so the page never pretends the backend supplied details it did not.
 */
function getPropertyFacts(property) {
  return [
    {
      icon: Users,
      label: "Guests",
      value: property?.maxGuests ? `${property.maxGuests}` : "",
    },
    {
      icon: BedDouble,
      label: "Bedrooms",
      value: property?.bedrooms ? `${property.bedrooms}` : "",
    },
    {
      icon: Bath,
      label: "Bathrooms",
      value: property?.bathrooms ? `${property.bathrooms}` : "",
    },
    {
      icon: HomeIcon,
      label: "Property",
      value: formatText(property?.propertyType),
    },
  ].filter((fact) => Boolean(fact.value));
}

/**
 * Counts booking nights from ISO date inputs. The backend still validates
 * booking dates; this front-end calculation exists only for price preview.
 */
function getNightCount(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;

  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  const difference = end.getTime() - start.getTime();

  if (difference <= 0) return 0;

  return Math.ceil(difference / (1000 * 60 * 60 * 24));
}

/**
 * Creates initials for real host/reviewer names without needing profile-photo
 * fields that are not present on the current PropertyResponse contract.
 */
function getInitials(name, fallback = "EB") {
  const letters = String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return letters || fallback;
}

/**
 * Reads reviewer names from the currently supported review DTO variants.
 */
function getReviewAuthor(review) {
  const nestedName = [review?.user?.firstName, review?.user?.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    nestedName ||
    review?.user?.name ||
    review?.userName ||
    review?.reviewerName ||
    "Guest"
  );
}

/**
 * Reads review body text from compatible backend fields.
 */
function getReviewComment(review) {
  return review?.comment || review?.text || review?.reviewText || "";
}

/**
 * Reads a real host response if the review API provides one. The page does
 * not generate placeholder replies.
 */
function getReviewHostResponse(review) {
  return review?.hostResponse || review?.response || review?.hostReply || "";
}

/**
 * Formats API timestamps into compact guest-facing dates while gracefully
 * hiding invalid/missing values.
 */
function formatReviewDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/**
 * Normalizes paginated and non-paginated review API responses into an array.
 */
function getReviewList(response) {
  if (Array.isArray(response.data)) return response.data;

  return response.data?.content ?? response.data?.data ?? [];
}

/**
 * Normalizes the authenticated booking response used to resolve review
 * eligibility. A review must point to a completed booking for this property;
 * the backend remains authoritative for ownership and duplicate prevention.
 */
function getBookingList(response) {
  if (Array.isArray(response.data)) return response.data;

  return response.data?.content ?? response.data?.data ?? [];
}

/**
 * Builds a safe login return target for account-gated actions. Public visitors
 * are directed to the USER property route so they can continue the action
 * inside the authenticated guest shell after signing in.
 */
function getLoginReturnPath(propertyId) {
  return `/user/property/${propertyId}`;
}

/**
 * Renders a real-property details page for both public browsing and protected
 * USER routes. It keeps production data backend-driven while improving the
 * booking-decision hierarchy around gallery, facts, host, reviews, and payment.
 */
export default function PropertyDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const isUserRoute = location.pathname.startsWith("/user/");
  const isAuthenticated = Boolean(auth?.isAuthenticated);
  const currentRole = normalizeRole(auth?.user?.role);
  const isUser = currentRole === "USER";

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
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [messagePanelOpen, setMessagePanelOpen] = useState(false);
  const [authPrompt, setAuthPrompt] = useState(null);
  const [shareStatus, setShareStatus] = useState("");
  const [reviewDialog, setReviewDialog] = useState({
    isOpen: false,
    isLoading: false,
    isSubmitting: false,
    error: "",
    success: "",
    booking: null,
  });
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");

  /**
   * Loads the real PropertyResponse by route ID. Favorite and review requests
   * are separated so a public favorite 401 cannot block property browsing.
   */
  const loadProperty = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await propertyService.getById(id);

      setProperty(response.data);
    } catch (err) {
      console.error("Failed to load property:", err);

      setError(
        err?.response?.data?.message ||
          "We couldn't load this property right now."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let isCurrentEffect = true;

    window.queueMicrotask(() => {
      if (isCurrentEffect) {
        loadProperty();
      }
    });

    return () => {
      isCurrentEffect = false;
    };
  }, [loadProperty]);

  useEffect(() => {
    let isMounted = true;

    /**
     * Favorite status is account data, so it is only requested for authenticated
     * USER sessions. Guests and other roles can still browse the property.
     */
    async function loadFavoriteStatus() {
      if (!isAuthenticated || !isUser) {
        if (isMounted) setSaved(false);
        return;
      }

      try {
        const favoriteResponse = await favoriteService.getStatus(id);

        if (isMounted) {
          setSaved(Boolean(favoriteResponse.data?.saved));
        }
      } catch (favoriteErr) {
        console.error("Failed to load favorite status:", favoriteErr);

        if (isMounted) {
          setSaved(false);
        }
      }
    }

    loadFavoriteStatus();

    return () => {
      isMounted = false;
    };
  }, [id, isAuthenticated, isUser]);

  useEffect(() => {
    let isMounted = true;

    /**
     * Reviews are real backend content. Failure here should degrade only the
     * review section, not the rest of the property decision flow.
     */
    async function loadReviews() {
      try {
        setReviewsLoading(true);
        setReviewsError("");

        const response = await reviewService.getPropertyReviews(id);

        if (isMounted) {
          setReviews(getReviewList(response));
          setReviewsLoading(false);
        }
      } catch (reviewError) {
        console.error("Failed to load property reviews:", reviewError);

        if (isMounted) {
          setReviews([]);
          setReviewsLoading(false);
          setReviewsError("Reviews are temporarily unavailable.");
        }
      }
    }

    loadReviews();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (!favoriteSuccess && !shareStatus) return undefined;

    /**
     * Success notes are temporary live-region messages, so they clear without
     * requiring users to dismiss small operational feedback manually.
     */
    const timeoutId = window.setTimeout(() => {
      setFavoriteSuccess("");
      setShareStatus("");
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [favoriteSuccess, shareStatus]);

  const today = new Date().toISOString().split("T")[0];
  const galleryImages = useMemo(() => getGalleryImages(property), [property]);
  const propertyFacts = useMemo(() => getPropertyFacts(property), [property]);
  const numberOfNights = useMemo(
    () => getNightCount(checkIn, checkOut),
    [checkIn, checkOut]
  );
  const subtotal =
    property && numberOfNights > 0
      ? Number(property.pricePerNight || 0) * numberOfNights
      : 0;
  const averageRating = reviews.length
    ? reviews.reduce((total, review) => total + Number(review.rating || 0), 0) /
      reviews.length
    : 0;

  /**
   * Opens a focused sign-in prompt for account-owned actions. The actual login
   * route remains unchanged; state carries the intended destination for future
   * continuation without creating local fake auth.
   */
  const requestLoginForAction = (actionLabel, explanation) => {
    setAuthPrompt({
      actionLabel,
      explanation,
      returnPath: getLoginReturnPath(id),
    });
  };

  /**
   * Sends authenticated USER guests through the existing booking and Paystack
   * flow. Guests and non-USER roles are gated before protected API calls.
   */
  const handleReserve = async () => {
    if (!isAuthenticated) {
      requestLoginForAction(
        "reserve this stay",
        "Sign in as a guest to choose dates, create a reservation, and continue to secure payment."
      );
      return;
    }

    if (!isUser) {
      setBookingError("Please use a guest account to reserve this stay.");
      return;
    }

    if (!checkIn || !checkOut) {
      setBookingError("Please select your check-in and check-out dates.");
      return;
    }

    if (new Date(checkOut) <= new Date(checkIn)) {
      setBookingError("Check-out must be after check-in.");
      return;
    }

    if (Number(guests) < 1) {
      setBookingError("Please select at least one guest.");
      return;
    }

    if (
      Number.isFinite(Number(property.maxGuests)) &&
      Number(property.maxGuests) > 0 &&
      Number(guests) > Number(property.maxGuests)
    ) {
      setBookingError(
        `This property allows a maximum of ${property.maxGuests} guests.`
      );
      return;
    }

    try {
      setBookingLoading(true);
      setBookingError("");

      /*
       * The backend creates the pending booking first. Payment initialization
       * then uses that returned booking ID; changing this order would alter the
       * existing Paystack contract, so the sequence is preserved exactly.
       */
      const bookingResponse = await bookingService.create({
        propertyId: Number(property.id),
        checkIn,
        checkOut,
        guests: Number(guests),
      });

      const booking = bookingResponse.data;

      if (!booking?.id) {
        throw new Error("Booking was created but no booking ID was returned.");
      }

      const paymentResponse = await paymentService.initialize(booking.id);
      const authorizationUrl = paymentResponse.data?.authorizationUrl;

      if (!authorizationUrl) {
        throw new Error("Paystack checkout URL was not returned.");
      }

      window.location.href = authorizationUrl;
    } catch (err) {
      console.error("Reservation/payment initialization failed:", err);

      setBookingError(
        err?.response?.data?.message ||
          err?.response?.data ||
          err?.message ||
          "We couldn't start your payment. Please try again."
      );
      setBookingLoading(false);
    }
  };

  /**
   * Preserves the existing favorite endpoints while adding public auth gating
   * so unauthenticated visitors are invited to sign in instead of hitting a 401.
   */
  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      requestLoginForAction(
        "save this stay",
        "Sign in to keep this residence in your EliteBNB saved collection."
      );
      return;
    }

    if (!isUser) {
      setFavoriteError("Please use a guest account to save this stay.");
      return;
    }

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

      setFavoriteSuccess(
        saved
          ? `${property?.title || "Property"} removed from saved stays.`
          : `${property?.title || "Property"} added to saved stays.`
      );
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

  /**
   * Opens the future messaging surface only after authentication. The current
   * backend has no conversations API, so the panel is intentionally read-only.
   */
  const handleMessageHost = () => {
    if (!isAuthenticated) {
      requestLoginForAction(
        "message this host",
        "Sign in to continue once EliteBNB host conversations are enabled."
      );
      return;
    }

    setMessagePanelOpen(true);
  };

  /**
   * Resolves a completed booking for this property before opening review
   * submission. This supplies the genuine booking ID required by POST /reviews
   * without guessing from a property ID or bypassing backend eligibility rules.
   */
  const handleReviewIntent = async () => {
    if (!isAuthenticated) {
      requestLoginForAction(
        "write a review",
        "Sign in to review stays that the backend marks eligible for your account."
      );
      return;
    }

    if (!isUser) {
      setAuthPrompt({
        actionLabel: "write a review",
        explanation: "Reviews are available from guest accounts after eligible stays.",
        returnPath: getLoginReturnPath(id),
      });
      return;
    }

    setReviewRating(0);
    setReviewComment("");
    setReviewDialog({
      isOpen: true,
      isLoading: true,
      isSubmitting: false,
      error: "",
      success: "",
      booking: null,
    });

    try {
      const response = await bookingService.getMine();
      const propertyBookings = getBookingList(response).filter((booking) => {
        const bookingPropertyId = booking?.propertyId ?? booking?.property?.id;
        const status = String(booking?.status || "").toUpperCase();

        return String(bookingPropertyId) === String(id) && status === "COMPLETED";
      });
      const reviewedBookingIds = new Set(
        reviews
          .map((review) => review?.bookingId)
          .filter((bookingId) => bookingId != null)
          .map((bookingId) => String(bookingId))
      );
      const eligibleBooking = propertyBookings.find(
        (booking) => !reviewedBookingIds.has(String(booking.id))
      );

      setReviewDialog((currentDialog) => ({
        ...currentDialog,
        isLoading: false,
        booking: eligibleBooking ?? null,
        error: eligibleBooking
          ? ""
          : "Reviews are available after a completed stay that has not already been reviewed.",
      }));
    } catch (bookingError) {
      console.error("Failed to resolve review eligibility:", bookingError);
      setReviewDialog((currentDialog) => ({
        ...currentDialog,
        isLoading: false,
        error: "We couldn't verify your completed stay for this review.",
      }));
    }
  };

  /**
   * Submits the supported review payload, then reloads property reviews so the
   * new backend record appears immediately in this page's real review list.
   */
  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    if (!reviewDialog.booking) return;
    if (!reviewRating) {
      setReviewDialog((currentDialog) => ({
        ...currentDialog,
        error: "Choose a rating before submitting.",
      }));
      return;
    }
    if (reviewComment.trim().length < 20) {
      setReviewDialog((currentDialog) => ({
        ...currentDialog,
        error: "Write at least 20 characters about the stay.",
      }));
      return;
    }

    try {
      setReviewDialog((currentDialog) => ({
        ...currentDialog,
        isSubmitting: true,
        error: "",
      }));
      await reviewService.create({
        bookingId: reviewDialog.booking.id,
        propertyId: id,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      const refreshedReviews = await reviewService.getPropertyReviews(id);
      setReviews(getReviewList(refreshedReviews));
      setReviewDialog((currentDialog) => ({
        ...currentDialog,
        isSubmitting: false,
        success: "Your review was submitted successfully.",
      }));
    } catch (reviewError) {
      console.error("Failed to submit property review:", reviewError);
      setReviewDialog((currentDialog) => ({
        ...currentDialog,
        isSubmitting: false,
        error:
          reviewError?.response?.data?.message ||
          reviewError?.response?.data ||
          "We couldn't submit your review.",
      }));
    }
  };

  /**
   * Uses browser-native sharing when available, with clipboard fallback. This
   * is public page utility behavior and does not touch backend state.
   */
  const handleShare = async () => {
    const shareUrl = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: property?.title || "EliteBNB stay",
          text: property?.location || "View this EliteBNB residence.",
          url: shareUrl,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setShareStatus("Property link copied.");
      } else {
        setShareStatus("Copy this page URL from your browser to share.");
      }
    } catch (shareError) {
      if (shareError?.name !== "AbortError") {
        setShareStatus("We couldn't prepare sharing right now.");
      }
    }
  };

  if (loading) {
    return <PropertyDetailsSkeleton isUserRoute={isUserRoute} />;
  }

  if (error || !property) {
    return (
      <PropertyDetailsError
        error={error || "This property could not be found."}
        isUserRoute={isUserRoute}
        onNavigate={navigate}
      />
    );
  }

  const maxGuestOptions = Math.max(Number(property.maxGuests) || 1, 1);
  const statusLabel = formatText(property.status);
  const typeLabel = formatText(property.propertyType);

  return (
    <main
      className={`elite-property-detail ${
        isUserRoute
          ? "elite-property-detail--user"
          : "elite-property-detail--public"
      }`}
    >
      <div className="elite-property-detail__shell">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="elite-property-detail__back"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Back to stays
        </button>

        {/* =========================================================
        PROPERTY INTRO / MASTHEAD
        Presents backend property metadata before booking actions. Price,
        location, facts, and review summary are integrated into one editorial
        masthead instead of isolated dashboard-style cards.
        ========================================================= */}
        <section
          className={`elite-property-hero ${
            propertyFacts.length ? "" : "elite-property-hero--single"
          }`}
          aria-labelledby="property-title"
        >
          <div className="elite-property-hero__content">
            <div className="elite-property-hero__meta">
              {typeLabel ? <span>{typeLabel}</span> : null}
              {statusLabel ? <span>{statusLabel}</span> : null}
            </div>

            <h1 id="property-title">{property.title}</h1>

            <div className="elite-property-hero__location">
              <MapPin size={17} aria-hidden="true" />
              <span>{property.location || "Location not provided"}</span>
            </div>

            <div className="elite-property-hero__summary">
              <div className="elite-property-hero__price">
                <span>From</span>
                <strong>{formatPrice(property.pricePerNight)}</strong>
                <small>per night</small>
              </div>

              <div className="elite-property-hero__review">
                <Star size={16} fill="currentColor" aria-hidden="true" />
                {averageRating
                  ? `${averageRating.toFixed(1)} from ${reviews.length} ${
                      reviews.length === 1 ? "review" : "reviews"
                    }`
                  : "No reviews yet"}
              </div>
            </div>

            <div className="elite-property-hero__actions">
              <button type="button" onClick={handleShare}>
                <Share2 size={17} aria-hidden="true" />
                Share
              </button>

              <button
                type="button"
                onClick={toggleFavorite}
                disabled={savingFavorite}
                aria-pressed={saved}
              >
                {savingFavorite ? (
                  <span className="elite-property-spinner" aria-hidden="true" />
                ) : (
                  <Heart
                    size={17}
                    fill={saved ? "currentColor" : "none"}
                    aria-hidden="true"
                  />
                )}
                {saved ? "Saved" : "Save"}
              </button>
            </div>
          </div>

          {propertyFacts.length ? (
            <div className="elite-property-hero__aside">
              <p className="elite-property-hero__eyebrow">Residence notes</p>
              <div className="elite-property-hero__facts" aria-label="Stay facts">
                {propertyFacts.map((fact) => (
                  <PropertyFact key={fact.label} fact={fact} />
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <div
          className="elite-property-detail__alerts"
          aria-live="polite"
          aria-atomic="true"
        >
          {favoriteError ? (
            <p className="elite-property-detail__alert elite-property-detail__alert--error">
              {String(favoriteError)}
            </p>
          ) : null}

          {favoriteSuccess || shareStatus ? (
            <p className="elite-property-detail__alert elite-property-detail__alert--success">
              {favoriteSuccess || shareStatus}
            </p>
          ) : null}
        </div>

        {/* =========================================================
        IMAGE GALLERY
        Renders real backend images only. If a listing has no images, the
        fallback is a truthful empty media state, not a production mock photo.
        ========================================================= */}
        <PropertyGallery
          key={property.id ?? id}
          images={galleryImages}
          title={property.title}
        />

        <section className="elite-property-detail__decision-grid">
          <article className="elite-property-detail__main">
            {/* =========================================================
            PROPERTY STORY
            Uses the genuine backend description as the editorial anchor, then
            lets real facts and amenities support the booking decision.
            ========================================================= */}
            <section className="elite-property-section elite-property-section--intro">
              <div>
                <p className="elite-property-section__label">The stay</p>
                <h2>Inside the residence</h2>
              </div>

              <p>
                {property.description ||
                  "This host has not added a detailed description yet."}
              </p>
            </section>

            <section className="elite-property-section">
              <div className="elite-property-section__heading">
                <div>
                  <p className="elite-property-section__label">Accommodation</p>
                  <h2>What you can plan around</h2>
                </div>
              </div>

              {propertyFacts.length ? (
                <div className="elite-property-detail__fact-grid">
                  {propertyFacts.map((fact) => (
                    <PropertyFact key={fact.label} fact={fact} large />
                  ))}
                </div>
              ) : (
                <p className="elite-property-section__empty">
                  This host has not listed accommodation facts yet.
                </p>
              )}
            </section>

            <section className="elite-property-section">
              <div className="elite-property-section__heading">
                <div>
                  <p className="elite-property-section__label">Amenities</p>
                  <h2>Included with this residence</h2>
                </div>
              </div>

              {property.amenities?.length > 0 ? (
                <div className="elite-property-amenities">
                  {property.amenities.map((amenity) => {
                    const Icon = AMENITY_ICONS[amenity] || Sparkles;

                    return (
                      <div key={amenity} className="elite-property-amenity">
                        <Icon size={19} aria-hidden="true" />
                        <span>{formatText(amenity)}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="elite-property-section__empty">
                  This host has not listed amenities yet.
                </p>
              )}
            </section>

            {/* =========================================================
            HOST PRESENTATION
            Only hostName and initials are rendered because the backend does
            not currently provide host contact, rating, biography, or response
            metadata for this PropertyResponse.
            ========================================================= */}
            <HostSummary property={property} onMessageHost={handleMessageHost} />

            <ReviewsSection
              averageRating={averageRating}
              loading={reviewsLoading}
              onReviewIntent={handleReviewIntent}
              reviews={reviews}
              reviewsError={reviewsError}
            />
          </article>

          {/* =========================================================
          BOOKING PANEL
          Owns date selection, guest count, validation, booking creation, and
          Paystack handoff. The backend remains authoritative for availability,
          payment state, and final reservation validity.
          ========================================================= */}
          <BookingPanel
            bookingError={bookingError}
            bookingLoading={bookingLoading}
            checkIn={checkIn}
            checkOut={checkOut}
            guests={guests}
            maxGuestOptions={maxGuestOptions}
            numberOfNights={numberOfNights}
            onCheckInChange={(nextCheckIn) => {
              setCheckIn(nextCheckIn);

              if (checkOut && nextCheckIn >= checkOut) {
                setCheckOut("");
              }
            }}
            onCheckOutChange={setCheckOut}
            onGuestsChange={setGuests}
            onReserve={handleReserve}
            onShare={handleShare}
            onToggleFavorite={toggleFavorite}
            pricePerNight={property.pricePerNight}
            saved={saved}
            savingFavorite={savingFavorite}
            subtotal={subtotal}
            today={today}
          />
        </section>
      </div>

      {messagePanelOpen ? (
        <MessageHostDialog
          hostName={property.hostName}
          onClose={() => setMessagePanelOpen(false)}
        />
      ) : null}

      {authPrompt ? (
        <AuthGateDialog
          prompt={authPrompt}
          onClose={() => setAuthPrompt(null)}
          onLogin={() => {
            navigate("/login", {
              state: {
                from: authPrompt.returnPath,
                action: authPrompt.actionLabel,
              },
            });
          }}
        />
      ) : null}

      {reviewDialog.isOpen ? (
        <ReviewDialog
          comment={reviewComment}
          dialog={reviewDialog}
          onClose={() => setReviewDialog((currentDialog) => ({ ...currentDialog, isOpen: false }))}
          onCommentChange={setReviewComment}
          onRatingChange={setReviewRating}
          onSubmit={handleReviewSubmit}
          rating={reviewRating}
        />
      ) : null}
    </main>
  );
}

/**
 * Shows the loading state in the same spatial structure as the final page so
 * layout does not jump dramatically once the real property response arrives.
 */
function PropertyDetailsSkeleton({ isUserRoute }) {
  return (
    <main
      className={`elite-property-detail ${
        isUserRoute
          ? "elite-property-detail--user"
          : "elite-property-detail--public"
      }`}
    >
      <div className="elite-property-detail__shell">
        <div className="elite-property-skeleton elite-property-skeleton--small" />
        <div className="elite-property-skeleton elite-property-skeleton--hero" />
        <div className="elite-property-skeleton elite-property-skeleton--gallery" />
        <div className="elite-property-skeleton-grid">
          <div className="elite-property-skeleton elite-property-skeleton--content" />
          <div className="elite-property-skeleton elite-property-skeleton--booking" />
        </div>
      </div>
    </main>
  );
}

/**
 * Keeps property-load errors useful without blocking route recovery. The
 * destination respects whether the visitor came from public or USER browsing.
 */
function PropertyDetailsError({ error, isUserRoute, onNavigate }) {
  return (
    <main
      className={`elite-property-detail elite-property-detail--error ${
        isUserRoute
          ? "elite-property-detail--user"
          : "elite-property-detail--public"
      }`}
    >
      <section className="elite-property-error" role="alert">
        <DoorOpen size={32} aria-hidden="true" />
        <p>Property unavailable</p>
        <h1>{error}</h1>
        <button
          type="button"
          onClick={() => onNavigate(isUserRoute ? "/user/explore" : "/search")}
        >
          Back to discovery
        </button>
      </section>
    </main>
  );
}

/**
 * Displays one real accommodation fact with consistent icon and metadata
 * styling across the hero and body sections.
 */
function PropertyFact({ fact, large = false }) {
  const Icon = fact.icon;

  return (
    <div
      className={`elite-property-fact ${
        large ? "elite-property-fact--large" : ""
      }`}
    >
      <Icon size={large ? 20 : 17} aria-hidden="true" />
      <span>{fact.value}</span>
      <small>{fact.label}</small>
    </div>
  );
}

/**
 * Creates the responsive property gallery with one auto-rotating primary image
 * and larger thumbnail controls. Only the active image is mounted in the main
 * frame so secondary property photos never sit behind or bleed through it.
 */
function PropertyGallery({ images, title }) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [manualNavigationTick, setManualNavigationTick] = useState(0);
  const [galleryPaused, setGalleryPaused] = useState(false);
  const [documentHidden, setDocumentHidden] = useState(() => {
    if (typeof document === "undefined") return false;

    return document.hidden;
  });
  const prefersReducedMotion = usePrefersReducedMotion();
  const imageCount = images.length;
  const activeIndex = getWrappedGalleryIndex(activeImageIndex, imageCount);
  const activeImage = images[activeIndex];
  const hasCarousel = imageCount > 1;
  const shouldAutoplay =
    hasCarousel && !galleryPaused && !documentHidden && !prefersReducedMotion;

  useEffect(() => {
    if (!shouldAutoplay) return undefined;

    /**
     * The timer depends on active/manual state so a thumbnail or arrow click
     * restarts the five-second reading window instead of changing immediately.
     */
    const intervalId = window.setInterval(() => {
      setActiveImageIndex((currentIndex) =>
        getWrappedGalleryIndex(currentIndex + 1, imageCount)
      );
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeIndex, imageCount, manualNavigationTick, shouldAutoplay]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    /**
     * Autoplay pauses while the tab is hidden so users do not return to a
     * gallery that advanced silently in the background.
     */
    const handleVisibilityChange = () => {
      setDocumentHidden(document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const selectImage = (imageIndex) => {
    setActiveImageIndex(getWrappedGalleryIndex(imageIndex, imageCount));
    setManualNavigationTick((tick) => tick + 1);
  };

  const moveImage = (direction) => {
    setActiveImageIndex((currentIndex) =>
      getWrappedGalleryIndex(currentIndex + direction, imageCount)
    );
    setManualNavigationTick((tick) => tick + 1);
  };

  const handleGalleryBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setGalleryPaused(false);
    }
  };

  if (!imageCount) {
    return (
      <section className="elite-property-gallery elite-property-gallery--empty">
        <ImageIcon size={34} aria-hidden="true" />
        <p>No property images available</p>
      </section>
    );
  }

  return (
    <section
      className="elite-property-gallery"
      aria-label={`${title} gallery`}
      onBlur={handleGalleryBlur}
      onFocus={() => setGalleryPaused(true)}
      onMouseEnter={() => setGalleryPaused(true)}
      onMouseLeave={() => setGalleryPaused(false)}
    >
      <figure className="elite-property-gallery__main">
        <img
          key={activeImage.id}
          className="elite-property-gallery__image"
          src={activeImage.src}
          alt={activeImage.alt}
        />

        {hasCarousel ? (
          <>
            <button
              type="button"
              className="elite-property-gallery__control elite-property-gallery__control--previous"
              onClick={() => moveImage(-1)}
              aria-label="Previous property image"
            >
              <ArrowLeft size={18} aria-hidden="true" />
            </button>

            <button
              type="button"
              className="elite-property-gallery__control elite-property-gallery__control--next"
              onClick={() => moveImage(1)}
              aria-label="Next property image"
            >
              <ArrowRight size={18} aria-hidden="true" />
            </button>

            <span className="elite-property-gallery__counter">
              {activeIndex + 1} / {imageCount}
            </span>
          </>
        ) : null}
      </figure>

      {hasCarousel ? (
        <div
          className="elite-property-gallery__thumbnails"
          aria-label="Select property image"
        >
          {images.map((image, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={`thumb-${image.id}`}
                type="button"
                className={`elite-property-gallery__thumbnail ${
                  isActive ? "elite-property-gallery__thumbnail--active" : ""
                }`}
                onClick={() => selectImage(index)}
                aria-current={isActive ? "true" : undefined}
                aria-label={`${
                  isActive ? "Current" : "Show"
                } property image ${index + 1} of ${imageCount}`}
              >
                <img src={image.src} alt="" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

/**
 * Renders the sticky reservation surface and preserves the existing booking to
 * Paystack sequence through the parent-provided handler.
 */
function BookingPanel({
  bookingError,
  bookingLoading,
  checkIn,
  checkOut,
  guests,
  maxGuestOptions,
  numberOfNights,
  onCheckInChange,
  onCheckOutChange,
  onGuestsChange,
  onReserve,
  onShare,
  onToggleFavorite,
  pricePerNight,
  saved,
  savingFavorite,
  subtotal,
  today,
}) {
  return (
    <aside className="elite-booking-panel" aria-labelledby="booking-panel-title">
      <div className="elite-booking-panel__price">
        <div>
          <p id="booking-panel-title">Reserve this residence</p>
          <strong>{formatPrice(pricePerNight)}</strong>
          <span>/ night</span>
        </div>

        <div className="elite-booking-panel__actions">
          <button
            type="button"
            onClick={onShare}
            aria-label="Share this property"
          >
            <Share2 size={17} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onToggleFavorite}
            disabled={savingFavorite}
            aria-label={`${saved ? "Remove" : "Save"} this property`}
            aria-pressed={saved}
          >
            {savingFavorite ? (
              <span className="elite-property-spinner" aria-hidden="true" />
            ) : (
              <Heart
                size={17}
                fill={saved ? "currentColor" : "none"}
                aria-hidden="true"
              />
            )}
          </button>
        </div>
      </div>

      <div className="elite-booking-panel__form">
        <div className="elite-booking-panel__date-grid">
          <label>
            <span>Check in</span>
            <input
              type="date"
              min={today}
              value={checkIn}
              onChange={(event) => onCheckInChange(event.target.value)}
            />
          </label>

          <label>
            <span>Check out</span>
            <input
              type="date"
              min={checkIn || today}
              value={checkOut}
              onChange={(event) => onCheckOutChange(event.target.value)}
            />
          </label>
        </div>

        <label className="elite-booking-panel__guests">
          <span>
            <strong>Guests</strong>
            <small>Maximum {maxGuestOptions}</small>
          </span>

          <select
            value={guests}
            onChange={(event) => onGuestsChange(Number(event.target.value))}
          >
            {Array.from({ length: maxGuestOptions }, (_, index) => index + 1).map(
              (guestCount) => (
                <option key={guestCount} value={guestCount}>
                  {guestCount}
                </option>
              )
            )}
          </select>
        </label>
      </div>

      <div className="elite-booking-panel__availability">
        <CalendarCheck size={18} aria-hidden="true" />
        <p>
          Availability is confirmed by the backend when your reservation is
          created. Your selected dates stay editable until then.
        </p>
      </div>

      {numberOfNights > 0 ? (
        <div className="elite-booking-panel__summary">
          <div>
            <span>
              {formatPrice(pricePerNight)} x {numberOfNights}{" "}
              {numberOfNights === 1 ? "night" : "nights"}
            </span>
            <strong>{formatPrice(subtotal)}</strong>
          </div>

          <div>
            <span>Total before payment</span>
            <strong>{formatPrice(subtotal)}</strong>
          </div>
        </div>
      ) : null}

      {bookingError ? (
        <p className="elite-booking-panel__error" role="alert">
          {bookingError}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onReserve}
        disabled={bookingLoading}
        className="elite-booking-panel__reserve"
      >
        {bookingLoading ? "Creating reservation..." : "Reserve"}
        {!bookingLoading ? <ChevronRight size={17} aria-hidden="true" /> : null}
      </button>

      <p className="elite-booking-panel__secure-note">
        <ShieldCheck size={15} aria-hidden="true" />
        Secure checkout continues through Paystack.
      </p>
    </aside>
  );
}

/**
 * Presents the real host fields currently available on PropertyResponse. The
 * message action is prepared for future conversations without inventing contact
 * details or fake host activity.
 */
function HostSummary({ property, onMessageHost }) {
  const hostName = property.hostName || "Host unavailable";

  return (
    <section className="elite-property-host" aria-labelledby="host-summary-title">
      <div className="elite-property-host__identity">
        <div className="elite-property-host__avatar" aria-hidden="true">
          {getInitials(hostName, "H")}
        </div>

        <div>
          <p className="elite-property-section__label">Your host</p>
          <h2 id="host-summary-title">Hosted by {hostName}</h2>
          <p>
            This listing includes the host identity currently supplied by the
            property backend. Direct conversations are prepared for a future
            messaging service.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onMessageHost}
        className="elite-property-host__message"
      >
        <MessageCircle size={17} aria-hidden="true" />
        Message host
      </button>
    </section>
  );
}

/**
 * Renders backend reviews with truthful empty/error states and a gated review
 * intent. Eligibility remains backend-owned through the dedicated reviews flow.
 */
function ReviewsSection({
  averageRating,
  loading,
  onReviewIntent,
  reviews,
  reviewsError,
}) {
  return (
    <section className="elite-property-reviews" aria-labelledby="reviews-title">
      <div className="elite-property-section__heading">
        <div>
          <p className="elite-property-section__label">Guest experiences</p>
          <h2 id="reviews-title">Reviews</h2>
        </div>

        <div className="elite-property-reviews__score">
          <Star size={18} fill="currentColor" aria-hidden="true" />
          <span>
            {averageRating
              ? `${averageRating.toFixed(1)} (${reviews.length})`
              : "No rating"}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="elite-property-review-placeholder">
          Loading reviews...
        </div>
      ) : reviewsError ? (
        <div className="elite-property-review-placeholder">
          {reviewsError}
        </div>
      ) : reviews.length ? (
        <div className="elite-property-review-list">
          {reviews.slice(0, 5).map((review, index) => {
            const comment = getReviewComment(review);
            const hostResponse = getReviewHostResponse(review);
            const reviewDate = formatReviewDate(review.createdAt || review.date);

            return (
              <article
                key={review.id ?? `${review.createdAt ?? "review"}-${index}`}
                className="elite-property-review"
              >
                <div className="elite-property-review__header">
                  <div className="elite-property-review__avatar" aria-hidden="true">
                    {getInitials(getReviewAuthor(review), "G")}
                  </div>

                  <div>
                    <h3>{getReviewAuthor(review)}</h3>
                    {reviewDate ? <p>{reviewDate}</p> : null}
                  </div>

                  <span>
                    <Star size={14} fill="currentColor" aria-hidden="true" />
                    {Number(review.rating || 0).toFixed(1)}
                  </span>
                </div>

                {comment ? <p>{comment}</p> : null}

                {hostResponse ? (
                  <div className="elite-property-review__response">
                    <strong>Host response</strong>
                    <p>{hostResponse}</p>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="elite-property-review-placeholder">
          <h3>No reviews yet</h3>
          <p>
            This stay does not have guest reviews yet. Future reviews will
            appear here once the backend returns them.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={onReviewIntent}
        className="elite-property-reviews__write"
      >
        Write a review
        <ArrowRight size={15} aria-hidden="true" />
      </button>
    </section>
  );
}

/**
 * Explains the current messaging limitation honestly. The panel is structured
 * as a future integration point, but it never pretends to send or store chat.
 */
function MessageHostDialog({ hostName, onClose }) {
  return (
    <div className="elite-property-modal" role="presentation" onMouseDown={onClose}>
      <section
        className="elite-property-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="message-host-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="elite-property-modal__close"
          onClick={onClose}
          aria-label="Close messaging notice"
        >
          <X size={18} aria-hidden="true" />
        </button>

        <div className="elite-property-modal__icon">
          <MessageCircle size={24} aria-hidden="true" />
        </div>

        <p className="elite-property-section__label">Message host</p>
        <h2 id="message-host-title">Host conversations are being prepared.</h2>
        <p>
          Messaging with {hostName || "this host"} will be available here once
          EliteBNB conversations are enabled on the backend.
        </p>

        <button type="button" onClick={onClose}>
          Continue reviewing the stay
        </button>
      </section>
    </div>
  );
}

/**
 * Provides the in-place guest review form. The modal is intentionally disabled
 * until a completed booking is resolved, so the UI never fabricates review
 * ownership or submits a property-only review when bookingId is required.
 */
function ReviewDialog({
  comment,
  dialog,
  onClose,
  onCommentChange,
  onRatingChange,
  onSubmit,
  rating,
}) {
  return (
    <div className="elite-property-modal" role="presentation" onMouseDown={onClose}>
      <section
        className="elite-property-modal__panel elite-property-review-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="property-review-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="elite-property-modal__close"
          onClick={onClose}
          aria-label="Close review form"
        >
          <X size={18} aria-hidden="true" />
        </button>

        <div className="elite-property-modal__icon">
          <Star size={24} aria-hidden="true" />
        </div>

        <p className="elite-property-section__label">Your stay</p>
        <h2 id="property-review-title">Write a review</h2>

        {dialog.isLoading ? (
          <p role="status">Checking your completed stays...</p>
        ) : dialog.success ? (
          <>
            <p role="status">{dialog.success}</p>
            <button type="button" onClick={onClose}>
              Close
            </button>
          </>
        ) : dialog.booking ? (
          <form onSubmit={onSubmit} className="elite-property-review-dialog__form">
            <fieldset>
              <legend>Rating</legend>
              <div className="elite-property-review-dialog__rating" aria-label="Choose a rating">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={value <= rating ? "is-selected" : ""}
                    aria-label={`${value} star${value === 1 ? "" : "s"}`}
                    aria-pressed={value === rating}
                    onClick={() => onRatingChange(value)}
                  >
                    <Star size={23} fill={value <= rating ? "currentColor" : "none"} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </fieldset>

            <label>
              Comment
              <textarea
                value={comment}
                onChange={(event) => onCommentChange(event.target.value)}
                rows={5}
                placeholder="Share what made the stay memorable."
              />
            </label>

            {dialog.error ? <p className="elite-property-review-dialog__error" role="alert">{dialog.error}</p> : null}

            <button type="submit" disabled={dialog.isSubmitting}>
              {dialog.isSubmitting ? "Submitting..." : "Submit review"}
            </button>
          </form>
        ) : (
          <>
            <p role="alert">{dialog.error}</p>
            <button type="button" onClick={onClose}>
              Continue reviewing the stay
            </button>
          </>
        )}
      </section>
    </div>
  );
}

/**
 * Provides a polished account gate for public visitors without weakening the
 * public route. The backend-protected action still happens only after login.
 */
function AuthGateDialog({ prompt, onClose, onLogin }) {
  return (
    <div className="elite-property-modal" role="presentation" onMouseDown={onClose}>
      <section
        className="elite-property-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-gate-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="elite-property-modal__close"
          onClick={onClose}
          aria-label="Close sign-in prompt"
        >
          <X size={18} aria-hidden="true" />
        </button>

        <div className="elite-property-modal__icon">
          <LockKeyhole size={24} aria-hidden="true" />
        </div>

        <p className="elite-property-section__label">Guest account required</p>
        <h2 id="auth-gate-title">Sign in to {prompt.actionLabel}.</h2>
        <p>{prompt.explanation}</p>

        <div className="elite-property-modal__actions">
          <button type="button" onClick={onLogin}>
            Sign in
          </button>
          <button type="button" onClick={onClose}>
            Keep browsing
          </button>
        </div>
      </section>
    </div>
  );
}
