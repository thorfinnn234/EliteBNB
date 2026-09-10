import AdminPlaceholderPage from "../../components/admin/AdminPlaceholderPage";

/**
 * Legacy Admin Reviews component retained only to avoid risky file deletion.
 * The current backend moderates review-related issues through Reports.
 */
export default function Reviews() {
  return (
    <AdminPlaceholderPage
      eyebrow="LEGACY ADMIN ROUTE"
      title="Review moderation belongs in Reports"
      description="This component is no longer routed because the backend does not expose a standalone Admin reviews endpoint."
    />
  );
}
