import { useMemo } from "react";

const Topbar = ({ title = "Dashboard" }) => {
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
    <div className="sticky top-0 z-30 flex flex-col gap-5 rounded-[32px] border border-gray-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      {/* Left Section */}
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
          PG Owner Admin
        </p>

        <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900">
          {title}
        </h1>
      </div>

      {/* Right Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder={`Search ${title.toLowerCase()}...`}
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-3 pr-12 text-sm font-medium text-gray-700 outline-none transition focus:border-black sm:w-[260px]"
          />

          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-gray-400">
            🔍
          </div>
        </div>

        {/* Notifications */}
        <button className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-white text-xl transition hover:bg-gray-100">
          🔔

          <span className="absolute right-3 top-3 h-3 w-3 rounded-full bg-red-500"></span>
        </button>

        {/* Profile */}
        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-sm font-bold text-white">
            {ownerName.charAt(0).toUpperCase()}
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-900">
              {ownerName}
            </h3>

            <p className="text-xs text-gray-500">
              {ownerRole.charAt(0).toUpperCase() + ownerRole.slice(1)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topbar;