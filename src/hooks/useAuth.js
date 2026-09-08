import { useContext } from "react";
import { AuthContext } from "../context/AuthContextBase";

/**
 * Reads the current authentication context for routes, layout, and services.
 * Components should be rendered inside AuthProvider before relying on it.
 */
export function useAuth() {
  return useContext(AuthContext);
}
