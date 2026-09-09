import AdminPlaceholderPage from "../../components/admin/AdminPlaceholderPage";

/**
 * Admin Audit Logs scaffold.
 * Audit records should be displayed as backend-authored history, not editable
 * UI state, so this phase only establishes the protected destination.
 */
export default function AuditLogs() {
  return (
    <AdminPlaceholderPage
      eyebrow="SYSTEM TRAIL"
      title="Audit Logs"
      description="Audit history will be a read-only operational record powered by the finalized Admin audit-log endpoints."
      contractItems={[
        {
          title: "Audit stream",
          description: "Uses GET /admin/audit-logs.",
        },
        {
          title: "Log detail",
          description: "Uses GET /admin/audit-logs/{id}.",
        },
      ]}
    />
  );
}
