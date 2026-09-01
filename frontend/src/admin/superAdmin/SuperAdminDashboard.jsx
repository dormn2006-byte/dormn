import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Building2,
  CheckCircle,
  Clock3,
  Users,
  UserCheck,
  BookOpenCheck,
  IndianRupee,
  XCircle,
  Music,
} from "lucide-react";
import AdminCard from "../shared/AdminCard";
import { AuthContext } from "../../context/AuthContext";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const API_BASE_URL =
          import.meta.env.VITE_API_URL || "https://api.dormn.com/api";

        const response = await axios.get(
          `${API_BASE_URL}/superadmin/dashboard-stats`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setStats(response.data.stats);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to load dashboard statistics."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-slate-950">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-400 bg-slate-950">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-8 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white">
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl">
        <h1 className="text-4xl font-black text-white md:text-5xl">
          Super Admin Dashboard
        </h1>

        <p className="mt-3 max-w-3xl text-gray-300">
          Manage PG approvals, owners, students and platform activity.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <span className="rounded-full bg-cyan-500/20 px-4 py-2 text-sm text-cyan-300">
            Live Platform Monitoring
          </span>
          <span className="rounded-full bg-emerald-500/20 px-4 py-2 text-sm text-emerald-300">
            PG Approval System
          </span>
          <span className="rounded-full bg-violet-500/20 px-4 py-2 text-sm text-violet-300">
            Owner Management
          </span>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/superadmin/manage-owners")}
            className="rounded-xl bg-violet-500/20 px-4 py-3 text-sm font-semibold text-violet-300 transition hover:bg-violet-500/30"
          >
            Manage Owners
          </button>

          <button
            onClick={() => navigate("/superadmin/manage-pgs")}
            className="rounded-xl bg-cyan-500/20 px-4 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/30"
          >
            Manage PGs
          </button>

          <button
            onClick={() => navigate("/superadmin/manage-students")}
            className="rounded-xl bg-pink-500/20 px-4 py-3 text-sm font-semibold text-pink-300 transition hover:bg-pink-500/30"
          >
            Manage Students
          </button>

          <button
            onClick={() => navigate("/superadmin/owner-details")}
            className="rounded-xl bg-emerald-500/20 px-4 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/30"
          >
            Owner Details
          </button>

          <button
            onClick={() => navigate("/superadmin/pg-details")}
            className="rounded-xl bg-amber-500/20 px-4 py-3 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/30"
          >
            PG Details
          </button>

          <button
            onClick={() => navigate("/superadmin/student-details")}
            className="rounded-xl bg-rose-500/20 px-4 py-3 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/30"
          >
            Student Details
          </button>

          {/* NEW BUTTON FOR REVIEWS ADDED HERE */}
          <button
            onClick={() => navigate("/superadmin/manage-reviews")}
            className="rounded-xl bg-orange-500/20 px-4 py-3 text-sm font-semibold text-orange-300 transition hover:bg-orange-500/30"
          >
            Manage Reviews
          </button>

          <button
            onClick={() => navigate("/superadmin/manage-clubs")}
            className="rounded-xl bg-fuchsia-500/20 px-4 py-3 text-sm font-semibold text-fuchsia-300 transition hover:bg-fuchsia-500/30"
          >
            <Music size={16} className="mr-2 inline" />
            Manage Clubs
          </button>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <AdminCard
          title="Total PGs"
          value={stats.totalPGs}
          subtitle="Platform Listings"
          icon={<Building2 size={28} />}
          color="from-cyan-500 to-blue-500"
        />

        <AdminCard
          title="Pending PGs"
          value={stats.pendingPGs}
          subtitle="Awaiting Approval"
          icon={<Clock3 size={28} />}
          color="from-[#93B733] to-[#82a32d]"
        />

        <AdminCard
          title="Approved PGs"
          value={stats.approvedPGs}
          subtitle="Live Listings"
          icon={<CheckCircle size={28} />}
          color="from-emerald-500 to-green-500"
        />

        <AdminCard
          title="Rejected PGs"
          value={stats.rejectedPGs}
          subtitle="Rejected Listings"
          icon={<XCircle size={28} />}
          color="from-red-500 to-rose-500"
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <AdminCard
          title="Owners"
          value={stats.totalOwners}
          subtitle="Registered Owners"
          icon={<UserCheck size={28} />}
          color="from-violet-500 to-purple-500"
        />

        <AdminCard
          title="Students"
          value={stats.totalStudents}
          subtitle="Registered Students"
          icon={<Users size={28} />}
          color="from-pink-500 to-rose-500"
        />

        <AdminCard
          title="Bookings"
          value={stats.totalBookings}
          subtitle="Platform Bookings"
          icon={<BookOpenCheck size={28} />}
          color="from-indigo-500 to-blue-500"
        />

        <AdminCard
          title="Revenue"
          value="Live"
          subtitle="Platform Revenue"
          icon={<IndianRupee size={28} />}
          color="from-emerald-500 to-teal-500"
        />
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-xl">
        <h2 className="text-2xl font-black text-white mb-4">Platform Overview</h2>
        <div className="grid md:grid-cols-4 gap-4 text-white">
          <div>Total Users: {stats.totalUsers}</div>
          <div>Total Owners: {stats.totalOwners}</div>
          <div>Total Students: {stats.totalStudents}</div>
          <div>Total Bookings: {stats.totalBookings}</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;