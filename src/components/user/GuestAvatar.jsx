import { getGuestAvatarOption } from "../../data/guestAvatarData";

/**
 * Renders a polished local illustration for the Guest identity surfaces.
 * The SVG is intentionally abstract and frontend-only, giving Profile/topbar
 * enough character without depending on uploaded profile photos or backend
 * avatar storage.
 */
export default function GuestAvatar({
  avatarId,
  initials = "EB",
  label,
  size = "medium",
}) {
  const avatar = getGuestAvatarOption(avatarId);
  const accessibilityProps = label
    ? { "aria-label": label, role: "img" }
    : { "aria-hidden": "true" };

  return (
    <span
      className={`elite-user-avatar elite-guest-avatar elite-guest-avatar--${size}`}
      style={{
        "--guest-avatar-accent": avatar.accent,
        "--guest-avatar-ground": avatar.ground,
        "--guest-avatar-hair": avatar.hair,
        "--guest-avatar-robe": avatar.robe,
        "--guest-avatar-skin": avatar.skin,
      }}
      {...accessibilityProps}
    >
      <svg viewBox="0 0 80 80" focusable="false" aria-hidden="true">
        <rect width="80" height="80" rx="30" fill="var(--guest-avatar-ground)" />
        <path
          d="M18 68C20.8 54.2 29.2 47.2 40 47.2C50.8 47.2 59.2 54.2 62 68H18Z"
          fill="var(--guest-avatar-robe)"
          opacity="0.96"
        />
        <circle cx="40" cy="34.5" r="16.5" fill="var(--guest-avatar-skin)" />
        <path
          d="M24.6 34.2C26.2 20.5 34.9 14.2 45.9 18.4C53.3 21.2 57.5 27.7 56.5 36.9C49.9 34 43.4 29.9 37.2 24.6C33.2 30 29.1 33.2 24.6 34.2Z"
          fill="var(--guest-avatar-hair)"
        />
        <path
          d="M18.5 64.5V26.6C18.5 15.3 27.4 6.5 40 6.5C52.6 6.5 61.5 15.3 61.5 26.6V64.5"
          fill="none"
          stroke="var(--guest-avatar-accent)"
          strokeLinecap="round"
          strokeWidth="3.4"
          opacity="0.82"
        />
        <path
          d="M25.5 57.5H54.5M40 49V68"
          fill="none"
          stroke="rgba(255,255,255,0.62)"
          strokeLinecap="round"
          strokeWidth="2"
        />
      </svg>
      <span className="elite-guest-avatar__initials" aria-hidden="true">
        {initials}
      </span>
    </span>
  );
}
