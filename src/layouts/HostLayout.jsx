import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import { useAuth } from "../hooks/useAuth";
import { hostProfileService } from "../services/hostProfileService";

export default function HostLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [hostProfile, setHostProfile] = useState(null);
  const profileMenuRef = useRef(null);
  const profileButtonRef = useRef(null);
  const navigate = useNavigate();
  const auth = useAuth();
  const { logout } = auth;
  const currentUser = auth?.user;
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

  // Close dropdown when clicking outside
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
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-50 h-screen
          w-[250px]
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        <Sidebar
          role="HOST"
          onSelect={() => setSidebarOpen(false)}
          onLogout={handleLogout}
        />
      </aside>

      {/* Main content */}
      <div className="min-h-screen lg:ml-[250px]">
        {/* Navbar */}
        <div className="relative">
          <Navbar
            role="HOST"
            userName={displayName}
            avatar={profileImageUrl}
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
              className="absolute right-4 top-[72px] z-40 w-56 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-lg"
            >
              {/* User Info Section */}
              <div className="border-b border-[#E5E7EB] bg-[#FAF9F6] px-4 py-4">
                <div className="flex items-center gap-3">
                  {profileImageUrl ? (
                    <img
                      src={profileImageUrl}
                      alt={displayName}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#172554] text-sm font-semibold text-white">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-[#172554]">
                      {displayName}
                    </p>
                    <p className="text-xs text-[#64748B]">
                      {headerUser?.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="border-b border-[#E5E7EB] px-4 py-3">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    navigate("/host/profile");
                    setProfileMenuOpen(false);
                  }}
                  className="block w-full text-left text-sm font-medium text-[#172554] transition hover:text-[#D4A72C]"
                >
                  Profile
                </button>
              </div>

              <div className="border-b border-[#E5E7EB] px-4 py-3">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    navigate("/host/settings");
                    setProfileMenuOpen(false);
                  }}
                  className="block w-full text-left text-sm font-medium text-[#172554] transition hover:text-[#D4A72C]"
                >
                  Settings
                </button>
              </div>

              <div className="px-4 py-3">
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="w-full rounded-lg px-2 py-1.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Page */}
        <main className="min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}

