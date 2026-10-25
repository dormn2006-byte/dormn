import { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, Menu } from "lucide-react";
import { ThemeSwitch } from "../../components/ui/theme-switch-button";
import api from "../../services/api";

const AdminTopbar = ({ sidebarOpen, setSidebarOpen }) => {
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



  const { title, subtitle } = useMemo(() => {
    const path = location.pathname;
    if (path.includes("booked-pgs")) return { title: "Booked PG", subtitle: "Accommodations & stays you have booked" };
    if (path.includes("saved-pgs")) return { title: "Saved PG", subtitle: "Bookmarked properties & favorites" };
    if (path.includes("add-pg")) return { title: "Add PG", subtitle: "New property listing" };
    if (path.includes("edit-pg")) return { title: "Edit PG", subtitle: "Update property details" };
    if (path.includes("my-pgs")) return { title: "My Properties", subtitle: "Listing inventory & status" };
    if (path.includes("visits")) return { title: "Scheduled Visits", subtitle: "Prospective tenant visits" };
    if (path.includes("short-stays")) return { title: "Short Stays", subtitle: "Daily & temporary bookings" };
    if (path.includes("cancellations")) return { title: "Cancellations", subtitle: "Move-out requests" };
    if (path.includes("pricing")) return { title: "Pricing & Plans", subtitle: "Will be allotted soon" };
    if (path.includes("bookings")) return { title: "All Bookings", subtitle: "Admissions & reservations" };
    if (path.includes("requests")) return { title: "Maintenance", subtitle: "Resident service tickets" };
    if (path.includes("students")) return { title: "Tenants", subtitle: "Active enrolled residents" };
    if (path.includes("kyc-forms")) return { title: "KYC Verification", subtitle: "Tenant identity records" };
    if (path.includes("payments")) return { title: "Payments", subtitle: "Rent collection & payouts" };
    if (path.includes("promo-codes")) return { title: "Coupons", subtitle: "Promo discounts & codes" };
    if (path.includes("staff")) return { title: "Staff", subtitle: "Property managers & staff" };
    if (path.includes("sponsor")) return { title: "Top Rated Spotlight", subtitle: "Featured sponsorship" };
    if (path.includes("chat")) return { title: "Community Chat", subtitle: "Property messaging" };
    if (path.includes("notifications")) return { title: "Notifications", subtitle: "Alerts & updates" };
    if (path.includes("profile") || path.includes("settings")) {
      const search = new URLSearchParams(location.search);
      const tab = search.get("tab") || "profile";
      if (tab === "payouts") return { title: "Bank & Payouts", subtitle: "Settlement accounts & IFSC" };
      if (tab === "kyc") return { title: "Legal KYC", subtitle: "PAN & identity records" };
      if (tab === "security") return { title: "Security & Password", subtitle: "Credentials & account protection" };
      if (tab === "tier") return { title: "Plan & Tier", subtitle: "Subscription & billing tier" };
      return { title: "Profile & Business", subtitle: "Personal & property contact details" };
    }
    return { title: "Owner Dashboard", subtitle: "Overview & key metrics" };
  }, [location.pathname, location.search]);

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#070b1a] transition-colors duration-200">
      <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-4 sm:py-3 md:px-6 md:py-4 lg:px-8">
        {/* Left Section */}
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 items-center justify-center rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-white transition hover:bg-gray-200 dark:hover:bg-white/20 xl:hidden shrink-0 cursor-pointer"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

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
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button 
            onClick={() => navigate("/owner/notifications")}
            className="relative flex h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 items-center justify-center rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-white transition hover:bg-gray-200 dark:hover:bg-white/20 shrink-0 cursor-pointer"
            title="View Notifications"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {hasUnread && (
              <div className="absolute right-2 top-2 sm:right-2.5 sm:top-2.5 h-2 w-2 rounded-full bg-pink-500 shadow-sm animate-pulse" />
            )}
          </button>

          <ThemeSwitch className="!h-9 !w-9 sm:!h-10 sm:!w-10 md:!h-11 md:!w-11 border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-white shrink-0" />

        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;