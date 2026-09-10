import {
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  LifeBuoy,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Star,
  User,
  Wallet,
} from "lucide-react";

/**
 * Defines the primary Host workspace destinations once so the desktop rail,
 * mobile bottom navigation, and development preview all point to the same
 * production routes without duplicating route strings.
 */
export const primaryHostNavItems = [
  {
    label: "Dashboard",
    meta: "Briefing",
    icon: LayoutDashboard,
    to: "/host/dashboard",
  },
  {
    label: "Listings",
    meta: "Portfolio",
    icon: Building2,
    to: "/host/listings",
  },
  {
    label: "Calendar",
    meta: "Availability",
    icon: CalendarDays,
    to: "/host/calendar",
  },
  {
    label: "Reservations",
    meta: "Guest flow",
    icon: BarChart3,
    to: "/host/reservations",
  },
  {
    label: "Earnings",
    meta: "Revenue",
    icon: Wallet,
    to: "/host/earnings",
  },
];

/**
 * Groups secondary Host tools separately so mobile can expose them behind a
 * More surface while desktop keeps them in the sidebar's guest-desk section.
 */
export const secondaryHostNavItems = [
  {
    label: "Messages",
    meta: "Inbox",
    icon: MessageSquare,
    to: "/host/messages",
  },
  {
    label: "EliteBNB Support",
    meta: "Admin help",
    icon: LifeBuoy,
    to: "/host/support",
  },
  {
    label: "Reviews",
    meta: "Reputation",
    icon: Star,
    to: "/host/reviews",
  },
  {
    label: "Profile",
    meta: "Identity",
    icon: User,
    to: "/host/profile",
  },
  {
    label: "Settings",
    meta: "Controls",
    icon: Settings,
    to: "/host/settings",
  },
  {
    label: "Notifications",
    meta: "Signals",
    icon: Bell,
    to: "/host/notifications",
  },
];
