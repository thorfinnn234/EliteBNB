import AdminPlaceholderPage from "../../components/admin/AdminPlaceholderPage";

/**
 * Phase 1 Admin dashboard scaffold.
 * Real metrics and analytics will be connected in the Dashboard phase, using
 * the Admin service methods added for the finalized backend contract.
 */
export default function AdminDashboard() {
  return (
    <AdminPlaceholderPage
      eyebrow="ADMIN FOUNDATION"
      title="Platform command center"
      description="The dashboard route is protected and ready for real platform metrics. No mock revenue, fake users, or invented operational data is displayed in this foundation phase."
      contractItems={[
        {
          title: "Dashboard summary",
          description: "Uses GET /admin/dashboard when the data UI is built.",
        },
        {
          title: "Analytics",
          description:
            "Uses the finalized Admin analytics endpoints for growth, revenue, bookings, payments and property states.",
        },
      ]}
    />
  );
}
