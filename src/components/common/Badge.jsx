export default function Badge({ children, tone = "navy", className = "" }) {
  const tones = {
    navy: "bg-[#172554]/10 text-[#172554]",
    gold: "bg-[#D4A72C]/15 text-[#8A6500]",
    success: "bg-[#16A34A]/10 text-[#16A34A]",
    error: "bg-[#DC2626]/10 text-[#DC2626]",
    neutral: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${tones[tone] ?? tones.navy} ${className}`}
    >
      {children}
    </span>
  );
}
