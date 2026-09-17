import { useState, useEffect, useRef, useMemo, memo } from "react";
import { ChevronDown, Check, Building2, MapPin, X } from "lucide-react";
import { filterColleges, INDIAN_COLLEGES } from "../../data/indianColleges";

const CollegeCombobox = memo(({
  value = "",
  onChange,
  placeholder = "Search or type college / university...",
  className = "",
  disabled = false,
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value || "");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setSearchQuery(value || "");
  }, [value]);

  useEffect(() => {
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
  }, []);

  const filtered = useMemo(() => filterColleges(searchQuery, 35), [searchQuery]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    onChange(val);
    if (!isOpen) setIsOpen(true);
  };

  const handleSelect = (name) => {
    setSearchQuery(name);
    onChange(name);
    setIsOpen(false);
  };

  const hasExact = useMemo(() => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return INDIAN_COLLEGES.some(c => c.name.toLowerCase() === q);
  }, [searchQuery]);

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <div className="relative flex items-center">
        <Building2 size={16} className="absolute left-3.5 text-gray-400 dark:text-gray-500 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          required={required}
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] pl-10 pr-14 py-2.5 sm:py-3 text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-[#93B733] focus:ring-2 focus:ring-[#93B733]/20 transition-all shadow-2xs"
        />
        <div className="absolute right-2.5 flex items-center gap-1">
          {searchQuery && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSearchQuery("");
                onChange("");
                inputRef.current?.focus();
              }}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setIsOpen(p => !p);
              if (!isOpen) inputRef.current?.focus();
            }}
            className="p-1 rounded-lg text-gray-400 hover:text-[#93B733] transition"
          >
            <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? "rotate-180 text-[#93B733]" : ""}`} />
          </button>
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl border border-gray-100 dark:border-white/10 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-2xl p-1.5 shadow-2xl max-h-60 sm:max-h-72 overflow-y-auto overscroll-contain animate-in fade-in zoom-in-95 duration-150">
          {searchQuery.trim() && !hasExact && (
            <button
              type="button"
              onClick={() => handleSelect(searchQuery.trim())}
              className="w-full text-left rounded-xl px-3 py-2 sm:py-2.5 mb-1 text-xs sm:text-sm font-bold bg-[#93B733]/10 dark:bg-[#93B733]/15 text-[#4E700F] dark:text-[#93B733] hover:bg-[#93B733]/20 flex items-center justify-between border border-[#93B733]/30 transition"
            >
              <span className="truncate">✍️ Use: <strong className="underline">{searchQuery.trim()}</strong></span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#93B733] text-white shrink-0 ml-2">Custom</span>
            </button>
          )}

          {filtered.length > 0 ? (
            <div className="space-y-0.5">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center justify-between">
                <span>Colleges in India ({filtered.length})</span>
                <span className="hidden sm:inline">Type to filter</span>
              </div>
              {filtered.map((college) => {
                const isSelected = value?.trim().toLowerCase() === college.name.toLowerCase();
                return (
                  <button
                    key={college.name}
                    type="button"
                    onClick={() => handleSelect(college.name)}
                    className={`w-full text-left rounded-xl px-3 py-2 sm:py-2.5 text-xs sm:text-sm transition flex items-center justify-between gap-2.5 ${
                      isSelected
                        ? "bg-[#93B733] text-white shadow-xs font-bold"
                        : "text-gray-800 dark:text-gray-200 hover:bg-[#93B733]/10 dark:hover:bg-white/5"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className={`truncate ${isSelected ? "text-white font-bold" : "text-gray-900 dark:text-gray-100 font-semibold"}`}>
                        {college.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] opacity-75">
                        <span className="flex items-center gap-0.5 truncate">
                          <MapPin size={10} className="shrink-0" /> {college.city}, {college.state}
                        </span>
                        {college.type && (
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase shrink-0 ${
                            isSelected ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300"
                          }`}>
                            {college.type}
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && <Check size={15} className="text-white shrink-0" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-3.5 text-center">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">No match for &quot;{searchQuery}&quot;</p>
              <button
                type="button"
                onClick={() => handleSelect(searchQuery.trim())}
                className="mt-1.5 text-xs font-bold text-[#93B733] hover:underline"
              >
                Use &quot;{searchQuery}&quot; as custom college
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

CollegeCombobox.displayName = "CollegeCombobox";
export default CollegeCombobox;
