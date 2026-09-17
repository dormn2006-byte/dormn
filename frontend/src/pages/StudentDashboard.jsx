import { useState, useEffect, useContext, useRef, memo, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { 
  Camera, Pencil, Check, Search, Brain, Clock, CheckCircle, BookOpen, ChevronRight,
  Code, Gamepad2, User, Building2, Lock, Globe, FileText, HeartPulse, Users, Save, Eye, EyeOff, Sparkles, X,
  Upload, Briefcase, GitBranch, MessageCircle, CheckCircle2, AlertCircle, AlertTriangle
} from "lucide-react";

import ThemeSwitch from "../components/ui/theme-switch-button";
import CustomSelect from "../components/ui/CustomSelect";
import CollegeCombobox from "../components/ui/CollegeCombobox";
import TagInput from "../components/ui/TagInput";
import StatusBadge from "../components/ui/StatusBadge";
import MacOSDock from "../components/ui/mac-os-dock";
import SlidingPgPageSidebar, { MobileSponsoredSlider } from "../components/dashboard/FeaturedSidebar";
import { buildStudentDockApps } from "../constants/studentDockConfig";
import EmailVerificationModal from "../components/auth/EmailVerificationModal";
import VerifyEmailPromptPopup from "../components/auth/VerifyEmailPromptPopup";
import { isEmailVerified, isVerificationSnoozed, snoozeVerification } from "../utils/verificationStorage";

const Card = ({ children, className = "" }) => (
  <div className={`rounded-2xl border border-gray-100 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] shadow-sm ${className}`}>
    {children}
  </div>
);

const cleanPhone = (val) => {
  if (!val) return "";
  const cleaned = String(val).replace(/\D/g, "");
  if (cleaned.length > 10 && (cleaned.startsWith("91") || cleaned.startsWith("0"))) {
    return cleaned.slice(-10);
  }
  return cleaned.slice(0, 10);
};

const INPUT_CLS = "w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-[#111] px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#0D3A1D] dark:text-gray-200 outline-none focus:border-[#93B733] focus:bg-white dark:focus:bg-[#000] transition-all placeholder:text-gray-400 placeholder:font-normal";

const Field = ({ label, value, onChange, isEditing, type = "text", options, placeholder, span = "" }) => {
  const isPhone = type === "phone" || type === "tel";
  return (
    <div className={span}>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</label>
        {isEditing && isPhone && value && (
          <span className={`text-[10px] font-bold ${value.length === 10 ? "text-emerald-500" : "text-amber-500"}`}>
            {value.length}/10 digits
          </span>
        )}
      </div>
      {isEditing ? (
        type === "select" ? (
          <CustomSelect options={options || []} value={value || ""} onChange={onChange} placeholder={placeholder || "Select..."} />
        ) : type === "college" ? (
          <CollegeCombobox value={value || ""} onChange={onChange} placeholder={placeholder || "Search or type college..."} />
        ) : type === "textarea" ? (
          <textarea value={value || ""} onChange={e => onChange(e.target.value)} rows={2} className={`${INPUT_CLS} resize-none`} placeholder={placeholder} />
        ) : isPhone ? (
          <div className="relative flex items-center">
            <span className="absolute left-3 text-xs font-bold text-gray-400 dark:text-gray-500 pointer-events-none select-none">+91</span>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={value || ""}
              onChange={e => onChange(cleanPhone(e.target.value))}
              className={`${INPUT_CLS} pl-11`}
              placeholder={placeholder || "XXXXXXXXXX"}
            />
          </div>
        ) : (
          <input type={type} value={value || ""} onChange={e => onChange(e.target.value)} className={INPUT_CLS} placeholder={placeholder} />
        )
      ) : (
        <p className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
          {value ? (isPhone ? (value.length === 10 ? `+91 ${value}` : value) : value) : <span className="text-gray-400 font-normal italic">Not provided</span>}
        </p>
      )}
    </div>
  );
};

const DocUpload = ({ label, value, onUpload, onRemove, isEditing }) => (
  <div className="space-y-1.5">
    <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{label}</p>
    {value ? (
      <div className="relative group w-full h-36 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-black/5">
        <img src={value} alt={label} className="w-full h-full object-cover" />
        {isEditing && (
          <button onClick={onRemove} className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-500 text-white shadow hover:scale-110 transition">
            <X size={13} />
          </button>
        )}
      </div>
    ) : (
      <label className="flex flex-col items-center justify-center w-full h-36 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-800 hover:border-[#93B733] bg-gray-50/50 dark:bg-white/[0.02] cursor-pointer transition">
        <Upload size={20} className="text-gray-400 mb-1" />
        <span className="text-[11px] font-bold text-gray-500">Upload {label}</span>
        <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
      </label>
    )}
  </div>
);

const SOCIALS = [
  { key: "instagram", label: "Instagram", colorIcon: "https://img.icons8.com/fluency/48/instagram-new.png", placeholder: "@username", url: v => `https://instagram.com/${v.replace(/^@/, '')}` },
  { key: "linkedin", label: "LinkedIn", colorIcon: "https://img.icons8.com/color/48/linkedin.png", placeholder: "linkedin.com/in/...", url: v => v.startsWith("http") ? v : `https://${v}` },
  { key: "github", label: "GitHub", colorIcon: "https://img.icons8.com/fluency/48/github.png", placeholder: "github.com/...", url: v => v.startsWith("http") ? v : `https://github.com/${v.replace(/^@/, '')}` },
  { key: "twitter", label: "X (Twitter)", colorIcon: "https://img.icons8.com/color/48/twitter--v1.png", placeholder: "@username", url: v => `https://x.com/${v.replace(/^@/, '')}` },
  { key: "website", label: "Website", colorIcon: "https://img.icons8.com/color/48/domain--v1.png", placeholder: "https://...", url: v => v.startsWith("http") ? v : `https://${v}` }
];

const HOBBY_OPTS = ["Reading 📚", "Gym 💪", "Gaming 🎮", "Music 🎵", "Traveling ✈️"];
const INTEREST_OPTS = ["Coding 💻", "AI 🤖", "Startups 🚀", "Photography 📸", "Sports ⚽"];
const VIBES = ["Night Owl 🦉", "Early Bird 🌅", "Party Animal 🎉", "Introvert 🎧", "Extrovert 🗣️", "Fitness Freak 💪", "Foodie 🍕", "Neat Freak ✨"];
const BLOODS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const FOODS = ["Veg", "Non-Veg", "Eggetarian", "Vegan", "Jain"];
const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "PG 1st Year", "PG 2nd Year"];

const StudentDashboard = () => {
  const { token, user } = useContext(AuthContext);
  const fileRef = useRef(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const userKey = user?.id ? `u_${user.id}` : user?.email ? `e_${user.email.replace(/[^a-zA-Z0-9]/g, '_')}` : null;

  const [profile, setProfile] = useState(() => {
    try {
      const p1 = userKey ? JSON.parse(localStorage.getItem(`dormn_student_profile_${userKey}`) || "{}") : {};
      const p2 = userKey ? JSON.parse(localStorage.getItem(`dormn_registration_form_${userKey}`) || "{}") : {};
      return {
        name: user?.full_name || user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        ...p2,
        ...p1
      };
    } catch {
      return {
        name: user?.full_name || user?.name || "",
        email: user?.email || "",
        phone: user?.phone || ""
      };
    }
  });

  const [stats, setStats] = useState({ pending: 0, approved: 0, total: 0 });
  const [bookings, setBookings] = useState([]);
  const [pgList, setPgList] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [toast, setToast] = useState({ show: false, type: "success", title: "", message: "" });
  const toastTimeoutRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [socials, setSocials] = useState({});
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
  const [showVerifyPromptPopup, setShowVerifyPromptPopup] = useState(() => {
    return Boolean(user && !isEmailVerified(user) && !isVerificationSnoozed(user));
  });

  useEffect(() => {
    if (isEmailVerified(user) || isVerificationSnoozed(user)) {
      setShowVerifyPromptPopup(false);
    }
  }, [user?.is_email_verified, user?.auth_provider, user]);

  const handleDismissVerifyPrompt = useCallback(() => {
    snoozeVerification(user, 3);
    setShowVerifyPromptPopup(false);
  }, [user]);

  const handleOpenEmailVerifyModal = useCallback(() => {
    setShowVerifyPromptPopup(false);
    setShowEmailVerificationModal(true);
  }, []);

  const showToast = useCallback((type, message, title = "") => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ show: true, type, message, title });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  }, []);

  const up = (k, v) => setProfile(p => ({ ...p, [k]: v }));
  const upSocial = (k, v) => setSocials(s => ({ ...s, [k]: v }));

  const fetchProfile = useCallback(async () => {
    try {
      const [profRes, bookRes, pgRes] = await Promise.all([
        api.get("/student/profile").catch(() => ({ data: { profile: {} } })),
        api.get("/bookings/my-bookings").catch(() => ({ data: { bookings: [] } })),
        api.get("/pg/all").catch(() => ({ data: { pgs: [] } }))
      ]);

      if (profRes.data?.profile) {
        const f = profRes.data.profile;
        setProfile(prev => {
          const updated = {
            ...prev, ...f,
            name: f.name || prev.name || user?.full_name || "",
            email: f.email || prev.email || user?.email || "",
            phone: f.phone || prev.phone || user?.phone || "",
            isPublic: f.isPublic !== undefined ? f.isPublic : (prev.isPublic ?? true),
          };
          if (userKey) {
            try { localStorage.setItem(`dormn_student_profile_${userKey}`, JSON.stringify(updated)); } catch {}
          }
          return updated;
        });
        setSocials(f.socials || {});
      }

      const raw = Array.isArray(bookRes.data?.bookings || bookRes.data) ? (bookRes.data?.bookings || bookRes.data) : [];
      const map = new Map();
      raw.forEach(item => {
        const k = item.pg_id || item.id;
        if (!map.has(k) || item.status === "approved" || new Date(item.booking_date || 0) > new Date(map.get(k).booking_date || 0)) {
          map.set(k, item);
        }
      });
      const b = Array.from(map.values());
      setBookings(b.slice(0, 5));
      setStats({ total: b.length, pending: b.filter(x => x.status === "pending").length, approved: b.filter(x => x.status === "approved").length });
      setPgList(Array.isArray(pgRes.data?.pgs || pgRes.data) ? (pgRes.data?.pgs || pgRes.data) : []);
    } catch (err) { console.error("Fetch Error:", err); }
  }, [user]);

  useEffect(() => {
    if (token) fetchProfile();
    window.addEventListener("dormn_profile_updated", fetchProfile);
    return () => window.removeEventListener("dormn_profile_updated", fetchProfile);
  }, [token, fetchProfile]);

  const handleFileUpload = (e, fieldKey) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onloadend = () => {
      up(fieldKey, r.result);
      if (fieldKey === "photo" || fieldKey === "passportPhoto") {
        up("photo", r.result);
        up("passportPhoto", r.result);
      }
    };
    r.readAsDataURL(f);
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);

      const phone = cleanPhone(profile.phone || user?.phone || "");
      if (phone && phone.length !== 10) {
        showToast("warning", "Please enter a valid 10-digit Indian mobile number for Tenant Phone.", "Invalid Phone");
        setIsSaving(false);
        return;
      }
      const parent1Phone = cleanPhone(profile.parent1Phone || profile.parent1Contact || "");
      if (parent1Phone && parent1Phone.length !== 10) {
        showToast("warning", "Please enter a valid 10-digit Indian mobile number for Parent 1 Phone.", "Invalid Phone");
        setIsSaving(false);
        return;
      }
      const parent2Phone = cleanPhone(profile.parent2Phone || profile.parent2Contact || "");
      if (parent2Phone && parent2Phone.length !== 10) {
        showToast("warning", "Please enter a valid 10-digit Indian mobile number for Parent 2 Phone.", "Invalid Phone");
        setIsSaving(false);
        return;
      }
      const guardianPhone = cleanPhone(profile.guardianPhone || "");
      if (guardianPhone && guardianPhone.length !== 10) {
        showToast("warning", "Please enter a valid 10-digit Indian mobile number for Guardian Phone.", "Invalid Phone");
        setIsSaving(false);
        return;
      }

      const payload = {
        ...profile,
        socials,
        name: profile.name || profile.fullName || user?.full_name || "",
        fullName: profile.name || profile.fullName || user?.full_name || "",
        phone,
        parent1Phone,
        parent1Contact: parent1Phone,
        parent2Phone,
        parent2Contact: parent2Phone,
        guardianPhone,
        isPublic: profile.isPublic ?? true,
      };
      await api.post("/student/profile", payload);
      if (userKey) {
        localStorage.setItem(`dormn_student_profile_${userKey}`, JSON.stringify(payload));
        localStorage.setItem(`dormn_registration_form_${userKey}`, JSON.stringify(payload));
      }
      localStorage.removeItem("dormn_student_profile");
      localStorage.removeItem("dormn_registration_form");
      window.dispatchEvent(new Event("dormn_profile_updated"));
      setIsEditing(false);
      showToast("success", "Profile saved & synced with registration forms!", "Saved Successfully");
    } catch (err) {
      console.error("Save Profile Error:", err);
      const msg = err.response?.data?.message || err.message || "Failed to save profile. Please try again.";
      showToast("error", msg, "Save Failed");
    } finally { setIsSaving(false); }
  };

  const togglePrivacy = async () => {
    const nextVal = !(profile.isPublic ?? true);
    up("isPublic", nextVal);
    try {
      await api.post("/student/profile", { ...profile, isPublic: nextVal });
      if (userKey) {
        localStorage.setItem(`dormn_student_profile_${userKey}`, JSON.stringify({ ...profile, isPublic: nextVal }));
        localStorage.setItem(`dormn_registration_form_${userKey}`, JSON.stringify({ ...profile, isPublic: nextVal }));
      }
      localStorage.removeItem("dormn_student_profile");
      localStorage.removeItem("dormn_registration_form");
      window.dispatchEvent(new Event("dormn_profile_updated"));
      showToast("success", nextVal ? "Profile is now visible to PG owners." : "Profile is now private and hidden.", nextVal ? "Set to Public" : "Set to Private");
    } catch (e) {
      console.error(e);
      showToast("error", "Failed to update profile privacy.", "Error");
    }
  };

  const name = profile.name || profile.fullName || user?.full_name || "Student";
  const initial = name.charAt(0).toUpperCase();
  const DOCK_APPS = useMemo(() => buildStudentDockApps(user?.id), [user?.id]);
  const isPublic = profile.isPublic ?? true;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9f3] to-[#f0f1eb] dark:from-[#0a0a0a] dark:to-[#050505] pb-28">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 border-b border-gray-200/40 dark:border-gray-800/40 bg-white/70 dark:bg-black/70 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1600px] h-14 items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo-sm.webp" alt="Dormn" className="h-7 w-7 object-contain" />
            <span className="text-base font-black text-[#0D3A1D] dark:text-gray-200 tracking-tight">Dormn</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeSwitch />
            <div className="relative" ref={menuRef}>
              <button onClick={() => setShowMenu(p => !p)} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 overflow-hidden hover:border-[#93B733] transition-all">
                {profile.photo || profile.passportPhoto ? <img src={profile.photo || profile.passportPhoto} alt="User" className="h-full w-full object-cover" /> : <span className="text-sm font-bold text-[#0D3A1D] dark:text-gray-200">{initial}</span>}
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-black shadow-lg py-1.5 z-50">
                  <Link to="/my-pg" className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#0D3A1D] dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900"><Building2 size={16} /> My PG</Link>
                  <Link to="/pgs" className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#0D3A1D] dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900"><Search size={16} /> Explore PGs</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-4 sm:px-8 py-8">
        <div className="flex flex-col lg:flex-row items-start gap-6 w-full">
          
          {/* ── LEFT COLUMN: SOCIAL CONNECT (Desktop) ── */}
          <div className="hidden lg:block lg:w-[280px] shrink-0 order-1 space-y-6">
            <Card className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Social Connect</h3>
                {!isEditing && <button onClick={() => setIsEditing(true)} className="text-xs font-bold text-[#93B733] hover:underline flex items-center gap-1"><Pencil size={12} /> Manage</button>}
              </div>
              <div className="flex flex-col gap-3.5">
                {SOCIALS.map(({ key, label, colorIcon, placeholder, url }) => {
                  const val = socials[key];
                  const href = val ? url(val) : null;
                  return isEditing ? (
                    <div key={key} className="flex items-center gap-2.5 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/60 px-3 py-2">
                      <img src={colorIcon} alt={label} className="w-5 h-5 object-contain shrink-0" />
                      <input value={socials[key] || ""} onChange={e => upSocial(key, e.target.value)} placeholder={placeholder} className="w-full bg-transparent text-xs font-semibold text-[#0D3A1D] dark:text-gray-100 outline-none placeholder:text-gray-400" />
                    </div>
                  ) : (
                    <div key={key} className="flex items-center gap-3 group">
                      <a href={href || "#"} target={href ? "_blank" : "_self"} rel="noreferrer" onClick={!href ? () => setIsEditing(true) : undefined} className={`shrink-0 transition-transform hover:scale-105 ${!href ? 'opacity-40 grayscale group-hover:grayscale-0' : ''}`}>
                        <img src={colorIcon} alt={label} className="w-8 h-8 object-contain" />
                      </a>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase text-gray-400">{label}</p>
                        <p className="text-xs font-bold text-[#0D3A1D] dark:text-gray-200 truncate">{val || <span className="text-gray-400 font-normal">Add link</span>}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* ── MIDDLE COLUMN: PROFILE DETAILS ── */}
          <div className="flex-1 min-w-0 space-y-6 order-1 lg:order-2 w-full">
            
            {/* Hero & Privacy Card */}
            <Card className="p-6 sm:p-10">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div className="relative shrink-0">
                  <button onClick={() => fileRef.current?.click()} className="group relative flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center rounded-full border-4 border-white dark:border-black bg-gray-100 dark:bg-gray-900 shadow-lg overflow-hidden transition-transform hover:scale-105">
                    {profile.photo || profile.passportPhoto ? <img src={profile.photo || profile.passportPhoto} alt="Profile" className="h-full w-full object-cover" /> : <span className="text-4xl font-black text-[#0D3A1D]/20 dark:text-gray-200/20">{initial}</span>}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"><Camera size={22} className="text-white" /></div>
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "passportPhoto")} className="hidden" />
                </div>

                <div className="flex-1 text-center sm:text-left w-full pt-1">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-black text-[#0D3A1D] dark:text-gray-100 tracking-tight">{name}</h1>
                      <p className="text-xs sm:text-sm font-semibold text-gray-400">{profile.email || user?.email}</p>
                    </div>
                    <button onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)} disabled={isSaving} className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${isEditing ? "bg-[#93B733] hover:bg-[#83a42d] text-white shadow" : "border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-[#93B733]/60"}`}>
                      {isSaving ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" /> : isEditing ? <><Check size={14} /> Save Profile</> : <><Pencil size={14} /> Edit Profile</>}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-3 justify-center sm:justify-start">
                    {isEditing ? (
                      <>
                        <CustomSelect options={["Student", "Working Professional"]} value={profile.userType === "professional" ? "Working Professional" : "Student"} onChange={val => up("userType", val === "Working Professional" ? "professional" : "student")} className="w-full sm:!w-44 shrink-0" />
                        {profile.userType === "professional" ? (
                          <input value={profile.company || profile.workplaceName || ""} onChange={e => { up("company", e.target.value); up("workplaceName", e.target.value); }} placeholder="Company..." className={INPUT_CLS + " w-full sm:!w-56"} />
                        ) : (
                          <div className="w-full sm:w-64">
                            <CollegeCombobox value={profile.college || profile.collegeName || ""} onChange={val => { up("college", val); up("collegeName", val); }} placeholder="Search or type college..." />
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="rounded-full bg-amber-50 dark:bg-amber-900/20 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-400">{profile.userType === "professional" ? "💼 Professional" : "🎓 Student"}</span>
                        <span className="rounded-full bg-blue-50 dark:bg-blue-900/20 px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-400">🏛️ {profile.userType === "professional" ? (profile.company || profile.workplaceName || "Add Workplace") : (profile.college || profile.collegeName || "Add College")}</span>
                        <span className="rounded-full bg-[#93B733]/10 dark:bg-[#93B733]/20 px-3 py-1 text-xs font-bold text-[#4E700F] dark:text-[#93B733]">{profile.currentPG || (bookings.find(x => x.status === 'approved') ? `🏠 Staying at: ${bookings.find(x => x.status === 'approved')?.title || bookings.find(x => x.status === 'approved')?.pg_name}` : "🏠 Not in any PG")}</span>
                      </>
                    )}
                  </div>

                  <div className="mt-3">
                    {isEditing ? <textarea value={profile.bio || ""} onChange={e => up("bio", e.target.value)} placeholder="Short bio..." rows={2} className={`${INPUT_CLS} resize-none`} /> : <p className="text-xs sm:text-sm font-medium text-gray-500">{profile.bio || <i className="text-gray-400">No bio added yet. Tap Edit Profile to add one!</i>}</p>}
                  </div>
                </div>
              </div>

              {/* Privacy Banner */}
              <div className={`mt-6 rounded-2xl border p-4 transition-all ${isPublic ? "border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20" : "border-purple-200 dark:border-purple-800/40 bg-purple-50/50 dark:bg-purple-950/20"}`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl shrink-0 ${isPublic ? "bg-emerald-500/15 text-emerald-600" : "bg-purple-500/15 text-purple-600"}`}>{isPublic ? <Globe size={18} /> : <Lock size={18} />}</div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white">Profile Privacy: <span className={isPublic ? "text-emerald-600 dark:text-emerald-400" : "text-purple-600 dark:text-purple-400"}>{isPublic ? "Public" : "Private"}</span></h4>
                      <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 mt-0.5">{isPublic ? "When Public: Owner only sees Name, Phone, and College / Workplace info. KYC docs and home address stay protected." : "When Private: No owner or user can view your personal details."}</p>
                    </div>
                  </div>
                  <button type="button" onClick={togglePrivacy} className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black shadow-sm text-white ${isPublic ? "bg-emerald-600 hover:bg-emerald-500" : "bg-purple-600 hover:bg-purple-500"}`}>
                    {isPublic ? <Eye size={13} /> : <EyeOff size={13} />} Switch to {isPublic ? "Private" : "Public"}
                  </button>
                </div>
              </div>
            </Card>

            {/* Section 1: Tenant Details */}
            <Card className="p-6 sm:p-8">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#0D3A1D] dark:text-gray-200 mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2.5"><User size={15} className="text-[#93B733]" /> 1. Tenant & Permanent Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                <Field label="Full Name" value={profile.name || profile.fullName} onChange={v => { up("name", v); up("fullName", v); }} isEditing={isEditing} placeholder="Full Legal Name" />
                <Field label="Phone Number" value={profile.phone} onChange={v => up("phone", v)} isEditing={isEditing} type="phone" placeholder="XXXXXXXXXX" />
                <Field label="Date of Birth" value={profile.dob} onChange={v => up("dob", v)} isEditing={isEditing} type="date" />
                <Field label="Gender" value={profile.gender} onChange={v => up("gender", v)} isEditing={isEditing} type="select" options={["Male", "Female", "Other"]} />
                <Field label="Hometown" value={profile.homeTown || profile.hometown} onChange={v => { up("homeTown", v); up("hometown", v); }} isEditing={isEditing} placeholder="e.g. Hyderabad" />
                <Field label="Pincode" value={profile.pincode} onChange={v => up("pincode", v)} isEditing={isEditing} placeholder="e.g. 500001" />
                <Field label="Permanent Home Address" value={profile.homeAddress} onChange={v => up("homeAddress", v)} isEditing={isEditing} type="textarea" placeholder="Full home address..." span="sm:col-span-2 lg:col-span-3" />
              </div>
            </Card>

            {/* Section 2: Parents & Emergency Contacts */}
            <Card className="p-6 sm:p-8">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#0D3A1D] dark:text-gray-200 mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2.5"><Users size={15} className="text-blue-500" /> 2. Parent & Emergency Contacts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.02] p-3.5 space-y-2.5">
                  <p className="text-xs font-black uppercase text-gray-700 dark:text-gray-300">Parent / Guardian 1</p>
                  <Field label="Name" value={profile.parent1Name} onChange={v => up("parent1Name", v)} isEditing={isEditing} placeholder="Parent 1 Name" />
                  <Field label="Phone" value={profile.parent1Phone || profile.parent1Contact} onChange={v => { up("parent1Phone", v); up("parent1Contact", v); }} isEditing={isEditing} type="phone" placeholder="XXXXXXXXXX" />
                </div>
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.02] p-3.5 space-y-2.5">
                  <p className="text-xs font-black uppercase text-gray-700 dark:text-gray-300">Parent / Guardian 2</p>
                  <Field label="Name" value={profile.parent2Name} onChange={v => up("parent2Name", v)} isEditing={isEditing} placeholder="Parent 2 Name" />
                  <Field label="Phone" value={profile.parent2Phone || profile.parent2Contact} onChange={v => { up("parent2Phone", v); up("parent2Contact", v); }} isEditing={isEditing} type="phone" placeholder="XXXXXXXXXX" />
                </div>
                <div className="md:col-span-2 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.02] p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Field label="Local Guardian Name (Optional)" value={profile.guardianName} onChange={v => up("guardianName", v)} isEditing={isEditing} placeholder="Guardian Name" />
                  <Field label="Guardian Phone" value={profile.guardianPhone} onChange={v => up("guardianPhone", v)} isEditing={isEditing} type="phone" placeholder="XXXXXXXXXX" />
                </div>
              </div>
            </Card>

            {/* Section 3: Academic & Career */}
            <Card className="p-6 sm:p-8">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#0D3A1D] dark:text-gray-200 mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2.5"><FileText size={15} className="text-purple-500" /> 3. Academic & Career Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                <Field label="Occupation Type" value={profile.userType === "professional" ? "Working Professional" : "Student"} onChange={v => up("userType", v === "Working Professional" ? "professional" : "student")} isEditing={isEditing} type="select" options={["Student", "Working Professional"]} />
                {profile.userType === "professional" ? (
                  <>
                    <Field label="Company Name" value={profile.company || profile.workplaceName} onChange={v => { up("company", v); up("workplaceName", v); }} isEditing={isEditing} placeholder="Workplace / Company" />
                    <Field label="Designation" value={profile.designation} onChange={v => up("designation", v)} isEditing={isEditing} placeholder="e.g. Software Engineer" />
                  </>
                ) : (
                  <>
                    <Field label="College / University" value={profile.college || profile.collegeName} onChange={v => { up("college", v); up("collegeName", v); }} isEditing={isEditing} type="college" placeholder="Search or type college name..." span="sm:col-span-2" />
                    <Field label="Course Name" value={profile.courseName} onChange={v => up("courseName", v)} isEditing={isEditing} placeholder="e.g. B.Tech CSE" />
                    <Field label="Course Year" value={profile.courseYear} onChange={v => up("courseYear", v)} isEditing={isEditing} type="select" options={YEARS} />
                    <Field label="Admission Year" value={profile.admissionYear} onChange={v => up("admissionYear", v)} isEditing={isEditing} placeholder="e.g. 2024" />
                    <Field label="College ID Number" value={profile.collegeIdNumber} onChange={v => up("collegeIdNumber", v)} isEditing={isEditing} placeholder="e.g. A12345678" />
                  </>
                )}
              </div>
            </Card>

            {/* Section 4: Medical & Dietary */}
            <Card className="p-6 sm:p-8">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#0D3A1D] dark:text-gray-200 mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2.5"><HeartPulse size={15} className="text-rose-500" /> 4. Medical & Dietary Preferences</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Field label="Blood Group" value={profile.bloodGroup} onChange={v => up("bloodGroup", v)} isEditing={isEditing} type="select" options={BLOODS} />
                <Field label="Food Preference" value={profile.foodPreference || "Veg"} onChange={v => up("foodPreference", v)} isEditing={isEditing} type="select" options={FOODS} />
                <Field label="Allergies" value={profile.allergies} onChange={v => up("allergies", v)} isEditing={isEditing} placeholder="e.g. Peanuts, dust" span="sm:col-span-2" />
                <Field label="Medical Details / Notes" value={profile.medicalDetails} onChange={v => up("medicalDetails", v)} isEditing={isEditing} type="textarea" placeholder="Medical conditions..." span="sm:col-span-2" />
              </div>
            </Card>

            {/* Section 5: KYC Documents */}
            <Card className="p-6 sm:p-8">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#0D3A1D] dark:text-gray-200 mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2.5"><FileText size={15} className="text-emerald-500" /> 5. KYC Verification Documents</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <DocUpload label="Passport Photo" value={profile.passportPhoto || profile.photo} onUpload={e => handleFileUpload(e, "passportPhoto")} onRemove={() => { up("passportPhoto", null); up("photo", null); }} isEditing={isEditing} />
                <DocUpload label="Aadhaar (Front)" value={profile.aadharFront} onUpload={e => handleFileUpload(e, "aadharFront")} onRemove={() => up("aadharFront", null)} isEditing={isEditing} />
                <DocUpload label="Aadhaar (Back)" value={profile.aadharBack} onUpload={e => handleFileUpload(e, "aadharBack")} onRemove={() => up("aadharBack", null)} isEditing={isEditing} />
              </div>
            </Card>

            {/* Section 6: Personality & Vibe */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-5 sm:p-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2.5 flex items-center gap-1.5"><Gamepad2 size={14} className="text-[#93B733]" /> Hobbies</h3>
                {isEditing ? <TagInput tags={profile.hobbies || []} onChange={v => up("hobbies", v)} placeholder="Add hobby..." options={HOBBY_OPTS} color="#93B733" /> : <div className="flex flex-wrap gap-1.5">{(profile.hobbies || []).length > 0 ? profile.hobbies.map(h => <span key={h} className="rounded-full bg-[#93B733]/10 text-[#4E700F] px-2.5 py-1 text-xs font-bold">{h}</span>) : <p className="text-xs text-gray-400 italic">None</p>}</div>}
              </Card>

              <Card className="p-5 sm:p-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2.5 flex items-center gap-1.5"><Code size={14} className="text-purple-500" /> Interests</h3>
                {isEditing ? <TagInput tags={profile.interests || []} onChange={v => up("interests", v)} placeholder="Add interest..." options={INTEREST_OPTS} color="#A855F7" /> : <div className="flex flex-wrap gap-1.5">{(profile.interests || []).length > 0 ? profile.interests.map(i => <span key={i} className="rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2.5 py-1 text-xs font-bold">{i}</span>) : <p className="text-xs text-gray-400 italic">None</p>}</div>}
              </Card>

              <Card className="p-5 sm:p-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2.5 flex items-center gap-1.5"><Brain size={14} className="text-amber-500" /> Vibe / Mindset</h3>
                {isEditing ? <CustomSelect options={VIBES} value={profile.vibe || ""} onChange={val => up("vibe", val)} placeholder="Select vibe..." /> : <p className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300">{profile.vibe || <i className="text-gray-400 font-normal">Add vibe</i>}</p>}
              </Card>
            </div>

            {/* Mobile Social Connect */}
            <Card className="lg:hidden p-5 overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black uppercase text-gray-500">Social Connect</h3>
                {!isEditing && <button onClick={() => setIsEditing(true)} className="text-xs font-bold text-[#93B733] flex items-center gap-1"><Pencil size={12} /> Edit</button>}
              </div>
              <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide items-center">
                {SOCIALS.map(({ key, label, colorIcon, url }) => {
                  const val = socials[key];
                  const href = val ? url(val) : null;
                  return (
                    <a key={key} href={href || "#"} target={href ? "_blank" : "_self"} rel="noreferrer" onClick={!href ? () => setIsEditing(true) : undefined} className={`flex flex-col items-center gap-1 shrink-0 ${!href ? 'opacity-40 grayscale' : ''}`}>
                      <img src={colorIcon} alt={label} className="w-8 h-8 object-contain" />
                      <span className="text-[9px] font-bold text-gray-500 uppercase">{label}</span>
                    </a>
                  );
                })}
              </div>
            </Card>

            {/* Bookings & Stats */}
            {!isEditing && (
              <>
                <div className="grid grid-cols-3 gap-3.5">
                  {[
                    { l: "Pending", v: stats.pending, Icon: Clock, c: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
                    { l: "Approved", v: stats.approved, Icon: CheckCircle, c: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
                    { l: "Total", v: stats.total, Icon: BookOpen, c: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
                  ].map(({ l, v, Icon, c, bg }) => (
                    <Card key={l} className="p-4 text-center">
                      <div className={`mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg ${bg} ${c}`}><Icon size={16} /></div>
                      <p className="text-xl font-black text-[#0D3A1D] dark:text-gray-100">{v}</p>
                      <p className="text-[10px] font-bold uppercase text-gray-400">{l}</p>
                    </Card>
                  ))}
                </div>

                <div className="lg:hidden w-full"><MobileSponsoredSlider pgList={pgList} /></div>

                <Card className="p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm sm:text-base font-black text-[#0D3A1D] dark:text-gray-100">Recent Bookings</h2>
                    <Link to="/my-bookings" className="text-xs font-bold text-[#93B733] hover:underline flex items-center gap-0.5">View All <ChevronRight size={14} /></Link>
                  </div>
                  {bookings.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800 p-8 text-center">
                      <p className="text-xs font-bold text-gray-400 mb-2">No bookings yet</p>
                      <Link to="/pgs" className="inline-block rounded-lg bg-[#93B733] px-4 py-2 text-xs font-bold text-white">Explore PGs</Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {bookings.map(b => (
                        <div key={b.id} className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-gray-100 dark:border-[#1a1a1a] bg-white dark:bg-[#0f0f0f]">
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-black text-[#0D3A1D] dark:text-gray-200 truncate">{b.pg_name || b.title || `PG #${b.pg_id}`}</h4>
                            <p className="text-[11px] text-gray-400">{b.booking_date ? new Date(b.booking_date).toLocaleDateString() : "Recently"}</p>
                          </div>
                          <StatusBadge status={b.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </>
            )}

            {/* Sticky Save Bar */}
            {isEditing && (
              <div className="sticky bottom-20 z-30 flex items-center justify-between gap-4 rounded-2xl bg-[#0D3A1D] text-white p-4 shadow-2xl border border-[#93B733]/40 animate-fade-in">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-[#93B733]" />
                  <div>
                    <p className="text-xs font-black">Unsaved Changes</p>
                    <p className="text-[10px] text-gray-300">Syncs immediately with Registration & KYC Form</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 rounded-xl text-xs font-bold text-gray-300 hover:text-white">Cancel</button>
                  <button onClick={handleSaveProfile} disabled={isSaving} className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-[#93B733] hover:bg-[#83a42d] text-white text-xs font-black shadow">
                    {isSaving ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save size={13} />}
                    <span>{isSaving ? "Saving..." : "Save & Sync"}</span>
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* ── RIGHT COLUMN: FEATURED ACCOMMODATIONS (Desktop) ── */}
          <div className="hidden lg:block lg:w-[320px] xl:w-[350px] shrink-0 order-3">
             <SlidingPgPageSidebar pgList={pgList} />
          </div>

        </div>
      </div>

      {/* Floating Toast Notification */}
      {toast.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-top-4 max-w-[92vw] sm:max-w-md bg-white/95 dark:bg-[#121212]/95 text-gray-900 dark:text-white border-gray-200 dark:border-[#222]">
          {toast.type === "success" && (
            <div className="w-8 h-8 rounded-xl bg-[#93B733]/20 text-[#93B733] flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
          )}
          {toast.type === "error" && (
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
              <AlertCircle size={18} />
            </div>
          )}
          {toast.type === "warning" && (
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            {toast.title && <p className="text-xs font-black tracking-tight leading-tight mb-0.5">{toast.title}</p>}
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300 break-words">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast(prev => ({ ...prev, show: false }))}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="fixed bottom-4 left-0 right-0 z-30 flex justify-center pointer-events-none">
        <div className="pointer-events-auto">
          <MacOSDock apps={DOCK_APPS} onAppClick={k => navigate(k)} openApps={["/student/dashboard"]} />
        </div>
      </div>

      {/* Email Verification Prompt Popup (Appears as a popup modal on dashboard) */}
      <VerifyEmailPromptPopup
        isOpen={showVerifyPromptPopup}
        userEmail={user?.email}
        onClose={handleDismissVerifyPrompt}
        onLater={handleDismissVerifyPrompt}
        onVerify={handleOpenEmailVerifyModal}
      />

      {/* Email Verification OTP Modal (10-minute validity) */}
      <EmailVerificationModal
        isOpen={showEmailVerificationModal}
        onClose={() => setShowEmailVerificationModal(false)}
        userEmail={user?.email}
        title="Verify your email to book PG"
        description="Please enter the 6-digit code sent to your email to verify your account and unlock PG reservations."
        onSuccess={() => {
          setShowEmailVerificationModal(false);
          showToast("success", "Your email has been verified! You can now book PGs and events.", "Email Verified");
        }}
      />
    </div>
  );
};

export default memo(StudentDashboard);


