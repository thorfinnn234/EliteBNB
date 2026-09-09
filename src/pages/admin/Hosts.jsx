import AdminPlaceholderPage from "../../components/admin/AdminPlaceholderPage";

/**
 * Host verification scaffold for Admin.
 * This route maps to the backend verification queue rather than pretending to
 * be a generic host directory with fabricated approval data.
 */
export default function Hosts() {
  return (
    <AdminPlaceholderPage
      eyebrow="TRUST OPERATIONS"
      title="Host Verification"
      description="The verification queue will use genuine host-verification records and review actions from the backend. No sample host approvals are shown in Phase 1."
      contractItems={[
        {
          title: "Verification queue",
          description:
            "Uses GET /admin/host-verifications and GET /admin/host-verifications/pending.",
        },
        {
          title: "Review outcome",
          description:
            "Uses PATCH /admin/host-verifications/{id}/status after confirmation UI is built.",
        },
      ]}
    />
  );
}
