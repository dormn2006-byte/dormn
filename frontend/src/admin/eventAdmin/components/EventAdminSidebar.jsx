import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import {
  LayoutDashboard,
  BarChart3,
  Compass,
  CalendarHeart,
  Music,
  Sparkles,
  Ticket,
  Tag,
  PlusSquare,
  Users,
  LogOut,
  ExternalLink,
  ChevronUp,
  X,
  PanelLeftOpen,
  PanelLeftClose,
  ShieldCheck,
  Zap,
  TrendingUp
} from "lucide-react";
import { AuthContext } from "../../../context/AuthContext";
import { getAdminEvents, getAdminCoupons, getAdminAttendees } from "../../../services/eventAdminService";

const navItems = [
  {
    title: "Dashboard",
    path: "/event-admin/dashboard",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    title: "Analytics Hub",
    path: "/event-admin/analytics",
    icon: BarChart3,
    badge: "PRO",
    badgeColor: "bg-gradient-to-r from-pink-500 to-rose-500 text-white",
  },
  {
    title: "All Experiences",
    path: "/event-admin/experiences",
    icon: Compass,
    type: "experiences",
  },
  {
    title: "Live Concerts",
    path: "/event-admin/concerts",
    icon: Music,
    type: "concerts",
  },
  {
    title: "Clubs & Nightlife",
    path: "/event-admin/clubs",
    icon: Sparkles,
    type: "clubs",
  },
  {
    title: "Events",
    path: "/event-admin/events",
    icon: CalendarHeart,
    type: "events",
  },
  {
    title: "Coupons & Offers",
    path: "/event-admin/coupons",
    icon: Tag,
    type: "coupons",
  },
  {
    title: "Ticket Attendees",
    path: "/event-admin/attendees",
    icon: Ticket,
    type: "attendees",
  },
];

const EventAdminSidebar = ({ closeSidebar, toggleCollapse, isCollapsed = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const authContext = useContext(AuthContext);

  const [counts, setCounts] = useState({
    experiences: 0,
    events: 0,
    concerts: 0,
    clubs: 0,
    coupons: 0,
    attendees: 0,
  });

  const user = authContext?.user || JSON.parse(localStorage.getItem("user") || "{}");
  const managerName = user?.full_name || user?.name || "Event Manager";

  useEffect(() => {
    const updateCounts = () => {
      try {
        const events = getAdminEvents();
        const coupons = getAdminCoupons();
        const attendees = getAdminAttendees();

        setCounts({
          experiences: events.length,
          events: events.filter(e => e.category === "events").length,
          concerts: events.filter(e => e.category === "concerts").length,
          clubs: events.filter(e => e.category === "clubs").length,
          coupons: coupons.filter(c => c.status === "active").length,
          attendees: attendees.length,
        });
      } catch (e) {
        console.error(e);
      }
    };

    updateCounts();
    window.addEventListener("dormn_events_updated", updateCounts);
    window.addEventListener("dormn_tickets_updated", updateCounts);
    window.addEventListener("storage", updateCounts);
    return () => {
      window.removeEventListener("dormn_events_updated", updateCounts);
      window.removeEventListener("dormn_tickets_updated", updateCounts);
      window.removeEventListener("storage", updateCounts);
    };
  }, [location.pathname]);

  const handleLogout = () => {
    if (authContext?.logout) {
      authContext.logout();
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/auth");
    }
  };

  return (
    <aside
      className={`relative flex h-full flex-col border-r border-gray-200/80 dark:border-white/10 bg-white/95 dark:bg-[#090D16]/95 backdrop-blur-2xl transition-all duration-300 select-none shadow-xl ${
        isCollapsed ? "w-[80px]" : "w-[270px]"
      }`}
    >
      {/* Top Brand Banner */}
      <div className="flex h-20 items-center justify-between px-5 border-b border-gray-200/80 dark:border-white/10">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/event-admin/dashboard")}>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 shadow-lg shadow-purple-500/30 text-white font-black text-xl">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-gray-900 dark:text-white">
                  DORMN <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">PULSE</span>
                </span>
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-600 dark:text-purple-400 block -mt-0.5">
                Events & Club Manager
              </span>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 text-white font-black shadow-md cursor-pointer" onClick={() => navigate("/event-admin/dashboard")}>
            ⚡
          </div>
        )}

        {/* Mobile Close Button */}
        {closeSidebar && (
          <button
            onClick={closeSidebar}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 xl:hidden"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3.5 py-5 space-y-1.5 scrollbar-thin">
        {!isCollapsed && (
          <div className="px-3 pb-2 text-[11px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Control Center
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const countVal = item.type ? counts[item.type] : null;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `group relative flex items-center gap-3.5 rounded-2xl px-3.5 py-3 text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/25 font-black"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                } ${isCollapsed ? "justify-center px-0" : ""}`
              }
              title={isCollapsed ? item.title : ""}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={20}
                    className={`shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? "text-white" : "text-gray-400 dark:text-gray-500 group-hover:text-purple-500"
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="flex-1 truncate tracking-tight">{item.title}</span>
                  )}

                  {!isCollapsed && item.badge && (
                    <span
                      className={`rounded-lg px-2 py-0.5 text-[10px] font-black tracking-wider shadow-sm ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {!isCollapsed && countVal !== null && countVal !== undefined && (
                    <span
                      className={`rounded-xl px-2.5 py-0.5 text-xs font-black transition-colors ${
                        isActive
                          ? "bg-white/25 text-white"
                          : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {countVal}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}

        {/* Quick Hub Jump Card */}
        {!isCollapsed && (
          <div className="pt-5 px-1">
            <div className="rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent p-4 text-left shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Quick Links
                </span>
                <Sparkles size={14} className="text-purple-500" />
              </div>
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-3">
                Live Public Portal
              </p>
              <div>
                <a
                  href="/events"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between rounded-xl bg-purple-500/10 dark:bg-purple-500/20 px-3 py-2 text-xs font-black text-purple-600 dark:text-purple-300 hover:bg-purple-600 hover:text-white transition"
                >
                  <div className="flex items-center gap-2">
                    <ExternalLink size={14} />
                    <span>Live Public Events Page</span>
                  </div>
                  <span>↗</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Collapse Desktop Toggle */}
      {toggleCollapse && (
        <div className="hidden xl:flex items-center justify-center p-3 border-t border-gray-200/80 dark:border-white/10">
          <button
            onClick={toggleCollapse}
            className="flex items-center gap-2 rounded-xl p-2 text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition w-full justify-center"
          >
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            {!isCollapsed && <span>Collapse Sidebar</span>}
          </button>
        </div>
      )}

      {/* Bottom User Profile Section */}
      <div className="border-t border-gray-200/80 dark:border-white/10 p-3.5">
        <div className="flex items-center gap-3 rounded-2xl bg-gray-50 dark:bg-white/5 p-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 font-black text-white shadow-md">
            {managerName[0]?.toUpperCase() || "M"}
          </div>

          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-gray-900 dark:text-white truncate">
                {managerName}
              </p>
              <p className="text-[11px] font-bold text-gray-400 truncate">
                Manager / Promoter
              </p>
            </div>
          )}

          {!isCollapsed && (
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default EventAdminSidebar;
