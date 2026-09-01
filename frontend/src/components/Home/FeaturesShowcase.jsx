import { useState, useEffect, memo, useCallback } from "react";
import { featureSlides } from "../../data/homeData";
import { Rocket, ShieldCheck, Smartphone, ChevronLeft, ChevronRight } from "lucide-react";

const iconMap = { instant: Rocket, verified: ShieldCheck, mobile: Smartphone };

const glassCard = "relative flex flex-col overflow-hidden rounded-[2rem] p-6 min-h-[220px] border border-[#93B733]/20 shadow-[0_8px_32px_rgba(13,58,29,0.08),0_2px_8px_rgba(147,183,51,0.06)] backdrop-blur-xl transition-all duration-300";
const glassCardBg = { background: "rgba(147,183,51,0.06)", WebkitBackdropFilter: "blur(16px) saturate(160%)", backdropFilter: "blur(16px) saturate(160%)" };

const FeaturesShowcase = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const id = setInterval(() => setActiveIdx(p => (p + 1) % featureSlides.length), 5000);
    return () => clearInterval(id);
  }, [isMobile]);

  const setSlide = useCallback((idx) => setActiveIdx(idx), []);
  const prevSlide = useCallback(() => setActiveIdx(p => (p === 0 ? featureSlides.length - 1 : p - 1)), []);
  const nextSlide = useCallback(() => setActiveIdx(p => (p + 1) % featureSlides.length), []);

  return (
    <section className="mx-auto max-w-[1440px] 2xl:max-w-[1600px] px-4 sm:px-6 md:px-8 lg:px-10 py-16 sm:py-24 [content-visibility:auto] [contain-intrinsic-size:1px_400px]">
      <div className="mb-10 text-center">
        <h2 className="text-3xl md:text-4xl font-black text-[#0D3A1D] tracking-tight mb-3">
          Why Students <span className="text-[#4E700F]">Love Us</span>
        </h2>
        <p className="text-sm md:text-base text-gray-600 font-medium">
          Everything you need for a safe and hassle-free stay.
        </p>
      </div>

      {isMobile ? (
        <div className="relative mt-4 w-full flex flex-col items-center px-4">
          {/* Left Arrow Button */}
          <button 
            onClick={prevSlide}
            className="absolute left-[-6px] top-[42%] -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200/80 bg-white text-[#93B733] shadow-md active:scale-95 transition-all pointer-events-auto"
            aria-label="Previous Feature"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Carousel Slider */}
          <div className="w-full overflow-hidden rounded-[2rem]">
            <div 
              className="flex transition-transform duration-500 ease-out w-full"
              style={{ transform: `translateX(-${activeIdx * 100}%)` }}
            >
              {featureSlides.map((feature, i) => {
                const Icon = iconMap[feature.icon] || Rocket;
                return (
                  <div key={i} className="w-full flex-shrink-0 px-1">
                    <div className={glassCard} style={glassCardBg}>
                      {/* Dark green shiny ambient glow overlay at top right */}
                      <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-gradient-to-br from-[#0D3A1D]/40 via-[#93B733]/30 to-transparent blur-xl pointer-events-none" />
                      
                      <div className="relative z-10 mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#93B733]/10 border border-[#93B733]/20 text-[#93B733]">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="relative z-10 text-lg font-black text-[#0D3A1D] tracking-tight mb-2">{feature.title}</h3>
                      <p className="relative z-10 text-xs font-medium leading-relaxed text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Arrow Button */}
          <button 
            onClick={nextSlide}
            className="absolute right-[-6px] top-[42%] -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200/80 bg-white text-[#93B733] shadow-md active:scale-95 transition-all pointer-events-auto"
            aria-label="Next Feature"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dots Indicator */}
          <div className="mt-6 flex gap-2">
            {featureSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSlide(idx)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  activeIdx === idx ? "w-6 bg-[#93B733]" : "w-2.5 bg-gray-200"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featureSlides.map((feature, i) => {
            const Icon = iconMap[feature.icon] || Rocket;
            return (
              <div
                key={i}
                className={`${glassCard} group hover:border-[#93B733]/40 hover:shadow-[0_12px_40px_rgba(13,58,29,0.12),0_4px_16px_rgba(147,183,51,0.1)] hover:-translate-y-1`}
                style={glassCardBg}
              >
                {/* Dark green shiny ambient glow overlay at top right */}
                <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-gradient-to-br from-[#0D3A1D]/40 via-[#93B733]/30 to-transparent blur-xl pointer-events-none transition-transform duration-500 group-hover:scale-125" />
                
                <div className="relative z-10 mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#93B733]/10 border border-[#93B733]/25 text-[#4E700F] dark:text-[#93B733] transition-all duration-300 group-hover:scale-110 group-hover:border-[#93B733]/50 shadow-xs">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="relative z-10 text-lg font-black text-[#0D3A1D] dark:text-white tracking-tight mb-2">{feature.title}</h3>
                <p className="relative z-10 text-xs md:text-sm font-medium leading-relaxed text-gray-600 dark:text-gray-300 line-clamp-3">{feature.description}</p>
                <div className="relative z-10 mt-auto pt-6">
                  <div className="h-1 w-8 bg-[#93B733]/20 rounded-full group-hover:bg-[#93B733] group-hover:w-12 transition-all duration-300"></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default memo(FeaturesShowcase);