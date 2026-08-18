export default function ChartCard({
  title,
  subtitle,
  children,
}) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <div>
        <h3 className="font-bold text-[#111827]">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-[#64748B]">{subtitle}</p>}
      </div>

      <div className="mt-5 min-h-56 rounded-xl bg-[#FAF9F6] p-4">
        {children ?? (
          <div className="grid h-full min-h-48 place-items-center text-sm text-[#64748B]">
            Chart goes here
          </div>
        )}
      </div>
    </div>
  );
}
