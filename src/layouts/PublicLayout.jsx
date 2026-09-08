import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import BackToTopButton from "../components/public/BackToTopButton";
import PublicFooter from "../components/public/PublicFooter";
import PublicNavbar from "../components/public/PublicNavbar";
import "../styles/public.css";

/**
 * Wraps open public routes in the editorial public shell.
 * Role dashboards keep their separate layout/navigation components.
 */
export default function PublicLayout({ children }) {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;

    /**
     * React Router updates the hash without the browser's default anchor jump.
     * This keeps public in-page links useful while accounting for the fixed nav.
     */
    const scrollToHashTarget = window.requestAnimationFrame(() => {
      const target = document.querySelector(location.hash);
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (!target) return;

      const navOffset = 96;
      const targetTop = target.getBoundingClientRect().top + window.scrollY;

      window.scrollTo({
        top: Math.max(targetTop - navOffset, 0),
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    });

    return () => {
      window.cancelAnimationFrame(scrollToHashTarget);
    };
  }, [location.hash]);

  return (
    <div className="elite-public-layout min-h-screen bg-[#FAF9F6]">
      <PublicNavbar />
      {children}
      <PublicFooter />
      <BackToTopButton />
    </div>
  );
}
