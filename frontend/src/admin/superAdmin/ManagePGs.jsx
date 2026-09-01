import { useContext, useEffect, useMemo, useState } from "react";
import {
  Search,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";

const ManagePGs = () => {
  const [search, setSearch] = useState("");
  const [pgs, setPgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    return pgs.filter((pg) => {
      const title = (pg.title || pg.name || "").toLowerCase();
      const owner = (pg.owner_name || pg.owner || "").toLowerCase();

      return (
        title.includes(search.toLowerCase()) ||
        owner.includes(search.toLowerCase())
      );
    });
  }, [pgs, search]);

  const totalPGs = pgs.length;
  const pendingPGs = pgs.filter((pg) => pg.status === "pending").length;
  const approvedPGs = pgs.filter((pg) => pg.status === "approved").length;
  const rejectedPGs = pgs.filter((pg) => pg.status === "rejected").length;

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
          Approve, reject and monitor all PG listings.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
          <Building2 className="mb-3 text-cyan-400" />
          <h3 className="text-3xl font-black text-white">{totalPGs}</h3>
          <p className="text-gray-400">Total PGs</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
          <Clock className="mb-3 text-yellow-400" />
          <h3 className="text-3xl font-black text-white">{pendingPGs}</h3>
          <p className="text-gray-400">Pending</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
          <CheckCircle className="mb-3 text-green-400" />
          <h3 className="text-3xl font-black text-white">{approvedPGs}</h3>
          <p className="text-gray-400">Approved</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
          <XCircle className="mb-3 text-red-400" />
          <h3 className="text-3xl font-black text-white">{rejectedPGs}</h3>
          <p className="text-gray-400">Rejected</p>
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
              <div>
                <h3 className="text-xl font-bold text-white">{pg.title || pg.name}</h3>
                <p className="text-gray-400">Owner: {pg.owner_name || pg.owner || "Unknown Owner"}</p>
                <p className="text-gray-500">{pg.city || pg.address || "Location Not Available"}</p>
              </div>

              <div className="flex items-center gap-6">
                <div>
                  <p className="text-sm text-gray-400">Rooms</p>
                  <p className="font-bold text-white">{pg.available_rooms || 0}</p>
                </div>

                <span
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    pg.status === "approved"
                      ? "bg-green-500/20 text-green-400"
                      : pg.status === "pending"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {pg.status}
                </span>

                <button
                  onClick={() => navigate(`/superadmin/pg-details?id=${pg.id}`)}
                  className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 font-semibold text-white transition hover:bg-cyan-600"
                >
                  <Eye size={16} />
                  View
                </button>

                <button
                  onClick={async () => {
                    try {
                      await api.put(`/superadmin/approve-pg/${pg.id}`, {}, {
                        headers: { Authorization: `Bearer ${token}` }
                      });

                      setPgs(prev => prev.map(item =>
                        item.id === pg.id ? { ...item, status: "approved" } : item
                      ));
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="rounded-xl bg-green-500 px-4 py-2 font-semibold text-white"
                >
                  Approve
                </button>

                <button
                  onClick={async () => {
                    try {
                      await api.put(`/superadmin/reject-pg/${pg.id}`, {}, {
                        headers: { Authorization: `Bearer ${token}` }
                      });

                      setPgs(prev => prev.map(item =>
                        item.id === pg.id ? { ...item, status: "rejected" } : item
                      ));
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="rounded-xl bg-red-500 px-4 py-2 font-semibold text-white"
                >
                  Reject
                </button>
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
    </div>
  );
};

export default ManagePGs;