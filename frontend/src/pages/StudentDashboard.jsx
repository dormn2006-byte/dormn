import { useState, useEffect, useContext, useRef, memo, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { 
  Camera, Pencil, Check, Home, Search, ShieldCheck,
  Brain, Clock, CheckCircle, BookOpen, ChevronRight,
  Phone, GraduationCap, MapPin, AlertCircle,
  Code, Gamepad2, LayoutDashboard, Calendar, Settings, User, Heart, Building2
} from "lucide-react";
import { Camera as CameraIcon, Briefcase, GitBranch, MessageCircle, Globe } from "lucide-react";

import ThemeSwitch from "../components/ui/theme-switch-button";
import CustomSelect from "../components/ui/CustomSelect";
import TagInput from "../components/ui/TagInput";
import StatusBadge from "../components/ui/StatusBadge";
import MacOSDock from "../components/ui/mac-os-dock";
import SlidingPgPageSidebar, { MobileSponsoredSlider } from "../components/dashboard/FeaturedSidebar";
import { buildStudentDockApps } from "../constants/studentDockConfig";

const SectionCard = ({ children, className = "" }) => (
  <div className={`rounded-2xl border border-gray-100 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] shadow-sm ${className}`}>
    {children}
  </div>
);

const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram", icon: CameraIcon, colorIcon: "https://img.icons8.com/fluency/48/instagram-new.png", placeholder: "@username" },
  { key: "linkedin", label: "LinkedIn", icon: Briefcase, colorIcon: "https://img.icons8.com/color/48/linkedin.png", placeholder: "linkedin.com/in/..." },
  { key: "github", label: "GitHub", icon: GitBranch, colorIcon: "https://img.icons8.com/fluency/48/github.png", placeholder: "github.com/..." },
  { key: "twitter", label: "X (Twitter)", icon: MessageCircle, colorIcon: "https://img.icons8.com/color/48/twitter--v1.png", placeholder: "@username" },
  { key: "website", label: "Website", icon: Globe, colorIcon: "https://img.icons8.com/color/48/domain--v1.png", placeholder: "https://..." }
];

const CONTACT_FIELDS = [
  { key: "phone", label: "Phone", icon: Phone, iconColor: "text-blue-500", type: "text", placeholder: "+91 ..." },
  { key: "course", label: "Course / Branch", icon: GraduationCap, iconColor: "text-purple-500", type: "text", placeholder: "B.Tech CSE" },
  { key: "city", label: "Native City", icon: MapPin, iconColor: "text-emerald-500", type: "text", placeholder: "Delhi" },
  { key: "emergencyContact", label: "Emergency Contact", icon: AlertCircle, iconColor: "text-red-500", type: "text", placeholder: "+91 ..." }
];

const PERSONALITY_SECTIONS = [
  { key: "hobbies", label: "Hobbies", icon: Gamepad2, iconColor: "text-[#93B733]", color: "#93B733", tagBg: "bg-[#93B733]/10", tagText: "text-[#4E700F]", placeholder: "Add hobby...", options: ["Reading 📚", "Gym 💪", "Gaming 🎮", "Music 🎵", "Traveling ✈️"] },
  { key: "interests", label: "Interests", icon: Code, iconColor: "text-purple-500", color: "#A855F7", tagBg: "bg-purple-100", tagText: "text-purple-700", placeholder: "Add interest...", options: ["Coding 💻", "AI 🤖", "Startups 🚀", "Photography 📸", "Sports ⚽"] }
];

const VIBE_OPTIONS = ["Night Owl 🦉", "Early Bird 🌅", "Party Animal 🎉", "Introvert 🎧", "Extrovert 🗣️", "Fitness Freak 💪", "Foodie 🍕", "Neat Freak ✨"];

const INPUT_STYLE = "w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-[#111] px-4 py-2.5 text-sm sm:text-base font-semibold text-[#0D3A1D] dark:text-gray-200 outline-none focus:border-[#93B733] focus:bg-white dark:focus:bg-[#000] transition-all placeholder:text-gray-400 placeholder:font-medium";



const StudentDashboard = () => {
  const { token, user } = useContext(AuthContext);
  const fileRef = useRef(null);
  
  const [profile, setProfile] = useState({});
  const [stats, setStats] = useState({ pending: 0, approved: 0, total: 0 });
  const [bookings, setBookings] = useState([]);
  const [pgList, setPgList] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const [socials, setSocials] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profRes, bookRes, pgRes] = await Promise.all([
          api.get("/student/profile").catch(() => ({ data: { profile: {} } })),
          api.get("/bookings/my-bookings").catch(() => ({ data: { bookings: [] } })),
          api.get("/pg/all").catch(() => ({ data: { pgs: [] } }))
        ]);
        
        setProfile(profRes.data?.profile || {});
        setSocials(profRes.data?.profile?.socials || {});
        
        const rawB = bookRes.data?.bookings || bookRes.data || [];
        const rawArray = Array.isArray(rawB) ? rawB : [];
        
        // Deduplicate per PG
        const uniqueMap = new Map();
        rawArray.forEach((item) => {
          const key = item.pg_id || item.id;
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, item);
          } else {
            const existing = uniqueMap.get(key);
            if (item.status === "approved" && existing.status !== "approved") {
              uniqueMap.set(key, item);
            } else if (new Date(item.booking_date || item.created_at || 0) > new Date(existing.booking_date || existing.created_at || 0)) {
              uniqueMap.set(key, item);
            }
          }
        });
        const b = Array.from(uniqueMap.values());

        setBookings(b.slice(0, 5));
        setStats({
          total: b.length,
          pending: b.filter(x => x.status === "pending").length,
          approved: b.filter(x => x.status === "approved").length
        });
        
        const rawPGs = pgRes.data?.pgs || pgRes.data || [];
        setPgList(Array.isArray(rawPGs) ? rawPGs : []);
      } catch (err) {
        console.error("Student Dashboard Fetch Error:", err);
      }
    };
    if (token) fetchData();
  }, [token]);

  const navigate = useNavigate();
  const up = (k, v) => setProfile(p => ({ ...p, [k]: v }));
  const upSocial = (k, v) => setSocials(s => ({ ...s, [k]: v }));
  const handlePhoto = () => {};
  const handleDock = (id) => navigate(id);

  const name = profile.name || user?.name || "Student";
  const initial = name.charAt(0).toUpperCase();

  // Build dock apps with WebP icons — profile avatar is permanent per user ID
  const DOCK_APPS = useMemo(() => buildStudentDockApps(user?.id), [user?.id]);
  const currentDbPG = profile.currentPG;

  const renderContactField = (field) => {
    const label = field.label;
    const isEditingField = isEditing;
    const val = profile[field.key] || "";
    const Icon = field.icon;
    const editContent = <input type={field.type} value={val} onChange={e => up(field.key, e.target.value)} placeholder={field.placeholder} className={INPUT_STYLE + " mt-2"} />;
    const viewContent = <p className="mt-1.5 text-sm sm:text-base font-semibold text-[#0D3A1D] dark:text-gray-200 truncate">{val || <span className="text-gray-400 dark:text-gray-500 italic font-medium">Not provided</span>}</p>;

    return (
      <div key={field.key} className="rounded-xl border border-gray-100 dark:border-[#1a1a1a] bg-gray-50/50 dark:bg-[#0f0f0f] p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-1">
          <Icon size={14} className={field.iconColor} />
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</span>
        </div>
        {isEditingField ? editContent : viewContent}
      </div>
    );
  };

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
                {profile.photo ? <img src={profile.photo} alt="User" className="h-full w-full object-cover" /> : <span className="text-sm font-bold text-[#0D3A1D] dark:text-gray-200">{initial}</span>}
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-black shadow-lg py-1.5 z-50">
                  <Link to="/my-pg" className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-[#0D3A1D] dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                    <Building2 size={16} /> My PG
                  </Link>
                  <Link to="/pgs" className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-[#0D3A1D] dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                    <Search size={16} /> Explore PGs
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-4 sm:px-8 py-8">
        {/* ══════ MAIN DASHBOARD COLUMNS ══════ */}
        <div className="flex flex-col lg:flex-row items-start gap-6 w-full">
          
          {/* ══════ LEFT COLUMN: SOCIAL CONNECT (Desktop) ══════ */}
          <div className="hidden lg:block lg:w-[280px] shrink-0 order-1 space-y-6">
            <SectionCard className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  SOCIAL CONNECT
                </h3>
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="text-xs font-bold text-[#93B733] hover:underline flex items-center gap-1">
                    <Pencil size={12} /> Manage Handles
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="grid grid-cols-1 gap-3.5">
                  {SOCIAL_PLATFORMS.map(({ key, label, icon: AppIcon, placeholder }) => (
                    <div key={key} className="flex items-center gap-3 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/60 px-3.5 py-2.5 transition-all focus-within:border-[#93B733] focus-within:bg-white dark:focus-within:bg-[#000] focus-within:shadow-sm">
                      <div className="scale-75 origin-left shrink-0">
                        <AppIcon />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</p>
                        <input
                          value={socials[key] || ""}
                          onChange={e => upSocial(key, e.target.value)}
                          placeholder={placeholder}
                          className="w-full bg-transparent text-xs font-semibold text-[#0D3A1D] dark:text-gray-100 outline-none placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-4 pt-1 pb-1">
                  {SOCIAL_PLATFORMS.map(({ key, label, colorIcon, placeholder }) => {
                    const val = socials[key];
                    const href = val ? (val.startsWith("http") ? val : key === "instagram" || key === "twitter" ? `https://${key === "instagram" ? "instagram.com" : "x.com"}/${val.replace(/^@/, '')}` : `https://${val}`) : null;
                    const displayVal = val ? (val.startsWith("@") || val.startsWith("http") ? val : `@${val}`) : placeholder;

                    return (
                      <div key={key} className="flex flex-row items-center gap-3 w-full group">
                        {href ? (
                          <a href={href} target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-105 shrink-0">
                            <img src={colorIcon} alt={label} className="w-12 h-12 object-contain drop-shadow-sm" />
                          </a>
                        ) : (
                          <button onClick={() => setIsEditing(true)} className="transition-transform hover:scale-105 shrink-0 opacity-50 hover:opacity-100">
                            <img src={colorIcon} alt={label} className="w-12 h-12 object-contain drop-shadow-sm grayscale group-hover:grayscale-0 transition-all" />
                          </button>
                        )}
                        <div className="min-w-0 flex-1 text-left">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 leading-tight mb-0.5">{label}</p>
                          {href ? (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-[#0D3A1D] dark:text-gray-200 hover:text-[#93B733] hover:underline truncate block">
                              {displayVal}
                            </a>
                          ) : (
                            <button onClick={() => setIsEditing(true)} className="text-sm font-bold text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 truncate block text-left w-full transition-colors">
                              {displayVal}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </div>

          {/* ══════ MIDDLE COLUMN: PROFILE HERO & DETAILS ══════ */}
          <div className="flex-1 min-w-0 space-y-6 order-1 lg:order-2 w-full">
            <SectionCard className="p-0 overflow-hidden">
              <div className="px-8 sm:px-10 pb-8 pt-8 sm:pt-10">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  <div className="relative shrink-0 z-10">
                    <button onClick={() => fileRef.current?.click()}
                      className="group relative flex h-32 w-32 sm:h-36 sm:w-36 items-center justify-center rounded-full border-4 border-white dark:border-black bg-gray-100 dark:bg-gray-900 shadow-lg overflow-hidden transition-transform hover:scale-[1.02]">
                      {profile.photo
                        ? <img src={profile.photo} alt="Profile" className="h-full w-full object-cover" />
                        : <span className="text-4xl font-black text-[#0D3A1D]/15 dark:text-gray-200/15">{initial}</span>}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                        <Camera size={22} className="text-white" />
                      </div>
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                  </div>

                  <div className="flex-1 text-center sm:text-left w-full pt-3">
                    <div className="flex items-center justify-center sm:justify-between gap-3">
                      <div>
                        <h1 className="text-3xl sm:text-4xl font-black text-[#0D3A1D] dark:text-gray-100 tracking-tight leading-tight">{name}</h1>
                        <p className="text-xs sm:text-sm font-semibold text-gray-400 mt-1">{user?.email}</p>
                      </div>
                      <button onClick={() => setIsEditing(p => !p)}
                        className={`hidden sm:flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-bold transition-all ${
                          isEditing ? "bg-[#93B733] text-white shadow-sm" : "border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-[#93B733]/40 hover:text-[#0D3A1D] dark:hover:text-gray-200"
                        }`}>
                        {isEditing ? <><Check size={13} /> Save Profile</> : <><Pencil size={13} /> Edit Profile</>}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-3.5 justify-center sm:justify-start">
                      {isEditing ? (
                        <>
                          <CustomSelect
                            options={["Student", "Working Professional"]}
                            value={profile.userType === "professional" ? "Working Professional" : "Student"}
                            onChange={val => up("userType", val === "Working Professional" ? "professional" : "student")}
                            placeholder="Occupation Type..."
                            className="!w-56 shrink-0"
                          />
                          {profile.userType === "professional" ? (
                            <input
                              value={profile.company || ""}
                              onChange={e => up("company", e.target.value)}
                              placeholder="Company / Workplace..."
                              className={INPUT_STYLE + " !w-56"}
                            />
                          ) : (
                            <CustomSelect
                              options={["Amity University Noida", "Galgotias University", "Sharda University", "JIIT Sector 62", "Other"]}
                              value={profile.college || ""}
                              onChange={val => up("college", val)}
                              placeholder="Select College..."
                              className="!w-56 shrink-0"
                            />
                          )}
                          <input value={profile.currentPG || ""} onChange={e => up("currentPG", e.target.value)} placeholder="Current PG Stay..."
                            className={INPUT_STYLE + " !w-56"} />
                        </>
                      ) : (
                        <>
                          <span className="rounded-full bg-amber-50 dark:bg-amber-900/20 px-4 py-2.5 text-sm sm:text-base font-bold text-amber-700 dark:text-amber-500">
                            {profile.userType === "professional" ? "💼 Professional" : "🎓 Student"}
                          </span>
                          {profile.userType === "professional" ? (
                            <span className="rounded-full bg-blue-50 dark:bg-blue-900/20 px-4 py-2.5 text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400">
                              🏢 {profile.company || "Add Company"}
                            </span>
                          ) : (
                            <span className="rounded-full bg-blue-50 dark:bg-blue-900/20 px-4 py-2.5 text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400">
                              🎓 {profile.college || "Add College"}
                            </span>
                          )}
                          <span className="rounded-full bg-[#93B733]/8 dark:bg-[#93B733]/15 px-4 py-2.5 text-sm sm:text-base font-bold text-[#4E700F] dark:text-[#93B733]">
                            {currentDbPG || profile.currentPG || (bookings.find(x => x.status === 'approved') ? `🏠 Staying at: ${bookings.find(x => x.status === 'approved')?.title || bookings.find(x => x.status === 'approved')?.pg_name}` : (bookings.find(x => x.status === 'pending') ? `⏳ Request Under Review: ${bookings.find(x => x.status === 'pending')?.title || bookings.find(x => x.status === 'pending')?.pg_name}` : "🏠 Not staying in any PG"))}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  {isEditing ? (
                    <textarea value={profile.bio || ""} onChange={e => up("bio", e.target.value)} placeholder="Write a short bio about yourself..."
                      rows={2} className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-[#111] px-4 py-3 text-sm sm:text-base font-medium text-[#0D3A1D] dark:text-gray-200 outline-none focus:border-[#93B733] focus:bg-white dark:focus:bg-[#000] transition-all resize-none leading-relaxed" />
                  ) : (
                    <p className="text-base sm:text-lg font-medium text-gray-500 leading-relaxed">{profile.bio || <i className="text-gray-400 dark:text-gray-500">No bio added yet. Tap Edit Profile to add one! ✨</i>}</p>
                  )}
                </div>

                <button onClick={() => setIsEditing(p => !p)}
                  className="sm:hidden mt-4 w-full flex items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-bold border border-gray-200 dark:border-gray-800 text-gray-600 hover:border-[#93B733]/40 transition-all">
                  {isEditing ? <><Check size={13} /> Save Profile</> : <><Pencil size={13} /> Edit Profile</>}
                </button>
              </div>
            </SectionCard>

            {/* ══════ MOBILE SOCIAL CONNECT ══════ */}
            <SectionCard className="lg:hidden p-5 sm:p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  SOCIAL CONNECT
                </h3>
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="text-xs font-bold text-[#93B733] hover:underline flex items-center gap-1">
                    <Pencil size={12} /> Edit
                  </button>
                )}
              </div>
              
              {isEditing ? (
                <div className="grid grid-cols-1 gap-3.5">
                  {SOCIAL_PLATFORMS.map(({ key, label, icon: AppIcon, placeholder }) => (
                    <div key={key} className="flex items-center gap-3 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/60 px-3.5 py-2.5 transition-all focus-within:border-[#93B733] focus-within:bg-white dark:focus-within:bg-[#000] focus-within:shadow-sm">
                      <div className="scale-75 origin-left shrink-0">
                        <AppIcon />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</p>
                        <input
                          value={socials[key] || ""}
                          onChange={e => upSocial(key, e.target.value)}
                          placeholder={placeholder}
                          className="w-full bg-transparent text-xs font-semibold text-[#0D3A1D] dark:text-gray-100 outline-none placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-row overflow-x-auto gap-5 pb-2 scrollbar-hide items-center justify-start">
                  {SOCIAL_PLATFORMS.map(({ key, label, colorIcon }) => {
                    const val = socials[key];
                    const href = val ? (val.startsWith("http") ? val : key === "instagram" || key === "twitter" ? `https://${key === "instagram" ? "instagram.com" : "x.com"}/${val.replace(/^@/, '')}` : `https://${val}`) : null;
                    return (
                      <div key={key} className="flex flex-col items-center gap-2 shrink-0">
                        {href ? (
                          <a href={href} target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-105">
                            <img src={colorIcon} alt={label} className="w-9 h-9 object-contain drop-shadow-sm" />
                          </a>
                        ) : (
                          <button onClick={() => setIsEditing(true)} className="transition-transform hover:scale-105 opacity-50 hover:opacity-100">
                            <img src={colorIcon} alt={label} className="w-9 h-9 object-contain drop-shadow-sm grayscale transition-all" />
                          </button>
                        )}
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </SectionCard>

            <SectionCard className="p-7 sm:p-9">
              <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-[#0D3A1D] dark:text-gray-200 mb-5 flex items-center gap-2">
                <ShieldCheck size={16} className="text-blue-600 dark:text-blue-500" /> student & Contact Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {CONTACT_FIELDS.map(renderContactField)}
              </div>
            </SectionCard>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PERSONALITY_SECTIONS.map(({ key, label, icon: Icon, iconColor, options, color, tagBg, tagText, placeholder }) => (
                <SectionCard key={key} className="p-6 sm:p-7">
                  <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3 flex items-center gap-1.5">
                    <Icon size={14} className={iconColor} /> {label}
                  </h3>
                  {isEditing
                    ? <TagInput tags={profile[key] || []} onChange={v => up(key, v)} placeholder={placeholder} options={options} color={color} />
                    : <div className="flex flex-wrap gap-2">
                        {(profile[key] || []).length > 0
                          ? profile[key].map(h => <span key={h} className={`rounded-full ${tagBg} px-3 py-1.5 text-xs sm:text-sm font-bold ${tagText}`}>{h}</span>)
                          : <p className="text-sm sm:text-base text-gray-400 dark:text-gray-500 font-medium italic">None added yet</p>}
                      </div>}
                </SectionCard>
              ))}

              <SectionCard className="p-6 sm:p-7">
                <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3 flex items-center gap-1.5">
                  <Brain size={14} className="text-amber-500" /> Vibe / Mindset
                </h3>
                {isEditing
                  ? <CustomSelect
                      options={VIBE_OPTIONS}
                      value={profile.vibe || ""}
                      onChange={val => up("vibe", val)}
                      placeholder="Select your vibe..."
                    />
                  : <p className="text-base sm:text-lg font-medium text-gray-500 leading-relaxed">{profile.vibe || <i className="text-gray-400 dark:text-gray-500">Add your vibe ✨</i>}</p>}
              </SectionCard>
            </div>

            {!isEditing && (
              <>
                <div className="grid grid-cols-3 gap-3.5">
                  {[
                    { l: "Pending", v: stats.pending, Icon: Clock, c: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
                    { l: "Approved", v: stats.approved, Icon: CheckCircle, c: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
                    { l: "Total", v: stats.total, Icon: BookOpen, c: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
                  ].map(({ l, v, Icon, c, bg }) => (
                    <SectionCard key={l} className="p-4 sm:p-5 text-center">
                      <div className={`mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${bg} ${c}`}><Icon size={18} /></div>
                      <p className="text-2xl font-black text-[#0D3A1D] dark:text-gray-100">{v}</p>
                      <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 mt-1">{l}</p>
                    </SectionCard>
                  ))}
                </div>

                {/* ══════ MOBILE FEATURED SLIDER ══════ */}
                <div className="lg:hidden w-full">
                  <MobileSponsoredSlider pgList={pgList} />
                </div>

                <SectionCard className="p-7 sm:p-9">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base sm:text-lg font-black text-[#0D3A1D] dark:text-gray-100 tracking-tight">Recent Bookings</h2>
                    <Link to="/my-bookings" className="text-xs font-bold text-[#93B733] hover:underline flex items-center gap-0.5">
                      View All <ChevronRight size={14} />
                    </Link>
                  </div>
                  {bookings.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#111] p-10 text-center">
                      <p className="text-xs sm:text-sm font-bold text-gray-400 mb-3.5">No bookings yet</p>
                      <Link to="/pgs" className="inline-block rounded-lg bg-[#93B733] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#82a32d] transition-colors">Explore PGs</Link>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {bookings.map(b => (
                        <div key={b.id} className="overflow-hidden rounded-xl border border-gray-100 dark:border-[#1a1a1a] bg-white dark:bg-[#0f0f0f] transition-all hover:shadow-sm">
                          <div className="flex items-center justify-between gap-3 p-4 sm:p-5">
                            <div className="min-w-0">
                              <h4 className="text-sm sm:text-base font-black text-[#0D3A1D] dark:text-gray-200 truncate">{b.pg_name || b.title || `PG #${b.pg_id}`}</h4>
                              <p className="text-xs font-semibold text-gray-400 mt-1">{b.booking_date ? new Date(b.booking_date).toLocaleDateString() : "Recently"}</p>
                            </div>
                            <StatusBadge status={b.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
              </>
            )}
          </div>

          {/* ══════ RIGHT COLUMN: FEATURED ACCOMMODATIONS (Desktop Only) ══════ */}
          <div className="hidden lg:block lg:w-[320px] xl:w-[350px] shrink-0 order-3">
             <SlidingPgPageSidebar pgList={pgList} />
          </div>

        </div>
      </div>

      <div className="fixed bottom-4 left-0 right-0 z-30 flex justify-center pointer-events-none">
        <div className="pointer-events-auto">
          <MacOSDock apps={DOCK_APPS} onAppClick={handleDock} openApps={["/student/dashboard"]} />
        </div>
      </div>
    </div>
  );
};

export default memo(StudentDashboard);
