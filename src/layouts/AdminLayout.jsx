import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminMobileNav from "../components/admin/AdminMobileNav";
import AdminSidebar from "../components/admin/AdminSidebar";
import "../components/admin/AdminShell.css";
import AdminTopbar from "../components/admin/AdminTopbar";
import { useAuth } from "../hooks/useAuth";

/**
 * Admin shell foundation for protected platform operations.
 * It keeps Admin navigation separate from USER/HOST shells, restores active
 * route state from the pathname, and leaves feature data UI for later phases.
 */
export default function AdminLayout({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);

  /**
   * Logs out through the existing AuthContext cleanup so token and role hints
   * are removed consistently for ADMIN, USER and HOST sessions.
   */
  const handleLogout = useCallback(() => {
    logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  /**
   * Kept stable so the Admin topbar can fetch unread count once per mount
   * instead of refetching after every parent render.
   */
  const handleNotificationUnreadCountChange = useCallback((count) => {
    setNotificationUnreadCount(count);
  }, []);

  const closeMobileMore = useCallback(() => {
    setMobileMoreOpen(false);
  }, []);

  const openMobileMore = useCallback(() => {
    setMobileMoreOpen(true);
  }, []);

  return (
    <div className="elite-admin-shell">
      <AdminSidebar
        notificationUnreadCount={notificationUnreadCount}
        onLogout={handleLogout}
      />

      <div className="elite-admin-main">
        <AdminTopbar
          notificationUnreadCount={notificationUnreadCount}
          onLogout={handleLogout}
          onMenuToggle={openMobileMore}
          onNotificationUnreadCountChange={
            handleNotificationUnreadCountChange
          }
        />

        <main className="elite-admin-content">{children}</main>
      </div>

      <AdminMobileNav
        moreOpen={mobileMoreOpen}
        notificationUnreadCount={notificationUnreadCount}
        onCloseMore={closeMobileMore}
        onLogout={handleLogout}
        onOpenMore={openMobileMore}
      />
    </div>
  );
}
