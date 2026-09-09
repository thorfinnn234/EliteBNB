import AdminPlaceholderPage from "../../components/admin/AdminPlaceholderPage";

/**
 * Admin Refunds scaffold.
 * Refund decisions can affect payments and guest trust, so the final workflow
 * should use real backend records and explicit confirmation states.
 */
export default function Refunds() {
  return (
    <AdminPlaceholderPage
      eyebrow="REFUND CONTROL"
      title="Refunds"
      description="Refund review will be implemented with genuine refund data. The foundation route contains no fabricated disputes or settlement values."
      contractItems={[
        {
          title: "Refund records",
          description: "Uses GET /admin/refunds and GET /admin/refunds/{id}.",
        },
        {
          title: "Refund status",
          description: "Uses PATCH /admin/refunds/{id}/status after review UI is added.",
        },
      ]}
    />
  );
}
