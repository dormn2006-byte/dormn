import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Link } from "react-router-dom";
import {
  Bookmark,
  Building2,
  MapPin,
  IndianRupee,
  ChevronRight,
  Search,
  Sparkles,
  Heart,
} from "lucide-react";
import api, { IMAGE_BASE_URL } from "../../services/api";

const parseImages = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw); } catch { return []; }
};

const SavedPGCard = memo(({ pg, onUnsave, isUnsaving }) => {
  const images = parseImages(pg.images);
  const rawImage = pg.profile_image || images[0] || (Array.isArray(pg.gallery) ? pg.gallery[0]?.image_url : null);
  const imageUrl = rawImage
    ? rawImage.startsWith("http") || rawImage.startsWith("data:")
      ? rawImage
      : `${IMAGE_BASE_URL}/uploads/${rawImage}`
    : "";

  const title = pg.title || pg.pg_name || "PG Accommodation";
  const price = Number(pg.price || pg.min_price || 0);

  return (
    <div className="group bg-white dark:bg-[#111] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs flex flex-col transition hover:shadow-md">
      {/* Property Image */}
      <div className="relative h-36 sm:h-52 bg-gray-100 dark:bg-white/5 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-400">
            <Building2 size={32} />
          </div>
        )}

        <div className="absolute top-2.5 left-2.5 sm:top-3.5 sm:left-3.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-white/90 dark:bg-black/80 backdrop-blur-md text-gray-900 dark:text-white shadow-xs">
          {pg.pg_type || "PG Stay"}
        </div>

        <button
          onClick={() => onUnsave(pg.id)}
          disabled={isUnsaving}
          title="Remove from saved"
          className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white/90 dark:bg-black/80 backdrop-blur-md flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/20 transition shadow-xs cursor-pointer disabled:opacity-50"
        >
          <Heart size={14} className="fill-current" />
        </button>
      </div>

      {/* Card Info */}
      <div className="p-3.5 sm:p-5 flex flex-col flex-1">
        <h3 className="font-black text-sm sm:text-lg text-gray-900 dark:text-white leading-tight truncate">
          {title}
        </h3>

        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1 mb-2.5 sm:mb-4 truncate">
          <MapPin size={12} className="shrink-0 text-gray-400 sm:w-3.5 sm:h-3.5" />
          <span className="truncate">{[pg.area, pg.city].filter(Boolean).join(", ") || "City location"}</span>
        </div>

        <div className="mt-auto flex items-center justify-between pt-2.5 sm:pt-3.5 border-t border-gray-100 dark:border-white/5">
          <div className="flex items-baseline gap-0.5 text-gray-900 dark:text-white">
            <IndianRupee size={13} className="text-gray-500 self-center sm:w-4 sm:h-4" />
            <span className="font-black text-sm sm:text-lg">{price.toLocaleString()}</span>
            <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 ml-0.5">/mo</span>
          </div>

          <Link
            to={`/pg/${pg.id}`}
            className="inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-bold text-[11px] sm:text-xs text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition shadow-xs cursor-pointer"
          >
            <span>Book / View</span>
            <ChevronRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
});
SavedPGCard.displayName = "SavedPGCard";

const OwnerSavedPGs = () => {
  const [pgs, setPgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [unsavingId, setUnsavingId] = useState(null);

  const fetchSavedPGs = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/pg/saved");
      setPgs(data && (data.success || Array.isArray(data.pgs)) ? data.pgs || [] : []);
    } catch {
      setPgs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedPGs();
  }, [fetchSavedPGs]);

  const handleUnsave = useCallback(async (pgId) => {
    setUnsavingId(pgId);
    try {
      await api.post("/pg/save", { pgId });
      setPgs((prev) => prev.filter((p) => p.id !== pgId));
    } catch {
      alert("Failed to remove PG from saved list.");
    } finally {
      setUnsavingId(null);
    }
  }, []);

  const filteredPGs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return pgs;
    return pgs.filter((p) => {
      const title = (p.title || p.pg_name || "").toLowerCase();
      const area = (p.area || "").toLowerCase();
      const city = (p.city || "").toLowerCase();
      return title.includes(q) || area.includes(q) || city.includes(q);
    });
  }, [pgs, searchTerm]);

  return (
    <div className="w-full space-y-3.5 sm:space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white dark:bg-[#111] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 lg:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <Bookmark size={10} className="fill-current sm:w-2.5 sm:h-2.5" />
                <span>Bookmarks</span>
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              Saved PGs
            </h1>
            <p className="text-[11px] sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1 max-w-2xl">
              Hostels and accommodations you have bookmarked for quick review, price tracking, or instant booking.
            </p>
          </div>

          <Link
            to="/pgs"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition shadow-xs cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Sparkles size={13} className="sm:w-3.5 sm:h-3.5" />
            <span>Explore More PGs</span>
          </Link>
        </div>

        <div className="flex items-center gap-2 pt-2.5 sm:pt-4 mt-2.5 sm:mt-4 border-t border-gray-100 dark:border-white/5">
          <span className="text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400">Total Saved Properties:</span>
          <span className="text-[11px] sm:text-xs font-black text-gray-900 dark:text-white bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
            {pgs.length}
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white dark:bg-[#111] rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-xs">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 sm:left-3.5 sm:w-4 sm:h-4" />
          <input
            type="text"
            placeholder="Search saved properties by name, locality or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-gray-50 dark:bg-white/[0.04] text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none transition focus:bg-gray-100 dark:focus:bg-white/[0.07]"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-[#111] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs animate-pulse">
              <div className="h-48 bg-gray-100 dark:bg-white/5" />
              <div className="p-5 space-y-3">
                <div className="h-5 bg-gray-100 dark:bg-white/5 rounded-md w-3/4" />
                <div className="h-4 bg-gray-100 dark:bg-white/5 rounded-md w-1/2" />
                <div className="h-6 bg-gray-100 dark:bg-white/5 rounded-md w-1/3 pt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredPGs.length === 0 ? (
        <div className="bg-white dark:bg-[#111] rounded-2xl sm:rounded-3xl p-10 sm:p-14 text-center shadow-xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 mb-4">
            <Bookmark size={30} />
          </div>
          <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">
            {searchTerm ? "No Saved PGs Match Your Search" : "No Saved Properties Yet"}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1.5 max-w-md mx-auto">
            {searchTerm
              ? "Try typing different keywords or clear your search query."
              : "When you browse listings on Dormn, click the bookmark icon to save properties here for easy comparison and booking."}
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              to="/pgs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition shadow-xs"
            >
              <Sparkles size={15} />
              <span>Browse All PGs</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredPGs.map((pg) => (
            <SavedPGCard
              key={pg.id}
              pg={pg}
              onUnsave={handleUnsave}
              isUnsaving={unsavingId === pg.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerSavedPGs;
