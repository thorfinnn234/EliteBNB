import {
  ArrowRight,
  Bell,
  BellRing,
  CalendarDays,
  CheckCheck,
  CheckCircle2,
  Clock3,
  Loader2,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { publishNotificationUnreadCount } from "../../hooks/useNotificationUnreadCount";
import { notificationService } from "../../services/notificationService";

const notificationCopy = {
  user: {
    eyebrow: "USER",
    title: "Notifications",
    description:
      "Stay updated on your bookings, saved stays, messages and important EliteBNB account activity.",
    emptyTitle: "You're all caught up.",
    emptyBody:
      "When your bookings, trips, wishlist or account need attention, you'll see it here.",
  },
  host: {
    eyebrow: "HOST",
    title: "Notifications",
    description:
      "Stay updated on reservation activity and important changes to your EliteBNB account.",
    emptyTitle: "No new updates right now.",
    emptyBody:
      "When guests make reservation requests or important activity happens, you'll see it here.",
  },
};

/**
 * Counts unread rows from the list that came from the backend. Shell badges use
 * this value only after the list has been loaded or a mutation has succeeded.
 */
function countUnreadNotifications(notifications) {
  return notifications.filter((notification) => !notification.read).length;
}

/**
 * Turns backend timestamps into readable notification metadata. Invalid values
 * stay truthful instead of pretending a precise date is known.
 */
function formatNotificationDate(dateString) {
  if (!dateString) {
    return "Just now";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/**
 * Derives only routes that are backed by genuine IDs in NotificationResponse.
 * Message notifications do not expose conversationId/messageId today, so the
 * UI avoids guessing a conversation route from the notification text.
 */
function getNotificationActions(audience, notification) {
  if (audience === "user") {
    if (notification.bookingId) {
      return [
        {
          label: "Open reservation",
          to: `/user/trips/${notification.bookingId}`,
        },
      ];
    }

    if (notification.propertyId) {
      return [
        {
          label: "Open property",
          to: `/user/property/${notification.propertyId}`,
        },
      ];
    }

    return [];
  }

  if (notification.bookingId) {
    return [
      {
        label: "Open reservations",
        to: "/host/reservations",
      },
    ];
  }

  if (notification.propertyId) {
    return [
      {
        label: "Open listing",
        to: `/host/listings/${notification.propertyId}/edit`,
      },
    ];
  }

  return [];
}

/**
 * Renders the icon for known backend notification types without creating
 * dynamic component variables inside render.
 */
function NotificationTypeIcon({ type, ...props }) {
  switch (type) {
    case "NEW_BOOKING":
    case "BOOKING_REQUESTED":
      return <CalendarDays {...props} />;

    case "BOOKING_CONFIRMED":
    case "BOOKING_COMPLETED":
      return <CheckCircle2 {...props} />;

    case "BOOKING_CANCELLED":
      return <XCircle {...props} />;

    case "NEW_REVIEW":
    case "HOST_RESPONSE":
      return <BellRing {...props} />;

    default:
      return <Bell {...props} />;
  }
}

/**
 * Shows the full backend notification content in a viewport-fixed dialog.
 * The list may stay concise, but the modal does not truncate the message.
 */
function NotificationDetailModal({
  audience,
  isUpdating,
  notification,
  onClose,
}) {
  if (!notification) return null;

  const actions = getNotificationActions(audience, notification);
  const formattedDate = formatNotificationDate(notification.createdAt);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        aria-labelledby="notification-detail-title"
        aria-modal="true"
        className="relative max-h-[min(42rem,90dvh)] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/60 bg-white p-6 shadow-2xl md:p-8"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close notification"
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E7EB] text-[#172554] transition hover:border-[#D4A72C] hover:text-[#9b751b]"
          onClick={onClose}
        >
          <X size={18} aria-hidden="true" />
        </button>

        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#172554] text-[#D4A72C]">
          <NotificationTypeIcon
            type={notification.type}
            size={24}
            aria-hidden="true"
          />
        </span>

        <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-[#D4A72C]">
          {notification.type || "Notification"}
        </p>
        <h2
          id="notification-detail-title"
          className="mt-2 max-w-[15ch] font-serif text-4xl font-semibold leading-none text-[#172554] md:text-5xl"
        >
          {notification.title || "EliteBNB update"}
        </h2>

        <p className="mt-5 whitespace-pre-wrap text-base leading-8 text-[#475569]">
          {notification.message || "No additional details were provided."}
        </p>

        <dl className="mt-6 grid gap-3 rounded-2xl border border-[#E5E7EB] bg-[#FAF9F6] p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-bold uppercase tracking-[0.12em] text-[#94A3B8]">
              Date
            </dt>
            <dd className="mt-1 font-semibold text-[#172554]">
              {formattedDate}
            </dd>
          </div>

          <div>
            <dt className="font-bold uppercase tracking-[0.12em] text-[#94A3B8]">
              State
            </dt>
            <dd className="mt-1 font-semibold text-[#172554]">
              {notification.read ? "Read" : "Unread"}
              {isUpdating ? " · updating" : ""}
            </dd>
          </div>

          {notification.bookingId ? (
            <div>
              <dt className="font-bold uppercase tracking-[0.12em] text-[#94A3B8]">
                Booking
              </dt>
              <dd className="mt-1 font-semibold text-[#172554]">
                #{notification.bookingId}
              </dd>
            </div>
          ) : null}

          {notification.propertyId ? (
            <div>
              <dt className="font-bold uppercase tracking-[0.12em] text-[#94A3B8]">
                Property
              </dt>
              <dd className="mt-1 font-semibold text-[#172554]">
                #{notification.propertyId}
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          {actions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#172554] px-5 text-sm font-black text-white no-underline transition hover:bg-[#0f1e46]"
              onClick={onClose}
            >
              {action.label}
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          ))}
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#E5E7EB] px-5 text-sm font-black text-[#172554] transition hover:border-[#D4A72C]"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </section>
    </div>
  );
}

/**
 * Renders one notification row with a concise preview and separate icon-only
 * actions. Opening the row marks the notification read through the backend.
 */
function NotificationCard({
  notification,
  onDelete,
  onOpen,
  onRead,
  updating,
}) {
  const formattedDate = formatNotificationDate(notification.createdAt);

  return (
    <article
      className={`rounded-2xl border p-2 shadow-sm transition ${
        notification.read
          ? "border-[#E5E7EB] bg-white"
          : "border-[#D4A72C]/40 bg-[#fffdf7]"
      }`}
    >
      <div className="flex gap-3">
        <button
          type="button"
          className="flex min-w-0 flex-1 gap-4 rounded-xl p-3 text-left transition hover:bg-[#FAF9F6]"
          onClick={() => onOpen(notification)}
        >
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              notification.read
                ? "bg-[#F8FAFC] text-[#64748B]"
                : "bg-[#D4A72C]/10 text-[#D4A72C]"
            }`}
          >
            <NotificationTypeIcon
              type={notification.type}
              size={21}
              aria-hidden="true"
            />
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <strong className="truncate text-[#172554]">
                {notification.title || "EliteBNB update"}
              </strong>

              {!notification.read ? (
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#D4A72C]"
                  aria-label="Unread notification"
                />
              ) : null}
            </span>

            <span className="mt-2 line-clamp-2 block text-sm leading-6 text-[#64748B]">
              {notification.message || "No details provided."}
            </span>

            <span className="mt-3 flex items-center gap-2 text-xs text-[#94A3B8]">
              <Clock3 size={14} aria-hidden="true" />
              {formattedDate}
            </span>
          </span>
        </button>

        <div className="flex shrink-0 items-start gap-2 p-3 pl-0">
          {!notification.read ? (
            <button
              type="button"
              disabled={updating}
              onClick={() => onRead(notification.id)}
              title="Mark as read"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#172554] transition hover:border-[#D4A72C] hover:text-[#D4A72C] disabled:opacity-50"
            >
              {updating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCheck size={17} />
              )}
            </button>
          ) : null}

          <button
            type="button"
            disabled={updating}
            onClick={() => onDelete(notification.id)}
            title="Delete notification"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#94A3B8] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>
    </article>
  );
}

/**
 * Shared USER/HOST notification experience. Both roles use the same
 * `/notifications` backend contract, while the audience prop adjusts copy and
 * safe deep links without changing authentication or service behavior.
 */
export default function NotificationCenter({ audience = "user" }) {
  const copy = notificationCopy[audience] || notificationCopy.user;
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [error, setError] = useState("");
  const unreadCount = useMemo(
    () => countUnreadNotifications(notifications),
    [notifications]
  );

  useBodyScrollLock(Boolean(selectedNotification));

  const publishCountFromList = useCallback((nextNotifications) => {
    publishNotificationUnreadCount(countUnreadNotifications(nextNotifications));
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await notificationService.getAll();
      const nextNotifications = response.data || [];

      setNotifications(nextNotifications);
      publishCountFromList(nextNotifications);
    } catch (err) {
      console.error("Failed to load notifications:", err);

      setError(
        err.response?.data?.message || "Unable to load notifications."
      );
    } finally {
      setLoading(false);
    }
  }, [publishCountFromList]);

  useEffect(() => {
    let isCurrentEffect = true;

    window.queueMicrotask(() => {
      if (isCurrentEffect) {
        loadNotifications();
      }
    });

    return () => {
      isCurrentEffect = false;
    };
  }, [loadNotifications]);

  useEffect(() => {
    if (!selectedNotification) return undefined;

    /**
     * Keeps detail dialogs visible and dismissible without scrolling the page
     * back to the top. Long content scrolls inside the fixed dialog panel.
     */
    function handleEscape(event) {
      if (event.key === "Escape") {
        setSelectedNotification(null);
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => document.removeEventListener("keydown", handleEscape);
  }, [selectedNotification]);

  /**
   * Marks a notification as read after backend confirmation, then publishes the
   * new unread count so USER and HOST topbar indicators stay synchronized.
   */
  const handleMarkAsRead = async (notificationId, { keepModalOpen = false } = {}) => {
    try {
      setUpdatingId(notificationId);
      setError("");

      const response = await notificationService.markAsRead(notificationId);
      const updatedNotification = response.data;

      setNotifications((current) => {
        const nextNotifications = current.map((notification) => {
          if (notification.id !== notificationId) return notification;

          /*
           * The backend normally returns the updated NotificationResponse. If a
           * future implementation returns an empty success body, keep the
           * existing row content and only apply the confirmed read transition.
           */
          const nextNotification = updatedNotification
            ? { ...notification, ...updatedNotification, read: true }
            : { ...notification, read: true };

          return nextNotification;
        });

        publishCountFromList(nextNotifications);
        return nextNotifications;
      });

      if (keepModalOpen) {
        setSelectedNotification((currentNotification) => {
          if (!currentNotification || currentNotification.id !== notificationId) {
            return currentNotification;
          }

          return updatedNotification
            ? { ...currentNotification, ...updatedNotification, read: true }
            : { ...currentNotification, read: true };
        });
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);

      setError(
        err.response?.data?.message || "Unable to update notification."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  /**
   * Opens the detail modal immediately, then asks the backend to mark unread
   * notifications read. The UI avoids optimistic mutation so failed requests do
   * not falsely clear the unread indicator.
   */
  const handleOpenNotification = (notification) => {
    setSelectedNotification(notification);

    if (!notification.read) {
      handleMarkAsRead(notification.id, { keepModalOpen: true });
    }
  };

  /**
   * Uses the existing mark-all endpoint for both audiences. No local-only read
   * state is invented; the list updates only after the API request succeeds.
   */
  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAll(true);
      setError("");

      await notificationService.markAllAsRead();

      setNotifications((current) => {
        const nextNotifications = current.map((notification) => ({
          ...notification,
          read: true,
        }));

        publishCountFromList(nextNotifications);
        return nextNotifications;
      });
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);

      setError(
        err.response?.data?.message ||
          "Unable to mark all notifications as read."
      );
    } finally {
      setMarkingAll(false);
    }
  };

  /**
   * Deletes a notification through the backend and recalculates unread state
   * from the remaining confirmed list.
   */
  const handleDelete = async (notificationId) => {
    try {
      setUpdatingId(notificationId);
      setError("");

      await notificationService.delete(notificationId);

      setNotifications((current) => {
        const nextNotifications = current.filter(
          (notification) => notification.id !== notificationId
        );

        publishCountFromList(nextNotifications);
        return nextNotifications;
      });

      if (selectedNotification?.id === notificationId) {
        setSelectedNotification(null);
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);

      setError(
        err.response?.data?.message || "Unable to delete notification."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen bg-[#FAF9F6] p-5 md:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-[#E5E7EB] bg-white">
            <div className="text-center">
              <Loader2
                size={30}
                className="mx-auto animate-spin text-[#D4A72C]"
              />

              <p className="mt-3 font-medium text-[#64748B]">
                Loading notifications...
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#FAF9F6] p-5 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#D4A72C]">
              {copy.eyebrow}
            </p>

            <h1 className="mt-2 text-3xl font-extrabold text-[#172554] md:text-4xl">
              {copy.title}
            </h1>

            <p className="mt-2 max-w-2xl text-[#64748B]">
              {copy.description}
            </p>
          </div>

          {notifications.length > 0 && unreadCount > 0 ? (
            <button
              type="button"
              disabled={markingAll}
              onClick={handleMarkAllAsRead}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#D4A72C] bg-white px-4 py-3 text-sm font-semibold text-[#172554] transition hover:bg-[#fffaf0] disabled:opacity-50"
            >
              {markingAll ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCheck size={18} />
                  Mark all as read
                </>
              )}
            </button>
          ) : null}
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#64748B]">
                  All notifications
                </p>

                <p className="mt-2 text-3xl font-extrabold text-[#172554]">
                  {notifications.length}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FAF9F6] text-[#D4A72C]">
                <Bell size={23} aria-hidden="true" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#64748B]">Unread</p>

                <p className="mt-2 text-3xl font-extrabold text-[#172554]">
                  {unreadCount}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FAF9F6] text-[#D4A72C]">
                <BellRing size={23} aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FAF9F6] text-[#D4A72C]">
              <Bell size={28} aria-hidden="true" />
            </div>

            <h2 className="mt-5 text-xl font-bold text-[#172554]">
              {copy.emptyTitle}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#64748B]">
              {copy.emptyBody}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                updating={updatingId === notification.id}
                onDelete={handleDelete}
                onOpen={handleOpenNotification}
                onRead={handleMarkAsRead}
              />
            ))}
          </div>
        )}
      </div>

      <NotificationDetailModal
        audience={audience}
        isUpdating={updatingId === selectedNotification?.id}
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
      />
    </section>
  );
}
