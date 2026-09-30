import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  Search,
  Building2,
  Phone,
  Mail,
  Eye,
  BookOpenCheck,
  Clock,
  AlertCircle,
  Calendar,
  CalendarClock
} from "lucide-react";
import api from "../../services/api";
import { formatVisitDate } from "../../utils/visitDate";

const formatDateTime = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const StatusBadge = ({ status, paymentStatus, cancelledAt }) => {
  const isPaid = paymentStatus === "paid";
  const isApproved = status === "approved";
  const isCancelled = status === "cancelled";

  const cfg = isApproved
    ? isPaid
      ? { label: "PAID & CONFIRMED", icon: CheckCircle2, cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" }
      : { label: "APPROVED (AWAITING PAYMENT)", icon: Clock, cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30" }
    : isCancelled
      ? { label: "CANCELLED", icon: AlertCircle, cls: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30" }
      : { label: "DECLINED", icon: XCircle, cls: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30" };

  const Icon = cfg.icon;

  return (
    <div className="flex flex-col items-start gap-0.5">
      <span className={`inline-flex items-center justify-center gap-1 rounded-lg px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border ${cfg.cls}`}>
        <Icon size={12} className="shrink-0" />
        <span>{cfg.label}</span>
      </span>
      {(isCancelled || status === "rejected") && cancelledAt && (
        <span className="text-[10px] font-medium text-gray-400 pl-0.5">
          on {formatDateTime(cancelledAt)}
        </span>
      )}
    </div>
  );
};

const Bookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/bookings/owner-bookings");
      setBookings(data.bookings || []);
    } catch (error) {
      console.error("Bookings Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleStatusChange = useCallback(async (bookingId, newStatus) => {
    try {
      await api.put(`/bookings/${bookingId}/status`, { status: newStatus });
      try {
        const notifs = JSON.parse(localStorage.getItem("dormn_resident_notifications") || "[]");
        notifs.unshift({
          id: `notif-${Date.now()}`,
          type: "booking_update",
          category: "Booking",
          title: newStatus === "approved" ? "Booking Application Approved!" : `Booking Status: ${newStatus}`,
          message: newStatus === "approved"
            ? "Your PG booking request has been approved by the PG owner. Proceed to pay rent & unlock portal."
            : `Your booking application status was updated to ${newStatus}.`,
          status: newStatus,
          created_at: new Date().toISOString(),
          read: false
        });
        localStorage.setItem("dormn_resident_notifications", JSON.stringify(notifs));
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new CustomEvent("dormn_request_updated"));
      } catch {}
      fetchBookings();
    } catch (error) {
      console.error("Update Error:", error);
      alert("Failed to update status in database");
    }
  }, [fetchBookings]);

  // Deduplicate and precompute counts in a single pass
  const { visibleBookings, counts } = useMemo(() => {
    const grouped = {};
    for (const b of bookings) {
      if (b.status === "paused") continue;
      const sKey = (b.student_email || b.email || b.student_name || String(b.student_id || "")).toLowerCase().trim();
      const pKey = (b.title || b.pg_title || b.pg_name || String(b.pg_id || "")).toLowerCase().trim();
      const key = `${sKey}_${pKey}`;
      const bTime = new Date(b.booking_date || b.created_at || 0).getTime() || Number(b.id) || 0;
      const gTime = grouped[key] ? (new Date(grouped[key].booking_date || grouped[key].created_at || 0).getTime() || Number(grouped[key].id) || 0) : -1;
      if (!grouped[key] || bTime > gTime) grouped[key] = b;
    }
    const list = Object.values(grouped);
    let pending = 0, approved = 0, cancelled = 0;
    for (const b of list) {
      const s = b.status?.toLowerCase();
      if (s === "pending") pending++;
      else if (s === "approved") approved++;
      else if (s === "cancelled" || s === "rejected") cancelled++;
    }
    return { visibleBookings: list, counts: { all: list.length, pending, approved, cancelled } };
  }, [bookings]);

  // Fast search & tab filter
  const filteredBookings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return visibleBookings.filter((b) => {
      const s = b.status?.toLowerCase();
      if (selectedStatus === "cancelled" && s !== "cancelled" && s !== "rejected") return false;
      if (selectedStatus !== "all" && selectedStatus !== "cancelled" && s !== selectedStatus) return false;
      if (!term) return true;
      return (
        (b.student_name && b.student_name.toLowerCase().includes(term)) ||
        (b.title && b.title.toLowerCase().includes(term)) ||
        (b.pg_title && b.pg_title.toLowerCase().includes(term)) ||
        (b.student_email && b.student_email.toLowerCase().includes(term))
      );
    });
  }, [visibleBookings, searchTerm, selectedStatus]);

  const tabs = [
    { id: "all", label: "All Applications", count: counts.all },
    { id: "pending", label: "Needs Decision", count: counts.pending },
    { id: "approved", label: "Approved Tenants", count: counts.approved },
    { id: "cancelled", label: "Cancelled", count: counts.cancelled },
  ];

  return (
    <div className="space-y-3 sm:space-y-4 max-w-[1600px] mx-auto animate-fadeIn">
      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-2xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0c1220] p-2 sm:p-2.5 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedStatus(t.id)}
              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedStatus === t.id
                  ? "bg-blue-600 text-white shadow-2xs shadow-blue-500/25"
                  : "bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10"
              }`}
            >
              <span>{t.label}</span>
              <span className={`rounded-lg px-1.5 py-0.5 text-[10px] sm:text-[11px] font-bold ${
                selectedStatus === t.id ? "bg-white/20 text-white" : "bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-gray-200"
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64 md:w-72 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            type="text"
            placeholder="Search student or PG..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-white/5 py-1.5 sm:py-2 pl-9 pr-3 text-xs font-semibold text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-[#141b2d]"
          />
        </div>
      </div>

      {/* Decision Cards: 2 IN A ROW */}
      {loading ? (
        <div className="rounded-2xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0c1220] p-6 sm:p-12 text-center shadow-2xs">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-gray-200 dark:border-gray-800 border-t-blue-500 mx-auto mb-2.5" />
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Loading student applications...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0c1220] p-6 sm:p-12 text-center shadow-2xs">
          <BookOpenCheck size={30} className="text-gray-400 mx-auto mb-2" />
          <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">No booking applications found</h3>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">No applications match your current filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3.5">
          {filteredBookings.map((b) => (
            <div
              key={b.id}
              className={`flex flex-col justify-between rounded-xl sm:rounded-2xl border p-2.5 sm:p-3.5 transition-all duration-200 ${
                b.status === "pending"
                  ? "border-amber-500/40 bg-amber-500/[0.03] shadow-xs"
                  : "border-gray-200 dark:border-white/10 bg-white dark:bg-[#0c1220]"
              }`}
            >
              {/* Profile & Contact Details */}
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-teal-400 text-xs sm:text-sm font-black text-white shadow-2xs">
                  {(b.student_name || "S").charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5 mb-0.5">
                    <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate leading-tight">
                      {b.student_name || "Student Applicant"}
                    </h3>
                    <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 shrink-0">#BK-{b.id}</span>
                  </div>

                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 mb-1 truncate">
                    <Building2 size={13} className="shrink-0" />
                    <span className="truncate">{b.title || b.pg_title || "PG Property"}</span>
                  </p>

                  <div className="flex items-center gap-2.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 flex-wrap">
                    {b.student_email && (
                      <span className="flex items-center gap-1 truncate max-w-full">
                        <Mail size={11} className="text-blue-500 shrink-0" />
                        <span className="truncate">{b.student_email}</span>
                      </span>
                    )}
                    {b.student_phone && (
                      <span className="flex items-center gap-1 shrink-0">
                        <Phone size={11} className="text-emerald-500 shrink-0" />
                        <span>{b.student_phone}</span>
                      </span>
                    )}
                  </div>

                  {/* Booked & Cancelled Timestamps */}
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium flex-wrap mt-2 pt-2 border-t border-gray-100 dark:border-white/5">
                    {b.booking_date && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10">
                        <Calendar size={11} className="text-blue-500 shrink-0" />
                        <span>Booked: <strong className="font-bold text-gray-900 dark:text-white ml-0.5">{formatDateTime(b.booking_date)}</strong></span>
                      </span>
                    )}

                    {b.visit_date && b.visit_time && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#93B733]/15 text-[#4E700F] dark:text-[#93B733] border border-[#93B733]/30">
                        <CalendarClock size={11} className="text-[#93B733] shrink-0" />
                        <span>Visit: <strong className="font-bold ml-0.5">{formatVisitDate(b.visit_date)} at {b.visit_time}</strong></span>
                      </span>
                    )}

                    {(b.status === "cancelled" || b.status === "rejected") && (b.cancelled_at || b.cancellation_requested_at) && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        <Clock size={11} className="text-rose-500 shrink-0" />
                        <span>Cancelled: <strong className="font-bold ml-0.5">{formatDateTime(b.cancelled_at || b.cancellation_requested_at)}</strong></span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between gap-2 border-t border-gray-100 dark:border-white/10 pt-2.5 mt-2.5">
                {b.status === "pending" ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleStatusChange(b.id, "approved")}
                      className="flex items-center justify-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1.5 text-xs font-bold text-white transition shadow-2xs cursor-pointer"
                    >
                      <CheckCircle2 size={13} />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleStatusChange(b.id, "rejected")}
                      className="flex items-center justify-center gap-1 rounded-xl bg-rose-600 hover:bg-rose-500 px-2 py-1.5 text-xs font-bold text-white transition shadow-2xs cursor-pointer"
                    >
                      <XCircle size={13} />
                      <span>Decline</span>
                    </button>
                  </div>
                ) : (
                  <StatusBadge
                    status={b.status}
                    paymentStatus={b.payment_status}
                    cancelledAt={b.cancelled_at || b.cancellation_requested_at}
                  />
                )}

                <button
                  onClick={() => navigate(`/pg/${b.pg_id}`)}
                  className="flex items-center justify-center gap-1 rounded-xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ml-auto shrink-0"
                >
                  <Eye size={13} />
                  <span>View PG</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bookings;