import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import BookingSearchBar from "../../components/public/BookingSearchBar";
import DestinationPanel from "../../components/public/DestinationPanel";
import EditorialHeading from "../../components/public/EditorialHeading";
import EliteLogo from "../../components/public/EliteLogo";
import PropertyCard from "../../components/public/PropertyCard";
import {
  curationPrinciples,
  curatedProperties,
  destinations,
  escapeImages,
  homepageImages,
  lifestyleMoments,
  spotlightStay,
} from "../../data/homepageContent";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import "./Home.css";
import { useEliteHomeMotion } from "./useEliteHomeMotion";

const escapePositionClasses = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
];

/**
 * Determines whether the short branded entrance should run for this tab.
 * Session storage keeps returning visitors from seeing the same intro repeatedly.
 */
function shouldShowIntro() {
  if (typeof window === "undefined") return false;

  return window.sessionStorage.getItem("elitebnb-home-intro-seen") !== "true";
}

/**
 * Shows the brief architectural brand reveal before the homepage settles in.
 * It uses the official standalone mark with a clipped reveal to suggest assembly.
 */
function IntroLoader({ visible, exiting, prefersReducedMotion }) {
  if (!visible) return null;

  return (
    <div
      className={`elite-home__intro ${exiting ? "is-exiting" : ""}`}
      aria-live="polite"
      aria-label="Loading EliteBNB"
    >
      <EliteLogo
        variant="mark"
        className="elite-home__intro-ghost"
        label=""
      />
      <div className="elite-home__intro-mark">
        <EliteLogo variant="mark" />
        <p>PREMIUM STAYS. ELEVATED.</p>
      </div>
      <div className="elite-home__intro-guides" aria-hidden="true">
        <span />
        <span />
      </div>
      <span
        className={`elite-home__intro-line ${
          prefersReducedMotion ? "is-static" : ""
        }`}
        aria-hidden="true"
      />
    </div>
  );
}

/**
 * Opens the homepage with one cinematic property image, editorial type and search.
 * The booking interface is visible content and gains motion only when JS allows it.
 */
function HeroScene() {
  return (
    <section className="elite-home__hero" aria-label="EliteBNB homepage introduction">
      <div className="elite-home__hero-media" aria-hidden="true">
        <img
          className="elite-home__hero-image"
          src={homepageImages.heroVillaSunset}
          alt=""
          fetchPriority="high"
        />
        <div className="elite-home__hero-shade" />
      </div>

      <div className="elite-home__hero-copy">
        <p className="elite-home__hero-brand-word" aria-hidden="true">
          ELITEBNB
        </p>
        <p className="elite-section-eyebrow elite-section-eyebrow--light">
          EliteBNB presents
        </p>
        <h1>
          Stay beyond
          <span>ordinary.</span>
        </h1>
        <p className="elite-home__hero-support">
          Private homes, architectural retreats and considered hospitality for
          travellers who choose the place as carefully as the journey.
        </p>
        <div className="elite-home__hero-meta" aria-label="EliteBNB stay highlights">
          <span>Architectural homes</span>
          <span>Verified hosts</span>
          <span>Private arrivals</span>
        </div>
      </div>

      <div className="elite-home__booking-shell">
        <BookingSearchBar />
      </div>

      <div className="elite-home__scroll-cue" aria-hidden="true">
        <span />
        Scroll
      </div>
    </section>
  );
}

/**
 * Turns the opening image-led mood into an editorial magazine composition.
 * Overlapping imagery creates depth without becoming a standard listing grid.
 */
function EditorialPropertyScene() {
  return (
    <section className="elite-home__scene elite-home__editorial" data-home-reveal>
      <div className="elite-home__editorial-copy">
        <EditorialHeading
          eyebrow="HANDPICKED RESIDENCES"
          title={
            <>
              Places worth
              <br />
              travelling for.
            </>
          }
        >
          <p>
            Handpicked stays defined by extraordinary design, remarkable
            locations and experiences that linger long after checkout.
          </p>
        </EditorialHeading>

        <div className="elite-home__spotlight-meta">
          <p>{spotlightStay.location}</p>
          <h3>{spotlightStay.name}</h3>
          <span>{spotlightStay.price}</span>
          <Link to="/property/1">
            Explore stay
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="elite-home__editorial-images">
        <figure
          className="elite-home__editorial-image elite-home__editorial-image--large"
          data-parallax-depth="0.7"
        >
          <img
            src={homepageImages.editorialOceanVilla}
            alt={spotlightStay.imageAlt}
            loading="lazy"
          />
        </figure>
        <figure
          className="elite-home__editorial-image elite-home__editorial-image--small"
          data-parallax-depth="1.25"
        >
          <img
            src={homepageImages.editorialNightPool}
            alt="Private villa pool glowing warmly at night"
            loading="lazy"
          />
        </figure>
      </div>
    </section>
  );
}

/**
 * Reveals the EliteBNB idea through a wordmark-shaped image mask.
 * The static markup remains readable when ScrollTrigger or motion is disabled.
 */
function PhilosophyScene() {
  return (
    <section
      className="elite-home__philosophy elite-home__idea"
      data-idea-scene
      style={{ "--idea-image": `url(${homepageImages.editorialOceanVilla})` }}
    >
      <div className="elite-home__idea-word-wrap" aria-hidden="true">
        <span className="elite-home__idea-word">ELITEBNB</span>
      </div>

      <figure className="elite-home__idea-photo">
        <img
          src={homepageImages.editorialOceanVilla}
          alt="Oceanview architectural villa opening toward an infinity pool"
          loading="lazy"
        />
      </figure>

      <div className="elite-home__idea-copy">
        <p className="elite-section-eyebrow">THE IDEA</p>
        <h2>
          Exceptional places
          <span>should feel exceptional.</span>
        </h2>
        <p>
          Before you even arrive, the architecture should announce its care in
          the light, the proportions and the first quiet seconds after the door
          opens.
        </p>
      </div>
    </section>
  );
}

/**
 * Introduces destination discovery through large image panels instead of cards.
 * Hover expansion is progressive; mobile users get all content immediately.
 */
function DestinationsScene() {
  return (
    <section id="destinations" className="elite-home__scene elite-home__destinations">
      <div data-home-reveal>
        <EditorialHeading
          eyebrow="DESTINATIONS"
          title="Choose the atmosphere first."
          className="elite-home__destinations-heading"
        >
          <p>
            From Lagos waterfront energy to whitewashed island silence, EliteBNB
            starts with how a place should feel.
          </p>
        </EditorialHeading>
      </div>

      <div className="elite-home__destination-panels" data-home-reveal>
        {destinations.map((destination) => (
          <DestinationPanel key={destination.name} destination={destination} />
        ))}
      </div>
    </section>
  );
}

/**
 * Uses a pinned crossfade to show how one stay can change from morning to night.
 * On reduced motion this scene becomes a static two-state editorial composition.
 */
function DayNightScene() {
  return (
    <section className="elite-home__daynight" aria-label="Day to night stay story">
      <div className="elite-home__daynight-media">
        <img
          className="elite-home__daynight-morning"
          src={homepageImages.editorialOceanVilla}
          alt="Oceanview villa and infinity pool in warm daylight"
          loading="lazy"
        />
        <img
          className="elite-home__daynight-evening"
          src={homepageImages.editorialNightPool}
          alt="Private villa pool and architecture glowing after dark"
          loading="lazy"
        />
      </div>

      <div className="elite-home__daynight-copy elite-home__daynight-copy--morning">
        <span className="elite-home__daynight-time">06:42</span>
        <p className="elite-home__daynight-kicker">VICTORIA ISLAND · LAGOS</p>
        <p className="elite-home__daynight-name">Azure House</p>
        <h2>
          Wake up
          <br />
          above it all.
        </h2>
        <p className="elite-home__daynight-line">
          Sunlight reaches the water before the city fully wakes.
        </p>
        <div className="elite-home__daynight-details" aria-label="Morning stay details">
          <span>4 guests</span>
          <span>Infinity pool</span>
          <span>Private terrace</span>
        </div>
        <p className="elite-home__daynight-price">From ₦185,000 / night</p>
        <Link to="/property/1" className="elite-home__daynight-link">
          View residence
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>

      <p className="elite-home__daynight-beat">
        Same address.
        <span>Different tempo.</span>
      </p>

      <div className="elite-home__daynight-copy elite-home__daynight-copy--evening">
        <span className="elite-home__daynight-time">20:18</span>
        <p className="elite-home__daynight-kicker">VICTORIA ISLAND · LAGOS</p>
        <p className="elite-home__daynight-name">Azure House</p>
        <h2>
          Stay long
          <br />
          after dark.
        </h2>
        <p className="elite-home__daynight-line">
          The same residence turns cinematic once the skyline begins to glow.
        </p>
        <div className="elite-home__daynight-details" aria-label="Evening stay details">
          <span>Evening swim</span>
          <span>Skyline terrace</span>
          <span>Private arrival</span>
        </div>
        <p className="elite-home__daynight-price">From ₦185,000 / night</p>
        <Link to="/property/1" className="elite-home__daynight-link">
          View residence
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

/**
 * Establishes the first reusable EliteBNB property-card language.
 * These are presentation-only mock listings until backend search data is wired.
 */
function CuratedScene() {
  return (
    <section className="elite-home__scene elite-home__curated">
      <div data-home-reveal>
        <EditorialHeading eyebrow="CURATED STAYS" title="Curated for you">
          <p>
            A first glimpse of the listing language: fewer borders, larger
            photography, direct details and clear booking intent.
          </p>
        </EditorialHeading>
      </div>

      <div className="elite-home__property-grid" data-home-reveal>
        {curatedProperties.map((property) => (
          <PropertyCard key={property.id} {...property} />
        ))}
      </div>
    </section>
  );
}

/**
 * Frames curation as a premium promise rather than a feature checklist.
 * The three principles are text-led to keep the page from becoming icon-heavy.
 */
function StandardScene() {
  return (
    <section id="standard" className="elite-home__standard" data-home-reveal>
      <p className="elite-section-eyebrow">THE ELITEBNB STANDARD</p>
      <h2>
        Not every beautiful
        <span>place belongs here.</span>
      </h2>

      <div className="elite-home__principles">
        {curationPrinciples.map((principle) => (
          <article key={principle.number}>
            <span>{principle.number}</span>
            <h3>{principle.title}</h3>
            <p>{principle.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

/**
 * Creates the signature floating-photo parallax moment around the central idea.
 * The CTA remains a normal link so the scene stays usable without animation.
 */
function EscapeScene() {
  return (
    <section className="elite-home__escape" aria-label="Find your kind of escape">
      <div className="elite-home__escape-stage">
        {escapeImages.map((image, index) => (
          <figure
            key={image.alt}
            className={`elite-home__escape-photo elite-home__escape-photo--${
              escapePositionClasses[index]
            }`}
          >
            <img src={image.src} alt={image.alt} loading="lazy" />
            {image.caption ? (
              <figcaption className="elite-home__escape-caption">
                {image.caption}
              </figcaption>
            ) : null}
          </figure>
        ))}

        <div className="elite-home__escape-copy elite-home__escape-copy--first">
          <p className="elite-section-eyebrow">YOUR KIND OF ESCAPE</p>
          <h2>
            Find your
            <span>kind of escape.</span>
          </h2>
        </div>

        <div className="elite-home__escape-copy elite-home__escape-copy--second">
          <p className="elite-section-eyebrow">MAKE IT YOURS</p>
          <h2>
            Then make it
            <span>yours.</span>
          </h2>
          <Link to="/search">
            Explore all stays
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/**
 * Shifts the page from architecture into human hospitality and unplanned moments.
 * The imagery is warmer and more tactile than the property-led opening scenes.
 */
function LifestyleScene() {
  return (
    <section className="elite-home__scene elite-home__lifestyle">
      <div className="elite-home__lifestyle-copy" data-home-reveal>
        <p className="elite-section-eyebrow">THE BEST PART OF TRAVEL</p>
        <h2>
          The moments
          <span>you didn't plan.</span>
        </h2>
        <p>
          Morning curtains, a table set before you ask, a pool still warm after
          the day cools. The stay is only the beginning.
        </p>
      </div>

      <div className="elite-home__lifestyle-gallery">
        {lifestyleMoments.map((moment, index) => (
          <figure
            key={moment.label}
            className={`elite-home__lifestyle-frame elite-home__lifestyle-frame--${index + 1}`}
            data-parallax-depth={index === 1 ? "1.15" : "0.72"}
          >
            <img src={moment.src} alt={moment.alt} loading="lazy" />
            <figcaption>{moment.label}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/**
 * Presents social proof as one quiet editorial quote instead of a busy carousel.
 */
function TestimonialScene() {
  return (
    <section className="elite-home__testimonial" data-home-reveal>
      <p>4.9 average guest rating</p>
      <blockquote>
        “We booked the house for the view. We remember everything else.”
      </blockquote>
      <cite>Amara O. · The Glass House, Ikoyi</cite>
    </section>
  );
}

/**
 * Returns to a cinematic navy frame and repeats the search interaction as a callback.
 */
function ClosingCtaScene() {
  return (
    <section className="elite-home__closing">
      <img
        src={homepageImages.editorialNightPool}
        alt="Luxury villa glowing beside a private pool at night"
        loading="lazy"
      />
      <div className="elite-home__closing-shade" />
      <div className="elite-home__closing-content" data-home-reveal>
        <p className="elite-section-eyebrow elite-section-eyebrow--light">
          YOUR NEXT STAY
        </p>
        <h2>
          Somewhere extraordinary
          <span>is waiting.</span>
        </h2>
        <Link to="/search" className="elite-home__closing-link">
          Find your stay
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
        <BookingSearchBar compact label="Search for your next EliteBNB stay" />
      </div>
    </section>
  );
}

/**
 * Composes the first complete public homepage iteration for EliteBNB.
 * It keeps all role/auth architecture intact and owns only the public landing route.
 */
export default function Home() {
  const homeRef = useRef(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [showIntro, setShowIntro] = useState(shouldShowIntro);
  const [introExiting, setIntroExiting] = useState(false);

  useEliteHomeMotion(homeRef, prefersReducedMotion);

  useEffect(() => {
    if (!showIntro) return undefined;

    const introHoldDuration = prefersReducedMotion ? 260 : 2040;
    const introExitDuration = prefersReducedMotion ? 1 : 420;
    const holdTimer = window.setTimeout(() => {
      setIntroExiting(true);
    }, introHoldDuration);
    const exitTimer = window.setTimeout(() => {
      window.sessionStorage.setItem("elitebnb-home-intro-seen", "true");
      setShowIntro(false);
    }, introHoldDuration + introExitDuration);

    return () => {
      window.clearTimeout(holdTimer);
      window.clearTimeout(exitTimer);
    };
  }, [prefersReducedMotion, showIntro]);

  return (
    <>
      <IntroLoader
        visible={showIntro}
        exiting={introExiting}
        prefersReducedMotion={prefersReducedMotion}
      />
      <main
        ref={homeRef}
        className={`elite-home ${showIntro ? "elite-home--intro-active" : "elite-home--ready"}`}
      >
        <HeroScene />
        <EditorialPropertyScene />
        <PhilosophyScene />
        <DestinationsScene />
        <DayNightScene />
        <CuratedScene />
        <StandardScene />
        <EscapeScene />
        <LifestyleScene />
        <TestimonialScene />
        <ClosingCtaScene />
      </main>
    </>
  );
}
