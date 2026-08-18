export default function Loader({ label = "Loading..." }) {
  return (
    <div className="flex items-center gap-3 text-[#64748B]">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#D4A72C] border-t-[#172554]" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
