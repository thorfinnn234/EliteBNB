import AdminPlaceholderPage from "../../components/admin/AdminPlaceholderPage";

/**
 * Admin Notifications scaffold.
 * The shell already reads the Admin unread count; the full notification inbox
 * will use the Admin-specific notification endpoints in its own phase.
 */
export default function Notifications() {
  return (
    <AdminPlaceholderPage
      eyebrow="ADMIN SIGNALS"
      title="Notifications"
      description="Admin notifications will use real backend messages and read-state mutations. No production mock alerts are rendered here."
      contractItems={[
        {
          title: "Notification inbox",
          description: "Uses GET /admin/notifications and GET /admin/notifications/unread-count.",
        },
        {
          title: "Read state",
          description:
            "Uses PATCH /admin/notifications/{id}/read and PATCH /admin/notifications/read-all.",
        },
      ]}
    />
  );
}
