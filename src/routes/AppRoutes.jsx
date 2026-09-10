import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import HostLayout from "../layouts/HostLayout";
import PublicLayout from "../layouts/PublicLayout";
import UserLayout from "../layouts/UserLayout";
import HostLifecycleGate from "../components/host/HostLifecycleGate";
import AdminAuditLogs from "../pages/admin/AuditLogs";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminBookings from "../pages/admin/Bookings";
import AdminHosts from "../pages/admin/Hosts";
import AdminHostSupport from "../pages/admin/HostSupport";
import AdminNotifications from "../pages/admin/Notifications";
import AdminPayments from "../pages/admin/Payments";
import AdminProperties from "../pages/admin/Properties";
import AdminRefunds from "../pages/admin/Refunds";
import AdminReports from "../pages/admin/Reports";
import AdminSettings from "../pages/admin/Settings";
import AdminUsers from "../pages/admin/Users";
import ForgotPassword from "../pages/auth/ForgotPassword";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ResetPassword from "../pages/auth/ResetPassword";
import VerifyEmail from "../pages/auth/VerifyEmail";
import VerifyResetCode from "../pages/auth/VerifyResetCode";
import HostPreview from "../pages/dev/HostPreview";
import HostCalendar from "../pages/host/Calendar";
import CreateListing from "../pages/host/CreateListing";
import HostEarnings from "../pages/host/Earnings";
import EditListing from "../pages/host/EditListing";
import HostDashboard from "../pages/host/HostDashboard";
import HostListings from "../pages/host/HostListings";
import HostMessages from "../pages/host/Messages";
import HostNotifications from "../pages/host/Notifications";
import HostOnboarding from "../pages/host/HostOnboarding";
import HostProfile from "../pages/host/HostProfile";
import HostReservations from "../pages/host/Reservations";
import HostReviews from "../pages/host/Reviews";
import HostSettings from "../pages/host/Settings";
import HostSupport from "../pages/host/Support";
import HostVerification from "../pages/host/HostVerification";
import Home from "../pages/public/Home";
import PropertyDetails from "../pages/public/PropertyDetails";
import Search from "../pages/public/Search";
import UserNotifications from "../pages/user/Notification";
import UserMessages from "../pages/user/Messages";
import PaymentCallback from "../pages/user/PaymentCallback";
import ReservationDetails from "../pages/user/ReservationDetails";
import UserReviews from "../pages/user/Reviews";
import Trips from "../pages/user/Trips";
import UserHome from "../pages/user/UserHome";
import UserProfile from "../pages/user/UserProfile";
import Wishlist from "../pages/user/Wishlist";
import { userHomePreviewIdentity } from "../data/userHomeData";
import RoleRoute from "./RoleRoute";

/**
 * Wraps public placeholder pages in the shared public layout.
 * Auth pages use their own AuthLayout and are routed separately.
 */
function PublicPage({ children }) {
  return <PublicLayout>{children}</PublicLayout>;
}

/**
 * Wraps USER pages with the existing frontend role guard and layout.
 * Backend authorization remains the source of truth for protected data.
 */
function UserPage({ children }) {
  return (
    <RoleRoute allowedRoles={["USER"]}>
      <UserLayout>{children}</UserLayout>
    </RoleRoute>
  );
}

/**
 * Wraps HOST pages with the existing frontend role guard and layout.
 * The Host page implementations from main are preserved inside this shell.
 */
function HostPage({ children }) {
  return (
    <RoleRoute allowedRoles={["HOST"]}>
      <HostLayout>{children}</HostLayout>
    </RoleRoute>
  );
}

/**
 * Wraps Host business pages with a lifecycle gate before mounting API-heavy
 * screens. Profile, onboarding, and verification routes stay outside this guard
 * because unverified Hosts are explicitly allowed to complete those steps.
 */
function HostBusinessPage({ children }) {
  return (
    <RoleRoute allowedRoles={["HOST"]}>
      <HostLifecycleGate>
        <HostLayout>{children}</HostLayout>
      </HostLifecycleGate>
    </RoleRoute>
  );
}

/**
 * Wraps ADMIN pages with the existing frontend role guard and layout.
 * Phase 1 establishes protected Admin foundations without weakening backend
 * ADMIN role authorization.
 */
function AdminPage({ children }) {
  return (
    <RoleRoute allowedRoles={["ADMIN"]}>
      <AdminLayout>{children}</AdminLayout>
    </RoleRoute>
  );
}

/**
 * Renders the USER shell and dashboard with presentation-only identity data.
 * This is strictly for frontend development when the backend is unavailable;
 * it does not touch AuthContext, localStorage, tokens, or protected routes.
 */
function DevUserPreviewPage({
  children,
  routePath = "/user/dashboard",
}) {
  return (
    <UserLayout
      previewMode
      previewRoutePath={routePath}
      previewUser={userHomePreviewIdentity}
    >
      {children}
    </UserLayout>
  );
}

/**
 * Keeps unknown URLs from rendering a blank page without designing a final 404.
 */
function NotFound() {
  return (
    <section className="min-h-screen bg-[#FAF9F6] p-8">
      <div className="mx-auto max-w-3xl rounded-2xl border border-[#E5E7EB] bg-white p-6">
        <h1 className="text-2xl font-extrabold text-[#172554]">
          Page not found
        </h1>
        <p className="mt-3 text-[#64748B]">
          The requested route does not exist.
        </p>
      </div>
    </section>
  );
}

/**
 * Defines the merged EliteBNB route map.
 * It keeps the full public, auth, USER, HOST, and ADMIN structure while using
 * the newer auth flows and Host pages that arrived from origin/main.
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicPage><Home /></PublicPage>} />
      <Route path="/search" element={<PublicPage><Search /></PublicPage>} />
      <Route path="/property/:id" element={<PublicPage><PropertyDetails /></PublicPage>} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-reset-code" element={<VerifyResetCode />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/payment/callback"
        element={
          <RoleRoute allowedRoles={["USER"]}>
            <PaymentCallback />
          </RoleRoute>
        }
      />

      {import.meta.env.DEV ? (
        <>
          <Route
            path="/dev/user-preview"
            element={
              <DevUserPreviewPage routePath="/user/dashboard">
                <UserHome
                  previewMode
                  previewUser={userHomePreviewIdentity}
                />
              </DevUserPreviewPage>
            }
          />
          <Route
            path="/dev/user-preview/explore"
            element={
              <DevUserPreviewPage routePath="/search">
                <Search previewMode />
              </DevUserPreviewPage>
            }
          />
          <Route
            path="/dev/user-preview/trips"
            element={
              <DevUserPreviewPage routePath="/user/trips">
                <Trips previewMode />
              </DevUserPreviewPage>
            }
          />
          <Route
            path="/dev/user-preview/saved"
            element={
              <DevUserPreviewPage routePath="/user/wishlist">
                <Wishlist previewMode />
              </DevUserPreviewPage>
            }
          />
          <Route
            path="/dev/user-preview/reviews"
            element={
              <DevUserPreviewPage routePath="/user/reviews">
                <UserReviews previewMode />
              </DevUserPreviewPage>
            }
          />
          <Route
            path="/dev/user-preview/profile"
            element={
              <DevUserPreviewPage routePath="/user/profile">
                <UserProfile
                  previewMode
                  previewUser={userHomePreviewIdentity}
                />
              </DevUserPreviewPage>
            }
          />
          <Route path="/dev/host-preview" element={<HostPreview />} />
        </>
      ) : null}

      <Route path="/user" element={<Navigate to="/user/dashboard" replace />} />
      <Route path="/user/home" element={<Navigate to="/user/dashboard" replace />} />
      <Route path="/user/dashboard" element={<UserPage><UserHome /></UserPage>} />
      <Route path="/user/explore" element={<UserPage><Search /></UserPage>} />
      <Route path="/user/messages" element={<UserPage><UserMessages /></UserPage>} />
      <Route path="/user/property/:id" element={<UserPage><PropertyDetails /></UserPage>} />
      <Route path="/user/trips" element={<UserPage><Trips /></UserPage>} />
      <Route path="/user/trips/:bookingId" element={<UserPage><ReservationDetails /></UserPage>} />
      <Route path="/user/wishlist" element={<UserPage><Wishlist /></UserPage>} />
      <Route path="/user/profile" element={<UserPage><UserProfile /></UserPage>} />
      <Route path="/user/reviews" element={<UserPage><UserReviews /></UserPage>} />
      <Route path="/user/notifications" element={<UserPage><UserNotifications /></UserPage>} />

      <Route path="/host" element={<Navigate to="/host/dashboard" replace />} />
      <Route
        path="/host/onboarding"
        element={
          <RoleRoute allowedRoles={["HOST"]}>
            <HostOnboarding />
          </RoleRoute>
        }
      />
      <Route
        path="/host/verification"
        element={
          <RoleRoute allowedRoles={["HOST"]}>
            <HostVerification />
          </RoleRoute>
        }
      />
      <Route path="/host/dashboard" element={<HostBusinessPage><HostDashboard /></HostBusinessPage>} />
      <Route path="/host/listings" element={<HostBusinessPage><HostListings /></HostBusinessPage>} />
      <Route path="/host/listings/new" element={<HostBusinessPage><CreateListing /></HostBusinessPage>} />
      <Route path="/host/listings/create" element={<HostBusinessPage><CreateListing /></HostBusinessPage>} />
      <Route path="/host/listings/:id/edit" element={<HostBusinessPage><EditListing /></HostBusinessPage>} />
      <Route path="/host/calendar" element={<HostBusinessPage><HostCalendar /></HostBusinessPage>} />
      <Route path="/host/reservations" element={<HostBusinessPage><HostReservations /></HostBusinessPage>} />
      <Route path="/host/earnings" element={<HostBusinessPage><HostEarnings /></HostBusinessPage>} />
      <Route path="/host/profile" element={<HostPage><HostProfile /></HostPage>} />
      <Route path="/host/support" element={<HostPage><HostSupport /></HostPage>} />
      <Route path="/host/messages" element={<HostBusinessPage><HostMessages /></HostBusinessPage>} />
      <Route path="/host/notifications" element={<HostBusinessPage><HostNotifications /></HostBusinessPage>} />
      <Route path="/host/reviews" element={<HostBusinessPage><HostReviews /></HostBusinessPage>} />
      <Route path="/host/settings" element={<HostBusinessPage><HostSettings /></HostBusinessPage>} />

      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin/dashboard" element={<AdminPage><AdminDashboard /></AdminPage>} />
      <Route path="/admin/users" element={<AdminPage><AdminUsers /></AdminPage>} />
      <Route path="/admin/hosts" element={<AdminPage><AdminHosts /></AdminPage>} />
      <Route path="/admin/host-support" element={<AdminPage><AdminHostSupport /></AdminPage>} />
      <Route path="/admin/properties" element={<AdminPage><AdminProperties /></AdminPage>} />
      <Route path="/admin/bookings" element={<AdminPage><AdminBookings /></AdminPage>} />
      <Route path="/admin/payments" element={<AdminPage><AdminPayments /></AdminPage>} />
      <Route path="/admin/refunds" element={<AdminPage><AdminRefunds /></AdminPage>} />
      <Route path="/admin/reports" element={<AdminPage><AdminReports /></AdminPage>} />
      <Route path="/admin/audit-logs" element={<AdminPage><AdminAuditLogs /></AdminPage>} />
      <Route path="/admin/notifications" element={<AdminPage><AdminNotifications /></AdminPage>} />
      <Route path="/admin/settings" element={<AdminPage><AdminSettings /></AdminPage>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
