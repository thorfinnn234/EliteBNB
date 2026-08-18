import Input from "../common/Input";

export default function DateSelector({
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input
        type="date"
        label="Check in"
        value={checkIn}
        onChange={(e) => onCheckInChange?.(e.target.value)}
      />
      <Input
        type="date"
        label="Check out"
        value={checkOut}
        onChange={(e) => onCheckOutChange?.(e.target.value)}
      />
    </div>
  );
}
