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
  Calendar
} from "lucide-react";
import api from "../../services/api";

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
      ? { label: "PAID & CONFIRMED", icon: CheckCircle2, cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" }
      : { label: "APPROVED (AWAITING PAYMENT)", icon: Clock, cls: "bg-amber-500/20 text-amber-400 border-amber-500/40" }
    : isCancelled
      ? { label: "CANCELLED", icon: AlertCircle, cls: "bg-zinc-500/20 text-zinc-400 border-zinc-500/40" }
      : { label: "DECLINED", icon: XCircle, cls: "bg-rose-500/20 text-rose-400 border-rose-500/40" };

  const Icon = cfg.icon;

  return (
    <div className="flex flex-col items-stretch sm:items-end gap-1">
      <span className={`inline-flex items-center justify-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs font-black uppercase tracking-wider border ${cfg.cls}`}>
        <Icon size={15} />
        <span>{cfg.label}</span>
      </span>
      {(isCancelled || status === "rejected") && cancelledAt && (
        <span className="text-[10px] font-bold text-gray-400 text-center sm:text-right">
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
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-3xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0c1220] p-3 sm:p-5 shadow-sm">
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedStatus(t.id)}
              className={`flex items-center gap-2.5 rounded-2xl px-3 py-2 sm:px-5 sm:py-3.5 text-xs sm:text-sm font-black transition-all shrink-0 cursor-pointer ${
                selectedStatus === t.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                  : "bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10"
              }`}
            >
              <span>{t.label}</span>
              <span className={`rounded-xl px-2 sm:px-2.5 py-0.5 text-xs font-black ${
                selectedStatus === t.id ? "bg-white/20 text-white" : "bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-gray-200"
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by student or property..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-white/5 py-2.5 sm:py-3.5 pl-10 sm:pl-12 pr-4 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-[#141b2d]"
          />
        </div>
      </div>

      {/* Decision Cards */}
      {loading ? (
        <div className="rounded-3xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0c1220] p-8 sm:p-16 text-center shadow-sm">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 dark:border-gray-800 border-t-blue-500 mx-auto mb-4" />
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Loading student applications...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="rounded-3xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0c1220] p-8 sm:p-16 text-center shadow-sm">
          <BookOpenCheck size={36} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-base sm:text-xl font-black text-gray-900 dark:text-white">No booking applications found</h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">No applications match your current filters.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredBookings.map((b) => (
            <div
              key={b.id}
              className={`flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-6 rounded-2xl sm:rounded-3xl border p-3 sm:p-6 transition-all duration-200 ${
                b.status === "pending"
                  ? "border-amber-500/40 bg-amber-500/[0.03] shadow-md"
                  : "border-gray-200 dark:border-white/15 bg-white dark:bg-[#0c1220]"
              }`}
            >
              {/* Profile & Contact Details */}
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="flex h-10 w-10 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-teal-400 text-sm sm:text-xl font-black text-white shadow-md">
                  {(b.student_name || "S").charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <h3 className="text-sm sm:text-xl font-black text-gray-900 dark:text-white truncate leading-none">
                      {b.student_name || "Student Applicant"}
                    </h3>
                    <span className="text-xs font-bold text-gray-400">#BK-{b.id}</span>
                  </div>

                  <p className="text-sm font-black text-blue-600 dark:text-blue-400 flex items-center gap-1.5 mb-2 mt-1">
                    <Building2 size={16} />
                    <span>{b.title || b.pg_title || "PG Property"}</span>
                  </p>

                  <div className="flex items-center gap-4 text-xs font-bold text-gray-500 dark:text-gray-400 flex-wrap">
                    {b.student_email && (
                      <span className="flex items-center gap-1.5">
                        <Mail size={14} className="text-blue-500" />
                        {b.student_email}
                      </span>
                    )}
                    {b.student_phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone size={14} className="text-emerald-500" />
                        {b.student_phone}
                      </span>
                    )}
                  </div>

                  {/* Booked & Cancelled Timestamps */}
                  <div className="flex items-center gap-2.5 text-xs font-bold flex-wrap mt-2.5 pt-2.5 border-t border-gray-100 dark:border-white/5">
                    {b.booking_date && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10">
                        <Calendar size={13} className="text-blue-500" />
                        <span>Booked: <strong className="font-black text-gray-900 dark:text-white ml-0.5">{formatDateTime(b.booking_date)}</strong></span>
                      </span>
                    )}

                    {(b.status === "cancelled" || b.status === "rejected") && (b.cancelled_at || b.cancellation_requested_at) && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                        <Clock size={13} className="text-rose-500" />
                        <span>Cancelled: <strong className="font-black ml-0.5">{formatDateTime(b.cancelled_at || b.cancellation_requested_at)}</strong></span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0 border-t lg:border-t-0 border-gray-100 dark:border-white/10 pt-4 lg:pt-0">
                {b.status === "pending" ? (
                  <>
                    <button
                      onClick={() => handleStatusChange(b.id, "approved")}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 sm:px-6 sm:py-3.5 text-xs sm:text-sm font-black text-white transition shadow-lg shadow-emerald-600/25 cursor-pointer"
                    >
                      <CheckCircle2 size={18} />
                      <span>Approve Booking</span>
                    </button>
                    <button
                      onClick={() => handleStatusChange(b.id, "rejected")}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-rose-600 hover:bg-rose-500 px-3.5 py-2.5 sm:px-5 sm:py-3.5 text-xs sm:text-sm font-black text-white transition shadow-lg shadow-rose-600/25 cursor-pointer"
                    >
                      <XCircle size={18} />
                      <span>Decline</span>
                    </button>
                  </>
                ) : (
                  <StatusBadge
                    status={b.status}
                    paymentStatus={b.payment_status}
                    cancelledAt={b.cancelled_at || b.cancellation_requested_at}
                  />
                )}

                <button
                  onClick={() => navigate(`/pg/${b.pg_id}`)}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-white/5 px-3.5 py-2.5 sm:px-5 sm:py-3.5 text-xs sm:text-sm font-black text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition cursor-pointer"
                >
                  <Eye size={16} />
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