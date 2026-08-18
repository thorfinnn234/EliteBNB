export default function Alert({ type = "info", title, children }) {
  const styles = {
    info: "border-[#172554]/20 bg-[#172554]/5 text-[#172554]",
    success: "border-[#16A34A]/20 bg-[#16A34A]/5 text-[#166534]",
    error: "border-[#DC2626]/20 bg-[#DC2626]/5 text-[#991B1B]",
    warning: "border-[#D4A72C]/30 bg-[#D4A72C]/10 text-[#7A5A00]",
  };

  return (
    <div className={`rounded-xl border p-4 ${styles[type] ?? styles.info}`}>
      {title && <p className="font-semibold">{title}</p>}
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}
