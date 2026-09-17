import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, MapPin, Calendar, Trash2, ExternalLink, BarChart3, Heart } from "lucide-react";
import { getAdminEvents, deleteAdminEvent, fetchEventsFromDB } from "../../../services/eventAdminService";
import AddEventModal from "./AddEventModal";

const ACCENT_STYLES = {
  purple: {
    bgLight: "bg-purple-500/10 text-purple-500",
    btn: "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500",
    border: "border-purple-500/20",
    pill: "bg-purple-50/50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400",
    priceText: "text-purple-400"
  },
  emerald: {
    bgLight: "bg-emerald-500/10 text-emerald-500",
    btn: "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500",
    border: "border-emerald-500/20",
    pill: "bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400",
    priceText: "text-emerald-400"
  },
  pink: {
    bgLight: "bg-pink-500/10 text-pink-500",
    btn: "bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500",
    border: "border-pink-500/20",
    pill: "bg-pink-50/50 dark:bg-pink-950/20 text-pink-600 dark:text-pink-400",
    priceText: "text-pink-400"
  }
};

export default function EventCategoryManager({ category, title, subtitle, icon: Icon, accent = "purple", addLabel = "Add Listing" }) {
  const navigate = useNavigate();
  const [eventsList, setEventsList] = useState(getAdminEvents);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchEventsFromDB().then((data) => {
      if (Array.isArray(data) && data.length) setEventsList(data);
    });

    const onUpdate = () => setEventsList(getAdminEvents());
    window.addEventListener("dormn_events_updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("dormn_events_updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const styles = ACCENT_STYLES[accent] || ACCENT_STYLES.purple;

  const items = useMemo(() => {
    if (!category || category === "all") return eventsList;
    return eventsList.filter((e) => e.category === category);
  }, [eventsList, category]);

  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) =>
      it.title?.toLowerCase().includes(q) ||
      it.location?.toLowerCase().includes(q) ||
      it.city?.toLowerCase().includes(q)
    );
  }, [items, searchTerm]);

  const handleDelete = async (id, itemTitle) => {
    if (window.confirm(`Are you sure you want to remove: "${itemTitle}"?`)) {
      const updated = await deleteAdminEvent(id);
      setEventsList(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0C1220] p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-xl flex items-center justify-center font-black ${styles.bgLight}`}>
              <Icon size={18} />
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">
              {title} ({items.length})
            </h2>
          </div>
          <p className="text-xs font-semibold text-gray-400 mt-1">{subtitle}</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder={`Search ${category === "all" ? "events" : category}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 py-2.5 pl-10 pr-4 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-purple-500"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className={`px-4 py-2.5 rounded-2xl ${styles.btn} text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-purple-500/20 hover:opacity-95 transition cursor-pointer shrink-0`}
          >
            <Plus size={16} />
            <span>{addLabel || "Add Experience"}</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0C1220] p-8">
          <Icon size={48} className="mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-black text-gray-900 dark:text-white">No Listings Found</h3>
          <p className="text-xs text-gray-400 mt-1">Try adjusting your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`group flex flex-col rounded-3xl border ${styles.border} bg-white dark:bg-[#0C1220] overflow-hidden shadow-sm hover:shadow-2xl transition-all`}
            >
              {/* Image Banner */}
              <div className="relative h-52 w-full overflow-hidden bg-black">
                <img
                  src={item.coverImage || item.bannerImage}
                  alt={item.title}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute left-3 top-3 rounded-xl bg-black/80 backdrop-blur-md px-3 py-1 text-[10px] font-black uppercase text-white shadow-md border border-white/15">
                  {item.badge || item.categoryLabel || item.category}
                </span>
                <span className="absolute right-3 top-3 rounded-xl bg-black/80 border border-white/20 px-2.5 py-1 text-[10px] font-black text-white">
                  {item.city}
                </span>
                <div className="absolute bottom-3 right-3 rounded-xl bg-black/85 backdrop-blur-md border border-white/10 px-3 py-1.5 text-right">
                  <span className="text-[9px] uppercase text-gray-400 block font-bold">Single Entry</span>
                  <span className={`text-sm font-black ${styles.priceText}`}>
                    {typeof item.singlePrice === "number" ? `₹${item.singlePrice}` : item.singlePrice}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="flex-1 p-5 space-y-3">
                <h3 className="text-lg font-black text-gray-900 dark:text-white leading-snug">{item.title}</h3>
                <p className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400">
                  <MapPin size={14} className="text-purple-500 shrink-0" />
                  <span className="truncate">{item.location}</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{item.about}</p>

                <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-bold ${styles.pill}`}>
                  <div className="flex items-center gap-1.5">
                    {category === "clubs" ? (
                      <>
                        <Heart size={13} className="fill-current" />
                        <span>Couple:</span>
                      </>
                    ) : (
                      <>
                        <Calendar size={13} />
                        <span>Date:</span>
                      </>
                    )}
                  </div>
                  <span className="font-black">
                    {category === "clubs"
                      ? `${item.couplePrice} (${item.coupleCondition || "Boy+Girl"})`
                      : item.upcomingNight?.shortDate || "Upcoming"}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-3 gap-2 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] p-3">
                <button
                  onClick={() => navigate(`/event-admin/analytics?eventId=${item.id}`)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-black text-white transition ${styles.btn}`}
                >
                  <BarChart3 size={14} />
                  <span>Stats</span>
                </button>
                <a
                  href={`/events?id=${item.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 py-2.5 text-xs font-black text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition"
                >
                  <ExternalLink size={14} />
                  <span>Live</span>
                </a>
                <button
                  onClick={() => handleDelete(item.id, item.title)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 py-2.5 text-xs font-black text-rose-500 hover:bg-rose-500/20 transition cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <AddEventModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        defaultCategory={category === "all" ? "concerts" : category}
        onEventAdded={(updated) => {
          if (Array.isArray(updated)) setEventsList(updated);
          else setEventsList(getAdminEvents());
        }}
      />
    </div>
  );
}
