import { useState, useEffect, memo } from "react";

const IntroAnimation = memo(({ onComplete }) => {
  const [phase, setPhase] = useState(0);
  const [isLaptop, setIsLaptop] = useState(true);

  useEffect(() => {
    // Check if device is laptop/desktop (width >= 1024px)
    if (window.innerWidth < 1024) {
      setIsLaptop(false);
      onComplete();
      return;
    }

    // 5 second total animation timeline for laptops
    const t1 = setTimeout(() => setPhase(1), 100);   // 0.1s: Logo fade in at center
    const t2 = setTimeout(() => setPhase(2), 1600);  // 1.6s: Logo slides left, text appears
    const t3 = setTimeout(() => setPhase(3), 4200);  // 4.2s: Fade out overlay
    const t4 = setTimeout(onComplete, 5000);         // 5.0s: Remove from DOM
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  if (!isLaptop) return null;

  return (
    <div
      className={`hidden lg:flex fixed inset-0 z-[9999] items-center justify-center bg-white dark:bg-[#000000] transition-opacity duration-700 ${phase >= 3 ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      aria-hidden="true"
    >
      <div className="flex items-center gap-6 lg:gap-8">
        {/* Logo */}
        <img
          src="/logo-sm.webp"
          alt="Dorm Nexus Logo"
          className="h-32 w-32 lg:h-40 lg:w-40 xl:h-44 xl:w-44 object-contain transition-all duration-1000 ease-out"
          style={{
            opacity: phase >= 1 ? 1 : 0,
            transform: phase >= 2 ? "translateX(0)" : phase >= 1 ? "translateX(80px)" : "translateX(80px) scale(0.85)",
            imageRendering: "high-quality",
          }}
        />
        {/* Text Block */}
        <div
          className="flex flex-col transition-all duration-1000 ease-out overflow-hidden"
          style={{
            opacity: phase >= 2 ? 1 : 0,
            transform: phase >= 2 ? "translateX(0)" : "translateX(40px)",
          }}
        >
          <h1 className="text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight text-[#0D3A1D] dark:text-white leading-none">
            Dorm Nexus
          </h1>
          <p
            className="text-sm lg:text-base xl:text-lg font-extrabold uppercase tracking-[0.2em] text-[#4E700F] leading-none transition-all duration-700 ease-out"
            style={{
              opacity: phase >= 2 ? 1 : 0,
              transform: phase >= 2 ? "translateY(0)" : "translateY(18px)",
              transitionDelay: "300ms",
              marginTop: "8px",
            }}
          >
            Next Gen Housing
          </p>
        </div>
      </div>
    </div>
  );
});

IntroAnimation.displayName = "IntroAnimation";
export default IntroAnimation;
