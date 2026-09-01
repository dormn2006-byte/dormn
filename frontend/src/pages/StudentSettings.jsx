import { useNavigate, Link } from "react-router-dom";
import { useState, useCallback, useContext, useEffect, useRef, memo, useMemo } from "react";
 import { AuthContext } from "../context/AuthContext";
 import MacOSDock from "../components/ui/mac-os-dock";
 import { ThemeSwitch } from "../components/ui/theme-switch-button";
 import { buildStudentDockApps } from "../constants/studentDockConfig";
 import {
   User, BookOpen, Heart, Settings, Search, Home, Building2,
   Shield, Bell, Eye, Trash2, Check, UserCircle, ChevronRight, LogOut
 } from "lucide-react";
 
 const LS_KEY = "dormn_student_profile";
 const loadProfile = () => { try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch { return {}; } };
 const saveProfile = (d) => localStorage.setItem(LS_KEY, JSON.stringify(d));

 
 const SectionCard = memo(({ children, className = "" }) => (
   <div className={`rounded-2xl border border-gray-100/80 bg-white shadow-[0_2px_16px_rgba(0,0,0,0.03)] ${className}`}>{children}</div>
 ));
 SectionCard.displayName = "SectionCard";
 
 const Toggle = memo(({ checked, onChange, label, desc }) => (
   <div className="flex items-center justify-between gap-4 py-4">
     <div className="min-w-0">
       <p className="text-sm sm:text-base font-bold text-[#0D3A1D] leading-tight">{label}</p>
       {desc && <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1 leading-snug">{desc}</p>}
     </div>
     <button type="button" onClick={onChange} className={`relative shrink-0 h-7 w-12 rounded-full transition-colors duration-200 ${checked ? "bg-[#93B733]" : "bg-gray-200"}`}>
       <div className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`} />
     </button>
   </div>
 ));
 Toggle.displayName = "Toggle";
 
 const RadioGroup = memo(({ label, options, value, onChange }) => (
   <div>
     <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5">{label}</p>
     <div className="flex flex-wrap gap-2.5">
       {options.map(opt => (
         <button key={opt} type="button" onClick={() => onChange(opt)}
           className={`rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
             value === opt
               ? "bg-[#93B733] text-white shadow-sm"
               : "border border-gray-200 text-gray-600 hover:border-[#93B733]/40 hover:text-[#0D3A1D] bg-gray-50/60"
           }`}>
           {value === opt && <Check size={14} className="inline mr-1.5 -mt-0.5" />}{opt}
         </button>
       ))}
     </div>
   </div>
 ));
 RadioGroup.displayName = "RadioGroup";
 
 const StudentSettings = () => {
   const navigate = useNavigate();
   const { user, logout } = useContext(AuthContext);
   const [profile, setProfile] = useState(loadProfile);
   const [showSavedToast, setShowSavedToast] = useState(false);
   const [showMenu, setShowMenu] = useState(false);
   const menuRef = useRef(null);
   const DOCK_APPS = useMemo(() => buildStudentDockApps(user?.id), [user?.id]);
 
   useEffect(() => {
     const handleClickOutside = (event) => {
       if (menuRef.current && !menuRef.current.contains(event.target)) {
         setShowMenu(false);
       }
     };
     document.addEventListener("mousedown", handleClickOutside);
     return () => document.removeEventListener("mousedown", handleClickOutside);
   }, []);
 
   const triggerSave = useCallback((newProfile) => {
     saveProfile(newProfile);
     setShowSavedToast(true);
     setTimeout(() => setShowSavedToast(false), 3000);
   }, []);
 
   const notifs = profile.notifications || {};
   const display = profile.display || {};
   const toggleNotif = useCallback((key) => setProfile(p => {
     const n = { ...p, notifications: { ...(p.notifications || {}), [key]: !(p.notifications || {})[key] } };
     triggerSave(n);
     return n;
   }), [triggerSave]);
 
   const setDisplay = useCallback((key, val) => setProfile(p => {
     const n = { ...p, display: { ...(p.display || {}), [key]: val } };
     triggerSave(n);
     return n;
   }), [triggerSave]);
   
   const handleClear = useCallback(() => {
     if (window.confirm("Clear all profile data? This action cannot be undone.")) {
       localStorage.removeItem(LS_KEY);
       setProfile({});
       triggerSave({});
     }
   }, [triggerSave]);
 
   const handleLogout = useCallback(() => {
     logout();
     navigate("/");
   }, [logout, navigate]);
 
   const handleDock = useCallback((id) => navigate(id), [navigate]);
 
   const memberSince = user?.createdAt
     ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
     : "Recently";
 
   const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "S";
 
   return (
     <div className="min-h-screen bg-gradient-to-b from-[#f8f9f3] to-[#f0f1eb] pb-28 relative">
       {/* ── HEADER ── */}
       <header className="sticky top-0 z-40 border-b border-gray-200/40 dark:border-gray-800/40 bg-white/70 dark:bg-black/70 backdrop-blur-2xl">
         <div className="mx-auto flex max-w-[1600px] h-14 items-center justify-between px-4 sm:px-6">
           <Link to="/" className="flex items-center gap-2">
             <img src="/logo-sm.webp" alt="Dormn" className="h-7 w-7 object-contain" />
             <span className="text-base font-black text-[#0D3A1D] dark:text-gray-200 tracking-tight">Dormn</span>
           </Link>
           
           <div className="flex items-center gap-3">
             <ThemeSwitch />
             {/* Avatar Dropdown */}
             <div className="relative" ref={menuRef}>
               <button 
                 onClick={() => setShowMenu(!showMenu)}
                 className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 overflow-hidden hover:border-[#93B733] transition-all">
                 <span className="text-sm font-bold text-[#0D3A1D] dark:text-gray-200">{userInitial}</span>
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
 
       {/* FLOATING TOAST NOTIFICATION */}
       {showSavedToast && (
         <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
           <div className="flex items-center gap-2 rounded-full bg-[#0D3A1D] px-4 py-2 text-white shadow-lg">
             <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#93B733]">
               <Check size={12} />
             </div>
             <span className="text-sm font-bold">Saved</span>
           </div>
         </div>
       )}
 
       <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">
 
         {/* ══════ HERO CARD ══════ */}
         <SectionCard className="p-6 sm:p-8">
           <div className="flex items-center gap-4">
             <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#93B733]/10 text-[#93B733] shrink-0">
               <Settings size={28} />
             </div>
             <div>
               <h1 className="text-2xl sm:text-3xl font-black text-[#0D3A1D] tracking-tight">Settings</h1>
               <p className="text-sm sm:text-base font-bold text-gray-500 mt-1 leading-snug">Manage your account preferences, notifications, and display settings</p>
             </div>
           </div>
         </SectionCard>
 
         {/* ══════ ACCOUNT INFO (READ-ONLY) ══════ */}
         <SectionCard className="p-6 sm:p-8">
           <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-[#0D3A1D] mb-5 flex items-center gap-2">
             <Shield size={18} className="text-blue-600" /> Account Information
           </h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
             {[
               { l: "Full Name", v: user?.name || "Student" },
               { l: "Email Address", v: user?.email || "—" },
               { l: "Role", v: user?.role || "student" },
               { l: "Member Since", v: memberSince },
             ].map(({ l, v }) => (
               <div key={l} className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                 <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">{l}</p>
                 <p className="text-sm sm:text-base font-bold text-[#0D3A1D] truncate capitalize">{v}</p>
               </div>
             ))}
           </div>
         </SectionCard>
 
         {/* ══════ NOTIFICATION PREFERENCES ══════ */}
         <SectionCard className="p-6 sm:p-8">
           <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-[#0D3A1D] mb-4 flex items-center gap-2">
             <Bell size={18} className="text-amber-500" /> Notification Preferences
           </h3>
           <div className="divide-y divide-gray-100">
             <Toggle checked={!!notifs.emailBooking} onChange={() => toggleNotif("emailBooking")}
               label="Email notifications for booking updates"
               desc="Get notified via email when your booking status changes" />
             <Toggle checked={!!notifs.smsApprovals} onChange={() => toggleNotif("smsApprovals")}
               label="SMS alerts for approvals"
               desc="Receive SMS when your PG booking is approved" />
             <Toggle checked={!!notifs.marketingEmails} onChange={() => toggleNotif("marketingEmails")}
               label="Marketing emails from Dormn"
               desc="Tips, offers, and news about new PGs in your area" />
           </div>
         </SectionCard>
 
         {/* ══════ DISPLAY PREFERENCES ══════ */}
         <SectionCard className="p-6 sm:p-8">
           <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-[#0D3A1D] mb-5 flex items-center gap-2">
             <Eye size={18} className="text-violet-500" /> Display Preferences
           </h3>
           <div className="space-y-6">
             <RadioGroup label="Food Preference" options={["Veg", "Non-Veg", "Both"]}
               value={display.food || "Both"} onChange={(v) => setDisplay("food", v)} />
             <RadioGroup label="Gender" options={["Male", "Female", "Other"]}
               value={display.gender || "Other"} onChange={(v) => setDisplay("gender", v)} />
           </div>
         </SectionCard>
 
         {/* ══════ ACCOUNT MANAGEMENT ══════ */}
         <SectionCard className="p-6 sm:p-8 border-gray-200/60">
           <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-gray-700 mb-5 flex items-center gap-2">
             <UserCircle size={18} className="text-gray-500" /> Account Management
           </h3>
           <div className="space-y-3.5">
             <button onClick={handleClear}
               className="w-full flex items-center justify-between rounded-xl border border-gray-200/80 bg-white px-4 py-3.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all group">
               <span className="flex items-center gap-2.5"><Trash2 size={16} className="text-gray-400" /> Clear Profile Data</span>
               <ChevronRight size={16} className="opacity-40 group-hover:opacity-100 transition-opacity" />
             </button>
             <button onClick={handleLogout}
               className="w-full flex items-center justify-between rounded-xl border border-gray-200/80 bg-white px-4 py-3.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all group">
               <span className="flex items-center gap-2.5"><LogOut size={16} className="text-gray-400" /> Logout</span>
               <ChevronRight size={16} className="opacity-40 group-hover:opacity-100 transition-opacity" />
             </button>
           </div>
         </SectionCard>
       </div>
 
       {/* ── DOCK ── */}
       <div className="fixed bottom-4 left-0 right-0 z-30 flex justify-center pointer-events-none">
         <div className="pointer-events-auto">
           <MacOSDock apps={DOCK_APPS} onAppClick={handleDock} openApps={["/student/settings"]} />
         </div>
       </div>
     </div>
   );
 };
 
 export default memo(StudentSettings);
 