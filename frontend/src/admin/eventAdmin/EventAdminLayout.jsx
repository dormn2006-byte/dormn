import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import EventAdminSidebar from "./components/EventAdminSidebar";
import EventAdminTopbar from "./components/EventAdminTopbar";
import { fetchEventsFromDB } from "../../services/eventAdminService";

const EventAdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    fetchEventsFromDB();
  }, []);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <div className="h-screen overflow-hidden bg-[#F8F9FC] dark:bg-[#06080F] text-gray-900 dark:text-white transition-colors duration-300">
      {/* Dynamic Ambient Background Glows */}
      <div className="pointer-events-none fixed -left-32 -top-32 h-96 w-96 rounded-full bg-purple-600/15 blur-[120px]"></div>
      <div className="pointer-events-none fixed -right-32 top-1/3 h-96 w-96 rounded-full bg-pink-600/15 blur-[120px]"></div>
      <div className="pointer-events-none fixed bottom-0 left-1/3 h-96 w-96 rounded-full bg-amber-500/10 blur-[120px]"></div>

      <div className="flex h-screen">
        {/* Desktop Sidebar */}
        <div
          className={`hidden xl:block shrink-0 transition-all duration-300 ${
            isCollapsed ? "w-[80px]" : "w-[270px]"
          }`}
        >
          <EventAdminSidebar toggleCollapse={toggleCollapse} isCollapsed={isCollapsed} />
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md xl:hidden">
            <div className="w-[280px] h-full">
              <EventAdminSidebar closeSidebar={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex h-screen flex-1 flex-col overflow-hidden transition-all duration-300">
          <EventAdminTopbar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            isCollapsed={isCollapsed}
            toggleCollapse={toggleCollapse}
          />

          {/* Page Content Centered */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-[1600px] pb-12">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default EventAdminLayout;
