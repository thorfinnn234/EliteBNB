import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Settings, UserRound } from "lucide-react";
import HostMobileNav from "../components/host/HostMobileNav";
import HostSidebar from "../components/host/HostSidebar";
import HostTopbar from "../components/host/HostTopbar";
import { useAuth } from "../hooks/useAuth";
import { useNotificationUnreadCount } from "../hooks/useNotificationUnreadCount";
import { hostProfileService } from "../services/hostProfileService";

export default function HostLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [hostProfile, setHostProfile] = useState(null);
  const profileMenuRef = useRef(null);
  const profileButtonRef = useRef(null);
  const navigate = useNavigate();
  const auth = useAuth();
  const currentUser = auth?.user;
  const { unreadCount: notificationUnreadCount } = useNotificationUnreadCount();
  const headerUser = {
    ...currentUser,
    ...hostProfile,
    role: currentUser?.role || hostProfile?.role || "HOST",
  };

  const displayName =
    [headerUser?.firstName, headerUser?.lastName].filter(Boolean).join(" ") ||
    headerUser?.name ||
    headerUser?.username ||
    headerUser?.email ||
    "Host";

  const profileImageUrl =
    headerUser?.profileImageUrl || headerUser?.avatar || headerUser?.imageUrl;

  // Close the profile menu when the user clicks outside the menu or button.
  useEffect(() => {
    function handleClickOutside(event) {
      const clickedMenu = profileMenuRef.current?.contains(event.target);
      const clickedButton = profileButtonRef.current?.contains(event.target);

      if (!clickedMenu && !clickedButton) {
        setProfileMenuOpen(false);
      }
    }

    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [profileMenuOpen]);

  // Keep the mobile Host navigation from allowing the page behind it to scroll.
  useEffect(() => {
    if (!sidebarOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

  useEffect(() => {
    let isMounted = true;

    async function loadHostProfile() {
      try {
        const response = await hostProfileService.getProfile();

        if (isMounted) {
          setHostProfile(response.data);
        }
      } catch (error) {
        console.error("Failed to load host profile for navbar:", error);
      }
    }

    loadHostProfile();
    window.addEventListener("host-profile-updated", loadHostProfile);

    return () => {
      isMounted = false;
      window.removeEventListener("host-profile-updated", loadHostProfile);
    };
  }, []);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
      }
    }

    if (profileMenuOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [profileMenuOpen]);

  const handleLogout = async () => {
    try {
      if (auth?.logout) {
        await auth.logout();
      } else {
        localStorage.removeItem("token");
      }

      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="elite-host-shell">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close host navigation"
          onClick={() => setSidebarOpen(false)}
          className="elite-host-shell__scrim lg:hidden"
        />
      )}

      {/* Sidebar */}
      <HostSidebar
        open={sidebarOpen}
        notificationUnreadCount={notificationUnreadCount}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      {/* Main content */}
      <div className="elite-host-shell__content">
        {/* Navbar */}
        <div className="elite-host-shell__topbar">
          <HostTopbar
            displayName={displayName}
            notificationUnreadCount={notificationUnreadCount}
            profileImageUrl={profileImageUrl}
            profileButtonRef={profileButtonRef}
            profileMenuOpen={profileMenuOpen}
            onMenuClick={() => setSidebarOpen((prev) => !prev)}
            onProfileClick={() => setProfileMenuOpen((prev) => !prev)}
          />

          {/* Profile Dropdown Menu */}
          {profileMenuOpen && (
            <div
              ref={profileMenuRef}
              role="menu"
              className="elite-host-profile-menu"
            >
              {/* User Info Section */}
              <div className="elite-host-profile-menu__summary">
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt={displayName}
                    className="elite-host-profile-menu__avatar"
                  />
                ) : (
                  <div className="elite-host-profile-menu__avatar">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <span className="elite-host-profile-menu__name">
                    {displayName}
                  </span>
                  <span className="elite-host-profile-menu__email">
                    {headerUser?.email || "EliteBNB Host"}
                  </span>
                </div>
              </div>

              {/* Menu Items */}
              <div className="elite-host-profile-menu__items">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    navigate("/host/profile");
                      setProfileMenuOpen(false);
                    }}
                  className="elite-host-profile-menu__item"
                >
                  <UserRound size={16} strokeWidth={1.8} />
                  Profile
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    navigate("/host/settings");
                      setProfileMenuOpen(false);
                    }}
                  className="elite-host-profile-menu__item"
                >
                  <Settings size={16} strokeWidth={1.8} />
                  Settings
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="elite-host-profile-menu__item is-danger"
                >
                  <LogOut size={16} strokeWidth={1.8} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Page */}
        <main className="elite-host-main">
          {children}
        </main>

        <HostMobileNav
          notificationUnreadCount={notificationUnreadCount}
          onLogout={handleLogout}
        />
      </div>
    </div>
  );
}
