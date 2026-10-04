import { useEffect, useMemo, useState, memo } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck } from "lucide-react";
import { IMAGE_BASE_URL } from "../../services/api";

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80",
];

const HERO_PAGE_SIZE = 4;
const ROTATE_MS = 5000;

const imageFor = (pg, index = 0) => {
  const raw = pg?.profile_image || pg?.image;
  if (!raw) return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
  return raw.startsWith("http") ? raw : `${IMAGE_BASE_URL}/uploads/${raw}`;
};

const SponsoredCard = memo(({ pg, index, className = "" }) => (
  <Link
    to={`/pg/${pg.id}`}
    className={`group relative block aspect-square overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-900 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${className}`}
  >
    <img
      src={imageFor(pg, index)}
      alt={pg.title || "Sponsored PG"}
      loading="lazy"
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      onError={(e) => {
        e.currentTarget.src = FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
      }}
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />

    <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-lg border border-[#93B733]/50 bg-black/75 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#93B733] backdrop-blur-sm sm:text-[10px]">
      <BadgeCheck size={11} />
      Sponsored
    </span>

    <div className="absolute inset-x-0 bottom-0 p-3 text-white">
      <h4 className="truncate text-sm font-black leading-tight sm:text-base group-hover:text-[#bbf246] transition-colors">
        {pg.title || "PG"}
      </h4>
      <p className="mt-0.5 truncate text-[11px] font-semibold text-gray-200 sm:text-xs">
        {[pg.area, pg.city].filter(Boolean).join(", ")}
        {pg.price ? (
          <>
            {" • "}
            <span className="font-bold text-[#93B733]">₹{Number(pg.price).toLocaleString()}/mo</span>
          </>
        ) : null}
      </p>
    </div>
  </Link>
));
SponsoredCard.displayName = "SponsoredCard";

const SectionHeading = ({ count }) => (
  <div className="mb-3 flex items-center justify-between px-1">
    <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 sm:text-sm">
      Sponsored
    </h3>
    {count > 0 && (
      <span className="rounded-full border border-[#93B733]/30 bg-[#0D3A1D]/10 px-2.5 py-1 text-[10px] font-bold text-[#93B733] dark:bg-white/10">
        {count} listing{count === 1 ? "" : "s"}
      </span>
    )}
  </div>
);

/**
 * Renders the paid sponsored PGs.
 *  - variant="hero": vertical "5 per page" slider for the Home hero right column.
 *  - variant="grid": compact card grid for the Explore discover view.
 * Returns null when there are no sponsored PGs so callers can fall back cleanly.
 */
const SponsoredShowcase = ({ sponsoredPGs = [], variant = "hero" }) => {
  const pgs = useMemo(
    () => (Array.isArray(sponsoredPGs) ? sponsoredPGs.filter(Boolean) : []),
    [sponsoredPGs]
  );

  const pages = useMemo(() => {
    if (variant !== "hero") return [];
    const out = [];
    for (let i = 0; i < pgs.length; i += HERO_PAGE_SIZE) {
      out.push(pgs.slice(i, i + HERO_PAGE_SIZE));
    }
    return out;
  }, [pgs, variant]);

  const [page, setPage] = useState(0);

  useEffect(() => {
    if (pages.length <= 1) return;
    const timer = setInterval(() => setPage((prev) => (prev + 1) % pages.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [pages.length]);

  if (!pgs.length) return null;

  const safePage = pages.length ? page % pages.length : 0;

  if (variant === "grid") {
    return (
      <div>
        <SectionHeading count={pgs.length} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {pgs.slice(0, 8).map((pg, index) => (
            <SponsoredCard key={pg.id} pg={pg} index={index} />
          ))}
        </div>
      </div>
    );
  }

  const currentChunk = pages[safePage] || pgs.slice(0, HERO_PAGE_SIZE);

  return (
    <div className="flex w-full flex-col gap-3">
      <SectionHeading count={pgs.length} />
      <div className="grid grid-cols-2 gap-3">
        {currentChunk.map((pg, index) => (
          <SponsoredCard key={pg.id} pg={pg} index={safePage * HERO_PAGE_SIZE + index} />
        ))}
      </div>
      {pages.length > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          {pages.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Sponsored page ${i + 1}`}
              onClick={() => setPage(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === safePage ? "w-5 bg-[#93B733]" : "w-1.5 bg-gray-300 dark:bg-white/20"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default memo(SponsoredShowcase);
