import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}
