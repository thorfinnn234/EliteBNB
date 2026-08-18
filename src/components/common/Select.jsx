export default function Select({
  label,
  options = [],
  error,
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

      <select
        id={inputId}
        {...props}
        className={`w-full rounded-xl border bg-white px-4 py-3 outline-none ${
          error ? "border-[#DC2626]" : "border-[#E5E7EB] focus:border-[#172554]"
        } ${className}`}
      >
        {options.map((option) => (
          <option key={option.value ?? option} value={option.value ?? option}>
            {option.label ?? option}
          </option>
        ))}
      </select>

      {error && <p className="mt-1 text-sm text-[#DC2626]">{error}</p>}
    </div>
  );
}
