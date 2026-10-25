import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2, Video, CalendarHeart, Dumbbell, Bot, Sparkles,
  ArrowRight, LayoutDashboard, Mail,
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
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#F7F6F0] dark:bg-[#070A06] text-[#0D3A1D] dark:text-white font-sans overflow-x-hidden selection:bg-[#93B733] selection:text-white">
      {/* Soft brand gradients */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[34rem] w-[34rem] rounded-full bg-[#93B733]/25 blur-[120px]" />
        <div className="absolute top-1/3 -right-52 h-[30rem] w-[30rem] rounded-full bg-[#E56A54]/20 blur-[130px]" />
        <div className="absolute -bottom-52 left-1/4 h-[28rem] w-[28rem] rounded-full bg-[#0D3A1D]/20 blur-[120px]" />
      </div>

      <div>
        {/* Top bar */}
        <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src="/logo-sm.webp"
              alt="Dormn"
              className="h-9 w-9 object-contain transition-transform duration-300 group-hover:rotate-6"
            />
            <span className="text-xl font-black tracking-tight text-[#0D3A1D] dark:text-white">
              Dormn
            </span>
          </Link>

          <div className="flex items-center gap-2.5">
            {loggedIn ? (
              <button
                onClick={() => navigate(dashboardPathFor(user))}
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-[#0D3A1D] dark:border-white/20 bg-[#0D3A1D] dark:bg-white px-4 py-2 text-xs sm:text-sm font-black text-white dark:text-[#0D3A1D] transition hover:scale-[1.03] active:scale-95 cursor-pointer"
              >
                <LayoutDashboard size={15} />
                My Dashboard
              </button>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="hidden rounded-2xl border-2 border-gray-200 dark:border-white/15 bg-white dark:bg-white/5 px-4 py-2 text-xs sm:text-sm font-black text-[#0D3A1D] dark:text-white transition hover:border-gray-300 sm:inline-block"
                >
                  Sign In
                </Link>
                <button
                  onClick={() => navigate("/auth?mode=signup")}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#0D3A1D] dark:bg-white px-4 py-2 text-xs sm:text-sm font-black text-white dark:text-[#0D3A1D] shadow-[0_8px_20px_rgba(13,58,29,0.22)] transition hover:scale-[1.03] active:scale-95 cursor-pointer"
                >
                  <Sparkles size={14} />
                  Pre Register
                </button>
              </>
            )}
          </div>
        </header>

        {/* Hero */}
        <main className="relative z-10 mx-auto max-w-6xl px-5 pb-8 sm:px-8">
          <section className="pt-3 sm:pt-6 text-center">
            <h1
              style={{ fontFamily: "'Outfit', sans-serif" }}
              className="mx-auto max-w-3xl text-4xl font-black leading-[1.06] tracking-tight text-[#0D3A1D] dark:text-white sm:text-5xl md:text-6xl"
            >
              Next Gen Housing{" "}
              <span className="relative mt-1 inline-block">
                <span className="absolute inset-0 -rotate-1 rounded-2xl bg-[#93B733]" />
                <span className="relative inline-block -rotate-1 px-3.5 py-0.5 text-white">is coming</span>
              </span>{" "}
              to your city.
            </h1>

            {/* CTA */}
            <div className="mx-auto mt-6 max-w-md">
              <form onSubmit={handlePreRegister} className="flex flex-col gap-2.5 sm:flex-row">
                {!loggedIn && (
                  <div className="relative flex-1">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full rounded-2xl border-2 border-gray-200 dark:border-white/15 bg-white dark:bg-white/5 pl-10 pr-3.5 py-3 text-xs sm:text-sm font-semibold text-[#0D3A1D] dark:text-white placeholder:text-gray-400 outline-none transition focus:border-[#93B733]"
                    />
                  </div>
                )}
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0D3A1D] dark:bg-[#93B733] px-6 py-3 text-xs sm:text-sm font-black text-white dark:text-[#0D3A1D] shadow-[3px_3px_0px_#93B733] dark:shadow-[3px_3px_0px_rgba(255,255,255,0.15)] transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#93B733] cursor-pointer shrink-0"
                >
                  {loggedIn ? (
                    <>
                      <LayoutDashboard size={15} />
                      Go to My Dashboard
                    </>
                  ) : (
                    <>
                      Pre Register Now
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>

              {loggedIn ? (
                <div className="mt-3 flex items-center justify-center gap-3">
                  <Link
                    to="/dormgle"
                    className="inline-flex items-center gap-2 rounded-xl border-2 border-[#E56A54]/50 bg-[#E56A54]/10 px-3.5 py-1.5 text-xs font-black text-[#C24B33] dark:text-[#E56A54] transition hover:bg-[#E56A54] hover:text-white"
                  >
                    <Video size={13} />
                    Dormgle is live for you
                  </Link>
                </div>
              ) : (
                <p className="mt-2.5 text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Already registered?{" "}
                  <Link to="/auth" className="font-black text-[#0D3A1D] dark:text-[#93B733] underline underline-offset-2 hover:opacity-70">
                    Sign in to your dashboard
                  </Link>
                </p>
              )}
            </div>
          </section>

          {/* Feature preview */}
          <section className="mt-7 sm:mt-10">
            <div className="text-center mb-5">
              <h2 className="text-xl font-black tracking-tight sm:text-2xl">
                What&apos;s inside Dormn
              </h2>
              <p className="mt-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                Everything an early member gets the moment we open the doors.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
              {COMING_FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] p-4 backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:border-[#93B733]/50 hover:shadow-md"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0D3A1D] dark:bg-[#93B733] text-white dark:text-[#0D3A1D] transition-transform group-hover:scale-110">
                    <f.icon size={18} />
                  </div>
                  <h3 className="mt-3 text-xs sm:text-sm font-black">{f.title}</h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Dormgle live banner */}
            <div className="mt-6 flex flex-col items-center justify-between gap-3.5 rounded-2xl border-2 border-dashed border-[#93B733]/50 bg-[#93B733]/10 px-5 py-4 sm:flex-row sm:px-6">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#93B733] text-[#0D3A1D] shadow-[0_6px_16px_rgba(147,183,51,0.3)]">
                  <Video size={19} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-black">
                    Dormgle is LIVE during the wait.
                    {!loggedIn && " Sign in to use it."}
                  </p>
                  <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                    {loggedIn
                      ? "You're logged in — jump straight into a video chat."
                      : "Pre-registered users get instant access to random video chat."}
                  </p>
                </div>
              </div>
              <Link
                to={loggedIn ? "/dormgle" : "/auth?redirect=/dormgle"}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#0D3A1D] dark:bg-white px-5 py-2.5 text-xs font-black text-white dark:text-[#0D3A1D] transition hover:scale-[1.03] active:scale-95"
              >
                <Video size={14} />
                {loggedIn ? "Open Dormgle" : "Try Dormgle"}
              </Link>
            </div>
          </section>
        </main>
      </div>

      {/* Footer pinned cleanly at the bottom */}
      <footer className="relative z-10 w-full border-t border-gray-200/80 dark:border-white/10 bg-transparent mt-auto">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-4 sm:flex-row sm:px-8">
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