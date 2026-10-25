import { NavLink, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useContext, useState, useEffect, useRef } from "react";
import {
  LogOut,
  X,
  PanelLeftOpen,
  PanelLeftClose,
  ChevronRight,
  Search,
  History,
  Compass,
  ChevronDown,
  CalendarHeart,
  Dumbbell,
  Bot,
  Video,
  Building2,
  Bookmark,
  Ticket,
} from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import OwnerProfileModal from "./OwnerProfileModal";
import OwnerSearchModal from "./OwnerSearchModal";
import { OWNER_NAV_CONFIG, ALL_PAGE_ITEMS } from "./ownerNavConfig";
import api from "../../services/api";
import { getUnseenCount, markOwnerCategorySeen } from "../../utils/ownerSeenBadges";

const AdminSidebar = ({ closeSidebar, toggleCollapse, isCollapsed = false, isMobile = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [, setSeenTick] = useState(0);

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  // Close profile popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    if (isProfileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  // Close profile menu on navigation
  useEffect(() => {
    setIsProfileMenuOpen(false);
  }, [location.pathname]);

  const [openSections, setOpenSections] = useState({
    profile: false,
    recents: false,
    pgDetails: false,
    listings: false,
    finance: false,
    settings: false,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab] = useState("profile");

  // Recents loaded from localStorage
  const [recents, setRecents] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("dormn_owner_recents") || "[]");
      if (Array.isArray(saved) && saved.length > 0) return saved;
    } catch {}
    return [
      { title: "Dashboard", path: "/owner/dashboard" },
      { title: "My PG", path: "/owner/my-pgs" },
    ];
  });

  const [counts, setCounts] = useState({
    myPgs: 0,
    bookings: 0,
    pendingBookings: 0,
    cancellations: 0,
    pendingCancellations: 0,
    requests: 0,
    openRequests: 0,
    tenants: 0,
    kycForms: 0,
    payments: 0,
    notifications: 0,
  });

  const authContext = useContext(AuthContext);
  const user = authContext?.user || JSON.parse(localStorage.getItem("user") || "{}");
  const ownerName = user?.full_name || user?.name || user?.username || "PG Owner";
  const ownerInitial = ownerName?.charAt(0)?.toUpperCase() || "O";

  // Ctrl+K keyboard shortcut & custom open event
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    const handleCustomOpen = () => setIsSearchModalOpen(true);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("dormn_open_search", handleCustomOpen);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("dormn_open_search", handleCustomOpen);
    };
  }, []);

  // Track recent visited pages
  useEffect(() => {
    const path = location.pathname;
    const tabParam = searchParams.get("tab");
    const fullTarget = path.includes("/owner/profile") && tabParam ? `${path}?tab=${tabParam}` : path;

    const matched = ALL_PAGE_ITEMS.find(
      (item) => item.path === fullTarget || (!item.tabId && item.path === path)
    );

    if (matched) {
      setRecents((prev) => {
        const filtered = prev.filter((r) => r.path !== matched.path);
        const updated = [{ title: matched.title, path: matched.path }, ...filtered].slice(0, 5);
        try {
          localStorage.setItem("dormn_owner_recents", JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }
  }, [location.pathname, location.search, searchParams]);

  // Auto-mark category as seen
  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/owner/my-pgs")) markOwnerCategorySeen("myPgs", counts.myPgs);
    if (path.includes("/owner/bookings")) {
      markOwnerCategorySeen("pendingBookings", counts.pendingBookings);
      markOwnerCategorySeen("bookings", counts.bookings);
    }
    if (path.includes("/owner/cancellations")) {
      markOwnerCategorySeen("pendingCancellations", counts.pendingCancellations);
      markOwnerCategorySeen("cancellations", counts.cancellations);
    }
    if (path.includes("/owner/requests")) {
      markOwnerCategorySeen("openRequests", counts.openRequests);
      markOwnerCategorySeen("requests", counts.requests);
    }
    if (path.includes("/owner/students")) markOwnerCategorySeen("tenants", counts.tenants);
    if (path.includes("/owner/kyc-forms")) markOwnerCategorySeen("kycForms", counts.kycForms);
    if (path.includes("/owner/payments")) markOwnerCategorySeen("payments", counts.payments);
  }, [location.pathname, counts]);

  // Fetch live counts
  useEffect(() => {
    const fetchSidebarCounts = async () => {
      try {
        const pgsRes = await api.get("/pg/owner/my-pgs").catch(() => ({ data: { pgs: [] } }));
        const pgsList = pgsRes.data?.pgs || [];

        const bRes = await api.get("/bookings/owner-bookings").catch(() => ({ data: { bookings: [] } }));
        const rawBookings = bRes.data?.bookings || [];

        const bGrouped = {};
        rawBookings.filter((b) => b.status !== "paused").forEach((b) => {
          const studentKey = (b.student_email || b.email || b.student_name || String(b.student_id || b.user_id || "")).toLowerCase().trim();
          const pgKey = (b.title || b.pg_title || b.pg_name || String(b.pg_id || "")).toLowerCase().trim();
          const key = `${studentKey}_${pgKey}`;
          const bTime = new Date(b.created_at || 0).getTime() || Number(b.id) || 0;
          const gTime = bGrouped[key] ? (new Date(bGrouped[key].created_at || 0).getTime() || Number(bGrouped[key].id) || 0) : -1;
          if (!bGrouped[key] || bTime > gTime) {
            bGrouped[key] = b;
          }
        });
        const visibleB = Object.values(bGrouped);
        const pendingB = visibleB.filter((b) => b.status === "pending").length;
        const paidB = visibleB.filter((b) => b.payment_status === "paid").length;
        const approvedOrPaid = visibleB.filter((b) => b.status === "approved" || b.payment_status === "paid");

        let cancelTotal = 0;
        let cancelPending = 0;
        try {
          const cancelRes = await api.get("/bookings/owner-cancellations").catch(() => ({ data: { cancellations: [], counts: {} } }));
          cancelTotal = cancelRes.data?.counts?.total || (cancelRes.data?.cancellations || []).length || 0;
          cancelPending = cancelRes.data?.counts?.pending || (cancelRes.data?.cancellations || []).filter((c) => c.cancellation_status === "pending").length || 0;
        } catch {}

        const myPgIds = new Set(pgsList.map((p) => String(p.id)));
        const myPgTitles = new Set(pgsList.map((p) => (p.title || "").toLowerCase().trim()));

        let rawReqs = [];
        try { rawReqs = (await api.get("/maintenance/owner")).data?.requests || []; } catch {
          try { rawReqs = (await api.get("/student-portal/owner-requests")).data?.requests || []; } catch {}
        }
        try {
          const local = JSON.parse(localStorage.getItem("dormn_resident_requests") || "[]");
          if (Array.isArray(local)) {
            const cleanLocal = local.filter((r) =>
              r.student_name !== "Rahul Sharma" &&
              !String(r.id).includes("demo") &&
              !String(r.id).includes("1787822400001") &&
              !String(r.title || "").toLowerCase().includes("wi-fi router speed issue") &&
              (myPgIds.has(String(r.pg_id)) || myPgTitles.has((r.pg_title || "").toLowerCase().trim()))
            );
            const ids = new Set(rawReqs.map((r) => String(r.id)));
            cleanLocal.forEach((lr) => { if (!ids.has(String(lr.id))) rawReqs.push(lr); });
          }
        } catch {}

        const reqs = pgsList.length > 0
          ? rawReqs.filter((r) => myPgIds.has(String(r.pg_id)) || myPgTitles.has((r.pg_title || "").toLowerCase().trim()))
          : [];
        const openReqs = reqs.filter((r) => r.status !== "closed" && r.status !== "resolved").length;

        let kycList = [];
        try { kycList = (await api.get("/enrollments/owner-list")).data?.enrollments || []; } catch {
          try { kycList = (await api.get("/enrollments/all")).data?.enrollments || []; } catch {}
        }
        try {
          const localKyc = JSON.parse(localStorage.getItem("dormn_kyc_enrollments") || "[]");
          if (Array.isArray(localKyc)) {
            const cleanKyc = localKyc.filter((k) => myPgIds.has(String(k.pg_id)) || myPgTitles.has((k.pg_title || "").toLowerCase().trim()));
            const ids = new Set(kycList.map((k) => String(k.id || k.booking_id)));
            cleanKyc.forEach((lk) => { if (!ids.has(String(lk.id || lk.booking_id))) kycList.push(lk); });
          }
        } catch {}

        const finalKycList = pgsList.length > 0
          ? kycList.filter((k) => myPgIds.has(String(k.pg_id)) || myPgTitles.has((k.pg_title || "").toLowerCase().trim()))
          : [];

        let unreadNotifications = 0;
        try {
          unreadNotifications = Number((await api.get("/notifications")).data?.unreadCount || 0);
        } catch {}

        setCounts({
          notifications: unreadNotifications,
          myPgs: pgsList.length,
          bookings: visibleB.length,
          pendingBookings: pendingB,
          cancellations: cancelTotal,
          pendingCancellations: cancelPending,
          requests: reqs.length,
          openRequests: openReqs,
          tenants: approvedOrPaid.length,
          kycForms: finalKycList.length,
          payments: paidB,
        });
      } catch (err) {
        console.error("Error fetching sidebar counts:", err);
      }
    };

    const handleSeenUpdate = () => setSeenTick((t) => t + 1);

    fetchSidebarCounts();
    window.addEventListener("storage", fetchSidebarCounts);
    window.addEventListener("dormn_request_updated", fetchSidebarCounts);
    window.addEventListener("dormn_seen_counts_updated", handleSeenUpdate);
    return () => {
      window.removeEventListener("storage", fetchSidebarCounts);
      window.removeEventListener("dormn_request_updated", fetchSidebarCounts);
      window.removeEventListener("dormn_seen_counts_updated", handleSeenUpdate);
    };
  }, []);

  // Optimized badge map
  const getBadgeForPath = (path) => {
    if (path && (location.pathname === path || location.pathname.startsWith(path + "/"))) {
      return null;
    }
    const map = {
      "/owner/my-pgs": () => {
        const u = getUnseenCount("myPgs", counts.myPgs);
        return u > 0 ? { count: u, color: "bg-purple-500/15 text-purple-600 dark:text-purple-400" } : null;
      },
      "/owner/bookings": () => {
        const uP = getUnseenCount("pendingBookings", counts.pendingBookings);
        if (uP > 0) return { count: `${uP} New`, color: "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-black animate-pulse" };
        const uT = getUnseenCount("bookings", counts.bookings);
        return uT > 0 ? { count: uT, color: "bg-blue-500/15 text-blue-600 dark:text-blue-400" } : null;
      },
      "/owner/cancellations": () => {
        const uP = getUnseenCount("pendingCancellations", counts.pendingCancellations);
        if (uP > 0) return { count: `${uP} New`, color: "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-black animate-pulse" };
        const uT = getUnseenCount("cancellations", counts.cancellations);
        return uT > 0 ? { count: uT, color: "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400" } : null;
      },
      "/owner/requests": () => {
        const uO = getUnseenCount("openRequests", counts.openRequests);
        if (uO > 0) return { count: `${uO} Open`, color: "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-black" };
        const uT = getUnseenCount("requests", counts.requests);
        return uT > 0 ? { count: uT, color: "bg-gray-100 dark:bg-white/10 text-gray-400" } : null;
      },
      "/owner/students": () => {
        const u = getUnseenCount("tenants", counts.tenants);
        return u > 0 ? { count: u, color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" } : null;
      },
      "/owner/kyc-forms": () => {
        const u = getUnseenCount("kycForms", counts.kycForms);
        return u > 0 ? { count: u, color: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400" } : null;
      },
      "/owner/payments": () => {
        if (Number(counts.notifications || 0) > 0) return { count: `${counts.notifications} New`, color: "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-black animate-pulse" };
        const u = getUnseenCount("payments", counts.payments);
        return u > 0 ? { count: u, color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" } : null;
      },
    };
    return map[path] ? map[path]() : null;
  };

  const handleLogout = () => {
    if (closeSidebar) closeSidebar();
    if (authContext?.logout) authContext.logout();
    else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    navigate("/auth");
  };

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNavigate = (path) => {
    const seenMap = {
      "/owner/my-pgs": ["myPgs", counts.myPgs],
      "/owner/bookings": ["pendingBookings", counts.pendingBookings],
      "/owner/cancellations": ["pendingCancellations", counts.pendingCancellations],
      "/owner/requests": ["openRequests", counts.openRequests],
      "/owner/students": ["tenants", counts.tenants],
      "/owner/kyc-forms": ["kycForms", counts.kycForms],
      "/owner/payments": ["payments", counts.payments],
    };

    Object.entries(seenMap).forEach(([prefix, [key, count]]) => {
      if (path.includes(prefix)) markOwnerCategorySeen(key, count);
    });

    setIsSearchModalOpen(false);
    if (closeSidebar) closeSidebar();
    navigate(path);
  };

  return (
    <>
      <aside
        className={`relative flex h-screen flex-col border-r border-gray-200 dark:border-white/10 bg-white dark:bg-[#0b1020] transition-[width] duration-200 ease-in-out ${
          isMobile ? "w-full" : isCollapsed ? "w-[80px]" : "w-[260px]"
        }`}
      >
        {/* Top Branding */}
        <div
          onClick={isCollapsed ? toggleCollapse : undefined}
          className={`group flex items-center px-3.5 sm:px-4 py-3 sm:py-3.5 ${
            isCollapsed ? "justify-center cursor-pointer" : "justify-between"
          }`}
          title={isCollapsed ? "Click logo to expand sidebar" : undefined}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative h-8 w-8 overflow-hidden rounded-xl shrink-0">
              <img
                src="/logo.png"
                alt="Dormn Logo"
                className="h-full w-full object-contain"
                loading="eager"
                decoding="sync"
              />
              {isCollapsed && (
                <div className="absolute inset-0 flex items-center justify-center bg-black dark:bg-[#0b1020] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <PanelLeftOpen size={16} />
                </div>
              )}
            </div>

            {!isCollapsed && (
              <div className="min-w-0">
                <h2 className="text-base font-black tracking-tight text-gray-900 dark:text-white leading-none">
                  Dormn
                </h2>
                <p className="text-[9px] uppercase font-bold tracking-widest text-gray-400 mt-0.5">
                  Owner Portal
                </p>
              </div>
            )}
          </div>

          {!isCollapsed && toggleCollapse && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleCollapse();
              }}
              className="hidden xl:flex h-7 w-7 items-center justify-center rounded-lg bg-gray-50 dark:bg-white/5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 transition cursor-pointer"
              title="Collapse Sidebar"
            >
              <PanelLeftClose size={14} />
            </button>
          )}

          {closeSidebar && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeSidebar();
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-500 xl:hidden cursor-pointer"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* 1. Quick Search Button */}
        {!isCollapsed ? (
          <div className="px-3 pt-3 pb-1.5">
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.04] text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.08] hover:border-gray-300 dark:hover:border-white/20 transition cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <Search size={14} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                <span>Search pages...</span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5">
                Ctrl K
              </span>
            </button>
          </div>
        ) : (
          <div className="px-2 pt-3 pb-1.5 flex justify-center">
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="h-9 w-9 flex items-center justify-center rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.04] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.08] transition cursor-pointer"
              title="Search (Ctrl+K)"
            >
              <Search size={15} />
            </button>
          </div>
        )}

        {/* Navigation Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-2 space-y-1 scrollbar-none">
              {/* 2. RECENTS */}
              <div>
                <button
                  onClick={() => (isCollapsed ? toggleCollapse && toggleCollapse() : toggleSection("recents"))}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs sm:text-[13px] font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition cursor-pointer group ${
                    isCollapsed ? "justify-center" : ""
                  }`}
                  title={isCollapsed ? "Recents" : undefined}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <History size={16} className="text-gray-500 group-hover:text-blue-500 shrink-0 transition" />
                    {!isCollapsed && <span className="truncate">Recents</span>}
                  </div>
                  {!isCollapsed && (
                    <ChevronRight
                      size={14}
                      className={`text-gray-400 transition-transform duration-200 shrink-0 ${
                        openSections.recents ? "rotate-90 text-blue-500" : ""
                      }`}
                    />
                  )}
                </button>

                {!isCollapsed && openSections.recents && (
                  <div className="pl-4 pr-1 space-y-0.5 border-l border-gray-200/80 dark:border-white/10 ml-4 my-1">
                    {recents.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => handleNavigate(item.path)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition text-left cursor-pointer truncate"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500/70 shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* DYNAMIC RENDERING OF CONFIG ITEMS */}
              {OWNER_NAV_CONFIG.map((item) => {
                const Icon = item.icon;

                // Divider
                if (item.type === "divider") {
                  return (
                    <div key={item.id} className="pt-2 pb-1">
                      <div className="h-px w-full bg-gray-100 dark:bg-white/5" />
                    </div>
                  );
                }

                // Direct link
                if (item.type === "link") {
                  return (
                    <NavLink
                      key={item.id}
                      to={item.path}
                      onClick={() => handleNavigate(item.path)}
                      title={isCollapsed ? item.title : undefined}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-2.5 py-2 rounded-xl text-xs sm:text-[13px] font-semibold transition ${
                          isCollapsed ? "justify-center" : ""
                        } ${
                          isActive
                            ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                        }`
                      }
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon size={16} className={`shrink-0 ${item.id === "sponsor" ? "text-amber-500" : item.id === "pricing" ? "text-amber-500" : ""}`} />
                        {!isCollapsed && <span className="truncate">{item.title}</span>}
                      </div>
                      {!isCollapsed && item.id === "pricing" && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                          Soon
                        </span>
                      )}
                    </NavLink>
                  );
                }

                // Collapsible group (PG Details, Listings, Finance, Profile)
                if (item.type === "group") {
                  const isOpen = Boolean(openSections[item.id]);
                  return (
                    <div key={item.id}>
                      <button
                        onClick={() => (isCollapsed ? toggleCollapse && toggleCollapse() : toggleSection(item.id))}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs sm:text-[13px] font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition cursor-pointer group ${
                          isCollapsed ? "justify-center" : ""
                        }`}
                        title={isCollapsed ? item.title : undefined}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon size={16} className={`text-gray-500 group-hover:${item.accent} shrink-0 transition`} />
                          {!isCollapsed && <span className="truncate">{item.title}</span>}
                        </div>
                        {!isCollapsed && (
                          <ChevronRight
                            size={14}
                            className={`text-gray-400 transition-transform duration-200 shrink-0 ${
                              isOpen ? `rotate-90 ${item.accent}` : ""
                            }`}
                          />
                        )}
                      </button>

                      {!isCollapsed && isOpen && (
                        <div className="pl-4 pr-1 space-y-0.5 border-l border-gray-200/80 dark:border-white/10 ml-4 my-1">
                          {item.children.map((sub) => {
                            const SubIcon = sub.icon;

                            // If this child item has nested sub-children (e.g. PGs, Events)
                            if (sub.children && Array.isArray(sub.children)) {
                              const subId = sub.id || sub.title.toLowerCase();
                              const isSubOpen = Boolean(openSections[subId]);
                              const isAnySubActive = sub.children.some(
                                (c) => location.pathname === c.path || location.pathname.startsWith(c.path + "/")
                              );

                              return (
                                <div key={subId} className="space-y-0.5">
                                  <button
                                    type="button"
                                    onClick={() => toggleSection(subId)}
                                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                      isAnySubActive
                                        ? "text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-500/5"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <SubIcon size={14} className="shrink-0 opacity-80" />
                                      <span className="truncate">{sub.title}</span>
                                    </div>
                                    <ChevronRight
                                      size={12}
                                      className={`text-gray-400 transition-transform duration-200 shrink-0 ${
                                        isSubOpen ? "rotate-90 text-blue-500" : ""
                                      }`}
                                    />
                                  </button>

                                  {isSubOpen && (
                                    <div className="pl-3 pr-1 space-y-0.5 border-l border-gray-200/60 dark:border-white/10 ml-3 my-0.5">
                                      {sub.children.map((nested) => {
                                        const NestedIcon = nested.icon;
                                        return (
                                          <NavLink
                                            key={nested.path}
                                            to={nested.path}
                                            onClick={() => handleNavigate(nested.path)}
                                            className={({ isActive }) =>
                                              `flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                                                isActive
                                                  ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                                                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                                              }`
                                            }
                                          >
                                            <div className="flex items-center gap-2 min-w-0">
                                              <NestedIcon size={13} className="shrink-0 opacity-80" />
                                              <span className="truncate">{nested.title}</span>
                                            </div>
                                          </NavLink>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            }

                            const badge = getBadgeForPath(sub.path);
                            return (
                              <NavLink
                                key={sub.path}
                                to={sub.path}
                                onClick={() => handleNavigate(sub.path)}
                                className={({ isActive }) =>
                                  `flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-semibold transition ${
                                    isActive
                                      ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                                  }`
                                }
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <SubIcon size={14} className="shrink-0 opacity-80" />
                                  <span className="truncate">{sub.title}</span>
                                </div>
                                {badge && (
                                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black shrink-0 ${badge.color}`}>
                                    {badge.count}
                                  </span>
                                )}
                              </NavLink>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                // Settings with 3rd image sub-buttons
                if (item.type === "settings") {
                  const isOpen = Boolean(openSections.settings);
                  return (
                    <div key={item.id}>

                      <button
                        onClick={() => (isCollapsed ? toggleCollapse && toggleCollapse() : toggleSection("settings"))}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs sm:text-[13px] font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition cursor-pointer group ${
                          isCollapsed ? "justify-center" : ""
                        }`}
                        title={isCollapsed ? "Settings" : undefined}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon size={16} className="text-gray-500 group-hover:text-purple-500 shrink-0 transition" />
                          {!isCollapsed && <span className="truncate">Settings</span>}
                        </div>
                        {!isCollapsed && (
                          <ChevronRight
                            size={14}
                            className={`text-gray-400 transition-transform duration-200 shrink-0 ${
                              isOpen ? "rotate-90 text-purple-500" : ""
                            }`}
                          />
                        )}
                      </button>

                      {!isCollapsed && isOpen && (
                        <div className="pl-4 pr-1 space-y-0.5 border-l border-gray-200/80 dark:border-white/10 ml-4 my-1">
                          {item.children.map((sub) => {
                            const SubIcon = sub.icon;
                            const isTabActive =
                              location.pathname.includes("/owner/profile") &&
                              (searchParams.get("tab") || "profile") === sub.tab;

                            return (
                              <button
                                key={sub.tab}
                                onClick={() => handleNavigate(`/owner/profile?tab=${sub.tab}`)}
                                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-semibold transition text-left cursor-pointer ${
                                  isTabActive
                                    ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                                }`}
                              >
                                <SubIcon size={13} className="shrink-0 opacity-80" />
                                <span className="truncate">{sub.title}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                return null;
              })}
        </div>

        {/* Bottom Section (Owner Account Popup Menu) */}
        <div ref={profileMenuRef} className="relative px-2.5 sm:px-3 pt-2 border-t border-gray-100 dark:border-white/5 pb-3 sm:pb-4">
          
          {/* Pop-up Menu */}
          {isProfileMenuOpen && (
            <div
              className={`absolute z-50 rounded-2xl bg-white dark:bg-[#0f1422] border border-gray-200 dark:border-white/15 p-1.5 shadow-2xl shadow-black/40 dark:shadow-black/80 ${
                isCollapsed
                  ? "bottom-0 left-full ml-2 w-56"
                  : "bottom-full mb-2 left-2.5 right-2.5"
              }`}
            >
              <div className="px-3 py-2 border-b border-gray-100 dark:border-white/10 mb-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Signed in as</p>
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{ownerName}</p>
              </div>

              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    navigate("/explore");
                    setIsProfileMenuOpen(false);
                    if (closeSidebar) closeSidebar();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-white/10 transition text-left cursor-pointer"
                >
                  <Compass size={15} className="text-emerald-500 shrink-0" />
                  <span>Explore Page</span>
                </button>

                {/* PGs Dropdown in Popup */}
                <div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenSections((prev) => ({ ...prev, popupPgs: !prev.popupPgs }));
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-white/10 transition text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Building2 size={15} className="text-emerald-500 shrink-0" />
                      <span className="truncate">PGs</span>
                    </div>
                    <ChevronRight
                      size={13}
                      className={`text-gray-400 transition-transform duration-200 shrink-0 ${
                        openSections.popupPgs ? "rotate-90 text-emerald-500" : ""
                      }`}
                    />
                  </button>

                  {openSections.popupPgs && (
                    <div className="pl-4 pr-1 space-y-0.5 border-l border-gray-200/60 dark:border-white/10 ml-4 my-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          navigate("/owner/booked-pgs");
                          setIsProfileMenuOpen(false);
                          if (closeSidebar) closeSidebar();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition text-left cursor-pointer"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span>Booked PG</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigate("/owner/saved-pgs");
                          setIsProfileMenuOpen(false);
                          if (closeSidebar) closeSidebar();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition text-left cursor-pointer"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                        <span>Saved PG</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Events Dropdown in Popup */}
                <div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenSections((prev) => ({ ...prev, popupEvents: !prev.popupEvents }));
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-white/10 transition text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CalendarHeart size={15} className="text-pink-500 shrink-0" />
                      <span className="truncate">Events</span>
                    </div>
                    <ChevronRight
                      size={13}
                      className={`text-gray-400 transition-transform duration-200 shrink-0 ${
                        openSections.popupEvents ? "rotate-90 text-pink-500" : ""
                      }`}
                    />
                  </button>

                  {openSections.popupEvents && (
                    <div className="pl-4 pr-1 space-y-0.5 border-l border-gray-200/60 dark:border-white/10 ml-4 my-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          navigate("/events?view=tickets");
                          setIsProfileMenuOpen(false);
                          if (closeSidebar) closeSidebar();
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition text-left cursor-pointer"
                      >
                        <Ticket size={12} className="text-pink-500 shrink-0" />
                        <span>Booked Tickets</span>
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    navigate("/gym");
                    setIsProfileMenuOpen(false);
                    if (closeSidebar) closeSidebar();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-white/10 transition text-left cursor-pointer"
                >
                  <Dumbbell size={15} className="text-amber-500 shrink-0" />
                  <span>Gym</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigate("/dr-dormn");
                    setIsProfileMenuOpen(false);
                    if (closeSidebar) closeSidebar();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-white/10 transition text-left cursor-pointer"
                >
                  <Bot size={15} className="text-cyan-500 shrink-0" />
                  <span>Dr. Dormn</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigate("/dormgle");
                    setIsProfileMenuOpen(false);
                    if (closeSidebar) closeSidebar();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-white/10 transition text-left cursor-pointer"
                >
                  <Video size={15} className="text-indigo-500 shrink-0" />
                  <span>Dormgle</span>
                </button>
              </div>

              <div className="my-1 border-t border-gray-100 dark:border-white/10" />

              <button
                type="button"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition text-left cursor-pointer"
              >
                <LogOut size={15} className="shrink-0" />
                <span>Logout</span>
              </button>
            </div>
          )}

          {/* Profile Card Tile */}
          <div
            onClick={() => setIsProfileMenuOpen((prev) => !prev)}
            className={`flex items-center rounded-xl bg-gray-50 dark:bg-white/[0.03] p-2 transition cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 select-none ${
              isProfileMenuOpen ? "ring-2 ring-blue-500/40 bg-gray-100 dark:bg-white/10" : ""
            } ${
              isCollapsed ? "justify-center" : "gap-2.5"
            }`}
            title="Account Menu"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-pink-500 via-rose-500 to-cyan-500 text-xs font-black text-white shadow-xs">
              {ownerInitial}
            </div>
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                    {ownerName}
                  </h3>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-gray-400 dark:text-gray-500 shrink-0 transition-transform duration-200 ${
                    isProfileMenuOpen ? "rotate-180 text-blue-500 dark:text-blue-400" : ""
                  }`}
                />
              </>
            )}
          </div>
        </div>
      </aside>

      {isModalOpen && (
        <OwnerProfileModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialTab={modalTab}
        />
      )}

      {isSearchModalOpen && (
        <OwnerSearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
          onSelectPage={handleNavigate}
          recents={recents}
        />
      )}
    </>
  );
};

export default AdminSidebar;