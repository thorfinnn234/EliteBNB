import { MoreHorizontal, X } from "lucide-react";
import { useEffect, useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import {
  adminNavigationItems,
  adminNotificationRoute,
  adminPrimaryMobileItems,
  adminSecondaryMobileItems,
  getAdminPageForPath,
} from "./adminNavigation";

/**
 * Bottom navigation for narrow Admin screens.
 * Primary routes stay one tap away, while less frequent operational areas move
 * into a More sheet without weakening the protected production routes.
 */
export default function AdminMobileNav({
  moreOpen,
  notificationUnreadCount = 0,
  onCloseMore,
  onOpenMore,
  onLogout,
}) {
  const { pathname } = useLocation();
  const currentPage = getAdminPageForPath(pathname);
  const primaryItems = useMemo(
    () =>
      adminNavigationItems.filter((item) =>
        adminPrimaryMobileItems.includes(item.key)
      ),
    []
  );
  const moreIsActive = adminSecondaryMobileItems.some(
    (item) => item.key === currentPage.key
  );

  useBodyScrollLock(moreOpen);

  useEffect(() => {
    if (!moreOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onCloseMore();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [moreOpen, onCloseMore]);

  return (
    <>
      <nav className="elite-admin-mobile-nav" aria-label="Admin mobile navigation">
        {primaryItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.key}
              to={item.to}
              className={({ isActive }) =>
                `elite-admin-mobile-nav__item${
                  isActive ? " elite-admin-mobile-nav__item--active" : ""
                }`
              }
            >
              <Icon size={19} strokeWidth={1.9} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        <button
          type="button"
          className={`elite-admin-mobile-nav__item${
            moreIsActive ? " elite-admin-mobile-nav__item--active" : ""
          }`}
          onClick={onOpenMore}
          aria-expanded={moreOpen}
          aria-controls="elite-admin-mobile-more"
        >
          <MoreHorizontal size={20} strokeWidth={1.9} />
          <span>More</span>

          {notificationUnreadCount > 0 ? (
            <span className="elite-admin-mobile-nav__dot" aria-hidden="true" />
          ) : null}
        </button>
      </nav>

      {moreOpen ? (
        <div
          className="elite-admin-mobile-sheet"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              onCloseMore();
            }
          }}
        >
          <section
            id="elite-admin-mobile-more"
            className="elite-admin-mobile-sheet__panel"
            aria-label="More Admin destinations"
          >
            <div className="elite-admin-mobile-sheet__header">
              <div>
                <span>ADMIN MENU</span>
                <h2>Platform operations</h2>
              </div>

              <button
                type="button"
                onClick={onCloseMore}
                aria-label="Close Admin navigation"
              >
                <X size={20} strokeWidth={1.9} />
              </button>
            </div>

            <div className="elite-admin-mobile-sheet__links">
              {adminSecondaryMobileItems.map((item) => {
                const Icon = item.icon;
                const showBadge =
                  item.to === adminNotificationRoute &&
                  notificationUnreadCount > 0;

                return (
                  <NavLink
                    key={item.key}
                    to={item.to}
                    onClick={onCloseMore}
                    className={({ isActive }) =>
                      `elite-admin-mobile-sheet__link${
                        isActive ? " elite-admin-mobile-sheet__link--active" : ""
                      }`
                    }
                  >
                    <Icon size={19} strokeWidth={1.8} />
                    <span>
                      <strong>{item.label}</strong>
                      <small>{item.eyebrow}</small>
                    </span>

                    {showBadge ? (
                      <em>{notificationUnreadCount > 9 ? "9+" : notificationUnreadCount}</em>
                    ) : null}
                  </NavLink>
                );
              })}
            </div>

            <button
              type="button"
              className="elite-admin-mobile-sheet__logout"
              onClick={onLogout}
            >
              Logout
            </button>
          </section>
        </div>
      ) : null}
    </>
  );
}
