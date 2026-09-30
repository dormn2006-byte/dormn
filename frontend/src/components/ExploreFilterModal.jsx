import React, { useState, useEffect, useMemo, memo } from "react";
import { X, Check, UtensilsCrossed } from "lucide-react";
import { AMENITIES_CATALOG } from "./AmenitiesModal";
import { hasAmenityMatch, matchesFoodPreference } from "../utils/amenities";

const AmenityCard = ({ item, isSelected, onToggle, compact = false }) => {
  const Icon = item.icon;
  return (
    <div
      onClick={() => onToggle(item.value)}
      className={`relative rounded-${compact ? "xl p-2.5 sm:p-3" : "2xl p-3 sm:p-3.5"} border text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all select-none ${
        isSelected
          ? "border-2 border-black dark:border-white bg-gray-50/90 dark:bg-white/10 shadow-xs"
          : "border-gray-200 dark:border-white/10 bg-white dark:bg-[#121212] hover:border-gray-400 dark:hover:border-white/25"
      }`}
    >
      {isSelected && (
        <span className={`absolute ${compact ? "top-1.5 right-1.5 h-3.5 w-3.5" : "top-2 right-2 h-4 w-4"} rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shadow-xs`}>
          <Check size={compact ? 9 : 10} strokeWidth={3} />
        </span>
      )}
      <div className={`${compact ? "w-8 h-8 rounded-xl" : "w-11 h-11 rounded-2xl"} flex items-center justify-center ${item.iconBg}`}>
        <Icon size={compact ? 16 : 22} />
      </div>
      <span className={`${compact ? "text-[11px]" : "text-xs"} font-semibold text-gray-800 dark:text-gray-200 leading-tight`}>
        {item.label}
      </span>
    </div>
  );
};

const ExploreFilterModal = ({
  isOpen,
  onClose,
  currentFilters,
  currentActiveFilter = "All",
  pgListings = [],
  availableCities = [],
  availableAreas = [],
  onApply,
}) => {
  const [draft, setDraft] = useState({
    pgType: "",
    foodType: "",
    city: "",
    area: "",
    landmark: "",
    amenities: [],
    minPrice: "0",
    maxPrice: "50000",
  });

  const maxLimit = 50000;

  useEffect(() => {
    if (isOpen) {
      const matchedCity = availableCities.find(c => c.toLowerCase() === (currentFilters.city || "").toLowerCase()) || currentFilters.city || "";
      const matchedArea = availableAreas.find(a => a.toLowerCase() === (currentFilters.area || "").toLowerCase()) || currentFilters.area || "";

      setDraft({
        pgType: currentFilters.pgType || (currentActiveFilter !== "All" && ["Boys", "Girls", "COED", "Short Stay"].includes(currentActiveFilter) ? currentActiveFilter.toLowerCase() : ""),
        foodType: currentFilters.foodType || (currentActiveFilter === "Veg" ? "veg" : currentActiveFilter === "Non-Veg" ? "non-veg" : ""),
        city: matchedCity,
        area: matchedArea,
        landmark: currentFilters.landmark || "",
        amenities: Array.isArray(currentFilters.amenities)
          ? [...currentFilters.amenities]
          : currentFilters.amenity ? [currentFilters.amenity] : [],
        minPrice: currentFilters.minPrice ? String(currentFilters.minPrice) : "0",
        maxPrice: currentFilters.maxPrice ? String(currentFilters.maxPrice) : "50000",
      });
    }
  }, [isOpen, currentFilters, currentActiveFilter, availableCities, availableAreas]);

  // Lock body scroll on modal mount
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  const draftMin = Number(draft.minPrice || 0);
  const draftMax = Number(draft.maxPrice || maxLimit);

  // Real-time Matching Count
  const liveCount = useMemo(() => {
    if (!isOpen) return 0;
    const dCity = draft.city?.toLowerCase();
    const dArea = draft.area?.toLowerCase();
    const dLandmark = draft.landmark?.toLowerCase();
    const dType = draft.pgType?.toLowerCase();
    const dFood = draft.foodType?.toLowerCase();
    const hasAmenities = draft.amenities?.length > 0;

    let count = 0;
    for (let i = 0; i < pgListings.length; i++) {
      const pg = pgListings[i];
      const price = Number(pg.price || 0);
      if (draftMin > 0 && price < draftMin) continue;
      if (draftMax < maxLimit && price > draftMax) continue;

      if (dType) {
        if (dType === "short stay") {
          if (!pg.allow_short_stay) continue;
        } else if (!String(pg.pg_type || "").toLowerCase().includes(dType)) {
          continue;
        }
      }

      if (dFood && !matchesFoodPreference(pg, dFood)) continue;

      if (dCity && String(pg.city || "").toLowerCase() !== dCity) continue;
      if (dArea && String(pg.area || "").toLowerCase() !== dArea) continue;
      if (dLandmark && !String(pg.nearby_college || "").toLowerCase().includes(dLandmark)) continue;
      if (hasAmenities && !draft.amenities.every((a) => hasAmenityMatch(pg, a))) continue;

      count++;
    }
    return count;
  }, [isOpen, pgListings, draft, draftMin, draftMax]);

  const modalAreas = useMemo(() => {
    if (!isOpen || !draft.city) {
      return availableAreas;
    }
    const matched = pgListings.filter(pg => pg.city?.toLowerCase() === draft.city.toLowerCase() && pg.area).map(pg => pg.area);
    return [...new Set(matched)];
  }, [isOpen, pgListings, draft.city, availableAreas]);

  const toggleAmenity = (val) => {
    setDraft((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(val) ? prev.amenities.filter((a) => a !== val) : [...prev.amenities, val],
    }));
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-[fadeIn_0.15s_ease-out]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full sm:max-w-xl md:max-w-2xl bg-white dark:bg-[#161616] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] border border-gray-100 dark:border-white/10 animate-[slideUp_0.25s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-white/10 shrink-0">
          <div className="w-8" />
          <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white tracking-tight">Filters</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-5 sm:px-6 py-5 space-y-6 flex-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
          
          {/* Amenities */}
          <div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-1">Recommended for you</h3>
            <p className="text-xs text-gray-400 mb-3 font-medium">Popular facilities & amenities</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              {AMENITIES_CATALOG.slice(0, 4).map((item) => (
                <AmenityCard key={item.value} item={item} isSelected={draft.amenities.includes(item.value)} onToggle={toggleAmenity} />
              ))}
            </div>

            <div className="mt-3">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">More amenities</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                {AMENITIES_CATALOG.slice(4).map((item) => (
                  <AmenityCard key={item.value} item={item} isSelected={draft.amenities.includes(item.value)} onToggle={toggleAmenity} compact />
                ))}
              </div>
            </div>
          </div>

          <hr className="border-gray-100 dark:border-white/10" />

          {/* Type of place */}
          <div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-3">Type of place</h3>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 p-1 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/5">
              {[
                { value: "", label: "Any type" },
                { value: "boys", label: "Boys" },
                { value: "girls", label: "Girls" },
                { value: "coed", label: "COED" },
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, pgType: type.value }))}
                  className={`py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all text-center cursor-pointer ${
                    draft.pgType === type.value
                      ? "bg-white dark:bg-[#252525] text-black dark:text-white shadow-sm border border-gray-200/80 dark:border-white/15"
                      : "text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <hr className="border-gray-100 dark:border-white/10" />

          {/* Food / Diet Preference */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <UtensilsCrossed size={16} className="text-[#93B733]" />
                <span>Food Preference</span>
              </h3>
              {draft.foodType && (
                <span className="text-[11px] font-bold text-[#4E700F] dark:text-[#93B733]">
                  {draft.foodType === "veg" ? "Veg 🟢" : "Non-Veg 🟤"}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 p-1 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/5">
              {[
                { value: "", label: "Any Food" },
                { value: "veg", label: "Veg 🟢" },
                { value: "non-veg", label: "Non-Veg 🟤" },
              ].map((foodOpt) => (
                <button
                  key={foodOpt.value}
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, foodType: foodOpt.value }))}
                  className={`py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all text-center cursor-pointer ${
                    draft.foodType === foodOpt.value
                      ? "bg-white dark:bg-[#252525] text-black dark:text-white shadow-sm border border-gray-200/80 dark:border-white/15"
                      : "text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white"
                  }`}
                >
                  {foodOpt.label}
                </button>
              ))}
            </div>
          </div>

          <hr className="border-gray-100 dark:border-white/10" />

          {/* Location */}
          <div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-3">Location</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">City</label>
                <select
                  value={draft.city}
                  onChange={(e) => setDraft((prev) => ({ ...prev, city: e.target.value, area: "" }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#1a1a1a] text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 outline-none"
                >
                  <option value="">All Cities</option>
                  {availableCities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Area / Sector</label>
                <select
                  value={draft.area}
                  onChange={(e) => setDraft((prev) => ({ ...prev, area: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#1a1a1a] text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 outline-none"
                >
                  <option value="">All Areas</option>
                  {modalAreas.map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 border-t border-gray-100 dark:border-white/10 bg-white dark:bg-[#161616] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => setDraft({ pgType: "", foodType: "", city: "", area: "", landmark: "", amenities: [], minPrice: "0", maxPrice: "50000" })}
            className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 underline hover:text-black dark:hover:text-white transition-colors cursor-pointer"
          >
            Clear all
          </button>

          <button
            type="button"
            onClick={() => {
              onApply(draft);
              onClose();
            }}
            className="bg-[#222222] hover:bg-black text-white dark:bg-white dark:text-black dark:hover:bg-gray-100 px-6 sm:px-8 py-3 rounded-xl font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Show {liveCount} {liveCount === 1 ? "place" : "places"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default memo(ExploreFilterModal);
