import { useEffect, useState, useCallback, useContext, useRef, memo, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import MacOSDock from "../components/ui/mac-os-dock";
import { ThemeSwitch } from "../components/ui/theme-switch-button";
import { buildStudentDockApps } from "../constants/studentDockConfig";
import {
  Calendar, Building2, Home, Search, User, ChevronRight, XCircle, AlertCircle, CheckCircle,
  CalendarClock, CalendarCheck, Clock, Phone, MessageSquare, MapPin, IndianRupee
} from "lucide-react";
import { loadRazorpayScript } from "../utils/razorpay";
import { formatVisitDate } from "../utils/visitDate";

const StatusBadge = memo(({ status, paymentStatus }) => {
  const isPaid = paymentStatus === "paid" || status === "paid";
  const cls = isPaid ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : status === "approved" ? "bg-amber-50 text-amber-700 border-amber-200"
    : status === "rejected" ? "bg-rose-50 text-rose-700 border-rose-200"
    : status === "cancelled" ? "bg-gray-50 text-gray-500 border-gray-200"
    : status === "paused" ? "bg-blue-50 text-blue-500 border-blue-200"
    : "bg-amber-50 text-amber-700 border-amber-200";

  const label = isPaid ? "Confirmed & Paid"
    : status === "approved" ? "Approved (Awaiting Payment)"
    : status || "pending";

  return <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${cls}`}>{label}</span>;
});
StatusBadge.displayName = "StatusBadge";

const VisitStatusBadge = memo(({ status }) => {
  const isConfirmed = status === "confirmed", isCompleted = status === "completed", isCancelled = status === "cancelled";
  const cls = isConfirmed ? "bg-blue-50 text-blue-700 border-blue-200"
    : isCompleted ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : isCancelled ? "bg-rose-50 text-rose-700 border-rose-200"
    : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wider ${cls}`}>
      {isConfirmed ? <CalendarCheck size={13} /> : isCompleted ? <CheckCircle size={13} /> : isCancelled ? <XCircle size={13} /> : <Clock size={13} />}
      {isConfirmed ? "Confirmed by Owner" : isCompleted ? "Completed" : isCancelled ? "Cancelled" : "Pending Verification"}
    </span>
  );
});
VisitStatusBadge.displayName = "VisitStatusBadge";

const SectionCard = memo(({ children, className = "" }) => (
  <div className={`rounded-2xl border border-gray-100/80 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.03)] ${className}`}>{children}</div>
));
SectionCard.displayName = "SectionCard";

const MyBookings = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") === "visits" ? "visits" : "bookings");
  const [bookings, setBookings] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visitsLoading, setVisitsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [payingBookingId, setPayingBookingId] = useState(null);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [cancellingVisitId, setCancellingVisitId] = useState(null);
  const menuRef = useRef(null);
  const DOCK_APPS = useMemo(() => buildStudentDockApps(user?.id), [user?.id]);

  useEffect(() => {
    setActiveTab(searchParams.get("tab") === "visits" ? "visits" : "bookings");
  }, [searchParams]);

  const handleCancelVisit = async (visitId) => {
    if (!window.confirm("Are you sure you want to cancel this visit request?")) return;
    setCancellingVisitId(visitId);
    try {
      await api.put(`/visits/${visitId}/cancel`);
      await fetchVisits();
    } catch (err) {
      console.error("Cancel visit error:", err);
      alert(err?.response?.data?.message || "Failed to cancel visit.");
    } finally {
      setCancellingVisitId(null);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking request?")) return;
    setCancellingBookingId(bookingId);
    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      await fetchBookings();
    } catch (err) {
      console.error("Cancel booking error:", err);
      alert(err?.response?.data?.message || "Failed to cancel booking request.");
    } finally {
      setCancellingBookingId(null);
    }
  };

  const handlePayNow = async (booking) => {
    const amount = Number(booking.booked_price || booking.price || 0);
    if (!amount) return alert("Invalid price details for this booking.");

    const res = await loadRazorpayScript();
    if (!res) return alert("Razorpay SDK failed to load. Please check your internet connection.");

    setPayingBookingId(booking.id);
    try {
      const orderRes = await api.post("/payments/create-order", {
        booking_id: Number(booking.id || booking.booking_id),
        pg_id: Number(booking.pg_id),
        owner_id: Number(booking.owner_id),
        amount_in_rupees: amount
      });

      const orderData = orderRes.data;
      if (!orderData.success) {
        alert("Failed to initialize payment: " + (orderData.message || "Unknown error"));
        setPayingBookingId(null);
        return;
      }

      const options = {
        key: orderData.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Dormn Platform",
        description: `Booking activation for ${booking.pg_name || booking.title || "Accommodation"}`,
        order_id: orderData.order_id,
        handler: async (response) => {
          try {
            const verifyRes = await api.post("/payments/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              booking_id: orderData.booking_id || booking.id
            });
            if (verifyRes.data.success) navigate("/my-pg");
          } catch (err) {
            console.error("Verification failed", err);
            alert("Payment completed, but verification failed. Please contact support.");
          } finally {
            setPayingBookingId(null);
          }
        },
        prefill: {
          name: user?.name || user?.full_name || "Student",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: { color: "#0D3A1D" }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      console.error("Payment setup error:", err);
      alert(err?.response?.data?.message || "Failed to start payment process.");
      setPayingBookingId(null);
    }
  };

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await api.get("/bookings/my-bookings");
      const rawData = res.data?.bookings || res.data;
      const data = Array.isArray(rawData) ? [...rawData] : [];
      
      const uniqueMap = new Map();
      data.forEach((b) => {
        const pgKey = b.pg_id || b.id;
        if (!uniqueMap.has(pgKey)) {
          uniqueMap.set(pgKey, b);
        } else {
          const existing = uniqueMap.get(pgKey);
          if (b.status === "approved" && existing.status !== "approved") {
            uniqueMap.set(pgKey, b);
          } else if (new Date(b.booking_date || b.created_at || 0) > new Date(existing.booking_date || existing.created_at || 0)) {
            uniqueMap.set(pgKey, b);
          }
        }
      });
      const uniqueList = Array.from(uniqueMap.values());
      uniqueList.sort((a, b) => {
        if (a.status === "approved" && b.status !== "approved") return -1;
        if (a.status !== "approved" && b.status === "approved") return 1;
        return new Date(b.booking_date || b.created_at || 0) - new Date(a.booking_date || a.created_at || 0);
      });
      setBookings(uniqueList);
    } catch (err) {
      console.error("My Bookings Error:", err);
      setError(err?.response?.data?.message || "Failed to load your requests");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVisits = useCallback(async () => {
    try {
      setVisitsLoading(true);
      const res = await api.get("/visits/my");
      const rawData = res.data?.visits || res.data?.data || (Array.isArray(res.data) ? res.data : []);
      const data = Array.isArray(rawData) ? [...rawData] : [];

      const uniqueMap = new Map();
      data.forEach((v) => {
        const key = v.id || v._id;
        if (key) uniqueMap.set(key, { ...v, id: key });
      });

      const uniqueList = Array.from(uniqueMap.values());
      uniqueList.sort((a, b) => {
        if (a.status === "confirmed" && b.status !== "confirmed") return -1;
        if (a.status !== "confirmed" && b.status === "confirmed") return 1;
        return new Date(b.created_at || b.visit_date || 0) - new Date(a.created_at || a.visit_date || 0);
      });

      setVisits(uniqueList);
    } catch (err) {
      console.error("My Visits Error:", err);
    } finally {
      setVisitsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
    fetchVisits();
  }, [fetchBookings, fetchVisits]);

  useEffect(() => {
    if (!searchParams.get("tab") && !loading && !visitsLoading && bookings.length === 0 && visits.length > 0) {
      setActiveTab("visits");
    }
  }, [searchParams, loading, visitsLoading, bookings.length, visits.length]);

  const handleDockClick = useCallback((id) => navigate(id), [navigate]);
  const isVisitsTab = activeTab === "visits";

  const stats = useMemo(() => {
    if (isVisitsTab) {
      return {
        total: visits.length,
        approved: visits.filter(v => v.status === "confirmed").length,
        pending: visits.filter(v => v.status === "pending").length,
        rejected: visits.filter(v => v.status === "cancelled").length,
      };
    }
    return {
      total: bookings.length,
      approved: bookings.filter(b => b.status === "approved").length,
      pending: bookings.filter(b => b.status === "pending").length,
      rejected: bookings.filter(b => b.status === "rejected").length,
    };
  }, [isVisitsTab, visits, bookings]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9f3] to-[#f0f1eb] pb-28 font-sans selection:bg-[#93B733]/20">
      <header className="sticky top-0 z-40 border-b border-gray-200/40 dark:border-gray-800/40 bg-white/70 dark:bg-black/70 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1600px] h-14 items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo-sm.webp" alt="Dormn" className="h-7 w-7 object-contain" />
            <span className="text-base font-black text-[#0D3A1D] dark:text-gray-200 tracking-tight">Dormn</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeSwitch />
            <div className="relative" ref={menuRef}>
              <button onClick={() => setShowMenu(v => !v)} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 overflow-hidden hover:border-[#93B733] transition-all">
                <span className="text-sm font-bold text-[#0D3A1D] dark:text-gray-200">{(user?.name || "S").charAt(0).toUpperCase()}</span>
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-black shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <Link to="/my-pg" onClick={() => setShowMenu(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-[#0D3A1D] dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                    <Building2 size={16} /> My PG
                  </Link>
                  <Link to="/pgs" onClick={() => setShowMenu(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-[#0D3A1D] dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                    <Search size={16} /> Explore PGs
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
        <SectionCard className="p-4 sm:p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#93B733] mb-1.5">
                <Building2 size={16} /> Student Stay Portal
              </div>
              <h1 className="text-xl sm:text-3xl font-black text-[#0D3A1D] tracking-tight">My Requests</h1>
              <p className="text-xs sm:text-sm font-medium text-gray-500 mt-1 max-w-xl leading-relaxed">
                Track all your PG visit requests, booking approvals, payment statuses, and stay details in one place.
              </p>
            </div>
            <Link to="/pgs" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#93B733] px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#82a32d] transition-all self-start sm:self-auto shrink-0">
              <Search size={16} /> Explore More PGs
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100">
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-2.5 sm:p-4 text-center shadow-2xs">
              <p className="text-xl sm:text-2xl font-black text-[#0D3A1D]">{stats.total}</p>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 mt-0.5 sm:mt-1">{isVisitsTab ? "Total Visits" : "Total Requests"}</p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-2.5 sm:p-4 text-center shadow-2xs">
              <p className="text-xl sm:text-2xl font-black text-emerald-700">{stats.approved}</p>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 mt-0.5 sm:mt-1">{isVisitsTab ? "Confirmed" : "Approved"}</p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/30 p-2.5 sm:p-4 text-center shadow-2xs">
              <p className="text-xl sm:text-2xl font-black text-amber-700">{stats.pending}</p>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-600 mt-0.5 sm:mt-1">Pending</p>
            </div>
            <div className="rounded-xl border border-rose-100 bg-rose-50/30 p-2.5 sm:p-4 text-center shadow-2xs">
              <p className="text-xl sm:text-2xl font-black text-rose-700">{stats.rejected}</p>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rose-600 mt-0.5 sm:mt-1">{isVisitsTab ? "Cancelled" : "Rejected"}</p>
            </div>
          </div>
        </SectionCard>

        {/* Tabs Switcher */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-gray-100/80 border border-gray-200/60 w-full sm:w-auto self-start">
          <button
            type="button"
            onClick={() => { setActiveTab("bookings"); setSearchParams({}); }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "bookings" ? "bg-white text-[#0D3A1D] shadow-xs font-black" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Home size={15} />
            <span>Room Bookings</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === "bookings" ? "bg-[#93B733]/20 text-[#3d5a08]" : "bg-gray-200 text-gray-600"}`}>{bookings.length}</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab("visits"); setSearchParams({ tab: "visits" }); }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "visits" ? "bg-white text-[#0D3A1D] shadow-xs font-black" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <CalendarClock size={15} />
            <span>Scheduled PG Visits</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === "visits" ? "bg-[#93B733]/20 text-[#3d5a08]" : "bg-gray-200 text-gray-600"}`}>{visits.length}</span>
          </button>
        </div>

        {/* Visits Tab Content */}
        {isVisitsTab && (
          <>
            {visitsLoading && (
              <SectionCard className="p-16 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#93B733] border-t-transparent mb-3" />
                <p className="text-sm font-bold text-gray-500">Loading your scheduled visits...</p>
              </SectionCard>
            )}

            {!visitsLoading && visits.length === 0 && (
              <SectionCard className="p-12 sm:p-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
                  <CalendarClock size={32} />
                </div>
                <h2 className="text-lg sm:text-xl font-black text-[#0D3A1D] mb-1.5">No Scheduled Visits Yet</h2>
                <p className="text-xs sm:text-sm font-medium text-gray-500 max-w-sm mx-auto mb-6">
                  Want to see a PG in person before making a decision? Explore listings and schedule an in-person tour!
                </p>
                <Link to="/pgs" className="inline-flex items-center gap-2 rounded-xl bg-[#93B733] px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#82a32d] transition-all">
                  <Search size={16} /> Explore PGs Now
                </Link>
              </SectionCard>
            )}

            {!visitsLoading && visits.length > 0 && (
              <div className="space-y-5">
                {visits.map((visit) => {
                  const isConfirmed = visit.status === "confirmed", isPending = visit.status === "pending", isCancelled = visit.status === "cancelled";
                  const visitDateStr = visit.visit_date ? new Date(visit.visit_date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "Scheduled Date";
                  const cleanDigits = (visit.owner_phone || visit.pg_phone || "").replace(/\D/g, "");
                  const waNumber = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;

                  return (
                    <SectionCard key={visit.id} className="p-0 overflow-hidden transition-all hover:shadow-md">
                      <div className="p-4 sm:p-6 md:p-8 bg-white">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2.5">
                              <h3 className="text-lg sm:text-xl font-black text-[#0D3A1D] leading-tight">{visit.pg_title || visit.pg_name || `PG #${visit.pg_id}`}</h3>
                              <VisitStatusBadge status={visit.status} />
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm font-semibold text-gray-500 mt-2.5">
                              <span className="flex items-center gap-1.5 text-gray-900 font-bold">
                                <Calendar size={14} className="text-[#93B733] shrink-0" />
                                Visit Date: <strong className="text-[#0D3A1D]">{visitDateStr}</strong>
                              </span>
                              <span className="flex items-center gap-1.5 text-gray-900 font-bold">
                                <Clock size={14} className="text-[#93B733] shrink-0" />
                                Time: <strong className="text-[#0D3A1D]">{visit.visit_time_slot}</strong>
                              </span>
                              {(visit.pg_area || visit.pg_city) && (
                                <span className="flex items-center gap-1.5">
                                  <MapPin size={14} className="text-gray-400 shrink-0" />
                                  {[visit.pg_area, visit.pg_city].filter(Boolean).join(", ")}
                                </span>
                              )}
                              {visit.owner_name && (
                                <span className="flex items-center gap-1.5">
                                  <User size={14} className="text-gray-400 shrink-0" />
                                  Owner: <strong className="text-[#0D3A1D]">{visit.owner_name}</strong>
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
                            {visit.pg_id && (
                              <Link to={`/pg/${visit.pg_id}`} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-4 py-2 text-xs sm:text-sm font-bold text-gray-600 hover:border-[#93B733] hover:text-[#0D3A1D] transition-colors">
                                View PG Details <ChevronRight size={14} />
                              </Link>
                            )}
                            {(isPending || isConfirmed) && (
                              <button
                                onClick={() => handleCancelVisit(visit.id)}
                                disabled={cancellingVisitId === visit.id}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs sm:text-sm font-bold text-rose-600 hover:bg-rose-100 hover:border-rose-300 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                              >
                                <XCircle size={14} />
                                {cancellingVisitId === visit.id ? "Cancelling..." : "Cancel Visit"}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Status Callout Banner */}
                        <div className={`mt-5 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                          isConfirmed ? "bg-blue-50/80 border border-blue-200/80" : isPending ? "bg-amber-50/80 border border-amber-200/80" : isCancelled ? "bg-rose-50/80 border border-rose-200/80" : "bg-gray-50 border border-gray-200"
                        }`}>
                          <div className="flex items-start gap-3">
                            <div className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 mt-0.5 ${isConfirmed ? "bg-blue-600 text-white" : isPending ? "bg-amber-500 text-white" : "bg-gray-400 text-white"}`}>
                              {isConfirmed ? <CalendarCheck size={18} /> : isPending ? <Clock size={18} /> : <AlertCircle size={18} />}
                            </div>
                            <div>
                              <p className={`text-xs font-black uppercase tracking-wider ${isConfirmed ? "text-blue-900" : isPending ? "text-amber-900" : isCancelled ? "text-rose-900" : "text-gray-700"}`}>
                                {isConfirmed ? "Visit Confirmed by Owner! 🎉" : isPending ? "Pending Verification by Owner ⏳" : isCancelled ? "Visit Request Cancelled" : "Visit Status"}
                              </p>
                              <p className={`text-xs font-medium mt-0.5 leading-relaxed ${isConfirmed ? "text-blue-800/90" : isPending ? "text-amber-800/90" : isCancelled ? "text-rose-800/90" : "text-gray-600"}`}>
                                {isConfirmed ? `The property owner has confirmed your visit for ${visitDateStr} (${visit.visit_time_slot}). They are expecting you at the PG!`
                                  : isPending ? `Your visit request for ${visitDateStr} (${visit.visit_time_slot}) is awaiting owner confirmation. You will be notified once confirmed.`
                                  : "This visit was cancelled."}
                              </p>
                            </div>
                          </div>

                          {(isConfirmed || isPending) && cleanDigits && (
                            <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200/60">
                              <a
                                href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi ${visit.owner_name || "Owner"}, regarding my scheduled visit on ${visitDateStr} (${visit.visit_time_slot}) for ${visit.pg_title || visit.pg_name}...`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white px-3.5 py-2 text-xs font-black shadow-xs transition cursor-pointer"
                              >
                                <MessageSquare size={13} />
                                <span>WhatsApp Owner</span>
                              </a>
                              <a href={`tel:${cleanDigits}`} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 text-xs font-black shadow-xs transition cursor-pointer">
                                <Phone size={13} />
                                <span>Call</span>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </SectionCard>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Bookings Tab Content */}
        {!isVisitsTab && (
          <>
            {loading && (
              <SectionCard className="p-16 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#93B733] border-t-transparent mb-3" />
                <p className="text-sm font-bold text-gray-500">Loading your requests...</p>
              </SectionCard>
            )}

            {error && <SectionCard className="p-6 border-rose-200 bg-rose-50/50 text-rose-700 text-sm font-bold">{error}</SectionCard>}

            {!loading && !error && bookings.length === 0 && (
              <SectionCard className="p-12 sm:p-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#93B733]/10 text-[#93B733]"><Home size={32} /></div>
                <h2 className="text-lg sm:text-xl font-black text-[#0D3A1D] mb-1.5">No Requests Found</h2>
                <p className="text-xs sm:text-sm font-medium text-gray-500 max-w-sm mx-auto mb-6">You haven't requested any visits yet. Explore our curated PG listings to find your ideal home!</p>
                <Link to="/pgs" className="inline-flex items-center gap-2 rounded-xl bg-[#93B733] px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#82a32d] transition-all">
                  <Search size={16} /> Explore PGs Now
                </Link>
              </SectionCard>
            )}

            {!loading && !error && bookings.length > 0 && (
              <div className="space-y-5">
                {bookings.map((booking) => (
                  <SectionCard key={booking.id} className="p-0 overflow-hidden transition-all hover:shadow-md">
                    <div className="p-4 sm:p-6 md:p-8 bg-white">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2.5">
                            <h3 className="text-lg sm:text-xl font-black text-[#0D3A1D] leading-tight">{booking.pg_name || booking.title || `Accommodation #${booking.pg_id}`}</h3>
                            <StatusBadge status={booking.status} paymentStatus={booking.payment_status} />
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm font-semibold text-gray-500 mt-2.5">
                            {booking.owner_name && (
                              <span className="flex items-center gap-1.5"><User size={14} className="text-gray-400 shrink-0" />Owner: <strong className="text-[#0D3A1D]">{booking.owner_name}</strong></span>
                            )}
                            <span className="flex items-center gap-1.5"><Calendar size={14} className="text-gray-400 shrink-0" />Requested: <strong className="text-[#0D3A1D]">{new Date(booking.booking_date || booking.created_at).toLocaleDateString()}</strong></span>
                            {booking.visit_date && booking.visit_time && (
                              <span className="flex items-center gap-1.5"><CalendarClock size={14} className="text-[#93B733] shrink-0" />Visit: <strong className="text-[#0D3A1D]">{formatVisitDate(booking.visit_date)} at {booking.visit_time}</strong></span>
                            )}
                            {booking.pg_address && (
                              <span className="flex items-center gap-1.5"><MapPin size={14} className="text-gray-400 shrink-0" />{booking.pg_address}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
                          {booking.pg_id && (
                            <Link to={`/pg/${booking.pg_id}`} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-4 py-2 text-xs sm:text-sm font-bold text-gray-600 hover:border-[#93B733] hover:text-[#0D3A1D] transition-colors">
                              View PG Details <ChevronRight size={14} />
                            </Link>
                          )}
                          {(booking.status === "pending" || booking.status === "paused") && (
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              disabled={cancellingBookingId === booking.id}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs sm:text-sm font-bold text-rose-600 hover:bg-rose-100 hover:border-rose-300 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                            >
                              <XCircle size={14} />
                              {cancellingBookingId === booking.id ? "Cancelling..." : "Cancel Request"}
                            </button>
                          )}
                        </div>
                      </div>

                      {booking.message && (
                        <div className="mt-5 rounded-xl bg-gray-50 border border-gray-100 p-4 text-xs sm:text-sm font-medium text-gray-600 leading-relaxed">
                          <strong className="text-[#0D3A1D] block mb-1">Request Note / Message:</strong>
                          {booking.message}
                        </div>
                      )}
                    </div>

                    {booking.status === "paused" && (
                      <div className="border-t border-blue-100 bg-blue-50/60 p-4 sm:p-5 flex items-start gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600 shrink-0 mt-0.5"><AlertCircle size={18} /></div>
                        <div>
                          <p className="text-xs font-black text-blue-900 uppercase tracking-wider">Request Paused</p>
                          <p className="text-xs text-blue-800/80 font-medium mt-0.5 leading-relaxed">This request is paused because another PG booking was approved.</p>
                        </div>
                      </div>
                    )}

                    {booking.status === "pending" && (
                      <div className="border-t border-amber-100 bg-amber-50/50 p-4 sm:p-5 flex items-start gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600 shrink-0 mt-0.5"><Clock size={18} /></div>
                        <div>
                          <p className="text-xs font-black text-amber-900 uppercase tracking-wider">Awaiting Owner Approval ⏳</p>
                          <p className="text-xs text-amber-800/80 font-medium mt-0.5 leading-relaxed">
                            Your booking request is being reviewed by the PG owner. Once the owner approves your application, the payment button will unlock here so you can confirm your stay and activate your resident portal.
                          </p>
                        </div>
                      </div>
                    )}

                    {(booking.payment_status === "paid" || booking.status === "paid") && (
                      <div className="border-t border-emerald-100 bg-emerald-50/50 p-5">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shrink-0"><CheckCircle size={18} /></div>
                            <div>
                              <p className="text-xs font-black text-emerald-800 uppercase tracking-wider">Stay Confirmed & Paid! 🎉</p>
                              <p className="text-xs text-emerald-700/80 font-medium mt-0.5">Your room is reserved and your full resident portal is activated.</p>
                            </div>
                          </div>
                          <Link to="/my-pg" className="inline-flex items-center gap-2 rounded-xl bg-[#0D3A1D] hover:bg-[#16502a] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all active:scale-[0.98]">
                            Open Resident Portal <ChevronRight size={14} />
                          </Link>
                        </div>
                      </div>
                    )}

                    {booking.status === "approved" && booking.payment_status !== "paid" && (
                      <div className="border-t border-emerald-200 bg-emerald-50/70 p-5">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shrink-0 shadow-sm"><CheckCircle size={18} /></div>
                            <div>
                              <p className="text-xs font-black text-emerald-800 uppercase tracking-wider">Booking Approved by Owner! 🎉</p>
                              <p className="text-xs text-emerald-700 font-medium mt-0.5 leading-relaxed">
                                The owner accepted your request for {booking.selected_room_type || "accommodation"}. Pay now to confirm your stay and unlock your resident portal.
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handlePayNow(booking)}
                            disabled={payingBookingId === booking.id}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#93B733] hover:bg-[#82a32d] px-6 py-2.5 text-xs sm:text-sm font-black text-white shadow-md transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 shrink-0"
                          >
                            <IndianRupee size={15} />
                            {payingBookingId === booking.id ? "Processing Payment..." : `Pay ₹${(Number(booking.booked_price || booking.price || 0)).toLocaleString()} Now`}
                          </button>
                        </div>
                      </div>
                    )}
                  </SectionCard>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="fixed bottom-4 left-0 right-0 z-30 flex justify-center pointer-events-none">
        <div className="pointer-events-auto">
          <MacOSDock apps={DOCK_APPS} onAppClick={handleDockClick} openApps={["/my-bookings"]} />
        </div>
      </div>
    </div>
  );
};

export default memo(MyBookings);
