import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2, Video, CalendarHeart, Dumbbell, Bot, Sparkles,
  ArrowRight, LayoutDashboard, Mail, ShieldCheck, Users, Star,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { hasFullAccess, dashboardPathFor } from "../config/accessControl";

const COMING_FEATURES = [
  { icon: Building2, title: "Verified PGs", desc: "Curated, verified paying guest stays in Noida & beyond." },
  { icon: Video, title: "Dormgle", desc: "Random video chat with residents — live for early members right now." },
  { icon: CalendarHeart, title: "Events & Clubs", desc: "Concerts, club nights and campus happenings." },
  { icon: Dumbbell, title: "Fitness & Gym", desc: "In-PG gyms and wellness member perks." },
  { icon: Bot, title: "Dr. Dormn", desc: "Your AI housing & lifestyle assistant." },
];

const STATS = [
  { icon: Users, label: "Pre-registered members", value: "Early Access" },
  { icon: ShieldCheck, label: "Verified properties", value: "Onboarding" },
  { icon: Star, label: "Resident community", value: "Growing" },
];

const ComingSoon = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const fullAccess = hasFullAccess(user);
  const loggedIn = Boolean(user && !fullAccess);

  // Full-access users (master account / superadmin) should never land here.
  if (fullAccess) {
    return null;
  }

  const handlePreRegister = (e) => {
    e?.preventDefault();
    // Logged-in (pre-registered) members go straight to their dashboard.
    if (loggedIn) {
      navigate(dashboardPathFor(user));
      return;
    }
    const target = `/auth?mode=signup${email ? `&prefill=${encodeURIComponent(email)}` : ""}`;
    navigate(target);
  };

  return (
    <div className="min-h-screen w-full bg-[#F7F6F0] dark:bg-[#070A06] text-[#0D3A1D] dark:text-white font-sans overflow-x-hidden selection:bg-[#93B733] selection:text-white">
      {/* Soft brand gradients */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[34rem] w-[34rem] rounded-full bg-[#93B733]/25 blur-[120px]" />
        <div className="absolute top-1/3 -right-52 h-[30rem] w-[30rem] rounded-full bg-[#E56A54]/20 blur-[130px]" />
        <div className="absolute -bottom-52 left-1/4 h-[28rem] w-[28rem] rounded-full bg-[#0D3A1D]/20 blur-[120px]" />
      </div>

      {/* Top bar */}
      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5 group">
          <img
            src="/logo-sm.webp"
            alt="Dormn"
            className="h-10 w-10 object-contain transition-transform duration-300 group-hover:rotate-6"
          />
          <span className="text-xl font-black tracking-tight text-[#0D3A1D] dark:text-white">
            Dormn
          </span>
        </Link>

        <div className="flex items-center gap-2.5">
          {loggedIn ? (
            <button
              onClick={() => navigate(dashboardPathFor(user))}
              className="inline-flex items-center gap-2 rounded-2xl border-2 border-[#0D3A1D] dark:border-white/20 bg-[#0D3A1D] dark:bg-white px-5 py-2.5 text-sm font-black text-white dark:text-[#0D3A1D] transition hover:scale-[1.03] active:scale-95 cursor-pointer"
            >
              <LayoutDashboard size={16} />
              My Dashboard
            </button>
          ) : (
            <>
              <Link
                to="/auth"
                className="hidden rounded-2xl border-2 border-gray-200 dark:border-white/15 bg-white dark:bg-white/5 px-5 py-2.5 text-sm font-black text-[#0D3A1D] dark:text-white transition hover:border-gray-300 sm:inline-block"
              >
                Sign In
              </Link>
              <button
                onClick={() => navigate("/auth?mode=signup")}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#0D3A1D] dark:bg-white px-5 py-2.5 text-sm font-black text-white dark:text-[#0D3A1D] shadow-[0_10px_24px_rgba(13,58,29,0.25)] transition hover:scale-[1.03] active:scale-95 cursor-pointer"
              >
                <Sparkles size={15} />
                Pre Register
              </button>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 mx-auto max-w-6xl px-5 pb-14 sm:px-8">
        <section className="pt-8 sm:pt-14 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#93B733]/40 bg-[#93B733]/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#4E700F] dark:text-[#93B733]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#93B733] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#93B733]" />
            </span>
            Coming Soon
          </span>

          <h1
            style={{ fontFamily: "'Outfit', sans-serif" }}
            className="mx-auto mt-6 max-w-3xl text-5xl font-black leading-[1.04] tracking-tight text-[#0D3A1D] dark:text-white sm:text-6xl md:text-7xl"
          >
            Next Gen Housing{" "}
            <span className="relative mt-2 inline-block">
              <span className="absolute inset-0 -rotate-1 rounded-2xl bg-[#93B733]" />
              <span className="relative inline-block -rotate-1 px-4 py-1 text-white">is coming</span>
            </span>{" "}
            to your city.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base font-medium leading-relaxed text-gray-600 dark:text-gray-300 sm:text-lg">
            Verified PGs, a live video-chat resident community, events and more — Dormn is
            launching soon. Pre-register now to get early access before everyone else.
          </p>

          {/* CTA */}
          <div className="mx-auto mt-9 max-w-md">
            <form onSubmit={handlePreRegister} className="flex flex-col gap-3 sm:flex-row">
              {!loggedIn && (
                <div className="relative flex-1">
                  <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full rounded-2xl border-2 border-gray-200 dark:border-white/15 bg-white dark:bg-white/5 pl-11 pr-4 py-3.5 text-sm font-semibold text-[#0D3A1D] dark:text-white placeholder:text-gray-400 outline-none transition focus:border-[#93B733]"
                  />
                </div>
              )}
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0D3A1D] dark:bg-[#93B733] px-7 py-3.5 text-sm font-black text-white dark:text-[#0D3A1D] shadow-[4px_4px_0px_#93B733] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.15)] transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#93B733] cursor-pointer"
              >
                {loggedIn ? (
                  <>
                    <LayoutDashboard size={16} />
                    Go to My Dashboard
                  </>
                ) : (
                  <>
                    Pre Register Now
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {loggedIn ? (
              <div className="mt-4 flex items-center justify-center gap-3">
                <Link
                  to="/dormgle"
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-[#E56A54]/50 bg-[#E56A54]/10 px-4 py-2 text-xs font-black text-[#C24B33] dark:text-[#E56A54] transition hover:bg-[#E56A54] hover:text-white"
                >
                  <Video size={14} />
                  Dormgle is live for you
                </Link>
              </div>
            ) : (
              <p className="mt-4 text-xs font-semibold text-gray-500 dark:text-gray-400">
                Already registered?{" "}
                <Link to="/auth" className="font-black text-[#0D3A1D] dark:text-[#93B733] underline underline-offset-2 hover:opacity-70">
                  Sign in to your dashboard
                </Link>
              </p>
            )}
          </div>

          {/* Social proof */}
          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-3 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] px-4 py-3.5 backdrop-blur"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#93B733]/15 text-[#4E700F] dark:text-[#93B733]">
                  <s.icon size={18} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-black leading-tight">{s.value}</p>
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Feature preview */}
        <section className="mt-14 sm:mt-20">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
              What&apos;s inside Dormn
            </h2>
            <p className="mt-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
              Everything an early member gets the moment we open the doors.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
            {COMING_FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] p-5 backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:border-[#93B733]/50 hover:shadow-lg"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0D3A1D] dark:bg-[#93B733] text-white dark:text-[#0D3A1D] transition-transform group-hover:scale-110">
                  <f.icon size={20} />
                </div>
                <h3 className="mt-4 text-sm font-black">{f.title}</h3>
                <p className="mt-1.5 text-xs font-medium leading-relaxed text-gray-500 dark:text-gray-400">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Dormgle live banner */}
          <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-3xl border-2 border-dashed border-[#93B733]/50 bg-[#93B733]/10 px-6 py-6 sm:flex-row sm:px-8">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#93B733] text-[#0D3A1D] shadow-[0_8px_20px_rgba(147,183,51,0.35)]">
                <Video size={22} />
              </div>
              <div>
                <p className="text-sm font-black sm:text-base">
                  Dormgle is LIVE during the wait.
                  {!loggedIn && " Sign in to use it."}
                </p>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {loggedIn
                    ? "You're logged in — jump straight into a video chat."
                    : "Pre-registered users get instant access to random video chat."}
                </p>
              </div>
            </div>
            <Link
              to={loggedIn ? "/dormgle" : "/auth?redirect=/dormgle"}
              className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-[#0D3A1D] dark:bg-white px-6 py-3 text-sm font-black text-white dark:text-[#0D3A1D] transition hover:scale-[1.03] active:scale-95"
            >
              <Video size={15} />
              {loggedIn ? "Open Dormgle" : "Try Dormgle"}
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-200/80 dark:border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-7 sm:flex-row sm:px-8">
          <div className="flex items-center gap-2">
            <img src="/logo-sm.webp" alt="Dormn" className="h-6 w-6 object-contain" />
            <span className="text-xs font-black text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} Dormn. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-5 text-xs font-bold text-gray-500 dark:text-gray-400">
            <Link to="/about" className="hover:text-[#0D3A1D] dark:hover:text-white transition">About</Link>
            <Link to="/faqs" className="hover:text-[#0D3A1D] dark:hover:text-white transition">FAQs</Link>
            <Link to="/contact" className="hover:text-[#0D3A1D] dark:hover:text-white transition">Contact</Link>
            <Link to="/terms-and-conditions" className="hover:text-[#0D3A1D] dark:hover:text-white transition">Terms</Link>
            <Link to="/privacy-policy" className="hover:text-[#0D3A1D] dark:hover:text-white transition">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ComingSoon;