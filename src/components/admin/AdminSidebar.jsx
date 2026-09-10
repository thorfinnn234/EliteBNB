import { LogOut } from "lucide-react";
import { NavLink } from "react-router-dom";
import brandLogo from "../../assets/brand/elitebnb-logo-primary-display.png";
import {
  adminNavigationItems,
  adminNotificationRoute,
} from "./adminNavigation";

/**
 * Desktop Admin navigation for the operational console.
 * It derives active state from React Router instead of a hardcoded prop, which
 * keeps Dashboard from appearing active across every Admin route.
 */
export default function AdminSidebar({
  notificationUnreadCount = 0,
  onLogout,
}) {
  return (
    <aside className="elite-admin-sidebar" aria-label="Admin navigation">
      <div className="elite-admin-sidebar__brand">
        <img src={brandLogo} alt="EliteBNB" />
        <span>Admin Console</span>
      </div>

      <nav className="elite-admin-sidebar__nav">
        {adminNavigationItems.map((item) => {
          const Icon = item.icon;
          const showBadge =
            item.to === adminNotificationRoute && notificationUnreadCount > 0;

          return (
            <NavLink
              key={item.key}
              to={item.to}
              className={({ isActive }) =>
                `elite-admin-sidebar__link${
                  isActive ? " elite-admin-sidebar__link--active" : ""
                }`
              }
            >
              <span className="elite-admin-sidebar__icon">
                <Icon size={19} strokeWidth={1.8} />
              </span>

              <span className="elite-admin-sidebar__label">
                <span>{item.label}</span>
                <small>{item.eyebrow}</small>
              </span>

              {showBadge ? (
                <span
                  className="elite-admin-sidebar__badge"
                  aria-label={`${notificationUnreadCount} unread notifications`}
                >
                  {notificationUnreadCount > 9 ? "9+" : notificationUnreadCount}
                </span>
              ) : null}
            </NavLink>
          );
        })}
      </nav>

      <button
        type="button"
        className="elite-admin-sidebar__logout"
        onClick={onLogout}
      >
        <LogOut size={18} strokeWidth={1.8} />
        Logout
      </button>
    </aside>
  );
}
