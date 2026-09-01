import { Link } from "react-router-dom";
import Container from "../../layouts/Container";
import PublicLayout from "../../layouts/PublicLayout";
import SEOHead from "../../components/common/SEOHead";
import { 
  GraduationCap, 
  Wifi, 
  Utensils, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  PhoneCall, 
  Sparkles,
  ChevronRight,
  Clock,
  MapPin
} from "lucide-react";

const AmityPGGuide = () => {
  // Advanced AEO & SEO Schema (Graph Format for multiple entity types)
  const pageSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://dormn.com" },
          { "@type": "ListItem", "position": 2, "name": "Noida Guides", "item": "https://dormn.com/blogs" },
          { "@type": "ListItem", "position": 3, "name": "Amity University PGs", "item": "https://dormn.com/blogs/pg-near-amity-university-noida" }
        ]
      },
      {
        "@type": "Article",
        "headline": "Top Verified PGs Near Amity University Noida Sector 125",
        "description": "Comprehensive student guide for finding verified Boys, Girls, and COED PGs within walking distance of Amity University Noida with food and zero brokerage.",
        "image": "https://dormn.com/logo.jpg", // Fallback to logo for strict schema requirements
        "author": { "@type": "Organization", "name": "Dormn Expert Team" },
        "publisher": { "@type": "Organization", "name": "Dormn", "logo": { "@type": "ImageObject", "url": "https://dormn.com/logo.jpg" } },
        "datePublished": "2026-07-28",
        "dateModified": "2026-07-28"
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Which sectors are closest to Amity University Noida for PGs?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Sector 125, Sector 126, and Sector 127 are located within walking distance (5-10 minutes) of the Amity University Noida main campus gate."
            }
          },
          {
            "@type": "Question",
            "name": "Are food and Wi-Fi included in Amity area PGs?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, over 90% of verified PGs on Dormn offer 3-time daily meals, high-speed Wi-Fi, power backup, and daily housekeeping included in the monthly rent."
            }
          }
        ]
      }
    ]
  };

  return (
    <PublicLayout>
      <SEOHead
        title="Best PGs Near Amity University Noida (Sector 125) | Dormn"
        description="Find verified Boys PGs, Girls PGs, and COED accommodations near Amity University Noida. Walking distance stays with food, AC, Wi-Fi, and zero brokerage."
        canonicalUrl="https://dormn.com/blogs/pg-near-amity-university-noida"
        ogImage="https://dormn.com/logo.jpg"
        schema={pageSchema}
      />

      {/* Visual Breadcrumbs */}
      <div className="bg-[#FAF9F5] border-b border-gray-200 py-3 hidden md:block">
        <Container>
          <nav className="flex items-center text-xs font-semibold text-gray-500">
            <Link to="/" className="hover:text-[#E56A54] transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 mx-2" />
            <Link to="/blogs" className="hover:text-[#E56A54] transition-colors">Noida Guides</Link>
            <ChevronRight className="w-3 h-3 mx-2" />
            <span className="text-[#0D3A1D]">Amity University PGs</span>
          </nav>
        </Container>
      </div>

      {/* Typography & Gradient Hero (No Images) */}
      <header className="bg-gradient-to-br from-[#0D3A1D] via-[#114b26] to-[#0D3A1D] text-white py-16 sm:py-24 relative overflow-hidden">
        {/* Abstract shapes for visual depth */}
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-[#93B733]/10 rounded-full blur-[100px] pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-[#E56A54]/10 rounded-full blur-[80px] pointer-events-none transform -translate-x-1/2 translate-y-1/2"></div>
        
        <Container className="relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#0D3A1D] bg-[#93B733] px-4 py-2 rounded-full mb-6 shadow-lg">
              <GraduationCap className="w-4 h-4" /> Campus Special Guide
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight mb-6">
              Verified Student PGs Near <span className="text-[#93B733]">Amity University</span> Noida
            </h1>
            <p className="text-slate-300 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-8">
              The ultimate 2026 student guide to navigating Sector 125 & 126. We breakdown mess meals, safety curfews, walking distances, and how to book directly with zero brokerage.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-semibold text-slate-300">
              <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-[#E56A54]" /> 5 Min Read</span>
              <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#E56A54]" /> Noida NCR</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#93B733]" /> Updated July 2026</span>
            </div>
          </div>
        </Container>
      </header>

      <Container className="py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          
          {/* Main SEO Article Content */}
          <article className="lg:col-span-2 space-y-12">
            
            {/* AI Optimization: Data-Dense Quick Summary */}
            <section className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-[#E56A54]"></div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0D3A1D] flex items-center gap-2 mb-6">
                <Sparkles className="w-6 h-6 text-[#E56A54]" /> TL;DR: Amity Stay Hub Highlights
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-gray-100">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-1">Avg. Rent</span>
                  <span className="text-xl font-black text-[#0D3A1D]">₹7,500<span className="text-sm font-bold text-gray-400">/mo</span></span>
                </div>
                <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-gray-100">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-1">Commute</span>
                  <span className="text-xl font-black text-[#0D3A1D]">5-10 <span className="text-sm font-bold text-gray-400">Mins</span></span>
                </div>
                <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-gray-100">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-1">Brokerage</span>
                  <span className="text-xl font-black text-[#93B733]">Zero</span>
                </div>
                <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-gray-100">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-1">Meals</span>
                  <span className="text-xl font-black text-[#0D3A1D]">Included</span>
                </div>
              </div>
            </section>

            {/* Content Section 1: Heavy Interlinking */}
            <section className="prose max-w-none text-slate-700">
              <h2 className="text-2xl sm:text-3xl font-black text-[#0D3A1D] mb-4">
                Choosing the Right Sector Near Amity Campus
              </h2>
              <p className="text-lg leading-relaxed mb-6">
                When moving to Noida for your studies at Amity University, selecting the right accommodation is critical. Traffic in Noida NCR can be heavy, making walking-distance PGs the most highly sought-after properties. Whether you need a strict-security <Link to="/pgs?city=Noida&type=Girls" className="text-[#E56A54] font-bold hover:underline">Girls PG in Noida</Link> or a flexible <Link to="/pgs?city=Noida&type=Boys" className="text-[#E56A54] font-bold hover:underline">Boys PG</Link>, here is the definitive breakdown of the best sectors.
              </p>

              <div className="grid sm:grid-cols-2 gap-6 mt-8">
                <div className="p-6 rounded-3xl bg-[#93B733]/5 border-2 border-[#93B733]/20 hover:border-[#93B733] transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#93B733] text-white font-black text-lg shadow-sm">125</span>
                    <h3 className="font-bold text-[#0D3A1D] text-lg m-0">Sector 125</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600">
                    The premium choice. Located directly adjacent to Gate 2 & 3. Properties here command a slight premium but save you daily rickshaw fares. Highly recommended for students seeking a <Link to="/pgs?city=Noida&area=Sector 125" className="font-bold text-[#0D3A1D] underline">PG in Sector 125</Link>.
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-[#E56A54]/5 border-2 border-[#E56A54]/20 hover:border-[#E56A54] transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#E56A54] text-white font-black text-lg shadow-sm">126</span>
                    <h3 className="font-bold text-[#0D3A1D] text-lg m-0">Sector 126</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600">
                    The budget-friendly hub. Situated just behind the campus, it features vibrant student cafes, larger room layouts, and excellent <Link to="/pgs?city=Noida&type=COED" className="font-bold text-[#0D3A1D] underline">COED PG accommodations</Link> tailored for modern students.
                  </p>
                </div>
              </div>
            </section>

            {/* Content Section 2: Structured Amenities */}
            <section>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0D3A1D] mb-6">Standard Student Amenities Assured by Dormn</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-gray-200 flex items-start gap-4 hover:shadow-md transition-shadow">
                  <div className="bg-[#93B733]/10 p-2.5 rounded-xl"><ShieldCheck className="w-6 h-6 text-[#93B733]" /></div>
                  <div>
                    <h4 className="font-bold text-[#0D3A1D] text-base">24/7 CCTV & Security</h4>
                    <p className="text-sm text-slate-500 mt-1">Biometric access and resident wardens ensure complete peace of mind.</p>
                  </div>
                </div>
                
                <div className="p-5 rounded-2xl bg-white border border-gray-200 flex items-start gap-4 hover:shadow-md transition-shadow">
                  <div className="bg-[#E56A54]/10 p-2.5 rounded-xl"><Wifi className="w-6 h-6 text-[#E56A54]" /></div>
                  <div>
                    <h4 className="font-bold text-[#0D3A1D] text-base">High-Speed Wi-Fi</h4>
                    <p className="text-sm text-slate-500 mt-1">Uninterrupted internet specifically optimized for online classes and assignments.</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-gray-200 flex items-start gap-4 hover:shadow-md transition-shadow">
                  <div className="bg-orange-100 p-2.5 rounded-xl"><Utensils className="w-6 h-6 text-orange-600" /></div>
                  <div>
                    <h4 className="font-bold text-[#0D3A1D] text-base">3-Time Nutritious Meals</h4>
                    <p className="text-sm text-slate-500 mt-1">Hygienic, home-style breakfast, lunch, and dinner included in your rent.</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-gray-200 flex items-start gap-4 hover:shadow-md transition-shadow">
                  <div className="bg-blue-100 p-2.5 rounded-xl"><CheckCircle2 className="w-6 h-6 text-blue-600" /></div>
                  <div>
                    <h4 className="font-bold text-[#0D3A1D] text-base">Housekeeping & RO Water</h4>
                    <p className="text-sm text-slate-500 mt-1">Daily room cleaning services and unlimited access to purified drinking water.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Semantic FAQ Section for Google Snippets */}
            <section className="bg-[#FAF9F5] p-8 rounded-3xl border-2 border-gray-200">
              <h2 className="text-2xl font-black text-[#0D3A1D] mb-6">Frequently Asked Questions</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-lg text-[#0D3A1D] mb-2">Which sectors are closest to Amity University Noida for PGs?</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Sector 125, Sector 126, and Sector 127 are the primary residential hubs. They are located within a highly convenient walking distance (5 to 10 minutes) directly from the Amity University Noida main campus gates.
                  </p>
                </div>
                <div className="w-full h-px bg-gray-200"></div>
                <div>
                  <h3 className="font-bold text-lg text-[#0D3A1D] mb-2">Are food and Wi-Fi included in Amity area PGs?</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Yes, when booking through Dormn, over 90% of the verified properties offer comprehensive packages that include 3-time daily meals, commercial-grade Wi-Fi, power backup, and regular housekeeping within the base monthly rent.
                  </p>
                </div>
              </div>
            </section>
          </article>

          {/* Sticky Sidebar CTA (Crucial for Conversions) */}
          <aside className="lg:col-span-1">
            <div className="sticky top-28 bg-white rounded-3xl p-6 md:p-8 border-2 border-slate-200 shadow-xl space-y-6">
              <div className="bg-gradient-to-br from-[#0D3A1D] to-[#114b26] p-6 rounded-2xl text-center text-white shadow-inner">
                <span className="text-xs font-bold uppercase tracking-widest text-[#93B733] block mb-2">Zero Brokerage</span>
                <span className="text-2xl font-black block leading-tight">Book Your Amity PG Today</span>
              </div>

              <div className="space-y-3">
                <Link
                  to="/pgs?city=Noida&type=Girls&landmark=Amity"
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-pink-50 text-pink-700 font-bold hover:bg-pink-100 hover:shadow-md transition-all border border-pink-100 group"
                >
                  <span className="flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> Girls PGs</span>
                  <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/pgs?city=Noida&type=Boys&landmark=Amity"
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 hover:shadow-md transition-all border border-blue-100 group"
                >
                  <span className="flex items-center gap-2"><Utensils className="w-5 h-5" /> Boys PGs</span>
                  <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/pgs?city=Noida&type=COED&landmark=Amity"
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#93B733]/10 text-[#5a731d] font-bold hover:bg-[#93B733]/20 hover:shadow-md transition-all border border-[#93B733]/20 group"
                >
                  <span className="flex items-center gap-2"><Wifi className="w-5 h-5" /> COED PGs</span>
                  <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="pt-6 border-t border-gray-100 text-center">
                <p className="text-sm text-gray-500 font-semibold mb-3">Prefer to speak with an expert?</p>
                <a
                  href="tel:+919667555201"
                  className="inline-flex items-center justify-center gap-2 w-full bg-white border-2 border-[#E56A54] text-[#E56A54] font-black py-3 rounded-xl hover:bg-[#E56A54] hover:text-white transition-colors"
                >
                  <PhoneCall className="w-5 h-5" /> Call Dormn Support
                </a>
              </div>
            </div>
          </aside>

        </div>
      </Container>
    </PublicLayout>
  );
};

export default AmityPGGuide;