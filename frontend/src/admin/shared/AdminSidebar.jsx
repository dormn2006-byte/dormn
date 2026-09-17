import { NavLink, useNavigate } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import {
  LayoutDashboard,
  PlusSquare,
  Building2,
  BookOpenCheck,
  Users,
  LogOut,
  CreditCard,
  ClipboardList,
  X,
  ShieldCheck,
  PanelLeftOpen,
  PanelLeftClose,
  ChevronUp,
  User,
  Zap,
  Wrench,
  Settings as SettingsIcon,
  Sparkles,
  UserMinus,
  MessageSquare,
} from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import OwnerProfileModal from "./OwnerProfileModal";
import api from "../../services/api";

const navItems = [
  {
    title: "Dashboard",
    path: "/owner/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Add PG",
    path: "/owner/add-pg",
    icon: PlusSquare,
  },
  {
    title: "My PGs",
    path: "/owner/my-pgs",
    icon: Building2,
  },
  {
    title: "Pricing",
    path: "/owner/pricing",
    icon: CreditCard,
  },
  {
    title: "Community Chat",
    path: "/owner/chat",
    icon: MessageSquare,
  },
  {
    title: "All Bookings",
    path: "/owner/bookings",
    icon: BookOpenCheck,
  },
  {
    title: "Cancellations",
    path: "/owner/cancellations",
    icon: UserMinus,
  },
  {
    title: "All Requests",
    path: "/owner/requests",
    icon: Wrench,
  },
  {
    title: "All Tenants",
    path: "/owner/students",
    icon: Users,
  },
  {
    title: "All KYC Forms",
    path: "/owner/kyc-forms",
    icon: ClipboardList,
  },
  {
    title: "All Payments",
    path: "/owner/payments",
    icon: CreditCard,
  },
  {
    title: "My Profile",
    path: "/owner/profile",
    icon: User,
  },
];

const AdminSidebar = ({ closeSidebar, toggleCollapse, isCollapsed = false, isMobile = false }) => {
  const navigate = useNavigate();

  const isPhoneSlider = isMobile || Boolean(closeSidebar);
  const DOCK_PATHS = ["/owner/add-pg", "/owner/my-pgs", "/owner/bookings", "/owner/payments"];
  const visibleNavItems = isPhoneSlider
    ? navItems.filter((item) => !DOCK_PATHS.includes(item.path))
    : navItems;

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState("profile");

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
  });

  const authContext = useContext(AuthContext);

  const user =
    authContext?.user ||
    JSON.parse(localStorage.getItem("user") || "{}");

  const ownerName =
    user?.full_name ||
    user?.name ||
    user?.username ||
    "PG Owner";

  const ownerInitial = ownerName?.charAt(0)?.toUpperCase() || "O";

  const isVerified = user?.is_verified ?? true;

  // Fetch live counts for sidebar menu items
  useEffect(() => {
    const fetchSidebarCounts = async () => {
      try {
        // 1. PGs
        const pgsRes = await api.get("/pg/owner/my-pgs").catch(() => ({ data: { pgs: [] } }));
        const pgsList = pgsRes.data?.pgs || [];

        // 2. Bookings
        const bRes = await api.get("/bookings/owner-bookings").catch(() => ({ data: { bookings: [] } }));
        const rawBookings = bRes.data?.bookings || [];

        const bGrouped = {};
        rawBookings.filter(b => b.status !== 'paused').forEach(b => {
          const studentKey = (b.student_email || b.email || b.student_name || String(b.student_id || b.user_id || '')).toLowerCase().trim();
          const pgKey = (b.title || b.pg_title || b.pg_name || String(b.pg_id || '')).toLowerCase().trim();
          const key = `${studentKey}_${pgKey}`;
          const bTime = new Date(b.created_at || 0).getTime() || Number(b.id) || 0;
          const gTime = bGrouped[key] ? (new Date(bGrouped[key].created_at || 0).getTime() || Number(bGrouped[key].id) || 0) : -1;
          if (!bGrouped[key] || bTime > gTime) {
            bGrouped[key] = b;
          }
        });
        const visibleB = Object.values(bGrouped);
        const pendingB = visibleB.filter(b => b.status === 'pending').length;
        const paidB = visibleB.filter(b => b.payment_status === 'paid').length;
        const approvedOrPaid = visibleB.filter(b => b.status === 'approved' || b.payment_status === 'paid');

        // 2b. Cancellations
        let cancelTotal = 0;
        let cancelPending = 0;
        try {
          const cancelRes = await api.get("/bookings/owner-cancellations").catch(() => ({ data: { cancellations: [], counts: {} } }));
          cancelTotal = cancelRes.data?.counts?.total || (cancelRes.data?.cancellations || []).length || 0;
          cancelPending = cancelRes.data?.counts?.pending || (cancelRes.data?.cancellations || []).filter(c => c.cancellation_status === 'pending').length || 0;
        } catch {}

        const myPgIds = new Set(pgsList.map(p => String(p.id)));
        const myPgTitles = new Set(pgsList.map(p => (p.title || '').toLowerCase().trim()));

        // 3. Requests
        let rawReqs = [];
        try { rawReqs = (await api.get("/maintenance/owner")).data?.requests || []; } catch {
          try { rawReqs = (await api.get("/student-portal/owner-requests")).data?.requests || []; } catch {}
        }
        try {
          const local = JSON.parse(localStorage.getItem('dormn_resident_requests') || '[]');
          if (Array.isArray(local)) {
            const cleanLocal = local.filter(r => 
              r.student_name !== 'Rahul Sharma' && 
              !String(r.id).includes('demo') && 
              !String(r.id).includes('1787822400001') &&
              !String(r.title || '').toLowerCase().includes('wi-fi router speed issue') &&
              (myPgIds.has(String(r.pg_id)) || myPgTitles.has((r.pg_title || '').toLowerCase().trim()))
            );
            const ids = new Set(rawReqs.map(r => String(r.id)));
            cleanLocal.forEach(lr => { if (!ids.has(String(lr.id))) rawReqs.push(lr); });
          }
        } catch {}

        const reqs = pgsList.length > 0
          ? rawReqs.filter(r => myPgIds.has(String(r.pg_id)) || myPgTitles.has((r.pg_title || '').toLowerCase().trim()))
          : [];
        const openReqs = reqs.filter(r => r.status !== 'closed' && r.status !== 'resolved').length;

        // 4. KYC Forms
        let kycList = [];
        try { kycList = (await api.get("/enrollments/owner-list")).data?.enrollments || []; } catch {
          try { kycList = (await api.get("/enrollments/all")).data?.enrollments || []; } catch {}
        }
        try {
          const localKyc = JSON.parse(localStorage.getItem('dormn_kyc_enrollments') || '[]');
          if (Array.isArray(localKyc)) {
            const cleanKyc = localKyc.filter(k => myPgIds.has(String(k.pg_id)) || myPgTitles.has((k.pg_title || '').toLowerCase().trim()));
            const ids = new Set(kycList.map(k => String(k.id || k.booking_id)));
            cleanKyc.forEach(lk => { if (!ids.has(String(lk.id || lk.booking_id))) kycList.push(lk); });
          }
        } catch {}

        const finalKycList = pgsList.length > 0
          ? kycList.filter(k => myPgIds.has(String(k.pg_id)) || myPgTitles.has((k.pg_title || '').toLowerCase().trim()))
          : [];

        setCounts({
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

    fetchSidebarCounts();
    window.addEventListener('storage', fetchSidebarCounts);
    window.addEventListener('dormn_request_updated', fetchSidebarCounts);
    return () => {
      window.removeEventListener('storage', fetchSidebarCounts);
      window.removeEventListener('dormn_request_updated', fetchSidebarCounts);
    };
  }, []);

  const getBadgeForItem = (title) => {
    switch (title) {
      case "My PGs":
        return counts.myPgs > 0 ? { count: counts.myPgs, color: "bg-purple-500/15 text-purple-600 dark:text-purple-400" } : null;
      case "All Bookings":
      case "Bookings":
        return counts.bookings > 0 ? { 
          count: counts.pendingBookings > 0 ? `${counts.pendingBookings} New` : counts.bookings, 
          color: counts.pendingBookings > 0 ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-black animate-pulse" : "bg-blue-500/15 text-blue-600 dark:text-blue-400" 
        } : null;
      case "Cancellations":
        return counts.cancellations > 0 ? {
          count: counts.pendingCancellations > 0 ? `${counts.pendingCancellations} New` : counts.cancellations,
          color: counts.pendingCancellations > 0 ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-black animate-pulse" : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400"
        } : null;
      case "All Requests":
      case "Requests":
        return counts.requests > 0 ? { 
          count: counts.openRequests > 0 ? `${counts.openRequests} Open` : counts.requests, 
          color: counts.openRequests > 0 ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-black" : "bg-gray-100 dark:bg-white/10 text-gray-400" 
        } : null;
      case "All Tenants":
      case "Tenants":
        return counts.tenants > 0 ? { count: counts.tenants, color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" } : null;
      case "All KYC Forms":
      case "KYC Forms":
        return counts.kycForms > 0 ? { count: counts.kycForms, color: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400" } : null;
      case "All Payments":
      case "Payments":
        return counts.payments > 0 ? { count: counts.payments, color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" } : null;
      default:
        return null;
    }
  };

  const handleLogout = () => {
    if (authContext?.logout) {
      authContext.logout();
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }

    navigate("/auth");
  };

  const openModalWithTab = (tab) => {
    setModalTab(tab);
    setIsModalOpen(true);
    setIsProfileMenuOpen(false);
  };

  return (
    <>
      <aside
        className={`relative flex h-screen flex-col border-r border-gray-200 dark:border-white/10 bg-white dark:bg-[#0b1020] transition-[width] duration-200 ease-in-out will-change-[width] ${
          isCollapsed ? "w-[80px]" : "w-[260px]"
        }`}
      >
        {/* Top Branding */}
        <div
          onClick={isCollapsed ? toggleCollapse : undefined}
          className={`group flex items-center px-4 py-6 pb-2 ${
            isCollapsed ? "justify-center cursor-pointer" : "justify-between px-6"
          }`}
          title={isCollapsed ? "Click logo to expand sidebar" : undefined}
        >
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 overflow-hidden rounded-xl shrink-0">
              <img 
                src="/logo-sm.webp" 
                alt="Dormn Logo" 
                className="h-full w-full object-contain" 
              />
              {isCollapsed && (
                <div className="absolute inset-0 flex items-center justify-center bg-black dark:bg-[#0b1020] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <PanelLeftOpen size={18} />
                </div>
              )}
            </div>

            {!isCollapsed && (
              <div>
                <h2 className="text-xl font-black tracking-tight text-gray-900 dark:text-white leading-none">
                  Dormn
                </h2>
                <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mt-1">
                  Owner Panel
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
              className="hidden xl:flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 transition"
              title="Collapse Sidebar"
            >
              <PanelLeftClose size={16} />
            </button>
          )}

          {closeSidebar && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeSidebar();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-500 xl:hidden"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="px-4 py-4">
          <div className="h-px w-full bg-gray-100 dark:bg-white/5"></div>
        </div>

        {/* Navigation Links with Count Badges */}
        <div className="flex flex-1 flex-col gap-1.5 px-3 overflow-y-auto overflow-x-hidden">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const badge = getBadgeForItem(item.title);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                title={isCollapsed ? item.title : undefined}
                className={({ isActive }) =>
                  `group flex items-center justify-between rounded-xl py-3 text-sm font-semibold transition-all duration-200 ${
                    isCollapsed ? "justify-center px-0" : "px-4"
                  } ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                  }`
                }
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <Icon size={20} className="shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.title}</span>}
                </div>

                {!isCollapsed && badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${badge.color}`}>
                    {badge.count}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Bottom Section */}
        <div className="px-3 pb-5 pt-2">
          {/* Owner Profile Section with Upward Dropdown Menu */}
          <div className="relative mb-3">
            <div 
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className={`group flex items-center cursor-pointer rounded-2xl border border-gray-200 dark:border-white/15 bg-gray-100 dark:bg-[#141b2d] hover:bg-gray-200 dark:hover:bg-[#1a233a] transition-all duration-200 ${
                isCollapsed ? "justify-center p-2.5" : "gap-3 p-3.5"
              }`}
              title="Click for Profile, Tier & Settings"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-pink-500 via-rose-500 to-cyan-500 text-sm font-black text-white shadow-md shadow-pink-500/20">
                {ownerInitial}
              </div>
              {!isCollapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white truncate leading-none mb-1">
                      {ownerName}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-black border shadow-sm ${
                        user?.subscription_status === 'expired' 
                          ? 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-400 border-red-300 dark:border-red-500/40'
                          : user?.subscription_status === 'trial'
                          ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-500/40'
                          : user?.subscription_status === 'cancelled'
                          ? 'bg-gray-100 dark:bg-gray-500/20 text-gray-800 dark:text-gray-400 border-gray-300 dark:border-gray-500/40'
                          : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/40'
                      }`}>
                        <Zap size={11} className="fill-current" />
                        <span>{user?.subscription_tier ? `${user.subscription_tier.charAt(0).toUpperCase() + user.subscription_tier.slice(1)} Tier` : "Free Tier"}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-blue-700 dark:text-blue-400">
                        <ShieldCheck size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
                        <span>Verified</span>
                      </span>
                    </div>
                  </div>
                  <ChevronUp size={16} className={`text-gray-400 transition-transform duration-200 shrink-0 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                </>
              )}
            </div>

            {/* Upward Floating Popover Menu */}
            {isProfileMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsProfileMenuOpen(false)}
                ></div>
                <div className={`absolute bottom-full mb-3 left-0 z-50 bg-white dark:bg-[#141c2e] border border-gray-200 dark:border-white/15 rounded-2xl shadow-2xl p-2 transition-all duration-200 ${
                  isCollapsed ? "w-48 left-full ml-2 bottom-0 mb-0" : "w-full"
                }`}>
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate("/owner/profile");
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition cursor-pointer"
                  >
                    <User size={16} className="text-blue-500" />
                    <span>View Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate("/owner/profile?tab=tier");
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition cursor-pointer"
                  >
                    <Zap size={16} className="text-emerald-500" />
                    <span>Subscription Plan</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      navigate("/owner/profile?tab=security");
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition cursor-pointer"
                  >
                    <SettingsIcon size={16} className="text-purple-500" />
                    <span>Account Settings</span>
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleLogout}
            title={isCollapsed ? "Logout" : undefined}
            className={`group flex items-center rounded-xl py-3 text-sm font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all duration-200 w-full ${
              isCollapsed ? "justify-center px-0" : "gap-4 px-4"
            }`}
          >
            <LogOut size={20} className="shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Owner Profile / Subscription / Settings Modal */}
      {isModalOpen && (
        <OwnerProfileModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          initialTab={modalTab}
        />
      )}
    </>
  );
};

export default AdminSidebar;