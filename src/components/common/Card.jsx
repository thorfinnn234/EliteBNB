export default function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
