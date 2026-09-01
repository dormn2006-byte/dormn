import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Calendar,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";

const ManageClubBookings = () => {
  const [searchParams] = useSearchParams();
  const initialClubId = searchParams.get("clubId") || "";

  const [clubs, setClubs] = useState([]);
  const [selectedClubId, setSelectedClubId] = useState(initialClubId);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  // Fetch all clubs for the dropdown
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const { data } = await api.get("/clubs/admin/all", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClubs(data.clubs || data || []);
      } catch (err) {
        console.error(err);
      }
    };
    if (token) fetchClubs();
  }, [token]);

  // Fetch bookings when club is selected
  useEffect(() => {
    const fetchBookings = async () => {
      if (!selectedClubId) {
        setBookings([]);
        return;
      }
      try {
        setLoading(true);
        setError("");
        const { data } = await api.get(
          `/clubs/admin/bookings?clubId=${selectedClubId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setBookings(data.bookings || data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load bookings");
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };
    if (token && selectedClubId) fetchBookings();
  }, [token, selectedClubId]);

  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter(
    (b) => b.status === "confirmed"
  ).length;
  const pendingBookings = bookings.filter(
    (b) => b.status === "pending_invite"
  ).length;
  const cancelledBookings = bookings.filter(
    (b) => b.status === "cancelled"
  ).length;
  const totalRevenue = bookings
    .filter((b) => b.payment_status === "paid")
    .reduce((sum, b) => sum + (b.amount || 0), 0);

  const statusBadge = (status) => {
    const map = {
      confirmed: "bg-green-500/20 text-green-400",
      pending_invite: "bg-yellow-500/20 text-yellow-400",
      cancelled: "bg-red-500/20 text-red-400",
    };
    return map[status] || "bg-gray-500/20 text-gray-400";
  };

  const paymentBadge = (status) => {
    return status === "paid"
      ? "bg-green-500/20 text-green-400"
      : "bg-red-500/20 text-red-400";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
        <button
          onClick={() => navigate("/superadmin/manage-clubs")}
          className="mb-4 flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Manage Clubs
        </button>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">
          Super Admin Panel
        </p>
        <h1 className="mt-2 text-4xl font-black text-white">
          Club Bookings
        </h1>
        <p className="mt-2 text-gray-400">
          View all bookings for a selected club.
        </p>
      </div>

      {/* Club selector */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
        <label className="mb-2 block text-sm font-semibold text-gray-400">
          Select Club
        </label>
        <select
          value={selectedClubId}
          onChange={(e) => setSelectedClubId(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none"
        >
          <option value="">-- Choose a club --</option>
          {clubs.map((club) => (
            <option key={club._id || club.id} value={club._id || club.id}>
              {club.name} ({club.city || "N/A"})
            </option>
          ))}
        </select>
      </div>

      {/* Stats */}
      {selectedClubId && (
        <div className="grid gap-4 md:grid-cols-5">
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
            <Calendar className="mb-3 text-amber-400" />
            <h3 className="text-3xl font-black text-white">{totalBookings}</h3>
            <p className="text-gray-400">Total Bookings</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
            <CheckCircle className="mb-3 text-green-400" />
            <h3 className="text-3xl font-black text-white">
              {confirmedBookings}
            </h3>
            <p className="text-gray-400">Confirmed</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
            <Clock className="mb-3 text-yellow-400" />
            <h3 className="text-3xl font-black text-white">
              {pendingBookings}
            </h3>
            <p className="text-gray-400">Pending</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
            <XCircle className="mb-3 text-red-400" />
            <h3 className="text-3xl font-black text-white">
              {cancelledBookings}
            </h3>
            <p className="text-gray-400">Cancelled</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
            <Users className="mb-3 text-emerald-400" />
            <h3 className="text-3xl font-black text-white">₹{totalRevenue}</h3>
            <p className="text-gray-400">Revenue (Paid)</p>
          </div>
        </div>
      )}

      {/* Bookings list */}
      {selectedClubId && (
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
          {loading && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-300">
              Loading bookings...
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {bookings.map((booking) => {
              const bookingId = booking._id || booking.id;
              return (
                <div
                  key={bookingId}
                  className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-5 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-bold text-white">
                        {booking.booker_name || booking.booker_email || "Unknown"}
                      </h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(
                          booking.status
                        )}`}
                      >
                        {booking.status?.replace("_", " ")}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${paymentBadge(
                          booking.payment_status
                        )}`}
                      >
                        {booking.payment_status}
                      </span>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-gray-300">
                        {booking.booking_type}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-400">
                      {booking.partner_name && (
                        <span>Partner: {booking.partner_name}</span>
                      )}
                      <span>Amount: ₹{booking.amount || 0}</span>
                      {booking.invite_token && (
                        <span className="font-mono text-xs">
                          Token: {booking.invite_token.substring(0, 8)}...
                        </span>
                      )}
                      <span>
                        Created:{" "}
                        {new Date(
                          booking.created_at || booking.createdAt
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {!loading && bookings.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-8 text-center text-gray-400">
                No bookings found for this club.
              </div>
            )}
          </div>
        </div>
      )}

      {/* No club selected */}
      {!selectedClubId && !loading && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-8 text-center text-gray-400">
          Select a club above to view its bookings.
        </div>
      )}
    </div>
  );
};

export default ManageClubBookings;
