import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Eye,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { adminService } from "../../services/adminService";
import "./Users.css";

const emptyFilters = {
  role: "",
  search: "",
  status: "",
};

const initialDirectoryState = {
  error: "",
  loading: true,
  users: [],
};

/**
 * Maps the three backend-supported filters into query parameters.
 * The Admin API does not expose pagination or sorting, so this page deliberately
 * sends only search, role, and account-status criteria.
 */
function buildUserQuery(filters) {
  return Object.entries(filters).reduce((query, [key, value]) => {
    const trimmedValue = String(value || "").trim();

    if (trimmedValue) {
      query[key] = trimmedValue;
    }

    return query;
  }, {});
}

/**
 * Accepts the finalized array response while staying tolerant of a lightweight
 * wrapper if the backend later nests users under a conventional collection key.
 */
function normalizeUsersResponse(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.users)) return payload.users;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;

  return [];
}

/**
 * Normalizes a single AdminUserResponse from GET /admin/users/{id}.
 * No fields are invented; the UI only formats fields already supplied by the
 * backend contract.
 */
function normalizeUserResponse(payload) {
  if (!payload) return null;
  if (payload.user) return payload.user;
  if (payload.data && !Array.isArray(payload.data)) return payload.data;

  return payload;
}

/**
 * Extracts an Axios/backend error message while keeping a clear fallback for
 * connection or authorization failures.
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
 * Builds the public member name from genuine profile fields only.
 * Email is used as a truthful fallback when names have not been completed.
 */
function getMemberName(user) {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  return fullName || user?.email || "Unnamed member";
}

/**
 * Creates a compact initials fallback for accounts without a real
 * profileImageUrl. This keeps the directory visual without adding stock photos.
 */
function getMemberInitials(user) {
  const source = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (source) {
    return source
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }

  return (user?.email?.slice(0, 2) || "EB").toUpperCase();
}

/**
 * Restricts visible status actions to the backend-supported mutation rules.
 * ADMIN accounts are intentionally read-only in this UI because the backend
 * rejects Admin-to-Admin suspension through /admin/users/{id}/status.
 */
function getStatusAction(user, currentAdminId) {
  if (!user || user.role === "ADMIN") return null;
  if (String(user.id) === String(currentAdminId)) return null;

  if (user.accountStatus === "ACTIVE") {
    return {
      icon: Ban,
      label: "Suspend",
      targetStatus: "SUSPENDED",
      tone: "danger",
    };
  }

  if (user.accountStatus === "SUSPENDED") {
    return {
      icon: RotateCcw,
      label: "Reactivate",
      targetStatus: "ACTIVE",
      tone: "positive",
    };
  }

  return null;
}

/**
 * Keeps the directory and an open detail drawer synchronized after the backend
 * confirms a status mutation.
 */
function mergeUpdatedUser(users, updatedUser) {
  if (!updatedUser?.id) return users;

  return users.map((user) =>
    String(user.id) === String(updatedUser.id)
      ? { ...user, ...updatedUser }
      : user
  );
}

/**
 * Shared avatar renderer for the table, mobile cards, and detail drawer.
 * Real profileImageUrl values are displayed when present; otherwise initials
 * provide a consistent and honest visual fallback.
 */
function MemberAvatar({ user, size = "default" }) {
  const name = getMemberName(user);

  return (
    <span
      className={`elite-admin-users__avatar elite-admin-users__avatar--${size}`}
    >
      {user?.profileImageUrl ? (
        <img src={user.profileImageUrl} alt={`${name} profile`} />
      ) : (
        <span aria-hidden="true">{getMemberInitials(user)}</span>
      )}
    </span>
  );
}

/**
 * Restrained role badge. Roles remain explicit text so status is never
 * communicated through color alone.
 */
function RoleBadge({ role }) {
  return (
    <span
      className={`elite-admin-users__badge elite-admin-users__badge--role-${
        role || "unknown"
      }`}
    >
      {role || "Unknown"}
    </span>
  );
}

/**
 * Restrained account-status badge for ACTIVE/SUSPENDED backend values.
 */
function StatusBadge({ status }) {
  const normalizedStatus = status || "Unknown";

  return (
    <span
      className={`elite-admin-users__badge elite-admin-users__badge--status-${normalizedStatus}`}
    >
      {normalizedStatus}
    </span>
  );
}

/**
 * Shows the backend's email verification boolean without crowding the
 * directory table. Text remains present for accessible, non-color status.
 */
function VerificationState({ user }) {
  const verified = Boolean(user?.emailVerified);

  return (
    <span
      className={`elite-admin-users__verification${
        verified ? " elite-admin-users__verification--verified" : ""
      }`}
    >
      <CheckCircle2 size={15} aria-hidden="true" />
      {verified ? "Email verified" : "Email pending"}
    </span>
  );
}

/**
 * Displays one row in the desktop directory table. Mutating controls are kept
 * close to Inspect so Admins can review before changing account standing.
 */
function UserTableRow({
  currentAdminId,
  onInspect,
  onStatusRequest,
  user,
}) {
  const name = getMemberName(user);
  const statusAction = getStatusAction(user, currentAdminId);
  const StatusActionIcon = statusAction?.icon;

  return (
    <tr>
      <td>
        <div className="elite-admin-users__member">
          <MemberAvatar user={user} />
          <span>
            <strong>{name}</strong>
            <small>{user?.email || "No email provided"}</small>
          </span>
        </div>
      </td>
      <td>
        <RoleBadge role={user?.role} />
      </td>
      <td>
        <div className="elite-admin-users__contact-stack">
          <span>{user?.phoneNumber || "No phone on file"}</span>
          <small>{user?.location || "No location provided"}</small>
        </div>
      </td>
      <td>
        <VerificationState user={user} />
      </td>
      <td>
        <StatusBadge status={user?.accountStatus} />
      </td>
      <td>
        <div className="elite-admin-users__actions">
          <button type="button" onClick={() => onInspect(user)}>
            <Eye size={16} aria-hidden="true" />
            Inspect
          </button>
          {statusAction && (
            <button
              type="button"
              className={`elite-admin-users__status-button elite-admin-users__status-button--${statusAction.tone}`}
              onClick={() => onStatusRequest(user, statusAction.targetStatus)}
            >
              <StatusActionIcon size={16} aria-hidden="true" />
              {statusAction.label}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

/**
 * Mobile member row. The desktop table is intentionally replaced at narrow
 * widths so account controls stay tappable and readable.
 */
function UserMobileCard({
  currentAdminId,
  onInspect,
  onStatusRequest,
  user,
}) {
  const name = getMemberName(user);
  const statusAction = getStatusAction(user, currentAdminId);
  const StatusActionIcon = statusAction?.icon;

  return (
    <article className="elite-admin-users__mobile-card">
      <div className="elite-admin-users__mobile-card-header">
        <MemberAvatar user={user} />
        <span>
          <strong>{name}</strong>
          <small>{user?.email || "No email provided"}</small>
        </span>
      </div>

      <div className="elite-admin-users__mobile-card-meta">
        <RoleBadge role={user?.role} />
        <StatusBadge status={user?.accountStatus} />
        <VerificationState user={user} />
      </div>

      <div className="elite-admin-users__mobile-card-detail">
        <span>{user?.phoneNumber || "No phone on file"}</span>
        <span>{user?.location || "No location provided"}</span>
      </div>

      <div className="elite-admin-users__actions">
        <button type="button" onClick={() => onInspect(user)}>
          <Eye size={16} aria-hidden="true" />
          Inspect
        </button>
        {statusAction && (
          <button
            type="button"
            className={`elite-admin-users__status-button elite-admin-users__status-button--${statusAction.tone}`}
            onClick={() => onStatusRequest(user, statusAction.targetStatus)}
          >
            <StatusActionIcon size={16} aria-hidden="true" />
            {statusAction.label}
          </button>
        )}
      </div>
    </article>
  );
}

/**
 * Lightweight skeleton rows prevent the page from flashing empty values while
 * authenticated Admin data is still loading.
 */
function DirectorySkeleton() {
  return (
    <div className="elite-admin-users__skeleton" aria-label="Loading users">
      {Array.from({ length: 6 }).map((_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}

/**
 * Detail drawer uses the authoritative GET /admin/users/{id} response.
 * It exposes only fields defined by AdminUserResponse and keeps HOST-only
 * onboarding context hidden for non-host accounts.
 */
function UserDetailDrawer({
  currentAdminId,
  detailState,
  onClose,
  onStatusRequest,
}) {
  const detailUser = detailState.user;
  const name = getMemberName(detailUser);
  const statusAction = getStatusAction(detailUser, currentAdminId);
  const StatusActionIcon = statusAction?.icon;

  return (
    <div className="elite-admin-users__overlay" role="presentation">
      <aside
        aria-labelledby="admin-user-detail-title"
        aria-modal="true"
        className="elite-admin-users__drawer"
        role="dialog"
      >
        <button
          aria-label="Close user detail"
          className="elite-admin-users__drawer-close"
          onClick={onClose}
          type="button"
        >
          <X size={18} aria-hidden="true" />
        </button>

        {detailState.loading && (
          <div className="elite-admin-users__drawer-state" role="status">
            <RefreshCw size={22} aria-hidden="true" />
            Loading member profile...
          </div>
        )}

        {!detailState.loading && detailState.error && (
          <div className="elite-admin-users__drawer-state" role="alert">
            <AlertTriangle size={22} aria-hidden="true" />
            {detailState.error}
          </div>
        )}

        {!detailState.loading && detailUser && (
          <>
            <header className="elite-admin-users__drawer-header">
              <MemberAvatar user={detailUser} size="large" />
              <span>Member profile</span>
              <h3 id="admin-user-detail-title">{name}</h3>
              <p>
                Account information is sourced from the Admin user profile
                endpoint and shown without adding unsupported profile claims.
              </p>
              <div className="elite-admin-users__drawer-badges">
                <RoleBadge role={detailUser.role} />
                <StatusBadge status={detailUser.accountStatus} />
              </div>
            </header>

            <section
              aria-label="Member contact and standing"
              className="elite-admin-users__detail-grid"
            >
              <div>
                <Mail size={17} aria-hidden="true" />
                <span>
                  <small>Email</small>
                  {detailUser.email || "No email provided"}
                </span>
              </div>
              <div>
                <Phone size={17} aria-hidden="true" />
                <span>
                  <small>Phone</small>
                  {detailUser.phoneNumber || "No phone on file"}
                </span>
              </div>
              <div>
                <MapPin size={17} aria-hidden="true" />
                <span>
                  <small>Location</small>
                  {detailUser.location || "No location provided"}
                </span>
              </div>
              <div>
                <ShieldCheck size={17} aria-hidden="true" />
                <span>
                  <small>Email verification</small>
                  {detailUser.emailVerified ? "Verified" : "Pending"}
                </span>
              </div>
              {detailUser.role === "HOST" && (
                <div>
                  <CheckCircle2 size={17} aria-hidden="true" />
                  <span>
                    <small>Host onboarding</small>
                    {detailUser.hostOnboardingCompleted
                      ? "Completed"
                      : "Incomplete"}
                  </span>
                </div>
              )}
            </section>

            <section className="elite-admin-users__account-controls">
              <span>Account standing</span>
              <h4>Status control</h4>
              {detailUser.role === "ADMIN" ? (
                <p>
                  Admin accounts are protected from status changes in this
                  endpoint. Use the backend-governed Admin access process for
                  elevated accounts.
                </p>
              ) : statusAction ? (
                <>
                  <p>
                    Status changes are confirmed by the backend and preserve the
                    member record for audit and history.
                  </p>
                  <button
                    className={`elite-admin-users__primary-action elite-admin-users__primary-action--${statusAction.tone}`}
                    onClick={() =>
                      onStatusRequest(detailUser, statusAction.targetStatus)
                    }
                    type="button"
                  >
                    <StatusActionIcon size={17} aria-hidden="true" />
                    {statusAction.label} account
                  </button>
                </>
              ) : (
                <p>
                  This account cannot be modified from the current Admin
                  session.
                </p>
              )}
            </section>
          </>
        )}
      </aside>
    </div>
  );
}

/**
 * Confirmation dialog protects the destructive suspension path and keeps
 * reactivation explicit. The backend remains the authority for ownership,
 * Admin restrictions, and valid status transitions.
 */
function StatusConfirmationDialog({
  actionUser,
  error,
  loading,
  onCancel,
  onConfirm,
  targetStatus,
}) {
  if (!actionUser) return null;

  const name = getMemberName(actionUser);
  const suspending = targetStatus === "SUSPENDED";

  return (
    <div className="elite-admin-users__confirm-overlay" role="presentation">
      <section
        aria-labelledby="admin-user-status-title"
        aria-modal="true"
        className="elite-admin-users__confirm"
        role="dialog"
      >
        <span className="elite-admin-users__confirm-icon" aria-hidden="true">
          {suspending ? <Ban size={22} /> : <RotateCcw size={22} />}
        </span>
        <h3 id="admin-user-status-title">
          {suspending ? "Suspend this account?" : "Reactivate this account?"}
        </h3>
        <p>
          {suspending
            ? `${name} will lose authenticated access after the backend confirms this status change.`
            : `${name} will regain authenticated access after the backend confirms this status change.`}
        </p>
        <p>
          The member record stays in EliteBNB history; this action changes
          standing only.
        </p>
        {error && (
          <div className="elite-admin-users__confirm-error" role="alert">
            <AlertTriangle size={16} aria-hidden="true" />
            {error}
          </div>
        )}
        <div className="elite-admin-users__confirm-actions">
          <button disabled={loading} onClick={onCancel} type="button">
            Keep current standing
          </button>
          <button
            className={suspending ? "is-danger" : "is-positive"}
            disabled={loading}
            onClick={onConfirm}
            type="button"
          >
            {loading
              ? "Updating..."
              : suspending
                ? "Suspend account"
                : "Reactivate account"}
          </button>
        </div>
      </section>
    </div>
  );
}

/**
 * Phase 3 Admin user directory.
 * This page connects only to the finalized Admin account-management endpoints:
 * list users, inspect one user, and update ACTIVE/SUSPENDED account status.
 */
export default function Users() {
  const { user: currentAdmin } = useAuth();
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [directoryState, setDirectoryState] = useState(initialDirectoryState);
  const [detailState, setDetailState] = useState({
    error: "",
    loading: false,
    open: false,
    user: null,
  });
  const [pendingFilters, setPendingFilters] = useState(emptyFilters);
  const [reloadToken, setReloadToken] = useState(0);
  const [statusRequest, setStatusRequest] = useState(null);
  const [mutationState, setMutationState] = useState({
    error: "",
    loading: false,
    success: "",
  });

  const hasActiveFilters = useMemo(
    () => Object.values(appliedFilters).some((value) => String(value).trim()),
    [appliedFilters]
  );
  const totalLabel = directoryState.loading
    ? "Loading members"
    : `${directoryState.users.length} ${
        directoryState.users.length === 1 ? "member" : "members"
      }${hasActiveFilters ? " matching filters" : ""}`;

  useBodyScrollLock(detailState.open || Boolean(statusRequest));

  useEffect(() => {
    let active = true;

    async function loadUsers() {
      try {
        const response = await adminService.getUsers(buildUserQuery(appliedFilters));

        if (!active) return;

        setDirectoryState({
          error: "",
          loading: false,
          users: normalizeUsersResponse(response.data),
        });
      } catch (error) {
        if (!active) return;

        setDirectoryState({
          error: getErrorMessage(
            error,
            "Unable to load EliteBNB member accounts."
          ),
          loading: false,
          users: [],
        });
      }
    }

    loadUsers();

    return () => {
      active = false;
    };
  }, [appliedFilters, reloadToken]);

  /**
   * Applies backend-supported filters explicitly instead of firing a network
   * request on every keystroke.
   */
  const handleFilterSubmit = (event) => {
    event.preventDefault();
    setMutationState({ error: "", loading: false, success: "" });
    setDirectoryState((current) => ({ ...current, error: "", loading: true }));
    setAppliedFilters({ ...pendingFilters });
  };

  /**
   * Keeps form edits local until Apply filters is submitted, avoiding noisy
   * request traffic while an Admin is still typing.
   */
  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setPendingFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /**
   * Resets both the local form state and the backend query state so the next
   * directory load returns the unfiltered account list.
   */
  const handleClearFilters = () => {
    setPendingFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setMutationState({ error: "", loading: false, success: "" });
    setDirectoryState((current) => ({ ...current, error: "", loading: true }));
  };

  /**
   * Reloads the current backend-filtered directory without changing the filter
   * form. This lets Admins retry transient API failures safely.
   */
  const handleRetry = () => {
    setMutationState({ error: "", loading: false, success: "" });
    setDirectoryState((current) => ({ ...current, error: "", loading: true }));
    setReloadToken((current) => current + 1);
  };

  /**
   * Opens the drawer with the row data immediately, then replaces it with the
   * authoritative detail response from GET /admin/users/{id}.
   */
  const handleOpenDetail = useCallback(async (member) => {
    setDetailState({
      error: "",
      loading: true,
      open: true,
      user: member,
    });

    try {
      const response = await adminService.getUserById(member.id);
      const detailUser = normalizeUserResponse(response.data);

      setDetailState({
        error: "",
        loading: false,
        open: true,
        user: detailUser || member,
      });
    } catch (error) {
      setDetailState({
        error: getErrorMessage(error, "Unable to load this member profile."),
        loading: false,
        open: true,
        user: member,
      });
    }
  }, []);

  /**
   * Clears detail state so the next opened member always starts with a fresh
   * loading/error lifecycle.
   */
  const handleCloseDetail = () => {
    setDetailState({
      error: "",
      loading: false,
      open: false,
      user: null,
    });
  };

  /**
   * Stores the intended ACTIVE/SUSPENDED transition until the Admin confirms it
   * in the modal. No backend mutation happens from the row button itself.
   */
  const handleStatusRequest = (member, targetStatus) => {
    setMutationState({ error: "", loading: false, success: "" });
    setStatusRequest({
      targetStatus,
      user: member,
    });
  };

  /**
   * Allows the confirmation modal to close only while no mutation is in flight,
   * preventing duplicate or ambiguous status submissions.
   */
  const handleCancelStatusRequest = () => {
    if (mutationState.loading) return;
    setStatusRequest(null);
  };

  /**
   * Sends the backend-supported status body and waits for confirmation before
   * updating the directory. The backend enforces Admin/self restrictions.
   */
  const handleConfirmStatusChange = async () => {
    if (!statusRequest) return;

    setMutationState({ error: "", loading: true, success: "" });

    try {
      const response = await adminService.updateUserStatus(statusRequest.user.id, {
        status: statusRequest.targetStatus,
      });
      const updatedUser = normalizeUserResponse(response.data);
      const successName = getMemberName(updatedUser || statusRequest.user);

      if (updatedUser) {
        setDirectoryState((current) => ({
          ...current,
          users: mergeUpdatedUser(current.users, updatedUser),
        }));

        setDetailState((current) => ({
          ...current,
          user:
            current.user && String(current.user.id) === String(updatedUser.id)
              ? { ...current.user, ...updatedUser }
              : current.user,
        }));
      }

      setStatusRequest(null);
      setMutationState({
        error: "",
        loading: false,
        success: `${successName} is now ${statusRequest.targetStatus.toLowerCase()}.`,
      });

      /* Refetch after the optimistic merge so filtered directories stay honest
         if the changed status no longer matches the active backend filter. */
      setReloadToken((current) => current + 1);
    } catch (error) {
      setMutationState({
        error: getErrorMessage(
          error,
          "Unable to update this account status."
        ),
        loading: false,
        success: "",
      });
    }
  };

  return (
    <section className="elite-admin-users" aria-labelledby="admin-users-title">
      <header className="elite-admin-users__header">
        <div>
          <span>Account operations</span>
          <h2 id="admin-users-title">Users</h2>
          <p>
            Review EliteBNB member access, inspect account standing, and manage
            ACTIVE or SUSPENDED status for customer and host accounts.
          </p>
        </div>
        <aside aria-label="Loaded member count">
          <UserRound size={22} aria-hidden="true" />
          <strong>{totalLabel}</strong>
          <small>Live Admin directory</small>
        </aside>
      </header>

      <form
        className="elite-admin-users__filters"
        onSubmit={handleFilterSubmit}
      >
        <div className="elite-admin-users__search-field">
          <Search size={17} aria-hidden="true" />
          <label htmlFor="admin-user-search">Search members</label>
          <input
            id="admin-user-search"
            name="search"
            onChange={handleFilterChange}
            placeholder="Name, email, or backend-supported text"
            type="search"
            value={pendingFilters.search}
          />
        </div>

        <label className="elite-admin-users__select-field">
          <span>Role</span>
          <select
            name="role"
            onChange={handleFilterChange}
            value={pendingFilters.role}
          >
            <option value="">All roles</option>
            <option value="USER">USER</option>
            <option value="HOST">HOST</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </label>

        <label className="elite-admin-users__select-field">
          <span>Status</span>
          <select
            name="status"
            onChange={handleFilterChange}
            value={pendingFilters.status}
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
        </label>

        <div className="elite-admin-users__filter-actions">
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

      {mutationState.error && (
        <div className="elite-admin-users__feedback is-error" role="alert">
          <AlertTriangle size={17} aria-hidden="true" />
          {mutationState.error}
        </div>
      )}
      {mutationState.success && (
        <div className="elite-admin-users__feedback is-success" role="status">
          <CheckCircle2 size={17} aria-hidden="true" />
          {mutationState.success}
        </div>
      )}

      <section
        className="elite-admin-users__directory"
        aria-label="User directory"
      >
        <div className="elite-admin-users__directory-heading">
          <span>Member directory</span>
          <button
            aria-label="Refresh user directory"
            disabled={directoryState.loading}
            onClick={handleRetry}
            type="button"
          >
            <RefreshCw size={16} aria-hidden="true" />
            Refresh
          </button>
        </div>

        {directoryState.loading && <DirectorySkeleton />}

        {!directoryState.loading && directoryState.error && (
          <div className="elite-admin-users__empty-state" role="alert">
            <AlertTriangle size={24} aria-hidden="true" />
            <h3>Unable to load users</h3>
            <p>{directoryState.error}</p>
            <button onClick={handleRetry} type="button">
              Retry
            </button>
          </div>
        )}

        {!directoryState.loading &&
          !directoryState.error &&
          directoryState.users.length === 0 && (
            <div className="elite-admin-users__empty-state" role="status">
              <UserRound size={24} aria-hidden="true" />
              <h3>{hasActiveFilters ? "No matching members" : "No users yet"}</h3>
              <p>
                {hasActiveFilters
                  ? "No account matched the current backend filters."
                  : "The backend returned an empty EliteBNB member directory."}
              </p>
              {hasActiveFilters && (
                <button onClick={handleClearFilters} type="button">
                  Clear filters
                </button>
              )}
            </div>
          )}

        {!directoryState.loading &&
          !directoryState.error &&
          directoryState.users.length > 0 && (
            <>
              <div className="elite-admin-users__table-wrap">
                <table className="elite-admin-users__table">
                  <thead>
                    <tr>
                      <th scope="col">Member</th>
                      <th scope="col">Role</th>
                      <th scope="col">Contact / location</th>
                      <th scope="col">Verification</th>
                      <th scope="col">Account status</th>
                      <th scope="col">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {directoryState.users.map((member) => (
                      <UserTableRow
                        currentAdminId={currentAdmin?.id}
                        key={member.id || member.email}
                        onInspect={handleOpenDetail}
                        onStatusRequest={handleStatusRequest}
                        user={member}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="elite-admin-users__mobile-list">
                {directoryState.users.map((member) => (
                  <UserMobileCard
                    currentAdminId={currentAdmin?.id}
                    key={member.id || member.email}
                    onInspect={handleOpenDetail}
                    onStatusRequest={handleStatusRequest}
                    user={member}
                  />
                ))}
              </div>
            </>
          )}
      </section>

      {detailState.open && (
        <UserDetailDrawer
          currentAdminId={currentAdmin?.id}
          detailState={detailState}
          onClose={handleCloseDetail}
          onStatusRequest={handleStatusRequest}
        />
      )}

      <StatusConfirmationDialog
        actionUser={statusRequest?.user}
        error={mutationState.error}
        loading={mutationState.loading}
        onCancel={handleCancelStatusRequest}
        onConfirm={handleConfirmStatusChange}
        targetStatus={statusRequest?.targetStatus}
      />
    </section>
  );
}
