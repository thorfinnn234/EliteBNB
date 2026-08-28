import { useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContextBase";
import { userService } from "../services/userService";

/**
 * Normalizes supported profile response shapes into the shared user object.
 * The current services may return either the user directly or under a user key.
 */
function getUserFromResponse(response) {
  return response.data?.user ?? response.data;
}

/**
 * Provides the current authenticated user and token helpers to the app.
 * It is intended to wrap the routed application once routing is wired in.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(() =>
    Boolean(localStorage.getItem("token"))
  );

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem("token");

    if (!token) return undefined;

    userService
      .getProfile()
      .then((response) => {
        if (active) setUser(getUserFromResponse(response));
      })
      .catch(() => {
        if (active) {
          localStorage.removeItem("token");
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
    localStorage.setItem("token", token);
    setUser(nextUser);
    setAuthLoading(false);
  };

  const logout = () => {
    localStorage.removeItem("token");
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
