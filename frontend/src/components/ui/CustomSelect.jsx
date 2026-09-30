import { useState, useEffect, useRef, memo, useMemo } from "react";
import { ChevronDown, Check } from "lucide-react";

const CustomSelect = memo(({ 
  options = [], 
  value = "", 
  onChange, 
  placeholder = "Select...", 
  className = "",
  buttonClassName = "",
  dropdownClassName = "",
  disabled = false,
  required = false,
  colorScheme = "default", // 'default' (green), 'purple', 'indigo'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

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

  // Normalize options to { value, label, icon, description }
  const normalizedOptions = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === "object" && opt !== null) {
        return {
          value: opt.value !== undefined ? opt.value : opt.label,
          label: opt.label !== undefined ? opt.label : String(opt.value),
          icon: opt.icon || null,
          description: opt.description || null,
        };
      }
      return { value: opt, label: String(opt), icon: null, description: null };
    });
  }, [options]);

  const selectedOption = useMemo(() => {
    return normalizedOptions.find((opt) => String(opt.value) === String(value));
  }, [normalizedOptions, value]);

  const displayLabel = selectedOption ? selectedOption.label : (value ? String(value) : placeholder);

  // Styling based on colorScheme
  const schemeClasses = useMemo(() => {
    if (colorScheme === "purple") {
      return {
        focusRing: "focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 hover:border-purple-400 dark:hover:border-purple-500/40",
        activeItem: "bg-purple-600 text-white shadow-xs font-black",
        hoverItem: "hover:bg-purple-500/10 hover:text-purple-700 dark:hover:text-purple-300",
        chevronOpen: "text-purple-500",
      };
    }
    if (colorScheme === "indigo") {
      return {
        focusRing: "focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-indigo-400 dark:hover:border-indigo-500/40",
        activeItem: "bg-indigo-600 text-white shadow-xs font-black",
        hoverItem: "hover:bg-indigo-500/10 hover:text-indigo-700 dark:hover:text-indigo-300",
        chevronOpen: "text-indigo-500",
      };
    }
    // Default green (#93B733)
    return {
      focusRing: "focus:border-[#93B733] focus:ring-2 focus:ring-[#93B733]/20 hover:border-[#93B733]/60",
      activeItem: "bg-[#93B733] text-black shadow-xs font-black",
      hoverItem: "hover:bg-[#93B733]/15 hover:text-[#0D3A1D] dark:hover:text-[#bbf246]",
      chevronOpen: "text-[#93B733]",
    };
  }, [colorScheme]);

  return (
    <div className={`relative w-full text-left ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((o) => !o)}
        className={`w-full bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-white/10 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 outline-none transition-all flex items-center justify-between shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${schemeClasses.focusRing} ${buttonClassName}`}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className={selectedOption || value ? "text-gray-900 dark:text-white font-bold truncate" : "text-gray-400 dark:text-gray-500 font-normal truncate"}>
            {displayLabel}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-400 dark:text-gray-500 shrink-0 ml-1.5 transition-transform duration-200 ${
            isOpen ? `rotate-180 ${schemeClasses.chevronOpen}` : ""
          }`}
        />
      </button>

      {isOpen && !disabled && (
        <div className={`absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-[#141414] backdrop-blur-2xl p-1.5 shadow-2xl max-h-60 overflow-y-auto overscroll-contain animate-in fade-in zoom-in-95 duration-150 ${dropdownClassName}`}>
          {normalizedOptions.map((opt) => {
            const isSelected = String(value) === String(opt.value);
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold transition flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? schemeClasses.activeItem
                    : `text-gray-800 dark:text-gray-200 ${schemeClasses.hoverItem}`
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                  <div className="truncate">
                    <div className="truncate">{opt.label}</div>
                    {opt.description && (
                      <div className={`text-[10px] ${isSelected ? "text-white/80" : "text-gray-400 dark:text-gray-500"}`}>
                        {opt.description}
                      </div>
                    )}
                  </div>
                </div>
                {isSelected && <Check size={15} className="shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});

CustomSelect.displayName = "CustomSelect";
export default CustomSelect;
