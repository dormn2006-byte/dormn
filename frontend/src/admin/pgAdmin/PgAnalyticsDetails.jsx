import { useState, useEffect, useCallback, useMemo, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import {
  ArrowLeft, Building2, MapPin, IndianRupee, Users, Wrench, FileText,
  CheckCircle2, Clock, AlertTriangle, Sparkles, Bed, ShieldCheck, Edit3,
  TrendingUp, BarChart3, PieChart as PieChartIcon, RefreshCw, Phone, Mail,
  ChevronRight, ChevronDown, BookOpenCheck, CreditCard, XCircle, UserCheck
} from "lucide-react";
import api, { IMAGE_BASE_URL } from "../../services/api";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';

const CustomDropdown = ({ value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)} 
        className="flex items-center gap-2 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-600 dark:text-gray-300 rounded-lg px-3 py-1.5 outline-none hover:bg-gray-100 dark:hover:bg-white/5 transition cursor-pointer"
      >
        {value}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)}></div>
          <div className="absolute right-0 top-full mt-2 w-36 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-20 py-1 overflow-hidden backdrop-blur-xl">
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

export default function PgAnalyticsDetails() {
  const { pgId } = useParams();
  const navigate = useNavigate();

  const [pg, setPg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("bookings"); // Default to Bookings as in image

  // Recharts Dashboard Controls
  const [chartMetric, setChartMetric] = useState("Revenue");
  const [chartGranularity, setChartGranularity] = useState("Monthly");
  const [chartMonth, setChartMonth] = useState("October");

  const [donutMetric, setDonutMetric] = useState("Occupancy Split");
  const [donutGranularity, setDonutGranularity] = useState("Monthly");
  const [donutMonth, setDonutMonth] = useState("October");

  // PG Specific Data Sets
  const [bookings, setBookings] = useState([]);
  const [requests, setRequests] = useState([]);
  const [kycForms, setKycForms] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  const { user } = useContext(AuthContext);

  const fetchPgData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch Property Details
      const pgRes = await api.get(`/pg/${pgId}`).catch(() => null);
      let pgData = pgRes?.data?.pg;

      if (!pgData) {
        const myPgsRes = await api.get('/pg/owner/my-pgs').catch(() => null);
        const list = myPgsRes?.data?.pgs || [];
        pgData = list.find(p => String(p.id) === String(pgId));
      }

      if (!pgData) {
        setError("Property not found or access denied.");
        setLoading(false);
        return;
      }

      // Verify ownership: ensure logged-in owner actually owns this PG
      if (Number(pgData.owner_id) !== Number(user?.id) && user?.role !== "admin" && user?.role !== "superadmin") {
        setError("Access Denied. You do not have permission to view this property's analytics.");
        setLoading(false);
        return;
      }

      setPg(pgData);

      // 2. Fetch Owner Bookings & filter for THIS PG
      const { data: bData } = await api.get('/bookings/owner-bookings').catch(() => ({ data: { bookings: [] } }));
      const allBookings = bData?.bookings || bData || [];
      const pgB = allBookings.filter(b => 
        String(b.pg_id) === String(pgId) || 
        (b.title || b.pg_title || b.pg_name || '').toLowerCase().trim() === (pgData.title || '').toLowerCase().trim()
      );
      setBookings(pgB);

      // 3. Fetch Helpdesk Requests & filter for THIS PG
      let allReqs = [];
      try { allReqs = (await api.get('/student-portal/owner-requests')).data?.requests || []; } catch {}
      try {
        const local = JSON.parse(localStorage.getItem('dormn_resident_requests') || '[]');
        if (Array.isArray(local)) {
          const ids = new Set(allReqs.map(r => String(r.id)));
          local.forEach(lr => { if (!ids.has(String(lr.id))) allReqs.push(lr); });
        }
      } catch {}
      const pgR = allReqs.filter(r => 
        String(r.pg_id) === String(pgId) || 
        (r.pg_title || '').toLowerCase().trim() === (pgData.title || '').toLowerCase().trim()
      );
      setRequests(pgR);

      // 4. Fetch KYC Registrations & filter for THIS PG
      let allKyc = [];
      try { allKyc = (await api.get('/enrollments/all')).data?.enrollments || []; } catch {}
      try {
        const localKyc = JSON.parse(localStorage.getItem('dormn_kyc_enrollments') || '[]');
        if (Array.isArray(localKyc)) {
          const ids = new Set(allKyc.map(k => String(k.id || k.booking_id)));
          localKyc.forEach(lk => { if (!ids.has(String(lk.id || lk.booking_id))) allKyc.push(lk); });
        }
      } catch {}
      const pgK = allKyc.filter(k => 
        String(k.pg_id) === String(pgId) || 
        (k.pg_title || '').toLowerCase().trim() === (pgData.title || '').toLowerCase().trim()
      );
      setKycForms(pgK);

    } catch (err) {
      console.error("Error fetching PG analytics details:", err);
      setError("Failed to load property analytics.");
    } finally {
      setLoading(false);
    }
  }, [pgId]);

  useEffect(() => {
    fetchPgData();
  }, [fetchPgData]);

  // Handle Booking Approval / Rejection directly in PG Analytics page
  const handleBookingStatusChange = async (bookingId, newStatus) => {
    try {
      setActionLoading(true);
      await api.put(`/bookings/${bookingId}/status`, { status: newStatus });
      
      // Update local state instantly
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));

      // Push real-time notification
      try {
        const notifs = JSON.parse(localStorage.getItem('dormn_resident_notifications') || '[]');
        notifs.unshift({
          id: `notif-${Date.now()}`,
          type: 'booking_update',
          category: 'Booking',
          title: newStatus === 'approved' ? 'Booking Application Approved!' : `Booking Status: ${newStatus}`,
          message: newStatus === 'approved' 
            ? `Your booking application for ${pg?.title || 'PG'} has been approved! Proceed to pay rent.`
            : `Your booking application status was updated to ${newStatus}.`,
          status: newStatus,
          created_at: new Date().toISOString(),
          read: false
        });
        localStorage.setItem('dormn_resident_notifications', JSON.stringify(notifs));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('dormn_request_updated'));
      } catch {}

    } catch (err) {
      console.error("Failed to update booking status:", err);
      alert("Failed to update booking status");
    } finally {
      setActionLoading(false);
    }
  };

  // Deduplicated Visible Bookings (Keep latest booking per student)
  const visibleBookings = useMemo(() => {
    const filtered = bookings.filter((b) => b.status !== "paused");
    const grouped = {};
    filtered.forEach(b => {
      const studentKey = (b.student_email || b.email || b.student_name || String(b.student_id || b.user_id || '')).toLowerCase().trim();
      const pgKey = (b.title || b.pg_title || b.pg_name || String(b.pg_id || '')).toLowerCase().trim();
      const key = `${studentKey}_${pgKey}`;
      const bTime = new Date(b.created_at || 0).getTime() || Number(b.id) || 0;
      const gTime = grouped[key] ? (new Date(grouped[key].created_at || 0).getTime() || Number(grouped[key].id) || 0) : -1;

      if (!grouped[key] || bTime > gTime) {
        grouped[key] = b;
      }
    });
    return Object.values(grouped);
  }, [bookings]);

  // Derived Metrics & Deduplicated Roster
  const uniqueTenants = useMemo(() => {
    const approvedOrPaid = visibleBookings.filter(b => b.status === 'approved' || b.payment_status === 'paid');
    const grouped = {};
    approvedOrPaid.forEach(b => {
      const key = (b.student_email || b.email || b.student_name || String(b.student_id || '')).toLowerCase().trim();
      if (!grouped[key]) grouped[key] = b;
    });
    return Object.values(grouped);
  }, [visibleBookings]);

  const paidPayments = useMemo(() => {
    return visibleBookings.filter(b => b.payment_status === 'paid');
  }, [visibleBookings]);

  const totalRevenue = useMemo(() => {
    return paidPayments.reduce((sum, item) => sum + Number(item.booked_price || item.price || pg?.price || 0), 0);
  }, [paidPayments, pg]);

  const openRequestsCount = useMemo(() => {
    return requests.filter(r => r.status !== 'closed' && r.status !== 'resolved').length;
  }, [requests]);

  const totalCapacity = Number(pg?.available_rooms || pg?.total_rooms || 10);
  const occupiedCount = uniqueTenants.length;
  const spotsLeft = Math.max(0, totalCapacity - occupiedCount);
  const occupancyPercentage = Math.min(100, Math.round((occupiedCount / (totalCapacity || 1)) * 100));

  // Recharts Progress Overview Chart Data
  const chartData = useMemo(() => {
    const isRevenue = chartMetric === "Revenue";
    const multiplier = isRevenue ? Math.max(1, totalRevenue) : Math.max(1, visibleBookings.length);

    if (chartGranularity === "Weekly") {
      return [
        { label: "Week 1", value: Math.round(multiplier * 0.25) },
        { label: "Week 2", value: Math.round(multiplier * 0.55) },
        { label: "Week 3", value: Math.round(multiplier * 0.8) },
        { label: "Week 4", value: multiplier },
      ];
    }

    if (chartGranularity === "Daily") {
      return [
        { label: "Day 1", value: Math.round(multiplier * 0.15) },
        { label: "Day 5", value: Math.round(multiplier * 0.3) },
        { label: "Day 10", value: Math.round(multiplier * 0.5) },
        { label: "Day 15", value: Math.round(multiplier * 0.7) },
        { label: "Day 20", value: Math.round(multiplier * 0.85) },
        { label: "Day 25", value: Math.round(multiplier * 0.95) },
        { label: "Day 30", value: multiplier },
      ];
    }

    // Monthly
    return [
      { label: "May", value: Math.round(multiplier * 0.4) },
      { label: "Jun", value: Math.round(multiplier * 0.6) },
      { label: "Jul", value: Math.round(multiplier * 0.75) },
      { label: "Aug", value: Math.round(multiplier * 0.88) },
      { label: "Sep", value: multiplier },
      { label: "Oct", value: Math.round(multiplier * 1.15) },
    ];
  }, [chartMetric, chartGranularity, totalRevenue, visibleBookings.length]);

  // Recharts Donut Chart Data
  const donutData = useMemo(() => {
    if (donutMetric === "Helpdesk Split") {
      const counts = {};
      requests.forEach(r => {
        const cat = r.category || 'General';
        counts[cat] = (counts[cat] || 0) + 1;
      });
      const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];
      const entries = Object.entries(counts).map(([name, value], idx) => ({
        name,
        value,
        color: colors[idx % colors.length]
      }));
      return entries.length > 0 ? entries : [{ name: 'No Issues', value: 1, color: '#10b981' }];
    }

    if (donutMetric === "Payment Split") {
      return [
        { name: 'Paid Stay', value: paidPayments.length, color: '#10b981' },
        { name: 'Pending Rent', value: Math.max(0, uniqueTenants.length - paidPayments.length), color: '#3b82f6' }
      ].filter(d => d.value > 0);
    }

    // Default: Occupancy Split (Occupied vs Remaining Spots Left)
    const paidCount = paidPayments.length;
    const pendingApprovedCount = Math.max(0, uniqueTenants.length - paidCount);

    const raw = [
      { name: 'Paid Residents', value: paidCount, color: '#10b981' },
      { name: 'Approved Pending', value: pendingApprovedCount, color: '#3b82f6' },
      { name: 'Spots Left', value: spotsLeft, color: '#6b7280' }
    ].filter(d => d.value > 0);

    return raw.length > 0 ? raw : [{ name: 'Spots Left', value: totalCapacity, color: '#6b7280' }];
  }, [donutMetric, requests, paidPayments.length, uniqueTenants.length, spotsLeft, totalCapacity]);

  const handleRequestStatusChange = async (reqId, newStatus) => {
    try {
      const updated = requests.map(r => r.id === reqId ? { ...r, status: newStatus } : r);
      setRequests(updated);
      const allLocal = JSON.parse(localStorage.getItem('dormn_resident_requests') || '[]');
      if (Array.isArray(allLocal)) {
        const localUpdated = allLocal.map(r => r.id === reqId ? { ...r, status: newStatus } : r);
        localStorage.setItem('dormn_resident_requests', JSON.stringify(localUpdated));
        window.dispatchEvent(new Event('storage'));
      }
    } catch (err) {
      console.error("Error updating request status:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-gray-500">Loading Property Analytics &amp; Management Dashboard...</p>
      </div>
    );
  }

  if (error || !pg) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="p-8 rounded-3xl border border-rose-200 bg-rose-50 dark:bg-rose-500/10 text-rose-600">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-rose-500" />
          <h3 className="text-xl font-black">{error || "Property Not Found"}</h3>
          <p className="text-xs font-semibold mt-1 text-gray-500">Please check property listings in your owner portal.</p>
          <Link to="/owner/my-pgs" className="inline-flex items-center gap-2 mt-5 rounded-2xl bg-blue-600 px-6 py-3 text-xs font-bold text-white shadow-md">
            <ArrowLeft size={16} /> Back to My PGs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12 font-sans bg-[#FAFAFA] dark:bg-black min-h-screen p-4 sm:p-6 transition-colors">
      
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/owner/my-pgs')}
          className="flex items-center text-xs sm:text-sm font-bold text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> <span>Back to My PGs</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/owner/edit-pg/${pg.id}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/15 bg-white dark:bg-white/5 text-xs font-black text-gray-800 dark:text-gray-200 hover:bg-gray-100 transition cursor-pointer"
          >
            <Edit3 size={14} /> <span>Edit Property</span>
          </button>
        </div>
      </div>

      {/* Hero Property Analytics Header Card */}
      <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <img
              src={pg.profile_image ? `${IMAGE_BASE_URL}/uploads/${pg.profile_image}` : "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=400&q=80"}
              alt={pg.title}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-2 border-emerald-500/20 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">{pg.title}</h1>
                <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${
                  pg.status === 'approved' ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' : 'bg-amber-500/20 text-amber-500 border-amber-500/30'
                }`}>
                  {pg.status === 'approved' ? 'APPROVED LIVE' : pg.status}
                </span>
                <span className="text-xs font-bold text-gray-400">ID #{pg.id}</span>
              </div>
              <p className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 mt-2">
                <MapPin size={16} className="text-emerald-500 shrink-0" />
                <span>{pg.address || `${pg.area || ''}, ${pg.city || ''}`}</span>
              </p>
              <div className="flex items-center gap-3 mt-3 text-xs font-black text-gray-700 dark:text-gray-300 flex-wrap">
                <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Rent: ₹{Number(pg.price || 0).toLocaleString()}/mo</span>
                <span className="px-3 py-1 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">{pg.pg_type || 'Boys'} PG</span>
                <span className="px-3 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold">{spotsLeft} Spots Left ({occupiedCount}/{totalCapacity} Booked)</span>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-auto flex flex-row lg:flex-col gap-3 justify-between border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-white/10 pt-4 lg:pt-0 lg:pl-8">
            <div>
              <span className="text-[11px] font-black uppercase text-gray-400 tracking-wider">Total Monthly Capacity</span>
              <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">₹{(totalCapacity * Number(pg.price || 0)).toLocaleString()}</div>
            </div>
            <div>
              <span className="text-[11px] font-black uppercase text-gray-400 tracking-wider">Property Owner</span>
              <div className="text-sm font-bold text-gray-700 dark:text-gray-300">{pg.owner_name || pg.owner_phone || "Verified Admin"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════ METRICS CARDS ══════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
        
        {/* Metric 1: Est. Revenue */}
        <div className="bg-white dark:bg-[#111] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-2 uppercase tracking-wider">
              <span className="text-gray-400"><IndianRupee size={14} /></span>
              Est. Revenue
            </h3>
            <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded ml-auto">
              +100% Sync
            </span>
          </div>
          <div className="flex items-end justify-between mt-4">
            <span className="text-3xl font-black text-gray-900 dark:text-white">
              {totalRevenue >= 1000 ? `₹${(totalRevenue / 1000).toFixed(1)}k` : `₹${totalRevenue}`}
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

        {/* Metric 2: Active Tenants */}
        <div className="bg-white dark:bg-[#111] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-2 uppercase tracking-wider">
              <span className="text-gray-400"><Users size={14} /></span>
              Active Tenants
            </h3>
            <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded ml-auto">
              {occupancyPercentage}% Full
            </span>
          </div>
          <div className="flex items-end justify-between mt-4">
            <span className="text-3xl font-black text-gray-900 dark:text-white">{uniqueTenants.length}</span>
            <div className="w-16 h-8 opacity-60 group-hover:opacity-100 transition-opacity">
               <svg viewBox="0 0 100 30" className="w-full h-full stroke-emerald-500 fill-none" strokeWidth="3">
                 <path d="M0,25 Q20,20 40,25 T80,10 T100,5" strokeLinecap="round" />
               </svg>
            </div>
          </div>
        </div>

        {/* Metric 3: Spots Left */}
        <div className="bg-white dark:bg-[#111] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-2 uppercase tracking-wider">
              <span className="text-gray-400"><Bed size={14} /></span>
              Spots Left
            </h3>
            <span className="text-[10px] text-blue-500 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded ml-auto">
              {spotsLeft} / {totalCapacity} Spots
            </span>
          </div>
          <div className="flex items-end justify-between mt-4">
            <span className="text-3xl font-black text-gray-900 dark:text-white">{spotsLeft}</span>
            <div className="w-16 h-8 opacity-60 group-hover:opacity-100 transition-opacity">
               <svg viewBox="0 0 100 30" className="w-full h-full stroke-emerald-500 fill-none" strokeWidth="3">
                 <path d="M0,10 L30,25 L60,15 L100,20" strokeLinecap="round" strokeLinejoin="round" />
               </svg>
            </div>
          </div>
        </div>

        {/* Metric 4: Open Issues */}
        <div className="bg-white dark:bg-[#111] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-2 uppercase tracking-wider">
              <span className="text-gray-400"><Wrench size={14} /></span>
              Open Issues
            </h3>
            <span className="text-[10px] text-amber-500 font-bold bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded ml-auto">
              {openRequestsCount} Active
            </span>
          </div>
          <div className="flex items-end justify-between mt-4">
            <span className="text-3xl font-black text-gray-900 dark:text-white">{openRequestsCount}</span>
            <div className="w-16 h-8 flex items-center justify-end gap-1 opacity-80">
               <div className="w-2 h-2 rounded-full bg-amber-200 dark:bg-amber-900"></div>
               <div className="w-2 h-2 rounded-full bg-amber-300 dark:bg-amber-700"></div>
               <div className="w-2 h-2 rounded-full bg-amber-400 dark:bg-amber-500"></div>
               <div className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400"></div>
            </div>
          </div>
        </div>

      </div>

      {/* ══════ RECHARTS CHARTS ROW ══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
        
        {/* Progress Overview (Recharts Area Chart) */}
        <div className="bg-white dark:bg-[#111] p-5 md:p-7 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-3">
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">Progress Overview</h3>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">Property revenue and booking performance trajectory.</p>
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
          <div className="h-[260px] w-full">
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

        {/* Status Split (Recharts Donut Chart) */}
        <div className="bg-white dark:bg-[#111] p-5 md:p-7 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
            <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2 shrink-0">
              <PieChartIcon size={18} className="text-gray-400" />
              {donutMetric}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <CustomDropdown
                options={["Occupancy Split", "Payment Split", "Helpdesk Split"]}
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

          <div className="h-[210px] w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [`${value} Units`, name]}
                  contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#111', color: '#fff' }}
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-2xl font-black text-gray-900 dark:text-white leading-none">{occupancyPercentage}%</span>
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mt-1">Occupied</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 space-y-2">
            {donutData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                </div>
                <span className="text-gray-900 dark:text-white font-black">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ══════ FULL PROPERTY MANAGEMENT SECTIONS (Matching Sidebar List in Image) ══════ */}
      <div className="rounded-3xl border border-gray-100 dark:border-white/5 bg-white dark:bg-[#111] shadow-sm overflow-hidden">
        
        {/* Navigation Tabs (All Bookings, All Requests, All Tenants, All KYC Forms, All Payments, Overview) */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-gray-100 dark:border-white/5 overflow-x-auto bg-gray-50/50 dark:bg-white/[0.01]">
          {[
            { id: "bookings", label: "All Bookings", icon: BookOpenCheck, count: visibleBookings.length },
            { id: "requests", label: "All Requests", icon: Wrench, count: requests.length },
            { id: "tenants", label: "All Tenants", icon: Users, count: uniqueTenants.length },
            { id: "kyc", label: "All KYC Forms", icon: FileText, count: kycForms.length },
            { id: "payments", label: "All Payments", icon: CreditCard, count: paidPayments.length },
            { id: "overview", label: "Overview", icon: Building2, count: null },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-4 px-4 text-xs font-extrabold transition border-b-2 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-500/5"
                    : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isActive ? "bg-blue-500/20 text-blue-600 dark:text-blue-400" : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 sm:p-8">
          
          {/* TAB 1: BOOKINGS */}
          {activeTab === "bookings" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <BookOpenCheck className="text-blue-500" size={18} />
                  <span>Property Booking Applications ({visibleBookings.length})</span>
                </h3>
                <span className="text-xs font-bold text-gray-400">Filtered for {pg.title}</span>
              </div>

              {visibleBookings.length > 0 ? (
                <div className="space-y-3">
                  {visibleBookings.map((b) => (
                    <div key={b.id} className="p-5 rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <h4 className="font-black text-sm text-gray-900 dark:text-white">{b.student_name || b.name || 'Applicant'}</h4>
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                            b.status === 'approved' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' :
                            b.status === 'rejected' ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' :
                            'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                          }`}>
                            {b.status || 'pending'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium">{b.student_email || b.email || 'N/A'} • {b.student_phone || b.phone || 'On file'}</p>
                        <p className="text-xs text-gray-400 font-medium">Room Type: <strong className="text-gray-700 dark:text-gray-300">{b.selected_room_type || 'Standard Room'}</strong> • Applied: {fmtDate(b.created_at || b.booking_date)}</p>
                      </div>

                      {/* Action Controls */}
                      <div className="flex items-center gap-2 self-start md:self-center">
                        {b.status === 'pending' && (
                          <>
                            <button
                              disabled={actionLoading}
                              onClick={() => handleBookingStatusChange(b.id, 'approved')}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white transition shadow-sm cursor-pointer disabled:opacity-50"
                            >
                              <UserCheck size={14} /> <span>Approve</span>
                            </button>
                            <button
                              disabled={actionLoading}
                              onClick={() => handleBookingStatusChange(b.id, 'rejected')}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs font-black text-rose-500 hover:bg-rose-500/20 transition cursor-pointer disabled:opacity-50"
                            >
                              <XCircle size={14} /> <span>Reject</span>
                            </button>
                          </>
                        )}
                        {b.status === 'approved' && (
                          <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                            {b.payment_status === 'paid' ? 'Paid Stay Active' : 'Approved (Awaiting Rent)'}
                          </span>
                        )}
                        {b.status === 'rejected' && (
                          <span className="text-xs font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl">
                            Rejected Application
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-xs font-bold text-gray-400">No booking requests submitted for this PG yet.</div>
              )}
            </div>
          )}

          {/* TAB 2: REQUESTS (Helpdesk Maintenance) */}
          {activeTab === "requests" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Wrench className="text-amber-500" size={18} />
                  <span>Maintenance &amp; Helpdesk Requests ({requests.length})</span>
                </h3>
                <span className="text-xs font-bold text-gray-400">Filtered for {pg.title}</span>
              </div>

              {requests.length > 0 ? (
                <div className="space-y-3">
                  {requests.map((req) => (
                    <div key={req.id} className="p-5 rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className="font-black text-sm text-gray-900 dark:text-white">{req.title}</span>
                          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300">{req.category}</span>
                        </div>
                        <select
                          value={req.status || 'open'}
                          onChange={(e) => handleRequestStatusChange(req.id, e.target.value)}
                          className="text-xs font-black rounded-xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#181818] px-3 py-1.5 text-gray-900 dark:text-white outline-none cursor-pointer"
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">{req.description || 'No description provided.'}</p>
                      <div className="flex flex-wrap items-center justify-between text-[11px] font-semibold text-gray-400 pt-2 border-t border-gray-100 dark:border-white/5">
                        <span>Resident: <strong className="text-gray-700 dark:text-gray-300">{req.student_name || 'Resident'}</strong> ({req.student_phone || 'On file'})</span>
                        <span>Location: <strong className="text-gray-700 dark:text-gray-300">{req.location || 'General'}</strong></span>
                        <span>Filed: {fmtDate(req.created_at || req.filed_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-xs font-bold text-gray-400">Zero maintenance tickets reported for this PG.</div>
              )}
            </div>
          )}

          {/* TAB 3: TENANTS */}
          {activeTab === "tenants" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="text-blue-500" size={18} />
                  <span>Enrolled Active Resident Roster ({uniqueTenants.length})</span>
                </h3>
                <span className="text-xs font-bold text-gray-400">Deduplicated</span>
              </div>

              {uniqueTenants.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {uniqueTenants.map((tenant) => (
                    <div key={tenant.id} className="p-5 rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-black text-sm text-gray-900 dark:text-white">{tenant.student_name || tenant.name || 'Tenant'}</h4>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">{tenant.student_email || tenant.email || 'N/A'}</p>
                        <p className="text-xs text-gray-500 font-medium">{tenant.student_phone || tenant.phone || 'On file'}</p>
                        <span className="inline-block mt-2 text-[10px] font-bold text-indigo-500 bg-indigo-500/10 px-2.5 py-0.5 rounded-md">Room: {tenant.selected_room_type || 'Standard Room'}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase ${
                        tenant.payment_status === 'paid' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-500 border border-blue-500/30'
                      }`}>
                        {tenant.payment_status === 'paid' ? 'Paid Resident' : 'Approved'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-xs font-bold text-gray-400">No active tenants enrolled in this PG property yet.</div>
              )}
            </div>
          )}

          {/* TAB 4: KYC FORMS */}
          {activeTab === "kyc" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="text-purple-500" size={18} />
                  <span>Tenant Registrations &amp; KYC Forms ({kycForms.length})</span>
                </h3>
                <span className="text-xs font-bold text-gray-400">Filtered for {pg.title}</span>
              </div>

              {kycForms.length > 0 ? (
                <div className="space-y-3">
                  {kycForms.map((kyc) => (
                    <div key={kyc.id || kyc.booking_id} className="p-5 rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-sm text-gray-900 dark:text-white">{kyc.student_name || kyc.fullName || 'Resident Applicant'}</h4>
                        <span className="px-3 py-1 rounded-xl text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Verified Tenant</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-gray-500 font-medium pt-1">
                        <div>Occupation: <span className="font-bold text-gray-800 dark:text-gray-200">{kyc.occupation || 'Student'}</span></div>
                        <div>Blood Group: <span className="font-bold text-gray-800 dark:text-gray-200">{kyc.bloodGroup || 'N/A'}</span></div>
                        <div>Emergency Phone: <span className="font-bold text-gray-800 dark:text-gray-200">{kyc.parent1Phone || kyc.guardianPhone || 'On file'}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-xs font-bold text-gray-400">No tenant registration forms submitted for this PG yet.</div>
              )}
            </div>
          )}

          {/* TAB 5: PAYMENTS */}
          {activeTab === "payments" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="text-emerald-500" size={18} />
                  <span>Rent Payments &amp; Receipts ({paidPayments.length})</span>
                </h3>
                <span className="text-xs font-bold text-gray-400">Filtered for {pg.title}</span>
              </div>

              {paidPayments.length > 0 ? (
                <div className="space-y-3">
                  {paidPayments.map((pmt) => (
                    <div key={pmt.id} className="p-5 rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-black text-sm text-gray-900 dark:text-white">{pmt.student_name || pmt.name || 'Tenant'}</h4>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">{pmt.title || pg.title} • Booking #{pmt.id}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">Date: {fmtDate(pmt.created_at || pmt.booking_date)}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-black text-emerald-500">₹{Number(pmt.booked_price || pmt.price || pg.price || 0).toLocaleString()}</div>
                        <span className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md">Paid via Razorpay</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-xs font-bold text-gray-400">No rent payment receipts recorded for this PG yet.</div>
              )}
            </div>
          )}

          {/* TAB 6: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">Pricing &amp; Room Specs</h4>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Monthly Rent: <span className="text-emerald-500 font-black">₹{Number(pg.price || 0).toLocaleString()}</span></p>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Available Capacity: <span className="text-blue-500 font-black">{availableRooms} / {totalRooms} Rooms Available</span></p>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">PG Type: <span className="capitalize">{pg.pg_type || 'Boys'} Accommodation</span></p>
                </div>

                <div className="p-6 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">Location &amp; Contact</h4>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Address: {pg.address || `${pg.area || ''}, ${pg.city || ''}`}</p>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Owner Contact: {pg.owner_phone || pg.phone || 'On file'}</p>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Listing Status: <span className="text-emerald-500 uppercase tracking-wider">{pg.status || 'APPROVED'}</span></p>
                </div>
              </div>

              {pg.description && (
                <div className="p-6 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-2">Property Description</h4>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium leading-relaxed">{pg.description}</p>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
