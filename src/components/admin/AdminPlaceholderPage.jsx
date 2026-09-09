/**
 * Neutral Admin route scaffold for Phase 1.
 * It confirms protected routes are wired without showing fake records, mock
 * metrics, or actions that imply backend mutations before each feature page is
 * implemented in its own phase.
 */
export default function AdminPlaceholderPage({
  title,
  eyebrow,
  description,
  contractItems = [],
}) {
  return (
    <section className="elite-admin-placeholder">
      <div className="elite-admin-placeholder__intro">
        <span>{eyebrow}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      {contractItems.length > 0 ? (
        <div className="elite-admin-placeholder__contracts">
          {contractItems.map((item) => (
            <article key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
