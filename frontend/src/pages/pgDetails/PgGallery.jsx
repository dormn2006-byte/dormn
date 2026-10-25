import { memo } from "react";
import { ShieldCheck, ChevronLeft, ChevronRight, Play } from "lucide-react";

export const DEFAULT_DETAILS_FALLBACKS = [
  "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80",
];

const PgGallery = ({
  mediaItems = [],
  currentActiveIndex = 0,
  setActiveImageIndex,
  mainImageLoaded,
  setMainImageLoaded,
  displayActiveImage,
  activeMedia,
  showPreviousImage,
  showNextImage,
  isGalleryLoopPaused,
  setIsGalleryLoopPaused,
}) => {
  const mediaCount = mediaItems.length;

  return (
    <div className="rounded-xl sm:rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0d0d0d] p-1 sm:p-2 md:rounded-[2.5rem] md:p-3 shadow-sm">
      <div className="relative overflow-hidden rounded-lg sm:rounded-[1.5rem] md:rounded-[2rem] bg-gray-200 dark:bg-gray-800">
        {/* Dormn Verified PG Badge - Top Left */}
        <div className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 z-20 flex items-center gap-1 sm:gap-1.5 rounded-full bg-[#0D3A1D]/90 dark:bg-black/85 backdrop-blur-md px-2.5 py-1 sm:px-3.5 sm:py-1.5 border border-[#93B733]/50 shadow-md">
          <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#93B733] shrink-0" />
          <span className="text-[9.5px] sm:text-xs font-black tracking-wide text-white uppercase">
            Dormn Verified PG
          </span>
        </div>

        {/* Backside Shimmer Skeleton */}
        {!mainImageLoaded && activeMedia?.type === "image" && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse z-0" />
        )}

        {activeMedia?.type === "video" ? (
          <div className="relative h-[190px] sm:h-[360px] md:h-[480px] w-full bg-black flex items-center justify-center">
            <video
              key={activeMedia.url}
              src={activeMedia.url}
              poster={activeMedia.poster}
              controls
              playsInline
              className="h-full w-full object-contain"
            />
            <div className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[10px] sm:text-xs font-bold border border-white/20">
              <Play className="w-3 h-3 fill-current text-[#93B733]" />
              <span>PG Video Tour</span>
            </div>
          </div>
        ) : (
          <img
            src={displayActiveImage}
            alt="PG"
            onLoad={() => setMainImageLoaded(true)}
            className={`h-[190px] sm:h-[360px] md:h-[480px] w-full object-cover transition-all duration-700 hover:scale-105 ${
              mainImageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onError={(e) => {
              e.currentTarget.src = DEFAULT_DETAILS_FALLBACKS[0];
              setMainImageLoaded(true);
            }}
          />
        )}

        {mediaCount > 1 && (
          <>
            <button
              type="button"
              onClick={showPreviousImage}
              aria-label="Previous Media"
              className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-gray-800 shadow-md transition-all hover:bg-white hover:scale-110 active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5 sm:h-5 sm:w-5 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={showNextImage}
              aria-label="Next Media"
              className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-gray-800 shadow-md transition-all hover:bg-white hover:scale-110 active:scale-95 cursor-pointer"
            >
              <ChevronRight className="h-3.5 w-3.5 sm:h-5 sm:w-5 stroke-[2.5]" />
            </button>

            <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 z-20 rounded-full bg-black/70 backdrop-blur-sm px-2 py-0.5 sm:px-3 sm:py-1 text-[9px] sm:text-xs font-semibold text-white">
              {currentActiveIndex + 1} / {mediaCount}
            </div>
          </>
        )}
      </div>

      {/* Single Section Thumbnail Strip */}
      {mediaCount <= 4 ? (
        <div className="mt-1 sm:mt-2 md:mt-3 grid grid-cols-4 gap-1 sm:gap-2 md:gap-3">
          {mediaItems.map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActiveImageIndex(index)}
              className={`relative overflow-hidden rounded-md sm:rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                currentActiveIndex === index
                  ? "border-[#93B733] shadow-md opacity-100 ring-2 ring-[#93B733]/40 scale-[1.02]"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img
                src={item.type === "video" ? (item.poster || DEFAULT_DETAILS_FALLBACKS[0]) : item.url}
                alt={`preview ${index + 1}`}
                loading="lazy"
                decoding="async"
                className="h-10 w-full object-cover sm:h-20 md:h-24 pointer-events-none"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_DETAILS_FALLBACKS[index % DEFAULT_DETAILS_FALLBACKS.length];
                }}
              />
              {item.type === "video" && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white pointer-events-none">
                  <Play className="w-3.5 h-3.5 sm:w-5 sm:h-5 fill-white text-white drop-shadow" />
                </span>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div 
          className="thumbnail-marquee-container mt-1 sm:mt-2 md:mt-3 overflow-hidden rounded-md sm:rounded-xl"
          onMouseEnter={() => setIsGalleryLoopPaused(true)}
          onMouseLeave={() => setIsGalleryLoopPaused(false)}
          onTouchStart={() => setIsGalleryLoopPaused(true)}
          onTouchEnd={() => setIsGalleryLoopPaused(false)}
        >
          <div 
            className="thumbnail-marquee-track gap-1 sm:gap-2 md:gap-3 py-0.5"
            style={{
              animationPlayState: isGalleryLoopPaused ? "paused" : "running",
              animationDuration: `${Math.max(mediaCount * 2.2, 16)}s`
            }}
          >
            {[...mediaItems, ...mediaItems].map((item, index) => {
              const realIndex = index % mediaCount;
              const isSelected = currentActiveIndex === realIndex;
              return (
                <button
                  key={`${realIndex}-${index >= mediaCount ? 'dup' : 'orig'}`}
                  type="button"
                  onClick={() => setActiveImageIndex(realIndex)}
                  className={`thumbnail-marquee-item relative overflow-hidden rounded-md sm:rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "border-[#93B733] shadow-md opacity-100 ring-2 ring-[#93B733]/40 scale-[1.02]"
                      : "border-transparent opacity-75 hover:opacity-100"
                  }`}
                >
                  <img
                    src={item.type === "video" ? (item.poster || DEFAULT_DETAILS_FALLBACKS[0]) : item.url}
                    alt={`preview ${realIndex + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="h-10 w-full object-cover sm:h-20 md:h-24 pointer-events-none"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_DETAILS_FALLBACKS[realIndex % DEFAULT_DETAILS_FALLBACKS.length];
                    }}
                  />
                  {item.type === "video" && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white pointer-events-none">
                      <Play className="w-3.5 h-3.5 sm:w-5 sm:h-5 fill-white text-white drop-shadow" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(PgGallery);
