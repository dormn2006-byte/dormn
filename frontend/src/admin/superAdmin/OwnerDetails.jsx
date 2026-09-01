import { useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Mail,
  Phone,
  Building2,
  MapPin,
  CheckCircle,
  Eye,
} from "lucide-react";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";

const OwnerDetails = () => {
  const [searchParams] = useSearchParams();
  const ownerId = searchParams.get("id");
  console.log("Owner Details ID:", ownerId);

  const [owner, setOwner] = useState(null);
  const [ownerPGs, setOwnerPGs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOwnerData = async () => {
      try {
        setLoading(true);

        const ownersResponse = await api.get("/superadmin/owners", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const owners = ownersResponse.data.owners || ownersResponse.data || [];

        const selectedOwner = owners.find(
          (item) => String(item.id) === String(ownerId)
        );

        setOwner(selectedOwner || null);

        if (ownerId) {
          const pgsResponse = await api.get(
            `/superadmin/owner-pgs/${ownerId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          setOwnerPGs(pgsResponse.data.pgs || pgsResponse.data || []);
        }
      } catch (err) {
        console.error("Owner Details Error:", err);
        setError("Failed to load owner details");
      } finally {
        setLoading(false);
      }
    };

    if (!ownerId) {
      setError("Owner ID is missing in URL");
      setLoading(false);
      return;
    }

    if (token) {
      fetchOwnerData();
    }
  }, [ownerId, token]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-8 py-6 text-cyan-300">
          Loading owner details...
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

  if (!owner) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        Owner not found.
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
          Owner Details
        </h1>

        <p className="mt-2 text-gray-400">
          View owner profile and all associated PG listings.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-r from-cyan-500 to-violet-500 text-3xl font-black text-white">
            {(owner.full_name || owner.name || "O").charAt(0)}
          </div>

          <div className="flex-1">
            <h2 className="text-3xl font-black text-white">
              {owner.full_name || owner.name}
            </h2>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="flex items-center gap-3 text-gray-300">
                <Mail size={18} />
                {owner.email}
              </div>

              <div className="flex items-center gap-3 text-gray-300">
                <Phone size={18} />
                {owner.phone || owner.mobile || "N/A"}
              </div>

              <div className="flex items-center gap-3 text-gray-300">
                <MapPin size={18} />
                {owner.city || "Not Available"}
              </div>

              <div className="flex items-center gap-3 text-green-400">
                <CheckCircle size={18} />
                {owner.status || "Active"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
          <Building2 className="mb-3 text-cyan-400" />
          <h3 className="text-3xl font-black text-white">
            {ownerPGs.length}
          </h3>
          <p className="text-gray-400">Total PGs</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
          <CheckCircle className="mb-3 text-green-400" />
          <h3 className="text-3xl font-black text-white">
            {owner.status || "Active"}
          </h3>
          <p className="text-gray-400">Account Status</p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
        <h2 className="mb-6 text-2xl font-black text-white">
          Owner PG Listings
        </h2>

        <div className="space-y-4">
          {ownerPGs.map((pg) => (
            <div
              key={pg.id}
              className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-950/60 p-5 lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <h3 className="text-xl font-bold text-white">
                  {pg.title}
                </h3>

                <p className="text-gray-400">{pg.city}</p>

                <p className="text-sm text-cyan-400">
                  Rooms: {pg.available_rooms || 0}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <span className="rounded-full bg-green-500/20 px-4 py-2 text-sm font-semibold text-green-400">
                  {pg.status}
                </span>

                <button
                  onClick={() => navigate(`/superadmin/pg-details?id=${pg.id}`)}
                  className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 font-semibold text-white transition hover:bg-cyan-600"
                >
                  <Eye size={16} />
                  View PG
                </button>
              </div>
            </div>
          ))}

          {ownerPGs.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-8 text-center text-gray-400">
              No PG listings found for this owner.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerDetails;
