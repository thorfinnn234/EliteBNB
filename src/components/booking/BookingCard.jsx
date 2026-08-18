import Badge from "../common/Badge";

export default function BookingCard({
  title,
  location,
  dates,
  status = "Confirmed",
  total,
}) {
  const tone = status.toLowerCase() === "confirmed" ? "success" : "neutral";

  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-bold text-[#111827]">{title}</h3>
          <p className="mt-1 text-sm text-[#64748B]">{location}</p>
        </div>
        <Badge tone={tone}>{status}</Badge>
      </div>

      <div className="mt-5 flex items-center justify-between text-sm">
        <span className="text-[#64748B]">{dates}</span>
        <span className="font-bold text-[#172554]">{total}</span>
      </div>
    </div>
  );
}
