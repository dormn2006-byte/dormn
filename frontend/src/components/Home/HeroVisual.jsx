import { IMAGE_BASE_URL } from "../../services/api";

const HeroVisual = ({ featuredPG }) => {

  return (
    <div className="relative mx-auto w-full max-w-[360px] select-none pt-6 md:max-w-[480px] md:pt-0 lg:ml-auto">
      
      {/* Zen Glowing Auras Behind the Frame */}
      <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-[#93B733]/15 blur-[2rem] md:h-80 md:w-80"></div>
      <div className="absolute -bottom-10 -left-10 h-64 w-64 rounded-full bg-[#93B733]/15 blur-[2rem] md:h-80 md:w-80"></div>

      {/* Main Physical Frame with White Background & Cursor Hover Green Glow Animation */}
      <div className="group/frame relative z-10 rounded-[2.5rem] border-2 border-white bg-white p-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.1)] transition-all duration-500 ease-in-out hover:scale-[1.02] hover:border-[#93B733] hover:shadow-[0_0_50px_rgba(147,183,51,0.65)] md:rounded-[3rem] md:p-3.5">
        
        {/* Inner Image Container */}
        <div className="group relative h-[380px] w-full overflow-hidden rounded-[2rem] border border-white/50 transition-all duration-500 ease-in-out group-hover/frame:border-[#93B733]/80 md:h-[500px] md:rounded-[2.5rem]">
          
          <img
            src={
              featuredPG?.profile_image
                ? `${IMAGE_BASE_URL}/uploads/${featuredPG.profile_image}`
                : featuredPG?.image || "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=1200&auto=format&fit=crop"
            }
            alt="Luxury Student PG"
            width={400}
            height={500}
            loading="eager"
            fetchPriority="high"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=1200&auto=format&fit=crop";
            }}
            className="block h-full w-full bg-gray-100 object-cover transition-transform duration-1000 group-hover:scale-110"
          />

          {/* Zen Overlay: Soft gradient to ensure text readability & add mood */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0D3A1D]/30 via-transparent to-[#93B733]/20 mix-blend-multiply transition-opacity duration-700 group-hover:opacity-70"></div>
          
          {/* Inner Shadow for depth */}
          <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.1)]"></div>

          {/* --- CARD 1: Verified Stay (Inside, Top Left) --- */}
          <div className="absolute left-3 top-3 flex max-w-[190px] flex-col gap-1.5 rounded-2xl border border-white/50 bg-white/85 p-3.5 shadow-lg backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:scale-105 hover:bg-white/95 sm:left-4 sm:top-4 md:max-w-[220px] md:p-4">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-[#93B733]/15">
                <span className="absolute h-full w-full opacity-30 rounded-full bg-[#93B733]"></span>
                <svg className="h-3.5 w-3.5 text-[#93B733]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#4E700F] md:text-[11px]">
                Verified Stay
              </p>
            </div>
            <p className="mt-0.5 text-sm font-extrabold leading-tight text-[#0D3A1D] md:text-base">
              Trusted Listings
            </p>
            <p className="text-[10px] font-medium leading-relaxed text-gray-600 md:text-[11px]">
              Admin approved spaces.
            </p>
          </div>

          {/* --- CARD 2: Fast Booking (Inside, Middle Right) --- */}
          <div className="absolute right-3 top-28 flex max-w-[160px] flex-col gap-1.5 rounded-2xl border border-white/50 bg-white/85 p-3.5 shadow-lg backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:scale-105 hover:bg-white/95 sm:right-4 sm:top-32 md:max-w-[200px] md:p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-xs border border-gray-100">
                <svg className="h-3.5 w-3.5 text-[#93B733]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#0D3A1D] md:text-[11px]">
                Fast Booking
              </p>
            </div>
            <p className="mt-0.5 text-sm font-extrabold leading-tight text-[#0D3A1D] md:text-base">
              Instant Approval
            </p>
            <p className="text-[10px] font-medium leading-relaxed text-gray-600 md:text-[11px]">
              Direct owner connect.
            </p>
          </div>

          {/* --- CARD 3: Bottom Area Tag (Inside, Bottom Full Width) --- */}
          <div className="absolute bottom-3 left-3 right-3 flex flex-col justify-center rounded-[1.25rem] border border-white/60 bg-white/90 p-3.5 shadow-xl backdrop-blur-lg transition-all duration-500 hover:-translate-y-1 hover:bg-white sm:bottom-4 sm:left-4 sm:right-4 md:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#93B733]/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#93B733]"></span>
                  </span>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-gray-600 md:text-[10px]">
                    Top Trending
                  </p>
                </div>
                <p className="mt-1 line-clamp-1 text-lg font-black text-[#0D3A1D] md:text-xl">
                  {featuredPG?.city || featuredPG?.area || "Prime Location"}
                </p>
              </div>
              
              <div className="flex flex-col items-end gap-1.5 border-l-2 border-gray-200 pl-3 md:pl-4">
                <span className="whitespace-nowrap rounded-lg bg-gray-100 px-2.5 py-1 text-[9px] font-bold text-[#0D3A1D] md:text-[11px]">
                  {featuredPG?.available_rooms || 0}+ Rooms
                </span>
                <span className="whitespace-nowrap rounded-lg bg-[#93B733]/10 px-2.5 py-1 text-[9px] font-bold text-[#4E700F] md:text-[11px]">
                  Premium PG
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default HeroVisual;