import {
  Bell,
  BookOpenCheck,
  Building2,
  CreditCard,
  FileWarning,
  LayoutDashboard,
  MessageSquare,
  RotateCcw,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

/**
 * Admin route metadata is centralized so the sidebar, topbar, mobile nav and
 * router labels cannot drift away from the backend-backed Admin product map.
 */
export const adminNavigationItems = [
  {
    key: "dashboard",
    label: "Dashboard",
    eyebrow: "Command center",
    to: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    key: "users",
    label: "Users",
    eyebrow: "Accounts",
    to: "/admin/users",
    icon: Users,
  },
  {
    key: "hosts",
    label: "Host Verification",
    eyebrow: "Trust queue",
    to: "/admin/hosts",
    icon: ShieldCheck,
  },
  {
    key: "host-support",
    label: "Host Support",
    eyebrow: "Support desk",
    to: "/admin/host-support",
    icon: MessageSquare,
  },
  {
    key: "properties",
    label: "Properties",
    eyebrow: "Approval",
    to: "/admin/properties",
    icon: Building2,
  },
  {
    key: "bookings",
    label: "Bookings",
    eyebrow: "Reservations",
    to: "/admin/bookings",
    icon: BookOpenCheck,
  },
  {
    key: "payments",
    label: "Payments",
    eyebrow: "Settlement",
    to: "/admin/payments",
    icon: CreditCard,
  },
  {
    key: "refunds",
    label: "Refunds",
    eyebrow: "Recovery",
    to: "/admin/refunds",
    icon: RotateCcw,
  },
  {
    key: "reports",
    label: "Reports",
    eyebrow: "Moderation",
    to: "/admin/reports",
    icon: FileWarning,
  },
  {
    key: "audit-logs",
    label: "Audit Logs",
    eyebrow: "System trail",
    to: "/admin/audit-logs",
    icon: ScrollText,
  },
  {
    key: "notifications",
    label: "Notifications",
    eyebrow: "Signals",
    to: "/admin/notifications",
    icon: Bell,
  },
  {
    key: "settings",
    label: "Settings",
    eyebrow: "Platform",
    to: "/admin/settings",
    icon: Settings,
  },
];

export const adminPrimaryMobileItems = [
  "dashboard",
  "users",
  "properties",
  "reports",
];

export const adminSecondaryMobileItems = adminNavigationItems.filter(
  (item) => !adminPrimaryMobileItems.includes(item.key)
);

/**
 * Matches nested Admin URLs to their navigation parent. Detail pages added in
 * later phases can inherit the correct active state without every component
 * needing to reimplement pathname parsing.
 */
export function getAdminPageForPath(pathname) {
  const orderedItems = [...adminNavigationItems].sort(
    (left, right) => right.to.length - left.to.length
  );

  return (
    orderedItems.find(
      (item) => pathname === item.to || pathname.startsWith(`${item.to}/`)
    ) ?? adminNavigationItems[0]
  );
}

/**
 * Builds a compact identity fallback from the authenticated Admin profile.
 * The backend profile remains the source of truth; this only formats display.
 */
export function getAdminDisplayName(user) {
  return (
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.name ||
    user?.fullName ||
    user?.email ||
    "Admin"
  );
}

export function getAdminInitials(user) {
  const name = getAdminDisplayName(user);
  const parts = name.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}

export const adminNotificationRoute = "/admin/notifications";
