import NotificationCenter from "../../components/notifications/NotificationCenter";

/**
 * Renders HOST notifications through the shared backend-backed notification
 * center. Host-specific copy and links stay isolated behind the audience prop
 * while the service contract remains unchanged.
 */
export default function Notifications() {
  return <NotificationCenter audience="host" />;
}
