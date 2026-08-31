import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import HostLayout from "../layouts/HostLayout";
import PublicLayout from "../layouts/PublicLayout";
import UserLayout from "../layouts/UserLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminBookings from "../pages/admin/Bookings";
import AdminHosts from "../pages/admin/Hosts";
import AdminListings from "../pages/admin/Listings";
import AdminReports from "../pages/admin/Reports";
import AdminReviews from "../pages/admin/Reviews";
import AdminTransactions from "../pages/admin/Transactions";
import AdminUsers from "../pages/admin/Users";
import ForgotPassword from "../pages/auth/ForgotPassword";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ResetPassword from "../pages/auth/ResetPassword";
import VerifyEmail from "../pages/auth/VerifyEmail";
import VerifyResetCode from "../pages/auth/VerifyResetCode";
import HostCalendar from "../pages/host/Calendar";
import CreateListing from "../pages/host/CreateListing";
import HostEarnings from "../pages/host/Earnings";
import EditListing from "../pages/host/EditListing";
import HostDashboard from "../pages/host/HostDashboard";
import HostListings from "../pages/host/HostListings";
import HostMessages from "../pages/host/Messages";
import HostNotifications from "../pages/host/Notifications";
import HostProfile from "../pages/host/HostProfile";
import HostReservations from "../pages/host/Reservations";
import HostReviews from "../pages/host/Reviews";
import HostSettings from "../pages/host/Settings";
import Home from "../pages/public/Home";
import PropertyDetails from "../pages/public/PropertyDetails";
import Search from "../pages/public/Search";
import BookingCheckout from "../pages/user/BookingCheckout";
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
 * Wraps ADMIN placeholders with the existing frontend role guard and layout.
 * Admin pages remain placeholders until the Admin development phase begins.
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
                <UserReviews />
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
        </>
      ) : null}

      <Route path="/user" element={<Navigate to="/user/dashboard" replace />} />
      <Route path="/user/dashboard" element={<UserPage><UserHome /></UserPage>} />
      <Route path="/user/trips" element={<UserPage><Trips /></UserPage>} />
      <Route path="/user/wishlist" element={<UserPage><Wishlist /></UserPage>} />
      <Route path="/user/profile" element={<UserPage><UserProfile /></UserPage>} />
      <Route path="/user/booking-checkout" element={<UserPage><BookingCheckout /></UserPage>} />
      <Route path="/user/reviews" element={<UserPage><UserReviews /></UserPage>} />

      <Route path="/host" element={<Navigate to="/host/dashboard" replace />} />
      <Route path="/host/dashboard" element={<HostPage><HostDashboard /></HostPage>} />
      <Route path="/host/listings" element={<HostPage><HostListings /></HostPage>} />
      <Route path="/host/listings/new" element={<HostPage><CreateListing /></HostPage>} />
      <Route path="/host/listings/create" element={<HostPage><CreateListing /></HostPage>} />
      <Route path="/host/listings/:id/edit" element={<HostPage><EditListing /></HostPage>} />
      <Route path="/host/calendar" element={<HostPage><HostCalendar /></HostPage>} />
      <Route path="/host/reservations" element={<HostPage><HostReservations /></HostPage>} />
      <Route path="/host/earnings" element={<HostPage><HostEarnings /></HostPage>} />
      <Route path="/host/profile" element={<HostPage><HostProfile /></HostPage>} />
      <Route path="/host/messages" element={<HostPage><HostMessages /></HostPage>} />
      <Route path="/host/notifications" element={<HostPage><HostNotifications /></HostPage>} />
      <Route path="/host/reviews" element={<HostPage><HostReviews /></HostPage>} />
      <Route path="/host/settings" element={<HostPage><HostSettings /></HostPage>} />

      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin/dashboard" element={<AdminPage><AdminDashboard /></AdminPage>} />
      <Route path="/admin/users" element={<AdminPage><AdminUsers /></AdminPage>} />
      <Route path="/admin/hosts" element={<AdminPage><AdminHosts /></AdminPage>} />
      <Route path="/admin/listings" element={<AdminPage><AdminListings /></AdminPage>} />
      <Route path="/admin/bookings" element={<AdminPage><AdminBookings /></AdminPage>} />
      <Route path="/admin/transactions" element={<AdminPage><AdminTransactions /></AdminPage>} />
      <Route path="/admin/reviews" element={<AdminPage><AdminReviews /></AdminPage>} />
      <Route path="/admin/reports" element={<AdminPage><AdminReports /></AdminPage>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
