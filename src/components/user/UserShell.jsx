import {
  ArrowUp,
  Bell,
  CalendarDays,
  Heart,
  Home,
  LogOut,
  Search,
  Star,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useGuestAvatar } from "../../hooks/useGuestAvatar";
import EliteLogo from "../public/EliteLogo";
import GuestAvatar from "./GuestAvatar";
import "./UserShell.css";

const primaryNavItems = [
  {
    key: "home",
    label: "Home",
    routePath: "/user/dashboard",
    productionTo: "/user/dashboard",
    previewTo: "/dev/user-preview",
    icon: Home,
  },
  {
    key: "explore",
    label: "Explore",
    routePath: "/search",
    productionTo: "/search",
    previewTo: "/dev/user-preview/explore",
    icon: Search,
  },
  {
    key: "trips",
    label: "Trips",
    routePath: "/user/trips",
    productionTo: "/user/trips",
    previewTo: "/dev/user-preview/trips",
    icon: CalendarDays,
  },
  {
    key: "saved",
    label: "Saved",
    routePath: "/user/wishlist",
    productionTo: "/user/wishlist",
    previewTo: "/dev/user-preview/saved",
    icon: Heart,
  },
  {
    key: "reviews",
    label: "Reviews",
    routePath: "/user/reviews",
    productionTo: "/user/reviews",
    previewTo: "/dev/user-preview/reviews",
    icon: Star,
  },
  {
    key: "profile",
    label: "Profile",
    routePath: "/user/profile",
    productionTo: "/user/profile",
    previewTo: "/dev/user-preview/profile",
    icon: UserRound,
  },
];

const mobileNavItems = primaryNavItems.filter((item) =>
  ["home", "explore", "trips", "saved", "profile"].includes(item.key)
);

const routeLabels = {
  "/dev/user-preview/explore": "Explore",
  "/dev/user-preview/trips": "Trips",
  "/dev/user-preview/saved": "Saved stays",
  "/dev/user-preview/reviews": "Reviews",
  "/dev/user-preview/profile": "Profile",
  "/dev/user-preview": "Guest home",
  "/search": "Explore",
  "/user/dashboard": "Guest home",
  "/user/trips": "Trips",
  "/user/wishlist": "Saved stays",
  "/user/reviews": "Reviews",
  "/user/profile": "Profile",
  "/user/booking-checkout": "Checkout",
};

/**
 * Calibrates the Floating Guest Dock's automatic scroll response. The dock
 * listens for accumulated intent instead of reacting to every small wheel or
 * trackpad delta, which keeps it calm while still minimizing without requiring
 * an unrelated click.
 */
const dockScrollBehavior = {
  collapseIntent: 54,
  collapseStart: 220,
  ignoreDelta: 3,
  intentResetMs: 180,
  restoreIntent: 34,
  topReset: 140,
};

/**
 * Chooses production or development-preview link targets for the same User
 * navigation model. Preview mode keeps visual QA inside `/dev/user-preview/*`
 * while the real application continues to use protected production routes.
 */
function getNavigationItems(items, previewMode) {
  return items.map((item) => ({
    ...item,
    to: previewMode ? item.previewTo : item.productionTo,
  }));
}

/**
 * Finds the most useful display name from the authenticated user object.
 * Auth responses may expose firstName/lastName, name, or only an email.
 */
function getDisplayName(user) {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  if (fullName) return fullName;
  if (user?.name) return user.name;
  if (user?.email) return user.email.split("@")[0];

  return "Guest";
}

/**
 * Builds compact initials for the profile affordance without assuming a fixed
 * backend user shape.
 */
function getInitials(displayName) {
  return displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

/**
 * Returns a human-readable label for the current User route.
 * This keeps the top bar helpful while placeholder subpages still exist.
 */
function getRouteLabel(pathname) {
  const matchingRoute = Object.keys(routeLabels)
    .sort((firstRoute, secondRoute) => secondRoute.length - firstRoute.length)
    .find(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  return routeLabels[matchingRoute] ?? "Guest workspace";
}

/**
 * Renders one shell navigation item with consistent icon, active, and focus
 * treatment across the floating desktop dock and mobile bottom navigation.
 * Dock items receive a small CSS scale value so pointer and keyboard focus can
 * create the restrained magnification response without changing layout size.
 */
function UserNavigationLink({
  activeRoutePath,
  compact = false,
  dockIndex,
  hoveredDockIndex,
  item,
  onDockFocus,
  onDockHover,
  onNavigate,
}) {
  const Icon = item.icon;
  const isDockItem = Number.isInteger(dockIndex);
  const dockDistance =
    isDockItem && Number.isInteger(hoveredDockIndex)
      ? Math.abs(hoveredDockIndex - dockIndex)
      : null;
  const dockScale =
    dockDistance === 0 ? 1.18 : dockDistance === 1 ? 1.08 : 1;
  const dockLift =
    dockDistance === 0 ? "-0.42rem" : dockDistance === 1 ? "-0.16rem" : "0rem";

  return (
    <NavLink
      to={item.to}
      end={item.key === "home"}
      title={compact ? item.label : undefined}
      style={isDockItem ? { "--dock-scale": dockScale, "--dock-lift": dockLift } : undefined}
      onFocus={isDockItem ? () => onDockFocus(dockIndex) : undefined}
      onClick={onNavigate}
      onPointerEnter={isDockItem ? () => onDockHover(dockIndex) : undefined}
      className={({ isActive }) =>
        `elite-user-nav__link${
          isActive || activeRoutePath === item.routePath ? " is-active" : ""
        }${
          compact ? " elite-user-nav__link--compact" : ""
        }${
          isDockItem ? " elite-user-nav__link--dock" : ""
        }`
      }
      aria-label={compact || isDockItem ? item.label : undefined}
    >
      <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
      <span className="elite-user-nav__label">{item.label}</span>
    </NavLink>
  );
}

/**
 * Provides the signature desktop guest dock. It replaces the conventional rail
 * with a floating control surface that can rest in compact icon mode, expand on
 * intent, and still expose accessible labels for icon-only navigation.
 */
function UserFloatingDock({
  activeRoutePath,
  avatarId,
  displayName,
  hoveredDockIndex,
  homeTo,
  initials,
  isCollapsed,
  isScrollMinimized,
  isExpanded,
  navItems,
  onDockFocus,
  onDockHover,
  onDockLeave,
  onDockEnter,
  onDockRouteSelect,
  onNavigate,
  onToggleExpanded,
  onLogout,
  profileTo,
}) {
  return (
    <div
      className={`elite-user-dock${isExpanded ? " is-expanded" : ""}${
        isCollapsed ? " is-scroll-compact" : ""
      }`}
      onPointerDownCapture={(event) => {
        const dockNavigationWasPressed = event.target.closest?.(
          ".elite-user-dock__items"
        );

        if (
          !isScrollMinimized ||
          event.pointerType !== "mouse" ||
          !dockNavigationWasPressed ||
          !Number.isInteger(hoveredDockIndex)
        ) {
          return;
        }

        const selectedItem = navItems[hoveredDockIndex];

        if (!selectedItem) return;

        event.preventDefault();
        onDockRouteSelect(selectedItem.to);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          onDockLeave();
        }
      }}
      onPointerEnter={onDockEnter}
      onPointerLeave={onDockLeave}
    >
      <Link to={homeTo} className="elite-user-dock__brand">
        <EliteLogo variant="mark" label="EliteBNB home" />
        <span className="elite-user-dock__brand-copy">
          <strong>EliteBNB</strong>
          <small>Guest dock</small>
        </span>
      </Link>

      <nav className="elite-user-dock__items" aria-label="Primary guest links">
        {navItems.map((item, index) => (
          <UserNavigationLink
            key={item.key}
            activeRoutePath={activeRoutePath}
            dockIndex={index}
            hoveredDockIndex={hoveredDockIndex}
            item={item}
            onDockFocus={onDockFocus}
            onDockHover={onDockHover}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="elite-user-dock__account">
        <button
          type="button"
          className="elite-user-dock__toggle"
          aria-label={isExpanded ? "Collapse dock labels" : "Expand dock labels"}
          aria-pressed={isExpanded}
          onClick={onToggleExpanded}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
        <Link to={profileTo} className="elite-user-dock__profile">
          <GuestAvatar avatarId={avatarId} initials={initials} size="dock" />
          <span className="elite-user-dock__profile-copy">
            <strong>{displayName}</strong>
            <small>Guest account</small>
          </span>
        </Link>
        <button
          type="button"
          className="elite-user-dock__logout"
          onClick={onLogout}
          aria-label="Logout"
        >
          <LogOut size={18} aria-hidden="true" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

/**
 * Keeps route context and account controls close at hand without repeating the
 * full brand system inside every User page.
 */
function UserTopbar({
  avatarId,
  displayName,
  homeTo,
  initials,
  profileTo,
  routeLabel,
  searchTo,
}) {
  return (
    <header className="elite-user-topbar">
      <Link to={homeTo} className="elite-user-topbar__brand">
        <EliteLogo
          variant="primary"
          className="elite-user-topbar__logo"
          label="EliteBNB guest home"
        />
        <span className="elite-user-topbar__brand-context">
          Guest experience
        </span>
      </Link>

      <div className="elite-user-topbar__context">
        <p className="elite-user-topbar__eyebrow">Now viewing</p>
        <h1>{routeLabel}</h1>
      </div>

      <div className="elite-user-topbar__actions">
        <Link to={searchTo} className="elite-user-topbar__search">
          <Search size={17} aria-hidden="true" />
          <span>Explore</span>
        </Link>
        <button
          type="button"
          className="elite-user-icon-button"
          aria-label="View notifications"
        >
          <Bell size={18} aria-hidden="true" />
        </button>
        <Link to={profileTo} className="elite-user-topbar__profile">
          <GuestAvatar avatarId={avatarId} initials={initials} size="topbar" />
          <span>
            <strong>{displayName}</strong>
            <small>Profile</small>
          </span>
        </Link>
      </div>
    </header>
  );
}

/**
 * Supplies the touch-first mobile navigation pattern. The bottom placement
 * keeps the guest actions reachable without forcing a desktop rail onto phones.
 */
function UserBottomNav({ activeRoutePath, navItems, onNavigate }) {
  return (
    <nav className="elite-user-bottom-nav" aria-label="Mobile guest navigation">
      {navItems.map((item) => (
        <UserNavigationLink
          key={item.key}
          activeRoutePath={activeRoutePath}
          item={item}
          compact
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

/**
 * Provides a route-shell-level return action for long User pages.
 * The behavior is intentionally owned by the shell so production and preview
 * routes share the same scroll affordance without weakening route guards.
 */
function UserBackToTop({ isVisible, onClick }) {
  return (
    <button
      type="button"
      className={`elite-user-back-top${isVisible ? " is-visible" : ""}`}
      aria-label="Back to top"
      onClick={onClick}
    >
      <span aria-hidden="true" />
      <ArrowUp size={17} aria-hidden="true" />
    </button>
  );
}

/**
 * Wraps authenticated USER pages in a dedicated customer-facing shell.
 * It preserves route guards upstream and only handles navigation, account
 * affordances, and responsive layout chrome.
 */
export default function UserShell({
  children,
  previewMode = false,
  previewUser,
  previewRoutePath,
}) {
  const { logout, user } = useAuth();
  const { selectedAvatarId } = useGuestAvatar();
  const navigate = useNavigate();
  const location = useLocation();
  const contentRef = useRef(null);
  const dockIntentResetTimerRef = useRef(null);
  const [isBackToTopVisible, setIsBackToTopVisible] = useState(false);
  const [hoveredDockIndex, setHoveredDockIndex] = useState(null);
  const [isDockCollapsedByScroll, setIsDockCollapsedByScroll] = useState(false);
  const [isDockRestoredByIntent, setIsDockRestoredByIntent] = useState(false);
  const [isDockExpanded, setIsDockExpanded] = useState(() => {
    try {
      return window.sessionStorage.getItem("elitebnb-guest-dock-expanded") === "true";
    } catch {
      return false;
    }
  });
  const effectiveUser = previewUser ?? user;
  const displayName = getDisplayName(effectiveUser);
  const initials = getInitials(displayName) || "EB";
  const activeRoutePath = previewRoutePath ?? location.pathname;
  const routeLabel = getRouteLabel(activeRoutePath);
  const desktopNavItems = getNavigationItems(primaryNavItems, previewMode);
  const bottomNavItems = getNavigationItems(mobileNavItems, previewMode);
  const homeTo = previewMode ? "/dev/user-preview" : "/user/dashboard";
  const profileTo = previewMode ? "/dev/user-preview/profile" : "/user/profile";
  const searchTo = previewMode ? "/dev/user-preview/explore" : "/search";
  const shouldRenderDockMinimized =
    isDockCollapsedByScroll && !isDockRestoredByIntent;

  /**
   * Clears the delayed Dock restoration timer. The timer lets the Dock settle
   * back into the scroll-minimized state shortly after pointer intent leaves,
   * rather than snapping closed while the cursor is still nearby.
   */
  const clearDockIntentResetTimer = () => {
    window.clearTimeout(dockIntentResetTimerRef.current);
  };

  /**
   * Removes the delayed Dock timer on unmount so an old shell instance cannot
   * update state after route teardown.
   */
  useEffect(() => {
    return () => {
      window.clearTimeout(dockIntentResetTimerRef.current);
    };
  }, []);

  /**
   * Resets transient shell chrome after route changes. App.jsx owns the actual
   * route-level scroll reset; the shell only makes sure the Dock returns to its
   * resting state unless the guest explicitly chose to keep labels expanded.
   */
  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const shouldKeepExpanded = isDockExpanded;
      const activeElement = document.activeElement;
      const navigationHadFocus = activeElement?.closest?.(
        ".elite-user-dock, .elite-user-bottom-nav"
      );

      setIsBackToTopVisible(false);
      setIsDockCollapsedByScroll(false);
      setIsDockRestoredByIntent(false);
      setHoveredDockIndex(null);

      if (!shouldKeepExpanded) {
        setIsDockExpanded(false);
      }

      if (navigationHadFocus && !shouldKeepExpanded) {
        contentRef.current?.focus({ preventScroll: true });
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isDockExpanded, location.pathname, location.search]);

  /**
   * Shows the back-to-top control only after the guest has moved well into a
   * page and lets the dock become quieter on intentional downward scroll.
   * The delta threshold avoids distracting state changes from tiny trackpad
   * movements while keeping navigation available at all times.
   */
  useEffect(() => {
    let previousScrollY = window.scrollY;
    let downwardIntent = 0;
    let upwardIntent = 0;
    let resetIntentTimer;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - previousScrollY;

      setIsBackToTopVisible(currentScrollY > 720);

      if (Math.abs(scrollDelta) <= dockScrollBehavior.ignoreDelta) {
        return;
      }

      if (currentScrollY < dockScrollBehavior.topReset) {
        downwardIntent = 0;
        upwardIntent = 0;
        setIsDockCollapsedByScroll(false);
        setIsDockRestoredByIntent(false);
      } else if (scrollDelta > 0) {
        downwardIntent += scrollDelta;
        upwardIntent = 0;

        if (
          currentScrollY > dockScrollBehavior.collapseStart &&
          downwardIntent >= dockScrollBehavior.collapseIntent
        ) {
          setIsDockCollapsedByScroll(true);
          setIsDockRestoredByIntent(false);
          downwardIntent = 0;
        }
      } else {
        upwardIntent += Math.abs(scrollDelta);
        downwardIntent = 0;

        if (upwardIntent >= dockScrollBehavior.restoreIntent) {
          setIsDockCollapsedByScroll(false);
          setIsDockRestoredByIntent(false);
          upwardIntent = 0;
        }
      }

      previousScrollY = currentScrollY;

      window.clearTimeout(resetIntentTimer);
      resetIntentTimer = window.setTimeout(() => {
        downwardIntent = 0;
        upwardIntent = 0;
      }, dockScrollBehavior.intentResetMs);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.clearTimeout(resetIntentTimer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  /**
   * Lets the guest intentionally keep labels visible for the current browser
   * session. This stores UI preference only; it does not touch auth state or
   * localStorage tokens.
   */
  const handleDockExpandedToggle = () => {
    const nextDockState = !isDockExpanded;

    setIsDockExpanded(nextDockState);
    setIsDockCollapsedByScroll(false);
    setIsDockRestoredByIntent(false);

    try {
      window.sessionStorage.setItem(
        "elitebnb-guest-dock-expanded",
        String(nextDockState)
      );
    } catch {
      // Session storage can be unavailable in private contexts; the dock still works.
    }
  };

  /**
   * Restores the dock when the visitor intentionally points at the minimized
   * surface. This is separate from the saved expanded-label preference so hover
   * restoration and scroll minimization can both work naturally.
   */
  const handleDockEnter = () => {
    clearDockIntentResetTimer();
    setIsDockRestoredByIntent(true);
  };

  /**
   * Returns hover-restored dock clarity to the appropriate scroll state after a
   * short grace period. The delay prevents flicker when the pointer briefly
   * crosses gaps between magnified dock items.
   */
  const handleDockHoverIntent = (dockIndex) => {
    clearDockIntentResetTimer();
    setIsDockRestoredByIntent(true);
    setHoveredDockIndex(dockIndex);
  };

  /**
   * Keyboard focus should restore the full Dock treatment because there is no
   * pointer target to shift, and visible labels make tabbed navigation clearer.
   */
  const handleDockFocusIntent = (dockIndex) => {
    clearDockIntentResetTimer();
    setIsDockRestoredByIntent(true);
    setHoveredDockIndex(dockIndex);
  };

  /**
   * Releases pointer/focus restoration without changing the guest's explicit
   * expanded-label preference. If the page is still in a down-scroll context,
   * the dock returns to the minimized visual state after the short grace delay.
   */
  const handleDockLeave = () => {
    clearDockIntentResetTimer();

    dockIntentResetTimerRef.current = window.setTimeout(() => {
      setIsDockRestoredByIntent(false);
      setHoveredDockIndex(null);
    }, 420);
  };

  /**
   * Collapses temporary Dock clarity when a guest chooses a destination.
   * This also handles clicks on the current route, where React Router would not
   * emit a new location value for the route-change effect above to observe.
   */
  const handleNavigationIntent = () => {
    setIsDockCollapsedByScroll(false);
    setIsDockRestoredByIntent(false);
    setHoveredDockIndex(null);

    window.requestAnimationFrame(() => {
      window.scrollTo({ left: 0, top: 0, behavior: "auto" });
    });

    if (!isDockExpanded) {
      const activeElement = document.activeElement;

      activeElement?.blur?.();
    }
  };

  /**
   * Handles the edge case where a pointer press begins while the dock is still
   * transitioning out of its minimized state. Selecting the item that already
   * owns hover intent keeps the first click reliable without using outside-page
   * clicks as part of the dock state machine.
   */
  const handleDockRouteSelect = (to) => {
    handleNavigationIntent();
    navigate(to);
  };

  /**
   * Clears shared auth state through AuthContext in production and returns the
   * guest to login. Preview mode skips logout so visual QA cannot clear a real
   * local token by accident.
   */
  const handleLogout = () => {
    if (previewMode) {
      navigate("/login", { replace: true });
      return;
    }

    logout();
    navigate("/login", { replace: true });
  };

  /**
   * Returns to the top using native smooth scroll unless the visitor has asked
   * the operating system for reduced motion.
   */
  const handleBackToTop = () => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    window.scrollTo({
      left: 0,
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  return (
    <div className="elite-user-shell">
      <UserFloatingDock
        avatarId={selectedAvatarId}
        displayName={displayName}
        hoveredDockIndex={hoveredDockIndex}
        homeTo={homeTo}
        initials={initials}
        isCollapsed={shouldRenderDockMinimized}
        isScrollMinimized={isDockCollapsedByScroll}
        isExpanded={isDockExpanded}
        navItems={desktopNavItems}
        onDockEnter={handleDockEnter}
        onDockFocus={handleDockFocusIntent}
        onDockHover={handleDockHoverIntent}
        onDockLeave={handleDockLeave}
        onDockRouteSelect={handleDockRouteSelect}
        onNavigate={handleNavigationIntent}
        onToggleExpanded={handleDockExpandedToggle}
        onLogout={handleLogout}
        profileTo={profileTo}
        activeRoutePath={activeRoutePath}
      />

      <div className="elite-user-shell__main">
        <UserTopbar
          avatarId={selectedAvatarId}
          displayName={displayName}
          homeTo={homeTo}
          initials={initials}
          profileTo={profileTo}
          routeLabel={routeLabel}
          searchTo={searchTo}
        />
        <main
          className="elite-user-shell__content"
          ref={contentRef}
          tabIndex={-1}
        >
          {children}
        </main>
      </div>

      <UserBottomNav
        activeRoutePath={activeRoutePath}
        navItems={bottomNavItems}
        onNavigate={handleNavigationIntent}
      />
      <UserBackToTop
        isVisible={isBackToTopVisible}
        onClick={handleBackToTop}
      />
    </div>
  );
}
