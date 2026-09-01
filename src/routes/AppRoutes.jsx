import { Routes, Route, Navigate } from "react-router-dom";

import HostLayout from "../layouts/HostLayout";
import UserLayout from "../layouts/UserLayout";

import HostDashboard from "../pages/host/HostDashboard";
import HostListings from "../pages/host/HostListings";
import CreateListing from "../pages/host/CreateListing";
import EditListing from "../pages/host/EditListing";
import Calendar from "../pages/host/Calendar";
import Reservations from "../pages/host/Reservations";
import Earnings from "../pages/host/Earnings";
import HostProfile from "../pages/host/HostProfile";
import Messages from "../pages/host/Messages";
import Reviews from "../pages/host/Reviews";
import Settings from "../pages/host/Settings";
import Notifications from "../pages/host/Notifications";
import HostOnboarding from "../pages/host/HostOnboarding";

import UserHome from "../pages/user/UserHome";
import PropertyDetails from "../pages/public/PropertyDetails";
import Trips from "../pages/user/Trips";
import Wishlist from "../pages/user/Wishlist";
import UserProfile from "../pages/user/UserProfile";
import UserReviews from "../pages/user/Reviews";
import UserNotifications from "../pages/user/Notification";
import PaymentCallback from "../pages/user/PaymentCallback";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import VerifyEmail from "../pages/auth/VerifyEmail";
import ForgotPassword from "../pages/auth/ForgotPassword";
import VerifyResetCode from "../pages/auth/VerifyResetCode";
import ResetPassword from "../pages/auth/ResetPassword";

export default function AppRoutes() {
  return (
    <Routes>
      {/* AUTH */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-reset-code" element={<VerifyResetCode />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        path="/payment/callback"
        element={<PaymentCallback />}
      />

      {/* DEFAULT */}
      <Route path="/" element={<Navigate to="/host/dashboard" replace />} />

      {/* USER */}
      <Route path="/user">
        <Route index element={<Navigate to="/user/home" replace />} />

        <Route
          path="home"
          element={
            <UserLayout>
              <UserHome />
            </UserLayout>
          }
        />

        <Route
          path="property/:id"
          element={
            <UserLayout>
              <PropertyDetails />
            </UserLayout>
          }
        />

        <Route
          path="trips"
          element={
            <UserLayout>
              <Trips />
            </UserLayout>
          }
        />

        <Route
          path="wishlist"
          element={
            <UserLayout>
              <Wishlist />
            </UserLayout>
          }
        />

        <Route
          path="reviews"
          element={
            <UserLayout>
              <UserReviews />
            </UserLayout>
          }
        />

        <Route
          path="notifications"
          element={
            <UserLayout>
              <UserNotifications />
            </UserLayout>
          }
        />

        <Route
          path="profile"
          element={
            <UserLayout>
              <UserProfile />
            </UserLayout>
          }
        />
      </Route>

      {/* HOST */}
      <Route path="/host">
        <Route path="onboarding" element={<HostOnboarding />} />
        <Route
          path="dashboard"
          element={
            <HostLayout>
              <HostDashboard />
            </HostLayout>
          }
        />

        <Route
          path="listings"
          element={
            <HostLayout>
              <HostListings />
            </HostLayout>
          }
        />

        <Route
          path="listings/create"
          element={
            <HostLayout>
              <CreateListing />
            </HostLayout>
          }
        />

        <Route
          path="listings/:id/edit"
          element={
            <HostLayout>
              <EditListing />
            </HostLayout>
          }
        />

        <Route
          path="calendar"
          element={
            <HostLayout>
              <Calendar />
            </HostLayout>
          }
        />

        <Route
          path="reservations"
          element={
            <HostLayout>
              <Reservations />
            </HostLayout>
          }
        />

        <Route
          path="earnings"
          element={
            <HostLayout>
              <Earnings />
            </HostLayout>
          }
        />

        <Route
          path="profile"
          element={
            <HostLayout>
              <HostProfile />
            </HostLayout>
          }
        />

        <Route
          path="messages"
          element={
            <HostLayout>
              <Messages />
            </HostLayout>
          }
        />

        <Route
          path="reviews"
          element={
            <HostLayout>
              <Reviews />
            </HostLayout>
          }
        />

        <Route
          path="settings"
          element={
            <HostLayout>
              <Settings />
            </HostLayout>
          }
        />

        <Route
          path="notifications"
          element={
            <HostLayout>
              <Notifications />
            </HostLayout>
          }
        />
      </Route>
    </Routes>
  );
}
