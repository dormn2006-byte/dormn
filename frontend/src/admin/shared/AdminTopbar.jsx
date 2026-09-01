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
      try {
        const { data } = await api.get("/bookings/owner-bookings");
        const unread = (data.bookings || []).some((b) => b.status === "pending");
        setHasUnread(unread);
      } catch {
        setHasUnread(false);
      }
    };

    checkUnreadNotifications();
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
    <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#070b1a]/80 backdrop-blur-2xl transition-colors duration-300">
      <div className="flex items-center justify-between px-4 py-4 md:px-6 lg:px-8">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white transition hover:bg-gray-100 dark:hover:bg-white/10 xl:hidden"
          >
            <Menu size={20} />
          </button>

          {/* Title */}
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              {title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Search */}
          <div className="hidden items-center gap-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-3 backdrop-blur-xl md:flex">
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
            className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white transition hover:bg-gray-100 dark:hover:bg-white/10"
            title="View Notifications"
          >
            <Bell size={20} />

            {hasUnread && (
              <div className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-pink-500 shadow-sm animate-pulse"></div>
            )}
          </button>

          {/* Theme Switch */}
          <ThemeSwitch className="!h-11 !w-11 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white" />


        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;