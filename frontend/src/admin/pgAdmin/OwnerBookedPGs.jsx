import { useState, useEffect, useCallback, useContext, useMemo, memo } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Calendar,
  Clock,
  MapPin,
  IndianRupee,
  Phone,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Search,
  Sparkles,
  CreditCard,
  ShieldCheck,
  Bed,
  CalendarDays,
  CalendarRange,
  Layers,
} from "lucide-react";
import api, { IMAGE_BASE_URL } from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import { loadRazorpayScript } from "../../utils/razorpay";
import FilterTabs from "./components/FilterTabs";

const parseImages = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw); } catch { return []; }
};

const STATUS_CONFIGS = {
  paid: { cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", label: "Confirmed & Paid", icon: CheckCircle2 },
  confirmed: { cls: "bg-blue-500/15 text-blue-600 dark:text-blue-400", label: "Confirmed", icon: CheckCircle2 },
  approved: { cls: "bg-blue-500/15 text-blue-600 dark:text-blue-400", label: "Approved (Payment Pending)", icon: Clock },
  rejected: { cls: "bg-rose-500/15 text-rose-600 dark:text-rose-400", label: "Rejected", icon: XCircle },
  cancelled: { cls: "bg-gray-500/15 text-gray-600 dark:text-gray-400", label: "Cancelled", icon: XCircle },
  default: { cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400", label: "Pending", icon: Clock },
};

const StatusBadge = memo(({ status, paymentStatus }) => {
  const key = paymentStatus === "paid" || status === "paid" ? "paid" : status;
  const cfg = STATUS_CONFIGS[key] || STATUS_CONFIGS.default;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${cfg.cls}`}>
      <Icon size={13} />
      <span>{cfg.label}</span>
    </span>
  );
});
StatusBadge.displayName = "StatusBadge";

const TYPE_TABS = [
  { id: "all", label: "All Items", icon: Layers },
  { id: "booking", label: "PG Bookings", icon: Building2 },
  { id: "visit", label: "PG Visits", icon: CalendarDays },
  { id: "short_stay", label: "Short Stays", icon: CalendarRange },
];

const FILTER_TABS = [
  { id: "all", label: "All Status" },
  { id: "confirmed", label: "Confirmed / Paid" },
  { id: "pending", label: "Pending" },
  { id: "cancelled", label: "Cancelled" },
];

const OwnerBookedPGs = () => {
  const { user } = useContext(AuthContext);

  const [bookings, setBookings] = useState([]);
  const [visits, setVisits] = useState([]);
  const [shortStays, setShortStays] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTypeTab, setActiveTypeTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [cancellingId, setCancellingId] = useState(null);
  const [payingId, setPayingId] = useState(null);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [bookingsRes, visitsRes, shortStaysRes] = await Promise.allSettled([
        api.get("/bookings/my-bookings"),
        api.get("/visits/my"),
        api.get("/short-stays/my"),
      ]);

      // 1. Process Bookings
      if (bookingsRes.status === "fulfilled") {
        const raw = bookingsRes.value?.data?.bookings || bookingsRes.value?.data || [];
        const data = Array.isArray(raw) ? raw : [];
        const uniqueMap = new Map();
        data.forEach((b) => {
          const key = b.pg_id || b.id;
          const prev = uniqueMap.get(key);
          if (!prev || (b.status === "approved" && prev.status !== "approved")) {
            uniqueMap.set(key, { ...b, item_type: "booking" });
          }
        });
        setBookings(Array.from(uniqueMap.values()));
      } else {
        setBookings([]);
      }

      // 2. Process Visits
      if (visitsRes.status === "fulfilled") {
        const raw = visitsRes.value?.data?.visits || visitsRes.value?.data?.data || visitsRes.value?.data || [];
        const data = Array.isArray(raw) ? raw : [];
        setVisits(data.map((v) => ({ ...v, item_type: "visit" })));
      } else {
        setVisits([]);
      }

      // 3. Process Short Stays
      if (shortStaysRes.status === "fulfilled") {
        const raw = shortStaysRes.value?.data?.shortStays || shortStaysRes.value?.data?.data || shortStaysRes.value?.data || [];
        const data = Array.isArray(raw) ? raw : [];
        setShortStays(data.map((s) => ({ ...s, item_type: "short_stay" })));
      } else {
        setShortStays([]);
      }
    } catch {
      setBookings([]);
      setVisits([]);
      setShortStays([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Cancel Booking
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking request?")) return;
    setCancellingId(bookingId);
    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      await fetchAllData();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to cancel booking request.");
    } finally {
      setCancellingId(null);
    }
  };

  // Cancel Visit
  const handleCancelVisit = async (visitId) => {
    if (!window.confirm("Are you sure you want to cancel this scheduled visit?")) return;
    setCancellingId(visitId);
    try {
      await api.put(`/visits/${visitId}/cancel`);
      await fetchAllData();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to cancel scheduled visit.");
    } finally {
      setCancellingId(null);
    }
  };

  // Cancel Short Stay
  const handleCancelShortStay = async (stayId) => {
    if (!window.confirm("Are you sure you want to cancel this short stay request?")) return;
    setCancellingId(stayId);
    try {
      await api.put(`/short-stays/${stayId}/cancel`);
      await fetchAllData();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to cancel short stay request.");
    } finally {
      setCancellingId(null);
    }
  };

  // Pay Now for booking
  const handlePayNow = async (booking) => {
    const amount = Number(booking.booked_price || booking.price || 0);
    if (!amount) return alert("Invalid price details for this booking.");

    const loaded = await loadRazorpayScript();
    if (!loaded) return alert("Razorpay SDK failed to load. Please check your internet connection.");

    setPayingId(booking.id);
    try {
      const { data } = await api.post("/payments/create-order", {
        booking_id: Number(booking.id || booking.booking_id),
        pg_id: Number(booking.pg_id),
        owner_id: Number(booking.owner_id),
        amount_in_rupees: amount,
      });

      if (!data?.success) {
        alert("Failed to initialize payment: " + (data?.message || "Unknown error"));
        setPayingId(null);
        return;
      }

      const rzp = new window.Razorpay({
        key: data.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: "Dormn Platform",
        description: `Booking activation for ${booking.pg_name || booking.title || "Accommodation"}`,
        order_id: data.order_id,
        handler: async (resp) => {
          try {
            const verify = await api.post("/payments/verify", {
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
              booking_id: data.booking_id || booking.id,
            });
            if (verify.data?.success) await fetchAllData();
          } catch {
            alert("Payment completed, but verification failed. Please contact support.");
          } finally {
            setPayingId(null);
          }
        },
        prefill: {
          name: user?.name || user?.full_name || "Owner",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: { color: "#2563eb" },
      });
      rzp.open();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to start payment process.");
      setPayingId(null);
    }
  };

  // Combined and filtered items
  const { filteredItems, totalCount, bookingCount, visitCount, shortStayCount } = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    // Pool based on type tab
    let pool = [];
    if (activeTypeTab === "all") {
      pool = [...bookings, ...visits, ...shortStays];
    } else if (activeTypeTab === "booking") {
      pool = bookings;
    } else if (activeTypeTab === "visit") {
      pool = visits;
    } else if (activeTypeTab === "short_stay") {
      pool = shortStays;
    }

    const filtered = pool.filter((item) => {
      const title = (
        item.title ||
        item.pg_name ||
        item.pg_title ||
        item.pg_id?.title ||
        ""
      ).toLowerCase();
      const city = (item.city || item.area || item.pg_id?.city || item.pg_id?.area || "").toLowerCase();

      if (query && !title.includes(query) && !city.includes(query)) return false;

      const isPaid = item.payment_status === "paid" || item.status === "paid" || item.status === "confirmed";
      if (filterStatus === "confirmed") {
        return isPaid;
      }
      if (filterStatus === "pending") {
        return item.status === "pending" || item.status === "approved";
      }
      if (filterStatus === "cancelled") {
        return item.status === "cancelled" || item.status === "rejected";
      }
      return true;
    });

    return {
      filteredItems: filtered,
      totalCount: bookings.length + visits.length + shortStays.length,
      bookingCount: bookings.length,
      visitCount: visits.length,
      shortStayCount: shortStays.length,
    };
  }, [bookings, visits, shortStays, activeTypeTab, searchTerm, filterStatus]);

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#111] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <ShieldCheck size={11} />
                <span>Resident & Stay Hub</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              My Booked PGs, Visits & Stays
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
              All your booked PG accommodations, scheduled physical visits, and short stay reservations in one convenient dashboard.
            </p>
          </div>

          <Link
            to="/pgs"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition shadow-xs cursor-pointer shrink-0"
          >
            <Sparkles size={15} />
            <span>Explore PGs</span>
          </Link>
        </div>

        {/* Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-5 border-t border-gray-100 dark:border-white/5">
          <div className="bg-gray-50/80 dark:bg-white/[0.03] rounded-xl p-3">
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Stays & Visits</p>
            <p className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mt-0.5">{totalCount}</p>
          </div>
          <div className="bg-gray-50/80 dark:bg-white/[0.03] rounded-xl p-3">
            <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">PG Bookings</p>
            <p className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mt-0.5">{bookingCount}</p>
          </div>
          <div className="bg-gray-50/80 dark:bg-white/[0.03] rounded-xl p-3">
            <p className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 tracking-wider">Scheduled Visits</p>
            <p className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mt-0.5">{visitCount}</p>
          </div>
          <div className="bg-gray-50/80 dark:bg-white/[0.03] rounded-xl p-3">
            <p className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider">Short Stays</p>
            <p className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mt-0.5">{shortStayCount}</p>
          </div>
        </div>
      </div>

      {/* Responsive Main Tabs (All / Bookings / Visits / Short Stays) */}
      <FilterTabs
        tabs={TYPE_TABS.map(t => ({ id: t.id, label: t.label, icon: t.icon }))}
        activeTab={activeTypeTab}
        onChange={setActiveTypeTab}
      />

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#111] rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by property name, area or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-white/[0.04] text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none transition focus:bg-gray-100 dark:focus:bg-white/[0.07]"
          />
        </div>

        {/* Status Filter Tabs (Dropdown on mobile, Segmented on desktop) */}
        <FilterTabs
          tabs={FILTER_TABS.map(t => ({ id: t.id, label: t.label }))}
          activeTab={filterStatus}
          onChange={setFilterStatus}
          desktopBreakpoint="md"
        />
      </div>

      {/* Content Rendering */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white dark:bg-[#111] rounded-2xl sm:rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-[#111] rounded-2xl sm:rounded-3xl p-10 text-center shadow-xs">
          <div className="h-16 w-16 mx-auto rounded-3xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
            <Building2 size={32} />
          </div>
          <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
            No Bookings, Visits or Stays Found
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
            {searchTerm || filterStatus !== "all" || activeTypeTab !== "all"
              ? "No items match your active filters. Try searching with different terms or selecting another category."
              : "You haven't booked any PG accommodations, visits, or short stays yet."}
          </p>
          <div className="mt-5">
            <Link
              to="/pgs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition shadow-xs cursor-pointer"
            >
              <Sparkles size={15} />
              <span>Browse & Book a PG</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const isBooking = item.item_type === "booking";
            const isVisit = item.item_type === "visit";
            const isShortStay = item.item_type === "short_stay";

            // Normalise image
            const pgObj = item.pg_id && typeof item.pg_id === "object" ? item.pg_id : null;
            const rawImages = parseImages(item.images || pgObj?.images);
            const rawImage = item.profile_image || pgObj?.profile_image || rawImages[0] || null;
            const imageUrl = rawImage
              ? rawImage.startsWith("http") || rawImage.startsWith("data:")
                ? rawImage
                : `${IMAGE_BASE_URL}/uploads/${rawImage}`
              : "";

            const title = item.title || item.pg_name || item.pg_title || pgObj?.title || "PG Accommodation";
            const targetPgId = item.pg_id?.id || item.pg_id?._id || item.pg_id || item.id;
            const area = item.area || pgObj?.area || "";
            const city = item.city || pgObj?.city || "";
            const locationStr = [area, city].filter(Boolean).join(", ") || "Location details";

            return (
              <div
                key={`${item.item_type}-${item.id || item._id || item.booking_id}`}
                className="bg-white dark:bg-[#111] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden bg-gray-100 dark:bg-white/5 shrink-0">
                    {imageUrl ? (
                      <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-400">
                        {isVisit ? <CalendarDays size={28} /> : isShortStay ? <CalendarRange size={28} /> : <Building2 size={28} />}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {/* Item Type Pill */}
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isVisit
                          ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                          : isShortStay
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                      }`}>
                        {isVisit ? "PG Visit" : isShortStay ? "Short Stay" : "PG Booking"}
                      </span>

                      <StatusBadge status={item.status} paymentStatus={item.payment_status} />

                      {item.room_type && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300">
                          <Bed size={11} />
                          <span>{item.room_type}</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white truncate">
                      {title}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                      <MapPin size={13} className="shrink-0 text-gray-400" />
                      <span className="truncate">{locationStr}</span>
                    </div>

                    {/* Metadata details based on type */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-600 dark:text-gray-300 flex-wrap">
                      {isVisit && (
                        <>
                          <div className="flex items-center gap-1">
                            <Calendar size={13} className="text-gray-400" />
                            <span>Visit Date: <strong className="text-gray-900 dark:text-white">{item.visit_date ? new Date(item.visit_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Scheduled"}</strong></span>
                          </div>
                          {item.visit_time_slot && (
                            <div className="flex items-center gap-1">
                              <Clock size={13} className="text-gray-400" />
                              <span>Slot: <strong className="text-gray-900 dark:text-white">{item.visit_time_slot}</strong></span>
                            </div>
                          )}
                        </>
                      )}

                      {isShortStay && (
                        <>
                          <div className="flex items-center gap-1">
                            <Calendar size={13} className="text-gray-400" />
                            <span>Check-in: <strong className="text-gray-900 dark:text-white">{item.check_in_date ? new Date(item.check_in_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "TBD"}</strong></span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar size={13} className="text-gray-400" />
                            <span>Check-out: <strong className="text-gray-900 dark:text-white">{item.check_out_date ? new Date(item.check_out_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "TBD"}</strong></span>
                          </div>
                          {item.sharing_type && (
                            <div className="flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-300">
                              <Bed size={12} className="text-gray-400" />
                              <span>{item.sharing_type}</span>
                            </div>
                          )}
                        </>
                      )}

                      {isBooking && (
                        <>
                          <div className="flex items-center gap-1">
                            <Calendar size={13} className="text-gray-400" />
                            <span>Move-in: <strong className="text-gray-900 dark:text-white">{item.check_in_date || item.move_in_date || "Flexible"}</strong></span>
                          </div>
                          <div className="flex items-center gap-1 font-bold text-gray-900 dark:text-white">
                            <IndianRupee size={13} className="text-gray-500" />
                            <span>{Number(item.booked_price || item.price || item.monthly_rent || 0).toLocaleString()}/mo</span>
                          </div>
                        </>
                      )}

                      {item.owner_phone && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <Phone size={12} />
                          <span>{item.owner_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100 dark:border-white/5">
                  {/* Booking actions */}
                  {isBooking && item.status === "approved" && item.payment_status !== "paid" && (
                    <button
                      onClick={() => handlePayNow(item)}
                      disabled={payingId === (item.id || item.booking_id)}
                      className="px-4 py-2 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <CreditCard size={14} />
                      <span>{payingId === (item.id || item.booking_id) ? "Processing..." : "Pay Rent / Deposit"}</span>
                    </button>
                  )}

                  {isBooking && item.status === "pending" && (
                    <button
                      onClick={() => handleCancelBooking(item.id || item.booking_id)}
                      disabled={cancellingId === (item.id || item.booking_id)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition cursor-pointer disabled:opacity-50"
                    >
                      {cancellingId === (item.id || item.booking_id) ? "Cancelling..." : "Cancel Request"}
                    </button>
                  )}

                  {/* Visit actions */}
                  {isVisit && (item.status === "pending" || item.status === "confirmed") && (
                    <button
                      onClick={() => handleCancelVisit(item.id || item._id)}
                      disabled={cancellingId === (item.id || item._id)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition cursor-pointer disabled:opacity-50"
                    >
                      {cancellingId === (item.id || item._id) ? "Cancelling..." : "Cancel Visit"}
                    </button>
                  )}

                  {/* Short stay actions */}
                  {isShortStay && item.status === "pending" && (
                    <button
                      onClick={() => handleCancelShortStay(item.id || item._id)}
                      disabled={cancellingId === (item.id || item._id)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition cursor-pointer disabled:opacity-50"
                    >
                      {cancellingId === (item.id || item._id) ? "Cancelling..." : "Cancel Short Stay"}
                    </button>
                  )}

                  {targetPgId && (
                    <Link
                      to={`/pg/${targetPgId}`}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/[0.04] hover:bg-gray-100 dark:hover:bg-white/[0.08] transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>View Property</span>
                      <ExternalLink size={13} />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OwnerBookedPGs;
