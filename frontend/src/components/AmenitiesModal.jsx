import React, { useState, useEffect, memo } from "react";
import {
  X,
  Check,
  CircleParking,
  Wifi,
  Utensils,
  WashingMachine,
  Snowflake,
  Zap,
  Bath,
  Tv,
  ShieldCheck,
  Flame,
  Droplets,
  Refrigerator,
  Dumbbell,
  Sparkles
} from "lucide-react";

export const AMENITIES_CATALOG = [
  { value: "parking", label: "Free parking", icon: CircleParking, iconBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", recommended: true },
  { value: "wifi", label: "Wifi", icon: Wifi, iconBg: "bg-sky-500/15 text-sky-600 dark:text-sky-400", recommended: true },
  { value: "food", label: "Kitchen / Food", icon: Utensils, iconBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400", recommended: true },
  { value: "laundry", label: "Washing machine", icon: WashingMachine, iconBg: "bg-purple-500/15 text-purple-600 dark:text-purple-400", recommended: true },
  { value: "ac", label: "Air conditioning", icon: Snowflake, iconBg: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400", recommended: true },
  { value: "power", label: "Power backup", icon: Zap, iconBg: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400", recommended: true },
  { value: "bath", label: "Attached bath", icon: Bath, iconBg: "bg-teal-500/15 text-teal-600 dark:text-teal-400", recommended: true },
  { value: "tv", label: "TV", icon: Tv, iconBg: "bg-violet-500/15 text-violet-600 dark:text-violet-400", recommended: true },
  { value: "security", label: "CCTV & Security", icon: ShieldCheck, iconBg: "bg-blue-500/15 text-blue-600 dark:text-blue-400", recommended: false },
  { value: "geyser", label: "Geyser / Hot water", icon: Flame, iconBg: "bg-rose-500/15 text-rose-600 dark:text-rose-400", recommended: false },
  { value: "ro", label: "RO Drinking water", icon: Droplets, iconBg: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400", recommended: false },
  { value: "housekeeping", label: "Daily Housekeeping", icon: Sparkles, iconBg: "bg-[#93B733]/20 text-[#4E700F] dark:text-[#93B733]", recommended: false },
  { value: "fridge", label: "Refrigerator", icon: Refrigerator, iconBg: "bg-teal-500/15 text-teal-600 dark:text-teal-400", recommended: false },
  { value: "gym", label: "Gym / Fitness", icon: Dumbbell, iconBg: "bg-orange-500/15 text-orange-600 dark:text-orange-400", recommended: false },
];

const AmenityCard = memo(({ amenity, isSelected, onToggle }) => {
  const Icon = amenity.icon;
  return (
    <div
      onClick={() => onToggle(amenity.value)}
      className={`relative p-3.5 sm:p-4 rounded-2xl border text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-all select-none ${
        isSelected
          ? "border-2 border-black dark:border-white bg-gray-50/90 dark:bg-white/10 shadow-sm"
          : "border-gray-200 dark:border-white/10 bg-white dark:bg-[#121212] hover:border-gray-400 dark:hover:border-white/25"
      }`}
    >
      {isSelected && (
        <span className="absolute top-2 right-2 h-4 w-4 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center">
          <Check size={10} strokeWidth={3} />
        </span>
      )}
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-transform ${amenity.iconBg}`}>
        <Icon size={22} />
      </div>
      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-tight">
        {amenity.label}
      </span>
    </div>
  );
});

AmenityCard.displayName = "AmenityCard";

const AmenitiesModal = ({
  isOpen,
  onClose,
  selected = [],
  onApply,
  getMatchingCount,
}) => {
  const [draftSelected, setDraftSelected] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setDraftSelected(Array.isArray(selected) ? [...selected] : (selected ? [selected] : []));
    }
  }, [isOpen, selected]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleAmenity = (val) => {
    setDraftSelected((prev) =>
      prev.includes(val) ? prev.filter((item) => item !== val) : [...prev, val]
    );
  };

  const handleApply = () => {
    onApply(draftSelected);
    onClose();
  };

  const liveCount = getMatchingCount ? getMatchingCount(draftSelected) : null;
  const recommendedAmenities = AMENITIES_CATALOG.filter((a) => a.recommended);
  const otherAmenities = AMENITIES_CATALOG.filter((a) => !a.recommended);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="filters-modal-title"
    >
      <div 
        className="relative w-full max-w-lg md:max-w-xl bg-white dark:bg-[#161616] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100 dark:border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10">
          <div className="w-8" />
          <h2 id="filters-modal-title" className="text-base sm:text-lg font-black text-gray-900 dark:text-white tracking-tight">
            Filters
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close and cancel"
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto px-5 sm:px-6 py-5 space-y-6 flex-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
          
          {/* Selected Chips */}
          {draftSelected.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                  Selected ({draftSelected.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setDraftSelected([])}
                  className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {draftSelected.map((val) => {
                  const item = AMENITIES_CATALOG.find((a) => a.value === val);
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => toggleAmenity(val)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-gray-300 dark:border-white/20 bg-gray-50 dark:bg-white/5 text-xs font-semibold text-gray-800 dark:text-gray-200 hover:border-rose-400 hover:text-rose-500 dark:hover:border-rose-500 transition-colors group cursor-pointer"
                    >
                      <span>{item?.label || val}</span>
                      <X size={13} className="text-gray-400 group-hover:text-rose-500 transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommended Section */}
          <div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-3">
              Recommended for you
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              {recommendedAmenities.map((amenity) => (
                <AmenityCard
                  key={amenity.value}
                  amenity={amenity}
                  isSelected={draftSelected.includes(amenity.value)}
                  onToggle={toggleAmenity}
                />
              ))}
            </div>
          </div>

          {/* More Amenities Section */}
          <div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-3">
              More Amenities
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              {otherAmenities.map((amenity) => (
                <AmenityCard
                  key={amenity.value}
                  amenity={amenity}
                  isSelected={draftSelected.includes(amenity.value)}
                  onToggle={toggleAmenity}
                />
              ))}
            </div>
          </div>

        </div>

        {/* Modal Sticky Footer */}
        <div className="p-4 sm:px-6 border-t border-gray-100 dark:border-white/10 bg-white dark:bg-[#161616] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDraftSelected([])}
              disabled={draftSelected.length === 0}
              className={`text-sm font-semibold underline transition-colors cursor-pointer ${
                draftSelected.length === 0
                  ? "text-gray-300 dark:text-gray-600 cursor-not-allowed no-underline"
                  : "text-gray-800 dark:text-gray-200 hover:text-black dark:hover:text-white"
              }`}
            >
              Clear all
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 px-2 py-1 rounded transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <button
            type="button"
            onClick={handleApply}
            className="bg-[#222222] hover:bg-black text-white dark:bg-white dark:text-black dark:hover:bg-gray-100 px-5 sm:px-7 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
          >
            {liveCount !== null
              ? `Show ${liveCount} ${liveCount === 1 ? 'place' : 'places'}`
              : draftSelected.length > 0
              ? `Apply (${draftSelected.length} selected)`
              : "Show all places"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default memo(AmenitiesModal);
