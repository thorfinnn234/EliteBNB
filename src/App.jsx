import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";

/**
 * Restores the viewport to the top whenever React Router changes route.
 * This centralizes route-level scroll reset for public discovery, authenticated
 * USER routes, and development preview routes without adding page-specific
 * `window.scrollTo` calls.
 */
function RouteScrollReset() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ left: 0, top: 0, behavior: "auto" });
  }, [pathname, search]);

  return null;
}

/**
 * Renders the real application route tree after global providers are mounted.
 * The temporary test shell remains in the repo but is no longer the entry UI.
 */
const App = () => {
  return (
    <>
      <RouteScrollReset />
      <AppRoutes />
    </>
  );
};

export default App;
