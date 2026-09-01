import { useState, useEffect, memo, useCallback } from "react";
import { 
  ShieldCheck, MessageSquare, CheckCircle, Zap, 
  ArrowRight, PhoneCall, Sparkles, ChevronLeft, ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";
import Container from "../../layouts/Container";

const topics = [
  {
    id: "topic-a",
    topicLabel: "Topic A • Verification Pipeline",
    title: "The End of Blind Booking: Verified Stays for Peace of Mind",
    badge: "SuperAdmin Quality Check",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: ShieldCheck,
    iconBg: "border-[#93B733]/25 bg-[#93B733]/10 text-[#4E700F] group-hover:scale-110 group-hover:border-[#93B733]/60",
    problemText: "Eliminates the anxiety of \"what you see is NOT what you get\" when booking PGs online, avoiding safety concerns and wasted in-person visits.",
    problemBg: "border-emerald-200/80 bg-emerald-50/70 text-[#0D3A1D]",
    problemLabelColor: "text-[#0D3A1D]",
    desc: "Every listing on Dormn undergoes a rigorous verification process. We bridge the gap between digital listings and physical reality, ensuring amenities, room types (AC/Non-AC), and locations are exactly as described. This transforms a stressful search into a confident selection process.",
    features: [
      "100% SuperAdmin multi-step verification pipeline",
      "Accurate AC vs. Non-AC room specs & pricing transparency",
      "Verified photos, exact location coordinates, and college proximity",
    ],
    featureIcon: CheckCircle,
    ctaLink: "/pgs",
    ctaText: "Browse Verified Listings",
    decorBg: "bg-[#93B733]/15",
  },
  {
    id: "topic-b",
    topicLabel: "Topic B • Inquiry & Management System",
    title: "Seamless Living: Bridging the Gap Between Owners & Tenants",
    badge: "Instant Communication Hub",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    icon: MessageSquare,
    iconBg: "border-purple-200/50 bg-purple-50 text-purple-700 group-hover:scale-110 group-hover:border-purple-400",
    problemText: "Removes communication bottlenecks between owners and students—preventing missed inquiries, delayed visit approvals, or middleman friction.",
    problemBg: "border-blue-200/80 bg-blue-50/70 text-[#0D3A1D]",
    problemLabelColor: "text-blue-900",
    desc: "Dormn isn't just a listing site; it's a communication hub. For students, it provides a direct line to owners via one-click contact & instant booking tracking. For owners, it offers a streamlined dashboard to manage booking requests and tenant rosters effortlessly.",
    features: [
      "Direct contact & request tracking for students",
      "Streamlined owner dashboard for instant request approvals",
      "Zero middleman friction from searching to staying",
    ],
    featureIcon: Zap,
    ctaLink: "/auth",
    ctaText: "Start Direct Booking",
    showPhoneCall: true,
    decorBg: "bg-purple-100/50",
  }
];

// Extracted outside component to prevent re-creation on every render
const TopicCard = memo(({ topic }) => {
  const IconComponent = topic.icon;
  const FeatureIcon = topic.featureIcon;

  return (
    <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border-2 border-gray-100 bg-white p-5 md:p-8 sm:p-10 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#93B733]/40 hover:shadow-xl">
      <div className={`absolute -right-12 -top-12 h-40 w-40 rounded-full ${topic.decorBg} transition-transform duration-500 group-hover:scale-150`} />

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className={`flex h-11 w-11 md:h-14 md:w-14 items-center justify-center rounded-xl md:rounded-2xl border-2 ${topic.iconBg} shadow-sm transition-all duration-300`}>
            <IconComponent className="h-5 w-5 md:h-7 md:w-7" />
          </div>
          <span className={`rounded-full px-2.5 py-0.5 md:px-3.5 md:py-1 text-[10px] md:text-xs font-bold border ${topic.badgeColor}`}>
            {topic.badge}
          </span>
        </div>

        <div className="mt-4 md:mt-6">
          <p className="text-[10px] md:text-xs font-extrabold uppercase tracking-widest text-[#4E700F]">
            {topic.topicLabel}
          </p>
          <h3 className="mt-2 text-xl md:text-2xl lg:text-3xl font-black text-[#0D3A1D] leading-snug">
            {topic.title}
          </h3>
        </div>

        <div className={`mt-4 rounded-xl md:rounded-2xl border p-3 md:p-4 text-[11px] md:text-xs font-semibold leading-relaxed sm:text-sm ${topic.problemBg}`}>
          <span className={`font-extrabold ${topic.problemLabelColor}`}>Problem Solved: </span> 
          {topic.problemText}
        </div>

        <p className="mt-4 md:mt-5 text-xs md:text-sm font-medium leading-relaxed text-gray-600 sm:text-base sm:leading-7">
          {topic.desc}
        </p>

        <div className="mt-4 md:mt-6 space-y-2 md:space-y-2.5">
          {topic.features.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2.5">
              <FeatureIcon className="h-4 w-4 flex-shrink-0 text-[#93B733]" />
              <span className="text-[11px] md:text-xs font-bold text-[#0D3A1D] sm:text-sm">{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <Link
          to={topic.ctaLink}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#4E700F] transition-all group-hover:gap-3 group-hover:text-[#3e590c]"
        >
          {topic.ctaText}
          <ArrowRight className="h-4 w-4" />
        </Link>
        
        {topic.showPhoneCall && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
            <PhoneCall className="h-3.5 w-3.5 text-[#93B733]" />
            Direct Owner Line
          </div>
        )}
      </div>
    </div>
  );
});

const HomeServiceTopics = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [activeTopic, setActiveTopic] = useState(0);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const id = setInterval(() => setActiveTopic(p => (p === 0 ? 1 : 0)), 5000);
    return () => clearInterval(id);
  }, [isMobile]);

  const toggleTopic = useCallback(() => setActiveTopic(p => (p === 0 ? 1 : 0)), []);

  return (
    <section className="relative overflow-hidden bg-[#FAF9F5] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24 [content-visibility:auto] [contain-intrinsic-size:1px_800px]">
      <div className="absolute left-1/2 top-0 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-[#93B733]/20 blur-[60px]" />

      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#93B733]/20 bg-white px-4 py-1.5 shadow-sm">
            <Sparkles className="h-4 w-4 text-[#93B733]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#0D3A1D]">
              Problem-Solving Housing Tech
            </span>
          </div>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-[#0D3A1D] sm:text-4xl md:text-5xl">
            Why Students &amp; Owners <span className="text-[#4E700F]">Trust Dormn</span>
          </h2>
          <p className="mt-4 text-base font-medium leading-relaxed text-gray-600 sm:text-lg">
            We solve the core pain points of student accommodation—eliminating uncertainty and bridging communication gaps.
          </p>
        </div>

        {isMobile ? (
          <div className="relative mt-12 w-full flex flex-col items-center px-4">
            <button 
              onClick={toggleTopic}
              className="absolute left-[-10px] top-[40%] -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-gray-200/80 bg-white text-[#93B733] shadow-md active:scale-95 transition-all pointer-events-auto"
              aria-label="Previous Topic"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <div className="w-full overflow-hidden rounded-[2rem]">
              <div 
                className="flex transition-transform duration-500 ease-out w-full"
                style={{ transform: `translateX(-${activeTopic * 100}%)` }}
              >
                {topics.map(topic => (
                  <div key={topic.id} className="w-full flex-shrink-0 px-1">
                    <TopicCard topic={topic} />
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={toggleTopic}
              className="absolute right-[-10px] top-[40%] -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-gray-200/80 bg-white text-[#93B733] shadow-md active:scale-95 transition-all pointer-events-auto"
              aria-label="Next Topic"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            <div className="mt-6 flex gap-2">
              {topics.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTopic(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    activeTopic === idx ? "w-6 bg-[#93B733]" : "w-2.5 bg-gray-300"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:gap-10">
            {topics.map(topic => (
              <TopicCard key={topic.id} topic={topic} />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
};

export default memo(HomeServiceTopics);
