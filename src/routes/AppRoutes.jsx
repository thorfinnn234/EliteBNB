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
import HostCalendar from "../pages/host/Calendar";
import CreateListing from "../pages/host/CreateListing";
import HostEarnings from "../pages/host/Earnings";
import EditListing from "../pages/host/EditListing";
import HostDashboard from "../pages/host/HostDashboard";
import HostListings from "../pages/host/HostListings";
import HostProfile from "../pages/host/HostProfile";
import HostReservations from "../pages/host/Reservations";
import Home from "../pages/public/Home";
import Login from "../pages/public/Login";
import PropertyDetails from "../pages/public/PropertyDetails";
import Register from "../pages/public/Register";
import Search from "../pages/public/Search";
import BookingCheckout from "../pages/user/BookingCheckout";
import UserReviews from "../pages/user/Reviews";
import Trips from "../pages/user/Trips";
import UserHome from "../pages/user/UserHome";
import UserProfile from "../pages/user/UserProfile";
import Wishlist from "../pages/user/Wishlist";
import RoleRoute from "./RoleRoute";

/**
 * Wraps a placeholder page in the shared public layout.
 * Public routes stay open while retaining the current shared shell.
 */
function PublicPage({ children }) {
  return <PublicLayout>{children}</PublicLayout>;
}

/**
 * Wraps USER placeholders with the existing role guard and dashboard layout.
 * The guard is a frontend navigation aid; backend authorization is still required.
 */
function UserPage({ children }) {
  return (
    <RoleRoute allowedRoles={["USER"]}>
      <UserLayout>{children}</UserLayout>
    </RoleRoute>
  );
}

/**
 * Wraps HOST placeholders with the existing role guard and dashboard layout.
 * This activates routes only; it does not implement Host feature UI.
 */
function HostPage({ children }) {
  return (
    <RoleRoute allowedRoles={["HOST"]}>
      <HostLayout>{children}</HostLayout>
    </RoleRoute>
  );
}

/**
 * Wraps ADMIN placeholders with the existing role guard and dashboard layout.
 * Admin pages remain starter placeholders until the admin UI phase begins.
 */
function AdminPage({ children }) {
  return (
    <RoleRoute allowedRoles={["ADMIN"]}>
      <AdminLayout>{children}</AdminLayout>
    </RoleRoute>
  );
}

/**
 * Minimal unknown-route fallback that keeps bad URLs from rendering a blank page.
 */
function NotFound() {
  return (
    <section className="min-h-screen bg-[#FAF9F6] p-8">
      <div className="mx-auto max-w-3xl rounded-2xl border border-[#E5E7EB] bg-white p-6">
        <h1 className="text-2xl font-extrabold text-[#172554]">Page not found</h1>
        <p className="mt-3 text-[#64748B]">The requested route does not exist.</p>
      </div>
    </section>
  );
}

/**
 * Defines the active EliteBNB route map using the existing placeholder pages.
 * Role-specific routes are grouped under /user, /host, and /admin.
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicPage><Home /></PublicPage>} />
      <Route path="/search" element={<PublicPage><Search /></PublicPage>} />
      <Route path="/property/:id" element={<PublicPage><PropertyDetails /></PublicPage>} />
      <Route path="/login" element={<PublicPage><Login /></PublicPage>} />
      <Route path="/register" element={<PublicPage><Register /></PublicPage>} />

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
      <Route path="/host/listings/:id/edit" element={<HostPage><EditListing /></HostPage>} />
      <Route path="/host/calendar" element={<HostPage><HostCalendar /></HostPage>} />
      <Route path="/host/reservations" element={<HostPage><HostReservations /></HostPage>} />
      <Route path="/host/earnings" element={<HostPage><HostEarnings /></HostPage>} />
      <Route path="/host/profile" element={<HostPage><HostProfile /></HostPage>} />

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
