import { useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  MapPin,
  IndianRupee,
  BedDouble,
  User,
  CheckCircle,
  XCircle,
  RotateCcw,
  Trash2,
  Ban,
  X,
  AlertTriangle,
} from "lucide-react";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";

const PGDetails = () => {
  const [searchParams] = useSearchParams();
  const pgId = searchParams.get("id");

  const [pg, setPg] = useState(null);
  const [loading, setLoading] = useState(Boolean(pgId));
  const [error, setError] = useState("");

  const [modal, setModal] = useState({ type: null, note: "" });
  const [submittingAction, setSubmittingAction] = useState(false);

  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleAdminAction = async (endpoint, successMsg) => {
    try {
      await api.put(endpoint, {}, { headers: { Authorization: `Bearer ${token}` } });
      if (successMsg) alert(successMsg);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Action failed. Please try again.");
    }
  };

  const handleModalSubmit = async () => {
    const isRev = modal.type === "revision";
    if (isRev && !modal.note.trim()) {
      alert("Please enter what needs to be changed.");
      return;
    }
    try {
      setSubmittingAction(true);
      const url = isRev
        ? `/superadmin/revision-pg/${pg.id || pg.pg_id}`
        : `/superadmin/remove-pg/${pg.id || pg.pg_id}`;
      await api.put(url, { admin_note: modal.note.trim() });
      alert(isRev ? "Revision requested! Owner has been notified with your note." : "PG removed from explore and public listings.");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || `Failed to ${isRev ? "send revision request" : "remove PG listing"}`);
    } finally {
      setSubmittingAction(false);
    }
  };

  const amenitiesList = Array.isArray(pg?.amenities)
    ? pg.amenities
    : typeof pg?.amenities === "string"
    ? (() => {
        try {
          const parsed = JSON.parse(pg.amenities);
          return Array.isArray(parsed)
            ? parsed
            : pg.amenities.split(",").map((item) => item.trim());
        } catch {
          return pg.amenities
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
        }
      })()
    : [];

  useEffect(() => {
    const fetchPGDetails = async () => {
      try {
        setLoading(true);

        const response = await api.get(`/superadmin/pg/${pgId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setPg(response.data.pg || response.data);
      } catch (err) {
        console.error("PG Details Error:", err);
        setError("Failed to load PG details");
      } finally {
        setLoading(false);
      }
    };

    if (pgId && token) {
      fetchPGDetails();
    }
  }, [pgId, token]);

  if (!pgId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-8 py-6 text-red-300">
          PG ID is missing in URL
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-8 py-6 text-cyan-300">
          Loading PG details...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-8 py-6 text-red-300">
          {error}
        </div>
      </div>
    );
  }

  if (!pg) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-gray-400">
        PG not found.
      </div>
    );
  }



  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
          Super Admin Panel
        </p>

        <h1 className="mt-2 text-4xl font-black text-white">
          PG Details
        </h1>

        <p className="mt-2 text-gray-400">
          Review PG information before approval.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 backdrop-blur-xl">
        <div className="h-72 bg-gradient-to-r from-cyan-600 via-blue-600 to-violet-600" />

        <div className="p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl font-black text-white">
                {pg.title || pg.name}
              </h2>

              <div className="mt-4 flex flex-wrap gap-4 text-gray-300">
                <div className="flex items-center gap-2">
                  <MapPin size={18} />
                  {pg.city || "N/A"}
                </div>

                <div className="flex items-center gap-2">
                  <IndianRupee size={18} />
                  ₹{pg.price || 0}/month
                </div>

                <div className="flex items-center gap-2">
                  <BedDouble size={18} />
                  {pg.available_rooms || pg.rooms || 0} Rooms
                </div>
              </div>
            </div>

            <span
              className={`rounded-full px-5 py-3 font-semibold ${
                pg.status === "approved"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : pg.status === "rejected"
                  ? "bg-red-500/20 text-red-400"
                  : "bg-yellow-500/20 text-yellow-400"
              }`}
            >
              {pg.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
          <h3 className="mb-4 text-2xl font-black text-white">
            Description
          </h3>

          <p className="leading-8 text-gray-300">
            {pg.description || "No description available"}
          </p>

          <h3 className="mt-8 mb-4 text-2xl font-black text-white">
            Amenities
          </h3>

          <div className="flex flex-wrap gap-3">
            {amenitiesList.map((item, index) => (
              <span
                key={index}
                className="rounded-full bg-cyan-500/15 px-4 py-2 text-sm font-semibold text-cyan-300"
              >
                {item}
              </span>
            ))}

            {amenitiesList.length === 0 && (
              <span className="rounded-full bg-gray-500/20 px-4 py-2 text-sm text-gray-300">
                No amenities available
              </span>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
            <h3 className="mb-4 text-2xl font-black text-white">
              Owner Information
            </h3>

            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-500 text-xl font-black text-white">
                {String(pg.owner_name || pg.owner || "O").charAt(0)}
              </div>

              <div>
                <h4 className="font-bold text-white">
                  {pg.owner_name || pg.owner || "Owner"}
                </h4>

                <p className="text-gray-400">PG Owner</p>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 text-gray-300">
              <User size={18} />
              Owner Verified
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
            <h3 className="mb-5 text-2xl font-black text-white">
              Admin Actions
            </h3>

            {/* If there is an existing admin note, show it */}
            {pg.admin_note && (
              <div className={`mb-4 p-3 rounded-2xl border text-xs ${
                pg.status === 'removed'
                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
              }`}>
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
                  <AlertTriangle size={13} />
                  <span>{pg.status === 'removed' ? 'Removal Reason' : 'Active Revision Feedback'}</span>
                </div>
                <p className="mt-1 leading-relaxed">{pg.admin_note}</p>
              </div>
            )}

            <div className="space-y-3">
              {pg.status === "approved" ? (
                <>
                  <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 px-5 py-3.5 font-bold text-emerald-400">
                    <CheckCircle size={18} />
                    <span>Approved & Live</span>
                  </div>

                  <button
                    onClick={() => setModal({ type: "remove", note: "Removed by administrator from live Explore listings." })}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-rose-600 hover:bg-rose-500 px-5 py-3.5 font-bold text-white transition shadow-sm cursor-pointer"
                    title="Remove from explore and public pages"
                  >
                    <Ban size={18} />
                    Remove from Explore
                  </button>
                </>
              ) : pg.status === "removed" ? (
                <>
                  <div className="flex items-center justify-center gap-2 rounded-2xl bg-rose-500/20 border border-rose-500/30 px-5 py-3.5 font-bold text-rose-400">
                    <XCircle size={18} />
                    <span>Currently Removed / Delisted</span>
                  </div>

                  <button
                    onClick={() => handleAdminAction(`/superadmin/pg/${pg.id || pg.pg_id}/approve`, "PG restored and approved successfully!")}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-5 py-3.5 font-bold text-white transition shadow-sm cursor-pointer"
                  >
                    <CheckCircle size={18} />
                    Restore & Approve PG
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleAdminAction(`/superadmin/pg/${pg.id || pg.pg_id}/approve`, "PG approved successfully!")}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-5 py-3.5 font-bold text-white transition shadow-sm cursor-pointer"
                  >
                    <CheckCircle size={18} />
                    Approve PG
                  </button>

                  <button
                    onClick={() => setModal({ type: "revision", note: pg.admin_note || "" })}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-amber-600 hover:bg-amber-500 px-5 py-3.5 font-bold text-white transition shadow-sm cursor-pointer"
                    title="Send back to owner with revision notes"
                  >
                    <RotateCcw size={18} />
                    Request Revision
                  </button>

                  <button
                    onClick={() => handleAdminAction(`/superadmin/pg/${pg.id || pg.pg_id}/reject`, "PG rejected successfully!")}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-rose-600 hover:bg-rose-500 px-5 py-3.5 font-bold text-white transition shadow-sm cursor-pointer"
                  >
                    <XCircle size={18} />
                    Reject PG
                  </button>
                </>
              )}

              <button
                onClick={async () => {
                  if (!window.confirm("Permanently delete this PG listing?")) return;

                  try {
                    await api.delete(`/superadmin/pg/${pg.id || pg.pg_id}`, {
                      headers: { Authorization: `Bearer ${token}` },
                    });

                    navigate('/superadmin/manage-pgs');
                  } catch (err) {
                    console.error(err);
                    alert("Failed to delete PG.");
                  }
                }}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3.5 font-bold text-red-300 hover:bg-red-500/20 transition cursor-pointer"
              >
                <Trash2 size={18} />
                Delete PG
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
            <h3 className="mb-4 text-xl font-black text-white">
              Address
            </h3>

            <p className="text-gray-300">
              {pg.address || "Address not available"}
            </p>
          </div>
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
                    ? `Request Revision for ${pg.title || pg.name}`
                    : `Remove ${pg.title || pg.name}`}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {modal.type === "revision"
                    ? "Write what needs to be changed. The owner will see this note directly on their dashboard and can update & re-submit."
                    : "This will remove the property from Explore and all student-facing pages. It will be moved to the owner's \"Removed\" section."}
                </p>
              </div>
              <button
                onClick={() => setModal({ type: null, note: "" })}
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
                onClick={() => setModal({ type: null, note: "" })}
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

export default PGDetails;
