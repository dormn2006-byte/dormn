import { useState, useEffect, useRef, memo } from "react";
import { ChevronDown, Check } from "lucide-react";

const CustomSelect = memo(({ 
  options = [], 
  value = "", 
  onChange, 
  placeholder = "Select...", 
  className = "",
  disabled = false,
  required = false
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

  return (
    <div className={`relative w-full text-left ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(o => !o)}
        className="w-full bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-white/10 px-3.5 py-2.5 sm:py-2.5 text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 outline-none hover:border-[#93B733]/60 focus:border-[#93B733] focus:ring-2 focus:ring-[#93B733]/20 transition-all flex items-center justify-between shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className={value ? "text-gray-900 dark:text-white font-semibold truncate" : "text-gray-400 dark:text-gray-500 font-normal truncate"}>
          {value || placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-400 dark:text-gray-500 shrink-0 ml-1.5 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#93B733] dark:text-[#93B733]" : ""
          }`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl border border-gray-100 dark:border-white/10 bg-white/95 dark:bg-[#141414]/95 backdrop-blur-2xl p-1.5 shadow-2xl max-h-56 sm:max-h-60 overflow-y-auto overscroll-contain animate-in fade-in zoom-in-95 duration-150">
          {options.map((opt) => {
            const isSelected = value === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className={`w-full text-left rounded-xl px-3.5 py-2 sm:py-2 text-xs sm:text-sm font-semibold transition flex items-center justify-between ${
                  isSelected
                    ? "bg-[#93B733] text-white shadow-xs"
                    : "text-gray-800 dark:text-gray-200 hover:bg-[#93B733]/10 dark:hover:bg-white/5 hover:text-[#0D3A1D] dark:hover:text-white"
                }`}
              >
                <span className="truncate">{opt}</span>
                {isSelected && <Check size={15} className="text-white shrink-0 ml-2" />}
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
