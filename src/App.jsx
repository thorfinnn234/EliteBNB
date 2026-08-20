import AppRoutes from "./routes/AppRoutes";

/**
 * Renders the real application route tree after global providers are mounted.
 * The temporary test shell remains in the repo but is no longer the entry UI.
 */
const App = () => {
  return <AppRoutes />;
};

export default App;
