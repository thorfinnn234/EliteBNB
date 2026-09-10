import AdminPlaceholderPage from "../../components/admin/AdminPlaceholderPage";

/**
 * Legacy Admin Listings component retained only to avoid risky file deletion.
 * The supported production route is now /admin/properties.
 */
export default function Listings() {
  return (
    <AdminPlaceholderPage
      eyebrow="LEGACY ADMIN ROUTE"
      title="Listings moved to Properties"
      description="This component is no longer routed. Admin property governance now belongs at /admin/properties to match the backend contract."
    />
  );
}
