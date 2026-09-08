import primaryLogo from "../../assets/brand/elitebnb-logo-primary-display.png";
import standaloneMark from "../../assets/brand/elitebnb-mark-display.png";

const logoSources = {
  primary: primaryLogo,
  mark: standaloneMark,
};

/**
 * Renders the official EliteBNB logo assets without redrawing or recoloring them.
 * The primary logo is used for full brand moments; the mark is used for compact placements.
 */
export default function EliteLogo({
  variant = "primary",
  className = "",
  label = "EliteBNB",
}) {
  const logoSource = logoSources[variant] ?? logoSources.primary;

  return (
    <span className={`elite-logo elite-logo--${variant} ${className}`}>
      <img src={logoSource} alt={label} />
    </span>
  );
}
