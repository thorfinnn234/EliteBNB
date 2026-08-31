import { Routes, Route, Navigate } from "react-router-dom";

import HostLayout from "../layouts/HostLayout";

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
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import VerifyEmail from "../pages/auth/VerifyEmail";
import ForgotPassword from "../pages/auth/ForgotPassword";
import VerifyResetCode from "../pages/auth/VerifyResetCode";
import ResetPassword from "../pages/auth/ResetPassword";
import Notifications from "../pages/host/Notifications";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-reset-code" element={<VerifyResetCode />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/" element={<Navigate to="/host/dashboard" replace />} />

      <Route path="/host">
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
      </Route>

      <Route path="/host/notifications" element={<Notifications />} />
    </Routes>
  );
}
