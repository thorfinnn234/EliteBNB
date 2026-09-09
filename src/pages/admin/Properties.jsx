import AdminPlaceholderPage from "../../components/admin/AdminPlaceholderPage";

/**
 * Admin Properties scaffold.
 * It replaces the old Listings route name with the backend's property approval
 * and moderation contract, without loading mock property records.
 */
export default function Properties() {
  return (
    <AdminPlaceholderPage
      eyebrow="PROPERTY GOVERNANCE"
      title="Properties"
      description="Property approval and moderation will use real backend records. This foundation route avoids sample listings and unsupported approval claims."
      contractItems={[
        {
          title: "Property inventory",
          description: "Uses GET /admin/properties and GET /admin/properties/{id}.",
        },
        {
          title: "Approval workflow",
          description:
            "Uses GET /admin/properties/approvals and PATCH /admin/properties/{id}/approval.",
        },
      ]}
    />
  );
}
