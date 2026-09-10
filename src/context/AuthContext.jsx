import { useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContextBase";
import { adminService } from "../services/adminService";
import { hostProfileService } from "../services/hostProfileService";
import { userService } from "../services/userService";

const tokenStorageKey = "token";
const restorationRoleStorageKey = "authRole";

/**
 * Keeps role comparisons consistent across backend responses and local hints.
 * Auth restoration only needs this role hint to choose the authoritative
 * backend profile endpoint; the profile request still validates the JWT.
 */
function normalizeRole(role) {
  return typeof role === "string" ? role.toUpperCase() : "";
}

/**
 * Clears every authentication value owned by the frontend session layer.
 * Logout and invalid-token recovery both use this so role hints cannot linger.
 */
function clearStoredAuth() {
  localStorage.removeItem(tokenStorageKey);
  localStorage.removeItem(restorationRoleStorageKey);
}

/**
 * Returns the profile service that matches the previously authenticated role.
 * The saved role only chooses the restoration endpoint; each backend profile
 * request still validates the Bearer token and rejects invalid sessions.
 */
function getProfileServiceForRole(role) {
  if (role === "USER") return userService;
  if (role === "HOST") return hostProfileService;
  if (role === "ADMIN") return adminService;

  return null;
}

/**
 * Normalizes supported profile response shapes into the shared user object.
 * The current services may return either the user directly or under a user key;
 * the fallback role preserves the authenticated role when a profile DTO omits it.
 */
function getUserFromResponse(response, fallbackRole) {
  const profile = response.data?.user ?? response.data;
  const role = normalizeRole(profile?.role) || fallbackRole;

  return {
    ...profile,
    role,
  };
}

/**
 * Provides the current authenticated user and token helpers to the app.
 * It is intended to wrap the routed application once routing is wired in.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(() =>
    Boolean(localStorage.getItem(tokenStorageKey))
  );

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem(tokenStorageKey);
    const restorationRole = normalizeRole(
      localStorage.getItem(restorationRoleStorageKey)
    );
    const profileService = getProfileServiceForRole(restorationRole);

    if (!token) return undefined;

    if (!profileService) {
      window.queueMicrotask(() => {
        if (active) {
          clearStoredAuth();
          setUser(null);
          setAuthLoading(false);
        }
      });

      return () => {
        active = false;
      };
    }

    profileService
      .getProfile()
      .then((response) => {
        if (active) setUser(getUserFromResponse(response, restorationRole));
      })
      .catch(() => {
        if (active) {
          clearStoredAuth();
          setUser(null);
        }
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = ({ user: nextUser, token }) => {
    const role = normalizeRole(nextUser?.role);

    localStorage.setItem(tokenStorageKey, token);

    if (role) {
      localStorage.setItem(restorationRoleStorageKey, role);
    } else {
      localStorage.removeItem(restorationRoleStorageKey);
    }

    setUser({
      ...nextUser,
      role,
    });
    setAuthLoading(false);
  };

  const logout = () => {
    clearStoredAuth();
    setUser(null);
    setAuthLoading(false);
  };

  const value = useMemo(
    () => ({
      user,
      setUser,
      login,
      logout,
      authLoading,
      isAuthenticated: Boolean(user),
    }),
    [authLoading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
