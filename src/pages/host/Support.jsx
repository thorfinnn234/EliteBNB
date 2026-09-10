import { LifeBuoy } from "lucide-react";
import HostSupportDrawer from "../../components/host/HostSupportDrawer";
import { useAuth } from "../../hooks/useAuth";
import "./Support.css";

/**
 * Builds the Host display name from the authenticated session only.
 * Support messaging does not require verified business access, so this page
 * avoids Host business APIs and lets the C1 support endpoint stay authoritative.
 */
function getHostName(user) {
  return (
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.name ||
    user?.fullName ||
    user?.email ||
    "EliteBNB Host"
  );
}

/**
 * Permanent Host/Admin support page.
 * It reuses the shared Host support thread component in embedded mode so the
 * route and /host/verification drawer share API loading, read, send, empty and
 * error behavior without touching normal guest messaging.
 */
export default function Support() {
  const { user } = useAuth();
  const hostName = getHostName(user);

  return (
    <section className="elite-host-support-page" aria-labelledby="host-support-title">
      <header className="elite-host-support-page__header">
        <div>
          <span>ELITEBNB SUPPORT</span>
          <h1 id="host-support-title">Contact EliteBNB Support</h1>
          <p>
            A dedicated conversation with EliteBNB Admin for Host verification,
            account access, and platform support. Guest conversations remain in
            Messages.
          </p>
        </div>
        <aside aria-label="Support channel">
          <LifeBuoy size={22} aria-hidden="true" />
          <strong>Admin support thread</strong>
          <small>Separate from guest messages</small>
        </aside>
      </header>

      <HostSupportDrawer hostName={hostName} open variant="page" />
    </section>
  );
}
