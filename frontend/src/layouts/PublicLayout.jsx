import { lazy, Suspense } from "react";
import Navbar from "../components/Navbar.jsx";
const Footer = lazy(() => import("../components/Fotter.jsx"));

const PublicLayout = ({ children }) => {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F0F2F5] text-[#0D3A1D] font-sans selection:bg-[#93B733] selection:text-white">
      <Navbar />

      {/* Public Page Content - top padding on desktop, bottom padding on mobile (clears bottom dock) */}
      <main className="pt-4 pb-28 lg:pt-4 lg:pb-6">{children}</main>

      {/* Global Public Footer */}
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default PublicLayout;