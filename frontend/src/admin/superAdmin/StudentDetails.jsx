import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../services/api";
import {
  Mail,
  Phone,
  MapPin,
  UserCheck,
  Building2,
  BookOpenCheck,
  Calendar,
} from "lucide-react";

const StudentDetails = () => {
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("id");
  const [student, setStudent] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(Boolean(studentId));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!studentId) return;

    api.get(`/superadmin/student/${studentId}`)
      .then((response) => {
        setStudent(response.data.student || response.data.data || response.data);
        setBookings(response.data.bookings || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to fetch student details."
        );
        setLoading(false);
      });
  }, [studentId]);

  if (!studentId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-red-400 text-xl font-bold">
        No student ID provided.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-cyan-400 text-xl font-bold">
        Loading student details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-red-400 text-xl font-bold">
        {error}
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-yellow-400 text-xl font-bold">
        Student not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 p-6 text-white">
      <div className="rounded-3xl border border-cyan-500/20 bg-slate-900/70 p-8 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
          Super Admin Panel
        </p>
        <h1 className="mt-2 bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-4xl font-black text-transparent">
          Student Details
        </h1>
        <p className="mt-2 text-gray-400">
          View student profile, booking history and accommodation details.
        </p>
      </div>

      <div className="rounded-3xl border border-violet-500/20 bg-slate-900/70 p-8 shadow-2xl shadow-violet-500/10 backdrop-blur-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-r from-cyan-500 to-violet-500 text-3xl font-black text-white">
            {(student.full_name || student.name || "S").charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-black text-white">
              {student.full_name || student.name || "N/A"}
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="flex items-center gap-3 text-gray-300">
                <Mail size={18} />
                {student.email || "N/A"}
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Phone size={18} />
                {student.phone || "N/A"}
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <MapPin size={18} />
                {student.city || "N/A"}
              </div>
              <div className="flex items-center gap-3 text-green-400">
                <UserCheck size={18} />
                {student.status || "N/A"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-lg backdrop-blur-xl hover:border-cyan-500/30 transition-all">
          <Building2 className="mb-3 text-cyan-400" />
          <h3 className="text-2xl font-black text-white">
            {student.currentPG || "N/A"}
          </h3>
          <p className="text-gray-400">Current PG</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-lg backdrop-blur-xl hover:border-cyan-500/30 transition-all">
          <BookOpenCheck className="mb-3 text-emerald-400" />
          <h3 className="text-2xl font-black text-white">
            {bookings.length}
          </h3>
          <p className="text-gray-400">Total Bookings</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-lg backdrop-blur-xl hover:border-cyan-500/30 transition-all">
          <Calendar className="mb-3 text-violet-400" />
          <h3 className="text-2xl font-black text-white">
            {student.joinDate || "N/A"}
          </h3>
          <p className="text-gray-400">Joined On</p>
        </div>
      </div>

      <div className="rounded-3xl border border-cyan-500/20 bg-slate-900/70 p-8 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
        <h2 className="mb-6 bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-2xl font-black text-transparent">
          Booking History
        </h2>
        <div className="space-y-4">
          {bookings.length === 0 && (
            <div className="rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-6 text-center text-gray-300">
              No bookings found.
            </div>
          )}
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-950/60 p-5 lg:flex-row lg:items-center lg:justify-between hover:border-cyan-500/30 transition-all"
            >
              <div>
                <h3 className="text-xl font-bold text-white">
                  {booking.pg || booking.pg_name || "N/A"}
                </h3>
                <p className="text-gray-400">
                  {booking.room || booking.room_name || "N/A"}
                </p>
              </div>
              <span
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  booking.status === "Active"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-cyan-500/20 text-cyan-400"
                }`}
              >
                {booking.status || "N/A"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentDetails;
