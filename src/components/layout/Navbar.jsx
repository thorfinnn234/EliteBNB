import { Menu, Bell, ChevronDown } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export default function Navbar({
  userName,
  role = "USER",
  avatar,
  onMenuClick,
  onProfileClick,
}) {
  const auth = useAuth();
  const currentUser = auth?.user;
  const displayName =
    userName ||
    currentUser?.username ||
    currentUser?.name ||
    currentUser?.fullName ||
    currentUser?.email ||
    "User";
  const userRole = currentUser?.role || role;
  const userAvatar = avatar || currentUser?.avatar;
  const displayRole =
    userRole === "USER"
      ? ""
      : ` (${userRole.charAt(0) + userRole.slice(1).toLowerCase()})`;

  return (
    <header className="flex h-[64px] w-full items-center justify-between border-b border-[#E5E7EB] bg-white px-4 sm:h-[72px] sm:px-7">
      
      {/* LEFT */}
      <button
        type="button"
        onClick={onMenuClick}
        className="flex h-9 w-9 items-center justify-center rounded-lg
                   text-[#64748B] transition hover:bg-[#FAF9F6]
                   hover:text-[#172554]"
        aria-label="Toggle menu"
      >
        <Menu size={20} strokeWidth={1.8} />
      </button>

      {/* RIGHT */}
      <div className="flex items-center gap-3 sm:gap-5">

        {/* NOTIFICATIONS */}
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center
                     text-[#111827] transition hover:text-[#D4A72C]"
          aria-label="Notifications"
        >
          <Bell size={19} strokeWidth={1.8} />

          {/* Notification dot */}
          <span className="absolute right-[6px] top-[5px] h-[5px] w-[5px]
                           rounded-full bg-[#D4A72C]" />
        </button>

        {/* PROFILE */}
        <button
          type="button"
          onClick={onProfileClick}
          className="flex items-center gap-2.5"
        >
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={displayName}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <div
              className="flex h-9 w-9 items-center justify-center
                         rounded-full bg-[#172554] text-xs font-semibold
                         text-white"
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}

          <span
            className="hidden text-[13px] font-medium text-[#111827] sm:block"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Hi, {displayName}{displayRole}
          </span>

          <ChevronDown
            size={14}
            strokeWidth={2}
            className="text-[#64748B]"
          />
        </button>

      </div>
    </header>
  );
}
