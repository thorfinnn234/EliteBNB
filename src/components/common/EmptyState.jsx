import Button from "./Button";

export default function EmptyState({
  title = "Nothing here yet",
  description = "There is currently no data to display.",
  actionLabel,
  onAction,
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-10 text-center">
      <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-[#D4A72C]/15" />
      <h3 className="text-lg font-bold text-[#111827]">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-[#64748B]">
        {description}
      </p>

      {actionLabel && (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
