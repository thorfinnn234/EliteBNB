/**
 * Renders the Google "G" mark used inside secondary auth actions.
 * The button behavior stays owned by Login/Register; this component only keeps
 * the visual mark consistent across both forms.
 */
export default function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      className="elite-auth-form__google-icon"
      viewBox="0 0 24 24"
    >
      <path
        fill="#4285F4"
        d="M21.35 12.27c0-.74-.06-1.28-.2-1.84H12v3.52h5.37c-.11.88-.7 2.2-2.01 3.09l-.02.12 2.92 2.26.2.02c1.88-1.73 2.89-4.28 2.89-7.17Z"
      />
      <path
        fill="#34A853"
        d="M12 21.8c2.69 0 4.95-.88 6.6-2.4l-3.14-2.4c-.84.57-1.97.97-3.46.97-2.63 0-4.86-1.74-5.66-4.14l-.11.01-3.04 2.35-.04.11A9.98 9.98 0 0 0 12 21.8Z"
      />
      <path
        fill="#FBBC05"
        d="M6.34 13.83A6.03 6.03 0 0 1 6 11.84c0-.69.12-1.36.33-1.99l-.01-.13-3.08-2.39-.1.05A9.99 9.99 0 0 0 2 11.84c0 1.61.38 3.13 1.05 4.46l3.29-2.47Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.7c1.87 0 3.13.81 3.84 1.48l2.82-2.75C16.94 2.82 14.69 1.87 12 1.87a9.98 9.98 0 0 0-8.85 5.51l3.18 2.47C7.14 7.44 9.37 5.7 12 5.7Z"
      />
    </svg>
  );
}
