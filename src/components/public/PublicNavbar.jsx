import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import EliteLogo from "./EliteLogo";

const navLinks = [
  { label: "Discover", to: "/search" },
  { label: "Destinations", to: "/#destinations" },
  { label: "Hosting", to: "/register" },
];

const mobileNavLinks = [
  {
    label: "Discover",
    description: "Curated stays and rare addresses.",
    to: "/search",
  },
  {
    label: "Destinations",
    description: "Choose the atmosphere first.",
    to: "/#destinations",
  },
  {
    label: "Hosting",
    description: "Open your residence to EliteBNB.",
    to: "/register",
  },
];

/**
 * Keeps the hero navigation integrated with the cinematic opening until the
 * page is almost through the hero. The cap prevents very tall screens from
 * delaying the light-state transition too long.
 */
function getHomeNavThreshold() {
  if (typeof window === "undefined") return 0;

  return Math.min(window.innerHeight * 0.82, 760);
}

/**
 * Provides the minimal public navigation for the editorial homepage experience.
 * It adapts from transparent-over-media to a quiet ivory surface as users scroll.
 */
export default function PublicNavbar() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const menuButtonRef = useRef(null);
  const mobilePanelRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(() => {
    if (typeof window === "undefined") return false;

    return window.scrollY > getHomeNavThreshold();
  });
  const overMedia = isHome && !isScrolled;
  const logoVariant = overMedia ? "mark" : "primary";
  const mobileLinkTabIndex = menuOpen ? 0 : -1;

  useEffect(() => {
    /**
     * Keeps the public nav readable as the homepage moves from image-led scenes
     * into ivory editorial sections. Resize matters because the scroll threshold
     * is based on viewport height, not a hard-coded pixel value.
     */
    const updateNavState = () => {
      setIsScrolled(isHome ? window.scrollY > getHomeNavThreshold() : true);
    };

    updateNavState();
    window.addEventListener("scroll", updateNavState, { passive: true });
    window.addEventListener("resize", updateNavState);

    return () => {
      window.removeEventListener("scroll", updateNavState);
      window.removeEventListener("resize", updateNavState);
    };
  }, [isHome]);

  useEffect(() => {
    // Route and hash navigations should collapse the mobile menu so the newly
    // selected page section is immediately visible on small touch screens.
    const closeFrame = window.requestAnimationFrame(() => {
      setMenuOpen(false);
    });

    return () => {
      window.cancelAnimationFrame(closeFrame);
    };
  }, [location.hash, location.pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const focusTimer = window.setTimeout(() => {
      mobilePanelRef.current?.querySelector("a")?.focus();
    }, 120);

    /**
     * Lets keyboard users leave the expanded mobile navigation without needing
     * to tab through every link. Focus returns to the trigger for orientation.
     */
    const handleEscapeKey = (event) => {
      if (event.key !== "Escape") return;

      setMenuOpen(false);
      window.requestAnimationFrame(() => {
        menuButtonRef.current?.focus();
      });
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [menuOpen]);

  /**
   * Opens or closes the mobile menu while keeping desktop navigation unchanged.
   */
  const handleMenuToggle = () => {
    setMenuOpen((open) => !open);
  };

  /**
   * Closes the mobile menu after a user chooses a destination.
   */
  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header
      className={`elite-public-nav ${
        overMedia ? "elite-public-nav--over-media" : "elite-public-nav--solid"
      } ${menuOpen ? "elite-public-nav--menu-open" : ""}`}
    >
      <Link to="/" className="elite-public-nav__brand" onClick={closeMenu}>
        <EliteLogo variant={logoVariant} />
      </Link>

      <nav className="elite-public-nav__links" aria-label="Primary navigation">
        {navLinks.map((link) => (
          <Link key={link.label} to={link.to}>
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="elite-public-nav__actions">
        <Link className="elite-public-nav__search" to="/search">
          <Search size={16} aria-hidden="true" />
          <span>Search</span>
        </Link>
        <Link className="elite-public-nav__login" to="/login">
          Login
        </Link>
        <Link className="elite-public-nav__start" to="/register">
          Get started
        </Link>
      </div>

      <button
        ref={menuButtonRef}
        type="button"
        className="elite-public-nav__menu"
        aria-controls="elite-public-mobile-menu"
        aria-expanded={menuOpen}
        aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        onClick={handleMenuToggle}
      >
        <span className="elite-public-nav__menu-lines" aria-hidden="true">
          <span className="elite-public-nav__menu-line elite-public-nav__menu-line--top" />
          <span className="elite-public-nav__menu-line elite-public-nav__menu-line--bottom" />
        </span>
      </button>

      <div
        ref={mobilePanelRef}
        id="elite-public-mobile-menu"
        role="dialog"
        aria-modal={menuOpen ? "true" : undefined}
        aria-hidden={!menuOpen}
        aria-label="Public navigation"
        className={`elite-public-nav__mobile ${menuOpen ? "is-open" : ""}`}
      >
        <div className="elite-public-nav__mobile-intro">
          <p>EXPLORE</p>
          <span>PREMIUM STAYS. ELEVATED.</span>
        </div>

        <nav className="elite-public-nav__mobile-primary" aria-label="Mobile primary navigation">
          {mobileNavLinks.map((link, index) => (
            <Link
              key={link.label}
              to={link.to}
              onClick={closeMenu}
              tabIndex={mobileLinkTabIndex}
            >
              <span className="elite-public-nav__mobile-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="elite-public-nav__mobile-link-copy">
                <strong>{link.label}</strong>
                <small>{link.description}</small>
              </span>
            </Link>
          ))}
        </nav>

        <div className="elite-public-nav__mobile-actions">
          <span>Account</span>
          <Link to="/login" onClick={closeMenu} tabIndex={mobileLinkTabIndex}>
            Login
          </Link>
          <Link
            className="elite-public-nav__mobile-start"
            to="/register"
            onClick={closeMenu}
            tabIndex={mobileLinkTabIndex}
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
