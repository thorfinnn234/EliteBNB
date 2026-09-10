/**
 * Normalizes backend enum strings for Host listing presentation. The helper
 * does not change persisted values; it only combines operational status and
 * approval status into guest-visibility language.
 */
function normalizeEnum(value) {
  return typeof value === "string" ? value.toUpperCase() : "";
}

/**
 * Converts a property record into a truthful Host-facing visibility state.
 * `status=ACTIVE` means the Host has made the listing operationally active;
 * guests should only see it as Live when approvalStatus is also APPROVED.
 */
export function getHostListingVisibility(listing) {
  const status = normalizeEnum(listing?.status || "ACTIVE");
  const approvalStatus = normalizeEnum(listing?.approvalStatus);

  if (status === "SUSPENDED") {
    return {
      className: "is-suspended",
      label: "Suspended",
      note: "Not visible to guests",
    };
  }

  if (approvalStatus === "REJECTED") {
    return {
      className: "is-rejected",
      label: "Needs attention",
      note: "Approval rejected",
    };
  }

  if (approvalStatus === "PENDING_REVIEW" || approvalStatus === "PENDING") {
    return {
      className: "is-pending",
      label: "Pending review",
      note: "Not visible to guests",
    };
  }

  if (status === "ACTIVE" && approvalStatus === "APPROVED") {
    return {
      className: "is-active",
      label: "Live",
      note: "Visible to guests",
    };
  }

  if (status === "INACTIVE" && approvalStatus === "APPROVED") {
    return {
      className: "is-muted",
      label: "Inactive",
      note: "Not visible to guests",
    };
  }

  if (status === "INACTIVE") {
    return {
      className: "is-muted",
      label: "Inactive",
      note: "Not visible to guests",
    };
  }

  return {
    className: "is-muted",
    label: status || "Status unknown",
    note: approvalStatus
      ? `Approval: ${approvalStatus.replaceAll("_", " ")}`
      : "Approval status not returned",
  };
}

/**
 * Filters properties by the combined visibility labels shown in the Host UI.
 * This keeps the local filter truthful without introducing new backend filters.
 */
export function matchesHostListingVisibilityFilter(listing, filter) {
  if (!filter || filter === "All") return true;

  const normalizedFilter = normalizeEnum(filter);
  const visibility = getHostListingVisibility(listing);
  const status = normalizeEnum(listing?.status || "ACTIVE");
  const approvalStatus = normalizeEnum(listing?.approvalStatus);

  if (normalizedFilter === "LIVE") {
    return visibility.label === "Live";
  }

  if (normalizedFilter === "PENDING_REVIEW") {
    return visibility.label === "Pending review";
  }

  if (normalizedFilter === "REJECTED") {
    return approvalStatus === "REJECTED";
  }

  return status === normalizedFilter;
}
