import {
  LogOut,
  MoreHorizontal,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

import {
  primaryHostNavItems,
  secondaryHostNavItems,
} from "./hostNavigation";

const mobilePrimaryItems = [
  primaryHostNavItems[0],
  primaryHostNavItems[1],
  primaryHostNavItems[3],
  primaryHostNavItems[2],
];

/**
 * Checks whether a Host destination should be considered active for route
 * states. Prefix matching keeps nested listing routes highlighted as Listings
 * without changing any production route definitions.
 */
function isHostRouteActive(pathname, destination) {
  return pathname === destination || pathname.startsWith(`${destination}/`);
}

/**
 * Renders the production link or preview button used by the Host mobile
 * navigation. Preview mode simulates route selection without touching auth or
 * changing the protected /host/* route behavior.
 */
function HostMobileNavAction({
  item,
  activePath,
  previewMode,
  onPreviewSelect,
  onCloseMore,
}) {
  const Icon = item.icon;
  const active = isHostRouteActive(activePath, item.to);
  const className = `elite-host-mobile-nav__item ${active ? "is-active" : ""}`;
  const content = (
    <>
      <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
      <span>{item.label}</span>
    </>
  );

  if (previewMode) {
    return (
      <button
        type="button"
        className={className}
        aria-current={active ? "page" : undefined}
        onClick={() => {
          onPreviewSelect?.(item);
          onCloseMore?.();
        }}
      >
        {content}
      </button>
    );
  }

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        `elite-host-mobile-nav__item ${isActive ? "is-active" : ""}`
      }
      onClick={onCloseMore}
    >
      {content}
    </NavLink>
  );
}

/**
 * Provides a Host-specific mobile navigation bar with primary operating tabs
 * and a compact More panel for secondary tools. It deliberately keeps mobile
 * separate from the desktop sidebar so the Host experience feels native at
 * small widths while all real routes remain protected.
 */
export default function HostMobileNav({
  previewMode = false,
  activePath,
  onPreviewSelect,
  onLogout,
}) {
  const [moreOpenRoute, setMoreOpenRoute] = useState(null);
  const navRef = useRef(null);
  const location = useLocation();
  const morePanelId = useId();
  const currentPath = activePath || location.pathname;
  const moreDestinations = [
    primaryHostNavItems[4],
    ...secondaryHostNavItems,
  ];
  const moreOpen = moreOpenRoute === currentPath;
  const moreActive =
    moreOpen ||
    moreDestinations.some((item) => isHostRouteActive(currentPath, item.to));
  const closeMorePanel = () => setMoreOpenRoute(null);

  useEffect(() => {
    if (!moreOpen) return undefined;

    /**
     * Treats the More sheet like a small mobile drawer: Escape and outside
     * pointer interaction dismiss it, while clicks inside the dock remain
     * available for navigation.
     */
    function handleDismiss(event) {
      if (event.key === "Escape") {
        setMoreOpenRoute(null);
      }
    }

    /**
     * Closes the More sheet when the host taps outside the navigation surface,
     * matching the profile-menu behavior without changing route state.
     */
    function handleOutsidePointer(event) {
      if (!navRef.current?.contains(event.target)) {
        setMoreOpenRoute(null);
      }
    }

    document.addEventListener("keydown", handleDismiss);
    document.addEventListener("pointerdown", handleOutsidePointer);

    return () => {
      document.removeEventListener("keydown", handleDismiss);
      document.removeEventListener("pointerdown", handleOutsidePointer);
    };
  }, [moreOpen]);

  return (
    <nav
      ref={navRef}
      className="elite-host-mobile-nav"
      aria-label="Host mobile navigation"
    >
      {moreOpen && (
        <div
          id={morePanelId}
          className="elite-host-mobile-nav__more"
          aria-label="More host destinations"
        >
          <span className="elite-host-mobile-nav__more-label">
            Host tools
          </span>

          <div className="elite-host-mobile-nav__more-grid">
            {moreDestinations.map((item) => (
              <HostMobileNavAction
                key={item.to}
                item={item}
                activePath={currentPath}
                previewMode={previewMode}
                onPreviewSelect={onPreviewSelect}
                onCloseMore={closeMorePanel}
              />
            ))}

            <button
              type="button"
              className="elite-host-mobile-nav__item is-danger"
              onClick={() => {
                onLogout?.();
                closeMorePanel();
              }}
            >
              <LogOut size={19} strokeWidth={1.9} aria-hidden="true" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      <div className="elite-host-mobile-nav__bar">
        {mobilePrimaryItems.map((item) => (
          <HostMobileNavAction
            key={item.to}
            item={item}
            activePath={currentPath}
            previewMode={previewMode}
            onPreviewSelect={onPreviewSelect}
            onCloseMore={closeMorePanel}
          />
        ))}

        <button
          type="button"
          className={`elite-host-mobile-nav__item ${moreActive ? "is-active" : ""}`}
          aria-controls={morePanelId}
          aria-expanded={moreOpen}
          onClick={() =>
            setMoreOpenRoute((route) =>
              route === currentPath ? null : currentPath
            )
          }
        >
          <MoreHorizontal size={20} strokeWidth={1.9} aria-hidden="true" />
          <span>More</span>
        </button>
      </div>
    </nav>
  );
}
