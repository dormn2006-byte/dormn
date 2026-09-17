import { useEffect, useState, useCallback, useMemo } from "react";
import {
  CheckCircle2,
  XCircle,
  Search,
  Building2,
  Phone,
  Mail,
  UserMinus,
  Clock,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  DoorOpen,
  Calendar,
  Sparkles,
  MessageSquare,
  Filter,
  Check,
  X
} from "lucide-react";
import api from "../../services/api";

export default function Cancellations() {
  const [cancellations, setCancellations] = useState([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [processingId, setProcessingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  const fetchCancellations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/bookings/owner-cancellations");
      if (res?.data?.success) {
        setCancellations(res.data.cancellations || []);
        if (res.data.counts) {
          setCounts(res.data.counts);
        }
      }
    } catch (error) {
      console.error("Owner Cancellations Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCancellations();
  }, [fetchCancellations]);

  const handleAction = async (bookingId, action) => {
    setProcessingId(bookingId);
    try {
      const res = await api.post("/bookings/handle-stay-cancellation", {
        bookingId,
        action,
      });

      if (res?.data?.success) {
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new CustomEvent("dormn_request_updated"));

        try {
          const notifs = JSON.parse(localStorage.getItem("dormn_resident_notifications") || "[]");
          notifs.unshift({
            id: "notif-cancel-" + Date.now(),
            type: "stay_cancellation_update",
            category: "Cancellation",
            title: action === "approve" ? "Stay Cancellation Accepted" : "Stay Cancellation Rejected",
            message: action === "approve"
              ? "Your PG owner has accepted your cancellation request. Your room spot has been released. Your profile data and event tickets remain safely stored."
              : "Your PG owner has reviewed and rejected your cancellation request. Please contact your property manager.",
            status: action,
            created_at: new Date().toISOString(),
            read: false
          });
          localStorage.setItem("dormn_resident_notifications", JSON.stringify(notifs));
        } catch {}

        setConfirmModal(null);
        await fetchCancellations();
      }
    } catch (err) {
      console.error("Cancellation Action Error:", err);
      alert(err?.response?.data?.message || "Failed to process cancellation action");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredCancellations = useMemo(() => {
    return cancellations.filter((item) => {
      const studentName = (item.student_name || "").toLowerCase();
      const pgTitle = (item.pg_title || "").toLowerCase();
      const reason = (item.cancellation_reason || "").toLowerCase();
      const term = searchTerm.toLowerCase();

      const matchesSearch = studentName.includes(term) || pgTitle.includes(term) || reason.includes(term);
      const matchesStatus = selectedStatus === "all" ? true : item.cancellation_status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [cancellations, searchTerm, selectedStatus]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* TOP BANNER & STATS CARDS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black shadow-sm">
              <UserMinus size={20} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                Resident Cancellation Requests
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Review and approve move-out / checkout requests from enrolled residents
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchCancellations}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0c1220] hover:bg-gray-50 dark:hover:bg-white/5 text-xs font-bold text-gray-700 dark:text-gray-300 transition shadow-sm cursor-pointer self-start md:self-center"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* 4 Summary Stat Pills */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0c1220] p-4 sm:p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
            Total Requests
          </span>
          <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
            {counts.total}
          </p>
        </div>

        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/[0.04] p-4 sm:p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-1 flex items-center gap-1.5">
            <Clock size={13} className="animate-spin" style={{ animationDuration: "4s" }} /> Needs Decision
          </span>
          <p className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-400">
            {counts.pending}
          </p>
        </div>

        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/[0.04] p-4 sm:p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1 flex items-center gap-1.5">
            <CheckCircle2 size={13} /> Accepted & Released
          </span>
          <p className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400">
            {counts.approved}
          </p>
        </div>

        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/[0.03] p-4 sm:p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block mb-1 flex items-center gap-1.5">
            <XCircle size={13} /> Declined
          </span>
          <p className="text-xl sm:text-2xl font-black text-rose-700 dark:text-rose-400">
            {counts.rejected}
          </p>
        </div>
      </div>

      {/* FILTER TABS & SEARCH BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-3xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0c1220] p-3 sm:p-5 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
          {[
            { id: "all", label: "All Requests", count: counts.total },
            { id: "pending", label: "Needs Decision", count: counts.pending, isAlert: counts.pending > 0 },
            { id: "approved", label: "Accepted & Released", count: counts.approved },
            { id: "rejected", label: "Declined", count: counts.rejected },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`flex items-center gap-2.5 rounded-2xl px-3 py-2 sm:px-5 sm:py-3 text-xs sm:text-sm font-black transition-all shrink-0 cursor-pointer ${
                selectedStatus === tab.id
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-600/25"
                  : "bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`rounded-xl px-2 sm:px-2.5 py-0.5 text-xs font-black ${
                selectedStatus === tab.id
                  ? "bg-white/20 text-white"
                  : tab.isAlert
                    ? "bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold"
                    : "bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-gray-200"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by student, PG or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-white/5 py-2.5 sm:py-3 pl-10 sm:pl-12 pr-4 text-xs sm:text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-rose-500 focus:bg-white dark:focus:bg-[#141b2d]"
          />
        </div>
      </div>

      {/* CANCELLATION REQUESTS LIST */}
      {loading ? (
        <div className="rounded-3xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0c1220] p-12 text-center shadow-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 dark:border-gray-800 border-t-rose-500 mx-auto mb-4"></div>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Loading cancellation requests...</p>
        </div>
      ) : filteredCancellations.length === 0 ? (
        <div className="rounded-3xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0c1220] p-12 text-center shadow-sm space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-400 flex items-center justify-center mx-auto">
            <UserMinus size={28} />
          </div>
          <h3 className="text-lg font-black text-gray-900 dark:text-white">
            No cancellation requests found
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            {searchTerm || selectedStatus !== "all"
              ? "No cancellation requests match your search or selected filter tab."
              : "There are currently no cancellation or move-out requests from your residents."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCancellations.map((item) => {
            const isPending = item.cancellation_status === "pending";
            const isApproved = item.cancellation_status === "approved";
            const isRejected = item.cancellation_status === "rejected";

            return (
              <div
                key={item.booking_id || item.id}
                className={`rounded-3xl border p-5 sm:p-6 transition-all duration-200 space-y-4 shadow-sm ${
                  isPending
                    ? "border-amber-500/40 bg-amber-500/[0.02] dark:bg-amber-500/[0.04]"
                    : isApproved
                      ? "border-emerald-500/30 bg-white dark:bg-[#0c1220]"
                      : "border-gray-200 dark:border-white/15 bg-white dark:bg-[#0c1220]"
                }`}
              >
                {/* Top Row: Student & PG Overview */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-white/5">
                  {/* Student Info */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-md">
                      {(item.student_name || "S").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-base font-black text-gray-900 dark:text-white truncate">
                          {item.student_name || "Student Resident"}
                        </h3>
                        <span className="text-xs font-bold text-gray-400">
                          #BK-{item.booking_id || item.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1 flex-wrap">
                        {item.student_phone && (
                          <span className="flex items-center gap-1">
                            <Phone size={12} className="text-emerald-500" />
                            {item.student_phone}
                          </span>
                        )}
                        {item.student_email && (
                          <span className="flex items-center gap-1">
                            <Mail size={12} className="text-blue-500" />
                            {item.student_email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* PG Property & Room Spec */}
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 p-3 rounded-2xl border border-gray-100 dark:border-white/5 self-start lg:self-center">
                    <Building2 size={18} className="text-[#93B733] shrink-0" />
                    <div>
                      <h4 className="text-xs font-black text-gray-900 dark:text-white truncate max-w-xs">
                        {item.pg_title || "PG Property"}
                      </h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {item.selected_room_type || "Standard Room"} • ₹{(Number(item.booked_price || item.pg_price || 0)).toLocaleString()}/mo
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="self-start lg:self-center">
                    {isPending ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-black uppercase tracking-wider animate-pulse">
                        <Clock size={13} /> Needs Decision
                      </span>
                    ) : isApproved ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-black uppercase tracking-wider">
                        <CheckCircle2 size={13} /> Accepted & Released
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs font-black uppercase tracking-wider">
                        <XCircle size={13} /> Request Declined
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle Row: Reason and Timeline Callout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Reason Text */}
                  <div className="md:col-span-2 p-4 rounded-2xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
                      <MessageSquare size={12} className="text-rose-500" /> Resident's Stated Reason
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 leading-relaxed">
                      "{item.cancellation_reason || "Student requested to vacate room."}"
                    </p>
                  </div>

                  {/* Metadata / Timeline */}
                  <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 space-y-1 text-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
                      <Calendar size={12} className="text-blue-500" /> Request Timeline
                    </span>
                    <p className="text-gray-700 dark:text-gray-300 font-medium">
                      Requested on: <strong>{item.cancellation_requested_at ? new Date(item.cancellation_requested_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recent"}</strong>
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Stay Start: {item.booking_date ? new Date(item.booking_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                    </p>
                  </div>
                </div>

                {/* Bottom Row: Actions & Data Guarantee */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                    <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                    <span>Accepting will free the spot for new bookings while preserving the student's KYC & event tickets.</span>
                  </div>

                  {isPending && (
                    <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => setConfirmModal({ item, action: "reject" })}
                        disabled={processingId === item.booking_id}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-xs font-bold transition cursor-pointer"
                      >
                        Decline
                      </button>

                      <button
                        onClick={() => setConfirmModal({ item, action: "approve" })}
                        disabled={processingId === item.booking_id}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition active:scale-95 cursor-pointer"
                      >
                        <Check size={14} strokeWidth={3} />
                        <span>Accept & Release Spot</span>
                      </button>
                    </div>
                  )}

                  {isApproved && (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={14} /> Room spot released back into inventory
                    </span>
                  )}

                  {isRejected && (
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <XCircle size={14} /> Request declined
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ACTION CONFIRMATION MODAL */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#10141e] border border-gray-200 dark:border-white/10 shadow-2xl p-6 sm:p-7 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                confirmModal.action === "approve"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
              }`}>
                {confirmModal.action === "approve" ? <DoorOpen size={24} /> : <AlertTriangle size={24} />}
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                  {confirmModal.action === "approve" ? "Accept Stay Cancellation?" : "Decline Cancellation Request?"}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {confirmModal.item.student_name} • {confirmModal.item.pg_title}
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              {confirmModal.action === "approve"
                ? "Accepting this request will mark the booking as cancelled and release this room spot back to your available inventory. The student will be able to book another PG, while all their KYC documents and event passes remain safely preserved in their Dormn account."
                : "Declining this request will notify the resident that the cancellation request was not approved. Their stay will remain active."}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processingId !== null}
                onClick={() => handleAction(confirmModal.item.booking_id || confirmModal.item.id, confirmModal.action)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-black shadow-md transition active:scale-95 cursor-pointer ${
                  confirmModal.action === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25"
                    : "bg-rose-600 hover:bg-rose-500 shadow-rose-600/25"
                }`}
              >
                {processingId !== null ? "Processing..." : confirmModal.action === "approve" ? "Yes, Accept & Free Spot" : "Yes, Decline Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}