import { useState, useEffect, useRef, memo } from "react";

const CustomSelect = memo(({ options, value, onChange, placeholder = "Select...", className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div className={`relative w-full text-left ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        className="w-full bg-white rounded-xl border border-gray-200 px-4 py-2.5 text-xs sm:text-sm font-bold text-[#0D3A1D] outline-none hover:border-[#93B733]/40 focus:border-[#93B733] transition-all flex items-center justify-between shadow-2xs"
      >
        <span className={value ? "text-[#0D3A1D]" : "text-gray-400 font-medium"}>
          {value || placeholder}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#93B733"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : "rotate-0"}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 z-[60] rounded-2xl border border-gray-100 bg-white/95 backdrop-blur-xl p-1.5 shadow-xl max-h-60 overflow-y-auto animate-[fadeIn_0.12s_ease-out_forwards]">
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
              className={`w-full text-left rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                value === opt
                  ? "bg-[#93B733] text-white shadow-xs"
                  : "text-[#0D3A1D] hover:bg-[#93B733]/10 hover:text-[#4E700F]"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
CustomSelect.displayName = "CustomSelect";

export default CustomSelect;
