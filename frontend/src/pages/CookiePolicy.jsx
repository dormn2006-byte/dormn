import { Link } from "react-router-dom";
import PublicLayout from "../layouts/PublicLayout";
import Container from "../layouts/Container";
import { 
  Cookie, ShieldCheck, Sliders, Layers, Lock, 
  BarChart3, Sparkles, Globe, Settings, ExternalLink 
} from "lucide-react";

const CATEGORIES = [
  {
    title: "Strictly Necessary / Essential Cookies",
    badge: "Always Active",
    badgeColor: "bg-emerald-100 text-emerald-800",
    icon: Lock,
    iconColor: "text-[#0D3A1D]",
    desc: "Essential for secure authentication tokens, CSRF protection, and core room booking procedures. Without these, the platform cannot operate."
  },
  {
    title: "Functional & Preference Cookies",
    badge: "Configurable",
    badgeColor: "bg-blue-100 text-blue-800",
    icon: Settings,
    iconColor: "text-[#93B733]",
    desc: "Remembers your choices (dark/light mode, preferred city/college filter, and saved PG listings) for a personalized experience."
  },
  {
    title: "Analytics & Performance Cookies",
    badge: "Optional",
    badgeColor: "bg-amber-100 text-amber-800",
    icon: BarChart3,
    iconColor: "text-amber-500",
    desc: "Collects aggregate, anonymous statistics about page views and load speeds to help us improve platform responsiveness."
  },
  {
    title: "Marketing & Recommendation Cookies",
    badge: "Optional",
    badgeColor: "bg-purple-100 text-purple-800",
    icon: Sparkles,
    iconColor: "text-purple-500",
    desc: "Provides tailored PG recommendations, student community events (concerts, socials), and exclusive move-in discounts."
  }
];

const STORAGE_ROWS = [
  { key: "dormn_token / token", type: "LocalStorage / Cookie", category: "Essential", catColor: "text-emerald-700", duration: "30 Days", purpose: "Maintains secure authenticated session for students and property owners." },
  { key: "dormn_cookie_consent", type: "LocalStorage", category: "Essential", catColor: "text-emerald-700", duration: "1 Year", purpose: "Remembers your cookie consent choice and category preferences." },
  { key: "theme / dormn_theme", type: "LocalStorage", category: "Functional", catColor: "text-blue-700", duration: "Persistent", purpose: "Stores your Dark Mode or Light Mode interface display choice." },
  { key: "dormn_saved_pgs", type: "LocalStorage", category: "Functional", catColor: "text-blue-700", duration: "Persistent", purpose: "Allows quick access to bookmarked and shortlisted hostel properties." },
  { key: "razorpay_order_*", type: "SessionStorage", category: "Essential", catColor: "text-emerald-700", duration: "Session", purpose: "Facilitates secure checkout and real-time rent & deposit transactions." }
];

export default function CookiePolicy() {
  const openPreferences = () => {
    window.dispatchEvent(new CustomEvent('dormn_open_cookie_preferences'));
  };

  return (
    <PublicLayout>
      <div className="bg-[#FAF9F5] min-h-screen py-10 sm:py-14 lg:py-20 font-sans selection:bg-[#93B733] selection:text-white">
        <Container className="max-w-5xl xl:max-w-6xl px-4 sm:px-6 md:px-8 lg:px-10">
          
          {/* Header Banner */}
          <div className="rounded-[2.5rem] bg-[#0D3A1D] p-8 sm:p-12 text-white shadow-xl mb-10 relative overflow-hidden">
            <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#93B733]/25 blur-[4rem]" />
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-md mb-4 text-xs font-bold uppercase tracking-wider text-[#93B733]">
                <Cookie size={14} /> Tracking &amp; Cookie Compliance
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">Cookie Policy</h1>
              <p className="mt-2 text-xs font-semibold text-[#93B733] uppercase tracking-wider">Last updated: January 1, 2026</p>
              <p className="mt-4 text-sm sm:text-base text-gray-300 leading-relaxed font-medium">
                This Cookie Policy explains how Dormn (&quot;We&quot;, &quot;Us&quot;, or &quot;Our&quot;) uses cookies, local storage, and similar technologies to recognize you, improve your experience, and safeguard your data.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={openPreferences}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#93B733] hover:bg-[#82a32d] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Sliders size={15} /> Manage Cookie Preferences
                </button>
                <Link
                  to="/privacy"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-5 py-2.5 text-xs font-bold text-white transition-all"
                >
                  <ShieldCheck size={15} /> View Privacy Policy
                </Link>
              </div>
            </div>
          </div>

          {/* Body Sections */}
          <div className="space-y-8">
            
            {/* 1. What Are Cookies */}
            <section className="rounded-[2.5rem] border-2 border-gray-100 bg-white p-6 sm:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#93B733]/15 text-[#93B733]"><Cookie size={20} /></div>
                <h2 className="text-2xl font-black text-[#0D3A1D]">1. What Are Cookies &amp; Local Storage?</h2>
              </div>
              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-gray-600 font-medium">
                <p>
                  Cookies are small data files placed on your computer or mobile device when you visit a website. In addition to HTTP cookies, Dormn utilizes modern browser storage mechanisms such as <strong>LocalStorage</strong> and <strong>SessionStorage</strong> to store your preferences (such as theme choice, active property filters, and temporary booking drafts) securely and quickly.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-xs sm:text-sm">
                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                    <strong className="text-[#0D3A1D] block mb-1">First-Party Cookies:</strong> Set directly by Dormn to authenticate your identity and keep you logged in.
                  </div>
                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                    <strong className="text-[#0D3A1D] block mb-1">Third-Party Cookies:</strong> Set by trusted partners (Razorpay for payments and mapping tools for location accuracy).
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Categories */}
            <section className="rounded-[2.5rem] border-2 border-gray-100 bg-white p-6 sm:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#93B733]/15 text-[#93B733]"><Layers size={20} /></div>
                <h2 className="text-2xl font-black text-[#0D3A1D]">2. Categories of Cookies We Use</h2>
              </div>
              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-gray-600 font-medium">
                <p>We classify all tracking storage on our platform into four categories:</p>
                <div className="space-y-3.5 mt-3">
                  {CATEGORIES.map(({ title, badge, badgeColor, icon: Icon, iconColor, desc }) => (
                    <div key={title} className="p-5 rounded-2xl bg-gray-50 border border-gray-200/80">
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-1.5">
                        <div className="flex items-center gap-2 text-[#0D3A1D]">
                          <Icon size={18} className={iconColor} />
                          <h3 className="text-base font-black">{title}</h3>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase ${badgeColor}`}>
                          {badge}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 3. Technical Breakdown */}
            <section className="rounded-[2.5rem] border-2 border-gray-100 bg-white p-6 sm:p-10 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#93B733]/15 text-[#93B733]"><Globe size={20} /></div>
                <h2 className="text-2xl font-black text-[#0D3A1D]">3. Technical Storage Breakdown</h2>
              </div>
              <p className="text-sm text-gray-600 font-medium mb-4">
                Summary of key cookies and local storage tokens utilized across the Dormn platform:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-100 bg-gray-50 text-[#0D3A1D] font-black">
                      <th className="py-3 px-4 rounded-l-xl">Cookie / Storage Key</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Duration</th>
                      <th className="py-3 px-4 rounded-r-xl">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                    {STORAGE_ROWS.map(({ key, type, category, catColor, duration, purpose }) => (
                      <tr key={key}>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#0D3A1D]">{key}</td>
                        <td className="py-3.5 px-4">{type}</td>
                        <td className="py-3.5 px-4"><span className={`font-bold ${catColor}`}>{category}</span></td>
                        <td className="py-3.5 px-4">{duration}</td>
                        <td className="py-3.5 px-4">{purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 4. Control */}
            <section className="rounded-[2.5rem] border-2 border-gray-100 bg-white p-6 sm:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#93B733]/15 text-[#93B733]"><Sliders size={20} /></div>
                <h2 className="text-2xl font-black text-[#0D3A1D]">4. How You Can Manage &amp; Reject Cookies</h2>
              </div>
              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-gray-600 font-medium">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="p-5 rounded-2xl bg-[#0D3A1D]/5 border border-[#0D3A1D]/10">
                    <h4 className="font-extrabold text-[#0D3A1D] mb-2 flex items-center gap-2">
                      <Sliders size={16} className="text-[#93B733]" /> Via Dormn Preference Center
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 mb-3">
                      Use our interactive slide modal to enable or disable functional, analytics, and marketing categories anytime.
                    </p>
                    <button
                      onClick={openPreferences}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D3A1D] bg-[#93B733]/20 hover:bg-[#93B733]/30 px-3 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      Open Preferences Slide <ExternalLink size={12} />
                    </button>
                  </div>
                  <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100">
                    <h4 className="font-extrabold text-[#0D3A1D] mb-2 flex items-center gap-2">
                      <Globe size={16} className="text-blue-500" /> Via Your Web Browser
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Most web browsers (Chrome, Safari, Firefox, Edge) allow blocking or deleting cookies through browser settings. Disabling essential cookies may impact log in functionality.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. Contact */}
            <section className="rounded-[2.5rem] border-2 border-gray-100 bg-white p-6 sm:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#93B733]/15 text-[#93B733]"><ShieldCheck size={20} /></div>
                <h2 className="text-2xl font-black text-[#0D3A1D]">5. Policy Updates &amp; Contact</h2>
              </div>
              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-gray-600 font-medium">
                <p>We may update this policy periodically to reflect operational, legal, or regulatory changes.</p>
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs sm:text-sm space-y-1">
                  <p><strong>Operated by:</strong> Annapurna Hostels (Dormn Platform)</p>
                  <p><strong>Email:</strong> support@dormn.in &bull; <strong>Helpline:</strong> +91 96675 55201</p>
                  <p><strong>Location:</strong> Uttar Pradesh, India</p>
                </div>
              </div>
            </section>

          </div>
        </Container>
      </div>
    </PublicLayout>
  );
}
