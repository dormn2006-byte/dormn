import { useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  MapPin,
  IndianRupee,
  BedDouble,
  User,
  CheckCircle,
  XCircle,
  Trash2,
} from "lucide-react";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";

const PGDetails = () => {
  const [searchParams] = useSearchParams();
  const pgId = searchParams.get("id");

  const [pg, setPg] = useState(null);
  const [loading, setLoading] = useState(Boolean(pgId));
  const [error, setError] = useState("");

  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

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

            <div className="space-y-3">
              <button
                onClick={async () => {
                  try {
                    await api.put(`/superadmin/pg/${pg.id || pg.pg_id}/approve`, {}, {
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    window.location.reload();
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-5 py-4 font-bold text-white"
              >
                <CheckCircle size={18} />
                Approve PG
              </button>

              <button
                onClick={async () => {
                  try {
                    await api.put(`/superadmin/pg/${pg.id || pg.pg_id}/reject`, {}, {
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    window.location.reload();
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-rose-600 px-5 py-4 font-bold text-white"
              >
                <XCircle size={18} />
                Reject PG
              </button>

              <button
                onClick={async () => {
                  if (!window.confirm("Delete this PG?")) return;

                  try {
                    await api.delete(`/superadmin/pg/${pg.id || pg.pg_id}`, {
                      headers: { Authorization: `Bearer ${token}` },
                    });

                    navigate('/superadmin/manage-pgs');
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 font-bold text-red-300"
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
    </div>
  );
};

export default PGDetails;
