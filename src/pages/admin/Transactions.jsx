import AdminPlaceholderPage from "../../components/admin/AdminPlaceholderPage";

/**
 * Legacy Admin Transactions component retained only to avoid risky file deletion.
 * Payments and refunds are separate supported backend surfaces now.
 */
export default function Transactions() {
  return (
    <AdminPlaceholderPage
      eyebrow="LEGACY ADMIN ROUTE"
      title="Transactions split into Payments and Refunds"
      description="This component is no longer routed. Admin financial oversight now uses /admin/payments and /admin/refunds."
    />
  );
}
