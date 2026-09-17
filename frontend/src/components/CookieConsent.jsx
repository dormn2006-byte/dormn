import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { Cookie, ShieldCheck, Sliders, X, Check, Lock, BarChart3, Settings, Sparkles } from "lucide-react";

const STORAGE_KEY = "dormn_cookie_consent";
const DEFAULT_PREFS = { essential: true, functional: true, analytics: true, marketing: false };

// Checks if the current pathname is a marketing / public page
const isMarketingPage = (pathname) => {
  if (!pathname) return false;
  const nonMarketingPrefixes = [
    "/owner",
    "/student",
    "/superadmin",
    "/super-admin",
    "/event-admin",
    "/events-admin",
    "/admin",
    "/my-pg",
    "/my-pgs",
    "/my-bookings",
    "/saved-pgs",
    "/my-account",
    "/cancellations",
    "/pay-rent",
    "/tenant-registration",
    "/register-tenant",
    "/auth",
    "/404"
  ];
  return !nonMarketingPrefixes.some((prefix) => pathname.startsWith(prefix));
};

const CATEGORIES = [
  {
    id: "essential",
    name: "Strictly Necessary Cookies",
    desc: "Required for core platform operations, authentication tokens, security checks, and room bookings.",
    icon: Lock,
    color: "text-[#93B733]",
    locked: true
  },
  {
    id: "functional",
    name: "Functional & Preference Cookies",
    desc: "Remembers dark/light theme, shortlisted hostel properties, and college campus search filters.",
    icon: Settings,
    color: "text-blue-400"
  },
  {
    id: "analytics",
    name: "Analytics & Performance Cookies",
    desc: "Collects anonymous metrics to optimize site speed, room search filters, and overall student experience.",
    icon: BarChart3,
    color: "text-amber-400"
  },
  {
    id: "marketing",
    name: "Marketing & Personalized Suggestions",
    desc: "Enables customized PG deals, student concert tickets, and exclusive move-in discounts.",
    icon: Sparkles,
    color: "text-purple-400"
  }
];

export default function CookieConsent() {
  const location = useLocation();
  const onMarketingPage = isMarketingPage(location.pathname);
  const [isVisible, setIsVisible] = useState(false);
  const [viewMode, setViewMode] = useState("banner");
  const [preferences, setPreferences] = useState(DEFAULT_PREFS);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!onMarketingPage) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setPreferences(JSON.parse(saved));
        return;
      }

      // Check if desktop intro animation is running on homepage
      const isIntroActive =
        location.pathname === "/" &&
        typeof window !== "undefined" &&
        window.innerWidth >= 1024 &&
        !sessionStorage.getItem("dormn_intro");

      if (isIntroActive) {
        // Wait until intro animation has completely finished
        const handleIntroDone = () => {
          setTimeout(() => setIsVisible(true), 1200);
        };
        window.addEventListener("dormn_intro_finished", handleIntroDone, { once: true });
        const fallback = setTimeout(() => setIsVisible(true), 6000);
        return () => {
          window.removeEventListener("dormn_intro_finished", handleIntroDone);
          clearTimeout(fallback);
        };
      }

      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    } catch {
      setIsVisible(true);
    }
  }, [onMarketingPage, location.pathname]);

  useEffect(() => {
    const handleOpen = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) setPreferences(JSON.parse(saved));
      } catch {}
      setViewMode("manage");
      setIsVisible(true);
    };
    window.addEventListener("dormn_open_cookie_preferences", handleOpen);
    return () => window.removeEventListener("dormn_open_cookie_preferences", handleOpen);
  }, []);

  const saveConsent = useCallback((newPrefs) => {
    try {
      const consentData = { ...newPrefs, essential: true, updatedAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consentData));
      setPreferences(consentData);
      window.dispatchEvent(new CustomEvent("dormn_cookie_consent_saved", { detail: consentData }));
    } catch (e) {
      console.error(e);
    }
    setIsVisible(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2800);
  }, []);

  const toggleCategory = (id) => {
    if (id === "essential") return;
    setPreferences((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!onMarketingPage && viewMode !== "manage") return null;
  if (!isVisible && !showToast) return null;

  return (
    <>
      {/* Toast Confirmation */}
      {showToast && (
        <div className="fixed bottom-24 sm:bottom-6 right-6 z-[99999] flex items-center gap-2.5 rounded-2xl bg-[#0D3A1D] border border-[#93B733]/40 px-4 py-3 text-xs font-bold text-white shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#93B733] text-[#0D3A1D]">
            <Check size={14} strokeWidth={3} />
          </div>
          <span>Cookie preferences saved.</span>
        </div>
      )}

      {isVisible && (
        <div className={`fixed inset-0 z-[50] flex p-3 sm:p-6 pointer-events-none ${
          viewMode === "manage" ? "items-center justify-center" : "items-end justify-start"
        }`}>
          {/* Modal Backdrop */}
          {viewMode === "manage" && (
            <div 
              onClick={() => setIsVisible(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity animate-in fade-in duration-300" 
            />
          )}

          {/* ──────── BANNER SLIDE VIEW (Positioned in Bottom-Left Corner & Above Mobile Dock) ──────── */}
          {viewMode === "banner" ? (
            <div className="pointer-events-auto w-full max-w-md sm:max-w-lg rounded-3xl bg-[#07130B]/95 dark:bg-[#07130B]/95 backdrop-blur-xl border border-white/15 text-white shadow-2xl p-4 sm:p-5 transition-all animate-in slide-in-from-bottom-6 duration-500 relative overflow-hidden mb-20 sm:mb-0">
              <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-[#93B733]/20 blur-[2.5rem] pointer-events-none" />

              <div className="relative z-10 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[#93B733]/20 border border-[#93B733]/40 text-[#93B733]">
                      <Cookie size={20} className="animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
                        <span>Cookie &amp; Privacy Notice</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#93B733]/20 border border-[#93B733]/30 px-2 py-0.5 text-[9px] font-bold text-[#93B733]">
                          <ShieldCheck size={10} /> Verified
                        </span>
                      </h3>
                      <p className="text-[11px] text-gray-400 font-medium">Your choices matter to us</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsVisible(false)}
                    className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                    aria-label="Dismiss banner"
                  >
                    <X size={16} />
                  </button>
                </div>

                <p className="text-xs text-gray-300 font-medium leading-relaxed">
                  We use cookies to enable room bookings, remember preferences, and optimize performance. Read our{" "}
                  <Link to="/cookies" className="text-[#93B733] underline font-bold transition">Cookie Policy</Link>{" "}
                  &amp; <Link to="/privacy" className="text-[#93B733] underline font-bold transition">Privacy Policy</Link>.
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => saveConsent({ essential: true, functional: false, analytics: false, marketing: false })}
                    className="flex-1 py-2 px-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-bold transition cursor-pointer text-center"
                  >
                    Reject All
                  </button>
                  <button
                    onClick={() => setViewMode("manage")}
                    className="flex-1 py-2 px-2.5 rounded-xl border border-[#93B733]/40 bg-[#93B733]/10 hover:bg-[#93B733]/20 text-[#93B733] text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Sliders size={12} />
                    <span>Manage</span>
                  </button>
                  <button
                    onClick={() => saveConsent({ essential: true, functional: true, analytics: true, marketing: true })}
                    className="flex-1 py-2 px-2.5 rounded-xl bg-[#93B733] hover:bg-[#82a32d] text-white text-xs font-black uppercase tracking-wider shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center"
                  >
                    Accept All
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ──────── MANAGE MODAL VIEW (Centered Dialog) ──────── */
            <div className="pointer-events-auto w-full max-w-2xl mx-auto rounded-3xl bg-[#07130B] border border-white/20 text-white shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto z-10 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#93B733]/20 text-[#93B733]">
                    <Sliders size={20} />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-white">Cookie &amp; Tracking Preferences</h2>
                    <p className="text-xs text-gray-400">Customize which categories of cookies you permit.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsVisible(false)}
                  className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 py-4 text-xs">
                {CATEGORIES.map(({ id, name, desc, icon: Icon, color, locked }) => (
                  <div key={id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Icon size={15} className={color} />
                        <strong className="text-sm font-bold text-white">{name}</strong>
                      </div>
                      <p className="text-gray-400 text-xs leading-relaxed">{desc}</p>
                    </div>
                    {locked ? (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase whitespace-nowrap">
                        Always On
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleCategory(id)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                          preferences[id] ? "bg-[#93B733]" : "bg-gray-700"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                            preferences[id] ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10">
                <Link
                  to="/cookies"
                  onClick={() => setIsVisible(false)}
                  className="text-xs font-semibold text-gray-400 hover:text-white underline transition"
                >
                  Read full Cookie Policy
                </Link>
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    onClick={() => saveConsent({ essential: true, functional: false, analytics: false, marketing: false })}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold transition cursor-pointer"
                  >
                    Reject All
                  </button>
                  <button
                    onClick={() => saveConsent(preferences)}
                    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#93B733] hover:bg-[#82a32d] text-white text-xs font-black uppercase tracking-wider shadow-lg transition cursor-pointer"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
