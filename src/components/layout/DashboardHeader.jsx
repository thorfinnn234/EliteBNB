import Avatar from "../common/Avatar";

export default function DashboardHeader({
  title,
  subtitle,
  userName = "User",
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-[#E5E7EB] bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[#64748B]">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <Avatar name={userName} />
        <div>
          <p className="text-sm font-semibold">{userName}</p>
          <p className="text-xs text-[#64748B]">EliteBNB account</p>
        </div>
      </div>
    </div>
  );
}
