import { NavLink, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
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
  Settings as SettingsIcon
} from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import OwnerProfileModal from "./OwnerProfileModal";

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
    title: "Bookings",
    path: "/owner/bookings",
    icon: BookOpenCheck,
  },
  {
    title: "Requests",
    path: "/owner/requests",
    icon: Wrench,
  },
  {
    title: "Tenants",
    path: "/owner/students",
    icon: Users,
  },

  {
    title: "KYC Forms",
    path: "/owner/kyc-forms",
    icon: ClipboardList,
  },
  {
    title: "Payments", 
    path: "/owner/payments",
    icon: CreditCard,
  },
];

const AdminSidebar = ({ closeSidebar, toggleCollapse, isCollapsed = false }) => {
  const navigate = useNavigate();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState("profile");

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

  const isVerified =
    user?.is_verified ?? true;

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
        className={`relative flex h-screen flex-col border-r border-gray-200 dark:border-white/10 bg-white dark:bg-[#0b1020] transition-all duration-300 ${
          isCollapsed ? "w-[80px]" : "w-[260px]"
        }`}
      >
        {/* Top Branding */}
        <div
          onClick={isCollapsed ? toggleCollapse : undefined}
          className={`group flex items-center transition-all duration-300 px-4 py-6 pb-2 ${
            isCollapsed ? "justify-center cursor-pointer" : "justify-between px-6"
          }`}
          title={isCollapsed ? "Click logo to expand sidebar" : undefined}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src="https://i.ibb.co/TqtkM8HV/logo.jpg" 
                alt="Dormn Logo" 
                className="h-9 w-9 rounded-xl object-cover shadow-sm border border-gray-100 dark:border-white/10 transition-transform group-hover:scale-105" 
              />
              {isCollapsed && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/90 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md shadow-lg">
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

        {/* Navigation Links */}
        <div className="flex flex-1 flex-col gap-1.5 px-3 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                title={isCollapsed ? item.title : undefined}
                className={({ isActive }) =>
                  `group flex items-center rounded-xl py-3.5 text-sm font-semibold transition-all duration-200 ${
                    isCollapsed ? "justify-center px-0" : "gap-4 px-4"
                  } ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                  }`
                }
              >
                <Icon size={20} className="shrink-0" />
                {!isCollapsed && <span>{item.title}</span>}
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
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 text-[11px] font-black text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40 shadow-sm">
                        <Zap size={11} className="fill-current text-emerald-600 dark:text-emerald-400" />
                        <span>{user?.subscription_tier || user?.tier || "Pro Tier"}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-blue-700 dark:text-blue-400">
                        <ShieldCheck size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
                        Verified
                      </span>
                    </div>
                  </div>
                  <ChevronUp
                    size={16}
                    className={`text-gray-300 transition-transform duration-200 shrink-0 ${
                      isProfileMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </>
              )}
            </div>

            {/* Upward / Side Dropdown Menu */}
            {isProfileMenuOpen && (
              <div 
                className={`absolute z-50 rounded-2xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0a0f1d] p-2 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.8)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 ${
                  isCollapsed
                    ? "left-full bottom-0 ml-3 w-56"
                    : "bottom-full mb-2.5 left-0 right-0 w-full"
                }`}
              >
                <button
                  onClick={() => openModalWithTab("profile")}
                  className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-xs font-bold text-gray-800 dark:text-white hover:bg-blue-50 dark:hover:bg-white/10 transition-all"
                >
                  <User size={17} className="text-blue-500 shrink-0" />
                  <div className="text-left">
                    <span className="block font-black leading-none">Profile</span>
                    <span className="text-[10px] text-gray-400 font-semibold mt-0.5 block">Edit details</span>
                  </div>
                </button>

                <button
                  onClick={() => openModalWithTab("settings")}
                  className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-xs font-bold text-gray-800 dark:text-white hover:bg-cyan-50 dark:hover:bg-white/10 transition-all"
                >
                  <SettingsIcon size={17} className="text-cyan-500 shrink-0" />
                  <div className="text-left">
                    <span className="block font-black leading-none">Settings</span>
                    <span className="text-[10px] text-gray-400 font-semibold mt-0.5 block">Security & Alerts</span>
                  </div>
                </button>
              </div>
            )}
          </div>

        {/* Verified Owner Pro Card / Icon */}
        {isCollapsed ? (
          <div 
            className="flex items-center justify-center rounded-xl bg-blue-600 p-3 text-white mb-3 shadow-md"
            title="Verified Owner"
          >
            <ShieldCheck size={20} className={isVerified ? "text-white" : "text-yellow-300"} />
          </div>
        ) : (
          <div className="rounded-2xl bg-blue-600 p-5 shadow-lg shadow-blue-500/20 text-white mb-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={18} className={isVerified ? "text-blue-200" : "text-yellow-300"} />
              <span className="text-sm font-black tracking-wide">
                {isVerified ? "Verified Owner" : "Pending Verification"}
              </span>
            </div>
            <span className="block text-xs text-white font-semibold leading-relaxed" style={{ color: '#ffffff' }}>
              Manage your properties and review student bookings seamlessly.
            </span>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          title={isCollapsed ? "Logout" : undefined}
          className={`flex w-full items-center justify-center rounded-xl border border-gray-200 dark:border-white/10 bg-transparent py-3 text-sm font-bold text-gray-500 dark:text-gray-400 transition hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white ${
            isCollapsed ? "px-0" : "gap-3 px-4"
          }`}
        >
          <LogOut size={18} className="shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>

    {/* Floating Modal for Profile, Membership Tier & Settings */}
    <OwnerProfileModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      initialTab={modalTab}
    />
  </>
  );
};

export default AdminSidebar;