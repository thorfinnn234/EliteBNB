import { useMemo, useState } from "react";
import { AuthContext } from "./AuthContextBase";

/**
 * Provides the current authenticated user and token helpers to the app.
 * It is intended to wrap the routed application once routing is wired in.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = ({ user: nextUser, token }) => {
    localStorage.setItem("token", token);
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, setUser, login, logout, isAuthenticated: Boolean(user) }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
