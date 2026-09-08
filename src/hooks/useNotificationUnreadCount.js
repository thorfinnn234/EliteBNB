import { useCallback, useEffect, useState } from "react";
import { notificationService } from "../services/notificationService";

const NOTIFICATION_UNREAD_COUNT_EVENT =
  "elitebnb:notification-unread-count-changed";
const NOTIFICATION_UNREAD_REFRESH_EVENT =
  "elitebnb:notification-unread-count-refresh";

/**
 * Normalizes the backend unread-count response. The current API returns
 * `{ count }`, but this helper keeps the UI tolerant of numeric responses
 * without inventing notification state.
 */
function normalizeUnreadCount(responseData) {
  const rawCount =
    typeof responseData === "number"
      ? responseData
      : responseData?.count ?? responseData?.unreadCount;
  const parsedCount = Number(rawCount);

  return Number.isFinite(parsedCount) && parsedCount > 0 ? parsedCount : 0;
}

/**
 * Broadcasts confirmed unread-count changes after notification mutations.
 * Topbars listen to this event so badges disappear immediately after the
 * backend confirms `mark read` or `mark all read`.
 */
export function publishNotificationUnreadCount(count) {
  window.dispatchEvent(
    new CustomEvent(NOTIFICATION_UNREAD_COUNT_EVENT, {
      detail: { count },
    })
  );
}

/**
 * Requests a refetch instead of faking synchronization. Message threads can
 * call this after real read operations; if the backend later links message
 * notifications to conversations, topbar counts will follow automatically.
 */
export function requestNotificationUnreadCountRefresh() {
  window.dispatchEvent(new Event(NOTIFICATION_UNREAD_REFRESH_EVENT));
}

/**
 * Reads the authenticated user's notification count from the genuine backend
 * endpoint. The hook intentionally returns `0` on failure so shells never show
 * a misleading unread badge when the source of truth is unavailable.
 */
export function useNotificationUnreadCount({ enabled = true } = {}) {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!enabled) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await notificationService.getUnreadCount();

      setUnreadCount(normalizeUnreadCount(response.data));
    } catch (error) {
      console.error("Failed to load notification unread count:", error);
      setUnreadCount(0);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      let isCurrentEffect = true;

      window.queueMicrotask(() => {
        if (isCurrentEffect) {
          setUnreadCount(0);
        }
      });

      return () => {
        isCurrentEffect = false;
      };
    }

    /**
     * Count events are emitted only after backend-confirmed mutations.
     * Refresh events intentionally refetch because conversation notifications
     * do not expose conversation IDs in the current backend payload.
     */
    function handleCountEvent(event) {
      setUnreadCount(normalizeUnreadCount(event.detail));
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refreshUnreadCount();
      }
    }

    window.queueMicrotask(refreshUnreadCount);
    window.addEventListener(
      NOTIFICATION_UNREAD_COUNT_EVENT,
      handleCountEvent
    );
    window.addEventListener(
      NOTIFICATION_UNREAD_REFRESH_EVENT,
      refreshUnreadCount
    );
    window.addEventListener("focus", refreshUnreadCount);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener(
        NOTIFICATION_UNREAD_COUNT_EVENT,
        handleCountEvent
      );
      window.removeEventListener(
        NOTIFICATION_UNREAD_REFRESH_EVENT,
        refreshUnreadCount
      );
      window.removeEventListener("focus", refreshUnreadCount);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [enabled, refreshUnreadCount]);

  return { refreshUnreadCount, unreadCount };
}
