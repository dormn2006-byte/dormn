import { useState, useRef, useEffect, memo } from "react";
import { ChevronDown, Check } from "lucide-react";

/**
 * FilterTabs
 * Unified responsive filter tabs component for Owner Dashboard.
 * - Phone view (< sm / mobile): Compact sleek dropdown selector
 * - Desktop view (sm+): Compact segmented pill bar
 *
 * Props:
 * - tabs: Array<{ id: string|number, label: string, count?: number, dot?: string, isAlert?: boolean, icon?: any }>
 * - activeTab: string | number
 * - onChange: (id: string|number) => void
 * - desktopBreakpoint?: "sm" | "md" (default "sm")
 * - className?: string
 */
const FilterTabs = memo(({
  tabs = [],
  activeTab,
  onChange,
  desktopBreakpoint = "sm",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [isOpen]);

  const currentTab = tabs.find((t) => String(t.id) === String(activeTab)) || tabs[0];
  const isMd = desktopBreakpoint === "md";

  return (
    <div className={`relative ${className}`}>
      {/* ── Mobile Dropdown (< breakpoint) ── */}
      <div ref={containerRef} className={`relative w-full ${isMd ? "md:hidden" : "sm:hidden"}`}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-gray-100/90 dark:bg-white/[0.06] border border-gray-200/80 dark:border-white/10 text-xs font-semibold text-gray-900 dark:text-white transition active:scale-[0.99] cursor-pointer"
        >
          <div className="flex items-center gap-2 truncate">
            {currentTab?.dot && (
              <span className={`w-2 h-2 rounded-full shrink-0 ${currentTab.dot}`} />
            )}
            {currentTab?.icon && <currentTab.icon size={13} className="shrink-0 text-[#93B733]" />}
            <span className="truncate">{currentTab?.label || "Select Category"}</span>
            {currentTab?.count !== undefined && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold shrink-0 ${
                currentTab.isAlert
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  : "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
              }`}>
                {currentTab.count}
              </span>
            )}
          </div>
          <ChevronDown
            size={14}
            className={`text-gray-500 dark:text-gray-400 shrink-0 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-xl bg-white dark:bg-[#121826] border border-gray-200/80 dark:border-white/10 shadow-xl overflow-hidden py-1 max-h-60 overflow-y-auto">
            {tabs.map((tab) => {
              const isActive = String(tab.id) === String(activeTab);
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    onChange(tab.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium transition cursor-pointer text-left ${
                    isActive
                      ? "bg-[#93B733]/15 text-[#93B733] font-bold dark:bg-[#93B733]/20"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {tab.dot && (
                      <span className={`w-2 h-2 rounded-full shrink-0 ${tab.dot}`} />
                    )}
                    {tab.icon && (
                      <tab.icon
                        size={13}
                        className={`shrink-0 ${isActive ? "text-[#93B733]" : "text-gray-400"}`}
                      />
                    )}
                    <span className="truncate">{tab.label}</span>
                    {tab.count !== undefined && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold shrink-0 ${
                          isActive
                            ? "bg-[#93B733] text-white"
                            : tab.isAlert
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold"
                            : "bg-gray-200/70 dark:bg-white/10 text-gray-600 dark:text-gray-300"
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </div>
                  {isActive && <Check size={13} className="text-[#93B733] shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Desktop Segmented Bar (>= breakpoint) ── */}
      <div className={`hidden ${isMd ? "md:flex" : "sm:flex"} items-center gap-1 p-0.5 sm:p-1 rounded-xl bg-gray-100/80 dark:bg-white/[0.04] overflow-x-auto scrollbar-none`}>
        {tabs.map((tab) => {
          const isActive = String(tab.id) === String(activeTab);
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`group flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-medium transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-white dark:bg-[#151c2d] text-gray-900 dark:text-white font-semibold shadow-xs"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/[0.04]"
              }`}
            >
              {tab.dot && (
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${tab.dot}`} />
              )}
              {tab.icon && (
                <tab.icon
                  size={12}
                  className={`shrink-0 ${
                    isActive
                      ? "text-[#93B733]"
                      : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                  }`}
                />
              )}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${
                    isActive
                      ? "bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white"
                      : tab.isAlert
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold"
                      : "bg-gray-200/70 dark:bg-white/5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});

FilterTabs.displayName = "FilterTabs";

export default FilterTabs;
