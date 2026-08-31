import { useEffect, useState } from "react";
import {
  Bell,
  BellRing,
  CheckCheck,
  CheckCircle2,
  Clock3,
  Loader2,
  Trash2,
  XCircle,
} from "lucide-react";

import api from "../../services/api";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/notifications");

      setNotifications(response.data || []);
    } catch (err) {
      console.error("Failed to load notifications:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load notifications."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      setUpdatingId(notificationId);
      setError("");

      const response = await api.patch(
        `/notifications/${notificationId}/read`
      );

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? response.data
            : notification
        )
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);

      setError(
        err.response?.data?.message ||
          "Unable to update notification."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAll(true);
      setError("");

      await api.patch("/notifications/read-all");

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          read: true,
        }))
      );
    } catch (err) {
      console.error("Failed to mark all as read:", err);

      setError(
        err.response?.data?.message ||
          "Unable to mark all notifications as read."
      );
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      setUpdatingId(notificationId);
      setError("");

      await api.delete(`/notifications/${notificationId}`);

      setNotifications((current) =>
        current.filter(
          (notification) =>
            notification.id !== notificationId
        )
      );
    } catch (err) {
      console.error("Failed to delete notification:", err);

      setError(
        err.response?.data?.message ||
          "Unable to delete notification."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

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

        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#D4A72C]">
              HOST
            </p>

            <h1 className="mt-2 text-3xl font-extrabold text-[#172554] md:text-4xl">
              Notifications
            </h1>

            <p className="mt-2 max-w-2xl text-[#64748B]">
              Stay updated on reservation activity and
              important changes to your EliteBNB account.
            </p>
          </div>

          {notifications.length > 0 && unreadCount > 0 && (
            <button
              type="button"
              disabled={markingAll}
              onClick={handleMarkAllAsRead}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#D4A72C] bg-white px-4 py-3 text-sm font-semibold text-[#172554] transition hover:bg-[#fffaf0] disabled:opacity-50"
            >
              {markingAll ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCheck size={18} />
                  Mark all as read
                </>
              )}
            </button>
          )}
        </div>

        {/* Summary */}
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
                <Bell size={23} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#64748B]">
                  Unread
                </p>

                <p className="mt-2 text-3xl font-extrabold text-[#172554]">
                  {unreadCount}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FAF9F6] text-[#D4A72C]">
                <BellRing size={23} />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Empty */}
        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-12 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FAF9F6] text-[#D4A72C]">
              <Bell size={28} />
            </div>

            <h2 className="mt-5 text-xl font-bold text-[#172554]">
              No notifications yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#64748B]">
              When guests make reservation requests or
              important activity happens, you’ll see it here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                updating={
                  updatingId === notification.id
                }
                onRead={() =>
                  handleMarkAsRead(notification.id)
                }
                onDelete={() =>
                  handleDelete(notification.id)
                }
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function NotificationCard({
  notification,
  updating,
  onRead,
  onDelete,
}) {
  const Icon = getNotificationIcon(notification.type);

  const formattedDate = formatNotificationDate(
    notification.createdAt
  );

  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm transition ${
        notification.read
          ? "border-[#E5E7EB] bg-white"
          : "border-[#D4A72C]/40 bg-[#fffdf7]"
      }`}
    >
      <div className="flex gap-4">

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            notification.read
              ? "bg-[#F8FAFC] text-[#64748B]"
              : "bg-[#D4A72C]/10 text-[#D4A72C]"
          }`}
        >
          <Icon size={21} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-[#172554]">
                  {notification.title}
                </h2>

                {!notification.read && (
                  <span className="h-2.5 w-2.5 rounded-full bg-[#D4A72C]" />
                )}
              </div>

              <p className="mt-2 text-sm leading-6 text-[#64748B]">
                {notification.message}
              </p>

              <div className="mt-3 flex items-center gap-2 text-xs text-[#94A3B8]">
                <Clock3 size={14} />
                {formattedDate}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">

              {!notification.read && (
                <button
                  type="button"
                  disabled={updating}
                  onClick={onRead}
                  title="Mark as read"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#172554] transition hover:border-[#D4A72C] hover:text-[#D4A72C] disabled:opacity-50"
                >
                  {updating ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <CheckCheck size={17} />
                  )}
                </button>
              )}

              <button
                type="button"
                disabled={updating}
                onClick={onDelete}
                title="Delete notification"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#94A3B8] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getNotificationIcon(type) {
  switch (type) {
    case "NEW_BOOKING":
      return CalendarDaysIcon;

    case "BOOKING_CONFIRMED":
    case "BOOKING_COMPLETED":
      return CheckCircle2;

    case "BOOKING_CANCELLED":
      return XCircle;

    default:
      return Bell;
  }
}

function CalendarDaysIcon(props) {
  return <BellRing {...props} />;
}

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