export default function AmenityItem({ icon = "✓", label }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-[#D4A72C]/15 text-[#8A6500]">
        {icon}
      </span>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
