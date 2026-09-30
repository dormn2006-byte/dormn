import { useEffect, useState, useCallback, useMemo, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarRange,
  CalendarCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Phone,
  MessageSquare,
  ArrowLeft,
  BedDouble,
  Snowflake,
  RefreshCw,
  MapPin,
  X,
} from "lucide-react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import ThemeSwitch from "../components/ui/theme-switch-button";
import MacOSDock from "../components/ui/mac-os-dock";
import { buildStudentDockApps } from "../constants/studentDockConfig";
import { formatStayDate } from "../utils/shortStayUtils";

export default function MyShortStays() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [shortStays, setShortStays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchMyShortStays = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/short-stays/my");
      const rawList = res.data?.success && Array.isArray(res.data?.shortStays) ? res.data.shortStays : [];

      // Deduplicate short stays: group by pg_id
      const map = new Map();
      const prio = { approved: 4, pending: 3, completed: 2, rejected: 1, cancelled: 0 };
      rawList.forEach((s) => {
        const k = s.pg_id || s.id;
        if (!map.has(k)) {
          map.set(k, s);
        } else {
          const ex = map.get(k);
          const curP = prio[s.status] || 0;
          const exP = prio[ex.status] || 0;
          if (curP > exP) {
            map.set(k, s);
          } else if (curP === exP) {
            const t1 = new Date(s.created_at || s.check_in_date || 0).getTime() || Number(s.id) || 0;
            const t2 = new Date(ex.created_at || ex.check_in_date || 0).getTime() || Number(ex.id) || 0;
            if (t1 > t2) map.set(k, s);
          }
        }
      });
      const list = Array.from(map.values());
      list.sort((a, b) => {
        if (a.status === "approved" && b.status !== "approved") return -1;
        if (a.status !== "approved" && b.status === "approved") return 1;
        return new Date(b.created_at || b.check_in_date || 0) - new Date(a.created_at || a.check_in_date || 0);
      });

      setShortStays(list);
    } catch (error) {
      console.error("Failed to fetch my short stays:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyShortStays();
  }, [fetchMyShortStays]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCancelStay = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this short stay request?")) return;
    try {
      setCancellingId(id);
      const res = await api.put(`/short-stays/${id}/cancel`);
      if (res.data?.success) {
        setShortStays((prev) => prev.map((s) => (s.id === id ? { ...s, status: "cancelled" } : s)));
        showToast("Short stay request cancelled.");
      }
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to cancel stay request.");
    } finally {
      setCancellingId(null);
    }
  };

  const dockApps = useMemo(() => buildStudentDockApps(user?.id), [user?.id]);
  const approvedStays = useMemo(() => shortStays.filter((s) => s.status === "approved"), [shortStays]);
  const pendingStays = useMemo(() => shortStays.filter((s) => s.status === "pending"), [shortStays]);
  const otherStays = useMemo(() => shortStays.filter((s) => !["approved", "pending"].includes(s.status)), [shortStays]);

  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#000000] text-[#0D3A1D] dark:text-gray-100 pb-32 font-sans selection:bg-[#93B733] selection:text-white">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 rounded-2xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-5 py-3 shadow-2xl flex items-center gap-3 border border-white/10 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200/40 dark:border-gray-800/40 bg-white/70 dark:bg-black/70 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1400px] h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/student/dashboard")}
              className="p-1.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-900 transition cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo-sm.webp" alt="Dormn" className="h-7 w-7 object-contain" />
              <span className="text-base font-black text-[#0D3A1D] dark:text-gray-200 tracking-tight">Dormn</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSwitch />
            <Link to="/student/dashboard" className="text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">
              My Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-[1200px] px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* Hero Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#111] border border-gray-200/80 dark:border-white/10 shadow-xs">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-black uppercase tracking-wider mb-2">
              <CalendarRange size={14} /> Short Stays & Daily Guest Requests
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">My Short Stays</h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
              View your 4–5 days or daily PG bookings, check owner approval status, and contact PG owners directly.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/pgs"
              className="px-4 py-2 rounded-xl bg-[#93B733] hover:bg-[#82a32d] text-black font-black text-xs transition shadow-xs cursor-pointer"
            >
              Book Another Stay
            </Link>
            <button
              onClick={fetchMyShortStays}
              className="p-2 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition cursor-pointer"
              title="Refresh"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* Quick KPI Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 shadow-xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Requests</span>
            <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1 block">{shortStays.length}</span>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-500/30 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Approved Stays</span>
              <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-emerald-900 dark:text-emerald-300 mt-1 block">{approvedStays.length}</span>
          </div>
          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-500/30 shadow-xs col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Pending Review</span>
              <Clock size={16} className="text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-2xl sm:text-3xl font-black text-amber-900 dark:text-amber-300 mt-1 block">{pendingStays.length}</span>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#93B733] border-t-transparent mb-3" />
            <p className="text-xs font-bold text-gray-500">Loading your short stays...</p>
          </div>
        ) : shortStays.length === 0 ? (
          <div className="p-10 text-center rounded-3xl border border-dashed border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] space-y-3">
            <CalendarRange className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto" />
            <h2 className="text-base font-black text-gray-900 dark:text-white">No Short Stays Yet</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto font-medium">
              Need a PG for 4–5 days or daily visits during college exams or internships? Browse PGs and select "Need a Short Stay?".
            </p>
            <Link
              to="/pgs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#93B733] hover:bg-[#82a32d] text-black font-black text-xs transition shadow-xs"
            >
              Explore PGs for Short Stay →
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Approved Stays Section */}
            {approvedStays.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h2 className="text-base font-black text-emerald-800 dark:text-emerald-400">
                    Approved by Owner ({approvedStays.length})
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {approvedStays.map((stay) => {
                    const cleanPhone = (stay.owner_phone || stay.pg_phone || "").replace(/\D/g, "");
                    const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

                    return (
                      <div
                        key={stay.id}
                        className="rounded-3xl border-2 border-emerald-500/40 bg-white dark:bg-[#111] p-5 shadow-md relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400" />
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider mb-1">
                              <CheckCircle2 size={11} /> Stay Confirmed
                            </span>
                            <h3 className="text-base font-black text-gray-950 dark:text-white">{stay.pg_title}</h3>
                            {(stay.pg_area || stay.pg_city) && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 font-medium mt-0.5">
                                <MapPin size={12} className="text-emerald-500 shrink-0" />
                                <span>{[stay.pg_area, stay.pg_city].filter(Boolean).join(", ")}</span>
                              </p>
                            )}
                          </div>
                          <Link to={`/pg/${stay.pg_id}`} className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0">
                            View PG →
                          </Link>
                        </div>

                        {/* Dates Banner */}
                        <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/40 my-3">
                          <div className="flex items-center justify-between text-xs">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 block">Check-in → Check-out</span>
                              <span className="font-black text-gray-950 dark:text-white text-xs sm:text-sm">
                                {formatStayDate(stay.check_in_date)} — {formatStayDate(stay.check_out_date)}
                              </span>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-xs shrink-0">
                              {stay.total_days} {stay.total_days === 1 ? "Day" : "Days"}
                            </span>
                          </div>

                          <div className="mt-2 pt-2 border-t border-emerald-200/50 dark:border-emerald-900/30 flex items-center justify-between text-xs font-bold">
                            <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                              <BedDouble size={13} className="text-emerald-600" />
                              <span>{stay.room_type || "Standard Room"}</span>
                              {stay.is_ac && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] text-sky-600 font-black bg-sky-100 dark:bg-sky-950 px-1.5 py-0.2 rounded">
                                  <Snowflake size={9} /> AC
                                </span>
                              )}
                            </div>
                            <span className="font-black text-emerald-800 dark:text-emerald-300">
                              Total: ₹{Number(stay.total_amount || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Contact Box */}
                        <div className="p-3 rounded-2xl bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-white/5 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-gray-400 block">Property Host</span>
                              <span className="font-bold text-gray-900 dark:text-white">{stay.owner_name || "PG Host"}</span>
                            </div>
                            <span className="font-semibold text-gray-600 dark:text-gray-400">{stay.owner_phone || stay.pg_phone || "Contact Available"}</span>
                          </div>

                          {cleanPhone && (
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <a
                                href={`tel:${cleanPhone}`}
                                className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-xs font-bold text-gray-800 dark:text-gray-200 transition"
                              >
                                <Phone size={13} /> Call
                              </a>
                              <a
                                href={`https://wa.me/${waPhone}?text=${encodeURIComponent(
                                  `Hi ${stay.owner_name || "Owner"}, my short stay for ${stay.pg_title} from ${stay.check_in_date} to ${stay.check_out_date} has been approved on Dormn. Confirming my arrival time.`
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20b858] text-white text-xs font-black transition shadow-xs"
                              >
                                <MessageSquare size={13} /> WhatsApp
                              </a>
                            </div>
                          )}
                        </div>

                        {stay.owner_notes && (
                          <p className="mt-2 text-xs font-medium text-emerald-800 dark:text-emerald-400 italic">
                            Host Note: "{stay.owner_notes}"
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pending Requests Section */}
            {pendingStays.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <h2 className="text-base font-black text-amber-800 dark:text-amber-400">
                    Pending Owner Review ({pendingStays.length})
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingStays.map((stay) => (
                    <div
                      key={stay.id}
                      className="rounded-3xl border border-amber-500/30 bg-white dark:bg-[#111] p-5 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider mb-1">
                            <Clock size={11} /> Waiting for Verification
                          </span>
                          <h3 className="text-base font-black text-gray-900 dark:text-white">{stay.pg_title}</h3>
                        </div>
                        <Link to={`/pg/${stay.pg_id}`} className="text-[11px] font-bold text-gray-500 hover:text-black dark:hover:text-white">
                          View PG →
                        </Link>
                      </div>

                      <div className="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 my-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-700 dark:text-gray-300">
                            Requested: {formatStayDate(stay.check_in_date)} → {formatStayDate(stay.check_out_date)}
                          </span>
                          <span className="font-black text-amber-800 dark:text-amber-400">{stay.total_days} Days</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                          <span>{stay.room_type}</span>
                          <span>Est: ₹{Number(stay.total_amount || 0).toLocaleString()}</span>
                        </div>
                      </div>

                      <p className="text-xs text-amber-800/90 dark:text-amber-400/90 font-medium">
                        The PG owner has been notified. Once approved, you'll be able to chat with the owner directly.
                      </p>

                      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-gray-400">
                          Submitted on {new Date(stay.created_at).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => handleCancelStay(stay.id)}
                          disabled={cancellingId === stay.id}
                          className="text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 transition cursor-pointer"
                        >
                          {cancellingId === stay.id ? "Cancelling..." : "Cancel Request"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Past / Cancelled Requests */}
            {otherStays.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-gray-200/70 dark:border-white/10">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">
                  Past / Cancelled Requests ({otherStays.length})
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {otherStays.map((stay) => (
                    <div
                      key={stay.id}
                      className="p-4 rounded-2xl bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 opacity-75 text-xs"
                    >
                      <div className="flex items-center justify-between font-bold mb-1">
                        <span className="truncate text-gray-900 dark:text-white">{stay.pg_title}</span>
                        <span className="capitalize text-gray-500">{stay.status}</span>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        {stay.check_in_date} to {stay.check_out_date} ({stay.total_days} Days) • {stay.room_type}
                      </p>
                      {stay.owner_notes && (
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">Note: {stay.owner_notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Dock */}
      <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <div className="pointer-events-auto">
          <MacOSDock apps={dockApps} activeAppId="/my-short-stays" />
        </div>
      </div>
    </div>
  );
}
