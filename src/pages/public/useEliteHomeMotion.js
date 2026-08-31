import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Creates the homepage's scroll storytelling timelines and cleans them up on unmount.
 * The hook is scoped to Home so dashboard/auth pages do not inherit animation work.
 */
export function useEliteHomeMotion(rootRef, prefersReducedMotion) {
  useEffect(() => {
    if (prefersReducedMotion || !rootRef.current) return undefined;

    const context = gsap.context(() => {
      const revealElements = gsap.utils.toArray("[data-home-reveal]");
      const parallaxElements = gsap.utils.toArray("[data-parallax-depth]");
      const isDesktopStory = window.matchMedia("(min-width: 1024px)").matches;
      const isCompactHero = window.matchMedia("(max-width: 700px)").matches;
      const isCompactReveal = window.matchMedia("(max-width: 960px)").matches;

      /**
       * Desktop keeps the booking surface as a cinematic scroll reveal.
       * Mobile renders it immediately below the hero copy so the first frame
       * feels complete and visitors do not wait through a delayed reveal.
       */
      if (isCompactHero) {
        gsap.set(".elite-home__booking-shell", {
          autoAlpha: 1,
          y: 0,
        });
      } else {
        gsap.set(".elite-home__booking-shell", {
          autoAlpha: 0,
          y: 44,
        });
      }

      gsap.to(".elite-home__hero-image", {
        scale: 1.055,
        yPercent: 4,
        ease: "none",
        scrollTrigger: {
          trigger: ".elite-home__hero",
          start: "top top",
          end: "78% top",
          scrub: true,
        },
      });

      gsap.to(".elite-home__hero-copy", {
        autoAlpha: 0.62,
        yPercent: -10,
        ease: "none",
        scrollTrigger: {
          trigger: ".elite-home__hero",
          start: "top top",
          end: "62% top",
          scrub: true,
        },
      });

      if (!isCompactHero) {
        gsap.to(".elite-home__booking-shell", {
          autoAlpha: 1,
          y: 0,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".elite-home__hero",
            start: "14% top",
            end: "42% top",
            scrub: true,
          },
        });
      }

      revealElements.forEach((element) => {
        gsap.from(element, {
          autoAlpha: 0,
          duration: isCompactReveal ? 0.52 : 0.68,
          ease: "power3.out",
          y: isCompactReveal ? 16 : 22,
          scrollTrigger: {
            trigger: element,
            start: isCompactReveal ? "top 92%" : "top 88%",
          },
        });
      });

      parallaxElements.forEach((element) => {
        const depth = Number(element.dataset.parallaxDepth || 1);

        gsap.to(element, {
          yPercent: -9 * depth,
          ease: "none",
          scrollTrigger: {
            trigger: element,
            start: "top 94%",
            end: "bottom 12%",
            scrub: true,
          },
        });
      });

      /**
       * The Idea uses the ELITEBNB word itself as the first image window.
       * The timeline is intentionally unpinned and short so scroll progress
       * reveals the larger photograph without creating another long hold.
       */
      gsap.set(".elite-home__idea-photo", {
        autoAlpha: 0.24,
        clipPath: "inset(38% 16% 38% 16%)",
        scale: 0.92,
      });

      gsap.set(".elite-home__idea-copy", {
        autoAlpha: 0,
        y: 24,
      });

      const ideaTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: ".elite-home__idea",
          start: "top 82%",
          end: "bottom 34%",
          scrub: true,
        },
      });

      ideaTimeline
        .to(".elite-home__idea-word", { backgroundPosition: "50% 62%", scale: 0.86 }, 0)
        .to(
          ".elite-home__idea-photo",
          { autoAlpha: 1, clipPath: "inset(0% 0% 0% 0%)", scale: 1 },
          0.16
        )
        .to(".elite-home__idea-word", { autoAlpha: 0.18 }, 0.42)
        .to(".elite-home__idea-copy", { autoAlpha: 1, y: 0 }, 0.34);

      if (isDesktopStory) {
        gsap.set(".elite-home__daynight-beat", {
          autoAlpha: 0,
          y: 22,
        });

        const dayNightTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: ".elite-home__daynight",
            start: "top top",
            end: "+=86%",
            scrub: true,
            pin: true,
          },
        });

        dayNightTimeline
          .to(".elite-home__daynight-evening", { autoAlpha: 0.42, duration: 0.2 }, 0.12)
          .to(".elite-home__daynight-beat", { autoAlpha: 1, y: 0, duration: 0.16 }, 0.22)
          .to(
            ".elite-home__daynight-copy--morning",
            { autoAlpha: 0, y: -30, duration: 0.18 },
            0.32
          )
          .to(".elite-home__daynight-evening", { autoAlpha: 1, duration: 0.22 }, 0.46)
          .to(".elite-home__daynight-morning", { autoAlpha: 0, duration: 0.2 }, 0.5)
          .to(".elite-home__daynight-beat", { autoAlpha: 0, y: -18, duration: 0.14 }, 0.52)
          .to(
            ".elite-home__daynight-copy--evening",
            { autoAlpha: 1, y: 0, duration: 0.18 },
            0.6
          );

        gsap.set(".elite-home__escape-caption", {
          autoAlpha: 0,
          y: 12,
        });

        gsap.set(".elite-home__escape-copy--second", {
          autoAlpha: 0,
          y: 34,
        });

        gsap.set(
          ".elite-home__escape-photo--nine, .elite-home__escape-photo--ten, .elite-home__escape-photo--eleven, .elite-home__escape-photo--twelve, .elite-home__escape-photo--thirteen",
          {
            autoAlpha: 0,
            scale: 0.92,
          }
        );

        const escapeTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: ".elite-home__escape",
            start: "top top",
            end: "+=105%",
            scrub: true,
            pin: true,
          },
        });

        escapeTimeline
          .to(".elite-home__escape-photo--one", { xPercent: -4, yPercent: -20, scale: 1.08, duration: 1 }, 0)
          .to(".elite-home__escape-photo--two", { xPercent: 16, yPercent: 10, scale: 0.96, duration: 1 }, 0)
          .to(".elite-home__escape-photo--three", { xPercent: -16, yPercent: -12, scale: 1.04, duration: 1 }, 0)
          .to(".elite-home__escape-photo--four", { xPercent: 10, yPercent: 20, scale: 1.12, duration: 1 }, 0)
          .to(".elite-home__escape-photo--five", { xPercent: -18, yPercent: -18, scale: 0.94, duration: 1 }, 0)
          .to(".elite-home__escape-photo--six", { xPercent: 22, yPercent: 14, scale: 1.03, duration: 1 }, 0)
          .to(".elite-home__escape-photo--seven", { xPercent: -10, yPercent: 20, scale: 1.08, duration: 1 }, 0)
          .to(".elite-home__escape-photo--eight", { xPercent: 10, yPercent: -16, scale: 0.96, duration: 1 }, 0)
          .to(".elite-home__escape-photo--nine", { autoAlpha: 0.92, xPercent: -12, yPercent: -14, scale: 1.02, duration: 0.26 }, 0.16)
          .to(".elite-home__escape-photo--ten", { autoAlpha: 0.82, xPercent: 14, yPercent: 12, scale: 1, duration: 0.26 }, 0.26)
          .to(".elite-home__escape-photo--eleven", { autoAlpha: 0.56, xPercent: -10, yPercent: 16, scale: 0.98, duration: 0.24 }, 0.34)
          .to(".elite-home__escape-photo--twelve", { autoAlpha: 0.72, xPercent: 12, yPercent: -12, scale: 1, duration: 0.24 }, 0.46)
          .to(".elite-home__escape-photo--thirteen", { autoAlpha: 0.8, xPercent: -8, yPercent: -18, scale: 1.03, duration: 0.24 }, 0.56)
          .to(".elite-home__escape-photo--one .elite-home__escape-caption", { autoAlpha: 1, y: 0, duration: 0.16 }, 0.1)
          .to(".elite-home__escape-photo--two .elite-home__escape-caption", { autoAlpha: 1, y: 0, duration: 0.16 }, 0.22)
          .to(".elite-home__escape-photo--nine .elite-home__escape-caption", { autoAlpha: 1, y: 0, duration: 0.14 }, 0.3)
          .to(".elite-home__escape-photo--three .elite-home__escape-caption", { autoAlpha: 1, y: 0, duration: 0.16 }, 0.36)
          .to(".elite-home__escape-photo--five .elite-home__escape-caption", { autoAlpha: 1, y: 0, duration: 0.16 }, 0.43)
          .to(".elite-home__escape-photo--eleven .elite-home__escape-caption", { autoAlpha: 1, y: 0, duration: 0.14 }, 0.46)
          .to(".elite-home__escape-copy--first", { autoAlpha: 0, y: -34, duration: 0.16 }, 0.48)
          .to(".elite-home__escape-photo--one", { autoAlpha: 0.58, xPercent: -14, yPercent: -34 }, 0.52)
          .to(".elite-home__escape-photo--two", { autoAlpha: 0.7, xPercent: 24, yPercent: 18 }, 0.52)
          .to(".elite-home__escape-photo--three", { autoAlpha: 0.5, xPercent: -24, yPercent: -18 }, 0.56)
          .to(".elite-home__escape-photo--five", { autoAlpha: 0.46, xPercent: -28, yPercent: -28 }, 0.54)
          .to(".elite-home__escape-photo--six", { autoAlpha: 0.64, xPercent: 28, yPercent: 24 }, 0.56)
          .to(".elite-home__escape-photo--seven", { autoAlpha: 0.42, xPercent: -18, yPercent: 30 }, 0.58)
          .to(".elite-home__escape-photo--eight", { autoAlpha: 0.56, xPercent: 20, yPercent: -26 }, 0.58)
          .to(".elite-home__escape-photo--nine", { autoAlpha: 0.52, xPercent: -20, yPercent: -28 }, 0.58)
          .to(".elite-home__escape-photo--ten", { autoAlpha: 0.62, xPercent: 22, yPercent: 24 }, 0.6)
          .to(".elite-home__escape-photo--eleven", { autoAlpha: 0.44, xPercent: -18, yPercent: 28 }, 0.62)
          .to(".elite-home__escape-photo--twelve", { autoAlpha: 0.56, xPercent: 20, yPercent: -24 }, 0.62)
          .to(".elite-home__escape-photo--thirteen", { autoAlpha: 0.48, xPercent: -18, yPercent: -30 }, 0.64)
          .to(".elite-home__escape-photo--four .elite-home__escape-caption", { autoAlpha: 1, y: 0, duration: 0.16 }, 0.58)
          .to(".elite-home__escape-photo--seven .elite-home__escape-caption", { autoAlpha: 1, y: 0, duration: 0.16 }, 0.6)
          .to(".elite-home__escape-photo--thirteen .elite-home__escape-caption", { autoAlpha: 1, y: 0, duration: 0.14 }, 0.62)
          .to(".elite-home__escape-copy--second", { autoAlpha: 1, y: 0, duration: 0.18 }, 0.64);
      }
    }, rootRef);

    ScrollTrigger.refresh();

    return () => {
      context.revert();
    };
  }, [prefersReducedMotion, rootRef]);
}
