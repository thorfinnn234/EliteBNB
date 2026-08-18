import Sidebar from "./components/layout/Sidebar";
import Navbar from "./components/layout/Navbar";
import { useState } from "react";

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden ${
          isSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <Sidebar
        role="USER"
        activeKey="home"
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        onSelect={() => setIsSidebarOpen(false)}
      />

      {/* RIGHT SIDE */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-[250px]">
        
        <Navbar
          onMenuClick={() => setIsSidebarOpen(true)}
          userName="Habeeb"
          role="USER"
        />

        {/* PAGE CONTENT */}
        {/* <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
              <p className="text-sm font-medium text-[#64748B]">Trips</p>
              <h1 className="mt-2 text-2xl font-extrabold text-[#172554]">4</h1>
            </section>
            <section className="rounded-xl border border-[#E5E7EB] bg-white p-5">
              <p className="text-sm font-medium text-[#64748B]">Wishlist</p>
              <h1 className="mt-2 text-2xl font-extrabold text-[#172554]">12</h1>
            </section>
            <section className="rounded-xl border border-[#E5E7EB] bg-white p-5 sm:col-span-2 xl:col-span-1">
              <p className="text-sm font-medium text-[#64748B]">Messages</p>
              <h1 className="mt-2 text-2xl font-extrabold text-[#172554]">3</h1>
            </section>
          </div>
        </main> */}

      </div>
    </div>
  );
}
