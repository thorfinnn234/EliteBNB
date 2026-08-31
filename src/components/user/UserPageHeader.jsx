/**
 * Provides consistent page-level framing for authenticated guest screens.
 * Detail items, media fragments, and a signature word let each route express a
 * different visual idea without duplicating the shell-level hero structure.
 */
export default function UserPageHeader({
  action,
  description,
  detailItems = [],
  eyebrow,
  media,
  signature,
  tone = "standard",
  title,
}) {
  return (
    <header
      className={`elite-user-page-header elite-user-page-header--${tone}`}
      data-user-page-reveal
    >
      <div>
        {eyebrow ? (
          <p className="elite-user-page-header__eyebrow">{eyebrow}</p>
        ) : null}
        <h2>{title}</h2>
        {description ? (
          <p className="elite-user-page-header__description">{description}</p>
        ) : null}
        {detailItems.length ? (
          <dl className="elite-user-page-header__details">
            {detailItems.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>

      {signature ? (
        <span className="elite-user-page-header__signature" aria-hidden="true">
          {signature}
        </span>
      ) : null}

      {media ? (
        <div className="elite-user-page-header__media" aria-hidden="true">
          {media}
        </div>
      ) : null}

      {action ? (
        <div className="elite-user-page-header__action">{action}</div>
      ) : null}
    </header>
  );
}
