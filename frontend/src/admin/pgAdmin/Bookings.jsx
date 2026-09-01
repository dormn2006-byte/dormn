import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  Search,
  Building2,
  Phone,
  Mail,
  UserCheck,
  Eye,
  BookOpenCheck,
  Clock,
  CreditCard,
  AlertCircle
} from "lucide-react";
import api from "../../services/api";

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
        const notifs = JSON.parse(localStorage.getItem('dormn_resident_notifications') || '[]');
        notifs.unshift({
          id: `notif-${Date.now()}`,
          type: 'booking_update',
          category: 'Booking',
          title: newStatus === 'approved' ? 'Booking Application Approved!' : `Booking Status: ${newStatus}`,
          message: newStatus === 'approved' 
            ? 'Your PG booking request has been approved by the PG owner. Proceed to pay rent & unlock portal.'
            : `Your booking application status was updated to ${newStatus}.`,
          status: newStatus,
          created_at: new Date().toISOString(),
          read: false
        });
        localStorage.setItem('dormn_resident_notifications', JSON.stringify(notifs));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('dormn_request_updated'));
      } catch {}
      fetchBookings();
    } catch (error) {
      console.error("Update Error:", error);
      alert("Failed to update status in database");
    }
  }, [fetchBookings]);

  // Filter out paused bookings and deduplicate (same student + same PG → keep latest only)
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

  // Counts for decision tabs
  const pendingCount = useMemo(() => visibleBookings.filter((b) => b.status === "pending").length, [visibleBookings]);
  const approvedCount = useMemo(() => visibleBookings.filter((b) => b.status === "approved").length, [visibleBookings]);

  // Filtered List
  const filteredBookings = useMemo(() => {
    return visibleBookings.filter((b) => {
      const studentName = b.student_name || "";
      const pgTitle = b.title || b.pg_title || "";
      const matchesSearch =
        studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pgTitle.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        selectedStatus === "all" ? true : b.status?.toLowerCase() === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [visibleBookings, searchTerm, selectedStatus]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      
      {/* Big Bold Filter Tabs & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-3xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0c1220] p-5 shadow-sm">
        
        {/* Large Prominent Filter Tabs */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
          {[
            { id: "all", label: "All Applications", count: bookings.length },
            { id: "pending", label: "Needs Decision", count: pendingCount },
            { id: "approved", label: "Approved Tenants", count: approvedCount },
            { id: "rejected", label: "Declined", count: bookings.filter((b) => b.status === "rejected").length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`flex items-center gap-2.5 rounded-2xl px-5 py-3.5 text-sm font-black transition-all shrink-0 ${
                selectedStatus === tab.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                  : "bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`rounded-xl px-2.5 py-0.5 text-xs font-black ${
                selectedStatus === tab.id ? "bg-white/20 text-white" : "bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-gray-200"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Large Search Field */}
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by student or property..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-white/5 py-3.5 pl-12 pr-4 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-[#141b2d]"
          />
        </div>
      </div>

      {/* Booking Decision Cards - Big, Bold & Highly Understandable */}
      {loading ? (
        <div className="rounded-3xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0c1220] p-16 text-center shadow-sm">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 dark:border-gray-800 border-t-blue-500 mx-auto mb-4"></div>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Loading student applications...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="rounded-3xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0c1220] p-16 text-center shadow-sm">
          <BookOpenCheck size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-black text-gray-900 dark:text-white">No booking applications found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Student booking requests will appear here once submitted.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredBookings.map((b) => (
            <div
              key={b.id}
              className={`flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 rounded-3xl border p-6 transition-all duration-200 ${
                b.status === "pending"
                  ? "border-amber-500/40 bg-amber-500/[0.03] shadow-md"
                  : "border-gray-200 dark:border-white/15 bg-white dark:bg-[#0c1220]"
              }`}
            >
              {/* Left Profile & Contact Details */}
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-teal-400 text-xl font-black text-white shadow-md">
                  {(b.student_name || "S").charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <h3 className="text-xl font-black text-gray-900 dark:text-white truncate leading-none">
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
                </div>
              </div>

              {/* Action Toolbar - Prominent Big Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0 border-t lg:border-t-0 border-gray-100 dark:border-white/10 pt-4 lg:pt-0">
                
                {b.status === "pending" ? (
                  <>
                    <button
                      onClick={() => handleStatusChange(b.id, "approved")}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3.5 text-sm font-black text-white transition shadow-lg shadow-emerald-600/25"
                    >
                      <CheckCircle2 size={18} />
                      <span>Approve Booking</span>
                    </button>

                    <button
                      onClick={() => handleStatusChange(b.id, "rejected")}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-rose-600 hover:bg-rose-500 px-5 py-3.5 text-sm font-black text-white transition shadow-lg shadow-rose-600/25"
                    >
                      <XCircle size={18} />
                      <span>Decline</span>
                    </button>
                  </>
                ) : (
                  <span className={`inline-flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs font-black uppercase tracking-wider border ${
                    b.status === "approved"
                      ? b.payment_status === "paid"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                        : "bg-amber-500/20 text-amber-400 border-amber-500/40"
                      : "bg-rose-500/20 text-rose-400 border-rose-500/40"
                  }`}>
                    {b.status === "approved" ? (
                      b.payment_status === "paid" ? (
                        <>
                          <CheckCircle2 size={15} />
                          <span>PAID & CONFIRMED</span>
                        </>
                      ) : (
                        <>
                          <Clock size={15} />
                          <span>APPROVED (AWAITING PAYMENT)</span>
                        </>
                      )
                    ) : (
                      <>
                        <XCircle size={15} />
                        <span>DECLINED</span>
                      </>
                    )}
                  </span>
                )}

                <button
                  onClick={() => navigate(`/pg/${b.pg_id}`)}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-white/5 px-5 py-3.5 text-sm font-black text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition"
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