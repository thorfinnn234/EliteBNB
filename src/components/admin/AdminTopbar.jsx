import { Bell, LogOut, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { adminService } from "../../services/adminService";
import {
  adminNotificationRoute,
  getAdminDisplayName,
  getAdminInitials,
  getAdminPageForPath,
} from "./adminNavigation";

/**
 * Converts the Admin notification count response into a safe badge number.
 * The finalized contract is expected to expose a count, but this tolerates a
 * numeric response without fabricating unread state on malformed data.
 */
function normalizeAdminUnreadCount(responseData) {
  const rawCount =
    typeof responseData === "number"
      ? responseData
      : responseData?.count ?? responseData?.unreadCount;
  const parsedCount = Number(rawCount);

  return Number.isFinite(parsedCount) && parsedCount > 0 ? parsedCount : 0;
}

/**
 * Admin topbar presents page context, notification access, identity and logout.
 * It uses the Admin-specific unread endpoint so USER/HOST notification contracts
 * remain untouched while the Admin foundation gains truthful badge behavior.
 */
export default function AdminTopbar({
  onMenuToggle,
  notificationUnreadCount,
  onNotificationUnreadCountChange,
  onLogout,
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loadingUnreadCount, setLoadingUnreadCount] = useState(false);
  const currentPage = getAdminPageForPath(pathname);
  const displayName = getAdminDisplayName(user);
  const initials = getAdminInitials(user);
  const unreadCount = notificationUnreadCount ?? 0;
  const hasUnread = unreadCount > 0;

  useEffect(() => {
    let active = true;

    async function loadUnreadCount() {
      setLoadingUnreadCount(true);

      try {
        const response = await adminService.getNotificationUnreadCount();
        const nextCount = normalizeAdminUnreadCount(response.data);

        if (active) {
          onNotificationUnreadCountChange(nextCount);
        }
      } catch (error) {
        console.error("Failed to load Admin notification count:", error);

        if (active) {
          onNotificationUnreadCountChange(0);
        }
      } finally {
        if (active) {
          setLoadingUnreadCount(false);
        }
      }
    }

    loadUnreadCount();

    return () => {
      active = false;
    };
  }, [onNotificationUnreadCountChange]);

  return (
    <header className="elite-admin-topbar">
      <button
        type="button"
        className="elite-admin-topbar__menu"
        onClick={onMenuToggle}
        aria-label="Open Admin navigation"
      >
        <Menu size={20} strokeWidth={1.9} />
      </button>

      <div className="elite-admin-topbar__context">
        <span>{currentPage.eyebrow}</span>
        <h1>{currentPage.label}</h1>
      </div>

      <div className="elite-admin-topbar__actions">
        <button
          type="button"
          className="elite-admin-topbar__icon-button"
          onClick={() => navigate(adminNotificationRoute)}
          aria-label={
            hasUnread
              ? `Open Admin notifications, ${unreadCount} unread`
              : "Open Admin notifications"
          }
        >
          <Bell size={19} strokeWidth={1.8} />

          {hasUnread ? (
            <span className="elite-admin-topbar__badge">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </button>

        <div className="elite-admin-topbar__identity">
          {user?.profileImageUrl ? (
            <img src={user.profileImageUrl} alt={displayName} />
          ) : (
            <span>{initials}</span>
          )}

          <div>
            <strong>{displayName}</strong>
            <small>
              {loadingUnreadCount ? "Checking signals" : "Administrator"}
            </small>
          </div>
        </div>

        <button
          type="button"
          className="elite-admin-topbar__logout"
          onClick={onLogout}
        >
          <LogOut size={17} strokeWidth={1.8} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
