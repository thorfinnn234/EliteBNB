import {
  Bell,
  ChevronDown,
  Menu,
  Plus,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import "./HostShell.css";

const pageContexts = [
  {
    match: "/host/dashboard",
    title: "Operations briefing",
    eyebrow: "Host workspace",
  },
  {
    match: "/host/listings",
    title: "Property portfolio",
    eyebrow: "Listings",
  },
  {
    match: "/host/calendar",
    title: "Availability control",
    eyebrow: "Calendar",
  },
  {
    match: "/host/reservations",
    title: "Reservation desk",
    eyebrow: "Guest flow",
  },
  {
    match: "/host/earnings",
    title: "Revenue room",
    eyebrow: "Earnings",
  },
  {
    match: "/host/messages",
    title: "Guest conversations",
    eyebrow: "Messages",
  },
  {
    match: "/host/notifications",
    title: "Signal center",
    eyebrow: "Notifications",
  },
  {
    match: "/host/reviews",
    title: "Reputation notes",
    eyebrow: "Reviews",
  },
  {
    match: "/host/profile",
    title: "Host identity",
    eyebrow: "Profile",
  },
  {
    match: "/host/settings",
    title: "Workspace settings",
    eyebrow: "Settings",
  },
];

/**
 * Selects the contextual label shown in the Host topbar for the active route.
 * Keeping this here lets every Host page inherit orientation without changing
 * their data-fetching or route contracts.
 */
function getPageContext(pathname) {
  return (
    pageContexts.find((context) => pathname.startsWith(context.match)) ||
    pageContexts[0]
  );
}

/**
 * Renders the Host-specific topbar with route context, listing action,
 * notifications, and profile access. Branding stays anchored in the sidebar so
 * this bar can stay focused on operational orientation.
 */
export default function HostTopbar({
  displayName,
  profileImageUrl,
  profileMenuOpen = false,
  profileButtonRef,
  activePath,
  onNavigate,
  onMenuClick,
  onProfileClick,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const pageContext = getPageContext(activePath || location.pathname);
  const initial = displayName?.charAt(0)?.toUpperCase() || "H";
  const handleNavigate = onNavigate || navigate;

  return (
    <header className="elite-host-topbar">
      <button
        type="button"
        className="elite-host-topbar__menu"
        onClick={onMenuClick}
        aria-label="Open host navigation"
      >
        <Menu size={20} strokeWidth={1.8} />
      </button>

      <div className="elite-host-topbar__context">
        <span className="elite-host-topbar__eyebrow">
          {pageContext.eyebrow}
        </span>
        <span className="elite-host-topbar__title">
          {pageContext.title}
        </span>
      </div>

      <div className="elite-host-topbar__actions">
        <button
          type="button"
          className="elite-host-topbar__icon-button"
          onClick={() => handleNavigate("/host/listings/create")}
          aria-label="Create a new listing"
        >
          <Plus size={18} strokeWidth={1.9} />
        </button>

        <button
          type="button"
          className="elite-host-topbar__icon-button"
          onClick={() => handleNavigate("/host/notifications")}
          aria-label="Open host notifications"
        >
          <Bell size={18} strokeWidth={1.9} />
          <span className="elite-host-topbar__pulse" aria-hidden="true" />
        </button>

        <button
          type="button"
          ref={profileButtonRef}
          className="elite-host-topbar__profile"
          onClick={onProfileClick}
          aria-expanded={profileMenuOpen}
          aria-haspopup="menu"
          aria-label="Open host profile menu"
        >
          {profileImageUrl ? (
            <img
              src={profileImageUrl}
              alt={displayName}
              className="elite-host-topbar__avatar"
            />
          ) : (
            <span className="elite-host-topbar__avatar" aria-hidden="true">
              {initial}
            </span>
          )}

          <span className="elite-host-topbar__profile-copy">
            <span className="elite-host-topbar__profile-name">
              {displayName}
            </span>
            <span className="elite-host-topbar__profile-role">Host</span>
          </span>

          <ChevronDown size={14} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
