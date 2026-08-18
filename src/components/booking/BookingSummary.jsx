export default function BookingSummary({
  property,
  dates,
  guests,
  total,
}) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
      <h3 className="text-lg font-bold">Booking summary</h3>

      <div className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-[#64748B]">Property</span>
          <span className="text-right font-medium">{property}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-[#64748B]">Dates</span>
          <span className="text-right font-medium">{dates}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-[#64748B]">Guests</span>
          <span className="text-right font-medium">{guests}</span>
        </div>
        <div className="flex justify-between border-t border-[#E5E7EB] pt-3 text-base font-bold">
          <span>Total</span>
          <span className="text-[#172554]">{total}</span>
        </div>
      </div>
    </div>
  );
}
