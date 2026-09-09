import {
  AlertTriangle,
  Bell,
  Building2,
  CheckCircle2,
  Clock3,
  Eye,
  FileSearch,
  Inbox,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Tag,
  WalletCards,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { adminService } from "../../services/adminService";
import "./Notifications.css";

const emptyFilters = {
  read: "",
  type: "",
};

const initialNotificationState = {
  error: "",
  loading: true,
  notifications: [],
};

const notificationTypes = [
  "NEW_REPORT",
  "PROPERTY_APPROVAL_REQUEST",
  "HOST_VERIFICATION_REQUEST",
  "REFUND_REQUEST",
  "SYSTEM",
];

/**
 * Builds a query using only the finalized Admin notification filters. There is
 * no Admin notification search, pagination, sorting, date range, or preference
 * endpoint, so this helper deliberately omits them.
 */
function buildNotificationQuery(filters) {
  const query = {};

  if (filters.read !== "") {
    query.read = filters.read;
  }

  if (filters.type) {
    query.type = filters.type;
  }

  return query;
}

/**
 * Accepts the finalized array response while tolerating conventional wrappers
 * if the backend later nests notification records under a collection key.
 */
function normalizeNotificationList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.notifications)) return payload.notifications;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;

  return [];
}

/**
 * Normalizes the unread-count endpoint. The finalized backend returns a number,
 * but this tolerance avoids fabricating unread state if a wrapper is introduced.
 */
function normalizeUnreadCount(payload) {
  const rawCount =
    typeof payload === "number"
      ? payload
      : payload?.count ?? payload?.unreadCount;
  const parsedCount = Number(rawCount);

  return Number.isFinite(parsedCount) && parsedCount > 0 ? parsedCount : 0;
}

/**
 * Pulls a concise, operator-safe message from Axios/backend failures.
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
 * Converts backend enum values into readable labels while preserving raw enum
 * strings for API requests and comparisons.
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
 * Formats notification timestamps without inventing priority or freshness
 * metrics that the backend does not return.
 */
function formatDateTime(value) {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not recorded";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Keeps feed rows compact while the detail modal preserves the complete
 * backend-authored notification message.
 */
function truncateText(value, maxLength = 150) {
  if (!value) return "No message recorded";

  const text = String(value);
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text;
}

/**
 * Builds a truthful target label from targetType and targetId only. The
 * notification contract does not guarantee safe route formation for targets.
 */
function getTargetLabel(notification) {
  if (!notification?.targetType && !notification?.targetId) {
    return "No target metadata";
  }

  const type = notification?.targetType
    ? formatEnum(notification.targetType)
    : "Target";

  return notification?.targetId ? `${type} #${notification.targetId}` : type;
}

/**
 * Renders type icons through static branches so React compiler rules do not see
 * dynamic component construction during render.
 */
function renderTypeIcon(type, size = 15) {
  if (type === "NEW_REPORT") return <FileSearch size={size} aria-hidden="true" />;
  if (type === "PROPERTY_APPROVAL_REQUEST") {
    return <Building2 size={size} aria-hidden="true" />;
  }
  if (type === "HOST_VERIFICATION_REQUEST") {
    return <ShieldCheck size={size} aria-hidden="true" />;
  }
  if (type === "REFUND_REQUEST") {
    return <WalletCards size={size} aria-hidden="true" />;
  }

  return <Bell size={size} aria-hidden="true" />;
}

/**
 * Human-readable notification type metadata. Type is not a status, so the
 * styling stays restrained and informational.
 */
function NotificationTypeBadge({ type }) {
  const normalizedType = type || "SYSTEM";

  return (
    <span
      className={`elite-admin-notifications__badge elite-admin-notifications__badge--${normalizedType}`}
    >
      {renderTypeIcon(normalizedType)}
      {formatEnum(normalizedType)}
    </span>
  );
}

/**
 * Textual read-state badge ensures unread state is never communicated by color
 * alone.
 */
function ReadStateBadge({ read }) {
  return (
    <span
      className={`elite-admin-notifications__read-state${
        read ? " is-read" : " is-unread"
      }`}
    >
      {read ? <CheckCircle2 size={14} aria-hidden="true" /> : <Clock3 size={14} aria-hidden="true" />}
      {read ? "Read" : "Unread"}
    </span>
  );
}

/**
 * One notification row in the Admin signal feed. Unread records expose only a
 * backend-supported Mark as read action; already-read records do not pretend a
 * mark-unread endpoint exists.
 */
function NotificationFeedItem({
  actionBusy,
  notification,
  onInspect,
  onMarkRead,
}) {
  const unread = !notification.read;

  return (
    <article
      className={`elite-admin-notifications__item${
        unread ? " is-unread" : " is-read"
      }`}
      role="listitem"
    >
      <div className="elite-admin-notifications__signal">
        <span aria-hidden="true" />
        <div>
          <NotificationTypeBadge type={notification.type} />
          <ReadStateBadge read={notification.read} />
        </div>
      </div>

      <div className="elite-admin-notifications__message">
        <h3>{notification.title || "Untitled notification"}</h3>
        <p title={notification.message || ""}>
          {truncateText(notification.message)}
        </p>
        <small>
          <Tag size={14} aria-hidden="true" />
          {getTargetLabel(notification)}
        </small>
      </div>

      <div className="elite-admin-notifications__time">
        <span>Received</span>
        <strong>{formatDateTime(notification.createdAt)}</strong>
      </div>

      <div className="elite-admin-notifications__actions">
        <button onClick={() => onInspect(notification)} type="button">
          <Eye size={16} aria-hidden="true" />
          Details
        </button>

        {unread && (
          <button
            disabled={actionBusy}
            onClick={() => onMarkRead(notification)}
            type="button"
          >
            <CheckCircle2 size={16} aria-hidden="true" />
            {actionBusy ? "Updating..." : "Mark as read"}
          </button>
        )}
      </div>
    </article>
  );
}

/**
 * Mobile notification card keeps the same backend fields readable without
 * squeezing a dense desktop row into a narrow viewport.
 */
function NotificationMobileCard({
  actionBusy,
  notification,
  onInspect,
  onMarkRead,
}) {
  const unread = !notification.read;

  return (
    <article
      className={`elite-admin-notifications__mobile-card${
        unread ? " is-unread" : " is-read"
      }`}
    >
      <div className="elite-admin-notifications__mobile-topline">
        <NotificationTypeBadge type={notification.type} />
        <ReadStateBadge read={notification.read} />
      </div>
      <h3>{notification.title || "Untitled notification"}</h3>
      <p title={notification.message || ""}>{truncateText(notification.message)}</p>
      <dl>
        <div>
          <dt>Target</dt>
          <dd>{getTargetLabel(notification)}</dd>
        </div>
        <div>
          <dt>Received</dt>
          <dd>{formatDateTime(notification.createdAt)}</dd>
        </div>
      </dl>
      <div className="elite-admin-notifications__mobile-actions">
        <button onClick={() => onInspect(notification)} type="button">
          <Eye size={16} aria-hidden="true" />
          Details
        </button>
        {unread && (
          <button
            disabled={actionBusy}
            onClick={() => onMarkRead(notification)}
            type="button"
          >
            <CheckCircle2 size={16} aria-hidden="true" />
            {actionBusy ? "Updating..." : "Mark read"}
          </button>
        )}
      </div>
    </article>
  );
}

/**
 * Detail field for the loaded-record modal. There is no GET-by-id endpoint, so
 * the modal uses only the notification object already returned by the feed.
 */
function DetailItem({ label, value }) {
  const hasValue = value !== null && value !== undefined && value !== "";

  return (
    <div className="elite-admin-notifications__detail-item">
      <span>{label}</span>
      <strong>{hasValue ? value : "Not provided"}</strong>
    </div>
  );
}

/**
 * Viewport-safe detail modal. It improves readability for long messages
 * without inventing a notification detail endpoint or target navigation.
 */
function NotificationDetailModal({
  actionBusy,
  notification,
  onClose,
  onMarkRead,
}) {
  if (!notification) return null;

  return (
    <div className="elite-admin-notifications__modal-overlay" role="presentation">
      <section
        aria-labelledby="admin-notification-detail-title"
        aria-modal="true"
        className="elite-admin-notifications__modal"
        role="dialog"
      >
        <button
          aria-label="Close notification details"
          className="elite-admin-notifications__modal-close"
          onClick={onClose}
          type="button"
        >
          <X size={19} aria-hidden="true" />
        </button>

        <header className="elite-admin-notifications__modal-header">
          <span>Signal detail</span>
          <h3 id="admin-notification-detail-title">
            {notification.title || "Untitled notification"}
          </h3>
          <div className="elite-admin-notifications__modal-badges">
            <NotificationTypeBadge type={notification.type} />
            <ReadStateBadge read={notification.read} />
          </div>
        </header>

        <section className="elite-admin-notifications__detail-section">
          <span>Message</span>
          <p>{notification.message || "No message was recorded."}</p>
        </section>

        <section className="elite-admin-notifications__detail-section">
          <span>Metadata</span>
          <div className="elite-admin-notifications__detail-grid">
            <DetailItem label="Notification ID" value={notification.id} />
            <DetailItem label="Type" value={formatEnum(notification.type)} />
            <DetailItem
              label="Read state"
              value={notification.read ? "Read" : "Unread"}
            />
            <DetailItem
              label="Created"
              value={formatDateTime(notification.createdAt)}
            />
            <DetailItem label="Target type" value={notification.targetType} />
            <DetailItem label="Target ID" value={notification.targetId} />
          </div>
        </section>

        <section className="elite-admin-notifications__target-note">
          <span>Target context</span>
          <p>
            {getTargetLabel(notification)} is displayed as backend metadata
            only. This phase does not guess target routes or hydrate linked
            records.
          </p>
        </section>

        {!notification.read && (
          <div className="elite-admin-notifications__modal-actions">
            <button
              disabled={actionBusy}
              onClick={() => onMarkRead(notification)}
              type="button"
            >
              <CheckCircle2 size={16} aria-hidden="true" />
              {actionBusy ? "Updating..." : "Mark this notification as read"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * Phase 11 Admin Notifications workspace.
 * It provides a real backend-backed signal feed, read-state actions, and shell
 * unread-count synchronization without adding unsupported notification CRUD.
 */
export default function Notifications({
  notificationUnreadCount = 0,
  onNotificationUnreadCountChange = () => {},
}) {
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [countState, setCountState] = useState({
    count: notificationUnreadCount,
    error: "",
    loading: true,
  });
  const [filterError, setFilterError] = useState("");
  const [mutationState, setMutationState] = useState({
    error: "",
    id: null,
    kind: "",
    loading: false,
    success: "",
  });
  const [notificationState, setNotificationState] = useState(
    initialNotificationState
  );
  const [pendingFilters, setPendingFilters] = useState(emptyFilters);
  const [reloadToken, setReloadToken] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const hasActiveFilters = useMemo(
    () => Object.values(appliedFilters).some((value) => String(value).trim()),
    [appliedFilters]
  );
  const totalLabel = notificationState.loading
    ? "Loading notifications"
    : `${notificationState.notifications.length} ${
        notificationState.notifications.length === 1
          ? "notification"
          : "notifications"
      }${hasActiveFilters ? " matching filters" : ""}`;
  const hasUnread = countState.count > 0;

  useBodyScrollLock(Boolean(selectedNotification));

  useEffect(() => {
    const parsedCount = Number(notificationUnreadCount);

    if (Number.isFinite(parsedCount)) {
      setCountState((current) => ({
        ...current,
        count: parsedCount > 0 ? parsedCount : 0,
      }));
    }
  }, [notificationUnreadCount]);

  useEffect(() => {
    let active = true;

    /**
     * Loads the filtered notification feed and the independent unread-count
     * signal together. Count failures do not hide the notification list.
     */
    async function loadNotifications() {
      const [listResult, countResult] = await Promise.allSettled([
        adminService.getNotifications(buildNotificationQuery(appliedFilters)),
        adminService.getNotificationUnreadCount(),
      ]);

      if (!active) return;

      if (listResult.status === "fulfilled") {
        setNotificationState({
          error: "",
          loading: false,
          notifications: normalizeNotificationList(listResult.value.data),
        });
      } else {
        setNotificationState({
          error: getErrorMessage(
            listResult.reason,
            "Unable to load Admin notifications."
          ),
          loading: false,
          notifications: [],
        });
      }

      if (countResult.status === "fulfilled") {
        const nextCount = normalizeUnreadCount(countResult.value.data);

        setCountState({
          count: nextCount,
          error: "",
          loading: false,
        });
        onNotificationUnreadCountChange(nextCount);
      } else {
        setCountState((current) => ({
          ...current,
          error: getErrorMessage(
            countResult.reason,
            "Unread count is temporarily unavailable."
          ),
          loading: false,
        }));
      }
    }

    setNotificationState((current) => ({
      ...current,
      error: "",
      loading: true,
    }));
    setCountState((current) => ({
      ...current,
      error: "",
      loading: true,
    }));
    loadNotifications();

    return () => {
      active = false;
    };
  }, [appliedFilters, onNotificationUnreadCountChange, reloadToken]);

  /**
   * Refreshes only the unread count after read mutations. The full list is also
   * refetched through reloadToken so filtered views stay backend-authoritative.
   */
  const refreshUnreadCount = async () => {
    try {
      const response = await adminService.getNotificationUnreadCount();
      const nextCount = normalizeUnreadCount(response.data);

      setCountState({
        count: nextCount,
        error: "",
        loading: false,
      });
      onNotificationUnreadCountChange(nextCount);
    } catch (error) {
      setCountState((current) => ({
        ...current,
        error: getErrorMessage(
          error,
          "Unread count is temporarily unavailable."
        ),
        loading: false,
      }));
    }
  };

  /**
   * Applies only read/type filters. The backend does not support notification
   * search, so no text search control is exposed.
   */
  const handleFilterSubmit = (event) => {
    event.preventDefault();
    setFilterError("");
    setMutationState({
      error: "",
      id: null,
      kind: "",
      loading: false,
      success: "",
    });
    setNotificationState((current) => ({
      ...current,
      error: "",
      loading: true,
    }));
    setAppliedFilters({ ...pendingFilters });
  };

  /**
   * Keeps filter edits local until Apply filters is submitted.
   */
  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setPendingFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /**
   * Clears the visible filters and active backend query.
   */
  const handleClearFilters = () => {
    setPendingFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setFilterError("");
    setMutationState({
      error: "",
      id: null,
      kind: "",
      loading: false,
      success: "",
    });
    setNotificationState((current) => ({
      ...current,
      error: "",
      loading: true,
    }));
  };

  /**
   * Retries the current filtered notification query.
   */
  const handleRetry = () => {
    setFilterError("");
    setMutationState({
      error: "",
      id: null,
      kind: "",
      loading: false,
      success: "",
    });
    setNotificationState((current) => ({
      ...current,
      error: "",
      loading: true,
    }));
    setReloadToken((current) => current + 1);
  };

  /**
   * Opens a detail modal from the already-loaded notification record. There is
   * intentionally no detail API request because none exists in the contract.
   */
  const handleInspect = (notification) => {
    setSelectedNotification(notification);
  };

  /**
   * Marks one notification read using the backend endpoint, then updates local
   * feed/detail state and refreshes the shared shell unread count.
   */
  const handleMarkRead = async (notification) => {
    if (!notification?.id || notification.read || mutationState.loading) return;

    setMutationState({
      error: "",
      id: notification.id,
      kind: "single",
      loading: true,
      success: "",
    });

    try {
      await adminService.markNotificationRead(notification.id);

      setNotificationState((current) => ({
        ...current,
        notifications: current.notifications.map((item) =>
          String(item.id) === String(notification.id)
            ? { ...item, read: true }
            : item
        ),
      }));
      setSelectedNotification((current) =>
        current?.id && String(current.id) === String(notification.id)
          ? { ...current, read: true }
          : current
      );
      await refreshUnreadCount();
      setMutationState({
        error: "",
        id: null,
        kind: "",
        loading: false,
        success: "Notification marked as read.",
      });
      setReloadToken((current) => current + 1);
    } catch (error) {
      setMutationState({
        error: getErrorMessage(error, "Unable to mark this notification read."),
        id: notification.id,
        kind: "single",
        loading: false,
        success: "",
      });
    }
  };

  /**
   * Marks all Admin notifications read through the dedicated backend endpoint.
   * It does not delete records or invent a mark-unread capability.
   */
  const handleMarkAllRead = async () => {
    if (!hasUnread || mutationState.loading) return;

    setMutationState({
      error: "",
      id: null,
      kind: "all",
      loading: true,
      success: "",
    });

    try {
      await adminService.markAllNotificationsRead();

      setNotificationState((current) => ({
        ...current,
        notifications: current.notifications.map((notification) => ({
          ...notification,
          read: true,
        })),
      }));
      setSelectedNotification((current) =>
        current ? { ...current, read: true } : current
      );
      await refreshUnreadCount();
      setMutationState({
        error: "",
        id: null,
        kind: "",
        loading: false,
        success: "All Admin notifications marked as read.",
      });
      setReloadToken((current) => current + 1);
    } catch (error) {
      setMutationState({
        error: getErrorMessage(
          error,
          "Unable to mark all notifications read."
        ),
        id: null,
        kind: "all",
        loading: false,
        success: "",
      });
    }
  };

  const isSingleMutationBusy = (notification) =>
    mutationState.loading &&
    mutationState.kind === "single" &&
    String(mutationState.id) === String(notification.id);
  const markAllBusy = mutationState.loading && mutationState.kind === "all";

  return (
    <main
      className="elite-admin-notifications"
      aria-labelledby="admin-notifications-title"
    >
      <header className="elite-admin-notifications__header">
        <div>
          <span>ADMIN SIGNALS</span>
          <h2 id="admin-notifications-title">Notifications</h2>
          <p>
            Review real EliteBNB operational signals, inspect the complete
            message, and keep Admin read state synchronized with the backend.
          </p>
        </div>
        <aside aria-label="Unread Admin notification count">
          <Bell size={22} aria-hidden="true" />
          <strong>
            {countState.loading
              ? "Checking unread"
              : `${countState.count} unread ${
                  countState.count === 1 ? "notification" : "notifications"
                }`}
          </strong>
          <small>
            {countState.error
              ? "Unread count unavailable"
              : "Real unread count from Admin notifications"}
          </small>
        </aside>
      </header>

      <form
        className="elite-admin-notifications__filters"
        onSubmit={handleFilterSubmit}
      >
        <div className="elite-admin-notifications__filter-row">
          <label className="elite-admin-notifications__select-field">
            <span>Read state</span>
            <select
              name="read"
              onChange={handleFilterChange}
              value={pendingFilters.read}
            >
              <option value="">All notifications</option>
              <option value="false">Unread</option>
              <option value="true">Read</option>
            </select>
          </label>

          <label className="elite-admin-notifications__select-field">
            <span>Type</span>
            <select
              name="type"
              onChange={handleFilterChange}
              value={pendingFilters.type}
            >
              <option value="">All types</option>
              {notificationTypes.map((type) => (
                <option key={type} value={type}>
                  {formatEnum(type)}
                </option>
              ))}
            </select>
          </label>

          <div className="elite-admin-notifications__filter-actions">
            <button type="submit">
              <SlidersHorizontal size={16} aria-hidden="true" />
              Apply filters
            </button>
            {hasActiveFilters && (
              <button onClick={handleClearFilters} type="button">
                Clear
              </button>
            )}
          </div>
        </div>

        {filterError && (
          <div className="elite-admin-notifications__filter-error" role="alert">
            <AlertTriangle size={16} aria-hidden="true" />
            {filterError}
          </div>
        )}
      </form>

      {(mutationState.success || mutationState.error || countState.error) && (
        <div
          className={`elite-admin-notifications__feedback${
            mutationState.error || countState.error ? " is-error" : ""
          }`}
          role={mutationState.error || countState.error ? "alert" : "status"}
        >
          {mutationState.error || countState.error ? (
            <AlertTriangle size={17} aria-hidden="true" />
          ) : (
            <CheckCircle2 size={17} aria-hidden="true" />
          )}
          {mutationState.error || countState.error || mutationState.success}
        </div>
      )}

      <section
        aria-label="Admin notification feed"
        className="elite-admin-notifications__feed"
      >
        <div className="elite-admin-notifications__feed-heading">
          <div>
            <span>Signal feed</span>
            <h3>{totalLabel}</h3>
          </div>
          <div className="elite-admin-notifications__feed-actions">
            <button onClick={handleRetry} type="button">
              <RefreshCw size={16} aria-hidden="true" />
              Refresh
            </button>
            {hasUnread && (
              <button
                disabled={markAllBusy}
                onClick={handleMarkAllRead}
                type="button"
              >
                <CheckCircle2 size={16} aria-hidden="true" />
                {markAllBusy ? "Updating..." : "Mark all as read"}
              </button>
            )}
          </div>
        </div>

        {notificationState.loading && (
          <div className="elite-admin-notifications__skeleton-list" role="status">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                className="elite-admin-notifications__skeleton-row"
                key={`notification-skeleton-${index}`}
              />
            ))}
            <span className="sr-only">Loading Admin notifications</span>
          </div>
        )}

        {!notificationState.loading && notificationState.error && (
          <div className="elite-admin-notifications__empty-state" role="alert">
            <AlertTriangle size={24} aria-hidden="true" />
            <h3>Notifications could not be loaded</h3>
            <p>{notificationState.error}</p>
            <button onClick={handleRetry} type="button">
              Retry notifications
            </button>
          </div>
        )}

        {!notificationState.loading &&
          !notificationState.error &&
          notificationState.notifications.length === 0 && (
            <div className="elite-admin-notifications__empty-state">
              <Inbox size={24} aria-hidden="true" />
              <h3>
                {hasActiveFilters
                  ? "No matching notifications"
                  : "No Admin notifications"}
              </h3>
              <p>
                {hasActiveFilters
                  ? "No notifications match the current backend-supported read/type filters."
                  : "The backend returned no Admin operational signals for this inbox."}
              </p>
              {hasActiveFilters && (
                <button onClick={handleClearFilters} type="button">
                  Clear filters
                </button>
              )}
            </div>
          )}

        {!notificationState.loading &&
          !notificationState.error &&
          notificationState.notifications.length > 0 && (
            <>
              <div className="elite-admin-notifications__list" role="list">
                {notificationState.notifications.map((notification) => (
                  <NotificationFeedItem
                    actionBusy={isSingleMutationBusy(notification)}
                    key={notification.id}
                    notification={notification}
                    onInspect={handleInspect}
                    onMarkRead={handleMarkRead}
                  />
                ))}
              </div>

              <div className="elite-admin-notifications__mobile-list">
                {notificationState.notifications.map((notification) => (
                  <NotificationMobileCard
                    actionBusy={isSingleMutationBusy(notification)}
                    key={notification.id}
                    notification={notification}
                    onInspect={handleInspect}
                    onMarkRead={handleMarkRead}
                  />
                ))}
              </div>
            </>
          )}
      </section>

      <NotificationDetailModal
        actionBusy={
          selectedNotification ? isSingleMutationBusy(selectedNotification) : false
        }
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
        onMarkRead={handleMarkRead}
      />
    </main>
  );
}
