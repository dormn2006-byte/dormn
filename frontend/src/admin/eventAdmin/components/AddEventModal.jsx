import React, { useState } from "react";
import { X, Plus, Sparkles, CheckCircle2 } from "lucide-react";
import { saveAdminEvent } from "../../../services/eventAdminService";

const PRESET_IMAGES = {
  concerts: [
    "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1600&q=80",
  ],
  clubs: [
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=1600&q=80",
  ],
  events: [
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1600&q=80",
  ],
};

const CAT_LABELS = {
  concerts: "Live Concerts & Shows",
  clubs: "Nightlife & Clubs",
  events: "Campus Events & Fests",
};

const CATEGORIES = [
  { id: "concerts", label: "Live Concerts", icon: "🎸" },
  { id: "clubs", label: "Nightclubs", icon: "🍸" },
  { id: "events", label: "Campus Events", icon: "🎉" },
];

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm font-semibold text-gray-900 dark:text-white outline-none focus:border-pink-500";
const labelCls = "block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5";

const Field = ({ label, className = "", ...props }) => (
  <div className={className}>
    {label && <label className={labelCls}>{label}</label>}
    <input className={inputCls} {...props} />
  </div>
);

export default function AddEventModal({ isOpen, onClose, defaultCategory = "concerts", onEventAdded }) {
  if (!isOpen) return null;

  const initialCat = defaultCategory === "all" ? "concerts" : defaultCategory;
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    category: initialCat,
    title: "",
    tagline: "",
    location: "",
    city: "Noida",
    phone: "9811234567",
    singlePrice: 499,
    couplePrice: "FREE",
    coupleCondition: "Boy + Girl Couple Free Entry",
    coverImage: PRESET_IMAGES[initialCat]?.[0] || PRESET_IMAGES.concerts[0],
    nightTitle: "Headline Saturday Night Show",
    dateFormatted: "Saturday 26 September, 2026",
    time: "8:00 PM - 1:00 AM",
    spotsLeft: 75,
    badge: "COUPLES ENTRY FREE",
    about: "",
    rules: "Age 18+ valid physical government ID mandatory\nDress code: Smart Casual / Party Wear\nStag entry strictly subject to management discretion",
  });

  const setField = (field, val) => setForm((prev) => ({ ...prev, [field]: val }));

  const handleCatChange = (newCat) => {
    setForm((prev) => ({
      ...prev,
      category: newCat,
      coverImage: PRESET_IMAGES[newCat]?.[0] || prev.coverImage,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.location.trim()) return;

    setLoading(true);
    const id = `event-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const cover = form.coverImage.trim() || PRESET_IMAGES[form.category]?.[0];

    const newEvent = {
      id,
      title: form.title.trim(),
      tagline: form.tagline.trim() || "Experience the energy and music live",
      category: form.category,
      categoryLabel: CAT_LABELS[form.category] || "Special Event",
      location: form.location.trim(),
      city: form.city.trim() || "Noida",
      phone: form.phone.trim() || "9811234567",
      singlePrice: Number(form.singlePrice) || 0,
      couplePrice: form.couplePrice.trim() || "FREE",
      coupleCondition: form.coupleCondition.trim() || "Couple Free Entry",
      coverImage: cover,
      bannerImage: cover,
      gallery: [
        cover,
        PRESET_IMAGES[form.category]?.[1] || PRESET_IMAGES.concerts[1],
        PRESET_IMAGES[form.category]?.[2] || PRESET_IMAGES.concerts[2],
      ],
      about:
        form.about.trim() ||
        `${form.title} brings an electrifying night of live musical acoustics, signature cocktails, and unforgettable performances.`,
      upcomingNight: {
        title: form.nightTitle.trim() || form.title.trim(),
        dateFormatted: form.dateFormatted.trim() || "Saturday 26 September, 2026",
        shortDate: form.dateFormatted.trim().substring(0, 15) || "sat, 26 sept",
        time: form.time.trim() || "8pm - 1am",
        shortTime: form.time.split("-")[0]?.trim() || "8pm",
        spotsLeft: Number(form.spotsLeft) || 50,
      },
      badge: form.badge.trim() || "COUPLES ENTRY FREE",
      rules: form.rules
        .split("\n")
        .map((r) => r.trim())
        .filter(Boolean),
      status: "active",
    };

    try {
      const updatedList = await saveAdminEvent(newEvent);
      setSuccess(true);
      if (onEventAdded) onEventAdded(updatedList);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 800);
    } catch (err) {
      console.error("Failed to publish event:", err);
      alert("Failed to publish event to database: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl my-6 rounded-3xl bg-white dark:bg-[#0D0B1C] border border-purple-200 dark:border-purple-500/30 p-5 sm:p-7 shadow-2xl text-gray-900 dark:text-white max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/10 sticky -top-5 bg-white dark:bg-[#0D0B1C] z-20 pt-1">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-pink-500/25 shrink-0">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">Publish New Experience</h2>
              <p className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                Saves directly to MySQL database & publishes to live catalog
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-purple-900 dark:text-purple-300 mb-2">
              Select Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleCatChange(c.id)}
                  className={`p-3 rounded-2xl border text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                    form.category === c.id
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent shadow-md shadow-pink-500/30"
                      : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10"
                  }`}
                >
                  <span>{c.icon}</span>
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Event / Venue Title *"
              required
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="e.g. Coldplay Live India Tour or Molecule Air Bar"
            />
            <Field
              label="Tagline / Subtitle"
              value={form.tagline}
              onChange={(e) => setField("tagline", e.target.value)}
              placeholder="e.g. Skyline Rooftop & High-Bass Experience"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field
              label="Venue Location *"
              required
              value={form.location}
              onChange={(e) => setField("location", e.target.value)}
              placeholder="e.g. Sector 62, Advant Navis"
            />
            <Field
              label="City *"
              required
              value={form.city}
              onChange={(e) => setField("city", e.target.value)}
              placeholder="e.g. Noida, Delhi"
            />
            <Field
              label="Contact Phone"
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              placeholder="7415417522"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-500/20">
            <div>
              <label className="block text-xs font-bold text-purple-900 dark:text-purple-300 mb-1.5">Single Price (₹)</label>
              <input
                type="number"
                min="0"
                value={form.singlePrice}
                onChange={(e) => setField("singlePrice", e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 dark:border-white/10 bg-white dark:bg-black/60 text-sm font-black text-purple-900 dark:text-pink-300 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-purple-900 dark:text-purple-300 mb-1.5">Couple Price</label>
              <input
                type="text"
                value={form.couplePrice}
                onChange={(e) => setField("couplePrice", e.target.value)}
                placeholder="FREE or ₹999"
                className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 dark:border-white/10 bg-white dark:bg-black/60 text-sm font-black text-pink-600 dark:text-pink-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-purple-900 dark:text-purple-300 mb-1.5">Couple Condition</label>
              <input
                type="text"
                value={form.coupleCondition}
                onChange={(e) => setField("coupleCondition", e.target.value)}
                placeholder="Boy + Girl only"
                className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 dark:border-white/10 bg-white dark:bg-black/60 text-xs font-semibold text-gray-800 dark:text-gray-200 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field
              label="Schedule Title"
              value={form.nightTitle}
              onChange={(e) => setField("nightTitle", e.target.value)}
              placeholder="Headline Saturday Show"
            />
            <Field
              label="Date Formatted *"
              required
              value={form.dateFormatted}
              onChange={(e) => setField("dateFormatted", e.target.value)}
              placeholder="Saturday 26 September, 2026"
            />
            <div>
              <label className={labelCls}>Time & Spots</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={form.time}
                  onChange={(e) => setField("time", e.target.value)}
                  placeholder="8pm - 1am"
                  className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs font-semibold text-gray-900 dark:text-white outline-none"
                />
                <input
                  type="number"
                  min="5"
                  value={form.spotsLeft}
                  onChange={(e) => setField("spotsLeft", e.target.value)}
                  placeholder="Spots"
                  className="w-20 px-2.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs font-black text-pink-600 dark:text-pink-400 outline-none text-center"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelCls}>Cover Image URL *</label>
              <span className="text-[11px] font-semibold text-purple-600 dark:text-pink-400">Quick Presets:</span>
            </div>
            <input
              type="url"
              required
              value={form.coverImage}
              onChange={(e) => setField("coverImage", e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className={`${inputCls} font-mono text-xs mb-2`}
            />
            <div className="flex items-center gap-3">
              {(PRESET_IMAGES[form.category] || PRESET_IMAGES.concerts).map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setField("coverImage", img)}
                  className={`h-14 w-24 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                    form.coverImage === img ? "border-pink-500 scale-105 shadow-md shadow-pink-500/30" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt={`Preset ${idx + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>About Description</label>
            <textarea
              rows="3"
              value={form.about}
              onChange={(e) => setField("about", e.target.value)}
              placeholder="Tell guests about the sound acoustics, artist lineup, stage VIP access, and drinks..."
              className={`${inputCls} text-xs resize-none`}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-xs shadow-xl shadow-pink-600/30 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {success ? (
                <>
                  <CheckCircle2 size={16} className="text-emerald-300" />
                  <span>Published Successfully!</span>
                </>
              ) : loading ? (
                <span>Publishing to Database...</span>
              ) : (
                <>
                  <Plus size={16} />
                  <span>Publish Experience Live</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
