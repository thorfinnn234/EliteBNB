import AdminPlaceholderPage from "../../components/admin/AdminPlaceholderPage";

/**
 * Admin Reports scaffold.
 * Review/content moderation is intentionally routed through Reports because
 * the finalized backend does not expose a standalone Admin reviews endpoint.
 */
export default function Reports() {
  return (
    <AdminPlaceholderPage
      eyebrow="MODERATION DESK"
      title="Reports"
      description="Reports will become the supported moderation surface for content and review issues. Phase 1 does not invent a separate Admin reviews contract."
      contractItems={[
        {
          title: "Moderation queue",
          description: "Uses GET /admin/reports and GET /admin/reports/{id}.",
        },
        {
          title: "Report decisions",
          description:
            "Uses PATCH /admin/reports/{id}/status and POST /admin/reports/{id}/moderate.",
        },
      ]}
    />
  );
}
