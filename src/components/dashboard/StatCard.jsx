export default function StatCard({
  label,
  value,
  change,
  icon = "↗",
}) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[#64748B]">{label}</p>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#172554]/5 text-[#172554]">
          {icon}
        </span>
      </div>
      <p className="mt-4 text-3xl font-extrabold text-[#172554]">{value}</p>
      {change && <p className="mt-2 text-xs text-[#16A34A]">{change}</p>}
    </div>
  );
}
