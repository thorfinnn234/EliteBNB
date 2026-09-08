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
  const { pathname } = useLocation();

  useEffect(() => {
    /*
     * Only pathname changes reset the page. Query-only navigation is used by
     * inbox routes such as `/user/messages?conversation=1`, where resetting
     * scroll would interrupt the active thread instead of opening a new page.
     */
    window.scrollTo({ left: 0, top: 0, behavior: "auto" });
  }, [pathname]);

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
