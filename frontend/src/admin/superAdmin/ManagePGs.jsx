import { useContext, useEffect, useMemo, useState } from "react";
import {
  Search,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  RotateCcw,
  Ban,
  X,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";

const ManagePGs = () => {
  const [search, setSearch] = useState("");
  const [pgs, setPgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Unified Action Modal State (type: 'revision' | 'remove')
  const [modal, setModal] = useState({ type: null, pg: null, note: "" });
  const [submittingAction, setSubmittingAction] = useState(false);

  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPGs = async () => {
      try {
        setLoading(true);

        const { data } = await api.get("/superadmin/pgs", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setPgs(data.pgs || data || []);
      } catch (err) {
        console.error("PG Fetch Error:", err);
        setError("Failed to load PG listings");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchPGs();
    }
  }, [token]);

  const filteredPGs = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return pgs;
    return pgs.filter((pg) => {
      const title = (pg.title || pg.name || "").toLowerCase();
      const owner = (pg.owner_name || pg.owner || "").toLowerCase();
      return title.includes(q) || owner.includes(q);
    });
  }, [pgs, search]);

  const { totalPGs, pendingPGs, approvedPGs, rejectedPGs, removedPGs } = useMemo(() => {
    let pending = 0, approved = 0, rejected = 0, removed = 0;
    for (const p of pgs) {
      if (p.status === "approved") approved++;
      else if (p.status === "pending") pending++;
      else if (p.status === "rejected") rejected++;
      else if (p.status === "removed") removed++;
    }
    return {
      totalPGs: pgs.length,
      pendingPGs: pending,
      approvedPGs: approved,
      rejectedPGs: rejected,
      removedPGs: removed,
    };
  }, [pgs]);

  const handleStatusUpdate = async (id, status, endpoint, successMsg) => {
    try {
      await api.put(endpoint, {}, { headers: { Authorization: `Bearer ${token}` } });
      setPgs((prev) => prev.map((item) => (item.id === id ? { ...item, status, admin_note: status === 'approved' ? null : item.admin_note } : item)));
      if (successMsg) alert(successMsg);
    } catch (err) {
      console.error(err);
      alert(`Failed to update PG to ${status}`);
    }
  };

  const handleModalSubmit = async () => {
    const isRev = modal.type === "revision";
    if (isRev && !modal.note.trim()) {
      alert("Please enter what needs to be changed so the owner can fix it.");
      return;
    }
    try {
      setSubmittingAction(true);
      const url = isRev ? `/superadmin/revision-pg/${modal.pg.id}` : `/superadmin/remove-pg/${modal.pg.id}`;
      const status = isRev ? "rejected" : "removed";
      await api.put(url, { admin_note: modal.note.trim() });
      setPgs((prev) =>
        prev.map((item) =>
          item.id === modal.pg.id ? { ...item, status, admin_note: modal.note.trim() } : item
        )
      );
      setModal({ type: null, pg: null, note: "" });
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || `Failed to ${isRev ? "send revision request" : "remove PG listing"}`);
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
          Super Admin Panel
        </p>
        <h1 className="mt-2 text-4xl font-black text-white">
          Manage PG Listings
        </h1>
        <p className="mt-2 text-gray-400">
          Approve, request revisions with notes, remove, and monitor all PG listings.
        </p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-5">
        <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-slate-900/70 p-4 sm:p-6">
          <Building2 className="mb-2 sm:mb-3 text-cyan-400" size={22} />
          <h3 className="text-2xl sm:text-3xl font-black text-white">{totalPGs}</h3>
          <p className="text-xs sm:text-sm text-gray-400">Total PGs</p>
        </div>

        <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-slate-900/70 p-4 sm:p-6">
          <Clock className="mb-2 sm:mb-3 text-yellow-400" size={22} />
          <h3 className="text-2xl sm:text-3xl font-black text-white">{pendingPGs}</h3>
          <p className="text-xs sm:text-sm text-gray-400">Pending</p>
        </div>

        <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-slate-900/70 p-4 sm:p-6">
          <CheckCircle className="mb-2 sm:mb-3 text-green-400" size={22} />
          <h3 className="text-2xl sm:text-3xl font-black text-white">{approvedPGs}</h3>
          <p className="text-xs sm:text-sm text-gray-400">Approved Live</p>
        </div>

        <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-slate-900/70 p-4 sm:p-6">
          <RotateCcw className="mb-2 sm:mb-3 text-amber-400" size={22} />
          <h3 className="text-2xl sm:text-3xl font-black text-white">{rejectedPGs}</h3>
          <p className="text-xs sm:text-sm text-gray-400">Needs Revision</p>
        </div>

        <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-slate-900/70 p-4 sm:p-6 col-span-2 md:col-span-1">
          <Ban className="mb-2 sm:mb-3 text-rose-400" size={22} />
          <h3 className="text-2xl sm:text-3xl font-black text-white">{removedPGs}</h3>
          <p className="text-xs sm:text-sm text-gray-400">Removed / Delisted</p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search PGs or Owners..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/20 py-3 pl-12 pr-4 text-white outline-none"
          />
        </div>

        {loading && (
          <div className="mb-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-cyan-300">
            Loading PG listings...
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {filteredPGs.map((pg) => (
            <div
              key={pg.id}
              className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-950/60 p-5 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-bold text-white truncate">{pg.title || pg.name}</h3>
                  <span className="text-xs font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded-md">
                    #{pg.id}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-1">Owner: <span className="text-white font-medium">{pg.owner_name || pg.owner || "Unknown Owner"}</span></p>
                <p className="text-xs text-gray-500">{pg.city || pg.address || "Location Not Available"}</p>

                {/* Show Revision / Removal Note if present */}
                {pg.admin_note && (
                  <div className={`mt-2 p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                    pg.status === 'removed'
                      ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                      : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                  }`}>
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold uppercase text-[10px] tracking-wider block">
                        {pg.status === 'removed' ? 'Removal Note' : 'Revision Feedback to Owner'}
                      </span>
                      <p className="mt-0.5 leading-relaxed">{pg.admin_note}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 flex-wrap shrink-0">
                <div className="mr-2 text-right">
                  <p className="text-xs text-gray-400">Rooms</p>
                  <p className="font-bold text-white">{pg.available_rooms || 0}</p>
                </div>

                {/* ── Conditional Action Buttons based on status ── */}
                {pg.status === "approved" ? (
                  /* Approved PG: View, Approved Badge/Icon, and Remove button */
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => navigate(`/superadmin/pg-details?id=${pg.id}`)}
                      className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-cyan-600 cursor-pointer"
                    >
                      <Eye size={14} />
                      <span>View</span>
                    </button>

                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30 px-3.5 py-2 text-xs font-bold">
                      <CheckCircle size={14} />
                      <span>Approved</span>
                    </span>

                    <button
                      onClick={() =>
                        setModal({
                          type: "remove",
                          pg,
                          note: "Removed by administrator from live Explore listings.",
                        })
                      }
                      className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 px-3.5 py-2 text-xs font-bold text-white transition shadow-sm cursor-pointer"
                      title="Remove PG from Explore page and public views"
                    >
                      <Ban size={14} />
                      <span>Remove</span>
                    </button>
                  </div>
                ) : pg.status === "removed" ? (
                  /* Removed PG: View, Removed Badge, and Restore button */
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => navigate(`/superadmin/pg-details?id=${pg.id}`)}
                      className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-cyan-600 cursor-pointer"
                    >
                      <Eye size={14} />
                      <span>View</span>
                    </button>

                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3.5 py-2 text-xs font-bold">
                      <XCircle size={14} />
                      <span>Removed</span>
                    </span>

                    <button
                      onClick={() =>
                        handleStatusUpdate(
                          pg.id,
                          "approved",
                          `/superadmin/approve-pg/${pg.id}`,
                          `PG #${pg.id} restored and re-approved live on Explore!`
                        )
                      }
                      className="flex items-center gap-1.5 rounded-xl bg-green-600 hover:bg-green-500 px-3.5 py-2 text-xs font-bold text-white transition cursor-pointer"
                      title="Re-approve and publish live again"
                    >
                      <CheckCircle size={14} />
                      <span>Restore Live</span>
                    </button>
                  </div>
                ) : (
                  /* Pending or Needs Revision: View, Approve, Revision (with note), Reject */
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                        pg.status === "pending"
                          ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {pg.status === "rejected" ? "Needs Revision" : pg.status}
                    </span>

                    <button
                      onClick={() => navigate(`/superadmin/pg-details?id=${pg.id}`)}
                      className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-cyan-600 cursor-pointer"
                    >
                      <Eye size={14} />
                      <span>View</span>
                    </button>

                    <button
                      onClick={() =>
                        handleStatusUpdate(
                          pg.id,
                          "approved",
                          `/superadmin/approve-pg/${pg.id}`,
                          `PG #${pg.id} approved successfully!`
                        )
                      }
                      className="rounded-xl bg-green-600 hover:bg-green-500 px-3.5 py-2 text-xs font-bold text-white transition cursor-pointer"
                    >
                      Approve
                    </button>

                    <button
                      onClick={() =>
                        setModal({
                          type: "revision",
                          pg,
                          note: pg.admin_note || "",
                        })
                      }
                      className="flex items-center gap-1 rounded-xl bg-amber-500 hover:bg-amber-600 px-3.5 py-2 text-xs font-bold text-white transition cursor-pointer"
                      title="Send back to owner with specific change instructions"
                    >
                      <RotateCcw size={13} />
                      <span>Revision</span>
                    </button>

                    <button
                      onClick={() =>
                        handleStatusUpdate(
                          pg.id,
                          "rejected",
                          `/superadmin/reject-pg/${pg.id}`,
                          `PG #${pg.id} marked as rejected.`
                        )
                      }
                      className="rounded-xl bg-red-600 hover:bg-red-500 px-3.5 py-2 text-xs font-bold text-white transition cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {!loading && filteredPGs.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-8 text-center text-gray-400">
              No PG listings found.
            </div>
          )}
        </div>
      </div>

      {/* ── Unified Action Modal (Revision or Remove) ── */}
      {modal.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span
                  className={`text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-full ${
                    modal.type === "revision"
                      ? "text-amber-400 bg-amber-500/15"
                      : "text-rose-400 bg-rose-500/15"
                  }`}
                >
                  {modal.type === "revision" ? "Action Required" : "Delist Property"}
                </span>
                <h3 className="text-xl font-black text-white mt-1.5">
                  {modal.type === "revision"
                    ? `Request Revision for ${modal.pg?.title || modal.pg?.name}`
                    : `Remove ${modal.pg?.title || modal.pg?.name}`}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {modal.type === "revision"
                    ? "Write what needs to be changed. The owner will see this note directly on their dashboard and can update & re-submit."
                    : "This will remove the property from Explore and all student-facing pages. It will be moved to the owner's \"Removed\" section."}
                </p>
              </div>
              <button
                onClick={() => setModal({ type: null, pg: null, note: "" })}
                className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                {modal.type === "revision"
                  ? "Feedback / What Needs To Be Changed:"
                  : "Removal Reason / Note for Owner (Optional):"}
              </label>
              <textarea
                rows={modal.type === "revision" ? 4 : 3}
                value={modal.note}
                onChange={(e) => setModal((prev) => ({ ...prev, note: e.target.value }))}
                placeholder={
                  modal.type === "revision"
                    ? "e.g. Please upload clear photos of the rooms, verify the exact street address, and clarify if food is included in rent."
                    : "e.g. Delisted due to safety complaints / owner request / duplicate listing."
                }
                className={`w-full rounded-2xl border border-white/15 bg-slate-950/80 p-3.5 text-sm text-white outline-none placeholder-gray-500 ${
                  modal.type === "revision"
                    ? "focus:border-amber-400"
                    : "focus:border-rose-400"
                }`}
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setModal({ type: null, pg: null, note: "" })}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingAction}
                onClick={handleModalSubmit}
                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition cursor-pointer disabled:opacity-50 ${
                  modal.type === "revision"
                    ? "bg-amber-500 hover:bg-amber-600"
                    : "bg-rose-600 hover:bg-rose-500"
                }`}
              >
                {modal.type === "revision" ? <RotateCcw size={14} /> : <Ban size={14} />}
                <span>
                  {submittingAction
                    ? modal.type === "revision"
                      ? "Sending..."
                      : "Removing..."
                    : modal.type === "revision"
                    ? "Send Revision Note"
                    : "Confirm Removal"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePGs;