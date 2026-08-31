/**
 * Standardizes the homepage's editorial section headings without making every
 * section visually identical. The optional copy keeps functional context close.
 */
export default function EditorialHeading({
  eyebrow,
  title,
  children,
  align = "left",
  className = "",
}) {
  return (
    <div className={`elite-editorial-heading elite-editorial-heading--${align} ${className}`}>
      {eyebrow && <p className="elite-section-eyebrow">{eyebrow}</p>}
      <h2>{title}</h2>
      {children && <div className="elite-editorial-heading__copy">{children}</div>}
    </div>
  );
}
