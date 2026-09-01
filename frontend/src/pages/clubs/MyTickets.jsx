import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import {
  Ticket, Music, Calendar, Clock, MapPin, User, ArrowLeft, Sparkles
} from "lucide-react";
import api, { IMAGE_BASE_URL } from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const StatusBadge = ({ status }) => {
  const styles = {
    active: "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200/50 dark:border-green-500/20",
    expired: "bg-gray-100 dark:bg-gray-500/10 text-gray-500 dark:text-gray-400 border-gray-200/50 dark:border-gray-500/20",
    cancelled: "bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 border-red-200/50 dark:border-red-500/20",
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${styles[status] || styles.active}`}>
      {status}
    </span>
  );
};

export default function MyTickets() {
  const { user } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await api.get("/clubs/my-tickets");
        setTickets(res.data?.tickets || []);
      } catch (err) {
        console.error("Failed to load tickets:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchTickets();
    else setLoading(false);
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#0d0d0d] flex flex-col items-center justify-center text-center px-4">
        <Ticket className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-black text-[#0D3A1D] dark:text-white">Sign in to view tickets</h2>
        <Link to="/auth" className="mt-4 px-5 py-2.5 rounded-xl bg-[#0D3A1D] text-white text-sm font-bold hover:opacity-90 transition-all">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#0d0d0d]">
      <Navbar />
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0D3A1D] via-[#0a2e17] to-[#071a0d] px-4 sm:px-6 md:px-8 lg:px-10 pt-8 pb-10 sm:pt-10 sm:pb-12">
        <div className="max-w-5xl mx-auto">
          <Link
            to="/clubs"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#93B733] hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Clubs
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Ticket className="w-7 h-7 text-[#93B733]" />
            My Tickets
          </h1>
          <p className="text-sm font-medium text-gray-300 mt-1">
            All your club night tickets in one place
          </p>
        </div>
      </div>

      {/* Tickets Grid */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-3xl border border-gray-100 dark:border-white/10 bg-white dark:bg-[#111] p-5 animate-pulse">
                <div className="h-5 w-3/4 rounded-lg bg-gray-200 dark:bg-gray-800 mb-3" />
                <div className="h-3 w-1/2 rounded-lg bg-gray-200 dark:bg-gray-800 mb-2" />
                <div className="h-3 w-2/3 rounded-lg bg-gray-200 dark:bg-gray-800 mb-4" />
                <div className="h-8 w-1/3 rounded-lg bg-gray-100 dark:bg-gray-800" />
              </div>
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-3xl bg-[#93B733]/10 flex items-center justify-center mb-6">
              <Ticket className="w-10 h-10 text-[#93B733]" strokeWidth={1.8} />
            </div>
            <h3 className="text-2xl font-black text-[#0D3A1D] dark:text-white tracking-tight mb-2">
              No tickets yet
            </h3>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 max-w-sm mb-6">
              Book a club night to get your first ticket.
            </p>
            <Link
              to="/clubs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#93B733] text-[#0D3A1D] text-sm font-bold hover:bg-[#82a32d] transition-all"
            >
              <Sparkles className="w-4 h-4" /> Explore Clubs
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {tickets.map((ticket) => {
              const clubCover = ticket.club_id?.cover_image
                ? `${IMAGE_BASE_URL}/uploads/${ticket.club_id.cover_image}`
                : null;

              return (
                <div
                  key={ticket.id || ticket._id}
                  className={`rounded-3xl border-2 overflow-hidden transition-all ${
                    ticket.status === "active"
                      ? "border-[#93B733]/30 bg-white dark:bg-[#111] shadow-md shadow-[#93B733]/5"
                      : ticket.status === "expired"
                      ? "border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#111] opacity-75"
                      : "border-red-200/50 dark:border-red-500/10 bg-white dark:bg-[#111] opacity-60"
                  }`}
                >
                  {/* Mini Cover */}
                  <div className="h-20 relative overflow-hidden">
                    {clubCover ? (
                      <img src={clubCover} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#0D3A1D] to-[#1a5c33] flex items-center justify-center">
                        <Music className="w-8 h-8 text-[#93B733]/30" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <StatusBadge status={ticket.status} />
                    </div>
                  </div>

                  <div className="p-4 sm:p-5">
                    {/* Club Name */}
                    <h4 className="text-base font-black text-[#0D3A1D] dark:text-white tracking-tight line-clamp-1">
                      {ticket.club_id?.name || "Club"}
                    </h4>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                      {ticket.event_id?.title || "Event"}
                    </p>

                    {/* Event Details */}
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDate(ticket.event_id?.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {ticket.event_id?.start_time}
                      </span>
                    </div>

                    {/* Holder + Type */}
                    <div className="flex items-center gap-2 mt-2 text-[11px] font-semibold text-gray-400">
                      <User className="w-3 h-3" /> {ticket.holder_name}
                      <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 uppercase">
                        {ticket.type}
                      </span>
                    </div>

                    {/* Ticket Code */}
                    <div className="mt-3 px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-center">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ticket Code</p>
                      <p className="text-lg font-black text-[#0D3A1D] dark:text-[#93B733] tracking-widest font-mono mt-0.5">
                        {ticket.ticket_code}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
