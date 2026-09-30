import { useEffect, useState, useCallback, useMemo, memo } from "react";
import {
  CalendarDays, CalendarCheck, CalendarClock, Clock, CheckCircle2, XCircle,
  Search, Building2, Phone, Mail, User, RefreshCw,
} from "lucide-react";
import api from "../../services/api";
import CustomSelect from "../../components/ui/CustomSelect";

const formatVisitDate = (dateStr) => {
  if (!dateStr) return "Not specified";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(d);
    target.setHours(0, 0, 0, 0);
    const diff = Math.round((target - today) / 86400000);
    const prefix = diff === 0 ? "Today, " : diff === 1 ? "Tomorrow, " : diff === -1 ? "Yesterday, " : "";
    return prefix + d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
};

const STATUS_MAP = {
  confirmed: { label: "Confirmed", cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30", icon: CalendarCheck },
  completed: { label: "Completed", cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", cls: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30", icon: XCircle },
  pending: { label: "Pending", cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30", icon: CalendarClock },
};

const VisitStatusBadge = memo(({ status }) => {
  const meta = STATUS_MAP[status] || STATUS_MAP.pending;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border ${meta.cls}`}>
      <Icon size={12} className="shrink-0" />
      <span>{meta.label}</span>
    </span>
  );
});
VisitStatusBadge.displayName = "VisitStatusBadge";

export default function PgVisits() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPgId, setSelectedPgId] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);

  const fetchVisits = useCallback(async (isSilent = false) => {
    try {
      if (isSilent) setRefreshing(true);
      const res = await api.get("/visits/owner");
      const raw = res.data?.visits || res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setVisits(Array.isArray(raw) ? raw.map((v) => ({ ...v, id: v.id || v._id })) : []);
    } catch (err) {
      console.error("Error fetching PG visits:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  const handleUpdateStatus = async (visitId, newStatus) => {
    try {
      setUpdatingId(visitId);
      await api.put(`/visits/${visitId}/status`, { status: newStatus });
      setVisits((prev) => prev.map((v) => (v.id === visitId || v._id === visitId ? { ...v, status: newStatus } : v)));
    } catch (err) {
      console.error("Failed to update status:", err);
      alert(err.response?.data?.message || "Failed to update visit status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const uniquePgs = useMemo(() => {
    const map = new Map();
    visits.forEach((v) => { if (v.pg_id && !map.has(v.pg_id)) map.set(v.pg_id, v.pg_title || `PG #${v.pg_id}`); });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [visits]);

  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return {
      total: visits.length,
      today: visits.filter((v) => v.visit_date === todayStr).length,
      upcoming: visits.filter((v) => v.status !== "cancelled" && v.status !== "completed" && v.visit_date >= todayStr).length,
      completed: visits.filter((v) => v.status === "completed").length,
      pending: visits.filter((v) => v.status === "pending").length,
    };
  }, [visits]);

  const filteredVisits = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const q = searchQuery.toLowerCase().trim();

    return visits.filter((v) => {
      if (activeTab === "today" && v.visit_date !== todayStr) return false;
      if (activeTab === "upcoming" && (v.status === "cancelled" || v.status === "completed" || v.visit_date < todayStr)) return false;
      if (activeTab === "pending" && v.status !== "pending") return false;
      if (activeTab === "confirmed" && v.status !== "confirmed") return false;
      if (activeTab === "completed" && v.status !== "completed") return false;
      if (activeTab === "cancelled" && v.status !== "cancelled") return false;
      if (selectedPgId !== "all" && String(v.pg_id) !== String(selectedPgId)) return false;
      if (q) {
        const hay = `${v.student_name || ""} ${v.student_phone || ""} ${v.student_email || ""} ${v.pg_title || ""} ${v.pg_area || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [visits, activeTab, selectedPgId, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#0A0A0A] p-3 sm:p-5 md:p-8 space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-[#121212] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-200/80 dark:border-white/5 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-[#93B733]/15 text-[#93B733]">
            <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-black tracking-tight text-gray-900 dark:text-white">PG Scheduled Visits</h1>
            <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Track prospective tenants visiting your properties, time slots, and connect directly.</p>
          </div>
        </div>

        <button
          onClick={() => fetchVisits(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 transition active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4">
        {[
          { label: "Total Requests", val: stats.total, cls: "text-gray-900 dark:text-white" },
          { label: "Today's Visits", val: stats.today, cls: "text-emerald-600 dark:text-emerald-400", pulse: true },
          { label: "Upcoming", val: stats.upcoming, cls: "text-blue-500" },
          { label: "Pending Action", val: stats.pending, cls: "text-amber-500" },
          { label: "Completed", val: stats.completed, cls: "text-gray-900 dark:text-white", full: true },
        ].map((s, idx) => (
          <div key={idx} className={`bg-white dark:bg-[#121212] p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200/80 dark:border-white/5 shadow-xs ${s.full ? "col-span-2 lg:col-span-1" : ""}`}>
            <div className="text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              {s.pulse && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
              {s.label}
            </div>
            <div className={`mt-1 text-xl sm:text-2xl font-black ${s.cls}`}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#121212] p-3 sm:p-4 rounded-2xl border border-gray-200/80 dark:border-white/5 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { key: "all", label: "All Visits" },
            { key: "today", label: `Today (${stats.today})` },
            { key: "upcoming", label: `Upcoming (${stats.upcoming})` },
            { key: "pending", label: `Pending (${stats.pending})` },
            { key: "completed", label: "Completed" },
            { key: "cancelled", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                activeTab === tab.key ? "bg-[#93B733] text-white shadow-xs" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {uniquePgs.length > 1 && (
            <CustomSelect
              value={selectedPgId}
              onChange={(val) => setSelectedPgId(val)}
              className="w-full sm:w-52"
              buttonClassName="py-2 text-xs font-bold"
              options={[{ value: "all", label: "All Properties" }, ...uniquePgs.map((pg) => ({ value: String(pg.id), label: pg.title }))]}
            />
          )}

          <div className="relative min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search visitor or PG..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl text-xs font-medium border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#93B733]"
            />
          </div>
        </div>
      </div>

      {/* Visits List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-[#121212] rounded-3xl border border-gray-200/80 dark:border-white/5">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#93B733] border-t-transparent mb-3" />
          <p className="text-xs font-bold text-gray-500">Loading visit requests...</p>
        </div>
      ) : filteredVisits.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-[#121212] rounded-3xl border border-gray-200/80 dark:border-white/5">
          <div className="p-4 rounded-3xl bg-gray-100 dark:bg-white/5 text-gray-400 mb-3"><CalendarDays size={36} /></div>
          <h3 className="text-base font-black text-gray-900 dark:text-white">No Visits Found</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
            {searchQuery ? "No visit requests match your search query." : "When students request to visit your PGs, their scheduled dates and times will appear here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {filteredVisits.map((visit) => {
            const isToday = visit.visit_date === new Date().toISOString().slice(0, 10);
            const cleanPhone = (visit.student_phone || "").replace(/\D/g, "");
            const waNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
            const waText = encodeURIComponent(`Hi ${visit.student_name || "there"}, regarding your scheduled visit for ${visit.pg_title || "the PG"} on ${formatVisitDate(visit.visit_date)} (${visit.visit_time_slot || "Time slot"}), looking forward to showing you around!`);

            return (
              <div
                key={visit.id}
                className={`bg-white dark:bg-[#121212] rounded-2xl sm:rounded-3xl border transition-all hover:shadow-md p-4 sm:p-5 ${
                  isToday ? "border-emerald-500/40 dark:border-emerald-500/30 bg-emerald-500/[0.01]" : "border-gray-200/80 dark:border-white/5"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 flex-1">
                    <div className="h-11 w-11 sm:h-13 sm:w-13 rounded-2xl bg-gradient-to-br from-[#93B733]/20 to-[#0D3A1D]/20 text-[#0D3A1D] dark:text-[#93B733] font-black text-sm sm:text-base flex items-center justify-center shrink-0 border border-gray-200/50 dark:border-white/10">
                      {visit.student_name ? visit.student_name.slice(0, 2).toUpperCase() : <User size={20} />}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm sm:text-base font-black text-gray-900 dark:text-white truncate">{visit.student_name || "Interested Student"}</span>
                        <VisitStatusBadge status={visit.status} />
                        {isToday && <span className="rounded-full bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 animate-pulse">TODAY</span>}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {visit.student_phone && (
                          <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300 font-bold">
                            <Phone size={12} className="text-[#93B733]" />
                            {visit.student_phone}
                          </span>
                        )}
                        {visit.student_email && (
                          <span className="flex items-center gap-1 truncate max-w-[240px]">
                            <Mail size={12} className="text-gray-400" />
                            {visit.student_email}
                          </span>
                        )}
                      </div>

                      <div className="pt-1 flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 font-bold">
                        <Building2 size={13} className="text-[#93B733] shrink-0" />
                        <span className="text-gray-900 dark:text-white font-extrabold truncate">{visit.pg_title}</span>
                        {(visit.pg_area || visit.pg_city) && (
                          <span className="text-gray-400 text-[11px] font-normal truncate">• {[visit.pg_area, visit.pg_city].filter(Boolean).join(", ")}</span>
                        )}
                      </div>

                      {visit.notes && (
                        <div className="mt-2 rounded-xl bg-gray-50 dark:bg-white/[0.03] p-2 sm:p-2.5 text-xs text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-white/5">
                          <span className="font-bold text-gray-700 dark:text-gray-200">Note: </span>"{visit.notes}"
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-1.5 border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-white/5 pt-3 lg:pt-0 lg:pl-6 shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs font-black text-gray-900 dark:text-white">
                        <CalendarDays size={14} className="text-[#93B733]" />
                        <span>{formatVisitDate(visit.visit_date)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400 mt-0.5 justify-end">
                        <Clock size={12} className="text-gray-400" />
                        <span>{visit.visit_time_slot || "10:00 AM - 01:00 PM"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-2 sm:pt-0 shrink-0">
                    {cleanPhone && (
                      <>
                        <a
                          href={`https://wa.me/${waNumber}?text=${waText}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-50/70 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 transition"
                          title="Chat on WhatsApp"
                        >
                          <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="h-3.5 w-3.5 object-contain" />
                          <span>WhatsApp</span>
                        </a>
                        <a
                          href={`tel:${cleanPhone}`}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-50/70 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 px-3 py-2 text-xs font-bold text-blue-700 dark:text-blue-300 transition"
                          title="Call student"
                        >
                          <Phone size={13} className="text-blue-600 dark:text-blue-400" />
                          <span>Call</span>
                        </a>
                      </>
                    )}

                    {visit.status === "pending" && (
                      <button
                        onClick={() => handleUpdateStatus(visit.id, "confirmed")}
                        disabled={updatingId === visit.id}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#93B733] hover:bg-[#82a32d] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 size={13} />
                        <span>Confirm</span>
                      </button>
                    )}

                    {visit.status === "confirmed" && (
                      <button
                        onClick={() => handleUpdateStatus(visit.id, "completed")}
                        disabled={updatingId === visit.id}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 size={13} />
                        <span>Mark Visited</span>
                      </button>
                    )}

                    {visit.status !== "cancelled" && (
                      <button
                        onClick={() => handleUpdateStatus(visit.id, "cancelled")}
                        disabled={updatingId === visit.id}
                        className="inline-flex items-center gap-1 rounded-xl border border-gray-200 dark:border-white/10 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/20 px-2.5 py-2 text-xs font-bold text-gray-500 hover:text-rose-600 transition cursor-pointer disabled:opacity-50"
                        title="Cancel visit"
                      >
                        <XCircle size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
