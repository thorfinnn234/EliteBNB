import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  BedDouble,
  Building2,
  CalendarDays,
  Clock3,
  Eye,
  MapPin,
  Plus,
  Users,
  Wallet,
} from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import { propertyService } from "../../services/propertyService";
import { bookingService } from "../../services/bookingService";
import { hostDashboardService } from "../../services/hostDashboardService";
import { getHostListingVisibility } from "../../utils/hostListingStatus";
import "./HostDashboard.css";

const defaultStats = {
  totalListings: 0,
  activeListings: 0,
  totalReservations: 0,
  pendingReservations: 0,
  confirmedReservations: 0,
  completedReservations: 0,
  cancelledReservations: 0,
  totalEarnings: 0,
};

/**
 * Extracts a friendly first name from whichever user shape AuthContext has
 * available after login or session restoration.
 */
function getHostFirstName(currentUser) {
  return (
    currentUser?.firstName ||
    currentUser?.first_name ||
    currentUser?.name?.split(" ")[0] ||
    currentUser?.fullName?.split(" ")[0] ||
    "Host"
  );
}

/**
 * Formats backend money values for the Nigerian market without changing the
 * stored currency or inventing a new pricing contract.
 */
function formatMoney(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
}

/**
 * Formats API date strings defensively because reservations may arrive as
 * nullable fields while backend integration is still evolving.
 */
function formatDate(date) {
  if (!date) return "Date pending";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

/**
 * Converts backend enum values into readable labels while preserving the
 * original status values used by reservation/listing logic.
 */
function formatStatus(status) {
  if (!status) return "Unknown";

  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * Maps reservation/listing statuses to restrained operational badges.
 */
function getStatusClasses(status) {
  switch (status) {
    case "CONFIRMED":
      return "is-confirmed";

    case "PENDING":
      return "is-pending";

    case "COMPLETED":
      return "is-completed";

    case "CANCELLED":
      return "is-cancelled";

    case "ACTIVE":
      return "is-active";

    default:
      return "is-muted";
  }
}

/**
 * Finds the best available image from current and recently merged property
 * response shapes without requiring a service or backend contract change.
 */
function getListingImage(listing) {
  if (listing?.coverImage) return listing.coverImage;
  if (listing?.imageUrls?.length > 0) return listing.imageUrls[0];

  const firstImage = listing?.images?.[0];

  if (typeof firstImage === "string") return firstImage;

  return firstImage?.imageUrl || firstImage?.url || "";
}

/**
 * Builds a readable property location from whichever address fields the
 * backend includes in a listing response.
 */
function getListingLocation(listing) {
  const detailedLocation = [
    listing?.address,
    listing?.city,
    listing?.state,
    listing?.country,
  ]
    .filter(Boolean)
    .join(", ");

  return detailedLocation || listing?.location || "Location unavailable";
}

/**
 * Preserves existing reservation guest fallbacks so dashboard UI keeps working
 * across both flat and nested booking response shapes.
 */
function getGuestName(booking) {
  const nestedName = [
    booking?.guest?.firstName,
    booking?.guest?.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return booking?.guestName || nestedName || "Guest";
}

/**
 * Reads the reservation property title from either the flat host DTO or a
 * nested property object.
 */
function getBookingPropertyTitle(booking) {
  return booking?.propertyTitle || booking?.property?.title || "Property";
}

/**
 * Keeps the guest count display compatible with current booking DTO variants.
 */
function getGuestCount(booking) {
  return booking?.numberOfGuests ?? booking?.guests ?? "-";
}

/**
 * Renders the backend-connected Host dashboard as an operations workspace.
 * Data fetching and mutation boundaries remain unchanged; only presentation is
 * refined for clearer hospitality operations.
 */
export default function HostDashboard() {
  const navigate = useNavigate();
  const auth = useAuth();

  const userFirstName = getHostFirstName(auth?.user);

  const [stats, setStats] = useState(defaultStats);
  const [reservations, setReservations] = useState([]);
  const [listings, setListings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    /**
     * Loads the same backend-connected dashboard sources, plus the earnings
     * endpoint introduced by the integration branch. The view still receives a
     * single stats object so the accepted Host dashboard presentation remains
     * unchanged.
     */
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
          ...defaultStats,
          ...dashboardStats,
          totalEarnings:
            earningsStats.totalEarnings ??
            earningsStats.totalRevenue ??
            dashboardStats.totalEarnings ??
            dashboardStats.totalRevenue ??
            defaultStats.totalEarnings,
          completedReservations:
            dashboardStats.completedReservations ??
            earningsStats.completedReservations ??
            defaultStats.completedReservations,
        });
        setReservations(reservationsResponse.data || []);
        setListings(listingsResponse.data || []);
      } catch (err) {
        console.error("Failed to load host dashboard:", err);

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

  if (loading) {
    return <HostDashboardLoading />;
  }

  return (
    <HostDashboardView
      userFirstName={userFirstName}
      stats={stats}
      reservations={reservations}
      listings={listings}
      error={error}
      onNavigate={navigate}
    />
  );
}

/**
 * Renders the dashboard presentation from supplied data. Production passes real
 * backend responses through this view; the development preview passes isolated
 * presentation data so it can visually review the same UI without auth calls.
 */
export function HostDashboardView({
  userFirstName = "Host",
  stats = defaultStats,
  reservations = [],
  listings = [],
  error = "",
  onNavigate = () => {},
}) {
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
  const inactiveListings = Math.max(
    0,
    (stats.totalListings || 0) - (stats.activeListings || 0)
  );

  const dashboardCards = [
    {
      title: "Revenue secured",
      value: formatMoney(stats.totalEarnings),
      subtitle: `${stats.completedReservations || 0} completed stays`,
      icon: Wallet,
      tone: "dark",
    },
    {
      title: "Active portfolio",
      value: stats.activeListings || 0,
      subtitle: `${stats.totalListings || 0} total listings`,
      icon: Building2,
      tone: "light",
    },
    {
      title: "Guest flow",
      value: stats.totalReservations || 0,
      subtitle: `${stats.confirmedReservations || 0} confirmed`,
      icon: CalendarDays,
      tone: "light",
    },
    {
      title: "Needs attention",
      value: stats.pendingReservations || 0,
      subtitle: "Pending reservation requests",
      icon: Clock3,
      tone: stats.pendingReservations ? "gold" : "light",
    },
  ];

  const reservationBreakdown = [
    ["Pending", stats.pendingReservations, "is-pending"],
    ["Confirmed", stats.confirmedReservations, "is-confirmed"],
    ["Completed", stats.completedReservations, "is-completed"],
    ["Cancelled", stats.cancelledReservations, "is-cancelled"],
  ];
  const leadListing = recentListings[0];

  return (
    <section className="elite-host-dashboard">
      <div className="elite-host-dashboard__inner">
        <header className="elite-host-dashboard__hero">
          <div className="elite-host-dashboard__hero-copy">
            <p className="elite-host-dashboard__eyebrow">
              Daily host briefing
            </p>

            <h1>Good to see you, {userFirstName}.</h1>

            <p>
              Guests, residences, and decisions for the next movement of your
              EliteBNB portfolio.
            </p>

            <div className="elite-host-dashboard__hero-actions">
              <button
                type="button"
                className="elite-host-dashboard__primary-action"
                onClick={() => onNavigate("/host/listings/create")}
              >
                <Plus size={18} strokeWidth={1.9} />
                Add listing
              </button>

              <button
                type="button"
                className="elite-host-dashboard__secondary-action"
                onClick={() => onNavigate("/host/reservations")}
              >
                Review reservations
                <ArrowRight size={16} strokeWidth={1.9} />
              </button>
            </div>
          </div>

          <HostHeroProperty
            listing={leadListing}
            onManage={() =>
              leadListing
                ? onNavigate(`/host/listings/${leadListing.id}/edit`)
                : onNavigate("/host/listings/create")
            }
          />

          <aside className="elite-host-dashboard__attention">
            <span className="elite-host-dashboard__attention-label">
              What needs attention
            </span>

            <strong>{stats.pendingReservations || 0}</strong>

            <p>
              {stats.pendingReservations
                ? "Pending reservation requests are waiting for a host decision."
                : "No pending reservation requests right now."}
            </p>

            <button
              type="button"
              onClick={() => onNavigate("/host/reservations")}
            >
              Open reservation desk
              <ArrowRight size={15} strokeWidth={1.9} />
            </button>
          </aside>
        </header>

        {error && (
          <div className="elite-host-dashboard__alert" role="alert">
            {error}
          </div>
        )}

        <section className="elite-host-dashboard__panel elite-host-dashboard__portfolio">
          <PanelHeader
            eyebrow="Property portfolio"
            title="Your listings"
            description="Recently added residences and the next property to refine."
            actionLabel="Manage all"
            onAction={() => onNavigate("/host/listings")}
          />

          {recentListings.length === 0 ? (
            <button
              type="button"
              onClick={() => onNavigate("/host/listings/new")}
              className="elite-host-dashboard__empty-listing"
            >
              <Plus size={28} strokeWidth={1.8} />
              <span>Create your first listing</span>
            </button>
          ) : (
            <div className="elite-host-dashboard__listing-grid">
              {recentListings.map((listing, index) => (
                <ListingPreviewCard
                  key={listing.id}
                  listing={listing}
                  index={index}
                  onManage={() =>
                    onNavigate(`/host/listings/${listing.id}/edit`)
                  }
                />
              ))}

              {recentListings.length < 3 && (
                <button
                  type="button"
                  onClick={() => onNavigate("/host/listings/new")}
                  className="elite-host-dashboard__listing-add"
                >
                  <Plus size={28} strokeWidth={1.8} />
                  <span>Add new listing</span>
                </button>
              )}
            </div>
          )}
        </section>

        <section
          className="elite-host-dashboard__metrics"
          aria-label="Host performance metrics"
        >
          {dashboardCards.map((stat) => (
            <HostMetricCard key={stat.title} stat={stat} />
          ))}
        </section>

        <section
          className="elite-host-dashboard__quick-actions"
          aria-label="Host quick actions"
        >
          <QuickAction
            title="Create a new listing"
            description="Add a residence, amenities, pricing, and photography."
            icon={Plus}
            onClick={() => onNavigate("/host/listings/create")}
          />
          <QuickAction
            title="Manage availability"
            description="Block dates before guests request them."
            icon={CalendarDays}
            onClick={() => onNavigate("/host/calendar")}
          />
          <QuickAction
            title="Review portfolio"
            description="Update active listings and property details."
            icon={Building2}
            onClick={() => onNavigate("/host/listings")}
          />
        </section>

        <div className="elite-host-dashboard__operations-grid">
          <section className="elite-host-dashboard__panel elite-host-dashboard__panel--reservations">
            <PanelHeader
              eyebrow="Guest movement"
              title="Upcoming reservations"
              description="Pending and confirmed stays sorted by arrival."
              actionLabel="View all"
              onAction={() => onNavigate("/host/reservations")}
            />

            {upcomingReservations.length === 0 ? (
              <EmptyOperationsState
                icon={CalendarDays}
                title="No upcoming reservations"
                description="New reservation requests and confirmed stays will appear here."
              />
            ) : (
              <div className="elite-host-dashboard__reservation-list">
                {upcomingReservations.map((booking) => (
                  <ReservationCard
                    key={booking.id}
                    booking={booking}
                  />
                ))}
              </div>
            )}
          </section>

          <aside className="elite-host-dashboard__side-stack">
            <section className="elite-host-dashboard__panel elite-host-dashboard__panel--revenue">
              <p className="elite-host-dashboard__panel-kicker">
                Earnings detail
              </p>

              <strong>{stats.completedReservations || 0}</strong>

              <span>
                Completed stays are already represented in the revenue KPI.
                Open the earnings room for the full backend breakdown.
              </span>

              <button
                type="button"
                onClick={() => onNavigate("/host/earnings")}
              >
                Open earnings
                <ArrowRight size={15} strokeWidth={1.9} />
              </button>
            </section>

            <section className="elite-host-dashboard__panel">
              <PanelHeader
                eyebrow="Reservation mix"
                title="Status overview"
                description="Current state of booking activity."
              />

              <div className="elite-host-dashboard__status-list">
                {reservationBreakdown.map(([label, value, tone]) => (
                  <ReservationStatusRow
                    key={label}
                    label={label}
                    value={value}
                    tone={tone}
                    total={stats.totalReservations}
                  />
                ))}
              </div>
            </section>

            <section className="elite-host-dashboard__panel elite-host-dashboard__listing-health">
              <PanelHeader
                eyebrow="Portfolio health"
                title={`${stats.totalListings || 0} properties`}
                description="Active and inactive listing visibility."
              />

              <div className="elite-host-dashboard__health-grid">
                <div>
                  <strong>{stats.activeListings || 0}</strong>
                  <span>Active</span>
                </div>
                <div>
                  <strong>{inactiveListings}</strong>
                  <span>Inactive</span>
                </div>
              </div>
            </section>
          </aside>
        </div>

      </div>
    </section>
  );
}

/**
 * Gives the dashboard hero a property-management focal point using the first
 * available Host listing. It falls back to an add-listing prompt when the
 * backend has not returned any listings yet.
 */
function HostHeroProperty({ listing, onManage }) {
  const image = getListingImage(listing);

  if (!listing) {
    return (
      <aside className="elite-host-dashboard__hero-property is-empty">
        <span className="elite-host-dashboard__hero-property-kicker">
          Portfolio room
        </span>
        <strong>No listing in focus yet.</strong>
        <p>Create a residence profile before guests can discover your stay.</p>
        <button type="button" onClick={onManage}>
          Add listing
          <ArrowRight size={15} strokeWidth={1.9} />
        </button>
      </aside>
    );
  }

  return (
    <aside className="elite-host-dashboard__hero-property">
      <div className="elite-host-dashboard__hero-property-media">
        {image ? (
          <img src={image} alt={listing.title} />
        ) : (
          <div>
            <Building2 size={26} strokeWidth={1.75} />
            <span>No image</span>
          </div>
        )}

        <span
          className={`elite-host-dashboard__status ${getStatusClasses(
            listing.status
          )}`}
        >
          {formatStatus(listing.status)}
        </span>
      </div>

      <div className="elite-host-dashboard__hero-property-copy">
        <span className="elite-host-dashboard__hero-property-kicker">
          Property in focus
        </span>
        <strong>{listing.title}</strong>
        <p>{getListingLocation(listing)}</p>
        <button type="button" onClick={onManage}>
          Manage residence
          <ArrowRight size={15} strokeWidth={1.9} />
        </button>
      </div>
    </aside>
  );
}

/**
 * Shows a layout-matched dashboard loading state rather than a generic spinner.
 */
function HostDashboardLoading() {
  return (
    <section className="elite-host-dashboard">
      <div className="elite-host-dashboard__inner">
        <div className="elite-host-dashboard__loading-hero">
          <span />
          <span />
          <span />
        </div>

        <div className="elite-host-dashboard__loading-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <span key={index} />
          ))}
        </div>

        <div className="elite-host-dashboard__loading-panel">
          <p>Loading your dashboard...</p>
          <small>Fetching your listings and reservations.</small>
        </div>
      </div>
    </section>
  );
}

/**
 * Presents one backend-derived KPI using a tone that matches its operational
 * importance without inventing analytics beyond the current API response.
 */
function HostMetricCard({ stat }) {
  const Icon = stat.icon;

  return (
    <article
      className={`elite-host-dashboard__metric is-${stat.tone}`}
    >
      <div>
        <span>{stat.title}</span>
        <strong>{stat.value}</strong>
        <p>{stat.subtitle}</p>
      </div>

      <span className="elite-host-dashboard__metric-icon" aria-hidden="true">
        <Icon size={22} strokeWidth={1.85} />
      </span>
    </article>
  );
}

/**
 * Renders a dashboard-level shortcut as a real button so keyboard users can
 * reach the same operational actions as pointer users.
 */
function QuickAction({ title, description, icon: Icon, onClick }) {
  return (
    <button
      type="button"
      className="elite-host-dashboard__quick-action"
      onClick={onClick}
    >
      <span className="elite-host-dashboard__quick-icon" aria-hidden="true">
        <Icon size={19} strokeWidth={1.9} />
      </span>
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <ArrowRight size={16} strokeWidth={1.9} aria-hidden="true" />
    </button>
  );
}

/**
 * Standardizes panel headers and optional navigation actions across dashboard
 * modules without changing the underlying data source.
 */
function PanelHeader({
  eyebrow,
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="elite-host-dashboard__panel-header">
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>

      {actionLabel && (
        <button type="button" onClick={onAction}>
          {actionLabel}
          <ArrowRight size={15} strokeWidth={1.9} />
        </button>
      )}
    </div>
  );
}

/**
 * Displays one upcoming reservation as an itinerary-style row/card, preserving
 * all field fallbacks from the previous table view.
 */
function ReservationCard({ booking }) {
  return (
    <article className="elite-host-dashboard__reservation-card">
      <div className="elite-host-dashboard__reservation-date">
        <CalendarDays size={18} strokeWidth={1.9} />
        <span>{formatDate(booking.checkIn)}</span>
      </div>

      <div className="elite-host-dashboard__reservation-main">
        <div>
          <h3>{getBookingPropertyTitle(booking)}</h3>
          <p>Guest: {getGuestName(booking)}</p>
        </div>

        <div className="elite-host-dashboard__reservation-meta">
          <span>
            <Clock3 size={14} strokeWidth={1.9} />
            {formatDate(booking.checkOut)}
          </span>
          <span>
            <Users size={14} strokeWidth={1.9} />
            {getGuestCount(booking)} guests
          </span>
        </div>
      </div>

      <div className="elite-host-dashboard__reservation-side">
        <strong>{formatMoney(booking.totalAmount)}</strong>
        <span
          className={`elite-host-dashboard__status ${getStatusClasses(
            booking.status
          )}`}
        >
          {formatStatus(booking.status)}
        </span>
      </div>
    </article>
  );
}

/**
 * Shows one reservation-status line with a proportional bar based only on the
 * backend-provided reservation totals.
 */
function ReservationStatusRow({ label, value = 0, tone, total = 0 }) {
  const percentage = total ? Math.round((Number(value || 0) / total) * 100) : 0;

  return (
    <div className="elite-host-dashboard__status-row">
      <div>
        <span>{label}</span>
        <strong>{value || 0}</strong>
      </div>

      <div className="elite-host-dashboard__status-track" aria-hidden="true">
        <span
          className={tone}
          style={{ inlineSize: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Renders an informative empty state that matches the dashboard surface system.
 */
function EmptyOperationsState({ icon: Icon, title, description }) {
  return (
    <div className="elite-host-dashboard__empty-state">
      <span aria-hidden="true">
        <Icon size={30} strokeWidth={1.7} />
      </span>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

/**
 * Presents one property as an operational portfolio item with existing image,
 * location, pricing, status, and manage action fields.
 */
function ListingPreviewCard({ listing, index, onManage }) {
  const image = getListingImage(listing);
  const isFeatured = index === 0;
  const visibility = getHostListingVisibility(listing);

  return (
    <article
      className={`elite-host-dashboard__listing-card ${
        isFeatured ? "is-featured" : ""
      }`}
    >
      <div className="elite-host-dashboard__listing-media">
        {image ? (
          <img src={image} alt={listing.title} />
        ) : (
          <div>
            <Building2 size={28} strokeWidth={1.75} />
            <span>No image</span>
          </div>
        )}

        <span
          className={`elite-host-dashboard__status ${visibility.className}`}
        >
          {visibility.label}
        </span>
      </div>

      <div className="elite-host-dashboard__listing-body">
        <div>
          <p>
            <MapPin size={14} strokeWidth={1.9} />
            {getListingLocation(listing)}
          </p>
          <h3>{listing.title}</h3>
        </div>

        <div className="elite-host-dashboard__listing-facts">
          <span>
            <BedDouble size={15} strokeWidth={1.9} />
            {listing.bedrooms ?? "-"} beds
          </span>
          <span>
            <Users size={15} strokeWidth={1.9} />
            {listing.maxGuests ?? "-"} guests
          </span>
          <span>
            <BadgeCheck size={15} strokeWidth={1.9} />
            {listing.propertyType || listing.type || "Property"}
          </span>
          <span>{visibility.note}</span>
        </div>

        <div className="elite-host-dashboard__listing-footer">
          <strong>
            {formatMoney(listing.pricePerNight)}
            <span> / night</span>
          </strong>

          <button type="button" onClick={onManage}>
            <Eye size={15} strokeWidth={1.9} />
            Manage
          </button>
        </div>
      </div>
    </article>
  );
}
