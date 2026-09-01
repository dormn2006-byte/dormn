import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import PublicLayout from "../layouts/PublicLayout";
import Container from "../layouts/Container";
import { ShieldCheck, Compass, TrendingUp, Sparkles, CheckCircle, Lock, Building2 } from "lucide-react";

const iconMap = {
  ShieldCheck: ShieldCheck,
  Compass: Compass,
  Building2: Building2,
  Sparkles: Sparkles,
};

const features = [
  {
    title: "Verified Listings",
    description:
      "Every PG listed on our platform goes through verification and approval before becoming visible to students.",
    icon: "ShieldCheck",
  },
  {
    title: "Smart PG Discovery",
    description:
      "Students can discover PGs using filters like boys PG, girls PG, AC rooms, food availability, location and college distance.",
    icon: "Compass",
  },
  {
    title: "PG Owner Dashboard",
    description:
      "PG owners can manage listings, upload room photos, track bookings and monitor students directly from their dashboard.",
    icon: "Building2",
  },
  {
    title: "Future Ready Platform",
    description:
      "We are building a scalable student accommodation ecosystem with analytics, automation and secure admin approvals.",
    icon: "Sparkles",
  },
];

const futureFeatures = [
  "AI-based PG recommendations & assistance",
  "Verified roommate matching",
  "Live room availability tracking",
  "Digital rent & payment management",
  "Smart student community system",
  "Location & college-based PG discovery",
  "Club & event passes",
  "Enrollment system",
  "PDF generation & receipt system",
];

const About = () => {
  const [stats, setStats] = useState([
    { number: '10+', label: 'Verified PGs' },
    { number: '100+', label: 'Students Connected' },
    { number: '7+', label: 'PG Owners' },
    { number: '2', label: 'Cities Covered' },
  ]);

  useEffect(() => {
    const loadAboutStats = async () => {
      try {
        const res = await API.get('/pg/all');
        const pgs = res.data?.pgs || [];

        const cities = new Set(
          pgs.map((pg) => pg.city).filter(Boolean)
        );

        const owners = new Set(
          pgs.map((pg) => pg.owner_id).filter(Boolean)
        );

        setStats([
          {
            number: `${pgs.length}+`,
            label: 'Verified PGs',
          },
          {
            number: `${Math.max(pgs.length * 5, 100)}+`,
            label: 'Students Connected',
          },
          {
            number: `${owners.size}+`,
            label: 'PG Owners',
          },
          {
            number: `${cities.size}`,
            label: 'Cities Covered',
          },
        ]);
      } catch (error) {
        console.error('About page stats error:', error);
      }
    };

    loadAboutStats();
  }, []);

  return (
    <PublicLayout>
      <div className="bg-[#FAF9F5] font-sans selection:bg-[#93B733] selection:text-white">
        
        {/* Hero Section */}
        <section className="relative overflow-hidden px-4 pb-12 pt-10 sm:px-5 sm:pb-16 sm:pt-12 lg:px-8 lg:pb-20 lg:pt-16">
          <Container className="relative grid items-center gap-12 sm:gap-14 md:gap-16 lg:grid-cols-2">
            
            <div className="z-10">
              <div className="inline-flex items-center gap-2.5 rounded-full border-2 border-gray-200 bg-white px-4 py-2 shadow-sm transition-transform hover:-translate-y-0.5 sm:px-5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#93B733] opacity-75"></span>
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#93B733]"></span>
                </span>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#0D3A1D] sm:text-xs">
                  Revolutionizing Student Housing
                </p>
              </div>

              <h1 className="mt-6 text-4xl font-black leading-[1.1] tracking-tight text-[#0D3A1D] sm:text-5xl md:mt-8 md:text-6xl lg:text-[4.5rem]">
                Building The Future Of
                <span className="relative mt-2 inline-block">
                  <span className="absolute inset-0 -rotate-1 rounded-2xl bg-[#93B733]"></span>
                  <span className="relative inline-block -rotate-1 px-4 py-1 text-white">
                    Student Stays
                  </span>
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base font-medium leading-relaxed text-gray-600 sm:text-lg sm:leading-8 md:text-xl">
                Dormn is a growing student accommodation platform powered by real PG listings, verified owners, and live accommodation data.
              </p>

              <p className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-gray-600 sm:text-lg sm:leading-8 md:text-xl">
                We connect students with trusted PG owners through a secure ecosystem that enables discovery, comparison, and booking across multiple cities.
              </p>
            </div>

            <div className="relative">
              <div className="absolute -left-10 -top-10 h-64 w-64 rounded-full bg-[#93B733]/20 blur-3xl"></div>
              
              <div className="relative rounded-[2.5rem] border border-transparent bg-white p-2 shadow-[0_20px_50px_-12px_rgba(147,183,51,0.15)] transition-all duration-700 hover:scale-[1.02] hover:border-[#93B733]/60 md:rounded-[3rem] md:p-3">
                <div className="flex h-[320px] w-full flex-col justify-between overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0D3A1D] via-[#144A27] to-[#0D3A1D] p-8 text-white sm:h-[420px] lg:h-[560px]">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-md">
                      <Sparkles className="h-4 w-4 text-[#93B733]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-white">Verified Stays</span>
                    </div>
                    <span className="rounded-xl bg-[#93B733] px-3 py-1 text-xs font-black text-[#0D3A1D]">Zero Brokerage</span>
                  </div>

                  <div className="my-auto text-center">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#93B733]/20 border border-[#93B733]/30 backdrop-blur-sm">
                      <ShieldCheck className="h-10 w-10 text-[#93B733]" />
                    </div>
                    <h3 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
                      Dormn Certified Housing
                    </h3>
                    <p className="mx-auto mt-2 max-w-md text-xs font-medium text-gray-300 sm:text-sm">
                      100% verified rooms, transparent pricing, and direct owner connections across Noida.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                    <div className="text-center">
                      <p className="text-lg font-black text-[#93B733] sm:text-xl">500+</p>
                      <p className="text-[10px] font-semibold text-gray-300">Verified PGs</p>
                    </div>
                    <div className="text-center border-x border-white/10">
                      <p className="text-lg font-black text-[#93B733] sm:text-xl">100%</p>
                      <p className="text-[10px] font-semibold text-gray-300">Direct Owners</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-black text-[#93B733] sm:text-xl">0</p>
                      <p className="text-[10px] font-semibold text-gray-300">Brokerage Fees</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Stats */}
        <section className="px-4 pb-12 sm:px-5 sm:pb-16 lg:px-8 lg:pb-24">
          <Container className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-4">
            {stats.map((item) => (
              <div
                key={item.label}
                className="group flex flex-col items-center justify-center rounded-[1.5rem] border-2 border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#93B733]/40 hover:shadow-md md:rounded-[2rem] md:p-8"
              >
                <p className="text-3xl font-black text-[#0D3A1D] transition-colors group-hover:text-[#93B733] sm:text-4xl md:text-5xl">
                  {item.number}
                </p>
                <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-widest text-gray-600 sm:text-xs">
                  {item.label}
                </p>
              </div>
            ))}
          </Container>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 1: OUR MISSION - REDEFINING THE STUDENT HOUSING EXPERIENCE       */}
        {/* ========================================================================= */}
        <section className="px-4 pb-14 sm:px-5 sm:pb-20 lg:px-8 lg:pb-28">
          <Container>
            <div className="relative overflow-hidden rounded-[2.5rem] border-2 border-gray-100 bg-white p-8 shadow-sm md:rounded-[3rem] md:p-14">
              <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                
                <div className="rounded-[2rem] border border-transparent bg-white p-2 shadow-[0_15px_40px_-10px_rgba(147,183,51,0.15)] transition-all duration-700 hover:scale-[1.02] hover:border-[#93B733]/60">
                  <div className="flex h-full min-h-[300px] w-full flex-col justify-between overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-[#FAF9F5] via-emerald-50/40 to-[#FAF9F5] p-6 border border-emerald-100/60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#93B733] text-[#0D3A1D] font-black text-sm">
                          D
                        </div>
                        <span className="text-sm font-extrabold text-[#0D3A1D]">Mission Control</span>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold text-emerald-800">Active Oversight</span>
                    </div>

                    <div className="my-6 space-y-3">
                      <div className="rounded-xl bg-white p-3.5 shadow-sm border border-gray-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0D3A1D]">Physical Audits</span>
                        <span className="text-xs font-bold text-emerald-600">✓ Verified</span>
                      </div>
                      <div className="rounded-xl bg-white p-3.5 shadow-sm border border-gray-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0D3A1D]">Direct Host Contact</span>
                        <span className="text-xs font-bold text-emerald-600">✓ Connected</span>
                      </div>
                      <div className="rounded-xl bg-white p-3.5 shadow-sm border border-gray-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0D3A1D]">Zero Brokerage Guarantee</span>
                        <span className="text-xs font-bold text-[#93B733]">100% Policy</span>
                      </div>
                    </div>

                    <p className="text-center text-xs font-semibold text-gray-500">
                      Redefining student living with trust and transparency.
                    </p>
                  </div>
                </div>

                <div className="order-1 lg:order-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#93B733]/20 bg-[#93B733]/10 px-3.5 py-1 text-xs font-extrabold text-[#93B733]">
                    <Sparkles className="h-3.5 w-3.5" />
                    Section 1 • Strategic Mission
                  </div>

                  <h2 className="mt-4 text-3xl font-black tracking-tight text-[#0D3A1D] sm:text-4xl md:text-5xl">
                    Our Mission: Redefining the Student Housing Experience
                  </h2>

                  <p className="mt-5 text-base font-medium leading-relaxed text-gray-600 sm:text-lg sm:leading-8">
                    The traditional PG market has long been plagued by chaos—unorganized listings, lack of pricing transparency, outdated photos, and tedious manual offline management.
                  </p>

                  <p className="mt-4 text-base font-medium leading-relaxed text-gray-600 sm:text-lg sm:leading-8">
                    Dormn was created as the modern solution designed to bring structure, transparency, and high aesthetic standards to student housing. We turn what used to be a stressful chore into a premium, confident experience of &quot;finding a home away from home.&quot;
                  </p>

                  <div className="mt-6 grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                    <div className="rounded-xl bg-gray-50 p-3.5 border border-gray-100">
                      <p className="text-xs font-bold text-[#93B733]">Traditional PG Search</p>
                      <p className="mt-1 text-xs font-medium text-gray-500">Unorganized, manual, &amp; zero transparency</p>
                    </div>
                    <div className="rounded-xl bg-[#93B733]/10 p-3.5 border border-[#93B733]/20">
                      <p className="text-xs font-bold text-[#0D3A1D]">The Dormn Standard</p>
                      <p className="mt-1 text-xs font-semibold text-gray-600">Structured, verified, &amp; aesthetic stays</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </Container>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 2: THE DORMN STANDARD - BUILT FOR MODERN TENANT & OWNER           */}
        {/* ========================================================================= */}
        <section className="bg-white px-5 py-20 lg:px-8 lg:py-28 border-y border-gray-100">
          <Container>
            <div className="mb-12 text-center md:mb-16 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#93B733]/20 bg-[#93B733]/10 px-3.5 py-1 text-xs font-extrabold text-[#93B733]">
                Section 2 • Dual-Sided Ecosystem
              </div>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-[#0D3A1D] sm:text-4xl md:text-5xl">
                The Dormn Standard: Built for the Modern Tenant &amp; Owner
              </h2>
              <p className="mt-4 text-base font-medium text-gray-600 sm:text-lg">
                We designed Dormn with a deep understanding of both user journeys—delivering tailored value to both students searching for rooms and property partners hosting them.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              
              {/* For Tenant: Frictionless Discovery */}
              <div className="group rounded-[2.5rem] border-2 border-gray-100 bg-[#FAF9F5] p-8 transition-all duration-300 hover:border-[#93B733]/40 hover:bg-white hover:shadow-xl sm:p-10">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#93B733]/20 bg-white text-[#93B733] shadow-sm">
                  <Compass className="h-7 w-7" />
                </div>

                <p className="mt-6 text-xs font-extrabold uppercase tracking-widest text-[#93B733]">
                  For The Tenant
                </p>
                <h3 className="mt-2 text-2xl font-black text-[#0D3A1D]">
                  Frictionless Discovery
                </h3>
                <p className="mt-4 text-base font-medium leading-relaxed text-gray-600">
                  Students get an effortless search process powered by smart location filters, room category specifications (AC/Non-AC), college proximity metrics, interactive map links, and high-definition verified room galleries.
                </p>

                <ul className="mt-6 space-y-2.5 border-t border-gray-200/60 pt-6">
                  {[
                    "Smart location & college proximity search filters",
                    "Verified HD photo galleries & room specs",
                    "Direct 1-click WhatsApp & phone owner connections",
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2.5 text-xs font-bold text-[#0D3A1D] sm:text-sm">
                      <CheckCircle className="h-4 w-4 text-[#93B733] flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* For Owner: Effortless Growth */}
              <div className="group rounded-[2.5rem] border-2 border-gray-100 bg-[#FAF9F5] p-8 transition-all duration-300 hover:border-[#0D3A1D]/40 hover:bg-white hover:shadow-xl sm:p-10">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-purple-200 bg-white text-purple-700 shadow-sm">
                  <TrendingUp className="h-7 w-7" />
                </div>

                <p className="mt-6 text-xs font-extrabold uppercase tracking-widest text-purple-700">
                  For The Owner
                </p>
                <h3 className="mt-2 text-2xl font-black text-[#0D3A1D]">
                  Effortless Growth
                </h3>
                <p className="mt-4 text-base font-medium leading-relaxed text-gray-600">
                  Property partners gain digital visibility to thousands of verified students, maximizing room occupancy while simplifying booking management through a streamlined partner dashboard.
                </p>

                <ul className="mt-6 space-y-2.5 border-t border-gray-200/60 pt-6">
                  {[
                    "Instant digital reach to active student leads",
                    "Streamlined booking request approvals & tenant management",
                    "Maximizes room occupancy with minimal marketing effort",
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2.5 text-xs font-bold text-[#0D3A1D] sm:text-sm">
                      <CheckCircle className="h-4 w-4 text-purple-700 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </Container>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 3: TRUST & TRANSPARENCY - OUR CORE PILLARS                        */}
        {/* ========================================================================= */}
        <section className="px-5 py-20 lg:px-8 lg:py-28">
          <Container>
            <div className="rounded-[2.5rem] border-2 border-gray-100 bg-white p-8 shadow-sm md:rounded-[3rem] md:p-14">
              <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-extrabold text-emerald-700">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Section 3 • Security &amp; Reliability
                  </div>

                  <h2 className="mt-4 text-3xl font-black tracking-tight text-[#0D3A1D] md:text-5xl">
                    Trust &amp; Transparency: Our Core Pillars
                  </h2>

                  <p className="mt-6 text-base font-medium leading-8 text-gray-600 sm:text-lg">
                    Safety and truth in advertising are non-negotiable at Dormn. We enforce strict quality protocols so every tenant moves into a space that matches their expectation.
                  </p>

                  {/* SuperAdmin Oversight Focus */}
                  <div className="mt-6 rounded-2xl border-2 border-emerald-100 bg-emerald-50/50 p-5">
                    <div className="flex items-center gap-2.5 text-emerald-900 font-extrabold text-sm sm:text-base">
                      <Lock className="h-4 w-4 text-emerald-700" />
                      SuperAdmin Oversight
                    </div>
                    <p className="mt-2 text-xs font-semibold leading-relaxed text-emerald-800 sm:text-sm">
                      Our dedicated quality control team actively monitors the platform to audit listings, verify host identity, and ban fraudulent or misleading posts. Dormn is a strictly curated community—never an open, unverified bulletin board.
                    </p>
                  </div>
                </div>

                <div className="rounded-[2.5rem] border border-transparent bg-white p-2 shadow-[0_15px_40px_-10px_rgba(147,183,51,0.15)] transition-all duration-700 hover:scale-[1.02] hover:border-[#93B733]/60 md:rounded-[3rem] md:p-3">
                  <div className="flex h-[320px] w-full flex-col justify-between overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0D3A1D] to-[#1A5C30] p-6 text-white sm:h-[420px] lg:h-[480px]">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-[#93B733]/20 px-3 py-1 text-xs font-bold text-[#93B733] border border-[#93B733]/30">SuperAdmin Quality Control</span>
                      <ShieldCheck className="h-6 w-6 text-[#93B733]" />
                    </div>

                    <div className="my-auto space-y-4">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#93B733] text-[#0D3A1D]">
                            <CheckCircle className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="text-sm font-extrabold text-white">Listing Verification Protocol</h4>
                            <p className="text-xs font-medium text-gray-300">Every photo & host ID is manually audited</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#93B733]/20 text-[#93B733] border border-[#93B733]/30">
                            <Lock className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-extrabold text-white">Zero Scam Enforcement</h4>
                            <p className="text-xs font-medium text-gray-300">Strict ban policy for fraudulent posts</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl bg-white/10 p-3 text-center text-xs font-bold text-[#93B733] backdrop-blur-sm">
                      Dormn Quality Guarantee
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Existing Platform Highlights Features Grid */}
        <section className="bg-white px-5 py-20 lg:px-8 lg:py-28 border-y border-gray-100">
          <Container>
            <div className="mb-12 text-center md:mb-16">
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#93B733]">
                Platform Highlights
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-[#0D3A1D] sm:text-4xl md:text-5xl">
                Why Dormn Is Different
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2 md:gap-8">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-[2rem] border-2 border-gray-100 bg-gray-50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gray-200 hover:bg-white hover:shadow-[0_15px_40px_-15px_rgba(0,0,0,0.1)] sm:p-8 md:p-10"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#93B733]/20 bg-[#93B733]/10 shadow-sm sm:h-16 sm:w-16 md:h-16 md:w-16 text-[#93B733]">
                    {(() => {
                      const IconComponent = iconMap[feature.icon] || Sparkles;
                      return <IconComponent className="h-6 w-6 sm:h-8 sm:w-8" />;
                    })()}
                  </div>

                  <h3 className="mt-6 text-2xl font-black tracking-tight text-[#0D3A1D]">
                    {feature.title}
                  </h3>

                  <p className="mt-4 text-base font-medium leading-relaxed text-gray-600 sm:text-lg">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* Future Vision (Bento List) */}
        <section className="px-5 py-20 lg:px-8 lg:py-28">
          <Container>
            <div className="rounded-[2.5rem] border-2 border-gray-100 bg-white p-8 shadow-sm md:rounded-[3rem] md:p-14">
              <div className="mb-12 text-center">
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#93B733]">
                  Future Roadmap
                </p>

                <h2 className="mt-4 text-3xl font-black tracking-tight text-[#0D3A1D] md:text-5xl">
                  What We Are Building Next
                </h2>

                <p className="mx-auto mt-5 max-w-2xl text-base font-medium leading-relaxed text-gray-500 sm:text-lg">
                  Dormn is evolving into a complete smart accommodation ecosystem for students and PG owners.
                </p>
              </div>

              <div className="mb-10 rounded-2xl border-2 border-[#93B733]/20 bg-[#93B733]/10 p-5 text-center">
                <p className="text-sm font-bold text-[#93B733]">
                  Current roadmap items will gradually move from planning to live platform features as Dormn expands.
                </p>
              </div>

              <div className="grid gap-2.5 sm:gap-4 grid-cols-2 lg:grid-cols-3">
                {futureFeatures.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-2.5 sm:gap-4 rounded-xl sm:rounded-2xl border-2 border-gray-100 bg-gray-50 p-3 sm:p-5 transition-colors hover:border-[#93B733]/30 hover:bg-white"
                  >
                    <div className="flex h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#93B733]/10 text-xs sm:text-sm font-black text-[#93B733]">
                      ✓
                    </div>
                    <h3 className="text-xs font-extrabold text-[#0D3A1D] sm:text-base leading-tight">
                      {feature}
                    </h3>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* CTA (Premium Charcoal Banner) */}
        <section className="px-5 pb-20 lg:px-8 lg:pb-28">
          <Container>
            <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0D3A1D] px-6 py-12 shadow-[0_20px_50px_-12px_rgba(58,41,53,0.4)] sm:px-12 sm:py-16 md:rounded-[3rem] lg:px-20 lg:py-24">
              {/* Decorative Background Elements */}
              <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#93B733]/30 blur-[4rem]"></div>
              
              <div className="relative z-10 max-w-2xl">
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#93B733]">
                  Join The Platform
                </p>

                <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
                  Start Exploring Modern Student PGs Today.
                </h2>

                <p className="mt-6 text-base font-medium leading-relaxed text-gray-300 sm:text-lg">
                  Whether you are a student searching for accommodation or a PG owner looking to grow your reach, Dormn is built for you.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 md:mt-10">
                  <Link
                    to="/pgs"
                    className="w-full rounded-2xl bg-[#93B733] px-8 py-4 text-center text-sm font-bold tracking-wide text-white shadow-lg transition-transform hover:scale-[1.02] hover:bg-[#82a32d] sm:w-auto md:text-base"
                  >
                    Explore PGs
                  </Link>
                  <Link
                    to="/auth?role=owner&mode=signup"
                    className="w-full rounded-2xl border-2 border-gray-400 bg-transparent px-8 py-4 text-center text-sm font-bold tracking-wide text-white transition-colors hover:border-white hover:bg-white/10 sm:w-auto md:text-base"
                  >
                    Become an Owner
                  </Link>
                </div>
              </div>
            </div>
          </Container>
        </section>

      </div>
    </PublicLayout>
  );
};

export default About;