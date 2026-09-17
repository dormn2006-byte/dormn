import { Link, useNavigate } from "react-router-dom";
import { ShieldAlert, Home, ArrowLeft, Search, LogIn } from "lucide-react";
import SEOHead from "../components/common/SEOHead";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#080B14] flex items-center justify-center p-4 sm:p-6 transition-colors duration-300">
      <SEOHead 
        title="404 - Page Not Found | Dormn" 
        description="The page or property details you are trying to access does not exist or you do not have permission to view it."
      />

      {/* Decorative Glows */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-[#93B733]/15 rounded-full blur-3xl pointer-events-none -z-0"></div>
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-0"></div>

      <div className="relative z-10 max-w-lg w-full text-center bg-white dark:bg-[#111625] border border-gray-200/80 dark:border-white/10 p-8 sm:p-12 rounded-3xl shadow-2xl backdrop-blur-xl">
        
        {/* Icon Badge */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 mb-6 border border-amber-200/60 dark:border-amber-500/20 shadow-inner">
          <ShieldAlert size={40} />
        </div>

        {/* 404 Large Label */}
        <h1 className="text-6xl sm:text-7xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
          404
        </h1>

        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-800 dark:text-gray-100 mb-3">
          Page Not Found or Access Restricted
        </h2>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
          The requested page, property, or record does not exist or you do not have permission to access it with your current account.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 text-sm font-bold hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-200 shadow-sm"
          >
            <ArrowLeft size={16} />
            <span>Go Back</span>
          </button>

          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#0D3A1D] to-[#1b5e20] text-white text-sm font-bold hover:opacity-95 shadow-md shadow-[#0D3A1D]/20 transition-all duration-200"
          >
            <Home size={16} />
            <span>Go to Home</span>
          </Link>
        </div>

        {/* Extra Quick Links */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/10 flex items-center justify-center gap-4 text-xs font-semibold text-gray-500 dark:text-gray-400">
          <Link to="/pgs" className="hover:text-[#93B733] transition flex items-center gap-1">
            <Search size={13} />
            <span>Explore PGs</span>
          </Link>
          <span>•</span>
          <Link to="/auth" className="hover:text-[#93B733] transition flex items-center gap-1">
            <LogIn size={13} />
            <span>Switch Account</span>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default NotFound;
