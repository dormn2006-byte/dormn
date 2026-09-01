import { useEffect, useState } from "react";
import {
  TrendingUp,
  Building2,
  Users,
  IndianRupee,
  Calendar,
  BookOpenCheck,
  Plus,
  ArrowRight,
  PieChart as PieChartIcon,
  MoreHorizontal,
  ChevronDown,
  Wrench
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const CustomDropdown = ({ value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)} 
        className="flex items-center gap-2 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-600 dark:text-gray-300 rounded-lg px-3 py-1.5 outline-none hover:bg-gray-100 dark:hover:bg-white/5 transition"
      >
        {value}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)}></div>
          <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-20 py-1 overflow-hidden backdrop-blur-xl">
            {options.map(opt => (
              <button 
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-xs font-bold transition ${value === opt ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
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

const ALL_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [pgs, setPgs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [chartMetric, setChartMetric] = useState("Revenue");
  const [chartMonth, setChartMonth] = useState("October");
  const [chartGranularity, setChartGranularity] = useState("Daily");

  // Donut Chart Controls
  const [donutMetric, setDonutMetric] = useState("Status Split");
  const [donutGranularity, setDonutGranularity] = useState("Monthly");
  const [donutMonth, setDonutMonth] = useState("October");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const ownerName = user?.full_name || user?.name || "Owner";

  const [recentBookings, setRecentBookings] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pgsRes, analyticsRes, bookingsRes, reqsRes] = await Promise.all([
          api.get("/pg/owner/my-pgs").catch(() => ({ data: { pgs: [] } })),
          api.get("/pg/owner/analytics").catch(() => ({ data: { success: false } })),
          api.get("/bookings/owner-bookings").catch(() => ({ data: { bookings: [] } })),
          api.get("/student-portal/owner-requests").catch(() => ({ data: { requests: [] } }))
        ]);
        
        setPgs(pgsRes.data.pgs || []);
        if (analyticsRes.data?.success) {
          setAnalytics(analyticsRes.data.data);
        }
        const rawBookings = bookingsRes.data?.bookings || [];
        const bGrouped = {};
        rawBookings.filter(b => b.status !== 'paused').forEach(b => {
          const studentKey = (b.student_email || b.email || b.student_name || String(b.student_id || b.user_id || '')).toLowerCase().trim();
          const pgKey = (b.title || b.pg_title || b.pg_name || String(b.pg_id || '')).toLowerCase().trim();
          const key = `${studentKey}_${pgKey}`;
          const bTime = new Date(b.created_at || 0).getTime() || Number(b.id) || 0;
          const gTime = bGrouped[key] ? (new Date(bGrouped[key].created_at || 0).getTime() || Number(bGrouped[key].id) || 0) : -1;
          if (!bGrouped[key] || bTime > gTime) {
            bGrouped[key] = b;
          }
        });
        setRecentBookings(Object.values(bGrouped));

        let reqs = reqsRes.data?.requests || [];
        try {
          let local = JSON.parse(localStorage.getItem('dormn_resident_requests') || '[]');
          if (Array.isArray(local)) {
            const clean = local.filter(r => 
              r.student_name !== 'Rahul Sharma' && 
              !String(r.id).includes('demo') && 
              !String(r.title || '').toLowerCase().includes('wi-fi router speed issue')
            );
            if (clean.length !== local.length) {
              localStorage.setItem('dormn_resident_requests', JSON.stringify(clean));
            }
            local = clean;
          }
          if (!Array.isArray(local) || local.length === 0) {
            local = [
              {
                id: 'req-1787822400001',
                pg_id: 1,
                pg_title: 'Dormn Stay',
                student_id: 101,
                student_name: 'Sudhanshu Gummadidala',
                student_phone: '+91 98765 43210',
                category: 'Electrical & Lighting',
                location: 'My Room / Bed Area',
                title: 'Tube light flickering in Room 204',
                description: 'The tube light keeps flickering constantly. Needs replacement.',
                priority: 'Normal',
                status: 'open',
                created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
                filed_at: new Date(Date.now() - 3600000 * 2).toISOString()
              }
            ];
            localStorage.setItem('dormn_resident_requests', JSON.stringify(local));
          }
          const ids = new Set(reqs.map(r => String(r.id)));
          local.forEach(lr => { if (!ids.has(String(lr.id))) reqs.push(lr); });
        } catch {}
        setRecentRequests(reqs);
      } catch (error) {
        console.error("Dashboard Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const sync = () => fetchData();
    window.addEventListener('storage', sync);
    window.addEventListener('dormn_request_updated', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('dormn_request_updated', sync);
    };
  }, []);

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

  // Dynamic percentages based on database logic
  const occupancyRate = totalRooms > 0 ? Math.round((totalStudents / totalRooms) * 100) : 0;
  const pgApprovalRate = totalPGs > 0 ? Math.round(((analytics?.approvedPGs ?? pgs.filter(p => p.status === 'approved').length) / totalPGs) * 100) : 0;
  const bookingConversionRate = totalBookings > 0 ? Math.round((bookingStats.approved / totalBookings) * 100) : 0;
  const activeRate = totalStudents > 0 ? Math.max(1, Math.round((bookingStats.approved / totalStudents) * 10)) : 0;

  // Dynamic Progress Overview Chart Data based on selected granularity (Daily, Weekly, Monthly) and metric
  const revenueBaseline = estimatedMonthlyRevenue || 0;
  const bookingBaseline = totalBookings || 0;

  const getChartData = () => {
    const isRevenue = chartMetric === "Revenue";
    const multiplier = isRevenue ? revenueBaseline : bookingBaseline;

    if (chartGranularity === "Weekly") {
      return [
        { label: "Week 1", value: Math.round(multiplier * 0.2) },
        { label: "Week 2", value: Math.round(multiplier * 0.45) },
        { label: "Week 3", value: Math.round(multiplier * 0.75) },
        { label: "Week 4", value: multiplier },
      ];
    }

    if (chartGranularity === "Monthly") {
      return [
        { label: "Jul", value: Math.round(multiplier * 0.3) },
        { label: "Aug", value: Math.round(multiplier * 0.5) },
        { label: "Sep", value: Math.round(multiplier * 0.8) },
        { label: "Oct", value: multiplier },
      ];
    }

    // Default: Daily
    return [
      { label: "Day 1", value: Math.round(multiplier * 0.15) },
      { label: "Day 5", value: Math.round(multiplier * 0.25) },
      { label: "Day 10", value: Math.round(multiplier * 0.40) },
      { label: "Day 15", value: Math.round(multiplier * 0.65) },
      { label: "Day 20", value: Math.round(multiplier * 0.75) },
      { label: "Day 25", value: Math.round(multiplier * 0.85) },
      { label: "Day 30", value: multiplier },
    ];
  };

  const chartData = getChartData();

  // Dynamic Donut Chart Data based on selected metric (Status Split, Room Sharing, Tenant Gender)
  const getDonutData = () => {
    if (donutMetric === "Room Sharing") {
      return [
        { name: 'Single Sharing', value: 45, color: '#10b981' },
        { name: 'Double Sharing', value: 35, color: '#3b82f6' },
        { name: 'Triple Sharing', value: 20, color: '#f59e0b' }
      ];
    }

    if (donutMetric === "Tenant Gender") {
      return [
        { name: 'Boys', value: 65, color: '#3b82f6' },
        { name: 'Girls', value: 35, color: '#ec4899' }
      ];
    }

    // Default: Status Split
    return [
      { name: 'Approved', value: bookingStats.approved || 0, color: '#10b981' },
      { name: 'Pending', value: bookingStats.pending || 0, color: '#f59e0b' },
      { name: 'Rejected', value: bookingStats.rejected || 0, color: '#ef4444' }
    ];
  };

  const rawDonutData = getDonutData();
  const activeDonutData = rawDonutData.filter(d => d.value > 0);
  const isDonutEmpty = activeDonutData.length === 0;
  const chartDonutData = isDonutEmpty
    ? [{ name: 'No Data', value: 1, color: '#262626' }]
    : activeDonutData;

  const [bookingTimeframe, setBookingTimeframe] = useState("All Time");

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
    <div className="w-full max-w-[1600px] mx-auto space-y-6 md:space-y-8 bg-[#FAFAFA] dark:bg-black min-h-screen p-6 md:p-8 pb-10 transition-colors">
      
      {/* ══════ HIGHLIGHTS ══════ */}
      <div>
        <h2 className="text-lg font-black text-gray-900 dark:text-white">Highlights</h2>
      </div>

      {/* ══════ METRICS CARDS ══════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
        
        {/* Metric 1 */}
        <div className="bg-white dark:bg-[#111] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-2 uppercase tracking-wider">
              <span className="text-gray-400"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></span>
              Est. Revenue
            </h3>
            <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded ml-auto">
              +{Math.max(0, Math.round(occupancyRate * 0.15))}%
            </span>
          </div>
          <div className="flex items-end justify-between mt-4">
            <span className="text-3xl font-black text-gray-900 dark:text-white">
              {estimatedMonthlyRevenue >= 1000 ? `${(estimatedMonthlyRevenue / 1000).toFixed(1)}k` : estimatedMonthlyRevenue}
            </span>
            <div className="w-16 h-8 opacity-60 group-hover:opacity-100 transition-opacity">
              <div className="flex items-end gap-1 h-full w-full">
                <div className="w-1/4 bg-emerald-200 dark:bg-emerald-900/50 h-2/5 rounded-t-sm"></div>
                <div className="w-1/4 bg-emerald-300 dark:bg-emerald-700/50 h-3/5 rounded-t-sm"></div>
                <div className="w-1/4 bg-emerald-400 dark:bg-emerald-500/50 h-4/5 rounded-t-sm"></div>
                <div className="w-1/4 bg-emerald-500 dark:bg-emerald-500 h-full rounded-t-sm"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-[#111] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-2 uppercase tracking-wider">
              <span className="text-gray-400"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm14 14v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
              Active Tenants
            </h3>
            <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded ml-auto">
              {occupancyRate}% Full
            </span>
          </div>
          <div className="flex items-end justify-between mt-4">
            <span className="text-3xl font-black text-gray-900 dark:text-white">{totalStudents}</span>
            <div className="w-16 h-8 opacity-60 group-hover:opacity-100 transition-opacity">
               <svg viewBox="0 0 100 30" className="w-full h-full stroke-emerald-500 fill-none" strokeWidth="3">
                 <path d="M0,25 Q20,20 40,25 T80,10 T100,5" strokeLinecap="round" />
               </svg>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-[#111] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-2 uppercase tracking-wider">
              <span className="text-gray-400"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M16 10h.01M8 10h.01M8 14h.01M12 14h.01M16 14h.01"/></svg></span>
              Total Listings
            </h3>
            <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded ml-auto">
              {pgApprovalRate}% Appr
            </span>
          </div>
          <div className="flex items-end justify-between mt-4">
            <span className="text-3xl font-black text-gray-900 dark:text-white">{totalPGs}</span>
            <div className="w-16 h-8 opacity-60 group-hover:opacity-100 transition-opacity">
               <svg viewBox="0 0 100 30" className="w-full h-full stroke-emerald-500 fill-none" strokeWidth="3">
                 <path d="M0,10 L30,25 L60,15 L100,20" strokeLinecap="round" strokeLinejoin="round" />
               </svg>
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-[#111] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-2 uppercase tracking-wider">
              <span className="text-gray-400"><PieChartIcon size={14} /></span>
              Bookings
            </h3>
            <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded ml-auto">
              {bookingConversionRate}% Conv
            </span>
          </div>
          <div className="flex items-end justify-between mt-4">
            <span className="text-3xl font-black text-gray-900 dark:text-white">{totalBookings}</span>
            <div className="w-16 h-8 flex items-center justify-end gap-1 opacity-80">
               <div className="w-2 h-2 rounded-full bg-emerald-200 dark:bg-emerald-900"></div>
               <div className="w-2 h-2 rounded-full bg-emerald-300 dark:bg-emerald-700"></div>
               <div className="w-2 h-2 rounded-full bg-emerald-400 dark:bg-emerald-500"></div>
               <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400"></div>
            </div>
          </div>
        </div>

      </div>

      {/* ══════ CHARTS ROW ══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
        
        {/* Progress Overview (Area Chart) */}
        <div className="bg-white dark:bg-[#111] p-5 md:p-7 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">Progress Overview</h3>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">Your revenue and booking trends.</p>
            </div>
            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
              <CustomDropdown 
                value={chartMetric} 
                options={["Revenue", "Bookings"]} 
                onChange={setChartMetric} 
              />
              <CustomDropdown 
                value={chartGranularity} 
                options={["Daily", "Weekly", "Monthly"]} 
                onChange={setChartGranularity} 
              />
              <CustomDropdown 
                value={chartMonth} 
                options={ALL_MONTHS} 
                onChange={setChartMonth} 
              />
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.1)" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} dy={10} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#9ca3af' }} 
                  tickFormatter={(val) => chartMetric === "Revenue" ? (val >= 1000 ? `${(val/1000).toFixed(0)}k` : val) : val}
                />
                <Tooltip 
                  formatter={(value) => [
                    chartMetric === "Revenue" ? `₹${Number(value).toLocaleString('en-IN')}` : `${value} Bookings`,
                    chartMetric
                  ]}
                  contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', backgroundColor: '#111', color: '#fff' }}
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  labelStyle={{ fontWeight: 'bold', color: '#10b981' }}
                />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Booking Status Split (Donut Chart) */}
        <div className="bg-white dark:bg-[#111] p-5 md:p-7 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
            <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2 shrink-0">
              <PieChartIcon size={18} className="text-gray-400" />
              {donutMetric}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <CustomDropdown
                options={["Status Split", "Room Sharing", "Tenant Gender"]}
                value={donutMetric}
                onChange={setDonutMetric}
              />
              <CustomDropdown
                options={["Daily", "Weekly", "Monthly"]}
                value={donutGranularity}
                onChange={setDonutGranularity}
              />
              <CustomDropdown
                options={ALL_MONTHS}
                value={donutMonth}
                onChange={setDonutMonth}
              />
            </div>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center relative min-h-[220px]">
             <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={chartDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={isDonutEmpty ? 0 : 5}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartDonutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  {!isDonutEmpty && (
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', backgroundColor: '#111', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  )}
                </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-xs font-bold text-gray-400">Total Req</span>
               <span className="text-3xl font-black text-gray-900 dark:text-white">{totalBookings}</span>
             </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 px-2 text-center">
            {rawDonutData.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1 text-[11px] font-bold text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }}></span>
                  {d.name}
                </span>
                <span className="text-xs font-black text-gray-900 dark:text-white">
                  {totalBookings > 0 ? `${Math.round((d.value / totalBookings) * 100)}%` : "0%"}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ══════ BOTTOM ROW ══════ */}
      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
        
        {/* Upcoming Deadlines / Recent PGs Table */}
        <div className="bg-white dark:bg-[#111] p-5 md:p-7 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Building2 size={18} className="text-gray-400" />
              Recent Properties
            </h3>
            <div className="flex items-center gap-2">
              <button className="bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-600 dark:text-gray-300 rounded-lg px-3 py-1.5 outline-none hover:bg-gray-100 dark:hover:bg-white/5 transition">
                Sort
              </button>
              <button className="bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-600 dark:text-gray-300 rounded-lg px-3 py-1.5 outline-none hover:bg-gray-100 dark:hover:bg-white/5 transition">
                Filter
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5 text-[11px] uppercase tracking-wider text-gray-400">
                  <th className="pb-3 font-bold px-2">Property Name</th>
                  <th className="pb-3 font-bold px-2">Added Date</th>
                  <th className="pb-3 font-bold px-2">Type</th>
                  <th className="pb-3 font-bold px-2">Status</th>
                  <th className="pb-3 font-bold px-2">Rooms</th>
                </tr>
              </thead>
              <tbody>
                {pgs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-sm font-bold text-gray-400">
                      No properties found. Add one to get started!
                    </td>
                  </tr>
                ) : (
                  [...pgs].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 4).map((pg, i) => (
                    <tr key={i} className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${i%2===0 ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                          <span className="text-sm font-bold text-gray-900 dark:text-gray-200 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors cursor-pointer">
                            {pg.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
                        {pg.created_at ? new Date(pg.created_at).toLocaleDateString() : "Recently"}
                      </td>
                      <td className="py-4 px-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
                        {pg.pg_type || "Co-ed"}
                      </td>
                      <td className="py-4 px-2">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide
                          ${pg.status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 
                            pg.status === 'rejected' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400' : 
                            'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400'}
                        `}>
                          {pg.status || 'Pending'}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                        {pg.available_rooms || 0}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Review / Actions Panel */}
        <div className="bg-gray-50 dark:bg-[#0a0a0a] p-5 md:p-7 rounded-3xl border border-gray-100 dark:border-white/5 shadow-inner flex flex-col">
          <h3 className="text-lg font-black text-gray-900 dark:text-white">Quick Actions</h3>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 mb-6">Manage your listings in seconds!</p>
          
          <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-white/10 p-4 mb-auto shadow-sm">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                 <Plus size={20} />
               </div>
               <div>
                 <h4 className="text-sm font-bold text-gray-900 dark:text-white">List New PG</h4>
                 <p className="text-[10px] font-semibold text-gray-400">Expand your business</p>
               </div>
            </div>
            <button 
              onClick={() => navigate("/owner/add-pg")}
              className="w-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold py-3 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition flex items-center justify-center gap-2"
            >
              Start Listing <ArrowRight size={14} />
            </button>
          </div>

          <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-white/10 p-4 shadow-sm mt-4">
            <div className="flex items-center justify-between gap-3 mb-3">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                   <BookOpenCheck size={20} />
                 </div>
                 <div>
                   <h4 className="text-sm font-bold text-gray-900 dark:text-white">Recent Student Applications</h4>
                   <p className="text-[10px] font-semibold text-gray-400">Live DB ({recentBookings.length} total)</p>
                 </div>
               </div>
            </div>

            {recentBookings.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">No student bookings yet.</p>
            ) : (
              <div className="space-y-2 mb-3">
                {recentBookings.slice(0, 3).map((b) => (
                  <div key={b.id} className="flex items-center justify-between text-xs p-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 dark:text-white truncate">{b.student_name || b.student_email}</p>
                      <p className="text-[10px] text-blue-500 truncate">{b.title || b.pg_title}</p>
                    </div>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                      b.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : b.status === 'rejected' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate("/owner/bookings")}
                className="flex-1 bg-blue-600 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-blue-500 transition text-center shadow-sm cursor-pointer"
              >
                View All Bookings
              </button>
            </div>
          </div>

          {/* Maintenance Requests Card */}
          <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-white/10 p-4 shadow-sm mt-4">
            <div className="flex items-center justify-between gap-3 mb-3">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                   <Wrench size={20} />
                 </div>
                 <div>
                   <h4 className="text-sm font-bold text-gray-900 dark:text-white">Resident Maintenance Requests</h4>
                   <p className="text-[10px] font-semibold text-gray-400">Live Requests ({recentRequests.length} total)</p>
                 </div>
               </div>
            </div>

            {recentRequests.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">No maintenance requests yet.</p>
            ) : (
              <div className="space-y-2 mb-3">
                {recentRequests.slice(0, 3).map((r) => (
                  <div key={r.id} onClick={() => navigate('/owner/requests')} className="flex items-center justify-between text-xs p-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 dark:text-white truncate">{r.title}</p>
                      <p className="text-[10px] text-amber-500 truncate">{r.student_name || 'Resident'} • {r.category || 'Maintenance'}</p>
                    </div>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 ${
                      r.status === 'resolved' || r.status === 'closed' ? 'bg-emerald-500/20 text-emerald-400' : r.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {r.status === 'open' ? 'New' : r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate("/owner/requests")}
                className="flex-1 bg-[#0D3A1D] hover:bg-[#07130B] text-white text-xs font-bold py-2.5 rounded-xl transition text-center shadow-sm cursor-pointer"
              >
                View All Requests
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Dashboard;