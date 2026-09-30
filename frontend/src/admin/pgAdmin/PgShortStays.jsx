import { useEffect, useState, useCallback, useMemo } from "react";
import {
  CalendarRange,
  CalendarCheck,
  CalendarClock,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Building2,
  Phone,
  Mail,
  User,
  RefreshCw,
  Sparkles,
  BedDouble,
  Snowflake,
  MessageSquare,
} from "lucide-react";
import api from "../../services/api";
import { formatStayDate, getShortStayStatusMeta } from "../../utils/shortStayUtils";

const ShortStayStatusBadge = ({ status }) => {
  const meta = getShortStayStatusMeta(status);
  const Icon = status === "approved" ? CalendarCheck : status === "completed" ? CheckCircle2 : status === "rejected" || status === "cancelled" ? XCircle : CalendarClock;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border ${meta.badgeCls}`}>
      <Icon size={12} className="shrink-0" />
      <span>{meta.label}</span>
    </span>
  );
};

export default function PgShortStays() {
  const [shortStays, setShortStays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPgId, setSelectedPgId] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchShortStays = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      const res = await api.get("/short-stays/owner");
      setShortStays(res.data?.success && Array.isArray(res.data?.shortStays) ? res.data.shortStays : []);
    } catch (error) {
      console.error("Failed to fetch owner short stays:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchShortStays();
  }, [fetchShortStays]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleUpdateStatus = async (id, newStatus, ownerNotes = null) => {
    try {
      setActionLoadingId(id);
      const res = await api.put(`/short-stays/${id}/status`, { status: newStatus, owner_notes: ownerNotes });
      if (res.data?.success) {
        setShortStays((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: newStatus, owner_notes: ownerNotes ?? s.owner_notes } : s))
        );
        showToast(`Short stay request marked as ${newStatus.toUpperCase()}!`);
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      alert(error?.response?.data?.message || "Failed to update status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const distinctPgs = useMemo(() => {
    const map = new Map();
    shortStays.forEach((s) => s.pg_id && !map.has(s.pg_id) && map.set(s.pg_id, s.pg_title || `PG #${s.pg_id}`));
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [shortStays]);

  const filteredStays = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return shortStays.filter((s) => {
      if (activeTab === "pending" && s.status !== "pending") return false;
      if (activeTab === "approved" && s.status !== "approved") return false;
      if (activeTab === "history" && !["completed", "rejected", "cancelled"].includes(s.status)) return false;
      if (selectedPgId !== "all" && Number(s.pg_id) !== Number(selectedPgId)) return false;
      if (!q) return true;
      return (
        (s.student_name || "").toLowerCase().includes(q) ||
        (s.student_phone || "").toLowerCase().includes(q) ||
        (s.pg_title || "").toLowerCase().includes(q) ||
        (s.room_type || "").toLowerCase().includes(q) ||
        (s.purpose || "").toLowerCase().includes(q)
      );
    });
  }, [shortStays, activeTab, selectedPgId, searchQuery]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return {
      total: shortStays.length,
      pending: shortStays.filter((s) => s.status === "pending").length,
      approved: shortStays.filter((s) => s.status === "approved").length,
      activeToday: shortStays.filter((s) => {
        if (s.status !== "approved") return false;
        const ci = new Date(s.check_in_date);
        const co = new Date(s.check_out_date);
        ci.setHours(0, 0, 0, 0);
        co.setHours(0, 0, 0, 0);
        return today >= ci && today <= co;
      }).length,
    };
  }, [shortStays]);

  return (
    <div className="space-y-5 pb-16 max-w-7xl mx-auto px-3 sm:px-6">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 rounded-2xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-5 py-3 shadow-2xl flex items-center gap-3 border border-white/10 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-50 via-white to-emerald-50/40 dark:from-indigo-950/20 dark:via-black dark:to-emerald-950/20 p-5 sm:p-6 rounded-3xl border border-indigo-100 dark:border-white/10 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-black uppercase tracking-wider mb-2">
            <CalendarRange size={14} /> Short Stays & Daily Guests
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Short Stay Bookings
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 font-medium">
            Review and approve 4–5 days or daily guest requests from students and temporary residents.
          </p>
        </div>

        <button
          onClick={() => fetchShortStays(true)}
          disabled={refreshing}
          className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-[#151515] border border-gray-200 dark:border-white/10 text-xs font-black text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition shadow-xs cursor-pointer"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Total Requests", val: stats.total, sub: "All short stay bookings", border: "border-gray-200 dark:border-white/10", bg: "bg-white dark:bg-[#111]" },
          { label: "Pending Review", val: stats.pending, sub: "Awaiting your approval", icon: Clock, border: "border-amber-500/30", bg: "bg-amber-50/40 dark:bg-amber-950/20", color: "text-amber-800 dark:text-amber-300" },
          { label: "Approved Stays", val: stats.approved, sub: "Confirmed by you", icon: CheckCircle2, border: "border-emerald-500/30", bg: "bg-emerald-50/40 dark:bg-emerald-950/20", color: "text-emerald-800 dark:text-emerald-300" },
          { label: "Active Today", val: stats.activeToday, sub: "Currently residing guests", icon: Sparkles, border: "border-indigo-500/30", bg: "bg-indigo-50/40 dark:bg-indigo-950/20", color: "text-indigo-800 dark:text-indigo-300" },
        ].map((s, i) => (
          <div key={i} className={`p-4 rounded-2xl border ${s.border} ${s.bg} shadow-xs`}>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${s.color || "text-gray-400"}`}>{s.label}</span>
              {s.icon && <s.icon size={15} className={s.color || "text-gray-400"} />}
            </div>
            <div className={`text-2xl sm:text-3xl font-black mt-1 ${s.color || "text-gray-900 dark:text-white"}`}>{s.val}</div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#111] p-3 rounded-2xl border border-gray-200 dark:border-white/10 shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          {[
            { key: "all", label: `All (${shortStays.length})` },
            { key: "pending", label: `Pending (${stats.pending})` },
            { key: "approved", label: `Approved (${stats.approved})` },
            { key: "history", label: "Completed / Other" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition shrink-0 cursor-pointer ${
                activeTab === tab.key
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-xs"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {distinctPgs.length > 1 && (
            <select
              value={selectedPgId}
              onChange={(e) => setSelectedPgId(e.target.value)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black text-gray-800 dark:text-gray-200 outline-none cursor-pointer"
            >
              <option value="all">All Properties</option>
              {distinctPgs.map((pg) => (
                <option key={pg.id} value={pg.id}>{pg.title}</option>
              ))}
            </select>
          )}

          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search student, PG, room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black text-xs font-medium text-gray-800 dark:text-gray-200 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* List Content */}
      {loading ? (
        <div className="p-12 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mb-3" />
          <p className="text-xs font-bold text-gray-500">Loading short stay requests...</p>
        </div>
      ) : filteredStays.length === 0 ? (
        <div className="p-10 text-center rounded-3xl border border-dashed border-gray-200 dark:border-white/10 bg-white dark:bg-[#111]">
          <CalendarRange className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <h3 className="text-sm font-black text-gray-800 dark:text-gray-200">No Short Stays Found</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1 font-medium">
            {searchQuery ? "No short stays match your search." : activeTab === "pending" ? "No pending short stay requests at this time." : "Short stay requests for your PGs will appear here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStays.map((stay) => {
            const isPending = stay.status === "pending";
            const isApproved = stay.status === "approved";
            const cleanPhone = (stay.student_phone || "").replace(/\D/g, "");
            const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

            return (
              <div
                key={stay.id}
                className="flex flex-col justify-between p-5 rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] hover:border-indigo-400/40 transition-all shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-gray-100 dark:border-white/5">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-black text-gray-900 dark:text-white">
                        <Building2 size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span className="truncate">{stay.pg_title || `PG #${stay.pg_id}`}</span>
                      </div>
                      {(stay.pg_area || stay.pg_city) && (
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium pl-5">
                          {[stay.pg_area, stay.pg_city].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>
                    <ShortStayStatusBadge status={stay.status} />
                  </div>

                  {/* Dates Banner */}
                  <div className="mt-3 p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CalendarRange className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <div>
                          <div className="text-[10px] uppercase font-bold text-indigo-700/80 dark:text-indigo-400/80">
                            Stay Duration
                          </div>
                          <div className="text-xs font-black text-gray-900 dark:text-white">
                            {formatStayDate(stay.check_in_date)} → {formatStayDate(stay.check_out_date)}
                          </div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-xl bg-indigo-600 text-white font-black text-[11px] shrink-0 shadow-xs">
                        {stay.total_days} {stay.total_days === 1 ? "Day" : "Days"}
                      </span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-indigo-100/70 dark:border-indigo-900/30 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-bold">
                        <BedDouble size={13} className="text-indigo-500" />
                        <span>{stay.room_type || "Standard Room"}</span>
                        {stay.is_ac ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-1.5 py-0.5 rounded-md">
                            <Snowflake size={10} /> AC
                          </span>
                        ) : null}
                      </div>

                      <div className="font-black text-emerald-700 dark:text-emerald-400">
                        ₹{Number(stay.total_amount || 0).toLocaleString()}{" "}
                        <span className="text-[10px] font-semibold text-gray-500">
                          (₹{Number(stay.daily_price || 0)}/d)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Student Details */}
                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <User size={13} className="text-gray-400 shrink-0" />
                      <span className="font-bold text-gray-900 dark:text-white">{stay.student_name}</span>
                    </div>
                    {stay.student_phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-gray-400 shrink-0" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">{stay.student_phone}</span>
                      </div>
                    )}
                    {stay.student_email && (
                      <div className="flex items-center gap-2">
                        <Mail size={13} className="text-gray-400 shrink-0" />
                        <span className="font-medium text-gray-500 dark:text-gray-400 truncate">{stay.student_email}</span>
                      </div>
                    )}
                    {stay.purpose && (
                      <div className="mt-2 p-2.5 rounded-xl bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-white/5">
                        <span className="font-bold text-gray-500 dark:text-gray-400 block text-[10px] uppercase">Purpose / Notes:</span>
                        <p className="text-gray-800 dark:text-gray-200 mt-0.5 font-medium">{stay.purpose}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {stay.student_phone && (
                      <>
                        <a
                          href={`tel:${stay.student_phone}`}
                          className="p-2 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 transition"
                          title="Call Student"
                        >
                          <Phone size={14} />
                        </a>
                        <a
                          href={`https://wa.me/${waPhone}?text=${encodeURIComponent(
                            `Hi ${stay.student_name}, regarding your short stay request at ${stay.pg_title} (${stay.total_days} days from ${stay.check_in_date} to ${stay.check_out_date})...`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl border border-emerald-300/40 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition"
                          title="WhatsApp Student"
                        >
                          <MessageSquare size={14} />
                        </a>
                      </>
                    )}
                  </div>

                  {isPending && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateStatus(stay.id, "rejected")}
                        disabled={actionLoadingId === stay.id}
                        className="px-3.5 py-1.5 rounded-xl border border-rose-300 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold transition cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(stay.id, "approved")}
                        disabled={actionLoadingId === stay.id}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md transition cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckCircle2 size={14} />
                        <span>{actionLoadingId === stay.id ? "Updating..." : "Approve Stay"}</span>
                      </button>
                    </div>
                  )}

                  {isApproved && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateStatus(stay.id, "completed")}
                        disabled={actionLoadingId === stay.id}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-xs transition cursor-pointer"
                      >
                        Mark Completed
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(stay.id, "cancelled", "Cancelled by owner")}
                        disabled={actionLoadingId === stay.id}
                        className="px-3 py-1.5 text-gray-500 hover:text-rose-600 text-xs font-bold transition cursor-pointer"
                      >
                        Cancel Stay
                      </button>
                    </div>
                  )}

                  {!isPending && !isApproved && (
                    <span className="text-xs font-bold text-gray-400 capitalize">
                      {stay.status} on {formatStayDate(stay.updated_at || stay.created_at)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
