import { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Menu,
  Search,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { ThemeSwitch } from "../../components/ui/theme-switch-button";
import api from "../../services/api";

const AdminTopbar = ({ sidebarOpen, setSidebarOpen, isCollapsed, toggleCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    const checkUnreadNotifications = async () => {
      if (location.pathname.includes("/owner/notifications") || location.pathname.includes("/owner/bookings")) {
        setHasUnread(false);
        return;
      }
      try {
        const [bookingsRes, notifRes] = await Promise.all([
          api.get("/bookings/owner-bookings").catch(() => null),
          api.get("/notifications").catch(() => null),
        ]);

        const pendingList = (bookingsRes?.data?.bookings || []).filter((b) => b.status === "pending");
        let seenCounts = {};
        try {
          seenCounts = JSON.parse(localStorage.getItem("dormn_owner_seen_counts") || "{}");
        } catch {}
        const seenPending = seenCounts.pendingBookings || 0;

        // Unread payroll notifications (e.g. "transfer this rent to your bank")
        // also light the bell.
        const unreadNotifications = Number(notifRes?.data?.unreadCount || 0);

        setHasUnread(pendingList.length > seenPending || unreadNotifications > 0);
      } catch {
        setHasUnread(false);
      }
    };

    checkUnreadNotifications();
    window.addEventListener("dormn_seen_counts_updated", checkUnreadNotifications);
    return () => window.removeEventListener("dormn_seen_counts_updated", checkUnreadNotifications);
  }, [location.pathname]);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const ownerName =
    user?.full_name ||
    user?.name ||
    user?.username ||
    "Owner";

  const ownerInitial = ownerName?.charAt(0)?.toUpperCase() || "O";

  const getPageDetails = () => {
    const path = location.pathname;
    if (path.includes("add-pg")) {
      return { title: "Add New PG", subtitle: "Submit your PG details and room information" };
    }
    if (path.includes("my-pgs")) {
      return { title: "My PGs", subtitle: "View and manage all your property listings" };
    }
    if (path.includes("pricing")) {
      return { title: "Pricing Plans", subtitle: "Upgrade your owner account and membership tier" };
    }
    if (path.includes("bookings")) {
      return { title: "Bookings", subtitle: "Manage student booking requests and approvals" };
    }
    if (path.includes("students")) {
      return { title: "Students", subtitle: "Manage your active tenants and residents" };
    }
    if (path.includes("notifications")) {
      return { title: "Notifications", subtitle: "View student messages, booking requests and system updates" };
    }
    return { title: "PG Dashboard", subtitle: "Manage your PGs, bookings and students" };
  };

  const { title, subtitle } = getPageDetails();

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#070b1a] transition-colors duration-200">
      <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-4 sm:py-3 md:px-6 md:py-4 lg:px-8">
        {/* Left Section */}
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
          {/* Mobile Menu */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 items-center justify-center rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-white transition hover:bg-gray-200 dark:hover:bg-white/20 xl:hidden shrink-0 cursor-pointer"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Title */}
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl md:text-2xl font-black tracking-tight text-gray-900 dark:text-white truncate leading-tight">
              {title}
            </h1>
            <p className="text-[11px] sm:text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate max-w-[180px] xs:max-w-[240px] sm:max-w-none">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0">
          {/* Search */}
          <div className="hidden items-center gap-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/10 px-4 py-2.5 md:flex">
            <Search size={18} className="text-gray-400" />

            <input
              type="text"
              placeholder="Search here..."
              className="w-36 md:w-48 lg:w-64 bg-transparent text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all focus:w-48 md:focus:w-64 lg:focus:w-72"
            />
          </div>

          {/* Notification Button */}
          <button 
            onClick={() => navigate("/owner/notifications")}
            className="relative flex h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 items-center justify-center rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-white transition hover:bg-gray-200 dark:hover:bg-white/20 shrink-0 cursor-pointer"
            title="View Notifications"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />

            {hasUnread && (
              <div className="absolute right-2 top-2 sm:right-2.5 sm:top-2.5 h-2 w-2 rounded-full bg-pink-500 shadow-sm animate-pulse"></div>
            )}
          </button>

          {/* Theme Switch */}
          <ThemeSwitch className="!h-9 !w-9 sm:!h-10 sm:!w-10 md:!h-11 md:!w-11 border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-white shrink-0" />
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;