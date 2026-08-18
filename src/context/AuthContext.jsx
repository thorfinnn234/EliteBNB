import { createContext, useMemo, useState } from "react";

export const AuthContext = createContext(null);

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
