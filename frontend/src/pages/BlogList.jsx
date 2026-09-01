import { Link } from "react-router-dom";
import Container from "../layouts/Container";
import PublicLayout from "../layouts/PublicLayout";
import SEOHead from "../components/common/SEOHead";
import { GraduationCap, Building2, ArrowRight, Sparkles } from "lucide-react";

const guides = [
  {
    slug: "pg-near-amity-university-noida",
    title: "Best PGs Near Amity University Noida (Sector 125 & 126)",
    description: "Complete student guide: Walking distance stays, mess food reviews, late entry rules, and top verified Boys & Girls PGs.",
    category: "University Special",
    badgeColor: "bg-emerald-100 text-emerald-800",
    icon: GraduationCap,
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop",
    readTime: "4 min read",
  },
  {
    slug: "pg-in-sector-62-noida",
    title: "Sector 62 Noida Living Guide for IT Professionals & Interns",
    description: "Stays near Stellar IT Park, Logix Cyber Park, and Noida Electronic City Metro. Power backup, single sharing & food plans.",
    category: "Corporate & Tech Hub",
    badgeColor: "bg-blue-100 text-blue-800",
    icon: Building2,
    image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=800&auto=format&fit=crop",
    readTime: "5 min read",
  },
];

const BlogList = () => {
  const hubSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Noida Student & Professional Accommodation Guides | Dormn",
    "description": "Hand-crafted locality guides, university accommodation reviews, and tech park stay advice for Noida NCR.",
    "url": "https://dormn.com/blogs"
  };

  return (
    <PublicLayout>
      <SEOHead
        title="Noida Student & Corporate PG Guides | Dormn Guides"
        description="Explore custom guides for finding verified PGs in Noida near Amity University, Sector 62, Knowledge Park, and major corporate parks with zero brokerage."
        canonicalUrl="https://dormn.com/blogs"
        ogImage="https://dormn.com/logo.jpg"
        schema={hubSchema}
      />

      <div className="bg-[#FAF9F5] min-h-screen font-sans selection:bg-[#93B733] selection:text-white">
        
        {/* Full-Width Dark Green Hero Banner (Matching Screenshot Exactly) */}
        <section className="relative w-full bg-[#0D3A1D] py-14 sm:py-18 lg:py-20 text-white overflow-hidden">
          {/* Deep Dark Green Ambient Glow background */}
          <div className="absolute -right-10 top-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-gradient-to-l from-[#4E700F]/45 via-[#7A9C24]/25 to-transparent blur-[5.5rem] pointer-events-none opacity-90" />
          <div className="absolute -left-20 -bottom-20 h-96 w-96 rounded-full bg-[#0D3A1D] blur-[5rem] pointer-events-none" />

          <Container className="max-w-[1440px] 2xl:max-w-[1600px] px-4 sm:px-6 md:px-8 lg:px-10 relative z-10">
            <div className="max-w-4xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#93B733]/30 bg-[#93B733]/15 px-4 py-1.5 backdrop-blur-md mb-5 text-xs font-bold uppercase tracking-wider text-[#93B733]">
                <Sparkles size={14} /> HAND CRAFTED NOIDA GUIDES
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] text-white">
                Local Stays &amp; Neighbourhood Guides for Noida
              </h1>
              <p className="mt-4 text-base sm:text-lg text-gray-200/90 leading-relaxed font-medium max-w-3xl">
                Tailored insights designed specifically for Amity students, Sector 62 corporate interns, and Knowledge Park scholars.
              </p>
            </div>
          </Container>
        </section>

        {/* Guides Grid Section */}
        <div className="py-12 sm:py-16">
          <Container className="max-w-[1440px] 2xl:max-w-[1600px] px-4 sm:px-6 md:px-8 lg:px-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {guides.map((guide) => {
                const Icon = guide.icon;
                return (
                  <div
                    key={guide.slug}
                    className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group hover:-translate-y-1"
                  >
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={guide.image}
                        alt={guide.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute top-4 left-4 flex gap-2">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full shadow-md ${guide.badgeColor}`}>
                          {guide.category}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                          <Icon className="w-4 h-4 text-[#E56A54]" />
                          <span>{guide.readTime}</span>
                        </div>
                        <h2 className="text-2xl font-black text-[#0D3A1D] group-hover:text-[#E56A54] transition-colors leading-snug">
                          <Link to={`/blogs/${guide.slug}`}>{guide.title}</Link>
                        </h2>
                        <p className="text-slate-600 text-sm mt-3 leading-relaxed">
                          {guide.description}
                        </p>
                      </div>

                      <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0D3A1D]">Noida, UP</span>
                        <Link
                          to={`/blogs/${guide.slug}`}
                          className="inline-flex items-center gap-2 font-bold text-sm text-[#E56A54] group-hover:text-[#0D3A1D] transition-colors"
                        >
                          Explore Guide <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Container>
        </div>

      </div>
    </PublicLayout>
  );
};

export default BlogList;