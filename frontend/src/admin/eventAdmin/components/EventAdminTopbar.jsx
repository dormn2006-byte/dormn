import { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  Bell,
  Search,
  Plus,
  Moon,
  Sun,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Building2,
  CalendarHeart,
  Music,
  Tag
} from "lucide-react";
import { AuthContext } from "../../../context/AuthContext";
import ThemeSwitchButton from "../../../components/ui/theme-switch-button";

const pageTitles = {
  "/event-admin/dashboard": { title: "Command Dashboard", subtitle: "Live KPIs, ticket sales volume & upcoming shows" },
  "/event-admin/analytics": { title: "Deep Analytics & Insights", subtitle: "Breakdown by ticket type, couple & group metrics & coupon performance" },
  "/event-admin/events": { title: "Events & Fests Hub", subtitle: "College fests, standup comedy, technical summits & parties" },
  "/event-admin/concerts": { title: "Live Concerts & Stadium Shows", subtitle: "Artist lineups, arena stages, VIP passes & gate entry" },
  "/event-admin/clubs": { title: "Nightlife & Clubs Manager", subtitle: "DJ nights, couple free passes, guestlist & table reservations" },
  "/event-admin/coupons": { title: "Coupons & Promotional Engine", subtitle: "Promo codes, discounts, usage limits & revenue tracking" },
  "/event-admin/attendees": { title: "Ticket Sales & Attendees", subtitle: "All confirmed bookings, QR passes, coupons used & check-in log" },
};

const EventAdminTopbar = ({ sidebarOpen, setSidebarOpen, isCollapsed, toggleCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);

  const [showNotifications, setShowNotifications] = useState(false);
  const [quickSearch, setQuickSearch] = useState("");

  const pageInfo = pageTitles[location.pathname] || {
    title: "Events & Nightlife Control",
    subtitle: "Manage your live concerts, clubs, tickets, and coupons"
  };

  const notificationsList = [
    { id: 1, title: "New Group Ticket Booked", desc: "Varun Chopra bought 5 passes for Sunburn Arena Live using code PARTYGROUP100", time: "5m ago", unread: true },
    { id: 2, title: "Couple Entry Reserved", desc: "Ananya Gupta reserved Couple Pass for Disco Club sitapura", time: "18m ago", unread: true },
    { id: 3, title: "Coupon Milestone", desc: "Promo code EARLYBIRD25 reached 280+ redemptions generating ₹1.4L revenue", time: "1h ago", unread: false },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-gray-200/80 dark:border-white/10 bg-white/90 dark:bg-[#090D16]/90 backdrop-blur-xl px-4 md:px-8 transition-colors">
      {/* Left: Mobile Menu & Page Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-2xl border border-gray-200 dark:border-white/10 p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 xl:hidden cursor-pointer"
        >
          <Menu size={20} />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg md:text-xl font-black tracking-tight text-gray-900 dark:text-white">
              {pageInfo.title}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              ⚡ LIVE PORTAL
            </span>
          </div>
          <p className="hidden md:block text-xs font-semibold text-gray-400 dark:text-gray-500 mt-0.5">
            {pageInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Actions, Notifications & Theme */}
      <div className="flex items-center gap-2.5 md:gap-3.5">
        {/* View Public Live Events Portal */}
        <a
          href="/events"
          target="_blank"
          rel="noopener noreferrer"
          title="Open Public Events Page"
          className="flex items-center gap-1.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition"
        >
          <ExternalLink size={15} className="text-purple-500" />
          <span className="hidden md:inline">Public Page</span>
        </a>

        {/* Theme Switcher */}
        <div className="flex items-center">
          <ThemeSwitchButton />
        </div>

        {/* Notifications Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <Bell size={18} />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-pink-500 ring-2 ring-white dark:ring-[#090D16]"></span>
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)}></div>
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-3xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#101626] p-4 shadow-2xl z-40 backdrop-blur-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10">
                  <span className="text-sm font-black text-gray-900 dark:text-white">Ticket Activity</span>
                  <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-lg">
                    3 New Alerts
                  </span>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-white/5 max-h-72 overflow-y-auto">
                  {notificationsList.map((n) => (
                    <div key={n.id} className="py-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl px-2 transition">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-gray-900 dark:text-white">{n.title}</h4>
                        <span className="text-[10px] font-bold text-gray-400">{n.time}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1 leading-snug">
                        {n.desc}
                      </p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => { setShowNotifications(false); navigate("/event-admin/attendees"); }}
                  className="w-full mt-3 py-2 text-center text-xs font-black text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 rounded-xl transition"
                >
                  View All Attendees & Bookings →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default EventAdminTopbar;
