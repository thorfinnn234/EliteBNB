import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

/**
 * Renders a discreet homepage-only return control after the visitor has moved
 * beyond the opening scene. It uses native scrolling so route behavior remains
 * simple and accessible.
 */
export default function BackToTopButton() {
  const location = useLocation();
  const prefersReducedMotion = usePrefersReducedMotion();
  const isHomepage = location.pathname === "/";
  const [isVisible, setIsVisible] = useState(false);
  const [isOverFooter, setIsOverFooter] = useState(false);

  useEffect(() => {
    if (!isHomepage) return undefined;

    /**
     * Reveals the control only after the visitor has passed the cinematic
     * opening. The viewport-based threshold keeps the timing natural on phones.
     */
    const updateVisibility = () => {
      const revealThreshold = Math.max(window.innerHeight * 0.95, 720);

      setIsVisible(window.scrollY > revealThreshold);
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);

    return () => {
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, [isHomepage]);

  useEffect(() => {
    if (!isHomepage) return undefined;

    const footer = document.querySelector(".elite-public-footer");

    if (!footer) return undefined;

    /**
     * Adjusts the button surface when it sits over the dark footer so the
     * control remains legible without becoming a loud floating action button.
     */
    const footerObserver = new IntersectionObserver(
      ([entry]) => {
        setIsOverFooter(entry.isIntersecting);
      },
      { rootMargin: "0px 0px -28% 0px" }
    );

    footerObserver.observe(footer);

    return () => {
      footerObserver.disconnect();
    };
  }, [isHomepage]);

  /**
   * Returns the visitor to the top using smooth native scrolling unless their
   * system preference requests reduced motion.
   */
  const handleBackToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });

    /**
     * Long pages can keep native smooth scrolling in progress longer than the
     * focus handoff. This guard finishes at the exact top, then moves focus to
     * the brand link so keyboard users are not left on an invisible button.
     */
    window.setTimeout(
      () => {
        window.scrollTo({ top: 0, behavior: "auto" });
        document.querySelector(".elite-public-nav__brand")?.focus({
          preventScroll: true,
        });
      },
      prefersReducedMotion ? 0 : 950
    );
  };

  if (!isHomepage) return null;

  return (
    <button
      type="button"
      className={`elite-back-to-top ${isVisible ? "is-visible" : ""} ${
        isOverFooter ? "elite-back-to-top--footer" : ""
      }`}
      aria-label="Back to top"
      aria-hidden={!isVisible}
      tabIndex={isVisible ? 0 : -1}
      onClick={handleBackToTop}
    >
      <span className="elite-back-to-top__mark" aria-hidden="true">
        <span />
      </span>
      <span className="elite-back-to-top__label">Back to top</span>
    </button>
  );
}
