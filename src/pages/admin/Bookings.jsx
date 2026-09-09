import AdminPlaceholderPage from "../../components/admin/AdminPlaceholderPage";

/**
 * Admin Bookings scaffold.
 * Status updates are sensitive, so Phase 1 only confirms the route while the
 * later implementation can add detail review and confirmation controls.
 */
export default function Bookings() {
  return (
    <AdminPlaceholderPage
      eyebrow="RESERVATION OVERSIGHT"
      title="Bookings"
      description="Real reservation records will be loaded here through the Admin booking endpoints. The foundation avoids fake booking rows or unsupported actions."
      contractItems={[
        {
          title: "Booking records",
          description: "Uses GET /admin/bookings and GET /admin/bookings/{id}.",
        },
        {
          title: "Status governance",
          description: "Uses PATCH /admin/bookings/{id}/status once Admin confirmation flows are added.",
        },
      ]}
    />
  );
}
