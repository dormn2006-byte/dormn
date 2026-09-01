import { NavLink } from "react-router-dom";
import { useMemo } from "react";

const menuItems = [
  {
    name: "Dashboard",
    path: "/pg-admin/dashboard",
    icon: "🏠",
  },
  {
    name: "Add PG",
    path: "/pg-admin/add-pg",
    icon: "➕",
  },
  {
    name: "My PGs",
    path: "/pg-admin/my-pgs",
    icon: "🏢",
  },
  {
    name: "Bookings",
    path: "/pg-admin/bookings",
    icon: "📅",
  },
  {
    name: "Tenants",
    path: "/pg-admin/students",
    icon: "👥",
  },
  {
    name: "Messages",
    path: "/pg-admin/messages",
    icon: "💬",
  },
  {
    name: "Payments",
    path: "/pg-admin/payments",
    icon: "💳",
  },
  {
    name: "Settings",
    path: "/pg-admin/settings",
    icon: "⚙️",
  },
];

const Sidebar = () => {
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
    "PG Owner";

  const ownerRole =
    user?.role ||
    "Owner";

  return (
    <aside className="flex h-screen w-[290px] flex-col border-r border-gray-200 bg-white px-5 py-6">
      {/* Logo */}
      <div className="mb-10 flex items-center gap-4 px-2">
        <img 
          src="https://i.ibb.co/TqtkM8HV/logo.jpg" 
          alt="Dormn Logo" 
          className="h-14 w-14 rounded-[20px] object-cover shadow-md" 
        />
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">
            Dormn
          </h1>

          <p className="text-sm text-gray-500">
            PG Owner Panel
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `group flex items-center gap-4 rounded-2xl px-4 py-4 text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-black text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-100 hover:text-black"
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>

      {/* Bottom Card */}
      <div className="mt-6 rounded-[28px] bg-black p-5 text-white shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-lg font-black text-black">
            {ownerName.charAt(0).toUpperCase()}
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">
              {ownerName}
            </h3>

            <p className="text-sm text-gray-300 capitalize">
              {ownerRole}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-white/10 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
            Owner Account
          </p>

          <p className="mt-2 text-sm text-gray-300">
            Manage your PG listings, rooms, approvals and future bookings from one place.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;