import { useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";

export default function HostLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-50 h-screen
          w-[250px]
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        <Sidebar
          role="HOST"
          onSelect={() => setSidebarOpen(false)}
        />
      </aside>

      {/* Main content */}
      <div className="min-h-screen lg:ml-[250px]">
        {/* Navbar */}
        <Navbar
          role="HOST"
          onMenuClick={() => setSidebarOpen((prev) => !prev)}
        />

        {/* Page */}
        <main className="min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}

