import {
  Home,
  Bell,
  Search,
  CalendarDays,
  Heart,
  MessageSquare,
  Star,
  User,
  Settings,
  LogOut,
  LayoutDashboard,
  Building2,
  Wallet,
  Users,
  CreditCard,
  Flag,
} from "lucide-react";

import { useLocation, useNavigate } from "react-router-dom";

const routesByRole = {
  USER: {
    home: "/user/home",
    explore: "/explore",
    trips: "/user/trips",
    wishlist: "/user/wishlist",
    messages: "/user/messages",
    notifications: "/user/notifications",
    reviews: "/user/reviews",
    profile: "/user/profile",
    settings: "/user/settings",
  },

  HOST: {
    dashboard: "/host/dashboard",
    listings: "/host/listings",
    calendar: "/host/calendar",
    reservations: "/host/reservations",
    earnings: "/host/earnings",
    messages: "/host/messages",
    reviews: "/host/reviews",
    profile: "/host/profile",
    settings: "/host/settings",
  },

  ADMIN: {
    dashboard: "/admin/dashboard",
    users: "/admin/users",
    hosts: "/admin/hosts",
    listings: "/admin/listings",
    bookings: "/admin/bookings",
    payments: "/admin/payments",
    reviews: "/admin/reviews",
    reports: "/admin/reports",
    settings: "/admin/settings",
  },
};

const menuByRole = {
  USER: [
    { label: "Home", icon: Home, key: "home" },
    { label: "Explore", icon: Search, key: "explore" },
    { label: "Trips", icon: CalendarDays, key: "trips" },
    { label: "Wishlist", icon: Heart, key: "wishlist" },
    { label: "Messages", icon: MessageSquare, key: "messages" },
    { label: "Notifications", icon: Bell, key: "notifications" },
    { label: "Reviews", icon: Star, key: "reviews" },
    { label: "Profile", icon: User, key: "profile" },
    { label: "Settings", icon: Settings, key: "settings" },
  ],

  HOST: [
    { label: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
    { label: "Listings", icon: Building2, key: "listings" },
    { label: "Calendar", icon: CalendarDays, key: "calendar" },
    { label: "Reservations", icon: CalendarDays, key: "reservations" },
    { label: "Earnings", icon: Wallet, key: "earnings" },
    { label: "Messages", icon: MessageSquare, key: "messages" },
    { label: "Reviews", icon: Star, key: "reviews" },
    { label: "Profile", icon: User, key: "profile" },
    { label: "Settings", icon: Settings, key: "settings" },
  ],

  ADMIN: [
    { label: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
    { label: "Users", icon: Users, key: "users" },
    { label: "Hosts", icon: User, key: "hosts" },
    { label: "Listings", icon: Building2, key: "listings" },
    { label: "Bookings", icon: CalendarDays, key: "bookings" },
    { label: "Payments", icon: CreditCard, key: "payments" },
    { label: "Reviews", icon: Star, key: "reviews" },
    { label: "Reports", icon: Flag, key: "reports" },
    { label: "Settings", icon: Settings, key: "settings" },
  ],
};

export default function Sidebar({
  role = "USER",
  activeKey,
  onSelect,
  onLogout,
  className = "",
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const normalizedRole = role?.toUpperCase();

  const menuItems =
    menuByRole[normalizedRole] || menuByRole.USER;

  const routes =
    routesByRole[normalizedRole] || routesByRole.USER;

  const getActiveKey = () => {
    if (activeKey) {
      return activeKey;
    }

    const currentPath = location.pathname;

    const currentItem = menuItems.find((item) => {
      const route = routes[item.key];

      if (!route) return false;

      return (
        currentPath === route ||
        currentPath.startsWith(`${route}/`)
      );
    });

    return currentItem?.key;
  };

  const currentActiveKey = getActiveKey();

  const handleNavigation = (item) => {
    onSelect?.(item.key);

    const path = routes[item.key];

    if (path) {
      navigate(path);
    }
  };

  return (
    <aside
      className={`flex h-screen w-[250px] flex-col bg-[#172554] px-4 py-6 text-white ${className}`}
    >
      {/* LOGO */}
      <div className="mb-10 px-3">
        <h1 className="text-2xl font-extrabold tracking-tight">
          Elite<span className="text-[#D4A72C]">BNB</span>
        </h1>

        <p className="mt-1 text-xs text-white/45">
          Premium stays
        </p>
      </div>

      {/* MENU */}
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = currentActiveKey === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handleNavigation(item)}
              className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-[#D4A72C] text-[#172554] shadow-sm"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon
                size={19}
                strokeWidth={1.8}
                className={
                  active
                    ? "text-[#172554]"
                    : "text-white/65 group-hover:text-white"
                }
              />

              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* LOGOUT */}
      <div className="border-t border-white/10 pt-5">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/65 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut size={19} strokeWidth={1.8} />
          Logout
        </button>
      </div>
    </aside>
  );
}
