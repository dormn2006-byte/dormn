import { Link, useNavigate } from "react-router-dom";
import { Dumbbell, ArrowLeft, Home, Sparkles, Search, Clock } from "lucide-react";
import Navbar from "../components/Navbar";
import SEOHead from "../components/common/SEOHead";

export default function Gym() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5] dark:bg-[#080B14] text-gray-900 dark:text-white font-sans selection:bg-[#93B733] selection:text-white transition-colors duration-300 overflow-x-hidden">
      <SEOHead
        title="Gym & Fitness Hub | Dormn"
        description="Dormn Gym & Fitness feature will be available soon."
      />

      <Navbar />

      {/* Decorative Glow Backgrounds */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-[#93B733]/15 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10 my-auto">
        <div className="relative z-10 max-w-xl w-full text-center bg-white/95 dark:bg-[#111625]/95 border border-gray-200/80 dark:border-white/10 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl backdrop-blur-xl">
          
          {/* Animated Icon Badge */}
          <div className="relative inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#93B733]/15 text-[#4E700F] dark:text-[#93B733] mb-6 border border-[#93B733]/30 shadow-inner group">
            <Dumbbell className="w-10 h-10 sm:w-12 sm:h-12 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
            <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#0D3A1D] text-white">
              <Clock size={13} className="animate-spin-slow" />
            </div>
          </div>

          {/* Badge Label */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25 mb-4">
            <Sparkles size={12} />
            <span>Feature Coming Soon</span>
          </div>

          {/* Main Headings */}
          <h1 className="text-3xl sm:text-4xl font-black text-[#0D3A1D] dark:text-white tracking-tight mb-2">
            Dormn Gym & Fitness
          </h1>

          <p className="text-base sm:text-lg font-bold text-[#4E700F] dark:text-[#93B733] mb-4">
            This feature will be available soon!
          </p>

          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-8 leading-relaxed max-w-md mx-auto">
            We are building an integrated gym & resident fitness lounge. Stay tuned for exclusive partner gym memberships, workout tracking, and resident fitness perks!
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 text-sm font-bold hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-200 shadow-sm cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Go Back</span>
            </button>

            <Link
              to="/pgs"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#0D3A1D] hover:bg-[#07130B] text-white text-sm font-bold shadow-md shadow-[#0D3A1D]/20 transition-all duration-200 cursor-pointer"
            >
              <Search size={16} />
              <span>Explore PGs</span>
            </Link>
          </div>

          {/* Footer Navigation */}
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/10 flex items-center justify-center gap-4 text-xs font-semibold text-gray-500 dark:text-gray-400">
            <Link to="/" className="hover:text-[#93B733] transition flex items-center gap-1">
              <Home size={13} />
              <span>Back Home</span>
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
