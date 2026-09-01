import { useContext, useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  Music,
  MapPin,
  X,
  Upload,
  Eye,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import { IMAGE_BASE_URL } from "../../services/api";

const emptyClub = {
  name: "",
  tagline: "",
  description: "",
  city: "",
  area: "",
  address: "",
  single_entry_fee: "",
  contact_phone: "",
  opening_hours: "",
};

const emptyEvent = {
  title: "",
  date: "",
  start_time: "",
  end_time: "",
  capacity: "",
};

/* ── Modals defined OUTSIDE the parent so React keeps stable component identities ── */

const ClubFormModal = ({
  title,
  isOpen,
  onClose,
  onSubmit,
  clubForm,
  onFormChange,
  coverImage,
  onCoverImageChange,
  galleryImages,
  onGalleryImagesChange,
  submitting,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black text-white">{title}</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-white/10 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-gray-400">Club Name *</label>
              <input name="name" value={clubForm.name} onChange={onFormChange} required className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-400">Tagline</label>
              <input name="tagline" value={clubForm.tagline} onChange={onFormChange} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-cyan-500" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-400">Description</label>
            <textarea name="description" value={clubForm.description} onChange={onFormChange} rows={3} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-cyan-500" />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm text-gray-400">City *</label>
              <input name="city" value={clubForm.city} onChange={onFormChange} required className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-400">Area</label>
              <input name="area" value={clubForm.area} onChange={onFormChange} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-400">Address</label>
              <input name="address" value={clubForm.address} onChange={onFormChange} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-cyan-500" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm text-gray-400">Single Entry Fee (₹) *</label>
              <input name="single_entry_fee" type="number" value={clubForm.single_entry_fee} onChange={onFormChange} required className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-400">Contact Phone</label>
              <input name="contact_phone" value={clubForm.contact_phone} onChange={onFormChange} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-400">Opening Hours</label>
              <input name="opening_hours" value={clubForm.opening_hours} onChange={onFormChange} placeholder="e.g. 9 PM - 3 AM" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-cyan-500" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-400">Cover Image</label>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-white/20 bg-black/20 px-4 py-3 text-gray-400 hover:border-cyan-500/50 hover:text-cyan-300">
              <Upload size={18} />
              <span>{coverImage ? coverImage.name : "Choose cover image"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onCoverImageChange(e.target.files[0])} />
            </label>
            {coverImage && (
              <img src={URL.createObjectURL(coverImage)} alt="Preview" className="mt-2 h-32 rounded-xl object-cover" />
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-400">Gallery Images (multiple)</label>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-white/20 bg-black/20 px-4 py-3 text-gray-400 hover:border-cyan-500/50 hover:text-cyan-300">
              <Upload size={18} />
              <span>{galleryImages.length > 0 ? `${galleryImages.length} file(s) selected` : "Choose gallery images"}</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onGalleryImagesChange([...e.target.files])} />
            </label>
            {galleryImages.length > 0 && (
              <div className="mt-2 flex gap-2 overflow-x-auto">
                {galleryImages.map((img, i) => (
                  <img key={i} src={URL.createObjectURL(img)} alt="" className="h-20 rounded-lg object-cover" />
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-6 py-3 text-gray-400 transition hover:bg-white/10 hover:text-white">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 font-semibold text-white transition hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50">
              {submitting ? "Saving..." : "Save Club"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EventFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  eventForm,
  onFormChange,
  submitting,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black text-white">Create Club Night</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-white/10 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-gray-400">Event Title *</label>
            <input name="title" value={eventForm.title} onChange={onFormChange} required className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-cyan-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-400">Date *</label>
            <input name="date" type="date" value={eventForm.date} onChange={onFormChange} required className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-cyan-500" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-gray-400">Start Time *</label>
              <input name="start_time" value={eventForm.start_time} onChange={onFormChange} required placeholder="e.g. 9:00 PM" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-400">End Time *</label>
              <input name="end_time" value={eventForm.end_time} onChange={onFormChange} required placeholder="e.g. 2:00 AM" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-cyan-500" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-400">Capacity (people) *</label>
            <input name="capacity" type="number" value={eventForm.capacity} onChange={onFormChange} required className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-cyan-500" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-6 py-3 text-gray-400 transition hover:bg-white/10 hover:text-white">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-3 font-semibold text-white transition hover:from-violet-600 hover:to-purple-700 disabled:opacity-50">
              {submitting ? "Creating..." : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Main component ── */

const ManageClubs = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingClub, setEditingClub] = useState(null);
  const [selectedClubId, setSelectedClubId] = useState(null);

  // Form states
  const [clubForm, setClubForm] = useState(emptyClub);
  const [eventForm, setEventForm] = useState(emptyEvent);
  const [coverImage, setCoverImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/clubs/admin/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClubs(data.clubs || data || []);
    } catch (err) {
      console.error("Clubs Fetch Error:", err);
      setError("Failed to load clubs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchClubs();
  }, [token]);

  const filteredClubs = useMemo(() => {
    return clubs.filter((club) => {
      const q = search.toLowerCase();
      return (
        (club.name || "").toLowerCase().includes(q) ||
        (club.city || "").toLowerCase().includes(q) ||
        (club.area || "").toLowerCase().includes(q)
      );
    });
  }, [clubs, search]);

  const handleClubFormChange = (e) => {
    setClubForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEventFormChange = (e) => {
    setEventForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const openCreateModal = () => {
    setClubForm(emptyClub);
    setCoverImage(null);
    setGalleryImages([]);
    setShowCreateModal(true);
  };

  const openEditModal = (club) => {
    setEditingClub(club);
    setClubForm({
      name: club.name || "",
      tagline: club.tagline || "",
      description: club.description || "",
      city: club.city || "",
      area: club.area || "",
      address: club.address || "",
      single_entry_fee: club.single_entry_fee || "",
      contact_phone: club.contact_phone || "",
      opening_hours: club.opening_hours || "",
    });
    setCoverImage(null);
    setGalleryImages([]);
    setShowEditModal(true);
  };

  const openEventModal = (clubId) => {
    setSelectedClubId(clubId);
    setEventForm(emptyEvent);
    setShowEventModal(true);
  };

  const handleCreateClub = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(clubForm).forEach((key) => {
        if (clubForm[key] !== "") formData.append(key, clubForm[key]);
      });
      if (coverImage) formData.append("cover_image", coverImage);
      galleryImages.forEach((img) => formData.append("images", img));

      await api.post("/clubs", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setShowCreateModal(false);
      fetchClubs();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to create club");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateClub = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(clubForm).forEach((key) => {
        formData.append(key, clubForm[key]);
      });
      if (coverImage) formData.append("cover_image", coverImage);
      galleryImages.forEach((img) => formData.append("images", img));

      await api.put(`/clubs/${editingClub._id || editingClub.id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setShowEditModal(false);
      fetchClubs();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update club");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClub = async (clubId, clubName) => {
    if (!confirm(`Delete "${clubName}"? This will cascade delete all images, events, bookings and tickets.`)) return;
    try {
      await api.delete(`/clubs/${clubId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClubs((prev) => prev.filter((c) => (c._id || c.id) !== clubId));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete club");
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/clubs/${selectedClubId}/events`, eventForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowEventModal(false);
      fetchClubs();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm("Delete this event? This will cascade delete related bookings and tickets.")) return;
    try {
      await api.delete(`/clubs/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchClubs();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete event");
    }
  };

  const totalClubs = clubs.length;
  const activeClubs = clubs.filter((c) => c.status === "active").length;
  const totalEvents = clubs.reduce((sum, c) => sum + (c.events_count || c.events?.length || 0), 0);
  const totalBookings = clubs.reduce((sum, c) => sum + (c.bookings_count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-400">
          Super Admin Panel
        </p>
        <h1 className="mt-2 text-4xl font-black text-white">
          Manage Clubs
        </h1>
        <p className="mt-2 text-gray-400">
          Create, edit and manage all nightlife clubs and events.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
          <Music className="mb-3 text-violet-400" />
          <h3 className="text-3xl font-black text-white">{totalClubs}</h3>
          <p className="text-gray-400">Total Clubs</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
          <Music className="mb-3 text-green-400" />
          <h3 className="text-3xl font-black text-white">{activeClubs}</h3>
          <p className="text-gray-400">Active Clubs</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
          <Calendar className="mb-3 text-cyan-400" />
          <h3 className="text-3xl font-black text-white">{totalEvents}</h3>
          <p className="text-gray-400">Total Events</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
          <Calendar className="mb-3 text-amber-400" />
          <h3 className="text-3xl font-black text-white">{totalBookings}</h3>
          <p className="text-gray-400">Total Bookings</p>
        </div>
      </div>

      {/* Actions bar */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search clubs by name, city, area..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/20 py-3 pl-12 pr-4 text-white outline-none"
            />
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-3 font-semibold text-white transition hover:from-violet-600 hover:to-purple-700"
          >
            <Plus size={18} />
            Create Club
          </button>
        </div>

        {loading && (
          <div className="mt-4 rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4 text-violet-300">
            Loading clubs...
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        {/* Club list */}
        <div className="mt-6 space-y-4">
          {filteredClubs.map((club) => {
            const clubId = club._id || club.id;
            const events = club.events || [];
            return (
              <div
                key={clubId}
                className="rounded-2xl border border-white/10 bg-slate-950/60 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  {/* Club info */}
                  <div className="flex gap-4">
                    {club.cover_image && (
                      <img
                        src={`${IMAGE_BASE_URL}/uploads/${club.cover_image}`}
                        alt={club.name}
                        className="h-20 w-20 rounded-xl object-cover"
                      />
                    )}
                    <div>
                      <h3 className="text-xl font-bold text-white">{club.name}</h3>
                      {club.tagline && <p className="text-sm text-gray-400">{club.tagline}</p>}
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        {club.city && (
                          <span className="flex items-center gap-1">
                            <MapPin size={14} /> {club.city}{club.area ? `, ${club.area}` : ""}
                          </span>
                        )}
                        <span>₹{club.single_entry_fee} single entry</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            club.status === "active"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {club.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {events.length} event(s)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => navigate(`/clubs/${clubId}`)}
                      className="flex items-center gap-1 rounded-xl bg-cyan-500/20 px-3 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/30"
                    >
                      <Eye size={14} />
                      View
                    </button>
                    <button
                      onClick={() => openEventModal(clubId)}
                      className="flex items-center gap-1 rounded-xl bg-violet-500/20 px-3 py-2 text-sm font-semibold text-violet-300 transition hover:bg-violet-500/30"
                    >
                      <Plus size={14} />
                      Add Event
                    </button>
                    <button
                      onClick={() => navigate(`/superadmin/club-bookings?clubId=${clubId}`)}
                      className="flex items-center gap-1 rounded-xl bg-amber-500/20 px-3 py-2 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/30"
                    >
                      <Calendar size={14} />
                      Bookings
                    </button>
                    <button
                      onClick={() => openEditModal(club)}
                      className="flex items-center gap-1 rounded-xl bg-blue-500/20 px-3 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/30"
                    >
                      <Edit3 size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClub(clubId, club.name)}
                      className="flex items-center gap-1 rounded-xl bg-red-500/20 px-3 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/30"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>

                {/* Events list */}
                {events.length > 0 && (
                  <div className="mt-4 border-t border-white/5 pt-4">
                    <p className="mb-2 text-sm font-semibold text-gray-400">Upcoming Events</p>
                    <div className="space-y-2">
                      {events.map((evt) => {
                        const eventId = evt._id || evt.id;
                        return (
                          <div
                            key={eventId}
                            className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2"
                          >
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-semibold text-white">{evt.title}</span>
                              <span className="text-xs text-gray-400">{evt.date}</span>
                              <span className="text-xs text-gray-500">{evt.start_time} - {evt.end_time}</span>
                              <span className="text-xs text-gray-500">Cap: {evt.capacity}</span>
                            </div>
                            <button
                              onClick={() => handleDeleteEvent(eventId)}
                              className="rounded-lg p-1 text-red-400 transition hover:bg-red-500/20"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {!loading && filteredClubs.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-8 text-center text-gray-400">
              No clubs found. Click "Create Club" to add one.
            </div>
          )}
        </div>
      </div>

      {/* Modals — now using stable, externally-defined components */}
      <ClubFormModal
        title="Create Club"
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateClub}
        clubForm={clubForm}
        onFormChange={handleClubFormChange}
        coverImage={coverImage}
        onCoverImageChange={setCoverImage}
        galleryImages={galleryImages}
        onGalleryImagesChange={setGalleryImages}
        submitting={submitting}
      />
      <ClubFormModal
        title="Edit Club"
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleUpdateClub}
        clubForm={clubForm}
        onFormChange={handleClubFormChange}
        coverImage={coverImage}
        onCoverImageChange={setCoverImage}
        galleryImages={galleryImages}
        onGalleryImagesChange={setGalleryImages}
        submitting={submitting}
      />
      <EventFormModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        onSubmit={handleCreateEvent}
        eventForm={eventForm}
        onFormChange={handleEventFormChange}
        submitting={submitting}
      />
    </div>
  );
};

export default ManageClubs;
