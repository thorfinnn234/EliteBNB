<<<<<<< HEAD
import { Routes, Route, Navigate } from "react-router-dom";

import HostLayout from "../layouts/HostLayout";

import HostDashboard from "../pages/host/HostDashboard";
import HostListings from "../pages/host/HostListings";
import Calendar from "../pages/host/Calendar";
import Reservations from "../pages/host/Reservations";
import Earnings from "../pages/host/Earnings";
import HostProfile from "../pages/host/HostProfile";
=======
import { Routes, Route } from "react-router-dom";
import Home from "../pages/public/Home";
import Login from "../pages/auth/Login";
>>>>>>> origin/main

export default function AppRoutes() {
  return (
    <Routes>
<<<<<<< HEAD
      <Route
        path="/"
        element={<Navigate to="/host/dashboard" replace />}
      />

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
      </Route>
=======
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
>>>>>>> origin/main
    </Routes>
  );
}
