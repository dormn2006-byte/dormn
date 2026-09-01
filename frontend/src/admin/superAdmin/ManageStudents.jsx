import { useContext, useEffect, useMemo, useState } from "react";
import {
  Search,
  Users,
  UserCheck,
  Clock,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";

const ManageStudents = () => {
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);

        const { data } = await api.get("/superadmin/students", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setStudents(data.students || data || []);
      } catch (err) {
        console.error("Students Fetch Error:", err);
        setError("Failed to load students");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchStudents();
    }
  }, [token]);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const name = (student.full_name || student.name || "").toLowerCase();
      const email = (student.email || "").toLowerCase();

      return (
        name.includes(search.toLowerCase()) ||
        email.includes(search.toLowerCase())
      );
    });
  }, [students, search]);

  const totalStudents = students.length;
  const activeStudents = students.filter(
    (s) => s.status === "active" || s.status === "approved"
  ).length;

  const pendingStudents = students.filter(
    (s) => s.status === "pending"
  ).length;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
          Super Admin Panel
        </p>
        <h1 className="mt-2 text-4xl font-black text-white">
          Manage Students
        </h1>
        <p className="mt-2 text-gray-400">
          Monitor student registrations and occupancy.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
          <Users className="mb-3 text-cyan-400" />
          <h3 className="text-3xl font-black text-white">
            {totalStudents}
          </h3>
          <p className="text-gray-400">Total Students</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
          <UserCheck className="mb-3 text-green-400" />
          <h3 className="text-3xl font-black text-white">
            {activeStudents}
          </h3>
          <p className="text-gray-400">Active Students</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
          <Clock className="mb-3 text-yellow-400" />
          <h3 className="text-3xl font-black text-white">
            {pendingStudents}
          </h3>
          <p className="text-gray-400">Pending Bookings</p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/20 py-3 pl-12 pr-4 text-white outline-none"
          />
        </div>

        {loading && (
          <div className="mb-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-cyan-300">
            Loading students...
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-950/60 p-5 lg:flex-row lg:items-center lg:justify-between"
            >
              <div>
                <h3 className="text-xl font-bold text-white">
                  {student.full_name || student.name}
                </h3>
                <p className="text-gray-400">{student.email}</p>
                <p className="text-gray-500">{student.phone || student.mobile || "N/A"}</p>
                <p className="mt-1 text-sm text-cyan-400">
                  {student.pg_name || student.pg || "No PG Assigned"}
                </p>
              </div>

              <div className="flex items-center gap-6">
                <span
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    student.status === "active" || student.status === "approved"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {student.status}
                </span>

                <button
                  onClick={() => navigate(`/superadmin/student-details?id=${student.id}`)}
                  className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 font-semibold text-white transition hover:bg-cyan-600"
                >
                  <Eye size={16} />
                  View
                </button>
              </div>
            </div>
          ))}

          {!loading && filteredStudents.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-8 text-center text-gray-400">
              No students found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageStudents;