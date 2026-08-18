export default function Button({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  disabled = false,
  onClick,
  className = "",
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  const variants = {
    primary:
      "bg-[#172554] text-white hover:bg-[#1E3A8A] focus:ring-[#172554]",
    secondary:
      "bg-[#D4A72C] text-[#172554] hover:bg-[#C39722] focus:ring-[#D4A72C]",
    outline:
      "border border-[#172554] bg-white text-[#172554] hover:bg-[#F8FAFC] focus:ring-[#172554]",
    ghost:
      "bg-transparent text-[#172554] hover:bg-[#172554]/5 focus:ring-[#172554]",
    danger:
      "bg-[#DC2626] text-white hover:bg-[#B91C1C] focus:ring-[#DC2626]",
  };

  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-5 py-3 text-sm",
    lg: "px-6 py-3.5 text-base",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${variants[variant] ?? variants.primary} ${sizes[size] ?? sizes.md} ${className}`}
    >
      {children}
    </button>
  );
}
