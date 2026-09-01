import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PublicLayout from "../layouts/PublicLayout";
import PGCard from "../components/cards/PGCard";
import API from "../services/api";
import Container from "../layouts/Container";
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

const quickFilters = ["All", "Boys", "Girls", "COED", "AC Room", "Non AC"];

const SectionSlider = ({ title, subtitle, pgs }) => {
  if (!pgs || pgs.length === 0) return null;
  return (
    <div className="mb-14 max-w-[1440px] 2xl:max-w-[1600px] mx-auto animate-[fadeIn_0.5s_ease-out_forwards]">
      <div className="mb-4 pl-4 sm:pl-6 md:pl-8 lg:pl-10">
        <h2 className="text-[22px] sm:text-2xl md:text-3xl font-black text-[#3A2935] tracking-tight">{title}</h2>
        {subtitle && <p className="mt-1 text-xs sm:text-sm font-medium text-gray-500">{subtitle}</p>}
      </div>
      
      <div className="overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth [-webkit-overflow-scrolling:touch]">
        <div className="inline-flex gap-4 sm:gap-5 pl-5 pr-8 sm:pl-6 sm:pr-10 lg:pl-10 lg:pr-12 pb-6 snap-x snap-mandatory after:content-[''] after:flex-none after:w-4 sm:after:w-6 lg:after:w-8">
          {pgs.map((pg) => (
            <div 
              key={pg.id} 
              className="w-[44vw] min-w-[44vw] sm:w-[260px] sm:min-w-[260px] md:w-[300px] md:min-w-[300px] lg:w-[320px] lg:min-w-[320px] snap-start flex-shrink-0 transition-transform hover:-translate-y-1"
            >
              <PGCard pg={pg} />
            </div>
          ))}

          {/* View All Card */}
          <div className="w-[44vw] min-w-[44vw] sm:w-[260px] sm:min-w-[260px] md:w-[300px] md:min-w-[300px] lg:w-[320px] lg:min-w-[320px] snap-start flex-shrink-0 flex flex-col cursor-pointer transition-transform hover:scale-[0.98]">
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-gray-100 bg-gray-50 aspect-[4/3] mb-3">
               <span className="text-xs sm:text-sm font-bold text-[#3A2935]">View All</span>
               <span className="mt-2 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white shadow-sm">→</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="flex flex-col gap-3.5 w-full">
    <div className="w-full aspect-[20/19] rounded-2xl bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse" />
    <div className="flex flex-col gap-2 px-1">
      <div className="h-4 w-3/4 rounded-md bg-gray-200 dark:bg-gray-800 animate-pulse" />
      <div className="h-3 w-1/2 rounded-md bg-gray-200 dark:bg-gray-800 animate-pulse" />
      <div className="h-4 w-1/3 rounded-md bg-gray-200 dark:bg-gray-800 animate-pulse mt-1" />
    </div>
  </div>
);

// Custom Select Component for Professional UI
const CustomSelect = ({ value, onChange, options, placeholder, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

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
      className="relative w-full h-[52px]"
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

      {isOpen && (
        <div className="absolute left-0 top-[58px] z-50 w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl animate-[fadeIn_0.15s_ease-out_forwards]">
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

const ExplorePGs = () => {
  const [searchParams] = useSearchParams();
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState(searchParams.get("search") || searchParams.get("location") || "");
  
  // Advanced Filter States
  const [filters, setFilters] = useState({
    pgType: searchParams.get("type") || "",
    city: searchParams.get("city") || searchParams.get("location") || "",
    area: "",
    landmark: "",
    minPrice: "3000",
    maxPrice: "50000",
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [pgListings, setPgListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const minSliderLimit = 3000;
  const maxSliderLimit = 50000;
  const currentMin = Number(filters.minPrice) || minSliderLimit;
  const currentMax = Number(filters.maxPrice) || maxSliderLimit;

  useEffect(() => {
    const fetchPGs = async () => {
      try {
        setLoading(true);
        const response = await API.get("/pg/all");
        setPgListings(response.data?.pgs || []);
      } catch (err) {
        console.error("Failed to load PG listings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPGs();
  }, []);

  // Dynamic Cascading Options based on loaded listings
  const availableCities = useMemo(() => {
    return [...new Set(pgListings.map(pg => pg.city).filter(Boolean))];
  }, [pgListings]);

  const availableAreas = useMemo(() => {
    if (!filters.city) {
      return [...new Set(pgListings.map(pg => pg.area).filter(Boolean))];
    }
    return [...new Set(pgListings.filter(pg => pg.city?.toLowerCase() === filters.city.toLowerCase() && pg.area).map(pg => pg.area))];
  }, [pgListings, filters.city]);

  const availableLandmarks = useMemo(() => {
    if (!filters.city) {
      return [...new Set(pgListings.map(pg => pg.nearby_college).filter(Boolean))];
    }
    return [...new Set(pgListings.filter(pg => pg.city?.toLowerCase() === filters.city.toLowerCase() && pg.nearby_college).map(pg => pg.nearby_college))];
  }, [pgListings, filters.city]);

  // Dual Slider Handlers
  const handleMinChange = (e) => {
    const value = Math.min(Number(e.target.value), currentMax - 500);
    setFilters(prev => ({ ...prev, minPrice: value.toString() }));
  };

  const handleMaxChange = (e) => {
    const value = Math.max(Number(e.target.value), currentMin + 500);
    setFilters(prev => ({ ...prev, maxPrice: value.toString() }));
  };

  const minPercent = ((currentMin - minSliderLimit) / (maxSliderLimit - minSliderLimit)) * 100;
  const maxPercent = ((currentMax - minSliderLimit) / (maxSliderLimit - minSliderLimit)) * 100;

  // Filter Logic
  const filteredPGs = useMemo(() => {
    return pgListings.filter((pg) => {
      // Text Search match
      const title = (pg.title || "").toLowerCase();
      const location = (`${pg.city || ""} ${pg.area || ""} ${pg.address || ""}`).toLowerCase();
      const matchesSearch = !search.trim() || title.includes(search.toLowerCase()) || location.includes(search.toLowerCase());

      // PG Type match
      const pgType = String(pg.pg_type || "").toLowerCase();
      const matchesType = !filters.pgType || pgType.includes(filters.pgType.toLowerCase());

      // City match
      const matchesCity = !filters.city || String(pg.city || "").toLowerCase() === filters.city.toLowerCase();

      // Area match
      const matchesArea = !filters.area || String(pg.area || "").toLowerCase() === filters.area.toLowerCase();

      // Landmark match
      const matchesLandmark = !filters.landmark || String(pg.nearby_college || "").toLowerCase().includes(filters.landmark.toLowerCase());

      // Price Range match
      const price = Number(pg.price || 0);
      const matchesPrice = price >= currentMin && price <= currentMax;

      // Quick Pill Filters match
      let matchesPill = true;
      const amenitiesStr = String(pg.amenities || "").toLowerCase();
      if (activeFilter === "Boys") matchesPill = pgType.includes("boys");
      else if (activeFilter === "Girls") matchesPill = pgType.includes("girls");
      else if (activeFilter === "COED") matchesPill = pgType.includes("coed") || pgType.includes("both");
      else if (activeFilter === "AC Room") matchesPill = amenitiesStr.includes("ac");
      else if (activeFilter === "Non AC") matchesPill = !amenitiesStr.includes("ac");

      return matchesSearch && matchesType && matchesCity && matchesArea && matchesLandmark && matchesPrice && matchesPill;
    });
  }, [pgListings, search, filters, activeFilter, currentMin, currentMax]);

  const jodhpurPGs = useMemo(() => pgListings.filter(pg => String(pg.city).toLowerCase().includes("jodhpur")), [pgListings]);
  const jaipurPGs = useMemo(() => pgListings.filter(pg => String(pg.city).toLowerCase().includes("jaipur")), [pgListings]);
  const premiumPGs = useMemo(() => pgListings.filter(pg => String(pg.amenities).toLowerCase().includes("ac")), [pgListings]);

  const isDiscoverMode = !search.trim() && !filters.pgType && !filters.city && !filters.area && !filters.landmark && activeFilter === "All" && currentMin === minSliderLimit && currentMax === maxSliderLimit;

  return (
    <PublicLayout>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      
      <div className="bg-[#FAF9F5] min-h-screen font-sans pb-20 selection:bg-[#93B733] selection:text-white">
        
        {/* Sticky Advanced Search & Filter Bar */}
        <section className="sticky top-[68px] z-30 bg-[#FAF9F5]/95 backdrop-blur-xl pt-4 pb-3 border-b border-gray-200/60 shadow-[0_4px_15px_-10px_rgba(0,0,0,0.05)] transition-all duration-300">
          
          <Container className="max-w-[1440px] 2xl:max-w-[1600px] mb-4">
            
            {/* Search Input Bar */}
            <div className="max-w-4xl mx-auto mb-4">
              <div className="flex items-center bg-white border border-gray-300 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.04)] py-1.5 px-1.5 pl-4 sm:pl-6 transition-all focus-within:border-gray-400 focus-within:shadow-md">
                <input
                  type="text"
                  placeholder="Search by city, area, or PG name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-grow min-h-[40px] text-[14px] sm:text-base font-medium text-gray-800 outline-none placeholder:text-gray-500 bg-transparent"
                />
                <button className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-[#93B733] text-white shadow-sm hover:bg-[#82a32d] transition-colors">
                  <Search size={18} />
                </button>
              </div>
            </div>

            {/* Filter Grid Container */}
            <div className="rounded-[2rem] border border-gray-100 bg-white p-4 sm:p-5 shadow-sm">
              <div className="grid gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                
                {/* PG Type */}
                <CustomSelect 
                  icon={Home}
                  value={filters.pgType}
                  onChange={(val) => setFilters(prev => ({ ...prev, pgType: val }))}
                  placeholder="All PG Types"
                  options={[
                    { value: "boys", label: "Boys PG" },
                    { value: "girls", label: "Girls PG" },
                    { value: "coed", label: "COED PG" }
                  ]}
                />

                {/* City */}
                <CustomSelect 
                  icon={MapPin}
                  value={filters.city}
                  onChange={(val) => setFilters(prev => ({ ...prev, city: val, area: "", landmark: "" }))}
                  placeholder="All Cities"
                  options={availableCities.map(c => ({ value: c, label: c }))}
                />

                {/* Area / Sector */}
                <CustomSelect 
                  icon={Map}
                  value={filters.area}
                  onChange={(val) => setFilters(prev => ({ ...prev, area: val }))}
                  placeholder="All Areas / Sectors"
                  options={availableAreas.map(a => ({ value: a, label: a }))}
                />

                {/* Landmark */}
                <div className={`${isExpanded ? 'block' : 'hidden'} md:block col-span-1 lg:col-span-1`}>
                  <CustomSelect 
                    icon={GraduationCap}
                    value={filters.landmark}
                    onChange={(val) => setFilters(prev => ({ ...prev, landmark: val }))}
                    placeholder="Nearby Landmark / Univ"
                    options={availableLandmarks.map(l => ({ value: l, label: l }))}
                  />
                </div>

                {/* Dual-Range Budget Slider */}
                <div className={`${isExpanded ? 'flex' : 'hidden'} md:flex flex-col justify-center px-5 h-[52px] w-full rounded-2xl border border-gray-200 bg-gray-50 shadow-sm col-span-1 md:col-span-2 lg:col-span-2 lg:col-start-2`}>
                  <div className="flex justify-between items-center w-full mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                      <IndianRupee size={12} /> Budget Range
                    </span>
                    <span className="text-[#93B733] text-xs font-black">
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
                      min={minSliderLimit}
                      max={maxSliderLimit}
                      step="500"
                      value={currentMin}
                      onChange={handleMinChange}
                      className="dual-range absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none z-20"
                    />

                    <input
                      type="range"
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

              {/* Toggle More Filters on Mobile */}
              <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-100">
                <button
                  type="button" 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-[#93B733] md:hidden"
                >
                  <SlidersHorizontal size={14} />
                  {isExpanded ? "Show Fewer Filters" : "More Filters (Landmark, Budget)"}
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                <span className="text-xs text-gray-400 hidden md:block font-medium">
                  Refine your search with precise location and budget limits.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFilters({ pgType: "", city: "", area: "", landmark: "", minPrice: "3000", maxPrice: "50000" });
                    setActiveFilter("All");
                    setSearch("");
                  }}
                  className="text-xs font-bold text-[#93B733] hover:underline ml-auto"
                >
                  Reset All Filters
                </button>
              </div>

            </div>
          </Container>

          {/* Quick Filter Pills */}
          <div className="overflow-x-auto lg:overflow-visible scrollbar-hide">
            <div className="inline-flex lg:flex lg:w-full lg:justify-center gap-2.5 sm:gap-3 pl-4 pr-8 sm:pl-6 sm:pr-10 lg:px-0">
              {quickFilters.map((filter) => {
                const isActive = activeFilter === filter;
                return (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`flex-shrink-0 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-[13px] sm:text-sm transition-all border ${
                      isActive 
                        ? "border-[#93B733] bg-[#93B733] text-white font-bold shadow-sm" 
                        : "border-gray-300 bg-white text-gray-600 font-medium hover:border-gray-500 hover:text-gray-900"
                    }`}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <div className="pt-8">
          {loading ? (
             <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
               {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
             </div>
          ) : isDiscoverMode ? (
            <>
              <SectionSlider title="Trending in Jodhpur" subtitle="The most booked PGs in the Blue City this week." pgs={jodhpurPGs.length > 0 ? jodhpurPGs : pgListings.slice(0, 4)} />
              
              {/* Premium Promo Banner */}
              <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 mb-14 animate-[fadeIn_0.5s_ease-out_0.2s_forwards]">
                <div className="relative overflow-hidden rounded-[2rem] bg-[#0D3A1D] px-6 py-10 sm:px-12 sm:py-16 md:rounded-[3rem]">
                  <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#93B733]/30 blur-3xl"></div>
                  <div className="relative z-10 md:w-2/3 lg:w-1/2">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#93B733]">Partner with Dormn</p>
                    <h3 className="mt-3 text-2xl font-black text-white sm:text-4xl md:text-5xl">Have a property? <br/>List it in minutes.</h3>
                    <p className="mt-4 text-sm font-medium text-gray-300 sm:text-base hidden sm:block">Join hundreds of verified owners. Get instant bookings, verified students, and secure payouts.</p>
                    <Link to="/auth?role=owner&mode=signup" className="mt-6 sm:mt-8 inline-block rounded-xl bg-[#93B733] px-6 sm:px-8 py-3.5 sm:py-4 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105">
                      Become an Owner
                    </Link>
                  </div>
                </div>
              </div>

              <SectionSlider title="Premium AC Stays" subtitle="Comfortable, air-conditioned rooms for the summer." pgs={premiumPGs.length > 0 ? premiumPGs : pgListings.slice(4, 8)} />
              <SectionSlider title="Popular in Jaipur" subtitle="Top-rated accommodations in the Pink City." pgs={jaipurPGs.length > 0 ? jaipurPGs : pgListings.slice(0, 4)} />
            </>
          ) : (
            
            /* ACTIVE SEARCH MODE (Grid View) */
            <section className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 animate-[fadeIn_0.3s_ease-out_forwards]">
              <div className="mb-6 sm:mb-8 flex items-center justify-between border-b border-gray-200 pb-4">
                <h2 className="text-xl sm:text-2xl font-black text-[#3A2935]">
                  {filteredPGs.length > 0 ? `${filteredPGs.length} Stays found` : "No exact matches"}
                </h2>
                <button 
                  onClick={() => {
                    setSearch("");
                    setFilters({ pgType: "", city: "", area: "", landmark: "", minPrice: "3000", maxPrice: "50000" });
                    setActiveFilter("All");
                  }}
                  className="text-xs sm:text-sm font-bold text-[#93B733] hover:underline"
                >
                  Clear Filters
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
                {filteredPGs.length === 0 ? (
                  <div className="col-span-full py-20 text-center flex flex-col items-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <h3 className="text-xl font-black text-[#3A2935]">No PGs found</h3>
                    <p className="mt-2 text-sm text-gray-500">We couldn't find any stays matching your current filters. Try exploring other areas or adjusting your budget.</p>
                  </div>
                ) : (
                  filteredPGs.map((pg) => (
                    <div key={pg.id} className="transition-all duration-300 hover:scale-[1.02] hover:shadow-xl rounded-2xl">
                      <PGCard pg={pg} />
                    </div>
                  ))
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};

export default ExplorePGs;
