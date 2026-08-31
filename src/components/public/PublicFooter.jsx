import { Link } from "react-router-dom";
import EliteLogo from "./EliteLogo";

const footerGroups = [
  {
    title: "Explore",
    links: [
      { label: "All stays", to: "/search" },
      { label: "Destinations", to: "/#destinations" },
      { label: "Collections", to: "/search" },
    ],
  },
  {
    title: "Destinations",
    links: [
      { label: "Lagos", to: "/search?where=Lagos" },
      { label: "Abuja", to: "/search?where=Abuja" },
      { label: "Cape Town", to: "/search?where=Cape%20Town" },
    ],
  },
  {
    title: "Hosting",
    links: [
      { label: "Become a host", to: "/register" },
      { label: "Standards", to: "/#standard" },
      { label: "Host dashboard", to: "/host/dashboard" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Help center", to: "/search" },
      { label: "Trust", to: "/#standard" },
      { label: "Policies", to: "/search" },
    ],
  },
];

const footerUtilityLinks = [
  { label: "Privacy", to: "/search" },
  { label: "Terms", to: "/search" },
  { label: "Support", to: "/search" },
];

/**
 * Closes the public experience with a cinematic brand frame and practical links.
 * It is intentionally separate from dashboard footers and role-specific layouts.
 */
export default function PublicFooter() {
  return (
    <footer className="elite-public-footer">
      <div className="elite-public-footer__inner">
        <div className="elite-public-footer__prelude">
          <p>STAY BEYOND ORDINARY.</p>
          <h2>Stay somewhere worth remembering.</h2>
          <Link to="/search">
            Explore all stays
          </Link>
        </div>

        <div className="elite-public-footer__brand">
          <EliteLogo variant="primary" />
          <p>PREMIUM STAYS. ELEVATED.</p>
        </div>

        <div className="elite-public-footer__groups">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h2>{group.title}</h2>
              {group.links.map((link) => (
                <Link key={link.label} to={link.to}>
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <p className="elite-public-footer__massive" aria-hidden="true">
          ELITEBNB
        </p>

        <div className="elite-public-footer__bottom">
          <span>© 2026 EliteBNB. Premium stays, elevated.</span>
          <nav aria-label="Footer utility navigation">
            {footerUtilityLinks.map((link) => (
              <Link key={link.label} to={link.to}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
