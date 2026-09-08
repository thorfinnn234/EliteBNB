import NotificationCenter from "../../components/notifications/NotificationCenter";

/**
 * Renders USER notifications through the shared backend-backed notification
 * center. The route stays protected by AppRoutes/RoleRoute, so this wrapper
 * only supplies USER-facing copy and safe USER deep links.
 */
export default function Notifications() {
  return <NotificationCenter audience="user" />;
}
