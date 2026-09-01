import { Link } from "react-router-dom";
import HeroVisual from "./HeroVisual";
import Container from "../../layouts/Container";

const HeroSection = ({ pgs = [] }) => {
  const featuredPG = pgs.length > 0 ? pgs[0] : null;

  const stats = [
    {
      number: `${pgs.length}+`,
      label: "Verified PGs",
    },
    {
      number: `${Math.max(pgs.length * 5, 20)}+`,
      label: "Students",
    },
    {
      number: `${new Set(pgs.map((pg) => pg.owner_id)).size}+`,
      label: "Owners",
    },
  ];

  return (
    <>


      <section className="relative overflow-hidden bg-[#FAF9F5] px-4 pb-12 pt-6 sm:px-5 sm:pb-16 sm:pt-8 md:px-8 md:pb-20 md:pt-12 lg:px-12">
        <Container className="relative grid items-center gap-12 sm:gap-14 md:gap-16 lg:grid-cols-2">
          
          {/* Left Content */}
          <div className="z-10 mt-4 md:mt-0">
            
            {/* Top Badge - Structured Bento Style */}
            <div className="inline-flex max-w-full items-center gap-2.5 rounded-full border-2 border-gray-200 bg-white px-4 py-2 shadow-sm transition-transform hover:-translate-y-0.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full opacity-40 rounded-full bg-[#93B733]"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#93B733]"></span>
              </span>
              <p className="text-xs font-bold tracking-wide text-[#0D3A1D] sm:text-sm">
                Trusted Student Housing
              </p>
            </div>

            {/* Bold Premium Heading with Z-Gen Highlight */}
            <h1
              style={{ fontFamily: "'Outfit', sans-serif" }}
              className="mt-6 text-[3rem] font-black leading-[1.05] tracking-tight text-[#0D3A1D] sm:text-[4rem] md:mt-8 md:text-[4.8rem] md:leading-[1.05]"
            >
              Find Your <br />
              <span className="relative mt-2 inline-block">
                {/* Trendy Angled Highlight Box */}
                <span className="absolute inset-0 -rotate-2 rounded-2xl bg-[#93B733]"></span>
                <span className="relative inline-block -rotate-2 px-4 py-1 text-white">
                  Dream PG
                </span>
              </span>
              <br className="hidden md:block" />
              <span className="mt-2 inline-block">In Minutes.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base font-medium leading-relaxed text-gray-600 sm:text-lg sm:leading-8 md:mt-8 md:max-w-2xl md:text-lg">
              Explore premium student stays, modern hostels, and affordable PGs curated for your lifestyle.
            </p>

            {/* CTA Buttons - Soft Neo-Brutalism Style */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5 md:mt-10">
              <Link
                to="/pgs"
                className="w-full rounded-2xl border-2 border-[#0D3A1D] bg-[#0D3A1D] px-8 py-4 text-center text-sm font-bold text-white shadow-[4px_4px_0px_#93B733] transition-all duration-300 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#93B733] sm:w-auto md:text-base"
              >
                Explore Now
              </Link>

              <Link
                to="/auth?role=owner&mode=signup"
                className="w-full rounded-2xl border-2 border-gray-200 bg-white px-8 py-4 text-center text-sm font-bold text-[#0D3A1D] shadow-sm transition-all duration-300 hover:border-gray-300 hover:bg-gray-50 sm:w-auto md:text-base"
              >
                Become an Owner
              </Link>
            </div>

            {/* Stats - Bento Box Grid with Borders */}
            <div className="mt-10 grid grid-cols-3 gap-3 md:mt-14 md:gap-5">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="group flex flex-col items-center justify-center rounded-[1.5rem] border-2 border-gray-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#93B733]/40 hover:shadow-md md:rounded-[2rem] md:p-6"
                >
                  <p
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                    className="text-2xl font-black text-[#0D3A1D] transition-colors group-hover:text-[#93B733] sm:text-3xl md:text-4xl"
                  >
                    {item.number}
                  </p>
                  <p className="mt-1.5 text-center text-[10px] font-bold uppercase tracking-widest text-gray-600 sm:text-xs">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <HeroVisual featuredPG={featuredPG} />
        </Container>
      </section>
    </>
  );
};

export default HeroSection;