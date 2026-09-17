import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  TrendingUp,
  Ticket,
  Users,
  Heart,
  Users2,
  Tag,
  IndianRupee,
  Calendar,
  ChevronDown,
  Sparkles,
  BarChart3,
  PieChart as PieChartIcon,
  Check,
  Copy,
  Clock
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { getAdminEvents, computeEventAnalytics } from "../../services/eventAdminService";

const TIMEFRAME_OPTIONS = [
  { id: "day", label: "Today (24 Hours)", icon: Clock },
  { id: "week", label: "This Week (7 Days)", icon: Calendar },
  { id: "month", label: "This Month (30 Days)", icon: Calendar },
  { id: "year", label: "This Year (12 Months)", icon: TrendingUp }
];

const EventAnalytics = () => {
  const [searchParams] = useSearchParams();
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
  const initialEntity = searchParams.get("eventId") || searchParams.get("entity") || "all";
  const [selectedEntity, setSelectedEntity] = useState(initialEntity);

  useEffect(() => {
    const fromUrl = searchParams.get("eventId") || searchParams.get("entity");
    if (fromUrl) setSelectedEntity(fromUrl);
  }, [searchParams]);

  const [selectedTimeframe, setSelectedTimeframe] = useState("month");
  const [isEntityDropdownOpen, setIsEntityDropdownOpen] = useState(false);
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(null);

  const analytics = useMemo(() => {
    return computeEventAnalytics(selectedEntity, selectedTimeframe);
  }, [selectedEntity, selectedTimeframe, version]);

  const { kpis, trendData, ticketDistributionData, couponsList } = analytics;

  const handleCopyCoupon = (code) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCoupon(code);
      setTimeout(() => setCopiedCoupon(null), 2000);
    }
  };

  const currentEntityLabel = useMemo(() => {
    if (selectedEntity === "all") return "All Listings & Shows (Global)";
    if (selectedEntity === "category:events") return "All Events & Fests";
    if (selectedEntity === "category:concerts") return "All Live Concerts";
    if (selectedEntity === "category:clubs") return "All Clubs & Nightlife";
    const found = events.find(e => e.id === selectedEntity);
    return found ? `${found.title} (${found.category})` : "Selected Show";
  }, [selectedEntity, events]);

  const currentTimeframeLabel = useMemo(() => {
    return TIMEFRAME_OPTIONS.find(t => t.id === selectedTimeframe)?.label || "This Month";
  }, [selectedTimeframe]);

  return (
    <div className="space-y-7">
      {/* Top Header & Dual Dropdowns */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white/95 dark:bg-[#0C1220]/95 backdrop-blur-2xl p-5 md:p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white text-sm font-black shadow-md">
              📊
            </div>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              Event Intelligence & Sales Analytics
            </h2>
          </div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1">
            Real-time ticket volume, couple & group bookings, and promo code conversion tracking.
          </p>
        </div>

        {/* Dual Dropdowns */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Entity Selector */}
          <div className="relative">
            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">
              Select Venue / Show
            </label>
            <button
              onClick={() => { setIsEntityDropdownOpen(!isEntityDropdownOpen); setIsTimeDropdownOpen(false); }}
              className="flex items-center justify-between gap-3 min-w-[240px] rounded-2xl border border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/20 px-4 py-3 text-xs font-black text-purple-900 dark:text-purple-200 hover:border-purple-500 shadow-sm transition cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <Sparkles size={16} className="text-purple-600 dark:text-purple-400 shrink-0" />
                <span className="truncate">{currentEntityLabel}</span>
              </div>
              <ChevronDown size={16} className={`text-purple-500 transition-transform ${isEntityDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {isEntityDropdownOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsEntityDropdownOpen(false)}></div>
                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 max-h-96 overflow-y-auto rounded-3xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#111728] p-2 shadow-2xl z-30 backdrop-blur-2xl divide-y divide-gray-100 dark:divide-white/5 scrollbar-thin">
                  <div className="py-1">
                    {[
                      { id: "all", label: "🌟 All Listings & Shows (Global)" },
                      { id: "category:events", label: "🎟️ All Events & Fests" },
                      { id: "category:concerts", label: "🎸 All Live Concerts" },
                      { id: "category:clubs", label: "🍸 All Clubs & Nightlife" }
                    ].map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => { setSelectedEntity(cat.id); setIsEntityDropdownOpen(false); }}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-black flex items-center justify-between transition cursor-pointer ${
                          selectedEntity === cat.id ? "bg-purple-600 text-white" : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5"
                        }`}
                      >
                        <span>{cat.label}</span>
                        {selectedEntity === cat.id && <Check size={14} />}
                      </button>
                    ))}
                  </div>

                  <div className="py-2 space-y-1">
                    <span className="px-3 text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                      Individual Venues & Shows
                    </span>
                    {events.map((ev) => (
                      <button
                        key={ev.id}
                        onClick={() => { setSelectedEntity(ev.id); setIsEntityDropdownOpen(false); }}
                        className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                          selectedEntity === ev.id ? "bg-purple-600 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                        }`}
                      >
                        <div className="truncate pr-2">
                          <span className="block font-black truncate">{ev.title}</span>
                          <span className={`text-[10px] ${selectedEntity === ev.id ? "text-purple-200" : "text-gray-400"}`}>
                            {ev.city} • {ev.category}
                          </span>
                        </div>
                        {selectedEntity === ev.id && <Check size={14} className="shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Timeframe Selector */}
          <div className="relative">
            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">
              Timeframe Filter
            </label>
            <button
              onClick={() => { setIsTimeDropdownOpen(!isTimeDropdownOpen); setIsEntityDropdownOpen(false); }}
              className="flex items-center justify-between gap-3 min-w-[190px] rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111728] px-4 py-3 text-xs font-black text-gray-900 dark:text-white hover:border-gray-400 shadow-sm transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-pink-500" />
                <span>{currentTimeframeLabel}</span>
              </div>
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${isTimeDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {isTimeDropdownOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setIsTimeDropdownOpen(false)}></div>
                <div className="absolute right-0 top-full mt-2 w-56 rounded-3xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#111728] p-2 shadow-2xl z-30 backdrop-blur-2xl">
                  {TIMEFRAME_OPTIONS.map((opt) => {
                    const OptIcon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => { setSelectedTimeframe(opt.id); setIsTimeDropdownOpen(false); }}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-black flex items-center justify-between transition cursor-pointer ${
                          selectedTimeframe === opt.id ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <OptIcon size={14} />
                          <span>{opt.label}</span>
                        </div>
                        {selectedTimeframe === opt.id && <Check size={14} />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Ticket Buyers */}
        <div className="rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0C1220] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase tracking-wider text-gray-400">Total Ticket Buyers</span>
            <div className="h-10 w-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-black">
              <Ticket size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900 dark:text-white">{kpis.totalTicketBuyers.toLocaleString("en-IN")}</span>
            <span className="text-xs font-bold text-gray-400">({kpis.totalAttendeesCount} people)</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-black text-emerald-500">
            <TrendingUp size={14} />
            <span>+18.4% vs previous {selectedTimeframe}</span>
          </div>
        </div>

        {/* Couple Passes */}
        <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">Couple Passes</span>
            <div className="h-10 w-10 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-black">
              <Heart size={20} className="fill-current" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-600 dark:text-purple-400">{kpis.coupleTickets.count}</span>
            <span className="text-xs font-bold text-purple-400">({kpis.coupleTickets.attendeesCount} guests)</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-black text-gray-500 dark:text-gray-400">
            <span>₹{kpis.coupleTickets.revenue.toLocaleString("en-IN")} rev</span>
            <span className="text-emerald-500">{kpis.coupleTickets.freeEntries} Free passes</span>
          </div>
        </div>

        {/* Group Passes */}
        <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Group Passes (4+ Pax)</span>
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black">
              <Users2 size={20} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{kpis.groupTickets.count}</span>
            <span className="text-xs font-bold text-emerald-500">({kpis.groupTickets.attendeesCount} pax total)</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-black text-gray-500 dark:text-gray-400">
            <span>Avg ~{kpis.groupTickets.avgGroupSize} per pack</span>
            <span className="text-emerald-500 font-extrabold">₹{kpis.groupTickets.revenue.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Net Revenue */}
        <div className="rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0C1220] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase tracking-wider text-gray-400">Net Revenue Earned</span>
            <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black">
              <IndianRupee size={20} />
            </div>
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white">
            ₹{kpis.totalGrossRevenue.toLocaleString("en-IN")}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-black">
            <span className="text-rose-500">₹{kpis.totalDiscountsGiven.toLocaleString("en-IN")} discounts</span>
            <span className="text-gray-400">AOV ₹{kpis.avgOrderValue}</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0C1220] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-purple-500" />
                <h3 className="text-base font-black text-gray-900 dark:text-white">Ticket Sales & Revenue Velocity</h3>
              </div>
              <p className="text-xs font-semibold text-gray-400 mt-0.5">
                Timeline for <span className="text-purple-500 font-bold">{currentTimeframeLabel}</span>
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-purple-500"></span><span>Revenue</span></div>
              <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-pink-500"></span><span>Tickets</span></div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EC4899" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#EC4899" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#88888820" vertical={false} />
                <XAxis dataKey="label" stroke="#888888" fontSize={11} fontWeight={700} tickLine={false} />
                <YAxis stroke="#888888" fontSize={11} fontWeight={700} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#0c1220", borderColor: "rgba(255,255,255,0.15)", borderRadius: "1rem", color: "#fff", fontWeight: 700 }} />
                <Area type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue (₹)" />
                <Area type="monotone" dataKey="tickets" stroke="#EC4899" strokeWidth={2} fillOpacity={1} fill="url(#colorTickets)" name="Tickets Sold" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Split */}
        <div className="rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0C1220] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PieChartIcon size={18} className="text-pink-500" />
              <h3 className="text-base font-black text-gray-900 dark:text-white">Ticket Type Breakdown</h3>
            </div>
            <p className="text-xs font-semibold text-gray-400">Single vs Couple vs Group distribution</p>
          </div>

          <div className="h-52 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={ticketDistributionData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={5} dataKey="value">
                  {ticketDistributionData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#0c1220", borderRadius: "1rem", borderColor: "rgba(255,255,255,0.15)", color: "#fff", fontWeight: 700 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-white/10">
            {ticketDistributionData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                  <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                </div>
                <span className="font-black text-gray-900 dark:text-white">{item.value} passes</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0C1220] p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center font-black">
                <Tag size={18} />
              </div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">Coupon Code Conversion & Revenue Impact</h3>
            </div>
            <p className="text-xs font-semibold text-gray-400 mt-0.5">Live metrics for promo codes redeemed during this {selectedTimeframe} period.</p>
          </div>
          <span className="self-start sm:self-auto rounded-2xl bg-purple-500/10 border border-purple-500/20 px-3.5 py-1.5 text-xs font-black text-purple-600 dark:text-purple-400">
            {couponsList.length} Promo Codes Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10 text-[10px] font-black uppercase tracking-wider text-gray-400">
                <th className="pb-3 px-3">Coupon Code</th>
                <th className="pb-3 px-3">Discount Value</th>
                <th className="pb-3 px-3">Redemptions</th>
                <th className="pb-3 px-3">Discounts Given</th>
                <th className="pb-3 px-3">Revenue Driven</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-xs font-bold">
              {couponsList.map((cpn) => (
                <tr key={cpn.code} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition">
                  <td className="py-3.5 px-3">
                    <span className="font-mono font-black text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg">
                      {cpn.code}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-gray-900 dark:text-white">
                    {cpn.discountPercent ? `${cpn.discountPercent}% OFF` : `₹${cpn.discountAmount} Flat`}
                  </td>
                  <td className="py-3.5 px-3 font-black text-gray-900 dark:text-white">{cpn.usedCount} times</td>
                  <td className="py-3.5 px-3 text-rose-500 font-black">₹{cpn.totalDiscountGiven.toLocaleString("en-IN")}</td>
                  <td className="py-3.5 px-3 text-emerald-500 font-black">₹{cpn.revenueGenerated.toLocaleString("en-IN")}</td>
                  <td className="py-3.5 px-3">
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      {cpn.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <button onClick={() => handleCopyCoupon(cpn.code)} className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-purple-500 transition cursor-pointer">
                      {copiedCoupon === cpn.code ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Single Entries", count: `${kpis.singleTickets.count} Passes`, icon: Users, color: "blue", share: `${kpis.singleTickets.percentage}% share`, gross: kpis.singleTickets.revenue },
          { title: "Couples Entry", count: `${kpis.coupleTickets.count} Passes (${kpis.coupleTickets.attendeesCount} pax)`, icon: Heart, color: "purple", share: `${kpis.coupleTickets.freeEntries} Free / ${kpis.coupleTickets.count - kpis.coupleTickets.freeEntries} Paid`, gross: kpis.coupleTickets.revenue },
          { title: "Group Passes", count: `${kpis.groupTickets.count} Packs (${kpis.groupTickets.attendeesCount} pax)`, icon: Users2, color: "emerald", share: `Avg ~${kpis.groupTickets.avgGroupSize} people/pack`, gross: kpis.groupTickets.revenue }
        ].map(card => {
          const Icon = card.icon;
          return (
            <div key={card.title} className={`rounded-3xl border border-${card.color}-500/20 bg-${card.color}-50/20 dark:bg-${card.color}-950/10 p-6 shadow-sm`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-black uppercase tracking-wider text-${card.color}-600 dark:text-${card.color}-400`}>{card.title}</span>
                <Icon size={18} className={`text-${card.color}-500`} />
              </div>
              <div className="text-2xl font-black text-gray-900 dark:text-white">{card.count}</div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1">{card.share}</p>
              <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-white/5 flex items-center justify-between text-xs font-bold">
                <span>Gross Value:</span>
                <span className={`font-black text-${card.color}-600 dark:text-${card.color}-400`}>₹{card.gross.toLocaleString("en-IN")}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EventAnalytics;
