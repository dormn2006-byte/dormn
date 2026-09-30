import { useState, useRef, memo } from "react";
import { Link } from "react-router-dom";
import { IMAGE_BASE_URL } from "../../services/api";
import { getPgFoodPreference } from "../../utils/amenities";

const PGCard = ({ pg }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const scrollRef = useRef(null);

  if (!pg) return null;

  const defaultImages = [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=600&auto=format&fit=crop"
  ];
  const fallbackImg = defaultImages[(pg?.id || 0) % defaultImages.length];

  // Helper to extract image list
  const getImages = () => {
    const list = [];
    if (pg?.profile_image) {
      list.push(`${IMAGE_BASE_URL}/uploads/${pg.profile_image}`);
    } else if (pg?.image) {
      list.push(pg.image.startsWith("http") ? pg.image : `${IMAGE_BASE_URL}/uploads/${pg.image}`);
    }
    
    let galleryArr = [];
    if (pg?.gallery) {
      try {
        galleryArr = typeof pg.gallery === "string" ? JSON.parse(pg.gallery) : pg.gallery;
      } catch {
        galleryArr = [];
      }
    } else if (Array.isArray(pg?.images)) {
      galleryArr = pg.images;
    }

    if (Array.isArray(galleryArr)) {
      galleryArr.forEach(img => {
        if (img) {
          const url = img.startsWith("http") ? img : `${IMAGE_BASE_URL}/uploads/${img}`;
          if (!list.includes(url)) list.push(url);
        }
      });
    }

    if (list.length === 0) {
      list.push(fallbackImg);
    }
    return list;
  };

  const images = getImages();

  const location = [pg?.area, pg?.city].filter(Boolean).join(", ");

  // Handler for direct Share & Copy
  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/pg/${pg.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${pg.title} | Dormn`,
          text: `Check out ${pg.title} on Dormn: ${shareUrl}`,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') console.error(err);
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  // Handler for the Heart Icon
  const handleSaveToggle = async (e) => {
    e.preventDefault(); // Prevents clicking the heart from opening the link
    e.stopPropagation();

    const previousState = isSaved;
    setIsSaved(!isSaved);

    try {
      const response = await api.post("/pg/save", { pgId: pg.id });
      setIsSaved(response.data.isSaved);
    } catch (error) {
      setIsSaved(previousState);
      console.error("Failed to toggle save status:", error);
    }
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const width = scrollRef.current.offsetWidth;
    if (width > 0) {
      const index = Math.round(scrollRef.current.scrollLeft / width);
      setActiveImgIndex(index);
    }
  };

  const scrollToSlide = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      scrollRef.current.scrollTo({ left: width * index, behavior: "smooth" });
    }
  };
  
  const spotsLeft = pg?.spots_left !== undefined ? Number(pg.spots_left) : Number(pg?.available_rooms || 0);

  const food = getPgFoodPreference(pg);

  return (
    <Link to={`/pg/${pg.id}`} className="group flex flex-col cursor-pointer">
      {/* Image Container with smooth slidable carousel */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[20/19] overflow-hidden rounded-2xl bg-gray-200 dark:bg-gray-800 mb-2 sm:mb-3 group/card">
        
        {/* Horizontal scroll carousel */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex h-full w-full overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth [-webkit-overflow-scrolling:touch]"
        >
          {images.map((imgSrc, idx) => (
            <div key={idx} className="relative w-full h-full flex-shrink-0 snap-start">
              <img
                src={imgSrc}
                alt={`${pg.title} ${idx + 1}`}
                width={400}
                height={256}
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = fallbackImg;
                }}
                className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                  spotsLeft === 0 ? "opacity-75 grayscale-[20%]" : "opacity-100"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Action Controls (Top Right: Share & Favorite) */}
        <div className="absolute right-2 sm:right-3 top-2 sm:top-3 flex items-center gap-1 sm:gap-1.5 z-10">
          <button 
            onClick={handleShare} 
            type="button"
            aria-label="Share PG link"
            title={copied ? "Link Copied!" : "Share PG"}
            className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white transition-all hover:scale-110 active:scale-95 cursor-pointer shadow-sm"
          >
            {copied ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#93B733" strokeWidth="2.5" className="w-3.5 h-3.5 sm:w-4 sm:h-4"><polyline points="20 6 9 17 4 12"></polyline></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 sm:w-4 sm:h-4"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            )}
          </button>

          <button 
            onClick={handleSaveToggle} 
            type="button"
            aria-label={isSaved ? "Remove from saved" : "Save this PG"}
            className="p-1 transition-transform hover:scale-110 active:scale-95 cursor-pointer"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill={isSaved ? "#f43f5e" : "rgba(0, 0, 0, 0.4)"} 
              stroke={isSaved ? "#f43f5e" : "white"} 
              strokeWidth="1.5" 
              className="w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-300"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
        </div>

        {/* Badge (Top Left) */}
        <div className="absolute left-1.5 sm:left-3 top-1.5 sm:top-3 flex flex-wrap items-center gap-1 z-10 max-w-[85%] pointer-events-none">
          <span className="rounded-full bg-white/95 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[8.5px] sm:text-[11px] font-bold text-gray-900 shadow-xs backdrop-blur-md">
            {pg.pg_type || pg.type || "PG"}
          </span>
          {food.type === "Veg" ? (
            <span className="rounded-full bg-white/95 px-1.5 py-0.5 sm:px-2 sm:py-1 text-[8px] sm:text-[10px] font-bold text-emerald-700 shadow-xs backdrop-blur-md flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span>Veg</span>
            </span>
          ) : (
            <span className="rounded-full bg-white/95 px-1.5 py-0.5 sm:px-2 sm:py-1 text-[8px] sm:text-[10px] font-bold text-amber-900 shadow-xs backdrop-blur-md flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-700 shrink-0"></span>
              <span>Non-Veg</span>
            </span>
          )}
          {spotsLeft === 0 && (
            <span className="rounded-full bg-rose-600/90 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 text-[7.5px] sm:text-[10px] font-black uppercase tracking-wider shadow-xs backdrop-blur-md">
              Sold Out
            </span>
          )}
        </div>

        {/* Slide Dots Indicator */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 z-10 flex justify-center gap-1.5 pointer-events-none">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => scrollToSlide(e, idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`pointer-events-auto h-1.5 rounded-full transition-all duration-300 ${
                  activeImgIndex === idx 
                    ? "w-4 bg-white shadow-sm" 
                    : "w-1.5 bg-white/60 hover:bg-white/90"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content Section (Below Image) */}
      <div className="flex flex-col gap-0.5 px-0.5 sm:px-1">
        
        {/* Title and Rating Row */}
        <div className="flex items-start justify-between gap-1.5">
          <h3 className="font-semibold text-gray-900 text-xs sm:text-[15px] leading-tight truncate">
            {pg.title}
          </h3>
          <div className="flex items-center gap-0.5 text-xs sm:text-[14px] text-gray-900 font-medium flex-shrink-0">
            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 pb-[1px]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
            <span>4.8</span>
          </div>
        </div>

        {/* Location */}
        <p className="text-xs sm:text-[14px] text-gray-600 truncate">
          {location || "Location not available"}
        </p>

        {/* Price & Spots Left Row */}
        <div className="mt-0.5 sm:mt-1 flex items-center justify-between gap-1 text-xs sm:text-[15px] text-gray-900 dark:text-gray-100">
          <div className="flex items-center gap-0.5 sm:gap-1">
            <span className="font-semibold">₹{Number(pg.price || 0).toLocaleString()}</span>
            <span className="font-normal text-gray-600 dark:text-gray-400 text-[10px] sm:text-xs">/ mo</span>
          </div>
          <span className={`text-[10px] sm:text-xs font-black flex-shrink-0 ${
            spotsLeft === 0 
              ? "text-rose-500" 
              : spotsLeft <= 3 
              ? "text-amber-600 dark:text-amber-400" 
              : "text-[#4E700F] dark:text-[#93B733]"
          }`}>
            {spotsLeft === 0 ? "Sold Out" : `${spotsLeft} spots left`}
          </span>
        </div>
        
      </div>
    </Link>
  );
};

export { PGCard };
export default memo(PGCard);
