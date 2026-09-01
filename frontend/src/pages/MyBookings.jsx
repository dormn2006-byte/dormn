import { useEffect, useState, useCallback, useContext, useRef, memo, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import MacOSDock from "../components/ui/mac-os-dock";
import { ThemeSwitch } from "../components/ui/theme-switch-button";
import { buildStudentDockApps } from "../constants/studentDockConfig";
import {
  BookOpen, MapPin,
  Calendar, CreditCard, BedDouble,
  Building2, Home, Search, User, Heart, Settings, ChevronRight, Users, XCircle, AlertCircle, CheckCircle
} from "lucide-react";
import { loadRazorpayScript } from "../utils/razorpay";

const StatusBadge = memo(({ status }) => {
  const cls = status === "approved"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : status === "rejected"
    ? "bg-rose-50 text-rose-700 border-rose-200"
    : status === "cancelled"
    ? "bg-gray-50 text-gray-500 border-gray-200"
    : status === "paused"
    ? "bg-blue-50 text-blue-500 border-blue-200"
    : "bg-amber-50 text-amber-700 border-amber-200";
  return <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${cls}`}>{status || "pending"}</span>;
});
StatusBadge.displayName = "StatusBadge";

const SectionCard = memo(({ children, className = "" }) => (
  <div className={`rounded-2xl border border-gray-100/80 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.03)] ${className}`}>{children}</div>
));
SectionCard.displayName = "SectionCard";

const MyBookings = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [payingBookingId, setPayingBookingId] = useState(null);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const menuRef = useRef(null);
  const DOCK_APPS = useMemo(() => buildStudentDockApps(user?.id), [user?.id]);

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
    if (!amount) {
      alert("Invalid price details for this booking.");
      return;
    }

    const res = await loadRazorpayScript();
    if (!res) {
      alert("Razorpay SDK failed to load. Please check your internet connection.");
      return;
    }

    setPayingBookingId(booking.id);
    try {
      const orderRes = await api.post("/payments/create-order", {
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
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Dormn Platform",
        description: `Booking activation for ${booking.pg_name || booking.title || "Accommodation"}`,
        order_id: orderData.order_id,
        handler: async function (response) {
          try {
            const verifyRes = await api.post("/payments/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              booking_id: orderData.booking_id || booking.id
            });

            if (verifyRes.data.success) {
              navigate("/my-pg");
            }
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
        theme: {
          color: "#0D3A1D"
        }
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
      
      // Deduplicate bookings: ensure each PG is shown only once (keeping the latest/active status)
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBookings();
  }, [fetchBookings]);

  const handleDockClick = useCallback((id) => navigate(id), [navigate]);

  const stats = {
    total: bookings.length,
    approved: bookings.filter(b => b.status === "approved").length,
    pending: bookings.filter(b => b.status === "pending").length,
    rejected: bookings.filter(b => b.status === "rejected").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9f3] to-[#f0f1eb] pb-28 font-sans selection:bg-[#93B733]/20">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 border-b border-gray-200/40 dark:border-gray-800/40 bg-white/70 dark:bg-black/70 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1600px] h-14 items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo-sm.webp" alt="Dormn" className="h-7 w-7 object-contain" />
            <span className="text-base font-black text-[#0D3A1D] dark:text-gray-200 tracking-tight">Dormn</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeSwitch />
            <div className="relative" ref={menuRef}>
              <button onClick={() => setShowMenu(v => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 overflow-hidden hover:border-[#93B733] transition-all">
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

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">
        {/* ── PAGE TITLE HERO CARD ── */}
        <SectionCard className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#93B733] mb-1.5">
                <Building2 size={16} /> Student Stay Portal
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#0D3A1D] tracking-tight">My Requests</h1>
              <p className="text-xs sm:text-sm font-medium text-gray-500 mt-1 max-w-xl leading-relaxed">
                Track all your PG visit requests, booking approvals, payment statuses, and stay details in one place.
              </p>
            </div>
            <Link
              to="/pgs"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#93B733] px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#82a32d] transition-all self-start sm:self-auto shrink-0"
            >
              <Search size={16} /> Explore More PGs
            </Link>
          </div>

          {/* Quick Summary Pill Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 text-center shadow-2xs">
              <p className="text-2xl font-black text-[#0D3A1D]">{stats.total}</p>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mt-1">Total Requests</p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-4 text-center shadow-2xs">
              <p className="text-2xl font-black text-emerald-700">{stats.approved}</p>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mt-1">Approved</p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/30 p-4 text-center shadow-2xs">
              <p className="text-2xl font-black text-amber-700">{stats.pending}</p>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-600 mt-1">Pending</p>
            </div>
            <div className="rounded-xl border border-rose-100 bg-rose-50/30 p-4 text-center shadow-2xs">
              <p className="text-2xl font-black text-rose-700">{stats.rejected}</p>
              <p className="text-xs font-bold uppercase tracking-wider text-rose-600 mt-1">Rejected</p>
            </div>
          </div>
        </SectionCard>

        {/* ── BOOKINGS CONTENT ── */}
        {loading && (
          <SectionCard className="p-16 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#93B733] border-t-transparent mb-3" />
            <p className="text-sm font-bold text-gray-500">Loading your requests...</p>
          </SectionCard>
        )}

        {error && (
          <SectionCard className="p-6 border-rose-200 bg-rose-50/50 text-rose-700 text-sm font-bold">
            {error}
          </SectionCard>
        )}

        {!loading && !error && bookings.length === 0 && (
          <SectionCard className="p-12 sm:p-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#93B733]/10 text-[#93B733]">
              <Home size={32} />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-[#0D3A1D] mb-1.5">No Requests Found</h2>
            <p className="text-xs sm:text-sm font-medium text-gray-500 max-w-sm mx-auto mb-6">
              You haven't requested any visits yet. Explore our curated PG listings to find your ideal home!
            </p>
            <Link
              to="/pgs"
              className="inline-flex items-center gap-2 rounded-xl bg-[#93B733] px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#82a32d] transition-all"
            >
              <Search size={16} /> Explore PGs Now
            </Link>
          </SectionCard>
        )}

        {!loading && !error && bookings.length > 0 && (
          <div className="space-y-5">
            {bookings.map((booking) => (
              <SectionCard key={booking.id} className="p-0 overflow-hidden transition-all hover:shadow-md">
                {/* Top Card Section */}
                <div className="p-6 sm:p-8 bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-lg sm:text-xl font-black text-[#0D3A1D] leading-tight">
                          {booking.pg_name || booking.title || `Accommodation #${booking.pg_id}`}
                        </h3>
                        <StatusBadge status={booking.status} />
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm font-semibold text-gray-500 mt-2.5">
                        {booking.owner_name && (
                          <span className="flex items-center gap-1.5">
                            <User size={14} className="text-gray-400 shrink-0" />
                            Owner: <strong className="text-[#0D3A1D]">{booking.owner_name}</strong>
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-gray-400 shrink-0" />
                          Requested: <strong className="text-[#0D3A1D]">{new Date(booking.booking_date || booking.created_at).toLocaleDateString()}</strong>
                        </span>
                        {booking.pg_address && (
                          <span className="flex items-center gap-1.5">
                            <MapPin size={14} className="text-gray-400 shrink-0" />
                            {booking.pg_address}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
                      {booking.pg_id && (
                        <Link
                          to={`/pg/${booking.pg_id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-4 py-2 text-xs sm:text-sm font-bold text-gray-600 hover:border-[#93B733] hover:text-[#0D3A1D] transition-colors"
                        >
                          View PG Details <ChevronRight size={14} />
                        </Link>
                      )}
                      {(booking.status === "pending" || booking.status === "paused") && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={cancellingBookingId === booking.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs sm:text-sm font-bold text-rose-600 hover:bg-rose-100 hover:border-rose-300 transition-all active:scale-[0.98] disabled:opacity-50"
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

                {/* Paused Notification Banner */}
                {booking.status === "paused" && (
                  <div className="border-t border-blue-100 bg-blue-50/60 p-4 sm:p-5 flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600 shrink-0 mt-0.5">
                      <AlertCircle size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-blue-900 uppercase tracking-wider">Request Paused</p>
                      <p className="text-xs text-blue-800/80 font-medium mt-0.5 leading-relaxed">
                        This request is paused because another PG booking was approved. The details are hidden from the owner and this request will automatically be removed in 30 minutes if you complete the approved stay.
                      </p>
                    </div>
                  </div>
                )}

                {/* Approved Breakdown Footer & Resident Portal Access */}
                {booking.status === "approved" && (
                  <div className="border-t border-gray-100 bg-[#FAF9F5]/75 p-5">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                          <CheckCircle size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-emerald-700 uppercase tracking-wider">Booking Approved by Owner!</p>
                          <p className="text-xs text-gray-500 font-medium mt-0.5">Your accommodation is approved and resident portal is ready.</p>
                        </div>
                      </div>
                      <Link
                        to="/my-pg"
                        className="inline-flex items-center gap-2 rounded-xl bg-[#0D3A1D] hover:bg-[#16502a] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all active:scale-[0.98]"
                      >
                        Open Resident Portal <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                )}
              </SectionCard>
            ))}
          </div>
        )}
      </div>

      {/* ── MACOS DOCK NAVBAR ── */}
      <div className="fixed bottom-4 left-0 right-0 z-30 flex justify-center pointer-events-none">
        <div className="pointer-events-auto">
          <MacOSDock apps={DOCK_APPS} onAppClick={handleDockClick} openApps={["/my-bookings"]} />
        </div>
      </div>
    </div>
  );
};

export default memo(MyBookings);
