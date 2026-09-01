import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Heart, Music, Calendar, Clock, User, ArrowLeft, Ticket, PartyPopper
} from "lucide-react";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export default function PartnerInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [inviteData, setInviteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const res = await api.get(`/clubs/invite/${token}`);
        setInviteData(res.data?.booking);
      } catch (err) {
        setError(err?.response?.data?.message || "Invalid or expired invite link");
      } finally {
        setLoading(false);
      }
    };
    fetchInvite();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !gender) {
      return alert("All fields are required");
    }
    if (inviteData?.booker_gender && gender === inviteData.booker_gender) {
      return alert("Partner gender must be different from the booker (boy+girl rule)");
    }

    setSubmitting(true);
    try {
      const res = await api.post("/clubs/invite/accept", {
        token,
        name,
        email,
        password,
        gender,
      });

      if (res.data?.success) {
        setSuccess(res.data);
        // Auto-login
        login(res.data.user, res.data.token);
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to accept invite");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#0d0d0d] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#93B733] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#0d0d0d] flex flex-col items-center justify-center text-center px-4">
        <Heart className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-black text-[#0D3A1D] dark:text-white">{error}</h2>
        <Link to="/clubs" className="mt-4 text-sm font-bold text-[#93B733] hover:underline">
          ← Browse Clubs
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#0d0d0d] flex flex-col items-center justify-center text-center px-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-[#111] border border-gray-100 dark:border-white/10 shadow-xl">
          <div className="w-20 h-20 rounded-3xl bg-green-100 dark:bg-green-500/10 text-green-600 flex items-center justify-center mx-auto mb-4">
            <PartyPopper className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-[#0D3A1D] dark:text-white tracking-tight">
            Booking Confirmed! 🎉
          </h2>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">
            Welcome, {name}! Your tickets are ready.
          </p>

          {/* Ticket Codes */}
          {success.tickets && success.tickets.length > 0 && (
            <div className="mt-6 space-y-3">
              {success.tickets.map((t, i) => (
                <div key={i} className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ticket {i + 1}</p>
                  <p className="text-lg font-black text-[#0D3A1D] dark:text-[#93B733] tracking-widest font-mono">
                    {t.ticket_code}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/clubs/tickets"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#93B733] text-[#0D3A1D] text-sm font-bold hover:bg-[#82a32d] transition-all"
            >
              <Ticket className="w-4 h-4" /> View All Tickets
            </Link>
            <Link
              to="/clubs"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
            >
              Browse Clubs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#0d0d0d]">
      <Navbar />
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 px-4 sm:px-6 pt-10 pb-12 sm:pt-14 sm:pb-16">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-pink-400/20 blur-3xl" />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 text-white flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            You're Invited! 💜
          </h1>
          <p className="text-sm font-medium text-purple-200 mt-2">
            <strong>{inviteData?.booker_name}</strong> wants you at{" "}
            <strong>{inviteData?.club_name}</strong>
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-6 relative z-10">
        {/* Event Card */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#111] border border-gray-100 dark:border-white/10 shadow-lg mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Music className="w-5 h-5 text-purple-500" />
            <h3 className="text-base font-black text-[#0D3A1D] dark:text-white">
              {inviteData?.club_name}
            </h3>
          </div>
          {inviteData?.club_tagline && (
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
              {inviteData?.club_tagline}
            </p>
          )}
          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-500/5 border border-purple-200/30 dark:border-purple-500/20">
            <p className="text-sm font-bold text-purple-700 dark:text-purple-300">
              {inviteData?.event_title}
            </p>
            <div className="flex items-center gap-3 mt-1 text-xs font-semibold text-purple-500/70">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {formatDate(inviteData?.event_date)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {inviteData?.event_start_time}
              </span>
            </div>
          </div>
          <p className="text-xs font-semibold text-gray-400 mt-3 flex items-center gap-1">
            <User className="w-3.5 h-3.5" /> Invited by {inviteData?.booker_name}
          </p>
        </div>

        {/* Partner Form */}
        <form
          onSubmit={handleSubmit}
          className="p-5 rounded-3xl bg-white dark:bg-[#111] border border-gray-100 dark:border-white/10 shadow-lg"
        >
          <h3 className="text-base font-black text-[#0D3A1D] dark:text-white mb-4">
            Accept Invite
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-[#93B733] transition-colors"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-[#93B733] transition-colors"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-[#93B733] transition-colors"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">Gender</label>
              <div className="flex gap-3">
                {["male", "female"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-bold capitalize transition-all ${
                      gender === g
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300"
                        : "border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-5 py-3 rounded-2xl bg-purple-600 text-white font-black text-sm hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Accepting..." : "Accept Invite & Get Tickets"}
          </button>

          <p className="text-[10px] font-semibold text-gray-400 text-center mt-3">
            By accepting, you agree to create a Dormn account.
          </p>
        </form>
      </div>

      {/* Bottom spacer */}
      <div className="h-16" />
    </div>
  );
}
