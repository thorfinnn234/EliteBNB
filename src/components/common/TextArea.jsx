export default function TextArea({
  label,
  error,
  rows = 5,
  className = "",
  id,
  ...props
}) {
  const inputId = id || props.name;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-2 block text-sm font-semibold">
          {label}
        </label>
      )}

      <textarea
        id={inputId}
        rows={rows}
        {...props}
        className={`w-full resize-y rounded-xl border bg-white px-4 py-3 outline-none transition ${
          error
            ? "border-[#DC2626]"
            : "border-[#E5E7EB] focus:border-[#172554] focus:ring-2 focus:ring-[#172554]/10"
        } ${className}`}
      />

      {error && <p className="mt-1 text-sm text-[#DC2626]">{error}</p>}
    </div>
  );
}
