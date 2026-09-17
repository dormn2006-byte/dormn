

import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import Sidebar from "../admin/shared/AdminSidebar";
import AdminTopbar from "../admin/shared/AdminTopbar";
import { LayoutDashboard, Building2, BookOpenCheck, CreditCard } from "lucide-react";
import api from "../services/api";

const PGAdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [dockCounts, setDockCounts] = useState({
    myPgs: 0,
    bookings: 0,
    pendingBookings: 0,
    payments: 0,
  });
  const location = useLocation();
  const navigate = useNavigate();

  const isPricing = location.pathname.includes("pricing");
  const isChat = location.pathname.includes("/owner/chat");
  const isFullBleed = isPricing || isChat;
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  // Fetch live counts for mobile dock badges
  useEffect(() => {
    const fetchDockCounts = async () => {
      try {
        const [pgsRes, bRes] = await Promise.all([
          api.get("/pg/owner/my-pgs").catch(() => ({ data: { pgs: [] } })),
          api.get("/bookings/owner-bookings").catch(() => ({ data: { bookings: [] } })),
        ]);
        const pgsList = pgsRes.data?.pgs || [];
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

        setDockCounts({
          myPgs: pgsList.length,
          bookings: visibleB.length,
          pendingBookings: pendingB,
          payments: paidB,
        });
      } catch (err) {
        console.error("Error fetching dock counts:", err);
      }
    };

    fetchDockCounts();
    window.addEventListener('storage', fetchDockCounts);
    window.addEventListener('dormn_request_updated', fetchDockCounts);
    return () => {
      window.removeEventListener('storage', fetchDockCounts);
      window.removeEventListener('dormn_request_updated', fetchDockCounts);
    };
  }, []);

  const activeAppId = useMemo(() => {
    const path = location.pathname;
    if (path.includes("/owner/dashboard") || path === "/owner" || path === "/owner/") return "/owner/dashboard";
    if (path.includes("/owner/my-pgs") || path.includes("/owner/pg-analytics") || path.includes("/owner/edit-pg")) return "/owner/my-pgs";
    if (path.includes("/owner/bookings")) return "/owner/bookings";
    if (path.includes("/owner/payments")) return "/owner/payments";
    return "";
  }, [location.pathname]);

  const ownerNavItems = useMemo(() => [
    {
      id: "/owner/dashboard",
      name: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "/owner/my-pgs",
      name: "My PGs",
      icon: Building2,
      badge: dockCounts.myPgs > 0 ? dockCounts.myPgs : null,
    },
    {
      id: "/owner/bookings",
      name: "Bookings",
      icon: BookOpenCheck,
      badge: dockCounts.pendingBookings > 0 ? dockCounts.pendingBookings : (dockCounts.bookings > 0 ? dockCounts.bookings : null),
    },
    {
      id: "/owner/payments",
      name: "Payments",
      icon: CreditCard,
      badge: dockCounts.payments > 0 ? dockCounts.payments : null,
    },
  ], [dockCounts]);

  return (
    <div className="h-screen overflow-hidden bg-[#FAFAFA] dark:bg-black text-gray-900 dark:text-white transition-colors duration-300 relative">
      {/* Background Effects */}
      <div className="pointer-events-none fixed left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-pink-500/10 blur-3xl"></div>
      <div className="pointer-events-none fixed bottom-[-120px] right-[-120px] h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl"></div>

      <div className="flex h-screen">
        {/* Desktop Sidebar with Smooth Collapsing (UNCHANGED for laptop view) */}
        <div
          className={`hidden xl:block shrink-0 transition-[width] duration-200 ease-in-out will-change-[width] ${
            isCollapsed ? "w-[80px]" : "w-[260px]"
          }`}
        >
          <Sidebar toggleCollapse={toggleCollapse} isCollapsed={isCollapsed} isMobile={false} />
        </div>

        {/* Mobile Sidebar Overlay / Drawer with Smooth Slide Transition */}
        <div
          className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-200 xl:hidden ${
            sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setSidebarOpen(false)}
        >
          <div
            className={`h-full w-[280px] max-w-[85vw] transform-gpu transition-transform duration-250 ease-out will-change-transform ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar closeSidebar={() => setSidebarOpen(false)} isMobile={true} />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex h-screen flex-1 flex-col overflow-hidden">
          {/* Topbar */}
          <AdminTopbar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            isCollapsed={isCollapsed}
            toggleCollapse={toggleCollapse}
          />

          {/* Page Content Centered (with mobile bottom padding for navbar) */}
          <main className={`flex-1 overflow-y-auto w-full ${isFullBleed ? "p-0 pb-20 sm:pb-24 xl:pb-0" : "p-3 sm:p-5 md:p-6 lg:p-8 pb-32 sm:pb-36 xl:pb-8"} bg-[#FAFAFA] dark:bg-black`}>
            <div className={`w-full ${isChat ? "h-full" : isPricing ? "w-full min-h-full" : "mx-auto max-w-[1600px]"}`}>
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar: Visible ONLY on mobile/phone (hidden on laptop xl:hidden) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-black border-t border-gray-200 dark:border-zinc-800 shadow-[0_-4px_24px_rgba(0,0,0,0.35)] xl:hidden pb-[calc(env(safe-area-inset-bottom)+6px)]">
        <div className="flex items-center justify-around max-w-lg mx-auto px-2">
          {ownerNavItems.map((item) => {
            const isActive = activeAppId === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`relative flex-1 flex items-center justify-center gap-2 py-4 px-1.5 transition-all cursor-pointer select-none ${
                  isActive
                    ? "text-[#93B733] dark:text-[#a3e635]"
                    : "text-gray-800 hover:text-black dark:text-gray-100 dark:hover:text-white"
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform ${isActive ? "scale-110 stroke-[2.6]" : "stroke-[2.2]"}`} />
                  {item.badge && (
                    <span className="absolute -top-2 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-md">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[13px] sm:text-sm md:text-base tracking-tight truncate ${isActive ? "font-black text-[#93B733] dark:text-[#a3e635]" : "font-extrabold text-gray-800 dark:text-gray-100"}`}>
                  {item.name}
                </span>

                {/* Active Green Underline Indicator */}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-[3.5px] bg-[#93B733] dark:bg-[#a3e635] rounded-t-full shadow-[0_-2px_10px_rgba(147,183,51,0.7)]" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default PGAdminLayout;