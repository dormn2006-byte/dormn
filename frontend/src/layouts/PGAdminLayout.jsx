

import { Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import Sidebar from "../admin/shared/AdminSidebar";
import AdminTopbar from "../admin/shared/AdminTopbar";

const PGAdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const isPricing = location.pathname.includes("pricing");
  const isDashboard = location.pathname.endsWith("/dashboard") || location.pathname.endsWith("/dashboard/");
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <div className="h-screen overflow-hidden bg-[#FAFAFA] dark:bg-black text-gray-900 dark:text-white transition-colors duration-300">
      {/* Background Effects */}
      <div className="pointer-events-none fixed left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-pink-500/10 blur-3xl"></div>
      <div className="pointer-events-none fixed bottom-[-120px] right-[-120px] h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl"></div>

      <div className="flex h-screen">
        {/* Desktop Sidebar with Smooth Collapsing */}
        <div
          className={`hidden xl:block shrink-0 transition-all duration-300 ${
            isCollapsed ? "w-[80px]" : "w-[260px]"
          }`}
        >
          <Sidebar toggleCollapse={toggleCollapse} isCollapsed={isCollapsed} />
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm xl:hidden">
            <div className="w-[280px]">
              <Sidebar closeSidebar={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex h-screen flex-1 flex-col overflow-hidden transition-all duration-300">
          {/* Topbar */}
          <AdminTopbar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            isCollapsed={isCollapsed}
            toggleCollapse={toggleCollapse}
          />

          {/* Page Content Centered (Full width for Pricing page only) */}
          <main className="flex-1 overflow-y-auto w-full p-4 md:p-6 lg:p-8 bg-[#FAFAFA] dark:bg-black">
            <div className={`w-full ${isPricing ? "max-w-full" : "mx-auto max-w-[1600px]"}`}>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default PGAdminLayout;