import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users, Plus, Search, Trash2, Edit2, Phone, MessageCircle,
  Clock, Building2, X, Upload, UserCheck, RefreshCw, HardHat, AlertCircle
} from "lucide-react";
import api, { IMAGE_BASE_URL } from "../../services/api";

const PRESET_ROLES = [
  { value: "Cook / Chef", label: "Cook / Chef", icon: "👨‍🍳", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  { value: "Electrician", label: "Electrician", icon: "⚡", color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20" },
  { value: "Security Guard", label: "Security Guard", icon: "🛡️", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  { value: "Housekeeper / Cleaner", label: "Housekeeper / Cleaner", icon: "🧹", color: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20" },
  { value: "Plumber", label: "Plumber", icon: "🔧", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  { value: "Warden / Manager", label: "Warden / Manager", icon: "👔", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
  { value: "Carpenter", label: "Carpenter", icon: "🪚", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20" },
  { value: "Laundry / Dhobi", label: "Laundry / Dhobi", icon: "🧺", color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20" },
  { value: "Maintenance Tech", label: "Maintenance Tech", icon: "🛠️", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" },
  { value: "Other", label: "Other Staff", icon: "👤", color: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20" },
];

const INITIAL_FORM = {
  pg_id: "",
  name: "",
  role: "Cook / Chef",
  customRole: "",
  phone: "",
  whatsapp: "",
  timings: "9:00 AM - 6:00 PM",
  is_active: true,
  image_url: "",
};

export default function ManageStaff() {
  const [staffList, setStaffList] = useState([]);
  const [pgs, setPgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPgFilter, setSelectedPgFilter] = useState("all");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [sameAsPhone, setSameAsPhone] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Delete modal state
  const [deletingStaff, setDeletingStaff] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch initial data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [staffRes, pgsRes] = await Promise.all([
        api.get("/staff/owner").catch(() => ({ data: { staff: [] } })),
        api.get("/pg/owner/my-pgs").catch(() => api.get("/pg/my")).catch(() => ({ data: { pgs: [] } }))
      ]);

      const staffData = staffRes.data?.staff || staffRes.data?.data || [];
      setStaffList(Array.isArray(staffData) ? staffData : []);
      const myPgs = pgsRes.data?.pgs || pgsRes.data?.data || [];
      setPgs(Array.isArray(myPgs) ? myPgs : []);

      // Default the form pg_id to the first PG if available
      if (myPgs.length > 0 && !form.pg_id) {
        const firstId = myPgs[0].id || myPgs[0]._id;
        setForm(prev => ({ ...prev, pg_id: String(firstId) }));
      }
    } catch (err) {
      console.error("Error loading staff data:", err);
    } finally {
      setLoading(false);
    }
  }, [form.pg_id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Format image URL
  const formatAvatarUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
    const cleanBase = IMAGE_BASE_URL.replace(/\/api\/?$/, "");
    return `${cleanBase}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  // Open Add modal
  const handleOpenAdd = () => {
    setEditingStaff(null);
    const firstId = pgs.length > 0 ? (pgs[0].id || pgs[0]._id) : "";
    setForm({
      ...INITIAL_FORM,
      pg_id: firstId ? String(firstId) : "",
    });
    setImageFile(null);
    setImagePreview("");
    setSameAsPhone(true);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (staff) => {
    setEditingStaff(staff);
    const isPreset = PRESET_ROLES.some(r => r.value === staff.role);
    const staffPgId = typeof staff.pg_id === 'object' ? (staff.pg_id?.id || staff.pg_id?._id) : staff.pg_id;
    setForm({
      pg_id: staffPgId ? String(staffPgId) : "",
      name: staff.name,
      role: isPreset ? staff.role : "Other",
      customRole: isPreset ? "" : staff.role,
      phone: staff.phone,
      whatsapp: staff.whatsapp || "",
      timings: staff.timings || "",
      is_active: Boolean(staff.is_active),
      image_url: staff.image_url || "",
    });
    setImageFile(null);
    setImagePreview(formatAvatarUrl(staff.image_url));
    setSameAsPhone(staff.whatsapp === staff.phone);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg("Image size should be less than 5MB");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Submit Add or Edit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!form.pg_id) {
      setErrorMsg("Please select a PG property.");
      return;
    }
    if (!form.name.trim()) {
      setErrorMsg("Staff name is required.");
      return;
    }
    if (!form.phone.trim()) {
      setErrorMsg("Phone number is required.");
      return;
    }

    const finalRole = form.role === "Other" && form.customRole.trim() 
      ? form.customRole.trim() 
      : form.role;

    const finalWhatsapp = sameAsPhone ? form.phone : form.whatsapp;

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("pg_id", form.pg_id);
      formData.append("name", form.name);
      formData.append("role", finalRole);
      formData.append("phone", form.phone);
      formData.append("whatsapp", finalWhatsapp);
      formData.append("timings", form.timings);
      formData.append("is_active", form.is_active);

      if (imageFile) {
        formData.append("image", imageFile);
      } else if (form.image_url) {
        formData.append("image_url", form.image_url);
      }

      const staffTargetId = editingStaff.id || editingStaff._id;
      if (editingStaff) {
        await api.put(`/staff/${staffTargetId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } else {
        await api.post("/staff", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }

      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error("Save staff error:", err);
      setErrorMsg(err.response?.data?.message || "Failed to save staff member. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete staff member
  const confirmDelete = async () => {
    if (!deletingStaff) return;
    try {
      setIsDeleting(true);
      const deleteId = deletingStaff.id || deletingStaff._id;
      await api.delete(`/staff/${deleteId}`);
      setDeletingStaff(null);
      loadData();
    } catch (err) {
      console.error("Delete staff error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffList.filter((staff) => {
      const staffPgId = typeof staff.pg_id === 'object' ? (staff.pg_id?.id || staff.pg_id?._id) : staff.pg_id;
      const staffPgTitle = (typeof staff.pg_id === 'object' ? staff.pg_id?.title : staff.pg_title) || "";

      const matchesSearch =
        !searchTerm.trim() ||
        staff.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.phone?.includes(searchTerm) ||
        staffPgTitle.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPg =
        selectedPgFilter === "all" || String(staffPgId) === String(selectedPgFilter);

      const matchesRole =
        selectedRoleFilter === "all" ||
        staff.role?.toLowerCase().includes(selectedRoleFilter.toLowerCase());

      return matchesSearch && matchesPg && matchesRole;
    });
  }, [staffList, searchTerm, selectedPgFilter, selectedRoleFilter]);

  // Derived statistics
  const stats = useMemo(() => {
    const total = staffList.length;
    const active = staffList.filter(s => s.is_active).length;
    const pgsCovered = new Set(staffList.map(s => typeof s.pg_id === 'object' ? (s.pg_id?.id || s.pg_id?._id) : s.pg_id)).size;
    return { total, active, pgsCovered };
  }, [staffList]);

  const getRoleConfig = (roleStr) => {
    const match = PRESET_ROLES.find(r => r.value.toLowerCase() === (roleStr || "").toLowerCase());
    return match || { label: roleStr, icon: "👤", color: "bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/20" };
  };

  return (
    <div className="space-y-3 sm:space-y-4 max-w-7xl mx-auto pb-10">
      
      {/* ── Top Header Bar (Compact on Mobile) ── */}
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121622] p-3 sm:p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="rounded-md bg-[#93B733]/15 text-[#93B733] px-2 py-0.5 text-[10px] font-black uppercase">
              Staff
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {stats.active} on Duty
            </span>
          </div>
          <h1 className="text-base sm:text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-1.5 mt-0.5">
            <Users className="text-[#93B733] shrink-0" size={18} />
            All Property Staff
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 sm:p-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? "animate-spin text-[#93B733]" : ""} />
          </button>
          
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-[#93B733] hover:bg-[#82a32d] text-black font-black text-xs shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add Staff</span>
          </button>
        </div>
      </div>

      {/* ── Compact 3-in-a-row Stat Cards (Mobile Optimized: minimal vertical space) ── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3.5">
        <div className="rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121622] p-2.5 sm:p-3.5 flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#93B733]/15 text-[#93B733] flex items-center justify-center shrink-0">
            <Users size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase truncate">Total</p>
            <p className="text-base sm:text-xl font-black text-gray-900 dark:text-white leading-tight">{stats.total}</p>
          </div>
        </div>

        <div className="rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121622] p-2.5 sm:p-3.5 flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
            <UserCheck size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase truncate">Active</p>
            <p className="text-base sm:text-xl font-black text-emerald-600 dark:text-emerald-400 leading-tight">{stats.active}</p>
          </div>
        </div>

        <div className="rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121622] p-2.5 sm:p-3.5 flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center shrink-0">
            <Building2 size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase truncate">PGs</p>
            <p className="text-base sm:text-xl font-black text-purple-600 dark:text-purple-400 leading-tight">{stats.pgsCovered}/{pgs.length}</p>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls (Compact on Mobile) ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121622] p-2.5 sm:p-3.5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, role, phone, or PG..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#93B733]"
          />
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2">
          <select
            value={selectedPgFilter}
            onChange={(e) => setSelectedPgFilter(e.target.value)}
            aria-label="Filter staff by PG Property"
            className="text-xs font-semibold px-2 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-700 dark:text-gray-300 outline-none"
          >
            <option value="all">All PGs ({pgs.length})</option>
            {pgs.map((pg) => (
              <option key={pg.id || pg._id} value={String(pg.id || pg._id)}>{pg.title}</option>
            ))}
          </select>

          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            aria-label="Filter staff by Role"
            className="text-xs font-semibold px-2 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-700 dark:text-gray-300 outline-none"
          >
            <option value="all">All Roles</option>
            {PRESET_ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.icon} {r.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Staff Grid ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 text-center">
          <RefreshCw size={28} className="animate-spin text-[#93B733] mb-3" />
          <p className="text-sm font-bold text-gray-500">Loading PG staff members...</p>
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-300 dark:border-white/10 p-12 text-center bg-gray-50/50 dark:bg-white/[0.02]">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-3 text-gray-400">
            <Users size={28} />
          </div>
          <h3 className="text-base font-black text-gray-900 dark:text-white">No Staff Members Found</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-1 mb-5">
            {searchTerm || selectedPgFilter !== "all" || selectedRoleFilter !== "all"
              ? "No staff matches your current search or filter criteria. Try clearing filters."
              : "Add your first cook, electrician, or security guard so residents can contact them in My PG."}
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-xl bg-[#93B733] hover:bg-[#82a32d] text-black font-black text-xs transition inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={16} /> Add Staff Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredStaff.map((staff) => {
            const roleCfg = getRoleConfig(staff.role);
            const avatarUrl = formatAvatarUrl(staff.image_url);
            const cleanPhone = (staff.phone || "").replace(/[^0-9+]/g, "");
            const cleanWhatsapp = (staff.whatsapp || staff.phone || "").replace(/[^0-9]/g, "");
            const displayPgTitle = (typeof staff.pg_id === 'object' ? staff.pg_id?.title : staff.pg_title) || "Assigned PG";

            return (
              <div
                key={staff.id || staff._id}
                className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121622] p-3.5 sm:p-4 shadow-xs flex flex-col justify-between hover:shadow-sm transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-2.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md truncate max-w-[170px]">
                      <Building2 size={11} className="text-[#93B733] shrink-0" />
                      <span className="truncate">{displayPgTitle}</span>
                    </span>

                    <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                      staff.is_active ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-gray-200 dark:bg-white/10 text-gray-500"
                    }`}>
                      <span className={`w-1 h-1 rounded-full ${staff.is_active ? "bg-emerald-500" : "bg-gray-400"}`} />
                      {staff.is_active ? "Active" : "Off Duty"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 shrink-0 flex items-center justify-center">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={staff.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextElementSibling?.classList.remove("hidden");
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full flex items-center justify-center text-lg bg-gradient-to-br from-[#93B733]/20 to-emerald-500/20 font-black text-gray-700 dark:text-gray-200 ${avatarUrl ? "hidden" : "flex"}`}>
                        {roleCfg.icon || staff.name.charAt(0)}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-black text-gray-900 dark:text-white truncate">
                        {staff.name}
                      </h3>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border mt-0.5 ${roleCfg.color}`}>
                        <span>{roleCfg.icon}</span>
                        <span className="truncate">{staff.role}</span>
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs py-2 border-y border-gray-100 dark:border-white/5">
                    <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1 text-gray-400"><Phone size={11} /> Phone</span>
                      <span className="font-bold text-gray-900 dark:text-gray-200 truncate">{staff.phone}</span>
                    </div>

                    {staff.whatsapp && (
                      <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1 text-gray-400"><MessageCircle size={11} /> WhatsApp</span>
                        <span className="font-bold text-gray-900 dark:text-gray-200 truncate">{staff.whatsapp}</span>
                      </div>
                    )}

                    {staff.timings && (
                      <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1 text-gray-400"><Clock size={11} /> Shift</span>
                        <span className="font-bold text-gray-900 dark:text-gray-200 truncate max-w-[150px]">{staff.timings}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2.5 flex items-center justify-between gap-1.5 mt-1">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${cleanPhone}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs hover:bg-blue-100 transition"
                      title="Call"
                    >
                      <Phone size={11} /> Call
                    </a>
                    <a
                      href={`https://wa.me/${cleanWhatsapp}?text=Hi%20${encodeURIComponent(staff.name)},%20calling%20from%20PG%20Management`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs hover:bg-emerald-100 transition"
                      title="WhatsApp"
                    >
                      <MessageCircle size={11} /> WhatsApp
                    </a>
                  </div>

                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => handleOpenEdit(staff)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
                      title="Edit"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => setDeletingStaff(staff)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 transition"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add / Edit Staff Modal (Optimized for Mobile Screens) ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white dark:bg-[#161a26] rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/10">
              <div>
                <h2 className="text-sm sm:text-base font-black text-gray-900 dark:text-white">
                  {editingStaff ? "Edit Staff Details" : "Add Staff Member"}
                </h2>
                <p className="text-[11px] text-gray-400">Shows in residents&apos; My PG app view.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto p-4 space-y-3 text-xs">
              {errorMsg && (
                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">PG Property *</label>
                <select
                  value={form.pg_id}
                  onChange={(e) => setForm(prev => ({ ...prev, pg_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-800 dark:text-gray-200 font-semibold outline-none"
                  required
                >
                  <option value="" disabled>Select PG...</option>
                  {pgs.map((pg) => (
                    <option key={pg.id || pg._id} value={String(pg.id || pg._id)}>{pg.title}</option>
                  ))}
                </select>
              </div>

              {/* Photo Upload Row */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center shrink-0">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <HardHat size={20} className="text-gray-400" />
                  )}
                </div>
                <div>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-white/20 bg-gray-50 dark:bg-white/5 text-[11px] font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                    <Upload size={12} />
                    <span>{imageFile ? "Change Photo" : "Upload Photo"}</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                  <p className="text-[10px] text-gray-400 mt-0.5">JPG or PNG up to 5MB</p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Your Name"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-800 dark:text-gray-200 outline-none"
                  required
                />
              </div>

              {/* Compact Role Selector (Saves Mobile Screen Space) */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">Role / Job Title *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-800 dark:text-gray-200 font-semibold outline-none"
                >
                  {PRESET_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.icon} {r.label}</option>
                  ))}
                </select>
                {form.role === "Other" && (
                  <input
                    type="text"
                    placeholder="Specify role title..."
                    value={form.customRole}
                    onChange={(e) => setForm(prev => ({ ...prev, customRole: e.target.value }))}
                    className="w-full mt-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 outline-none"
                  />
                )}
              </div>

              {/* Phone & WhatsApp Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 outline-none"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">WhatsApp</label>
                    <label className="flex items-center gap-1 text-[10px] text-gray-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sameAsPhone}
                        onChange={(e) => setSameAsPhone(e.target.checked)}
                        className="rounded accent-[#93B733]"
                      />
                      <span>Same</span>
                    </label>
                  </div>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={sameAsPhone ? form.phone : form.whatsapp}
                    disabled={sameAsPhone}
                    onChange={(e) => setForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 outline-none ${
                      sameAsPhone ? "bg-gray-100 dark:bg-white/5 opacity-70" : "bg-gray-50 dark:bg-black/20"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">Working / Shift Hours</label>
                <input
                  type="text"
                  placeholder="e.g. 7:00 AM - 3:00 PM"
                  value={form.timings}
                  onChange={(e) => setForm(prev => ({ ...prev, timings: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 outline-none"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">Active on Duty</p>
                  <p className="text-[10px] text-gray-400">Shows active badge to residents</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#93B733]"></div>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-gray-300 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-[#93B733] hover:bg-[#82a32d] text-black font-black text-xs transition"
                >
                  {submitting ? "Saving..." : editingStaff ? "Update Staff" : "Add Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Modal (Compact) ── */}
      {deletingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-[#161a26] rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-white/10 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white">Delete Staff Member?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Are you sure you want to remove <strong className="text-gray-900 dark:text-white">{deletingStaff.name}</strong>?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeletingStaff(null)}
                className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-1"
              >
                {isDeleting && <RefreshCw size={12} className="animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
