import { useState, useEffect, useCallback } from "react";
import { m, AnimatePresence, LazyMotion, domAnimation, useReducedMotion } from "framer-motion";
import { SquareArrowOutUpRight, Star } from "lucide-react";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function wrapIndex(n, len) {
  if (len <= 0) return 0;
  return ((n % len) + len) % len;
}

function signedOffset(i, active, len, loop) {
  const raw = i - active;
  if (!loop || len <= 1) return raw;

  // consider wrapped alternative
  const alt = raw > 0 ? raw - len : raw + len;
  return Math.abs(alt) < Math.abs(raw) ? alt : raw;
}

export function CardStack({
  items,
  initialIndex = 0,
  maxVisible = 7,

  cardWidth = 520,
  cardHeight = 320,

  overlap = 0.48,
  spreadDeg = 48,

  perspectivePx = 1100,
  depthPx = 140,
  tiltXDeg = 12,

  activeLiftPx = 22,
  activeScale = 1.03,
  inactiveScale = 0.94,

  springStiffness = 280,
  springDamping = 28,

  loop = true,
  autoAdvance = false,
  intervalMs = 2800,
  pauseOnHover = true,

  showDots = true,
  className,

  onChangeIndex,
  renderCard,
}) {
  const reduceMotion = useReducedMotion();
  const len = items.length;

  const [active, setActive] = useState(() => wrapIndex(initialIndex, len));
  const [hovering, setHovering] = useState(false);

  const [prevLen, setPrevLen] = useState(len);
  if (len !== prevLen) {
    setPrevLen(len);
    setActive((a) => wrapIndex(a, len));
  }

  useEffect(() => {
    if (!len) return;
    onChangeIndex?.(active, items[active]);
  }, [active, len, onChangeIndex, items]);

  const maxOffset = Math.max(0, Math.floor(maxVisible / 2));

  const cardSpacing = Math.max(10, Math.round(cardWidth * (1 - overlap)));
  const stepDeg = maxOffset > 0 ? spreadDeg / maxOffset : 0;

  const canGoPrev = loop || active > 0;
  const canGoNext = loop || active < len - 1;

  const prev = useCallback(() => {
    if (!len) return;
    if (!canGoPrev) return;
    setActive((a) => wrapIndex(a - 1, len));
  }, [canGoPrev, len]);

  const next = useCallback(() => {
    if (!len) return;
    if (!canGoNext) return;
    setActive((a) => wrapIndex(a + 1, len));
  }, [canGoNext, len]);

  // keyboard navigation (when container focused)
  const onKeyDown = (e) => {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  };

  // autoplay
  useEffect(() => {
    if (!autoAdvance) return;
    if (reduceMotion) return;
    if (!len) return;
    if (pauseOnHover && hovering) return;

    const id = window.setInterval(() => {
      if (loop || active < len - 1) next();
    }, Math.max(700, intervalMs));

    return () => window.clearInterval(id);
  }, [
    autoAdvance,
    intervalMs,
    hovering,
    pauseOnHover,
    reduceMotion,
    len,
    loop,
    active,
    next,
  ]);

  if (!len) return null;

  const activeItem = items[active];

  return (
    <div
      className={cn("w-full", className)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Stage */}
      <div
        className="relative w-full"
        style={{ height: Math.max(380, cardHeight + 80) }}
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        <div
          className="absolute inset-0 flex items-end justify-center"
          style={{
            perspective: `${perspectivePx}px`,
          }}
        >
          <LazyMotion features={domAnimation}>
          <AnimatePresence initial={false}>
            {items.map((item, i) => {
              const off = signedOffset(i, active, len, loop);
              const abs = Math.abs(off);
              const visible = abs <= maxOffset;

              // hide far-away cards cleanly
              if (!visible) return null;

              // fan geometry
              const rotateZ = off * stepDeg;
              const x = off * cardSpacing;
              const y = abs * 10; // subtle arc-down feel
              const z = -abs * depthPx;

              const isActive = off === 0;

              const scale = isActive ? activeScale : inactiveScale;
              const lift = isActive ? -activeLiftPx : 0;

              const rotateX = isActive ? 0 : tiltXDeg;

              const zIndex = 100 - abs;

              // drag only on the active card
              const dragProps = isActive
                ? {
                    drag: "x",
                    dragConstraints: { left: 0, right: 0 },
                    dragElastic: 0.18,
                    onDragEnd: (_e, info) => {
                      if (reduceMotion) return;
                      const travel = info.offset.x;
                      const v = info.velocity.x;
                      const threshold = Math.min(160, cardWidth * 0.22);

                      // swipe logic
                      if (travel > threshold || v > 650) prev();
                      else if (travel < -threshold || v < -650) next();
                    },
                  }
                : {};

              return (
                <m.div
                  key={item.id}
                  className={cn(
                    "absolute bottom-0 rounded-3xl border border-gray-100 bg-white overflow-hidden shadow-2xl",
                    "will-change-transform select-none",
                    isActive
                      ? "cursor-grab active:cursor-grabbing"
                      : "cursor-pointer"
                  )}
                  style={{
                    width: cardWidth,
                    height: cardHeight,
                    zIndex,
                    transformStyle: "preserve-3d",
                  }}
                  initial={
                    reduceMotion
                      ? false
                      : {
                          opacity: 0,
                          y: y + 40,
                          x,
                          rotateZ,
                          rotateX,
                          scale,
                        }
                  }
                  animate={{
                    opacity: 1,
                    x,
                    y: y + lift,
                    rotateZ,
                    rotateX,
                    scale,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: springStiffness,
                    damping: springDamping,
                  }}
                  onClick={() => setActive(i)}
                  {...dragProps}
                >
                  <div
                    className="h-full w-full bg-white"
                    style={{
                      transform: `translateZ(${z}px)`,
                      transformStyle: "preserve-3d",
                    }}
                  >
                    {renderCard ? (
                      renderCard(item, { active: isActive })
                    ) : (
                      <DefaultFanCard item={item} active={isActive} />
                    )}
                  </div>
                </m.div>
              );
            })}
          </AnimatePresence>
          </LazyMotion>
        </div>
      </div>

      {/* Dots navigation centered at bottom */}
      {showDots ? (
        <div className="mt-6 flex items-center justify-center gap-3">
          <div className="flex items-center gap-2">
            {items.map((it, idx) => {
              const on = idx === active;
              return (
                <button
                  key={it.id}
                  onClick={() => setActive(idx)}
                  className={cn(
                    "h-2.5 w-2.5 rounded-full transition-all duration-300",
                    on
                      ? "bg-[#93B733] scale-125"
                      : "bg-[#93B733]/30 hover:bg-[#93B733]/50"
                  )}
                  aria-label={`Go to review ${idx + 1}`}
                />
              );
            })}
          </div>
          {activeItem.href ? (
            <a
              href={activeItem.href}
              target="_blank"
              rel="noreferrer"
              className="text-gray-400 hover:text-[#93B733] transition ml-2"
              aria-label="Open link"
            >
              <SquareArrowOutUpRight className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// 🚀 THIS IS THE COMPLETELY REWRITTEN CARD UI
function DefaultFanCard({ item, active }) {
  // Ensure we have a valid rating (fallback to 5 if undefined)
  const rating = item.rating || 5;


  return (
    <div className="relative flex h-full w-full flex-col justify-between rounded-3xl bg-white p-6 sm:p-8">
      
      {/* Top Row: Dynamic Stars & Badges */}
      <div className="flex items-center justify-between mb-4 z-10">
        
        {/* Dynamic Stars */}
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                "h-4 w-4 sm:h-5 sm:w-5 transition-colors",
                star <= rating
                  ? "fill-[#93B733] text-[#93B733]" // Colored star
                  : "fill-gray-100 text-gray-200"   // Empty star
              )}
            />
          ))}
        </div>

        {/* Dynamic Badges based on Score */}
        {rating === 5 && (
          <span className="px-3 py-1 text-[10px] sm:text-xs font-black uppercase tracking-wider text-green-700 bg-green-100 border border-green-200 rounded-full shadow-sm">
            Exceptional 🌟
          </span>
        )}
        {rating === 4 && (
          <span className="px-3 py-1 text-[10px] sm:text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-100 border border-blue-200 rounded-full shadow-sm">
            Great Stay ✨
          </span>
        )}
        {rating === 3 && (
          <span className="px-3 py-1 text-[10px] sm:text-xs font-black uppercase tracking-wider text-yellow-700 bg-yellow-100 border border-yellow-200 rounded-full shadow-sm">
            Average 😐
          </span>
        )}
        {rating <= 2 && (
          <span className="px-3 py-1 text-[10px] sm:text-xs font-black uppercase tracking-wider text-red-700 bg-red-100 border border-red-200 rounded-full shadow-sm">
            Needs Work 🚩
          </span>
        )}
      </div>

      {/* Middle: Review Description */}
      <div className="flex-grow z-10">
        {item.description ? (
          <p className="text-sm sm:text-base font-medium text-gray-700 line-clamp-4 leading-relaxed italic">
            "{item.description}"
          </p>
        ) : (
          <p className="text-sm font-medium text-gray-400 italic">
            No description provided by user.
          </p>
        )}
      </div>

      {/* Bottom: User Info (Verified from Database) */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3.5 z-10">
        {item.imageSrc ? (
          <img
            src={item.imageSrc}
            alt={item.title}
            width={44}
            height={44}
            className="h-11 w-11 rounded-full object-cover shadow-sm border-2 border-white"
            draggable={false}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#93B733]/15 text-lg font-black text-[#0D3A1D]">
            {item.title ? item.title.charAt(0).toUpperCase() : "U"}
          </div>
        )}
        
        <div className="flex flex-col">
          <h3 className="text-sm font-black text-[#0D3A1D] leading-tight">
            {item.title || "Verified User"}
          </h3>
          {item.tag && (
            <span className="text-xs font-semibold text-gray-500 mt-0.5">
              {item.tag}
            </span>
          )}
        </div>
      </div>

      {/* Giant Decorative Background Quote Mark */}
      {item.description && (
        <div className="absolute bottom-12 right-6 text-8xl text-gray-50 opacity-70 font-serif leading-none select-none pointer-events-none">
          "
        </div>
      )}
    </div>
  );
}