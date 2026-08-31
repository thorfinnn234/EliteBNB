import UserShell from "../components/user/UserShell";

/**
 * Applies the dedicated authenticated guest shell to every USER route.
 * RoleRoute still owns authorization; this layout only supplies the customer
 * navigation frame and responsive content canvas.
 */
export default function UserLayout({
  children,
  previewMode = false,
  previewUser,
  previewRoutePath,
}) {
  return (
    <UserShell
      previewMode={previewMode}
      previewRoutePath={previewRoutePath}
      previewUser={previewUser}
    >
      {children}
    </UserShell>
  );
}
