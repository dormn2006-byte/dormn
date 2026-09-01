import { useEffect, useState, useCallback } from "react";
import {
  Bell,
  Building2,
  Phone,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  X,
  MessageSquare,
  RefreshCw,
  Wrench,
  AlertTriangle,
  Send
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [resolutionNote, setResolutionNote] = useState("");

  const fetchLiveNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const [bookingsRes, requestsRes] = await Promise.allSettled([
        api.get("/bookings/owner-bookings"),
        api.get("/student-portal/owner-requests")
      ]);

      const dbBookings = bookingsRes.status === "fulfilled" ? bookingsRes.value.data?.bookings || [] : [];
      let dbRequests = requestsRes.status === "fulfilled" ? requestsRes.value.data?.requests || [] : [];

      // Also merge any local resident maintenance requests
      try {
        const localReqs = JSON.parse(localStorage.getItem('dormn_resident_requests') || '[]');
        if (Array.isArray(localReqs) && localReqs.length > 0) {
          const ids = new Set(dbRequests.map(r => String(r.id || r.rawId)));
          localReqs.forEach(lr => {
            if (!ids.has(String(lr.id))) {
              dbRequests.push(lr);
            }
          });
        }
      } catch (e) {
        console.error('Error merging local requests in owner notifications:', e);
      }

      // Transform real MySQL database bookings into notifications
      const mappedBookings = dbBookings.map((b) => ({
        id: `booking-${b.id}`,
        rawId: b.id,
        type: "booking",
        title: `Booking Request #${b.id}`,
        category: "Bookings",
        senderName: b.student_name || b.student_email?.split("@")[0] || "Student Applicant",
        senderEmail: b.student_email || "N/A",
        senderPhone: b.student_phone || "+91 98765 43210",
        senderRole: "Student Applicant",
        avatarColor: b.status === "approved" ? "from-emerald-500 to-teal-500" : b.status === "rejected" ? "from-rose-500 to-pink-500" : "from-blue-500 to-cyan-500",
        pgName: b.pg_title || "Your PG Listing",
        location: b.city || "Noida",
        time: b.created_at ? new Date(b.created_at).toLocaleDateString('en-IN') : "Real-time DB",
        status: b.status || "pending",
        unread: b.status === "pending",
        message: `Hello Owner, I have submitted a booking request for your property '${b.pg_title || "PG Listing"}'. Current database status is: ${b.status?.toUpperCase() || "PENDING"}.`,
      }));

      // Transform maintenance requests into notifications
      const mappedRequests = dbRequests.map((r) => ({
        id: `req-${r.id}`,
        rawId: r.id,
        type: "maintenance",
        title: `[${r.category || 'Maintenance'}] ${r.title}`,
        category: "Maintenance",
        priority: r.priority || "Medium",
        studentId: r.student_id,
        pgId: r.pg_id,
        senderName: r.student_name || "Resident Student",
        senderEmail: r.student_email || "N/A",
        senderPhone: r.student_phone || "+91 98765 43210",
        senderRole: "PG Resident",
        avatarColor: r.status === "resolved" ? "from-emerald-500 to-teal-500" : "from-amber-500 to-orange-500",
        pgName: r.pg_title || "Your PG Listing",
        location: "Current Resident",
        time: r.filed_at ? new Date(r.filed_at).toLocaleDateString('en-IN') : "Real-time DB",
        status: r.status || "open",
        unread: r.status === "open",
        message: r.description || "Student requested maintenance assistance.",
        resolutionNote: r.resolution_note || ""
      }));

      const all = [...mappedRequests, ...mappedBookings];
      setNotifications(all);
    } catch (error) {
      console.error("Notifications Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveNotifications();
    const sync = () => fetchLiveNotifications();
    window.addEventListener('storage', sync);
    window.addEventListener('dormn_request_updated', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('dormn_request_updated', sync);
    };
  }, [fetchLiveNotifications]);

  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      setProcessingId(bookingId);
      await api.put(`/bookings/${bookingId}/status`, { status: newStatus });
      alert(`Booking #${bookingId} status updated to ${newStatus.toUpperCase()}!`);
      setSelectedNotif(null);
      fetchLiveNotifications();
    } catch (error) {
      console.error("Status Update Error:", error);
      alert("Failed to update status in database.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateMaintenanceStatus = async (reqId, newStatus) => {
    try {
      setProcessingId(reqId);
      const note = resolutionNote || (newStatus === 'resolved' ? 'Issue verified and resolved by PG Owner.' : 'Maintenance in progress.');
      
      // Update local storage for real-time resident portal reflection
      try {
        const localReqs = JSON.parse(localStorage.getItem('dormn_resident_requests') || '[]');
        const cleanId = String(reqId).replace('req-', '');
        let matchedReq = null;
        const updated = localReqs.map(r => {
          if (String(r.id) === String(reqId) || String(r.id).replace('req-', '') === cleanId) {
            matchedReq = r;
            return {
              ...r,
              status: newStatus,
              resolution_note: note,
              history: [
                ...(r.history || []),
                {
                  status: newStatus,
                  label: newStatus === 'resolved' ? 'Resolved by Owner' : 'In Progress',
                  time: new Date().toISOString(),
                  note
                }
              ]
            };
          }
          return r;
        });
        localStorage.setItem('dormn_resident_requests', JSON.stringify(updated));

        // Push notice to resident's View Notices
        const statusLabel = newStatus === 'resolved' ? 'Issue Resolved' : newStatus === 'in_progress' ? 'Work In Progress' : 'Status Updated';
        const notices = JSON.parse(localStorage.getItem('dormn_resident_notices') || '[]');
        notices.unshift({
          id: `notice-${Date.now()}`,
          type: 'request_update',
          request_id: reqId,
          category: matchedReq?.category || selectedNotif?.title?.split(']')[0]?.replace('[', '') || 'Maintenance',
          title: `${statusLabel}: ${matchedReq?.title || selectedNotif?.title || 'Maintenance Request'}`,
          message: note,
          status: newStatus,
          created_at: new Date().toISOString(),
          read: false
        });
        localStorage.setItem('dormn_resident_notices', JSON.stringify(notices));
      } catch (e) {
        console.error('Error updating local requests:', e);
      }

      await api.put(`/student-portal/requests/${reqId}/status`, {
        status: newStatus,
        resolution_note: note,
        student_id: selectedNotif?.studentId,
        pg_id: selectedNotif?.pgId
      }).catch(() => null);

      alert(`Maintenance ticket marked as ${newStatus.toUpperCase()}! Student has been notified.`);
      setSelectedNotif(null);
      setResolutionNote("");
      fetchLiveNotifications();
    } catch (error) {
      console.error("Maintenance Update Error:", error);
      alert("Failed to update maintenance ticket status.");
    } finally {
      setProcessingId(null);
    }
  };

  const unreadCount = notifications.filter((n) => n.unread).length;
  const maintenanceCount = notifications.filter((n) => n.type === "maintenance" && n.status === "open").length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === "Unread") return n.unread;
    if (activeFilter === "Maintenance") return n.type === "maintenance";
    if (activeFilter === "Bookings") return n.type === "booking";
    if (activeFilter === "Pending") return n.status === "pending" || n.status === "open";
    if (activeFilter === "Approved") return n.status === "approved" || n.status === "resolved";
    return true;
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      
      {/* Action Bar & Category Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] p-5 shadow-sm">
        
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {["All", "Maintenance", "Bookings", "Unread", "Pending", "Approved"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`rounded-xl px-4 py-2.5 text-xs font-black transition-all shrink-0 flex items-center gap-1.5 ${
                activeFilter === tab
                  ? "bg-[#0D3A1D] text-white dark:bg-[#0D3A1D] dark:text-white dark:border dark:border-[#93B733]/50 shadow-md"
                  : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
              }`}
            >
              {tab === "Maintenance" && <Wrench size={13} className="text-[#93B733]" />}
              <span>{tab}</span>
              {tab === "Maintenance" && maintenanceCount > 0 && (
                <span className="rounded-full bg-amber-500 px-1.5 py-0.2 text-[9px] font-black text-white">
                  {maintenanceCount}
                </span>
              )}
              {tab === "Unread" && unreadCount > 0 && (
                <span className="rounded-full bg-rose-500 px-1.5 py-0.2 text-[9px] font-black text-white">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Refresh Sync Button */}
        <button
          onClick={fetchLiveNotifications}
          className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition shrink-0"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-[#93B733]" : "text-[#93B733]"} />
          <span>Sync Database</span>
        </button>

      </div>

      {/* Notifications List Grid */}
      <div className="grid grid-cols-1 gap-3.5">
        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] p-12 text-center shadow-sm">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 dark:border-gray-800 border-t-[#93B733] mb-3"></div>
            <p className="text-xs font-bold text-gray-500">Fetching live notifications and requests...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] p-12 text-center shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#93B733]/15 text-[#93B733] mb-3">
              <Bell size={24} />
            </div>
            <h3 className="text-base font-black text-gray-900 dark:text-white">No notifications found</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">You're all caught up with your bookings and maintenance requests.</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                setSelectedNotif(notif);
                setResolutionNote(notif.resolutionNote || "");
              }}
              className={`group relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-3xl border p-5 cursor-pointer transition-all duration-200 ${
                notif.unread
                  ? "border-[#93B733]/40 bg-emerald-50/20 dark:bg-[#93B733]/5 shadow-sm"
                  : "border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] hover:border-gray-300 dark:hover:border-white/20"
              }`}
            >
              {/* Left Side: Avatar & Details */}
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr ${notif.avatarColor} text-base font-black text-white shadow-md`}
                >
                  {notif.type === 'maintenance' ? <Wrench size={20} /> : notif.senderName.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-black text-gray-900 dark:text-white truncate">
                      {notif.senderName}
                    </span>
                    <span className="text-xs font-bold text-gray-400">• {notif.senderRole}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                        notif.status === "approved" || notif.status === "resolved"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : notif.status === "rejected"
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                          : notif.type === "maintenance"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                      }`}
                    >
                      {notif.status}
                    </span>
                    {notif.type === "maintenance" && notif.priority && (
                      <span className="rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                        {notif.priority} Priority
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-tight">
                    {notif.title}
                  </h4>

                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mt-1 font-medium leading-relaxed">
                    {notif.message}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] font-bold text-gray-400 mt-2">
                    <span className="flex items-center gap-1">
                      <Building2 size={13} className="text-[#93B733]" />
                      {notif.pgName} {notif.location !== 'Current Resident' ? `(${notif.location})` : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} />
                      {notif.time}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Side: Action Indicator */}
              <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                {notif.unread && (
                  <span className="h-2.5 w-2.5 rounded-full bg-[#93B733] shadow-sm animate-pulse"></span>
                )}

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 group-hover:scale-105 transition shadow-md">
                  <ArrowRight size={16} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FULL NOTIFICATION DETAIL MODAL / DRAWER */}
      {selectedNotif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl rounded-3xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0a0f1d] text-gray-900 dark:text-white shadow-2xl overflow-hidden transition-all">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 px-6 py-5 bg-gray-50/80 dark:bg-white/[0.03]">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr ${selectedNotif.avatarColor} text-base font-black text-white shadow-md`}
                >
                  {selectedNotif.type === 'maintenance' ? <Wrench size={20} /> : selectedNotif.senderName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white">
                    {selectedNotif.senderName}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400">{selectedNotif.senderRole}</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      selectedNotif.status === "approved" || selectedNotif.status === "resolved" 
                        ? "bg-emerald-500/20 text-emerald-400" 
                        : selectedNotif.status === "rejected" 
                        ? "bg-rose-500/20 text-rose-400" 
                        : "bg-blue-500/20 text-blue-400"
                    }`}>
                      Status: {selectedNotif.status}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedNotif(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 dark:border-white/15 bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              
              {/* Context Summary Cards */}
              <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#141b2d] p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-400 uppercase tracking-wider text-[10px]">Property Listing</span>
                  <span className="text-[#93B733] font-black">{selectedNotif.pgName}</span>
                </div>

                <div className="flex items-center justify-between text-xs font-bold border-t border-gray-200 dark:border-white/10 pt-2.5">
                  <span className="text-gray-400 uppercase tracking-wider text-[10px]">Sender Email</span>
                  <span className="text-gray-900 dark:text-white">{selectedNotif.senderEmail}</span>
                </div>

                <div className="flex items-center justify-between text-xs font-bold border-t border-gray-200 dark:border-white/10 pt-2.5">
                  <span className="text-gray-400 uppercase tracking-wider text-[10px]">Phone Number</span>
                  <span className="text-gray-900 dark:text-white">{selectedNotif.senderPhone}</span>
                </div>
              </div>

              {/* Message Context */}
              <div>
                <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                  <MessageSquare size={14} className="text-[#93B733]" />
                  Issue / Request Context
                </h4>
                <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 p-4 text-xs leading-relaxed text-gray-800 dark:text-gray-200 font-medium">
                  {selectedNotif.message}
                </div>
              </div>

              {/* Maintenance Resolution Note Input */}
              {selectedNotif.type === "maintenance" && selectedNotif.status !== "resolved" && (
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                    Owner Note to Student (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="E.g., Plumber has been dispatched. Expected fix by 4 PM."
                    className="w-full rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#060913] p-3 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-[#93B733] resize-none"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap gap-2.5 justify-end">
                
                {/* Booking actions */}
                {selectedNotif.type === "booking" && selectedNotif.status === "pending" && (
                  <>
                    <button
                      disabled={processingId === selectedNotif.rawId}
                      onClick={() => handleUpdateBookingStatus(selectedNotif.rawId, "approved")}
                      className="flex items-center gap-2 rounded-xl bg-[#0D3A1D] hover:bg-[#07130B] dark:bg-[#93B733] dark:hover:bg-[#82a32d] px-5 py-3 text-xs font-black text-white dark:text-gray-950 transition shadow-md disabled:opacity-50"
                    >
                      <CheckCircle2 size={16} />
                      <span>{processingId === selectedNotif.rawId ? "Updating..." : "Approve Booking"}</span>
                    </button>

                    <button
                      disabled={processingId === selectedNotif.rawId}
                      onClick={() => handleUpdateBookingStatus(selectedNotif.rawId, "rejected")}
                      className="flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-xs font-black text-white hover:bg-rose-500 transition shadow-md disabled:opacity-50"
                    >
                      <XCircle size={16} />
                      <span>{processingId === selectedNotif.rawId ? "Updating..." : "Reject"}</span>
                    </button>
                  </>
                )}

                {/* Maintenance actions */}
                {selectedNotif.type === "maintenance" && selectedNotif.status !== "resolved" && (
                  <>
                    {selectedNotif.status === "open" && (
                      <button
                        disabled={processingId === selectedNotif.rawId}
                        onClick={() => handleUpdateMaintenanceStatus(selectedNotif.rawId, "in_progress")}
                        className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-black text-white hover:bg-blue-500 transition shadow-md disabled:opacity-50"
                      >
                        <Wrench size={16} />
                        <span>{processingId === selectedNotif.rawId ? "Updating..." : "Mark In Progress"}</span>
                      </button>
                    )}

                    <button
                      disabled={processingId === selectedNotif.rawId}
                      onClick={() => handleUpdateMaintenanceStatus(selectedNotif.rawId, "resolved")}
                      className="flex items-center gap-2 rounded-xl bg-[#0D3A1D] hover:bg-[#07130B] dark:bg-[#93B733] dark:hover:bg-[#82a32d] px-5 py-3 text-xs font-black text-white dark:text-gray-950 transition shadow-md disabled:opacity-50"
                    >
                      <CheckCircle2 size={16} />
                      <span>{processingId === selectedNotif.rawId ? "Updating..." : "Mark as Fixed"}</span>
                    </button>
                  </>
                )}

                <a
                  href={`tel:${selectedNotif.senderPhone}`}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/15 bg-gray-100 dark:bg-white/10 px-4 py-3 text-xs font-bold text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition"
                >
                  <Phone size={16} />
                  <span>Call {selectedNotif.type === 'maintenance' ? 'Resident' : 'Applicant'}</span>
                </a>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Notifications;

