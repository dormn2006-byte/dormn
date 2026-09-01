import { Link } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo, memo } from "react";

const DEFAULT_PG_ROOM_IMAGES = [
  "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80",
];

const FadingImage = memo(({ imagesStr, pgId = 0 }) => {
  const parseImages = useCallback((str) => {
    if (!str) return [];
    if (Array.isArray(str)) return str.filter(Boolean);
    try {
      const res = JSON.parse(str);
      return Array.isArray(res) ? res.filter(Boolean) : [];
    } catch { return []; }
  }, []);

  const list = useMemo(() => {
    const parsed = parseImages(imagesStr);
    if (parsed.length > 1) return parsed;
    if (parsed.length === 1) return [parsed[0], ...DEFAULT_PG_ROOM_IMAGES.filter(img => img !== parsed[0])];
    return DEFAULT_PG_ROOM_IMAGES;
  }, [imagesStr, parseImages, pgId]);

  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (list.length <= 1) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(prev => (prev + 1) % list.length);
        setVisible(true);
      }, 500);
    }, 5000);
    return () => clearInterval(interval);
  }, [list]);

  const src = list[idx] || DEFAULT_PG_ROOM_IMAGES[0];

  return (
    <div className="w-full h-full relative bg-gray-900 overflow-hidden">
      <img
        src={src}
        alt="PG Accommodation"
        className={`w-full h-full object-cover transition-all duration-700 ease-in-out transform ${
          visible ? "opacity-100 scale-100" : "opacity-0 scale-105"
        }`}
        loading="lazy"
        onError={(e) => {
          e.currentTarget.src = DEFAULT_PG_ROOM_IMAGES[pgId % DEFAULT_PG_ROOM_IMAGES.length];
        }}
      />
    </div>
  );
});
FadingImage.displayName = "FadingImage";

const DEFAULT_MOCK_PGS = [
  {
    id: 101,
    pg_name: "Stanza Living - Sector 62",
    pg_type: "BOYS",
    area: "Sector 62",
    city: "Noida",
    price: "4000.00",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80"
    ]),
    is_sponsored: true
  },
  {
    id: 102,
    pg_name: "Zolo Stays - Knowledge Park",
    pg_type: "GIRLS",
    area: "Knowledge Park",
    city: "Greater Noida",
    price: "7406.00",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80"
    ]),
    is_sponsored: true
  },
  {
    id: 103,
    pg_name: "CoHo Luxury Co-Living",
    pg_type: "BOYS",
    area: "Sector 125",
    city: "Noida",
    price: "10524.80",
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80"
    ]),
    is_sponsored: true
  }
];

const SlidingPgPageSidebar = memo(({ pgList }) => {
  const [page, setPage] = useState(0);
  const [animating, setAnimating] = useState(false);

  const sponsoredPgs = useMemo(() => {
    let source = [];
    if (pgList && Array.isArray(pgList) && pgList.length > 0) {
      const filtered = pgList.filter(p => p.is_sponsored || p.is_featured || p.sponsored || p.featured);
      source = filtered.length > 0 ? filtered : pgList;
    }
    if (!source || source.length === 0) {
      source = DEFAULT_MOCK_PGS;
    }
    return [...source].sort((a, b) => {
      const hashA = (Number(a.id || 0) * 9301 + 49297) % 233280;
      const hashB = (Number(b.id || 0) * 9301 + 49297) % 233280;
      return hashA - hashB;
    });
  }, [pgList]);

  const pages = useMemo(() => {
    if (!sponsoredPgs || sponsoredPgs.length === 0) return [];
    const list = [...sponsoredPgs];
    const res = [];
    for (let i = 0; i < list.length; i += 5) {
      res.push(list.slice(i, i + 5));
    }
    return res;
  }, [sponsoredPgs]);

  useEffect(() => {
    if (pages.length <= 1) return;
    const interval = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setPage((prev) => (prev + 1) % pages.length);
        setAnimating(false);
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, [pages]);

  const currentChunk = pages[page] || sponsoredPgs.slice(0, 5);

  return (
    <div className="flex flex-col w-full shrink-0 space-y-4 sticky top-20">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-gray-400 dark:text-gray-400">
          FEATURED ACCOMMODATIONS
        </h3>
        {pages.length > 1 && (
          <span className="text-xs font-bold text-[#93B733] bg-[#0D3A1D]/10 dark:bg-white/10 px-2.5 py-1 rounded-full border border-[#93B733]/30">
            Page {page + 1} of {pages.length}
          </span>
        )}
      </div>

      <div className="rounded-[2rem] border border-gray-100 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] p-3.5 shadow-sm overflow-hidden relative">
        <div
          className={`flex flex-col gap-3.5 transition-all duration-500 ease-in-out ${
            animating ? "opacity-0 scale-[0.98]" : "opacity-100 scale-100"
          }`}
        >
          {currentChunk.map((pg, idx) => (
            <Link
              key={`side-pg-${pg.id}-${idx}`}
              to={`/pg/${pg.id}`}
              className="h-40 sm:h-44 shrink-0 rounded-2xl overflow-hidden relative shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md hover:scale-[1.01] transition-all duration-300 block group"
            >
              <FadingImage imagesStr={pg.images} pgId={pg.id || idx} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex flex-col justify-between p-3.5 text-white">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#93B733] bg-black/75 px-3 py-1 rounded-lg backdrop-blur-sm border border-[#93B733]/40 shadow-sm">
                    {pg.pg_type}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300 bg-amber-950/80 px-3 py-1 rounded-lg backdrop-blur-sm border border-amber-400/50 shadow-sm flex items-center gap-1">
                    ★ TOP RATED
                  </span>
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black truncate leading-tight group-hover:text-[#93B733] transition-colors">
                    {pg.pg_name}
                  </h4>
                  <p className="text-xs font-semibold text-gray-200 mt-1 truncate">
                    {pg.area}, {pg.city} • <span className="font-bold text-[#93B733]">₹{pg.price}/mo</span>
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
});
SlidingPgPageSidebar.displayName = "SlidingPgPageSidebar";

export const MobileSponsoredSlider = memo(({ pgList }) => {
  const [idx, setIdx] = useState(0);
  const [animating, setAnimating] = useState(false);

  const sponsoredPgs = useMemo(() => {
    let source = [];
    if (pgList && Array.isArray(pgList) && pgList.length > 0) {
      const filtered = pgList.filter(p => p.is_sponsored || p.is_featured || p.sponsored || p.featured);
      source = filtered.length > 0 ? filtered : pgList;
    }
    if (!source || source.length === 0) {
      source = DEFAULT_MOCK_PGS;
    }
    return [...source].sort((a, b) => {
      const hashA = (Number(a.id || 0) * 9301 + 49297) % 233280;
      const hashB = (Number(b.id || 0) * 9301 + 49297) % 233280;
      return hashA - hashB;
    });
  }, [pgList]);

  useEffect(() => {
    if (sponsoredPgs.length <= 1) return;
    const interval = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setIdx((prev) => (prev + 1) % sponsoredPgs.length);
        setAnimating(false);
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, [sponsoredPgs]);

  const pg = sponsoredPgs[idx] || DEFAULT_MOCK_PGS[0];
  if (!pg) return null;

  return (
    <div className="w-full rounded-[2rem] border border-gray-100 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] p-3.5 shadow-sm overflow-hidden mb-6">
      <div className="flex items-center justify-between px-2 mb-3">
        <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
          FEATURED ACCOMMODATIONS
        </h3>
      </div>
      <Link
        to={`/pg/${pg.id}`}
        className={`block h-48 sm:h-56 shrink-0 rounded-2xl overflow-hidden relative shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md hover:scale-[1.01] transition-all duration-500 ease-in-out group ${animating ? "opacity-0 scale-[0.98]" : "opacity-100 scale-100"}`}
      >
        <FadingImage imagesStr={pg.images} pgId={pg.id || idx} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex flex-col justify-between p-4 sm:p-5 text-white">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#93B733] bg-black/75 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-[#93B733]/40 shadow-sm">
              {pg.pg_type}
            </span>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-300 bg-amber-950/80 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-amber-400/50 shadow-sm flex items-center gap-1">
              ★ TOP RATED
            </span>
          </div>
          <div>
            <h4 className="text-base sm:text-lg font-black truncate leading-tight group-hover:text-[#93B733] transition-colors drop-shadow-md">
              {pg.pg_name}
            </h4>
            <p className="text-xs sm:text-sm font-semibold text-gray-200 mt-1 truncate drop-shadow-md">
              {pg.area}, {pg.city} • <span className="font-bold text-[#93B733]">₹{pg.price}/mo</span>
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
});
MobileSponsoredSlider.displayName = "MobileSponsoredSlider";

export default SlidingPgPageSidebar;
