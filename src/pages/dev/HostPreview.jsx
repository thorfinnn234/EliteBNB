import { useEffect, useRef, useState } from "react";
import {
  LogOut,
  Settings,
  UserRound,
} from "lucide-react";

import HostMobileNav from "../../components/host/HostMobileNav";
import HostSidebar from "../../components/host/HostSidebar";
import HostTopbar from "../../components/host/HostTopbar";
import { HostDashboardView } from "../host/HostDashboard";
import coastalVillaImage from "../../assets/home/editorial-ocean-villa.jpg";
import lagosResidenceImage from "../../assets/home/destination-lagos.jpg";
import poolHouseImage from "../../assets/home/property-modern-pool.jpg";

const previewHost = {
  firstName: "Amara",
  lastName: "Okafor",
  email: "amara.host@elitebnb.preview",
};

const previewStats = {
  totalListings: 8,
  activeListings: 6,
  totalReservations: 24,
  pendingReservations: 3,
  confirmedReservations: 9,
  completedReservations: 11,
  cancelledReservations: 1,
  totalEarnings: 8650000,
};

const previewReservations = [
  {
    id: "preview-reservation-1",
    guestName: "Nadia Bello",
    propertyTitle: "Azure House",
    checkIn: "2026-09-18",
    checkOut: "2026-09-22",
    numberOfGuests: 4,
    totalAmount: 740000,
    status: "PENDING",
  },
  {
    id: "preview-reservation-2",
    guestName: "Julian Carter",
    propertyTitle: "Lekki Palm Residence",
    checkIn: "2026-09-25",
    checkOut: "2026-09-29",
    guests: 2,
    totalAmount: 520000,
    status: "CONFIRMED",
  },
  {
    id: "preview-reservation-3",
    guestName: "Amina Roberts",
    propertyTitle: "Cape View Atelier",
    checkIn: "2026-10-03",
    checkOut: "2026-10-07",
    numberOfGuests: 5,
    totalAmount: 980000,
    status: "CONFIRMED",
  },
  {
    id: "preview-reservation-4",
    guestName: "Tomi Adebayo",
    propertyTitle: "Ikoyi Courtyard Villa",
    checkIn: "2026-10-12",
    checkOut: "2026-10-14",
    guests: 3,
    totalAmount: 410000,
    status: "PENDING",
  },
];

const previewListings = [
  {
    id: "preview-listing-1",
    title: "Azure House",
    location: "Victoria Island, Lagos",
    status: "ACTIVE",
    bedrooms: 4,
    maxGuests: 8,
    propertyType: "Villa",
    pricePerNight: 185000,
    imageUrls: [coastalVillaImage],
  },
  {
    id: "preview-listing-2",
    title: "Lekki Palm Residence",
    location: "Lekki Phase 1, Lagos",
    status: "ACTIVE",
    bedrooms: 3,
    maxGuests: 6,
    propertyType: "Apartment",
    pricePerNight: 140000,
    imageUrls: [lagosResidenceImage],
  },
  {
    id: "preview-listing-3",
    title: "Pool House Pavilion",
    location: "Abuja, Nigeria",
    status: "INACTIVE",
    bedrooms: 5,
    maxGuests: 10,
    propertyType: "House",
    pricePerNight: 230000,
    imageUrls: [poolHouseImage],
  },
];

/**
 * Builds a display name from the local preview host identity. This keeps
 * preview identity presentation separate from AuthContext and localStorage.
 */
function getPreviewDisplayName(host) {
  return [host.firstName, host.lastName].filter(Boolean).join(" ");
}

/**
 * Renders a frontend-only Host preview shell with local data. It intentionally
 * avoids HostLayout because HostLayout fetches the real host profile from the
 * backend for production authenticated routes.
 */
export default function HostPreview() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [previewPath, setPreviewPath] = useState("/host/dashboard");
  const profileMenuRef = useRef(null);
  const profileButtonRef = useRef(null);
  const displayName = getPreviewDisplayName(previewHost);

  useEffect(() => {
    if (!profileMenuOpen) return undefined;

    /**
     * Mirrors the production Host profile-menu outside-click behavior without
     * reading or writing any real authentication state.
     */
    function handleClickOutside(event) {
      const clickedMenu = profileMenuRef.current?.contains(event.target);
      const clickedButton = profileButtonRef.current?.contains(event.target);

      if (!clickedMenu && !clickedButton) {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileMenuOpen]);

  useEffect(() => {
    if (!sidebarOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

  useEffect(() => {
    if (!profileMenuOpen) return undefined;

    /**
     * Keeps keyboard close behavior aligned with the authenticated Host shell.
     */
    function handleEscape(event) {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => document.removeEventListener("keydown", handleEscape);
  }, [profileMenuOpen]);

  /**
   * Keeps all dashboard/topbar actions inside the preview surface instead of
   * navigating to protected production Host routes during visual review.
   */
  function handlePreviewNavigate(destination = "/host/dashboard") {
    setPreviewPath(destination);
    window.scrollTo({ left: 0, top: 0, behavior: "auto" });
  }

  return (
    <div className="elite-host-shell">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close host preview navigation"
          onClick={() => setSidebarOpen(false)}
          className="elite-host-shell__scrim lg:hidden"
        />
      )}

      <HostSidebar
        open={sidebarOpen}
        previewMode
        activePath={previewPath}
        onClose={() => setSidebarOpen(false)}
        onLogout={() => handlePreviewNavigate("/host/dashboard")}
        onPreviewSelect={(item) => handlePreviewNavigate(item.to)}
      />

      <div className="elite-host-shell__content">
        <div className="elite-host-shell__topbar">
          <HostTopbar
            displayName={displayName}
            profileButtonRef={profileButtonRef}
            profileMenuOpen={profileMenuOpen}
            activePath={previewPath}
            onMenuClick={() => setSidebarOpen((current) => !current)}
            onProfileClick={() => setProfileMenuOpen((current) => !current)}
            onNavigate={handlePreviewNavigate}
          />

          {profileMenuOpen && (
            <div
              ref={profileMenuRef}
              role="menu"
              className="elite-host-profile-menu"
            >
              <div className="elite-host-profile-menu__summary">
                <div className="elite-host-profile-menu__avatar">
                  {previewHost.firstName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <span className="elite-host-profile-menu__name">
                    {displayName}
                  </span>
                  <span className="elite-host-profile-menu__email">
                    {previewHost.email}
                  </span>
                </div>
              </div>

              <div className="elite-host-profile-menu__items">
                <button
                  type="button"
                  role="menuitem"
                  className="elite-host-profile-menu__item"
                  onClick={() => setProfileMenuOpen(false)}
                >
                  <UserRound size={16} strokeWidth={1.8} />
                  Preview profile
                </button>

                <button
                  type="button"
                  role="menuitem"
                  className="elite-host-profile-menu__item"
                  onClick={() => setProfileMenuOpen(false)}
                >
                  <Settings size={16} strokeWidth={1.8} />
                  Preview settings
                </button>

                <button
                  type="button"
                  role="menuitem"
                  className="elite-host-profile-menu__item is-danger"
                  onClick={() => setProfileMenuOpen(false)}
                >
                  <LogOut size={16} strokeWidth={1.8} />
                  Preview logout
                </button>
              </div>
            </div>
          )}
        </div>

        <main className="elite-host-main">
          <div className="elite-host-preview-note" role="note">
            Development preview only. Data on this screen is local presentation
            data and is not loaded from the Host backend.
          </div>

          <HostDashboardView
            userFirstName={previewHost.firstName}
            stats={previewStats}
            reservations={previewReservations}
            listings={previewListings}
            onNavigate={handlePreviewNavigate}
          />
        </main>

        <HostMobileNav
          previewMode
          activePath={previewPath}
          onPreviewSelect={(item) => handlePreviewNavigate(item.to)}
          onLogout={() => handlePreviewNavigate("/host/dashboard")}
        />
      </div>
    </div>
  );
}
