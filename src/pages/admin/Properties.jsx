import {
  AlertTriangle,
  Bath,
  BedDouble,
  Building2,
  CalendarClock,
  CheckCircle2,
  Eye,
  Home,
  ImageOff,
  Mail,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Tag,
  Users,
  WalletCards,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { adminService } from "../../services/adminService";
import "./Properties.css";

const emptyFilters = {
  approvalStatus: "",
  propertyType: "",
  search: "",
  status: "",
};

const initialApprovalQueueState = {
  error: "",
  loading: true,
  records: [],
};

const initialPropertyState = {
  error: "",
  loading: true,
  properties: [],
};

const propertyStatuses = ["ACTIVE", "INACTIVE", "SUSPENDED"];
const approvalStatuses = ["PENDING_REVIEW", "APPROVED", "REJECTED"];
const propertyTypes = [
  "APARTMENT",
  "HOUSE",
  "VILLA",
  "HOTEL",
  "CABIN",
  "STUDIO",
  "GUEST_HOUSE",
];

const currencyFormatter = new Intl.NumberFormat("en-NG", {
  currency: "NGN",
  maximumFractionDigits: 0,
  style: "currency",
});

/**
 * Sends only the backend-supported Admin property filters.
 * There is no pagination or ordering contract, so this page deliberately avoids
 * controls that would imply unsupported API behavior.
 */
function buildPropertyQuery(filters) {
  return Object.entries(filters).reduce((query, [key, value]) => {
    const trimmedValue = String(value || "").trim();

    if (trimmedValue) {
      query[key] = trimmedValue;
    }

    return query;
  }, {});
}

/**
 * Accepts the finalized property array response while tolerating a conventional
 * wrapper if the backend later nests results under a collection key.
 */
function normalizePropertyList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.properties)) return payload.properties;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;

  return [];
}

/**
 * Normalizes one AdminPropertyResponse from GET /admin/properties/{id}.
 * The page displays only fields present in that DTO.
 */
function normalizePropertyRecord(payload) {
  if (!payload) return null;
  if (payload.property) return payload.property;
  if (payload.data && !Array.isArray(payload.data)) return payload.data;

  return payload;
}

/**
 * Pulls an operator-safe error message from Axios/backend failures.
 */
function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

/**
 * Converts enum values into readable labels without changing the backend value
 * sent back during PATCH requests.
 */
function formatEnum(value) {
  if (!value) return "Not recorded";

  return String(value)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * Formats genuine backend prices as Nigerian Naira. Missing values remain
 * truthful instead of becoming a misleading zero price.
 */
function formatPrice(value) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return "Price not recorded";

  return `${currencyFormatter.format(parsed)} / night`;
}

/**
 * Formats backend timestamps for review and system metadata.
 */
function formatDate(value) {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not recorded";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Keeps titles honest when backend records are incomplete.
 */
function getPropertyTitle(property) {
  return property?.title || "Untitled property";
}

/**
 * Keeps host identity readable without inventing profile data.
 */
function getHostLabel(property) {
  return property?.hostName || property?.hostEmail || "Host not recorded";
}

/**
 * Updates one property in a list after a successful backend mutation or detail
 * refresh so inventory, approval queue, and drawer state stay synchronized.
 */
function mergeUpdatedProperty(properties, updatedProperty) {
  if (!updatedProperty?.id) return properties;

  return properties.map((property) =>
    String(property.id) === String(updatedProperty.id)
      ? { ...property, ...updatedProperty }
      : property
  );
}

/**
 * Non-photographic fallback for records without a usable coverImageUrl.
 * It keeps the inventory polished without substituting unrelated property
 * photography.
 */
function PropertyImage({ property, size = "default" }) {
  const [failedImageUrl, setFailedImageUrl] = useState("");
  const imageUrl = property?.coverImageUrl;
  const imageUnavailable = !imageUrl || failedImageUrl === imageUrl;
  const altText = `${getPropertyTitle(property)} cover`;

  if (imageUnavailable) {
    return (
      <div
        className={`elite-admin-properties__image-fallback elite-admin-properties__image-fallback--${size}`}
        role="img"
        aria-label={`${getPropertyTitle(property)} has no cover image`}
      >
        <Home size={26} aria-hidden="true" />
        <span>EliteBNB</span>
      </div>
    );
  }

  return (
    <img
      className={`elite-admin-properties__image elite-admin-properties__image--${size}`}
      src={imageUrl}
      alt={altText}
      onError={() => setFailedImageUrl(imageUrl)}
    />
  );
}

/**
 * Visual badge for operational availability: ACTIVE, INACTIVE, or SUSPENDED.
 */
function PropertyStatusBadge({ status }) {
  const normalizedStatus = status || "UNKNOWN";

  return (
    <span
      className={`elite-admin-properties__badge elite-admin-properties__badge--status-${normalizedStatus}`}
    >
      {formatEnum(normalizedStatus)}
    </span>
  );
}

/**
 * Visual badge for approval state. This stays separate from operational status
 * because APPROVED and ACTIVE mean different things in the backend model.
 */
function ApprovalStatusBadge({ approvalStatus }) {
  const normalizedStatus = approvalStatus || "UNKNOWN";
  const Icon =
    normalizedStatus === "APPROVED"
      ? CheckCircle2
      : normalizedStatus === "REJECTED"
        ? XCircle
        : ShieldCheck;

  return (
    <span
      className={`elite-admin-properties__badge elite-admin-properties__badge--approval-${normalizedStatus}`}
    >
      <Icon size={14} aria-hidden="true" />
      {formatEnum(normalizedStatus)}
    </span>
  );
}

/**
 * Compact fact chip for real accommodation fields.
 */
function PropertyFact({ icon: Icon, label, value }) {
  if (value === null || value === undefined || value === "") return null;

  return (
    <span className="elite-admin-properties__fact">
      <Icon size={15} aria-hidden="true" />
      {value} {label}
    </span>
  );
}

/**
 * Property inventory item. It is deliberately image-led and row-like so the
 * page feels like hospitality inventory governance, not a copied Users table.
 */
function PropertyInventoryCard({
  onApprovalRequest,
  onInspect,
  property,
}) {
  const pendingApproval = property?.approvalStatus === "PENDING_REVIEW";

  return (
    <article className="elite-admin-properties__card">
      <figure className="elite-admin-properties__card-media">
        <PropertyImage property={property} />
      </figure>

      <div className="elite-admin-properties__card-body">
        <div className="elite-admin-properties__card-kicker">
          <span>{formatEnum(property?.propertyType)}</span>
          <span>{formatPrice(property?.pricePerNight)}</span>
        </div>
        <h3>{getPropertyTitle(property)}</h3>
        <p>
          <MapPin size={15} aria-hidden="true" />
          {property?.location || "Location not recorded"}
        </p>

        <div className="elite-admin-properties__facts" aria-label="Property facts">
          <PropertyFact icon={BedDouble} label="bedrooms" value={property?.bedrooms} />
          <PropertyFact icon={Bath} label="bathrooms" value={property?.bathrooms} />
          <PropertyFact icon={Users} label="guests" value={property?.maxGuests} />
        </div>
      </div>

      <div className="elite-admin-properties__card-governance">
        <div className="elite-admin-properties__host-line">
          <span>Hosted by</span>
          <strong>{getHostLabel(property)}</strong>
        </div>
        <div className="elite-admin-properties__badges">
          <PropertyStatusBadge status={property?.status} />
          <ApprovalStatusBadge approvalStatus={property?.approvalStatus} />
        </div>
        <div className="elite-admin-properties__actions">
          <button type="button" onClick={() => onInspect(property)}>
            <Eye size={16} aria-hidden="true" />
            Inspect
          </button>
          {pendingApproval && (
            <>
              <button
                className="elite-admin-properties__moderation-button elite-admin-properties__moderation-button--approve"
                onClick={() => onApprovalRequest(property, "APPROVED")}
                type="button"
              >
                Approve
              </button>
              <button
                className="elite-admin-properties__moderation-button elite-admin-properties__moderation-button--reject"
                onClick={() => onApprovalRequest(property, "REJECTED")}
                type="button"
              >
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

/**
 * Approval queue uses the dedicated backend endpoint for pending work while
 * keeping the main property inventory available for all supported filters.
 */
function ApprovalQueuePanel({
  error,
  loading,
  onApprovalRequest,
  onInspect,
  onRetry,
  records,
}) {
  return (
    <section
      className="elite-admin-properties__approval-queue"
      aria-label="Pending property approval queue"
    >
      <div className="elite-admin-properties__section-heading">
        <div>
          <span>Approval queue</span>
          <h3>Pending review</h3>
        </div>
        <button disabled={loading} onClick={onRetry} type="button">
          <RefreshCw size={16} aria-hidden="true" />
          Refresh
        </button>
      </div>

      {loading && (
        <div
          className="elite-admin-properties__queue-skeleton"
          aria-label="Loading pending property approvals"
        >
          {Array.from({ length: 3 }).map((_, index) => (
            <span key={index} />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="elite-admin-properties__inline-state" role="alert">
          <AlertTriangle size={18} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && records.length === 0 && (
        <div className="elite-admin-properties__inline-state" role="status">
          <CheckCircle2 size={18} aria-hidden="true" />
          <span>No pending property approvals right now.</span>
        </div>
      )}

      {!loading && !error && records.length > 0 && (
        <div className="elite-admin-properties__queue-list">
          {records.map((property) => (
            <article key={property.id}>
              <PropertyImage property={property} size="thumbnail" />
              <span>
                <strong>{getPropertyTitle(property)}</strong>
                <small>{getHostLabel(property)}</small>
              </span>
              <div>
                <button type="button" onClick={() => onInspect(property)}>
                  Inspect
                </button>
                <button
                  type="button"
                  onClick={() => onApprovalRequest(property, "APPROVED")}
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => onApprovalRequest(property, "REJECTED")}
                >
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * One labeled DTO field inside the property inspection drawer.
 */
function DetailItem({ icon: Icon, label, value }) {
  return (
    <div>
      {Icon ? <Icon size={17} aria-hidden="true" /> : <Tag size={17} aria-hidden="true" />}
      <span>
        <small>{label}</small>
        {value || "Not recorded"}
      </span>
    </div>
  );
}

/**
 * Detail drawer renders the authoritative property record and separates the
 * approval workflow from operational status management.
 */
function PropertyDetailDrawer({
  detailState,
  onApprovalRequest,
  onClose,
  onStatusRequest,
}) {
  const property = detailState.property;
  const statusOptions = propertyStatuses.filter(
    (status) => status !== property?.status
  );

  return (
    <div className="elite-admin-properties__overlay" role="presentation">
      <aside
        aria-labelledby="admin-property-detail-title"
        aria-modal="true"
        className="elite-admin-properties__drawer"
        role="dialog"
      >
        <button
          aria-label="Close property detail"
          className="elite-admin-properties__drawer-close"
          onClick={onClose}
          type="button"
        >
          <X size={18} aria-hidden="true" />
        </button>

        {detailState.loading && (
          <div className="elite-admin-properties__drawer-state" role="status">
            <RefreshCw size={22} aria-hidden="true" />
            Loading property record...
          </div>
        )}

        {!detailState.loading && detailState.error && (
          <div className="elite-admin-properties__drawer-state" role="alert">
            <AlertTriangle size={22} aria-hidden="true" />
            {detailState.error}
          </div>
        )}

        {!detailState.loading && property && (
          <>
            <header className="elite-admin-properties__drawer-header">
              <PropertyImage property={property} size="hero" />
              <span>Property inspection</span>
              <h3 id="admin-property-detail-title">{getPropertyTitle(property)}</h3>
              <p>{property.description || "No property description provided."}</p>
              <div className="elite-admin-properties__badges">
                <PropertyStatusBadge status={property.status} />
                <ApprovalStatusBadge approvalStatus={property.approvalStatus} />
              </div>
            </header>

            <section
              aria-label="Property information"
              className="elite-admin-properties__detail-section"
            >
              <span>Property</span>
              <div className="elite-admin-properties__detail-grid">
                <DetailItem label="Location" value={property.location} icon={MapPin} />
                <DetailItem label="Property type" value={formatEnum(property.propertyType)} icon={Building2} />
                <DetailItem label="Price" value={formatPrice(property.pricePerNight)} icon={WalletCards} />
                <DetailItem label="Bedrooms" value={property.bedrooms} icon={BedDouble} />
                <DetailItem label="Bathrooms" value={property.bathrooms} icon={Bath} />
                <DetailItem label="Max guests" value={property.maxGuests} icon={Users} />
              </div>
            </section>

            <section
              aria-label="Host information"
              className="elite-admin-properties__detail-section"
            >
              <span>Host</span>
              <div className="elite-admin-properties__detail-grid">
                <DetailItem label="Host name" value={property.hostName} />
                <DetailItem label="Host email" value={property.hostEmail} icon={Mail} />
                <DetailItem label="Host ID" value={property.hostId} />
              </div>
            </section>

            <section
              aria-label="Approval review metadata"
              className="elite-admin-properties__detail-section"
            >
              <span>Review metadata</span>
              <div className="elite-admin-properties__detail-grid">
                <DetailItem label="Approval note" value={property.approvalNote} />
                <DetailItem label="Reviewed by" value={property.approvalReviewedByName} />
                <DetailItem
                  label="Reviewed at"
                  value={formatDate(property.approvalReviewedAt)}
                  icon={CalendarClock}
                />
                <DetailItem label="Created" value={formatDate(property.createdAt)} />
                <DetailItem label="Updated" value={formatDate(property.updatedAt)} />
              </div>
            </section>

            <section className="elite-admin-properties__control-panel">
              <span>Approval workflow</span>
              {property.approvalStatus === "PENDING_REVIEW" ? (
                <>
                  <p>
                    Pending properties can be approved or rejected. Rejections
                    require a meaningful Admin note before the backend request.
                  </p>
                  <div className="elite-admin-properties__control-actions">
                    <button
                      className="elite-admin-properties__primary-action elite-admin-properties__primary-action--approve"
                      onClick={() => onApprovalRequest(property, "APPROVED")}
                      type="button"
                    >
                      Approve property
                    </button>
                    <button
                      className="elite-admin-properties__primary-action elite-admin-properties__primary-action--reject"
                      onClick={() => onApprovalRequest(property, "REJECTED")}
                      type="button"
                    >
                      Reject property
                    </button>
                  </div>
                </>
              ) : (
                <p>
                  This property has already received an approval decision. It
                  remains inspectable, but repeat approval actions are hidden.
                </p>
              )}
            </section>

            <section className="elite-admin-properties__control-panel">
              <span>Operational status</span>
              <p>
                Operational status controls listing availability independently
                from approval review state.
              </p>
              <div className="elite-admin-properties__control-actions">
                {statusOptions.map((status) => (
                  <button
                    className={`elite-admin-properties__primary-action elite-admin-properties__primary-action--status-${status}`}
                    key={status}
                    onClick={() => onStatusRequest(property, status)}
                    type="button"
                  >
                    Set {formatEnum(status)}
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </aside>
    </div>
  );
}

/**
 * Confirmation modal owns both approval and operational-status review.
 * Approval notes are sent only to the approval endpoint; status mutations keep
 * the separate backend contract clean.
 */
function ModerationModal({
  approvalNote,
  error,
  loading,
  onCancel,
  onConfirm,
  onNoteChange,
  request,
}) {
  if (!request) return null;

  const isApproval = request.kind === "approval";
  const isRejection = request.target === "REJECTED";
  const propertyTitle = getPropertyTitle(request.property);
  const title = isApproval
    ? isRejection
      ? "Reject this property?"
      : "Approve this property?"
    : `Set property ${formatEnum(request.target)}?`;

  return (
    <div className="elite-admin-properties__confirm-overlay" role="presentation">
      <section
        aria-labelledby="admin-property-moderation-title"
        aria-modal="true"
        className="elite-admin-properties__confirm"
        role="dialog"
      >
        <span className="elite-admin-properties__confirm-icon" aria-hidden="true">
          {isApproval ? <ShieldCheck size={23} /> : <Building2 size={23} />}
        </span>
        <h3 id="admin-property-moderation-title">{title}</h3>
        <p>
          {isApproval
            ? `${propertyTitle} will move to ${formatEnum(request.target)} after the backend confirms this approval decision.`
            : `${propertyTitle} will keep its approval state, but its operational status will change to ${formatEnum(request.target)}.`}
        </p>

        {isApproval && (
          <label>
            <span>{isRejection ? "Approval note" : "Approval note (optional)"}</span>
            <textarea
              onChange={(event) => onNoteChange(event.target.value)}
              placeholder={
                isRejection
                  ? "Add a clear reason for rejecting this property"
                  : "Optional internal note for this approval"
              }
              rows={4}
              value={approvalNote}
            />
          </label>
        )}

        {error && (
          <div className="elite-admin-properties__confirm-error" role="alert">
            <AlertTriangle size={16} aria-hidden="true" />
            {error}
          </div>
        )}

        <div className="elite-admin-properties__confirm-actions">
          <button disabled={loading} onClick={onCancel} type="button">
            Keep current state
          </button>
          <button
            className={isRejection ? "is-reject" : "is-approve"}
            disabled={loading}
            onClick={onConfirm}
            type="button"
          >
            {loading ? "Submitting..." : "Confirm change"}
          </button>
        </div>
      </section>
    </div>
  );
}

/**
 * Phase 5 Admin Properties workspace.
 * It connects property inventory, approval moderation, and operational status
 * changes to the finalized Admin backend contract only.
 */
export default function Properties() {
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [approvalNote, setApprovalNote] = useState("");
  const [approvalQueueState, setApprovalQueueState] = useState(
    initialApprovalQueueState
  );
  const [detailState, setDetailState] = useState({
    error: "",
    loading: false,
    open: false,
    property: null,
  });
  const [moderationRequest, setModerationRequest] = useState(null);
  const [mutationState, setMutationState] = useState({
    error: "",
    loading: false,
    success: "",
  });
  const [pendingFilters, setPendingFilters] = useState(emptyFilters);
  const [propertyState, setPropertyState] = useState(initialPropertyState);
  const [reloadToken, setReloadToken] = useState(0);

  const hasActiveFilters = useMemo(
    () => Object.values(appliedFilters).some((value) => String(value).trim()),
    [appliedFilters]
  );
  const totalLabel = propertyState.loading
    ? "Loading inventory"
    : `${propertyState.properties.length} ${
        propertyState.properties.length === 1 ? "property" : "properties"
      }${hasActiveFilters ? " matching filters" : ""}`;
  const pendingApprovalCount = approvalQueueState.records.length;

  useBodyScrollLock(detailState.open || Boolean(moderationRequest));

  useEffect(() => {
    let active = true;

    async function loadProperties() {
      const [inventoryResult, approvalsResult] = await Promise.allSettled([
        adminService.getProperties(buildPropertyQuery(appliedFilters)),
        adminService.getPropertyApprovals(),
      ]);

      if (!active) return;

      if (inventoryResult.status === "fulfilled") {
        setPropertyState({
          error: "",
          loading: false,
          properties: normalizePropertyList(inventoryResult.value.data),
        });
      } else {
        setPropertyState({
          error: getErrorMessage(
            inventoryResult.reason,
            "Unable to load Admin property inventory."
          ),
          loading: false,
          properties: [],
        });
      }

      if (approvalsResult.status === "fulfilled") {
        setApprovalQueueState({
          error: "",
          loading: false,
          records: normalizePropertyList(approvalsResult.value.data),
        });
      } else {
        setApprovalQueueState({
          error: getErrorMessage(
            approvalsResult.reason,
            "Unable to load pending property approvals."
          ),
          loading: false,
          records: [],
        });
      }
    }

    loadProperties();

    return () => {
      active = false;
    };
  }, [appliedFilters, reloadToken]);

  /**
   * Applies backend-supported filters explicitly instead of requesting on every
   * search keystroke.
   */
  const handleFilterSubmit = (event) => {
    event.preventDefault();
    setMutationState({ error: "", loading: false, success: "" });
    setPropertyState((current) => ({ ...current, error: "", loading: true }));
    setApprovalQueueState((current) => ({
      ...current,
      error: "",
      loading: true,
    }));
    setAppliedFilters({ ...pendingFilters });
  };

  /**
   * Keeps toolbar edits local until Apply filters is submitted.
   */
  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setPendingFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /**
   * Clears both the visible toolbar and the backend query state.
   */
  const handleClearFilters = () => {
    setPendingFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setMutationState({ error: "", loading: false, success: "" });
    setPropertyState((current) => ({ ...current, error: "", loading: true }));
    setApprovalQueueState((current) => ({
      ...current,
      error: "",
      loading: true,
    }));
  };

  /**
   * Retries the current filtered inventory and approval queue requests.
   */
  const handleRetry = () => {
    setMutationState({ error: "", loading: false, success: "" });
    setPropertyState((current) => ({ ...current, error: "", loading: true }));
    setApprovalQueueState((current) => ({
      ...current,
      error: "",
      loading: true,
    }));
    setReloadToken((current) => current + 1);
  };

  /**
   * Opens with list data immediately, then replaces it with the authoritative
   * property detail response from GET /admin/properties/{id}.
   */
  const handleOpenDetail = async (property) => {
    setDetailState({
      error: "",
      loading: true,
      open: true,
      property,
    });

    try {
      const response = await adminService.getPropertyById(property.id);
      const detailProperty = normalizePropertyRecord(response.data);

      setDetailState({
        error: "",
        loading: false,
        open: true,
        property: detailProperty || property,
      });
    } catch (error) {
      setDetailState({
        error: getErrorMessage(error, "Unable to load this property record."),
        loading: false,
        open: true,
        property,
      });
    }
  };

  const handleCloseDetail = () => {
    setDetailState({
      error: "",
      loading: false,
      open: false,
      property: null,
    });
  };

  /**
   * Stores approval intent until the Admin confirms the modal. PENDING_REVIEW
   * is the only approval state that exposes decision actions.
   */
  const handleApprovalRequest = (property, approvalStatus) => {
    setApprovalNote(property?.approvalNote || "");
    setMutationState({ error: "", loading: false, success: "" });
    setModerationRequest({
      kind: "approval",
      property,
      target: approvalStatus,
    });
  };

  /**
   * Stores operational status intent separately from approval decisions.
   */
  const handleStatusRequest = (property, status) => {
    setApprovalNote("");
    setMutationState({ error: "", loading: false, success: "" });
    setModerationRequest({
      kind: "status",
      property,
      target: status,
    });
  };

  const handleCancelModeration = () => {
    if (mutationState.loading) return;
    setApprovalNote("");
    setModerationRequest(null);
    setMutationState({ error: "", loading: false, success: "" });
  };

  /**
   * Sends the exact backend body for either approval or operational status.
   * Rejection notes are required here as UX guidance, not as a claimed backend
   * validation rule.
   */
  const handleConfirmModeration = async () => {
    if (!moderationRequest) return;

    const trimmedNote = approvalNote.trim();

    if (
      moderationRequest.kind === "approval" &&
      moderationRequest.target === "REJECTED" &&
      trimmedNote.length < 6
    ) {
      setMutationState({
        error: "Add a clear approval note before rejecting this property.",
        loading: false,
        success: "",
      });
      return;
    }

    setMutationState({ error: "", loading: true, success: "" });

    try {
      const response =
        moderationRequest.kind === "approval"
          ? await adminService.updatePropertyApproval(
              moderationRequest.property.id,
              trimmedNote
                ? {
                    approvalNote: trimmedNote,
                    approvalStatus: moderationRequest.target,
                  }
                : {
                    approvalStatus: moderationRequest.target,
                  }
            )
          : await adminService.updatePropertyStatus(moderationRequest.property.id, {
              status: moderationRequest.target,
            });
      const updatedProperty = normalizePropertyRecord(response.data);
      const successTitle = getPropertyTitle(
        updatedProperty || moderationRequest.property
      );

      if (updatedProperty) {
        setPropertyState((current) => ({
          ...current,
          properties: mergeUpdatedProperty(current.properties, updatedProperty),
        }));

        setApprovalQueueState((current) => ({
          ...current,
          records:
            updatedProperty.approvalStatus === "PENDING_REVIEW"
              ? mergeUpdatedProperty(current.records, updatedProperty)
              : current.records.filter(
                  (property) => String(property.id) !== String(updatedProperty.id)
                ),
        }));

        setDetailState((current) => ({
          ...current,
          property:
            current.property &&
            String(current.property.id) === String(updatedProperty.id)
              ? { ...current.property, ...updatedProperty }
              : current.property,
        }));
      }

      setApprovalNote("");
      setModerationRequest(null);
      setMutationState({
        error: "",
        loading: false,
        success: `${successTitle} was updated to ${formatEnum(moderationRequest.target)}.`,
      });

      /* Refetch after local synchronization so filtered inventory and the
         approval queue remain authoritative after moderation changes. */
      setReloadToken((current) => current + 1);
    } catch (error) {
      setMutationState({
        error: getErrorMessage(error, "Unable to update this property."),
        loading: false,
        success: "",
      });
    }
  };

  return (
    <section
      className="elite-admin-properties"
      aria-labelledby="admin-properties-title"
    >
      <header className="elite-admin-properties__header">
        <div>
          <span>Property governance</span>
          <h2 id="admin-properties-title">Properties</h2>
          <p>
            Review EliteBNB inventory, approval decisions, and operational
            availability with real listing records from the Admin backend.
          </p>
        </div>
        <aside aria-label="Property inventory counts">
          <Building2 size={22} aria-hidden="true" />
          <strong>{totalLabel}</strong>
          <small>{pendingApprovalCount} pending approval{pendingApprovalCount === 1 ? "" : "s"}</small>
        </aside>
      </header>

      <form
        className="elite-admin-properties__filters"
        onSubmit={handleFilterSubmit}
      >
        <div className="elite-admin-properties__search-field">
          <Search size={17} aria-hidden="true" />
          <label htmlFor="admin-property-search">Search properties</label>
          <input
            id="admin-property-search"
            name="search"
            onChange={handleFilterChange}
            placeholder="Title, location, host, or backend-supported text"
            type="search"
            value={pendingFilters.search}
          />
        </div>

        <label className="elite-admin-properties__select-field">
          <span>Status</span>
          <select
            name="status"
            onChange={handleFilterChange}
            value={pendingFilters.status}
          >
            <option value="">All statuses</option>
            {propertyStatuses.map((status) => (
              <option key={status} value={status}>
                {formatEnum(status)}
              </option>
            ))}
          </select>
        </label>

        <label className="elite-admin-properties__select-field">
          <span>Approval</span>
          <select
            name="approvalStatus"
            onChange={handleFilterChange}
            value={pendingFilters.approvalStatus}
          >
            <option value="">All approvals</option>
            {approvalStatuses.map((approvalStatus) => (
              <option key={approvalStatus} value={approvalStatus}>
                {formatEnum(approvalStatus)}
              </option>
            ))}
          </select>
        </label>

        <label className="elite-admin-properties__select-field">
          <span>Type</span>
          <select
            name="propertyType"
            onChange={handleFilterChange}
            value={pendingFilters.propertyType}
          >
            <option value="">All types</option>
            {propertyTypes.map((propertyType) => (
              <option key={propertyType} value={propertyType}>
                {formatEnum(propertyType)}
              </option>
            ))}
          </select>
        </label>

        <div className="elite-admin-properties__filter-actions">
          <button type="submit">
            <SlidersHorizontal size={16} aria-hidden="true" />
            Apply filters
          </button>
          {(hasActiveFilters ||
            Object.values(pendingFilters).some((value) =>
              String(value).trim()
            )) && (
            <button onClick={handleClearFilters} type="button">
              Clear
            </button>
          )}
        </div>
      </form>

      {mutationState.error && !moderationRequest && (
        <div className="elite-admin-properties__feedback is-error" role="alert">
          <AlertTriangle size={17} aria-hidden="true" />
          {mutationState.error}
        </div>
      )}
      {mutationState.success && (
        <div className="elite-admin-properties__feedback is-success" role="status">
          <CheckCircle2 size={17} aria-hidden="true" />
          {mutationState.success}
        </div>
      )}

      <ApprovalQueuePanel
        error={approvalQueueState.error}
        loading={approvalQueueState.loading}
        onApprovalRequest={handleApprovalRequest}
        onInspect={handleOpenDetail}
        onRetry={handleRetry}
        records={approvalQueueState.records}
      />

      <section
        className="elite-admin-properties__inventory"
        aria-label="Property inventory"
      >
        <div className="elite-admin-properties__section-heading">
          <div>
            <span>Inventory</span>
            <h3>Governed residences</h3>
          </div>
          <button
            aria-label="Refresh property inventory"
            disabled={propertyState.loading}
            onClick={handleRetry}
            type="button"
          >
            <RefreshCw size={16} aria-hidden="true" />
            Refresh
          </button>
        </div>

        {propertyState.loading && (
          <div
            className="elite-admin-properties__skeleton"
            aria-label="Loading properties"
          >
            {Array.from({ length: 4 }).map((_, index) => (
              <span key={index} />
            ))}
          </div>
        )}

        {!propertyState.loading && propertyState.error && (
          <div className="elite-admin-properties__empty-state" role="alert">
            <AlertTriangle size={24} aria-hidden="true" />
            <h3>Unable to load properties</h3>
            <p>{propertyState.error}</p>
            <button onClick={handleRetry} type="button">
              Retry
            </button>
          </div>
        )}

        {!propertyState.loading &&
          !propertyState.error &&
          propertyState.properties.length === 0 && (
            <div className="elite-admin-properties__empty-state" role="status">
              <ImageOff size={24} aria-hidden="true" />
              <h3>{hasActiveFilters ? "No matching properties" : "No properties yet"}</h3>
              <p>
                {hasActiveFilters
                  ? "No property matched the current backend filters."
                  : "The backend returned an empty property inventory."}
              </p>
              {hasActiveFilters && (
                <button onClick={handleClearFilters} type="button">
                  Clear filters
                </button>
              )}
            </div>
          )}

        {!propertyState.loading &&
          !propertyState.error &&
          propertyState.properties.length > 0 && (
            <div className="elite-admin-properties__list">
              {propertyState.properties.map((property) => (
                <PropertyInventoryCard
                  key={property.id}
                  onApprovalRequest={handleApprovalRequest}
                  onInspect={handleOpenDetail}
                  property={property}
                />
              ))}
            </div>
          )}
      </section>

      {detailState.open && (
        <PropertyDetailDrawer
          detailState={detailState}
          onApprovalRequest={handleApprovalRequest}
          onClose={handleCloseDetail}
          onStatusRequest={handleStatusRequest}
        />
      )}

      <ModerationModal
        approvalNote={approvalNote}
        error={mutationState.error}
        loading={mutationState.loading}
        onCancel={handleCancelModeration}
        onConfirm={handleConfirmModeration}
        onNoteChange={setApprovalNote}
        request={moderationRequest}
      />
    </section>
  );
}
