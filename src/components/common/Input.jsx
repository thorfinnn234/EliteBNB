export default function Input({
  label,
  error,
  className = "",
  id,
  ...props
}) {
  const inputId = id || props.name;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-2 block text-sm font-semibold text-[#111827]"
        >
          {label}
        </label>
      )}

      <input
        id={inputId}
        {...props}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-[#111827] outline-none transition placeholder:text-[#94A3B8] ${
          error
            ? "border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20"
            : "border-[#E5E7EB] focus:border-[#172554] focus:ring-2 focus:ring-[#172554]/10"
        } ${className}`}
      />

      {error && (
        <p className="mt-1.5 text-sm text-[#DC2626]">{error}</p>
      )}
    </div>
  );
}
