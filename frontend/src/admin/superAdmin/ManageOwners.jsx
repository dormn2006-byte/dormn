import { useContext, useEffect, useMemo, useState } from "react";
import { Search, Users, CheckCircle, Clock, Eye } from "lucide-react";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const ManageOwners = () => {
  const [search, setSearch] = useState("");
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOwners = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/superadmin/owners", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setOwners(data.owners || data || []);
      } catch (err) {
        console.error("Owners Fetch Error:", err);
        setError("Failed to load owners");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchOwners();
    }
  }, [token]);

  const filteredOwners = useMemo(() => {
    return owners.filter((owner) => {
      const name = owner.full_name || owner.name || "";
      const email = owner.email || "";

      return (
        name.toLowerCase().includes(search.toLowerCase()) ||
        email.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [owners, search]);

  const totalOwners = owners.length;
  const activeOwners = owners.filter(
    (o) => o.status === "active" || o.status === "approved"
  ).length;

  const pendingOwners = owners.filter(
    (o) => o.status === "pending"
  ).length;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
          Super Admin Panel
        </p>
        <h1 className="mt-2 text-4xl font-black text-white">
          Manage Owners
        </h1>
        <p className="mt-2 text-gray-400">
          Monitor, verify and manage all PG owners.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
          <Users className="mb-3 text-cyan-400" />
          <h3 className="text-3xl font-black text-white">
            {totalOwners}
          </h3>
          <p className="text-gray-400">Total Owners</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
          <CheckCircle className="mb-3 text-green-400" />
          <h3 className="text-3xl font-black text-white">
            {activeOwners}
          </h3>
          <p className="text-gray-400">Verified Owners</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
          <Clock className="mb-3 text-yellow-400" />
          <h3 className="text-3xl font-black text-white">
            {pendingOwners}
          </h3>
          <p className="text-gray-400">Pending Approvals</p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search owners..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/20 py-3 pl-12 pr-4 text-white outline-none"
          />
        </div>

        {loading && (
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-cyan-300">
            Loading owners...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {filteredOwners.map((owner) => (
            <div
              key={owner.id}
              className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-950/60 p-5 lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <h3 className="text-xl font-bold text-white">{owner.full_name || owner.name}</h3>
                <p className="text-gray-400">{owner.email}</p>
                <p className="text-gray-500">{owner.phone || owner.mobile || "N/A"}</p>
              </div>

              <div className="flex items-center gap-6">
                <div>
                  <p className="text-sm text-gray-400">PGs</p>
                  <p className="font-bold text-white">{owner.totalPGs || owner.pg_count || 0}</p>
                </div>

                <span
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    owner.status === "active" || owner.status === "approved"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {owner.status}
                </span>

                <button
                  onClick={() =>
                    navigate(`/superadmin/owner-details?id=${owner.id}`)
                  }
                  className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 font-semibold text-white transition hover:bg-cyan-600"
                >
                  <Eye size={16} />
                  View
                </button>
              </div>
            </div>
          ))}

          {!loading && filteredOwners.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-8 text-center text-gray-400">
              No owners found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageOwners;