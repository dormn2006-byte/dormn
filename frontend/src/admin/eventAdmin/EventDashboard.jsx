import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Ticket,
  Users,
  Heart,
  Tag,
  IndianRupee,
  Calendar,
  Sparkles,
  Music,
  CalendarHeart,
  Plus,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Zap,
  Building2,
  MapPin,
  Eye,
  Edit3,
  BarChart3,
  Compass
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { getAdminEvents, getAdminCoupons, getAdminAttendees, computeEventAnalytics } from "../../services/eventAdminService";

const EventDashboard = () => {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setVersion((v) => v + 1);
    window.addEventListener("dormn_events_updated", handleUpdate);
    window.addEventListener("dormn_tickets_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("dormn_events_updated", handleUpdate);
      window.removeEventListener("dormn_tickets_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const events = useMemo(() => getAdminEvents(), [version]);
  const coupons = useMemo(() => getAdminCoupons(), [version]);
  const attendees = useMemo(() => getAdminAttendees(), [version]);

  // Quick monthly global analytics
  const analytics = useMemo(() => computeEventAnalytics("all", "month"), [version]);
  const { kpis, trendData, ticketDistributionData } = analytics;

  const upcomingShows = useMemo(() => {
    return events.slice(0, 4);
  }, [events]);

  const recentBookings = useMemo(() => {
    return attendees.slice(0, 6);
  }, [attendees]);

  return (
    <div className="space-y-7">
      
      {/* ─── Top Hero Banner ─── */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-r from-purple-950/80 via-[#120D26] to-[#0A0718] p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-xl bg-purple-500/20 border border-purple-500/30 px-3 py-1 text-xs font-black text-purple-300 mb-3">
              <Sparkles size={14} className="text-pink-400" />
              <span>DORMN EVENTS & NIGHTLIFE HQ</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              Live Concerts, Clubs & Events Control
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-gray-300 mt-2 max-w-2xl leading-relaxed">
              Managing <span className="text-pink-400 font-black">{events.length} Live Listings</span> across Concerts, Nightclubs, and Campus Fests with real-time pass issuance and automated coupon intelligence.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={() => navigate("/event-admin/experiences")}
              className="flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-3.5 text-xs font-black text-white backdrop-blur-md transition shadow-lg cursor-pointer"
            >
              <Compass size={16} className="text-purple-300" />
              <span>All Experiences ({events.length})</span>
            </button>
            <button
              onClick={() => navigate("/event-admin/analytics")}
              className="flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-3.5 text-xs font-black text-white backdrop-blur-md transition shadow-lg cursor-pointer"
            >
              <BarChart3 size={16} className="text-pink-400" />
              <span>Deep Analytics</span>
            </button>
          </div>
        </div>

        {/* Ambient shapes */}
        <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full bg-purple-500/20 blur-3xl pointer-events-none"></div>
      </div>

      {/* ─── 4 Quick KPI Summary Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Metric 1: Total Ticket Buyers */}
        <div
          onClick={() => navigate("/event-admin/analytics")}
          className="rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0C1220] p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-gray-400">Total Ticket Buyers</span>
            <div className="h-10 w-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
              <Ticket size={20} />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white">
            {kpis.totalTicketBuyers.toLocaleString("en-IN")}
          </div>
          <div className="mt-2 text-xs font-bold text-gray-400 flex items-center justify-between">
            <span>{kpis.totalAttendeesCount} headcount guests</span>
            <span className="text-emerald-500 font-extrabold">+18%</span>
          </div>
        </div>

        {/* Metric 2: Couples & Free Passes */}
        <div
          onClick={() => navigate("/event-admin/analytics")}
          className="rounded-3xl border border-purple-500/30 bg-purple-50/30 dark:bg-purple-950/10 p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Couple Passes
            </span>
            <div className="h-10 w-10 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
              <Heart size={20} className="fill-current" />
            </div>
          </div>
          <div className="text-3xl font-black text-purple-600 dark:text-purple-400">
            {kpis.coupleTickets.count}
          </div>
          <div className="mt-2 text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center justify-between">
            <span>{kpis.coupleTickets.freeEntries} Free Guestlist</span>
            <span className="text-purple-500 font-extrabold">₹{kpis.coupleTickets.revenue.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Metric 3: Active Coupons */}
        <div
          onClick={() => navigate("/event-admin/coupons")}
          className="rounded-3xl border border-pink-500/30 bg-pink-50/30 dark:bg-pink-950/10 p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-pink-600 dark:text-pink-400">
              Active Promo Codes
            </span>
            <div className="h-10 w-10 rounded-2xl bg-pink-500/10 text-pink-500 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
              <Tag size={20} />
            </div>
          </div>
          <div className="text-3xl font-black text-pink-600 dark:text-pink-400">
            {coupons.filter(c => c.status === "active").length} Codes
          </div>
          <div className="mt-2 text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center justify-between">
            <span>₹{kpis.totalDiscountsGiven.toLocaleString("en-IN")} saved</span>
            <span className="text-pink-500 font-extrabold">Manage →</span>
          </div>
        </div>

        {/* Metric 4: Total Gross Revenue */}
        <div
          onClick={() => navigate("/event-admin/analytics")}
          className="rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0C1220] p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-gray-400">Gross Ticket Sales</span>
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
              <IndianRupee size={20} />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white">
            ₹{kpis.totalGrossRevenue.toLocaleString("en-IN")}
          </div>
          <div className="mt-2 text-xs font-bold text-gray-400 flex items-center justify-between">
            <span>Avg ticket ₹{kpis.avgOrderValue}</span>
            <span className="text-emerald-500 font-extrabold">+24.6%</span>
          </div>
        </div>

      </div>

      {/* ─── 3 Direct Section Navigation Hubs (Events, Concerts, Clubs) ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Hub 1: Events */}
        <div
          onClick={() => navigate("/event-admin/events")}
          className="group relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-white dark:via-[#0C1220] to-transparent p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-black">
              <CalendarHeart size={24} />
            </div>
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
              <span>View All</span>
              <ArrowRight size={14} />
            </span>
          </div>
          <h3 className="text-lg font-black text-gray-900 dark:text-white">
            Events & Fests
          </h3>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1">
            College fests, standup comedy, technical summits & hackathons.
          </p>
          <div className="mt-4 pt-4 border-t border-emerald-500/10 flex items-center justify-between text-xs font-black">
            <span className="text-gray-400">Active Listings:</span>
            <span className="text-emerald-500">{events.filter(e => e.category === "events").length} Events</span>
          </div>
        </div>

        {/* Hub 2: Concerts */}
        <div
          onClick={() => navigate("/event-admin/concerts")}
          className="group relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-white dark:via-[#0C1220] to-transparent p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-2xl bg-purple-500/20 text-purple-500 flex items-center justify-center font-black">
              <Music size={24} />
            </div>
            <span className="text-xs font-black text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
              <span>View All</span>
              <ArrowRight size={14} />
            </span>
          </div>
          <h3 className="text-lg font-black text-gray-900 dark:text-white">
            Live Concerts & Arenas
          </h3>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1">
            Stadium shows, mega EDM tours, Bollywood fusion & artist tours.
          </p>
          <div className="mt-4 pt-4 border-t border-purple-500/10 flex items-center justify-between text-xs font-black">
            <span className="text-gray-400">Active Concerts:</span>
            <span className="text-purple-500">{events.filter(e => e.category === "concerts").length} Concerts</span>
          </div>
        </div>

        {/* Hub 3: Clubs & Nightlife */}
        <div
          onClick={() => navigate("/event-admin/clubs")}
          className="group relative overflow-hidden rounded-3xl border border-pink-500/20 bg-gradient-to-br from-pink-500/10 via-white dark:via-[#0C1220] to-transparent p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-2xl bg-pink-500/20 text-pink-500 flex items-center justify-center font-black">
              <Sparkles size={24} />
            </div>
            <span className="text-xs font-black text-pink-600 dark:text-pink-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
              <span>View All</span>
              <ArrowRight size={14} />
            </span>
          </div>
          <h3 className="text-lg font-black text-gray-900 dark:text-white">
            Clubs & Nightlife
          </h3>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1">
            DJ nights, guestlist RSVPs, couple free entries & VIP lounge tables.
          </p>
          <div className="mt-4 pt-4 border-t border-pink-500/10 flex items-center justify-between text-xs font-black">
            <span className="text-gray-400">Active Clubs:</span>
            <span className="text-pink-500">{events.filter(e => e.category === "clubs").length} Clubs</span>
          </div>
        </div>

      </div>

      {/* ─── Upcoming Shows Preview & Live Bookings Stream ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Featured Upcoming Shows */}
        <div className="rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0C1220] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-purple-500" />
              <h3 className="text-base font-black text-gray-900 dark:text-white">
                Featured Upcoming Gigs & Nights
              </h3>
            </div>
            <button
              onClick={() => navigate("/event-admin/events")}
              className="text-xs font-black text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
            >
              See All ({events.length}) →
            </button>
          </div>

          <div className="space-y-3">
            {upcomingShows.map((show) => (
              <div
                key={show.id}
                className="flex items-center gap-4 rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] p-3.5 hover:bg-gray-100/50 dark:hover:bg-white/[0.05] transition group"
              >
                <img
                  src={show.coverImage || show.bannerImage}
                  alt={show.title}
                  className="h-16 w-16 rounded-xl object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">
                      {show.category}
                    </span>
                    <span className="text-xs font-bold text-gray-400 truncate">
                      {show.city}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-gray-900 dark:text-white truncate mt-0.5">
                    {show.title}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold truncate">
                    {show.upcomingNight?.dateFormatted || "Upcoming Weekend"}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-emerald-500 block">
                    {typeof show.singlePrice === 'number' ? `₹${show.singlePrice}` : show.singlePrice}
                  </span>
                  <span className="text-[10px] font-bold text-purple-400">
                    Couple: {show.couplePrice}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Live Ticket Bookings Feed */}
        <div className="rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0C1220] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ticket size={18} className="text-pink-500" />
              <h3 className="text-base font-black text-gray-900 dark:text-white">
                Live Ticket Activity Log
              </h3>
            </div>
            <button
              onClick={() => navigate("/event-admin/attendees")}
              className="text-xs font-black text-pink-600 dark:text-pink-400 hover:underline cursor-pointer"
            >
              Full Attendee List →
            </button>
          </div>

          <div className="space-y-3">
            {recentBookings.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] p-3.5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                    b.ticketType === 'couple' ? 'bg-purple-500/20 text-purple-400' : b.ticketType === 'group' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {b.ticketType === 'couple' ? '👫' : b.ticketType === 'group' ? '👥' : '👤'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-gray-900 dark:text-white truncate">
                      {b.guestName}
                    </p>
                    <p className="text-[11px] font-bold text-gray-400 truncate">
                      {b.eventTitle} • <span className="capitalize">{b.ticketType} Pass</span>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-gray-900 dark:text-white block">
                    ₹{b.netAmount}
                  </span>
                  {b.couponCode && (
                    <span className="text-[10px] font-mono text-purple-500 font-bold">
                      {b.couponCode}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default EventDashboard;
