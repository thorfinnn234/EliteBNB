import { useEffect, useState } from "react";

/**
 * Tracks the user's reduced-motion preference for animation-heavy scenes.
 * Components use the returned boolean to skip scroll timelines when appropriate.
 */
export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;

    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    /**
     * Updates React state only when the operating-system preference changes.
     */
    const handlePreferenceChange = (event) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handlePreferenceChange);

    return () => {
      mediaQuery.removeEventListener("change", handlePreferenceChange);
    };
  }, []);

  return prefersReducedMotion;
}
