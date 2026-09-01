import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, Ticket, Calendar, Clock, Users, Music, Sparkles } from "lucide-react";
import api, { IMAGE_BASE_URL } from "../../services/api";
import Navbar from "../../components/Navbar";

const ClubCard = ({ club }) => {
  const imageUrl = club.cover_image
    ? `${IMAGE_BASE_URL}/uploads/${club.cover_image}`
    : null;

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" });
  };

  return (
    <Link
      to={`/clubs/${club.id}`}
      className="group flex flex-col rounded-3xl border-2 border-gray-100 dark:border-white/10 bg-white dark:bg-[#111] overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-[#93B733]/40"
    >
      {/* Cover Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-100 dark:bg-gray-800">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={club.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0D3A1D] to-[#1a5c33]">
            <Music className="w-12 h-12 text-[#93B733]/40" />
          </div>
        )}
        {/* Entry Fee Badge */}
        <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-white/90 dark:bg-black/80 backdrop-blur-sm shadow-md">
          <span className="text-xs font-black text-[#0D3A1D] dark:text-[#93B733]">
            ₹{club.single_entry_fee}
          </span>
          <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 ml-1">single</span>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 p-4 sm:p-5">
        <h3 className="text-lg font-black text-[#0D3A1D] dark:text-white tracking-tight group-hover:text-[#93B733] transition-colors line-clamp-1">
          {club.name}
        </h3>
        {club.tagline && (
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
            {club.tagline}
          </p>
        )}
        <div className="flex items-center gap-1.5 mt-2 text-gray-500 dark:text-gray-400">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-xs font-semibold truncate">
            {club.area ? `${club.area}, ` : ""}{club.city}
          </span>
        </div>

        {/* Next Event */}
        {club.next_event ? (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#93B733]/10 dark:bg-[#93B733]/5 border border-[#93B733]/20">
            <Calendar className="w-4 h-4 text-[#93B733] flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#0D3A1D] dark:text-[#93B733] truncate">
                {club.next_event.title}
              </p>
              <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3 inline" />
                {formatDate(club.next_event.date)} · {club.next_event.start_time}
                {club.remaining_capacity !== null && (
                  <span className="ml-1 text-[#93B733]">
                    · {club.remaining_capacity} spots left
                  </span>
                )}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
            <Sparkles className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-semibold text-gray-400">No upcoming nights</span>
          </div>
        )}

        {/* Couple FREE badge */}
        <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-500/10 border border-purple-200/50 dark:border-purple-500/20">
          <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            Couples Entry Free
          </span>
        </div>
      </div>
    </Link>
  );
};

const SkeletonCard = () => (
  <div className="flex flex-col rounded-3xl border-2 border-gray-100 dark:border-white/10 bg-white dark:bg-[#111] overflow-hidden animate-pulse">
    <div className="aspect-[16/10] bg-gray-200 dark:bg-gray-800" />
    <div className="p-5 space-y-3">
      <div className="h-5 w-3/4 rounded-lg bg-gray-200 dark:bg-gray-800" />
      <div className="h-3 w-1/2 rounded-lg bg-gray-200 dark:bg-gray-800" />
      <div className="h-3 w-2/3 rounded-lg bg-gray-200 dark:bg-gray-800" />
      <div className="h-10 w-full rounded-xl bg-gray-100 dark:bg-gray-800" />
    </div>
  </div>
);

export default function ClubsList() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const res = await api.get("/clubs");
        setClubs(res.data?.clubs || []);
      } catch (err) {
        console.error("Failed to load clubs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchClubs();
  }, []);

  const filteredClubs = useMemo(() => {
    if (!search.trim()) return clubs;
    const q = search.toLowerCase();
    return clubs.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q) ||
        c.area?.toLowerCase().includes(q) ||
        c.tagline?.toLowerCase().includes(q)
    );
  }, [clubs, search]);

  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#0d0d0d]">
      <Navbar />
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0D3A1D] via-[#0a2e17] to-[#071a0d] px-4 sm:px-6 md:px-8 lg:px-10 pt-10 pb-12 sm:pt-14 sm:pb-16">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#93B733]/20 blur-3xl" />
        <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-[#93B733]/10 blur-2xl" />
        <div className="relative z-10 max-w-[1440px] 2xl:max-w-[1600px] mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Music className="w-5 h-5 text-[#93B733]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#93B733]">Nightlife & Clubs</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Discover <span className="text-[#93B733]">Club Nights</span>
          </h1>
          <p className="mt-2 text-sm sm:text-base font-medium text-gray-300 max-w-xl">
            Book your spot at the hottest clubs. Singles pay, couples enter FREE.
          </p>

          {/* Search + My Tickets */}
          <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-xl">
            <div className="flex-1 flex items-center bg-white/10 border border-white/20 rounded-2xl px-4 py-3 backdrop-blur-sm focus-within:border-[#93B733] transition-colors">
              <Search className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search by name, city, or area..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm font-medium text-white placeholder:text-gray-400 outline-none"
              />
            </div>
            <Link
              to="/clubs/tickets"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#93B733] text-[#0D3A1D] text-sm font-black hover:bg-[#82a32d] transition-all shadow-lg shadow-[#93B733]/20 whitespace-nowrap"
            >
              <Ticket className="w-4 h-4" />
              My Tickets
            </Link>
          </div>
        </div>
      </div>

      {/* Clubs Grid */}
      <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-8 sm:py-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredClubs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-3xl bg-[#93B733]/10 flex items-center justify-center mb-6">
              <Music className="w-10 h-10 text-[#93B733]" strokeWidth={1.8} />
            </div>
            <h3 className="text-2xl font-black text-[#0D3A1D] dark:text-white tracking-tight mb-2">
              {search ? "No clubs found" : "No clubs yet"}
            </h3>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 max-w-sm">
              {search
                ? "Try a different search term."
                : "Clubs will appear here once added by the admin."}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-black text-[#0D3A1D] dark:text-white tracking-tight">
                {search ? `${filteredClubs.length} clubs found` : `All Clubs`}
              </h2>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="text-xs font-bold text-[#93B733] hover:underline"
                >
                  Clear Search
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
              {filteredClubs.map((club) => (
                <ClubCard key={club.id} club={club} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
