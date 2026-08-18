import Sidebar from "../components/layout/Sidebar";

export default function UserLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#FAF9F6]">
      <div className="hidden lg:block">
        <Sidebar role="USER" activeKey="home" />
      </div>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
