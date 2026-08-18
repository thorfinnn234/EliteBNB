export default function Avatar({
  src,
  alt = "User",
  name = "U",
  size = "md",
  className = "",
}) {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
  };

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${sizes[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} grid place-items-center rounded-full bg-[#172554] font-bold text-white ${className}`}
    >
      {name?.slice(0, 2).toUpperCase()}
    </div>
  );
}
