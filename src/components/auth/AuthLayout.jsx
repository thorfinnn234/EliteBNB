import { Link } from "react-router-dom";
import authImage from "../../assets/images/auth-property-editorial.jpg";
import EliteLogo from "../public/EliteLogo";
import "./AuthLayout.css";

const defaultVisualDetails = ["Verified homes", "Private arrivals", "Thoughtful hosts"];

/**
 * Provides the shared editorial authentication shell used by auth pages.
 * Login and Register pass page-specific copy while existing recovery/verify
 * screens can continue rendering through the default visual treatment.
 */
export default function AuthLayout({
  children,
  eyebrow = "PRIVATE RESIDENCES",
  visualTitle = "Discover exceptional stays selected for design, place and experience.",
  visualCopy = "EliteBNB keeps authentication calm and focused while the visual side carries the same hospitality language as the public homepage.",
  visualDetails = defaultVisualDetails,
  visualImage = authImage,
  visualAlt = "EliteBNB architectural residence",
  variant = "default",
  showBrand = false,
}) {
  return (
    <main className={`elite-auth elite-auth--${variant}`}>
      <div className="elite-auth__shell">
        <section className="elite-auth__form-panel" aria-label="Authentication form">
          <div className="elite-auth__form-shell">
            {showBrand ? (
              <Link to="/" className="elite-auth__brand-link">
                <EliteLogo variant="primary" />
                <span>Back to EliteBNB</span>
              </Link>
            ) : null}
            {children}
          </div>
        </section>

        <section className="elite-auth__visual-panel" aria-label="EliteBNB residence preview">
          <svg width="0" height="0" className="elite-auth__clip" aria-hidden="true">
            <defs>
              <clipPath id="authImageClip" clipPathUnits="objectBoundingBox">
                <path
                  d="
                    M 0.18 0
                    L 0.92 0
                    Q 1 0 1 0.08

                    L 1 0.80

                    Q 1 0.86 0.94 0.86

                    L 0.90 0.86

                    Q 0.84 0.86 0.84 0.92

                    Q 0.84 1 0.76 1

                    L 0.08 1

                    Q 0 1 0 0.92

                    L 0 0.18

                    Q 0 0.12 0.06 0.12

                    L 0.10 0.12

                    Q 0.16 0.12 0.16 0.06

                    Q 0.16 0 0.18 0

                    Z
                  "
                />
              </clipPath>
            </defs>
          </svg>

          <div className="elite-auth__visual-frame">
            <img src={visualImage} alt={visualAlt} />
            <span className="elite-auth__visual-shade" aria-hidden="true" />
            <div className="elite-auth__visual-copy">
              <p>{eyebrow}</p>
              <h2>{visualTitle}</h2>
              <span>{visualCopy}</span>
            </div>
            <div className="elite-auth__visual-details" aria-label="EliteBNB trust highlights">
              {visualDetails.map((detail) => (
                <span key={detail}>{detail}</span>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
