import { useState, useEffect, useRef, useMemo } from "react";
import { Search, X, History, ArrowRight, Compass } from "lucide-react";
import { ALL_PAGE_ITEMS, SEARCH_CATEGORIES } from "./ownerNavConfig";

const DEFAULT_RECENTS = [
  { title: "Dashboard", path: "/owner/dashboard" },
  { title: "My PG", path: "/owner/my-pgs" },
  { title: "All Bookings", path: "/owner/bookings" },
];

const OwnerSearchModal = ({ isOpen, onClose, onSelectPage, recents = [] }) => {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIndex(0);
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Lock body scrolling while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isOpen && e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Enriched recent pages with icons and descriptions
  const enrichedRecents = useMemo(() => {
    const source = recents && recents.length > 0 ? recents : DEFAULT_RECENTS;
    return source
      .map((r) => {
        const match = ALL_PAGE_ITEMS.find((it) => it.path === r.path || it.title === r.title);
        return (
          match || {
            title: r.title,
            path: r.path,
            icon: Compass,
            group: "Recent",
          }
        );
      })
      .slice(0, 5);
  }, [recents]);

  // Real-time filtered items based on search query
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return ALL_PAGE_ITEMS.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.group?.toLowerCase().includes(q) ||
        item.desc?.toLowerCase().includes(q)
    );
  }, [query]);

  // Keyboard navigation (Enter to select, Up/Down arrows to move)
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (query.trim() && filteredItems.length > 0) {
        const target = filteredItems[activeIndex] || filteredItems[0];
        handleSelect(target.path);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (filteredItems.length > 0) {
        setActiveIndex((prev) => (prev + 1) % filteredItems.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (filteredItems.length > 0) {
        setActiveIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
      }
    }
  };

  const handleSelect = (path) => {
    onClose();
    if (onSelectPage) onSelectPage(path);
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-start justify-center pt-3 sm:pt-16 p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0c1220] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-scaleUp"
      >
        {/* Search Header */}
        <div className="relative flex items-center px-3.5 py-3 sm:px-5 sm:py-4 border-b border-gray-100 dark:border-white/10">
          <Search className="text-gray-400 dark:text-gray-500 shrink-0 mr-2.5 sm:mr-3 w-4 h-4 sm:w-5 sm:h-5" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm sm:text-base font-semibold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none min-w-0"
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              className="px-2 py-0.5 rounded-md text-[11px] font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition cursor-pointer mr-1.5 shrink-0"
              title="Clear input"
            >
              Clear
            </button>
          ) : (
            <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 mr-2 pointer-events-none">
              Ctrl K
            </span>
          )}
          <button
            onClick={onClose}
            className="flex items-center justify-center h-8 w-8 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition cursor-pointer shrink-0"
            title="Close (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scroll Content (Clean List View like Image 3) */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 sm:px-4 sm:py-4 space-y-4 scrollbar-none">
          {query.trim() ? (
            /* Filtered Search Results */
            <div>
              <div className="flex items-center justify-between px-2 pb-1.5 mb-1 border-b border-gray-100 dark:border-white/5">
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-gray-400">
                  Matches ({filteredItems.length})
                </span>
                <span className="hidden sm:inline text-[11px] text-gray-400">Press ↵ to open</span>
              </div>

              {filteredItems.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-400 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <Search size={20} />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">No pages found</h4>
                  <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    No results matching &ldquo;{query}&rdquo;.
                  </p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {filteredItems.map((item, idx) => {
                    const Icon = item.icon;
                    const isSelected = activeIndex === idx;
                    return (
                      <button
                        key={item.path}
                        onClick={() => handleSelect(item.path)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-[13px] font-semibold transition text-left cursor-pointer ${
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                            : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon size={16} className="shrink-0 text-blue-500" />
                          <span className="truncate">{item.title}</span>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 shrink-0">
                          {item.group}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Directory View: Recents + Hierarchical Navigation List (Image 3 layout) */
            <>
              {/* 1. Recent Pages */}
              {enrichedRecents.length > 0 && (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    <History size={13} className="text-gray-400" />
                    <span>Recents</span>
                  </div>

                  <div className="space-y-0.5">
                    {enrichedRecents.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={`recent-${item.path}`}
                          onClick={() => handleSelect(item.path)}
                          className="w-full flex items-center justify-between px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-[13px] font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition text-left cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Icon size={16} className="text-gray-500 group-hover:text-blue-500 shrink-0 transition" />
                            <span className="truncate">{item.title}</span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-medium">Recent</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. Categorized List (Matching Sidebar / Image 3) */}
              <div className="space-y-3 pt-1">
                {SEARCH_CATEGORIES.map((cat) => (
                  <div key={cat.group} className="space-y-0.5">
                    {/* Section Header */}
                    <div className="px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      {cat.group}
                    </div>

                    {/* Section Rows */}
                    <div className="space-y-0.5">
                      {cat.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.path}
                            onClick={() => handleSelect(item.path)}
                            className="w-full flex items-center justify-between px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-[13px] font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition text-left cursor-pointer group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Icon size={16} className="text-gray-500 group-hover:text-blue-500 shrink-0 transition" />
                              <span className="truncate">{item.title}</span>
                            </div>
                            <ArrowRight size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-5 sm:py-3 border-t border-gray-100 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.02] text-[11px] text-gray-400">
          <div className="hidden sm:flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 font-mono font-bold text-[10px]">↑↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 font-mono font-bold text-[10px]">↵</kbd>
              <span>to select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 font-mono font-bold text-[10px]">esc</kbd>
              <span>to close</span>
            </span>
          </div>
          <span className="text-[10px] sm:text-[11px] font-medium text-gray-400">
            {ALL_PAGE_ITEMS.length} pages available
          </span>
          <span className="sm:hidden text-[10px] text-gray-400 font-medium">Tap to open</span>
        </div>
      </div>
    </div>
  );
};

export default OwnerSearchModal;
