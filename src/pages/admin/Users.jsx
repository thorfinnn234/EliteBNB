import AdminPlaceholderPage from "../../components/admin/AdminPlaceholderPage";

/**
 * Protected Admin Users scaffold.
 * The actual user table, details and status actions will use real Admin
 * endpoints instead of static or local presentation records.
 */
export default function Users() {
  return (
    <AdminPlaceholderPage
      eyebrow="ACCOUNT OPERATIONS"
      title="Users"
      description="This route is reserved for real user management. Phase 1 keeps it honest by avoiding mock accounts and disabled-looking fake actions."
      contractItems={[
        {
          title: "List and inspect",
          description: "Uses GET /admin/users and GET /admin/users/{id}.",
        },
        {
          title: "Account status",
          description: "Uses PATCH /admin/users/{id}/status after the status workflow is designed.",
        },
      ]}
    />
  );
}
