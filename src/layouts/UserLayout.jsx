import Sidebar from "../components/layout/Sidebar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function UserLayout({ children }) {
  const navigate = useNavigate();
  const auth = useAuth();

  const handleLogout = async () => {
    try {
      if (auth?.logout) {
        await auth.logout();
      } else {
        localStorage.removeItem("token");
      }

      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FAF9F6]">
      <div className="hidden lg:block">
        <Sidebar role="USER" onLogout={handleLogout} />
      </div>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
