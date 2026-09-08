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

    const cleanupTasks = [];

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

      }

      if (isDesktopStory) {
        const stateAPhotos =
          ".elite-home__escape-photo--one, .elite-home__escape-photo--two, .elite-home__escape-photo--three, .elite-home__escape-photo--four, .elite-home__escape-photo--five, .elite-home__escape-photo--six, .elite-home__escape-photo--seven, .elite-home__escape-photo--eight";
        const stateBPhotos =
          ".elite-home__escape-photo--nine, .elite-home__escape-photo--ten, .elite-home__escape-photo--eleven, .elite-home__escape-photo--twelve, .elite-home__escape-photo--thirteen";
        const stateACaptions =
          ".elite-home__escape-photo--one .elite-home__escape-caption, .elite-home__escape-photo--two .elite-home__escape-caption, .elite-home__escape-photo--three .elite-home__escape-caption, .elite-home__escape-photo--five .elite-home__escape-caption";
        const stateBCaptions =
          ".elite-home__escape-photo--four .elite-home__escape-caption, .elite-home__escape-photo--seven .elite-home__escape-caption, .elite-home__escape-photo--nine .elite-home__escape-caption, .elite-home__escape-photo--thirteen .elite-home__escape-caption";

        gsap.set(stateAPhotos, {
          autoAlpha: 1,
          scale: 1,
          x: 0,
          xPercent: 0,
          y: 0,
          yPercent: 0,
        });

        gsap.set(stateBPhotos, {
          autoAlpha: 0,
          scale: 0.92,
          xPercent: 0,
          yPercent: 0,
        });

        gsap.set(".elite-home__escape-caption", {
          autoAlpha: 0,
          y: 12,
        });

        gsap.set(".elite-home__escape-copy--first", {
          autoAlpha: 1,
          y: 0,
        });

        gsap.set(".elite-home__escape-copy--second", {
          autoAlpha: 0,
          y: 12,
        });

        /**
         * The escape scene keeps normal page scrolling by pairing a CSS sticky
         * stage with manual progress mapping instead of a ScrollTrigger pin.
         * The old animation's useful image choreography is retained, while
         * scroll progress is measured from the section's real document position
         * so earlier pinned sections cannot make this timeline start too soon.
         */
        const escapeTimeline = gsap.timeline({ paused: true });

        escapeTimeline
          .fromTo(
            stateAPhotos,
            { autoAlpha: 0.92, y: 18, scale: 0.985 },
            {
              autoAlpha: 1,
              duration: 0.18,
              ease: "power2.out",
              stagger: 0.012,
              y: 0,
              scale: 1,
            },
            0
          )
          .to(stateACaptions, { autoAlpha: 1, duration: 0.12, stagger: 0.025, y: 0 }, 0.1)
          .to(
            ".elite-home__escape-photo--one",
            { duration: 0.4, ease: "power1.inOut", scale: 1.08, xPercent: -4, yPercent: -20 },
            0.2
          )
          .to(
            ".elite-home__escape-photo--two",
            { duration: 0.4, ease: "power1.inOut", scale: 0.96, xPercent: 16, yPercent: 10 },
            0.2
          )
          .to(
            ".elite-home__escape-photo--three",
            { duration: 0.4, ease: "power1.inOut", scale: 1.04, xPercent: -16, yPercent: -12 },
            0.2
          )
          .to(
            ".elite-home__escape-photo--four",
            { duration: 0.42, ease: "power1.inOut", scale: 1.12, xPercent: 10, yPercent: 20 },
            0.2
          )
          .to(
            ".elite-home__escape-photo--five",
            { duration: 0.4, ease: "power1.inOut", scale: 0.94, xPercent: -18, yPercent: -18 },
            0.2
          )
          .to(
            ".elite-home__escape-photo--six",
            { duration: 0.4, ease: "power1.inOut", scale: 1.03, xPercent: 22, yPercent: 14 },
            0.2
          )
          .to(
            ".elite-home__escape-photo--seven",
            { duration: 0.4, ease: "power1.inOut", scale: 1.08, xPercent: -10, yPercent: 20 },
            0.2
          )
          .to(
            ".elite-home__escape-photo--eight",
            { duration: 0.4, ease: "power1.inOut", scale: 0.96, xPercent: 10, yPercent: -16 },
            0.2
          )
          .fromTo(
            ".elite-home__escape-photo--nine",
            { autoAlpha: 0, scale: 0.92, xPercent: -4, yPercent: 10 },
            { autoAlpha: 0.9, duration: 0.22, ease: "power2.out", scale: 1.02, xPercent: -12, yPercent: -14 },
            0.3
          )
          .fromTo(
            ".elite-home__escape-photo--ten",
            { autoAlpha: 0, scale: 0.92, xPercent: 8, yPercent: -4 },
            { autoAlpha: 0.82, duration: 0.22, ease: "power2.out", scale: 1, xPercent: 14, yPercent: 12 },
            0.36
          )
          .fromTo(
            ".elite-home__escape-photo--eleven",
            { autoAlpha: 0, scale: 0.92, xPercent: -6, yPercent: 6 },
            { autoAlpha: 0.56, duration: 0.2, ease: "power2.out", scale: 0.98, xPercent: -10, yPercent: 16 },
            0.42
          )
          .fromTo(
            ".elite-home__escape-photo--twelve",
            { autoAlpha: 0, scale: 0.92, xPercent: 4, yPercent: 8 },
            { autoAlpha: 0.72, duration: 0.22, ease: "power2.out", scale: 1, xPercent: 12, yPercent: -12 },
            0.48
          )
          .fromTo(
            ".elite-home__escape-photo--thirteen",
            { autoAlpha: 0, scale: 0.92, xPercent: -4, yPercent: 12 },
            { autoAlpha: 0.8, duration: 0.22, ease: "power2.out", scale: 1.03, xPercent: -8, yPercent: -18 },
            0.54
          )
          .to(
            ".elite-home__escape-copy--first",
            { autoAlpha: 0, duration: 0.14, ease: "power1.inOut", y: -34 },
            0.47
          )
          .to(stateACaptions, { autoAlpha: 0.32, duration: 0.16, ease: "power1.inOut", y: -6 }, 0.5)
          .to(
            ".elite-home__escape-photo--one",
            { autoAlpha: 0.58, duration: 0.28, ease: "power1.inOut", scale: 1.04, xPercent: -14, yPercent: -34 },
            0.56
          )
          .to(
            ".elite-home__escape-photo--two",
            { autoAlpha: 0.7, duration: 0.28, ease: "power1.inOut", scale: 0.95, xPercent: 24, yPercent: 18 },
            0.56
          )
          .to(
            ".elite-home__escape-photo--three",
            { autoAlpha: 0.5, duration: 0.28, ease: "power1.inOut", scale: 0.98, xPercent: -24, yPercent: -18 },
            0.58
          )
          .to(
            ".elite-home__escape-photo--five",
            { autoAlpha: 0.46, duration: 0.28, ease: "power1.inOut", scale: 0.94, xPercent: -28, yPercent: -28 },
            0.58
          )
          .to(
            ".elite-home__escape-photo--six",
            { autoAlpha: 0.64, duration: 0.28, ease: "power1.inOut", scale: 1.03, xPercent: 28, yPercent: 24 },
            0.58
          )
          .to(
            ".elite-home__escape-photo--seven",
            { autoAlpha: 0.42, duration: 0.28, ease: "power1.inOut", scale: 1.08, xPercent: -18, yPercent: 30 },
            0.6
          )
          .to(
            ".elite-home__escape-photo--eight",
            { autoAlpha: 0.56, duration: 0.28, ease: "power1.inOut", scale: 0.96, xPercent: 20, yPercent: -26 },
            0.6
          )
          .to(
            ".elite-home__escape-photo--nine",
            { autoAlpha: 0.52, duration: 0.24, ease: "power1.inOut", scale: 1.02, xPercent: -20, yPercent: -28 },
            0.62
          )
          .to(
            ".elite-home__escape-photo--ten",
            { autoAlpha: 0.62, duration: 0.24, ease: "power1.inOut", scale: 1, xPercent: 22, yPercent: 24 },
            0.62
          )
          .to(
            ".elite-home__escape-photo--eleven",
            { autoAlpha: 0.44, duration: 0.24, ease: "power1.inOut", scale: 0.98, xPercent: -18, yPercent: 28 },
            0.64
          )
          .to(
            ".elite-home__escape-photo--twelve",
            { autoAlpha: 0.56, duration: 0.24, ease: "power1.inOut", scale: 1, xPercent: 20, yPercent: -24 },
            0.64
          )
          .to(
            ".elite-home__escape-photo--thirteen",
            { autoAlpha: 0.72, duration: 0.24, ease: "power1.inOut", scale: 1.03, xPercent: -18, yPercent: -30 },
            0.66
          )
          .to(stateBCaptions, { autoAlpha: 1, duration: 0.16, stagger: 0.025, y: 0 }, 0.66)
          .to(
            ".elite-home__escape-copy--second",
            { autoAlpha: 1, duration: 0.18, ease: "power1.inOut", y: 0 },
            0.68
          )
          .to(".elite-home__escape-copy--second", { autoAlpha: 1, duration: 0.14 }, 0.86);

        const escapeSection = rootRef.current.querySelector(".elite-home__escape");
        const clampEscapeProgress = gsap.utils.clamp(0, 1);
        const tweenEscapeProgress = gsap.quickTo(escapeTimeline, "progress", {
          duration: 0.32,
          ease: "power2.out",
        });
        let escapeStart = 0;
        let escapeEnd = 1;
        let escapeFrame = null;

        /**
         * Re-measures the real scroll span for the normal-flow sticky section.
         * The timeline starts just before the stage reaches the top of the
         * viewport, then completes before the sticky hold ends so State B has
         * room to breathe before the next section appears.
         */
        const measureEscapeProgress = () => {
          if (!escapeSection) return;

          const sectionTop = escapeSection.getBoundingClientRect().top + window.scrollY;
          const sectionScrollDistance = Math.max(
            window.innerHeight * 0.9,
            escapeSection.offsetHeight - window.innerHeight
          );

          escapeStart = sectionTop - window.innerHeight * 0.08;
          escapeEnd = sectionTop + sectionScrollDistance * 0.92;
        };

        /**
         * Maps natural scroll position to the paused GSAP timeline. The direct
         * timeline progress gives this section a visible State A to State B
         * transformation without continuous React state updates or pin spacers.
         */
        const updateEscapeProgress = (immediate = false) => {
          if (!escapeSection) return;

          const scrollSpan = Math.max(1, escapeEnd - escapeStart);
          const progress = clampEscapeProgress((window.scrollY - escapeStart) / scrollSpan);

          if (immediate) {
            escapeTimeline.progress(progress);
            return;
          }

          tweenEscapeProgress(progress);
        };

        /**
         * Scroll events only request one animation-frame update at a time. That
         * keeps the browser from doing repeated measurements while preserving
         * the smooth scrubbed feeling of the old collage transition.
         */
        const requestEscapeProgressUpdate = () => {
          if (escapeFrame !== null) return;

          escapeFrame = window.requestAnimationFrame(() => {
            escapeFrame = null;
            updateEscapeProgress();
          });
        };

        /**
         * Viewport changes can alter sticky height and section position, so the
         * progress range is refreshed immediately instead of waiting for scroll.
         */
        const handleEscapeViewportChange = () => {
          measureEscapeProgress();
          updateEscapeProgress(true);
        };

        const initialEscapeFrame = window.requestAnimationFrame(handleEscapeViewportChange);

        window.addEventListener("scroll", requestEscapeProgressUpdate, { passive: true });
        window.addEventListener("resize", handleEscapeViewportChange);
        window.addEventListener("orientationchange", handleEscapeViewportChange);
        window.addEventListener("load", handleEscapeViewportChange);

        cleanupTasks.push(() => {
          window.cancelAnimationFrame(initialEscapeFrame);

          if (escapeFrame !== null) {
            window.cancelAnimationFrame(escapeFrame);
          }

          window.removeEventListener("scroll", requestEscapeProgressUpdate);
          window.removeEventListener("resize", handleEscapeViewportChange);
          window.removeEventListener("orientationchange", handleEscapeViewportChange);
          window.removeEventListener("load", handleEscapeViewportChange);
        });
      }

    }, rootRef);

    ScrollTrigger.refresh();

    return () => {
      cleanupTasks.forEach((cleanupTask) => cleanupTask());
      context.revert();
    };
  }, [prefersReducedMotion, rootRef]);
}
