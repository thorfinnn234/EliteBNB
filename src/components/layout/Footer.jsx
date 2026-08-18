export default function Footer() {
  return (
    <footer className="border-t border-[#E5E7EB] bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:grid-cols-4">
        <div>
          <p className="text-xl font-extrabold text-[#172554]">
            Elite<span className="text-[#D4A72C]">BNB</span>
          </p>
          <p className="mt-3 text-sm text-[#64748B]">
            Premium stays, thoughtful hosting, and trusted experiences.
          </p>
        </div>

        {["Explore", "Hosting", "Support"].map((group) => (
          <div key={group}>
            <p className="font-semibold text-[#111827]">{group}</p>
            <div className="mt-3 space-y-2 text-sm text-[#64748B]">
              <p>Overview</p>
              <p>Help center</p>
              <p>Policies</p>
            </div>
          </div>
        ))}
      </div>
    </footer>
  );
}
