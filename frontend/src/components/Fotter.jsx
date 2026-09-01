import { useState } from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, Send, CheckCircle2, ShieldCheck } from "lucide-react";

const quickLinks = [
  { name: "Home", path: "/" },
  { name: "Explore PGs", path: "/pgs" },
  { name: "About Us", path: "/about" },
  { name: "FAQs", path: "/faqs" },
  { name: "Contact Support", path: "/contact" },
];

const legalAndOwnerLinks = [
  { name: "Privacy Policy", path: "/privacy" },
  { name: "Terms & Conditions", path: "/terms" },
  { name: "Student Portal", path: "/auth?role=student" },
  { name: "Owner Portal", path: "/auth?role=owner" },
];

const Footer = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#07130B] text-white font-sans pb-20 lg:pb-0">
      {/* Background Brand Glows */}
      <div className="absolute left-[-100px] top-[-100px] h-96 w-96 rounded-full bg-[#93B733]/15 blur-[100px] pointer-events-none" />
      <div className="absolute right-[-100px] bottom-[-100px] h-96 w-96 rounded-full bg-[#93B733]/10 blur-[120px] pointer-events-none" />

      <div className="relative mx-auto max-w-[1440px] 2xl:max-w-[1600px] px-4 pt-12 sm:px-6 md:px-8 lg:px-10 sm:pt-16 lg:pt-16">

        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 gap-10 border-b border-white/10 pb-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          
          {/* Column 1: Brand & Contact Info */}
          <div className="lg:col-span-4 space-y-4">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <img
                src="/logo-sm.webp"
                alt="Dormn Logo"
                className="h-12 w-12 object-contain transition-transform duration-300 group-hover:rotate-6"
                loading="lazy"
                decoding="async"
              />
              <div>
                <h2 className="text-2xl font-black tracking-tight text-white">
                  Dormn
                </h2>
                <p className="text-xs font-bold uppercase tracking-widest text-[#93B733]">
                  Next-Gen Housing Platform
                </p>
              </div>
            </Link>

            <p className="text-xs sm:text-sm leading-relaxed text-gray-300 font-medium max-w-sm">
              Simplifying student and professional accommodation discovery with verified PG listings, zero brokerage friction, and direct owner connections.
            </p>

            <div className="space-y-2 pt-1 text-xs font-semibold text-gray-300">
              <a
                href="https://wa.me/919667555201"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 transition hover:text-[#93B733]"
              >
                <Phone size={16} className="text-[#93B733]" />
                <span>+91 96675 55201</span>
              </a>
              <a
                href="mailto:support@dormn.in"
                className="flex items-center gap-2.5 transition hover:text-[#93B733]"
              >
                <Mail size={16} className="text-[#93B733]" />
                <span>support@dormn.in</span>
              </a>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-2.5 pt-2">
              {[
                {
                  name: "Instagram",
                  href: "https://www.instagram.com/dormnofficial?igsh=aDh5b3dkYjdoZXN4",
                  icon: (
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg" 
                      alt="Instagram" 
                      className="h-[18px] w-[18px] object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  ),
                },
                {
                  name: "LinkedIn",
                  href: "https://www.linkedin.com/in/dormn-nexus-84139b426",
                  icon: (
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" 
                      alt="LinkedIn" 
                      className="h-[18px] w-[18px] object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  ),
                },
                {
                  name: "Twitter",
                  href: "https://x.com/DormnOfficial",
                  icon: (
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/c/ce/X_logo_2023.svg" 
                      alt="Twitter" 
                      className="h-[18px] w-[18px] object-contain invert"
                      loading="lazy"
                      decoding="async"
                    />
                  ),
                },
              ].map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.name}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 backdrop-blur-md transition-all hover:scale-110 hover:border-[#93B733]/40 hover:bg-[#93B733] hover:text-white"
                >
                  {item.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Middle Columns Wrapper (Side-by-side on mobile) */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-4 sm:gap-8">
            {/* Column 2: Quick Links */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#93B733]">
                Quick Links
              </h3>
              <ul className="space-y-2.5 text-xs sm:text-sm font-semibold">
                {quickLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className="text-gray-300 transition-all hover:text-[#93B733] hover:translate-x-1 inline-block"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Legal & Portals */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#93B733]">
                Legal &amp; Portals
              </h3>
              <ul className="space-y-2.5 text-xs sm:text-sm font-semibold">
                {legalAndOwnerLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className="text-gray-300 transition-all hover:text-[#93B733] hover:translate-x-1 inline-block"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Column 4: Subscribe to Email Updates */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#93B733]">
              Subscribe For Updates
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 font-medium leading-relaxed">
              Subscribe to get new updates of email, new PG listings, and exclusive student offers.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-3 pt-1">
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-xs font-semibold text-white placeholder-gray-400 outline-none backdrop-blur-md transition-all focus:border-[#93B733] focus:bg-white/10"
                />
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#93B733] px-5 py-3 text-xs font-black uppercase tracking-wider text-white shadow-md transition-all hover:bg-[#82a32d] hover:scale-[1.02] active:scale-[0.98]"
              >
                <Send size={14} />
                Subscribe
              </button>
            </form>

            {subscribed && (
              <div className="flex items-center gap-2 rounded-xl bg-[#93B733]/20 border border-[#93B733]/40 p-3 text-xs font-bold text-[#93B733]">
                <CheckCircle2 size={16} /> Subscribed successfully!
              </div>
            )}
          </div>

        </div>

        {/* Bottom Copyright Footer */}
        <div className="py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-semibold text-gray-400">
          <p>© 2026 Dormn. All rights reserved. Built for students &amp; property owners.</p>
          
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center sm:justify-end">
            <Link to="/privacy" className="hover:text-white transition">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-white transition">
              Terms &amp; Conditions
            </Link>
            <span>•</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#93B733]/15 border border-[#93B733]/30 px-2.5 py-0.5 text-[11px] font-bold text-[#93B733]">
              <ShieldCheck size={13} /> Verified
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;