import Button from "../common/Button";

export default function PriceCard({
  price = "₦85,000",
  nights = 3,
  fees = "₦10,000",
  total = "₦265,000",
}) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-md">
      <p className="text-lg">
        <span className="text-2xl font-bold text-[#172554]">{price}</span>
        <span className="text-[#64748B]"> / night</span>
      </p>

      <div className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-[#64748B]">{price} × {nights} nights</span>
          <span>—</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#64748B]">Service fees</span>
          <span>{fees}</span>
        </div>
        <div className="flex justify-between border-t border-[#E5E7EB] pt-3 font-bold">
          <span>Total</span>
          <span>{total}</span>
        </div>
      </div>

      <Button className="mt-5 w-full">Reserve</Button>
    </div>
  );
}
