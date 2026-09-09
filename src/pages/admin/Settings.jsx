import AdminPlaceholderPage from "../../components/admin/AdminPlaceholderPage";

/**
 * Admin Settings scaffold.
 * Platform settings must come from the backend key/value contract; this route
 * avoids local-only controls that would imply unsaved production changes.
 */
export default function Settings() {
  return (
    <AdminPlaceholderPage
      eyebrow="PLATFORM SETTINGS"
      title="Settings"
      description="Settings will be connected to the real platform configuration endpoints before any editable controls are shown."
      contractItems={[
        {
          title: "Settings registry",
          description: "Uses GET /admin/settings and GET /admin/settings/{key}.",
        },
        {
          title: "Setting updates",
          description: "Uses PATCH /admin/settings/{key} with backend validation.",
        },
      ]}
    />
  );
}
