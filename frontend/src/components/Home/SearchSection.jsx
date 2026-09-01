import { useState, useRef, useEffect } from "react";
import Container from "../../layouts/Container";
import { 
  Search, 
  MapPin, 
  Map, 
  Home, 
  GraduationCap, 
  IndianRupee,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from "lucide-react";

// Custom Select Component for Professional UI
const CustomSelect = ({ value, onChange, options, placeholder, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : placeholder;

  return (
    <div 
      ref={dropdownRef} 
      className="relative w-full h-[54px]"
    >
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-full w-full cursor-pointer items-center gap-3 rounded-2xl border bg-gray-50 px-4 shadow-sm transition-all ${
          isOpen ? "border-[#93B733] bg-white ring-1 ring-[#93B733]" : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <Icon size={18} className={`${isOpen ? "text-[#93B733]" : "text-gray-400"} flex-shrink-0 transition-colors`} />
        <span className={`flex-1 text-sm font-medium ${value ? "text-[#3A2935]" : "text-gray-500"}`}>
          {displayValue}
        </span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-[60px] z-50 w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl animate-[fadeIn_0.15s_ease-out_forwards]">
          <div className="max-h-[240px] overflow-y-auto p-1.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-200">
            <div 
              onClick={() => { onChange(""); setIsOpen(false); }}
              className={`cursor-pointer rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                !value ? "bg-[#93B733]/10 text-[#93B733]" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              }`}
            >
              {placeholder}
            </div>
            {options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={`cursor-pointer rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  value === opt.value ? "bg-[#93B733]/10 text-[#93B733]" : "text-[#3A2935] hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const SearchSection = ({
  filters = {}, 
  setFilters,
  onSearch,
  availableCities = ["Jaipur", "Jodhpur", "Noida", "Delhi"],
  availableAreas = ["Sector 62", "Knowledge Park", "Mansarovar", "Koramangala"],
  availableLandmarks = ["Amity University", "MIT", "Infosys", "Metro Station"],
}) => {
  
  const [isExpanded, setIsExpanded] = useState(false);

  // Default slider values
  const minSliderLimit = 3000;
  const maxSliderLimit = 50000;
  
  // Safely parse current min/max limits
  const currentMin = Number(filters.minPrice) || minSliderLimit;
  const currentMax = Number(filters.maxPrice) || 30000; 

  // Manual Search Handler
  const handleSearch = () => {
    if (onSearch) {
      onSearch({
        pgType: filters.pgType || "",
        city: filters.city || filters.location || "",
        area: filters.area || "",
        landmark: filters.landmark || "",
        minPrice: filters.minPrice || "",
        maxPrice: filters.maxPrice || "30000",
      });
    }
  };

  // DUAL SLIDER HANDLERS
  const handleMinChange = (e) => {
    const value = Math.min(Number(e.target.value), currentMax - 500);
    setFilters((prev) => ({ ...prev, minPrice: value.toString() }));
  };

  const handleMaxChange = (e) => {
    const value = Math.max(Number(e.target.value), currentMin + 500);
    setFilters((prev) => ({ ...prev, maxPrice: value.toString() }));
  };

  const minPercent = ((currentMin - minSliderLimit) / (maxSliderLimit - minSliderLimit)) * 100;
  const maxPercent = ((currentMax - minSliderLimit) / (maxSliderLimit - minSliderLimit)) * 100;

  return (
    <>
      <section className="relative z-20 -mt-8 px-4 sm:px-0 md:-mt-12 lg:-mt-16">
        <Container className="max-w-[1440px] 2xl:max-w-[1600px]">
          <div className="rounded-[2rem] border border-gray-100 bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.06)] sm:p-6 md:rounded-[2.5rem] md:p-8">
            
            {/* Mobile Header */}
            <div className="mb-5 flex items-center justify-between md:hidden">
              <div>
                <h2 className="text-lg font-black text-[#3A2935] tracking-tight">
                  Find Your PG
                </h2>
                <p className="mt-0.5 text-[11px] font-medium text-gray-500">
                  Select your preferences
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#93B733]/10 text-[#93B733]">
                <Search size={18} />
              </div>
            </div>
            
            <div className="grid gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              
              {/* === ROW 1: PRIMARY FILTERS === */}
              
              <CustomSelect 
                icon={Home}
                value={filters.pgType || ""}
                onChange={(val) => setFilters((prev) => ({ ...prev, pgType: val }))}
                placeholder="All PG Types"
                options={[
                  { value: "boys", label: "Boys PG" },
                  { value: "girls", label: "Girls PG" },
                  { value: "coed", label: "COED PG" }
                ]}
              />

              <CustomSelect 
                icon={MapPin}
                value={filters.city || filters.location || ""}
                onChange={(val) => setFilters((prev) => ({ 
                    ...prev, 
                    city: val,
                    area: "",       // Automatically clear Area when city changes
                    landmark: ""    // Automatically clear Landmark when city changes
                }))}
                placeholder="All Cities"
                options={availableCities.map(c => ({ value: c, label: c }))}
              />

              <CustomSelect 
                icon={Map}
                value={filters.area || ""}
                onChange={(val) => setFilters((prev) => ({ ...prev, area: val }))}
                placeholder="All Areas / Sectors"
                options={availableAreas.map(a => ({ value: a, label: a }))}
              />

              {/* === SECONDARY FILTERS === */}
              
              <div className={`${isExpanded ? 'block' : 'hidden'} md:block col-span-1 lg:col-span-1`}>
                <CustomSelect 
                  icon={GraduationCap}
                  value={filters.landmark || ""}
                  onChange={(val) => setFilters((prev) => ({ ...prev, landmark: val }))}
                  placeholder="Nearby Landmark / Univ"
                  options={availableLandmarks.map(l => ({ value: l, label: l }))}
                />
              </div>

              {/* === DUAL-RANGE BUDGET SLIDER === */}
              <div className={`${isExpanded ? 'flex' : 'hidden'} md:flex flex-col justify-center px-5 h-[54px] w-full rounded-2xl border border-gray-200 bg-gray-50 shadow-sm col-span-1 md:col-span-2 lg:col-span-2 lg:col-start-2`}>
                <div className="flex justify-between items-center w-full mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1">
                    <IndianRupee size={12} /> Budget Range
                  </span>
                  <span className="text-[#4E700F] text-xs font-black">
                    ₹{currentMin.toLocaleString()} - ₹{currentMax.toLocaleString()}{currentMax === maxSliderLimit ? '+' : ''}
                  </span>
                </div>
                
                <div className="relative w-full h-1.5 bg-gray-200 rounded-lg flex items-center">
                  <div 
                    className="absolute h-full bg-[#93B733] rounded-lg opacity-80"
                    style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
                  ></div>

                  <input
                    type="range"
                    aria-label="Minimum budget"
                    min={minSliderLimit}
                    max={maxSliderLimit}
                    step="500"
                    value={currentMin}
                    onChange={handleMinChange}
                    className="dual-range absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none z-20"
                  />

                  <input
                    type="range"
                    aria-label="Maximum budget"
                    min={minSliderLimit}
                    max={maxSliderLimit}
                    step="500"
                    value={currentMax}
                    onChange={handleMaxChange}
                    className="dual-range absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none z-30"
                  />
                </div>
              </div>
            </div>

            {/* === BOTTOM ACTION ROW === */}
            <div className="mt-4 sm:mt-5 flex flex-col-reverse md:flex-row items-center justify-between gap-4">
              
              <button
                type="button" 
                onClick={(e) => {
                  e.preventDefault();
                  setIsExpanded((prev) => !prev);
                }}
                className="flex items-center gap-1.5 text-[13px] font-bold text-gray-500 transition-colors hover:text-[#93B733] md:hidden"
              >
                <SlidersHorizontal size={14} />
                {isExpanded ? "Show Fewer Filters" : "Budget & Landmark"}
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              <p className="hidden md:block text-[12px] font-medium text-gray-600">
                Select your preferences and click search to find matching PGs.
              </p>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleSearch();
                }}
                className="flex w-full md:w-auto h-[54px] items-center justify-center gap-2 rounded-2xl bg-[#4A6C0B] px-10 text-sm font-black tracking-wide text-white shadow-[0_8px_20px_rgba(74,108,11,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#3d5909] hover:shadow-[0_12px_25px_rgba(74,108,11,0.4)] active:scale-[0.98]"
              >
                Search Verified PGs
                <Search size={16} className="text-white/90" />
              </button>
            </div>

          </div>
        </Container>
      </section>
    </>
  );
};

export default SearchSection;