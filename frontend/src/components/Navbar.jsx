import { useLocation, useNavigate, Link, useSearchParams } from "react-router-dom";
import { useContext, useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { motion } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import { AudioContext } from "../context/audioContextValue";
import MacOSDock from "./ui/mac-os-dock";
import { ThemeSwitch } from "./ui/theme-switch-button";
import {
  ChevronDown, LayoutDashboard, LogOut, Music, Pause, Play, SkipForward,
  Building2, Menu, X, ChevronRight, Dumbbell, CalendarHeart, Bot
} from "lucide-react";

const TOP_NAV_TABS = [
  { id: "dormn", label: "Dormn", icon: Building2, path: "/" },
  { id: "events", label: "Events", icon: CalendarHeart, path: "/events" },
  { id: "gym", label: "Gym", icon: Dumbbell, path: "/gym" },
  { id: "dr-dormn", label: "Dr.Dormn", icon: Bot, path: "/dr-dormn" },
];

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout } = useContext(AuthContext);
  const audioContext = useContext(AudioContext);
  const isMyPg = location.pathname.startsWith("/my-pg");
  const isDashboard = useMemo(() => (
    isMyPg || 
    location.pathname.startsWith("/student/dashboard") || 
    location.pathname.startsWith("/my-bookings")
  ), [isMyPg, location.pathname]);

  const currentActiveTab = useMemo(() => {
    if (location.pathname.startsWith("/events") || location.pathname.startsWith("/clubs")) return "events";
    if (location.pathname.startsWith("/gym")) return "gym";
    if (location.pathname.startsWith("/dr-dormn")) return "dr-dormn";
    if (isMyPg) {
      const tab = searchParams.get("tab");
      if (tab === "events" || tab === "gym" || tab === "dr-dormn") return tab;
    }
    return "dormn";
  }, [location.pathname, isMyPg, searchParams]);

  const handleTabClick = useCallback((tab) => {
    if (isMyPg) {
      if (tab.id === "dormn") {
        setSearchParams({}, { replace: true });
      } else {
        setSearchParams({ tab: tab.id }, { replace: true });
      }
    } else {
      navigate(tab.path);
    }
  }, [isMyPg, navigate, setSearchParams]);

  const dockApps = useMemo(() => [
    { id: "/", name: "Home", icon: "/icons/home.webp" },
    { id: "/pgs", name: "Explore", icon: "/icons/explore.webp" },
    { id: "/blogs", name: "Blogs", icon: "/icons/blog.webp" },
    { id: "/about", name: "About Us", icon: "/icons/aboutus.webp" },
    { id: "/faqs", name: "FAQs", icon: "/icons/faq.webp" },
    { id: "/contact", name: "Contact", icon: "/icons/contact.webp" }
  ], []);

  const [hideMobileDock, setHideMobileDock] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const lastScrollY = useRef(0);
  const profileMenuRef = useRef(null);
  const mobileMusicRef = useRef(null);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY;
          const atBottom = (window.innerHeight + currentY) >= (document.documentElement.scrollHeight - 50);

          if (currentY < 10 || atBottom) {
            setHideMobileDock(false);
          } else if (currentY > lastScrollY.current + 5) {
            setHideMobileDock(true);
          } else if (currentY < lastScrollY.current - 5) {
            setHideMobileDock(false);
          }

          lastScrollY.current = currentY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false);
      }
      if (mobileMusicRef.current && !mobileMusicRef.current.contains(e.target) && audioContext?.isOpen) {
        audioContext.setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [audioContext]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsDrawerOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleAppClick = useCallback((appId) => navigate(appId), [navigate]);

  const getDashboardPath = useCallback(() => {
    if (!user) return "/";
    return user.role === "superadmin"
      ? "/superadmin/dashboard"
      : user.role === "owner"
      ? "/owner/dashboard"
      : "/student/dashboard";
  }, [user]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-200/50 dark:border-white/10 bg-white/90 dark:bg-[#0d0d0d] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] 2xl:max-w-[1600px] h-20 items-center justify-between px-4 sm:px-6 md:px-8 lg:px-10">
          
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
            <img
              src="/logo-sm.webp"
              alt="Dormn Logo"
              className="h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 object-contain transition-transform duration-300 group-hover:rotate-6"
            />
            <div>
              <h1 className="text-xl font-black tracking-tight text-[#0D3A1D] dark:text-white sm:text-2xl leading-none">
                Dormn
              </h1>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#4E700F] dark:text-[#93B733] leading-none mt-1 sm:text-[11px]">
                Next Gen Housing
              </p>
            </div>
          </Link>

          {/* Central Area: The 4 Crisp Tabs (Dormn, Events, Gym, Dr.Dormn) */}
          <nav className="hidden sm:flex items-center justify-center flex-1 mx-2 lg:mx-4">
            <div className="flex items-center gap-2 md:gap-4">
              {TOP_NAV_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentActiveTab === tab.id;
                const displayLabel = tab.id === "dormn" ? (isDashboard ? "My PG" : "Dormn") : tab.label;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab)}
                    className={`relative flex items-center gap-2.5 px-5 py-2.5 sm:px-6 sm:py-3 rounded-2xl text-base sm:text-lg font-black tracking-tight transition-all duration-200 whitespace-nowrap select-none ${
                      isActive
                        ? "text-[#0D3A1D] dark:text-[#93B733] scale-105"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white opacity-85 hover:opacity-100 hover:scale-105"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 sm:w-6 sm:h-6 shrink-0 transition-transform ${
                        isActive ? "text-[#0D3A1D] dark:text-[#93B733]" : "text-gray-500 dark:text-gray-300"
                      }`}
                      strokeWidth={isActive ? 2.8 : 2.2}
                    />
                    <span>{displayLabel}</span>

                    {/* Precise, smoothly animated underline matching exact active tab */}
                    {isActive && (
                      <motion.div
                        layoutId="topNavActiveTabUnderline"
                        className="absolute -bottom-1 left-2 right-2 h-[3.5px] bg-[#0D3A1D] dark:bg-[#93B733] rounded-full shadow-[0_0_12px_rgba(147,183,51,0.7)]"
                        transition={{ type: "spring", stiffness: 450, damping: 32 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {audioContext && (
              <div className="lg:hidden relative" ref={mobileMusicRef}>
                <button
                  onClick={audioContext.toggleOpen}
                  aria-label={audioContext.isOpen ? "Close music player" : "Open music player"}
                  className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl border-2 transition-all duration-300 shadow-sm ${
                    audioContext.isPlaying 
                      ? "border-[#93B733] bg-[#93B733] text-white shadow-[#93B733]/30" 
                      : "border-gray-200/80 bg-white/90 text-[#93B733] hover:border-[#93B733]"
                  }`}
                  title="Background Music"
                >
                  <Music size={18} className={audioContext.isPlaying ? "animate-spin-slow" : ""} />
                </button>

                {audioContext.isOpen && (
                  <div className="absolute right-0 top-full mt-2 z-50 flex items-center gap-2.5 rounded-2xl border border-gray-200/90 bg-white/95 backdrop-blur-xl p-2.5 shadow-xl animate-[fadeIn_0.15s_ease-out_forwards] w-[240px] sm:w-[270px]">
                    <div className="flex-1 min-w-0 px-2 flex flex-col justify-center">
                      <p className="truncate text-xs font-black text-[#0D3A1D]">
                        {audioContext.playlist[audioContext.currentTrackIndex].split("/").pop().replace(".mp3", "")}
                      </p>
                      <p className="text-[10px] font-semibold text-gray-500">
                        Playing {audioContext.currentTrackIndex + 1} of {audioContext.playlist.length}
                      </p>
                    </div>
                    <button
                      onClick={audioContext.togglePlay}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#93B733]/10 text-[#93B733] hover:bg-[#93B733] hover:text-white transition-colors"
                    >
                      {audioContext.isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                    </button>
                    <button
                      onClick={audioContext.nextTrack}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                      title="Next Track"
                    >
                      <SkipForward size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {user ? (
              <div className="flex items-center gap-3">
                <ThemeSwitch />
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setIsProfileMenuOpen(prev => !prev)}
                    className="flex items-center gap-2.5 rounded-2xl border-2 border-gray-200/80 dark:border-white/10 bg-white/90 dark:bg-[#121212]/90 px-3 py-1.5 shadow-sm hover:border-[#93B733]/50 hover:shadow-md transition-all duration-200 active:scale-[0.98]"
                    aria-label="User Profile Menu"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0D3A1D] dark:bg-[#93B733] text-white dark:text-[#0D3A1D] font-black text-sm uppercase shadow-sm">
                      {user.name ? user.name.charAt(0) : (user.email ? user.email.charAt(0) : "U")}
                    </div>

                    <div className="hidden sm:flex flex-col text-left leading-tight">
                      <span className="text-xs font-black text-[#0D3A1D] dark:text-white truncate max-w-[100px]">
                        {user.name || "My Account"}
                      </span>
                      <span className="text-[10px] font-extrabold uppercase text-[#4E700F] dark:text-[#93B733]">
                        {user.role || "User"}
                      </span>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isProfileMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] backdrop-blur-xl p-2 shadow-2xl z-50 animate-[fadeIn_0.15s_ease-out_forwards]">
                      <div className="px-3 py-2 border-b border-gray-100 dark:border-white/10 mb-1.5">
                        <p className="text-xs font-black text-[#0D3A1D] dark:text-white truncate">{user.name || "User Account"}</p>
                        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 truncate mt-0.5">{user.email}</p>
                      </div>

                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          navigate(getDashboardPath());
                        }}
                        className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-extrabold text-[#0D3A1D] dark:text-gray-200 hover:bg-[#93B733]/15 hover:text-[#0D3A1D] dark:hover:text-[#93B733] transition-all"
                      >
                        <LayoutDashboard className="h-4 w-4 text-[#93B733]" />
                        Dashboard
                      </button>

                      {user.role === "student" && (
                        <button
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            navigate("/my-pg");
                          }}
                          className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-extrabold text-[#0D3A1D] dark:text-gray-200 hover:bg-[#93B733]/15 hover:text-[#0D3A1D] dark:hover:text-[#93B733] transition-all mt-0.5"
                        >
                          <Building2 className="h-4 w-4 text-[#93B733]" />
                          My PG
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          logout();
                          navigate("/");
                        }}
                        className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-extrabold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all mt-1"
                      >
                        <LogOut className="h-4 w-4 text-red-500" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>

                {/* Three-line Menu Button on /my-pg */}
                {isMyPg && (
                  <button
                    onClick={() => setIsDrawerOpen(true)}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-gray-200/80 dark:border-white/10 bg-white/90 dark:bg-[#121212]/90 text-[#0D3A1D] dark:text-gray-200 hover:border-[#93B733] hover:text-[#93B733] transition-all duration-200 shadow-sm active:scale-95 shrink-0"
                    title="Menu"
                    aria-label="Navigation Menu"
                  >
                    <Menu size={20} />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/auth?role=owner&mode=signup"
                  className="hidden sm:inline-flex rounded-2xl border-2 border-gray-200 bg-white px-6 py-2.5 text-base font-extrabold text-[#0D3A1D] transition-all hover:bg-gray-50 hover:border-gray-300"
                >
                  Become an Owner
                </Link>
                <ThemeSwitch />
                <Link
                  to="/auth"
                  className="rounded-2xl bg-[#0D3A1D] px-6 py-2.5 text-base font-extrabold text-white transition-all hover:bg-[#07130B] shadow-[0_4px_12px_rgba(13,58,29,0.15)]"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile: 4 Core Tabs for Resident & Utility Views */}
      {(isMyPg || currentActiveTab !== "dormn") ? (
        <div className={`sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-gray-200/50 dark:border-white/10 transition-all duration-300 ${hideMobileDock ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
          <div className="flex items-center justify-around px-2 py-2">
            {TOP_NAV_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentActiveTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab)}
                  className={`relative flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "text-[#0D3A1D] dark:text-[#93B733]"
                      : "text-gray-500 dark:text-gray-300"
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.8 : 2} />
                  <span className={`text-[11px] ${isActive ? "font-black" : "font-semibold"}`}>{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="myPgActiveMobileTabUnderline"
                      className="absolute -bottom-1 w-6 h-[2.5px] bg-[#0D3A1D] dark:bg-[#93B733] rounded-full shadow-[0_0_8px_rgba(147,183,51,0.7)]"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Floating Bottom MacOS Dock: ONLY for Dormn marketing pages */
        <div className={`fixed bottom-4 left-0 right-0 z-50 flex justify-center pointer-events-none transition-all duration-300 ${hideMobileDock ? 'translate-y-32 opacity-0' : 'translate-y-0 opacity-100'}`}>
          <div className="pointer-events-auto">
            <MacOSDock
              apps={dockApps}
              onAppClick={handleAppClick}
              openApps={[location.pathname]}
            />
          </div>
        </div>
      )}

      {/* Slide-out Sidebar Slider Drawer for /my-pg */}
      {isMyPg && (
        <>
          <div
            onClick={() => setIsDrawerOpen(false)}
            className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
              isDrawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
          />

          <aside
            className={`fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[380px] bg-white dark:bg-[#0c1220] border-l border-gray-200/80 dark:border-white/10 shadow-2xl p-6 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
              isDrawerOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <img src="/logo-sm.webp" alt="Dormn" className="h-8 w-8 object-contain" />
                  <div>
                    <h3 className="text-base font-black text-[#0D3A1D] dark:text-white leading-none">
                      Services & Menu
                    </h3>
                    <p className="text-[10px] font-bold text-[#4E700F] dark:text-[#93B733] uppercase tracking-widest mt-1">
                      Quick Navigation
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition"
                  aria-label="Close Menu"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-6 space-y-3.5">
                {[
                  {
                    path: "/pgs",
                    name: "Explore PGs",
                    subtitle: "Browse & discover verified hostels",
                    icon: "/icons/explore.webp"
                  },
                  {
                    path: "/faqs",
                    name: "FAQs & Guide",
                    subtitle: "Common resident questions & policies",
                    icon: "/icons/faq.webp"
                  },
                  {
                    path: "/contact",
                    name: "Contact Support",
                    subtitle: "24/7 dedicated tenant assistance",
                    icon: "/icons/contact.webp"
                  }
                ].map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      setIsDrawerOpen(false);
                      navigate(item.path);
                    }}
                    className="w-full group flex items-center gap-4 rounded-2xl border border-gray-200/70 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.03] p-4 text-left hover:border-[#93B733]/50 hover:bg-[#93B733]/10 dark:hover:bg-[#93B733]/10 hover:shadow-md transition-all duration-200 active:scale-[0.99]"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-black/40 p-2 shadow-sm border border-gray-100 dark:border-white/5 group-hover:scale-105 transition-transform duration-200">
                      <img
                        src={item.icon}
                        alt={item.name}
                        className="h-10 w-10 object-contain drop-shadow-sm"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black text-gray-900 dark:text-white group-hover:text-[#0D3A1D] dark:group-hover:text-[#93B733] transition-colors">
                        {item.name}
                      </h4>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>

                    <ChevronRight size={18} className="text-gray-400 group-hover:text-[#93B733] group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-white/10 text-center">
              <p className="text-xs font-bold text-gray-400">
                Dormn Resident Portal
              </p>
            </div>
          </aside>
        </>
      )}
    </>
  );
};

export default memo(Navbar);
