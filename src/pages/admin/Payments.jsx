import AdminPlaceholderPage from "../../components/admin/AdminPlaceholderPage";

/**
 * Admin Payments scaffold.
 * Payment mutations require exact backend-confirmed state handling, so Phase 1
 * only wires the route and service contract without creating fake transactions.
 */
export default function Payments() {
  return (
    <AdminPlaceholderPage
      eyebrow="PAYMENT OVERSIGHT"
      title="Payments"
      description="Payment records and status actions will be connected to real backend responses in a later implementation phase."
      contractItems={[
        {
          title: "Payment records",
          description: "Uses GET /admin/payments and GET /admin/payments/{id}.",
        },
        {
          title: "Payment status",
          description: "Uses PATCH /admin/payments/{id}/status with confirmation UI.",
        },
      ]}
    />
  );
}
