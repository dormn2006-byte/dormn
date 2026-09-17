import { useEffect, useState } from "react";
import {
  TrendingUp, Building2, Users, IndianRupee,
  BookOpenCheck, Plus, ArrowRight, PieChart as PieChartIcon,
  ChevronDown, Wrench
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

/* ── Shared Helpers ── */

const statusBadgeCls = (status, variant = 'pill') => {
  const base = variant === 'pill'
    ? 'text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wide shrink-0'
    : 'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide';
  if (status === 'approved') return `${base} bg-emerald-500/15 text-emerald-600 dark:text-emerald-400`;
  if (status === 'rejected') return `${base} bg-red-500/15 text-red-600 dark:text-red-400`;
  return `${base} bg-orange-500/15 text-orange-600 dark:text-orange-400`;
};

const miniStatusCls = (status) => {
  if (status === 'approved') return 'bg-emerald-500/20 text-emerald-400';
  if (status === 'rejected' || status === 'closed') return 'bg-rose-500/20 text-rose-400';
  if (status === 'resolved') return 'bg-emerald-500/20 text-emerald-400';
  if (status === 'in_progress') return 'bg-blue-500/20 text-blue-400';
  return 'bg-amber-500/20 text-amber-400';
};

/* ── CustomDropdown ── */

const CustomDropdown = ({ value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)} 
        className="flex items-center gap-1.5 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 text-[11px] sm:text-xs font-bold text-gray-600 dark:text-gray-300 rounded-lg px-2.5 py-1 sm:px-3 sm:py-1.5 outline-none hover:bg-gray-100 dark:hover:bg-white/5 transition shrink-0"
      >
        <span>{value}</span>
        <ChevronDown size={12} className={`transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)}></div>
          <div className="absolute right-0 top-full mt-1.5 w-32 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-20 py-1 overflow-hidden backdrop-blur-xl">
            {options.map(opt => (
              <button 
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-[11px] sm:text-xs font-bold transition ${value === opt ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ── Metric Card mini-charts ── */

const BarMini = () => (
  <div className="flex items-end gap-0.5 sm:gap-1 h-full w-full">
    {['h-2/5','h-3/5','h-4/5','h-full'].map((h, i) => (
      <div key={i} className={`w-1/4 rounded-t-xs ${h} ${['bg-emerald-200 dark:bg-emerald-900/50','bg-emerald-300 dark:bg-emerald-700/50','bg-emerald-400 dark:bg-emerald-500/50','bg-emerald-500 dark:bg-emerald-500'][i]}`} />
    ))}
  </div>
);

const LineMini = ({ d }) => (
  <svg viewBox="0 0 100 30" className="w-full h-full stroke-emerald-500 fill-none" strokeWidth="3">
    <path d={d} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DotsMini = () => (
  <div className="flex items-center justify-end gap-1">
    {['bg-emerald-200 dark:bg-emerald-900','bg-emerald-300 dark:bg-emerald-700','bg-emerald-400 dark:bg-emerald-500','bg-emerald-500 dark:bg-emerald-400'].map((c, i) => (
      <div key={i} className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${c}`} />
    ))}
  </div>
);

const ALL_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const CARD_CLS = "bg-white dark:bg-[#111] p-3.5 sm:p-4 md:p-5 lg:p-6 rounded-xl sm:rounded-2xl lg:rounded-3xl border border-gray-200/80 dark:border-white/5 shadow-xs flex flex-col justify-between min-h-[96px] sm:h-28 md:h-36 lg:h-40 relative overflow-hidden group";
const MINI_WRAP = "w-10 sm:w-14 md:w-16 lg:w-20 h-5 sm:h-7 md:h-9 lg:h-10 opacity-70 group-hover:opacity-100 transition-opacity shrink-0";

const Dashboard = () => {
  const navigate = useNavigate();
  const [pgs, setPgs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartMetric, setChartMetric] = useState("Revenue");
  const [chartMonth, setChartMonth] = useState("October");
  const [chartGranularity, setChartGranularity] = useState("Daily");
  const [donutMetric, setDonutMetric] = useState("Status Split");
  const [donutGranularity, setDonutGranularity] = useState("Monthly");
  const [donutMonth, setDonutMonth] = useState("October");
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pgsRes, analyticsRes, bookingsRes, reqsRes] = await Promise.all([
          api.get("/pg/owner/my-pgs").catch(() => ({ data: { pgs: [] } })),
          api.get("/pg/owner/analytics").catch(() => ({ data: { success: false } })),
          api.get("/bookings/owner-bookings").catch(() => ({ data: { bookings: [] } })),
          api.get("/maintenance/owner").catch(() => ({ data: { requests: [] } }))
        ]);
        const pgsList = pgsRes.data?.pgs || [];
        setPgs(pgsList);
        if (analyticsRes.data?.success) setAnalytics(analyticsRes.data.data);

        // De-duplicate bookings
        const rawBookings = bookingsRes.data?.bookings || [];
        const bGrouped = {};
        rawBookings.filter(b => b.status !== 'paused').forEach(b => {
          const sKey = (b.student_email || b.email || b.student_name || String(b.student_id || b.user_id || '')).toLowerCase().trim();
          const pKey = (b.title || b.pg_title || b.pg_name || String(b.pg_id || '')).toLowerCase().trim();
          const key = `${sKey}_${pKey}`;
          const bTime = new Date(b.created_at || 0).getTime() || Number(b.id) || 0;
          const gTime = bGrouped[key] ? (new Date(bGrouped[key].created_at || 0).getTime() || Number(bGrouped[key].id) || 0) : -1;
          if (!bGrouped[key] || bTime > gTime) bGrouped[key] = b;
        });
        setRecentBookings(Object.values(bGrouped));

        // Merge localStorage maintenance requests
        const myPgIds = new Set(pgsList.map(p => String(p.id)));
        const myPgTitles = new Set(pgsList.map(p => (p.title || '').toLowerCase().trim()));
        let rawReqs = reqsRes.data?.requests || [];
        try {
          let local = JSON.parse(localStorage.getItem('dormn_resident_requests') || '[]');
          if (Array.isArray(local)) {
            const clean = local.filter(r => 
              r.student_name !== 'Rahul Sharma' && 
              !String(r.id).includes('demo') && 
              !String(r.id).includes('1787822400001') &&
              !String(r.title || '').toLowerCase().includes('wi-fi router speed issue')
            );
            if (clean.length !== local.length) localStorage.setItem('dormn_resident_requests', JSON.stringify(clean));
            local = clean;
          }
          if (Array.isArray(local) && local.length > 0) {
            const cleanLocal = local.filter(r => myPgIds.has(String(r.pg_id)) || myPgTitles.has((r.pg_title || '').toLowerCase().trim()));
            const ids = new Set(rawReqs.map(r => String(r.id)));
            cleanLocal.forEach(lr => { if (!ids.has(String(lr.id))) rawReqs.push(lr); });
          }
        } catch {}
        setRecentRequests(pgsList.length > 0 ? rawReqs.filter(r => myPgIds.has(String(r.pg_id)) || myPgTitles.has((r.pg_title || '').toLowerCase().trim())) : []);
      } catch (error) {
        console.error("Dashboard Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    window.addEventListener('storage', fetchData);
    window.addEventListener('dormn_request_updated', fetchData);
    return () => { window.removeEventListener('storage', fetchData); window.removeEventListener('dormn_request_updated', fetchData); };
  }, []);

  /* ── Derived Stats ── */
  const totalPGs = analytics?.totalPGs ?? pgs.length ?? 0;
  const totalBookings = Math.max(analytics?.totalBookings || 0, recentBookings.length);
  const totalStudents = analytics?.totalStudents ?? recentBookings.filter(b => b.status === 'approved').length ?? 0;
  const totalRooms = analytics?.totalRooms ?? pgs.reduce((sum, p) => sum + Number(p.available_rooms || 0), 0) ?? 0;
  const estimatedMonthlyRevenue = analytics?.estimatedMonthlyRevenue ?? recentBookings.filter(b => b.status === 'approved').reduce((sum, b) => sum + Number(b.booked_price || b.price || 0), 0) ?? 0;
  const bookingStats = {
    approved: Math.max(analytics?.bookingStats?.approved || 0, recentBookings.filter(b => b.status === 'approved').length),
    pending: Math.max(analytics?.bookingStats?.pending || 0, recentBookings.filter(b => b.status === 'pending').length),
    rejected: Math.max(analytics?.bookingStats?.rejected || 0, recentBookings.filter(b => b.status === 'rejected').length)
  };
  const occupancyRate = totalRooms > 0 ? Math.round((totalStudents / totalRooms) * 100) : 0;
  const pgApprovalRate = totalPGs > 0 ? Math.round(((analytics?.approvedPGs ?? pgs.filter(p => p.status === 'approved').length) / totalPGs) * 100) : 0;
  const bookingConversionRate = totalBookings > 0 ? Math.round((bookingStats.approved / totalBookings) * 100) : 0;

  /* ── Metric Cards Config ── */
  const metricCards = [
    {
      label: 'Est. Revenue', badge: `+${Math.max(0, Math.round(occupancyRate * 0.15))}%`,
      value: estimatedMonthlyRevenue >= 1000 ? `₹${(estimatedMonthlyRevenue / 1000).toFixed(1)}k` : `₹${estimatedMonthlyRevenue}`,
      icon: <svg width="12" height="12" className="sm:w-3.5 sm:h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
      mini: <BarMini />
    },
    {
      label: 'Active Tenants', badge: `${occupancyRate}% Full`, value: totalStudents,
      icon: <svg width="12" height="12" className="sm:w-3.5 sm:h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm14 14v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      mini: <LineMini d="M0,25 Q20,20 40,25 T80,10 T100,5" />
    },
    {
      label: 'Total Listings', badge: `${pgApprovalRate}% Appr`, value: totalPGs,
      icon: <svg width="12" height="12" className="sm:w-3.5 sm:h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M16 10h.01M8 10h.01M8 14h.01M12 14h.01M16 14h.01"/></svg>,
      mini: <LineMini d="M0,10 L30,25 L60,15 L100,20" />
    },
    {
      label: 'Bookings', badge: `${bookingConversionRate}% Conv`, value: totalBookings,
      icon: <PieChartIcon size={12} className="sm:w-3.5 sm:h-3.5" />,
      mini: <DotsMini />
    }
  ];

  /* ── Chart Data Generators ── */
  const getChartData = () => {
    const m = chartMetric === "Revenue" ? (estimatedMonthlyRevenue || 0) : (totalBookings || 0);
    if (chartGranularity === "Weekly") return [{ label: "Week 1", value: Math.round(m * 0.2) }, { label: "Week 2", value: Math.round(m * 0.45) }, { label: "Week 3", value: Math.round(m * 0.75) }, { label: "Week 4", value: m }];
    if (chartGranularity === "Monthly") return [{ label: "Jul", value: Math.round(m * 0.3) }, { label: "Aug", value: Math.round(m * 0.5) }, { label: "Sep", value: Math.round(m * 0.8) }, { label: "Oct", value: m }];
    return [{ label: "Day 1", value: Math.round(m * 0.15) }, { label: "Day 5", value: Math.round(m * 0.25) }, { label: "Day 10", value: Math.round(m * 0.40) }, { label: "Day 15", value: Math.round(m * 0.65) }, { label: "Day 20", value: Math.round(m * 0.75) }, { label: "Day 25", value: Math.round(m * 0.85) }, { label: "Day 30", value: m }];
  };

  const getDonutData = () => {
    if (donutMetric === "Room Sharing") return [{ name: 'Single Sharing', value: 45, color: '#10b981' }, { name: 'Double Sharing', value: 35, color: '#3b82f6' }, { name: 'Triple Sharing', value: 20, color: '#f59e0b' }];
    if (donutMetric === "Tenant Gender") return [{ name: 'Boys', value: 65, color: '#3b82f6' }, { name: 'Girls', value: 35, color: '#ec4899' }];
    return [{ name: 'Approved', value: bookingStats.approved || 0, color: '#10b981' }, { name: 'Pending', value: bookingStats.pending || 0, color: '#f59e0b' }, { name: 'Rejected', value: bookingStats.rejected || 0, color: '#ef4444' }];
  };

  const chartData = getChartData();
  const rawDonutData = getDonutData();
  const activeDonutData = rawDonutData.filter(d => d.value > 0);
  const isDonutEmpty = activeDonutData.length === 0;
  const chartDonutData = isDonutEmpty ? [{ name: 'No Data', value: 1, color: '#262626' }] : activeDonutData;

  const sortedPgs = [...pgs].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  /* ── Quick Actions Config ── */
  const quickActions = [
    {
      icon: <Plus size={16} />, iconBg: 'bg-orange-100 dark:bg-orange-500/10 text-orange-500',
      title: 'List New PG', sub: 'Expand your business',
      action: () => navigate("/owner/add-pg"),
      btnLabel: 'Start', btnCls: 'bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black shadow-xs',
      btnIcon: <ArrowRight size={12} />
    },
    {
      icon: <BookOpenCheck size={16} />, iconBg: 'bg-blue-100 dark:bg-blue-500/10 text-blue-500',
      title: 'Applications', sub: `Live DB (${recentBookings.length})`,
      action: () => navigate("/owner/bookings"),
      linkLabel: 'View All', linkCls: 'text-blue-600 dark:text-blue-400',
      items: recentBookings.slice(0, 2).map(b => ({
        id: b.id, name: b.student_name || b.student_email,
        detail: b.title || b.pg_title, detailCls: 'text-blue-500', status: b.status
      })),
      emptyMsg: 'No student bookings yet.'
    },
    {
      icon: <Wrench size={16} />, iconBg: 'bg-amber-100 dark:bg-amber-500/10 text-amber-500',
      title: 'Maintenance', sub: `Live Requests (${recentRequests.length})`,
      action: () => navigate("/owner/requests"),
      linkLabel: 'View All', linkCls: 'text-emerald-600 dark:text-emerald-400',
      items: recentRequests.slice(0, 2).map(r => ({
        id: r.id, name: r.title, clickable: true,
        detail: `${r.student_name || 'Resident'} • ${r.category || 'Maintenance'}`, detailCls: 'text-amber-500',
        status: r.status === 'open' ? 'New' : r.status, rawStatus: r.status
      })),
      emptyMsg: 'No maintenance requests yet.'
    }
  ];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 dark:border-gray-800 border-t-orange-500"></div>
          <p className="font-semibold text-gray-500 dark:text-gray-400">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-4 sm:space-y-6 md:space-y-8 pb-10 transition-colors">
      
      {/* ══════ HIGHLIGHTS ══════ */}
      <div>
        <h2 className="text-sm sm:text-base md:text-lg font-black text-gray-900 dark:text-white tracking-tight">Highlights</h2>
      </div>

      {/* ══════ METRICS CARDS ══════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5 md:gap-5">
        {metricCards.map((card, i) => (
          <div key={i} className={CARD_CLS}>
            <div className="flex items-center justify-between gap-1">
              <h3 className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1 sm:gap-1.5 uppercase tracking-wider truncate">
                <span className="text-gray-400 shrink-0">{card.icon}</span>
                <span className="truncate">{card.label}</span>
              </h3>
              <span className="text-[9px] sm:text-[10px] text-emerald-500 dark:text-emerald-400 font-extrabold bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded shrink-0">
                {card.badge}
              </span>
            </div>
            <div className="flex items-end justify-between mt-2 sm:mt-3">
              <span className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 dark:text-white leading-none">{card.value}</span>
              <div className={MINI_WRAP}>{card.mini}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ══════ CHARTS ROW ══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-3.5 sm:gap-6">
        
        {/* Progress Overview (Area Chart) */}
        <div className="bg-white dark:bg-[#111] p-3.5 sm:p-5 md:p-6 lg:p-7 rounded-2xl sm:rounded-3xl border border-gray-200/80 dark:border-white/5 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-6 gap-2">
            <div>
              <h3 className="text-sm sm:text-base md:text-lg font-black text-gray-900 dark:text-white">Progress Overview</h3>
              <p className="text-[11px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">Your revenue and booking trends.</p>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <CustomDropdown value={chartMetric} options={["Revenue", "Bookings"]} onChange={setChartMetric} />
              <CustomDropdown value={chartGranularity} options={["Daily", "Weekly", "Monthly"]} onChange={setChartGranularity} />
              <CustomDropdown value={chartMonth} options={ALL_MONTHS} onChange={setChartMonth} />
            </div>
          </div>
          <div className="h-[180px] sm:h-[220px] md:h-[280px] lg:h-[330px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 6, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.1)" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} dy={6} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(val) => chartMetric === "Revenue" ? (val >= 1000 ? `${(val/1000).toFixed(0)}k` : val) : val} />
                <Tooltip 
                  formatter={(value) => [chartMetric === "Revenue" ? `₹${Number(value).toLocaleString('en-IN')}` : `${value} Bookings`, chartMetric]}
                  contentStyle={{ borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', backgroundColor: '#111', color: '#fff', fontSize: '11px' }}
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  labelStyle={{ fontWeight: 'bold', color: '#10b981' }}
                />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Booking Status Split (Donut Chart) - Distinct Standalone Section */}
        <div className="bg-white dark:bg-[#111] p-3.5 sm:p-5 md:p-6 lg:p-7 rounded-2xl sm:rounded-3xl border border-gray-200/80 dark:border-white/5 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-5 gap-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <PieChartIcon size={16} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base md:text-lg font-black text-gray-900 dark:text-white leading-tight">
                  {donutMetric}
                </h3>
                <p className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400">Distribution breakdown</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <CustomDropdown options={["Status Split", "Room Sharing", "Tenant Gender"]} value={donutMetric} onChange={setDonutMetric} />
              <CustomDropdown options={["Daily", "Weekly", "Monthly"]} value={donutGranularity} onChange={setDonutGranularity} />
              <CustomDropdown options={ALL_MONTHS} value={donutMonth} onChange={setDonutMonth} />
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center relative min-h-[190px] sm:min-h-[220px] md:min-h-[260px] lg:min-h-[280px]">
            <div className="w-full h-[190px] sm:h-[220px] md:h-[260px] lg:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartDonutData} cx="50%" cy="50%" innerRadius={56} outerRadius={80} paddingAngle={isDonutEmpty ? 0 : 4} dataKey="value" stroke="none">
                    {chartDonutData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  {!isDonutEmpty && (
                    <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', backgroundColor: '#111', color: '#fff', fontSize: '11px' }} itemStyle={{ color: '#fff' }} />
                  )}
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] sm:text-xs font-bold text-gray-400">Total Req</span>
              <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 dark:text-white leading-none mt-0.5">{totalBookings}</span>
            </div>
          </div>

          {/* Breakdown Stats Legend Card */}
          <div className="mt-3 sm:mt-4 p-2.5 sm:p-3.5 bg-gray-50/80 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 rounded-xl sm:rounded-2xl">
            <div className="grid grid-cols-3 gap-2 text-center divide-x divide-gray-200/60 dark:divide-white/5">
              {rawDonutData.map((d, i) => (
                <div key={i} className={`flex flex-col items-center gap-1 ${i > 0 ? 'pl-1.5 sm:pl-2' : ''}`}>
                  <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-bold text-gray-600 dark:text-gray-400">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="truncate max-w-[60px] sm:max-w-none">{d.name}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs sm:text-sm font-black text-gray-900 dark:text-white">{d.value}</span>
                    <span className="text-[9px] sm:text-[10px] font-semibold text-gray-400">
                      ({totalBookings > 0 ? `${Math.round((d.value / totalBookings) * 100)}%` : "0%"})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════ BOTTOM ROW ══════ */}
      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-3.5 sm:gap-6">
        
        {/* Recent Properties */}
        <div className="bg-white dark:bg-[#111] p-3.5 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl border border-gray-200/80 dark:border-white/5 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between mb-3 sm:mb-5 gap-3">
            <h3 className="text-sm sm:text-base md:text-lg font-black text-gray-900 dark:text-white flex items-center gap-1.5">
              <Building2 size={16} className="text-gray-400" />
              <span>Recent Properties</span>
            </h3>
            <button onClick={() => navigate("/owner/my-pgs")} className="bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 text-[11px] sm:text-xs font-bold text-gray-600 dark:text-gray-300 rounded-lg px-2.5 py-1 sm:px-3 sm:py-1.5 outline-none hover:bg-gray-100 dark:hover:bg-white/5 transition">
              View All
            </button>
          </div>

          {/* Mobile: Card List */}
          <div className="block sm:hidden space-y-2">
            {pgs.length === 0 ? (
              <p className="py-6 text-center text-xs font-bold text-gray-400">No properties found. Add one to get started!</p>
            ) : sortedPgs.slice(0, 3).map((pg, i) => (
              <div key={i} onClick={() => navigate("/owner/my-pgs")} className="p-2.5 rounded-xl bg-gray-50/70 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-center justify-between gap-2 hover:bg-gray-100 dark:hover:bg-white/10 transition cursor-pointer">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${i % 2 === 0 ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">{pg.title}</h4>
                    <p className="text-[10px] text-gray-400 font-medium truncate">{pg.pg_type || "Co-ed"} • {pg.spots_left !== undefined ? `${pg.spots_left} spots left` : `${pg.available_rooms || 0} spots`} • {pg.created_at ? new Date(pg.created_at).toLocaleDateString() : "Recently"}</p>
                  </div>
                </div>
                <span className={statusBadgeCls(pg.status)}>{pg.status || 'Pending'}</span>
              </div>
            ))}
          </div>

          {/* Desktop: Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5 text-[10px] sm:text-[11px] uppercase tracking-wider text-gray-400">
                  {['Property Name','Added Date','Type','Status','Spots Left'].map(h => <th key={h} className="pb-2.5 font-bold px-2">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {pgs.length === 0 ? (
                  <tr><td colSpan="5" className="py-6 text-center text-xs sm:text-sm font-bold text-gray-400">No properties found. Add one to get started!</td></tr>
                ) : sortedPgs.slice(0, 4).map((pg, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full ${i%2===0 ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                        <span onClick={() => navigate("/owner/my-pgs")} className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-200 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors cursor-pointer">{pg.title}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">{pg.created_at ? new Date(pg.created_at).toLocaleDateString() : "Recently"}</td>
                    <td className="py-2.5 px-2 text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">{pg.pg_type || "Co-ed"}</td>
                    <td className="py-2.5 px-2"><span className={statusBadgeCls(pg.status, 'table')}>{pg.status || 'Pending'}</span></td>
                    <td className="py-2.5 px-2 text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300">
                      {pg.spots_left !== undefined ? `${pg.spots_left} / ${pg.available_rooms || 0}` : pg.available_rooms || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-gray-50/70 dark:bg-[#0a0a0a] p-3.5 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl border border-gray-200/80 dark:border-white/5 shadow-xs flex flex-col">
          <div className="mb-3 sm:mb-4">
            <h3 className="text-sm sm:text-base md:text-lg font-black text-gray-900 dark:text-white">Quick Actions</h3>
            <p className="text-[11px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">Manage your listings in seconds</p>
          </div>
          <div className="space-y-2.5 sm:space-y-3.5">
            {quickActions.map((qa, idx) => (
              <div key={idx} className="bg-white dark:bg-[#111] rounded-xl sm:rounded-2xl border border-gray-200/80 dark:border-white/10 p-3 sm:p-3.5 shadow-xs">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${qa.iconBg}`}>{qa.icon}</div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">{qa.title}</h4>
                      <p className="text-[10px] font-semibold text-gray-400 truncate">{qa.sub}</p>
                    </div>
                  </div>
                  {qa.btnLabel ? (
                    <button onClick={qa.action} className={`text-[11px] sm:text-xs font-bold py-1.5 px-3 rounded-lg sm:rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${qa.btnCls}`}>
                      <span>{qa.btnLabel}</span> {qa.btnIcon}
                    </button>
                  ) : (
                    <button onClick={qa.action} className={`hover:underline text-[11px] font-bold shrink-0 cursor-pointer ${qa.linkCls}`}>{qa.linkLabel}</button>
                  )}
                </div>
                {qa.items && (
                  qa.items.length === 0 ? (
                    <p className="text-[11px] text-gray-400 py-1">{qa.emptyMsg}</p>
                  ) : (
                    <div className="space-y-1.5 mb-1">
                      {qa.items.map(item => (
                        <div key={item.id} onClick={item.clickable ? qa.action : undefined} className={`flex items-center justify-between text-xs p-1.5 sm:p-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 ${item.clickable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition' : ''}`}>
                          <div className="min-w-0">
                            <p className="font-bold text-[11px] text-gray-900 dark:text-white truncate">{item.name}</p>
                            <p className={`text-[9px] truncate ${item.detailCls}`}>{item.detail}</p>
                          </div>
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 ${miniStatusCls(item.rawStatus || item.status)}`}>
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;