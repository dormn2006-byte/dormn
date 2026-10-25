import { useNavigate, Link } from "react-router-dom";
import { useState, useCallback, useContext, useEffect, useRef, memo, useMemo } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import MacOSDock from "../components/ui/mac-os-dock";
import { ThemeSwitch } from "../components/ui/theme-switch-button";
import { buildStudentDockApps } from "../constants/studentDockConfig";
import {
  Settings, Search, Building2,
  Shield, Bell, Eye, EyeOff, Globe, Lock, Trash2, Check, UserCircle, ChevronRight, LogOut,
  ShieldAlert, ShieldCheck, ArrowRight, CheckCircle2, Clock
} from "lucide-react";
import EmailVerificationModal from "../components/auth/EmailVerificationModal";
import DeleteAccountModal from "../components/auth/DeleteAccountModal";
import { isEmailVerified } from "../utils/verificationStorage";


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

const StudentSettings = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const userKey = user?.id ? `u_${user.id}` : user?.email ? `e_${user.email.replace(/[^a-zA-Z0-9]/g, '_')}` : null;
  const userProfKey = userKey ? `dormn_student_profile_${userKey}` : null;

  const [profile, setProfile] = useState(() => {
    try {
      return userProfKey ? JSON.parse(localStorage.getItem(userProfKey) || "{}") : {};
    } catch {
      return {};
    }
  });

  // Fetch real profile from backend on mount so settings stay strictly synced
  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      try {
        const res = await api.get("/student/profile");
        if (res.data?.profile && isMounted) {
          const p = res.data.profile;
          setProfile(prev => {
            const merged = {
              ...prev,
              ...p,
              isPublic: p.is_public !== undefined ? Boolean(p.is_public) : (p.isPublic !== undefined ? Boolean(p.isPublic) : (prev.isPublic ?? true))
            };
            if (userProfKey) {
              try { localStorage.setItem(userProfKey, JSON.stringify(merged)); } catch {}
            }
            return merged;
          });
        }
      } catch (err) {
        console.error("Failed to fetch student profile in settings:", err);
      }
    };
    loadProfile();
    return () => { isMounted = false; };
  }, [userProfKey]);

  const [showSavedToast, setShowSavedToast] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const DOCK_APPS = useMemo(() => buildStudentDockApps(user?.id), [user?.id]);
  const isVerified = isEmailVerified(user);

  const handleOpenVerify = useCallback(() => setShowEmailModal(true), []);
  const handleCloseVerify = useCallback(() => setShowEmailModal(false), []);
  const handleVerifySuccess = useCallback(() => {
    setShowEmailModal(false);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveSettings = useCallback(async (updated) => {
    setProfile(updated);
    if (userProfKey) {
      try {
        localStorage.setItem(userProfKey, JSON.stringify(updated));
        if (userKey) localStorage.setItem(`dormn_registration_form_${userKey}`, JSON.stringify(updated));
      } catch {}
    }
    localStorage.removeItem("dormn_student_profile");
    localStorage.removeItem("dormn_registration_form");
    window.dispatchEvent(new Event("dormn_profile_updated"));
    try {
      await api.post("/student/profile", updated);
    } catch (e) {
      console.error("Failed to sync profile settings with server:", e);
    }
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  }, [userProfKey, userKey]);

  const isPublic = profile.isPublic ?? true;
  const notifs = profile.notifications || {};

  const togglePrivacy = useCallback(() => {
    saveSettings({ ...profile, isPublic: !isPublic });
  }, [profile, isPublic, saveSettings]);

  const toggleNotif = useCallback((key) => {
    saveSettings({
      ...profile,
      notifications: { ...notifs, [key]: !notifs[key] }
    });
  }, [profile, notifs, saveSettings]);
  
  const handleClear = useCallback(() => {
    if (window.confirm("Clear all profile data? This action cannot be undone.")) {
      if (userProfKey) localStorage.removeItem(userProfKey);
      localStorage.removeItem("dormn_student_profile");
      setProfile({});
      saveSettings({});
    }
  }, [userProfKey, saveSettings]);

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
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#000000] pb-28 relative font-sans selection:bg-[#93B733] selection:text-white">
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

        {/* ══════ EMAIL VERIFICATION OPTION (SHOWN IF UNVERIFIED) ══════ */}
        {!isVerified && (
          <SectionCard className="p-6 sm:p-8 border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/[0.08] via-amber-500/[0.02] to-transparent relative overflow-hidden shadow-[0_4px_24px_rgba(245,158,11,0.08)]">
            <div className="pointer-events-none absolute -right-12 -top-12 w-36 h-36 bg-amber-500/15 rounded-full blur-2xl" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 shadow-inner">
                  <ShieldAlert size={26} />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-base sm:text-lg font-black text-[#0D3A1D] dark:text-white tracking-tight">Verify Your Email Address</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-400/40">Action Required</span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 mt-1 max-w-xl leading-relaxed">
                    Verify <strong className="text-gray-900 dark:text-white">{user?.email}</strong> with a 10-minute one-time password (OTP) to unlock PG room bookings, instant passes, and resident events.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleOpenVerify}
                className="shrink-0 px-6 py-3.5 rounded-xl bg-[#0D3A1D] hover:bg-[#16502a] text-white text-xs sm:text-sm font-black transition-all shadow-lg shadow-[#0D3A1D]/25 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>Verify Email (10-Min OTP)</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </SectionCard>
        )}

        {/* ══════ ACCOUNT INFO (READ-ONLY) ══════ */}
        <SectionCard className="p-6 sm:p-8">
          <div className="flex items-center justify-between gap-2 mb-5">
            <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-[#0D3A1D] flex items-center gap-2">
              <Shield size={18} className="text-blue-600" /> Account Information
            </h3>
            {isVerified && (
              <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <ShieldCheck size={13} /> Email Verified
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
              <p className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#0D3A1D] dark:text-[#93B733] mb-1">Full Name</p>
              <p className="text-sm sm:text-base font-medium text-gray-600 dark:text-gray-300 truncate capitalize">{user?.name || "Student"}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
              <div className="flex items-center justify-between gap-1 mb-1">
                <p className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#0D3A1D] dark:text-[#93B733]">Email Address</p>
                {isVerified ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 size={11} /> Verified
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleOpenVerify}
                    className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition cursor-pointer"
                  >
                    <Clock size={11} /> Verify Now
                  </button>
                )}
              </div>
              <p className="text-sm sm:text-base font-medium text-gray-600 dark:text-gray-300 truncate">{user?.email || "—"}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
              <p className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#0D3A1D] dark:text-[#93B733] mb-1">Role</p>
              <p className="text-sm sm:text-base font-medium text-gray-600 dark:text-gray-300 truncate capitalize">{user?.role || "student"}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
              <p className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#0D3A1D] dark:text-[#93B733] mb-1">Member Since</p>
              <p className="text-sm sm:text-base font-medium text-gray-600 dark:text-gray-300 truncate capitalize">{memberSince}</p>
            </div>
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

        {/* ══════ PROFILE PRIVACY ══════ */}
        <SectionCard className="p-6 sm:p-8">
          <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-[#0D3A1D] mb-5 flex items-center gap-2">
            <Shield size={18} className="text-[#93B733]" /> Profile Privacy
          </h3>
          <div className={`rounded-2xl border p-4 sm:p-5 transition-all ${
            isPublic
              ? "border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20"
              : "border-purple-200 dark:border-purple-800/40 bg-purple-50/50 dark:bg-purple-950/20"
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className={`p-2.5 rounded-xl shrink-0 ${
                  isPublic ? "bg-emerald-500/15 text-emerald-600" : "bg-purple-500/15 text-purple-600"
                }`}>
                  {isPublic ? <Globe size={20} /> : <Lock size={20} />}
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-gray-900 dark:text-white">
                    Profile Visibility: <span className={isPublic ? "text-emerald-600 dark:text-emerald-400" : "text-purple-600 dark:text-purple-400"}>{isPublic ? "Public" : "Private"}</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                    {isPublic
                      ? "When Public: Verified PG owners can view your Name, Phone, and College / Workplace info when you explore or schedule visits. Documents stay protected."
                      : "When Private: No PG owner or user can view your personal details or contact information."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={togglePrivacy}
                className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm text-white transition-all cursor-pointer ${
                  isPublic ? "bg-emerald-600 hover:bg-emerald-500" : "bg-purple-600 hover:bg-purple-500"
                }`}
              >
                {isPublic ? <EyeOff size={15} /> : <Eye size={15} />} Switch to {isPublic ? "Private" : "Public"}
              </button>
            </div>
          </div>
        </SectionCard>

        {/* ══════ ACCOUNT MANAGEMENT ══════ */}
        <SectionCard className="p-6 sm:p-8 border-gray-200/60">
          <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-gray-700 mb-5 flex items-center gap-2">
            <UserCircle size={18} className="text-gray-500" /> Account Management
          </h3>
          <div className="space-y-3.5">
            <button onClick={handleClear}
              className="w-full flex items-center justify-between rounded-xl border border-gray-200/80 bg-white px-4 py-3.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all group cursor-pointer">
              <span className="flex items-center gap-2.5"><Trash2 size={16} className="text-gray-400" /> Clear Local Profile Data</span>
              <ChevronRight size={16} className="opacity-40 group-hover:opacity-100 transition-opacity" />
            </button>
            <button onClick={handleLogout}
              className="w-full flex items-center justify-between rounded-xl border border-gray-200/80 bg-white px-4 py-3.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all group cursor-pointer">
              <span className="flex items-center gap-2.5"><LogOut size={16} className="text-gray-400" /> Logout</span>
              <ChevronRight size={16} className="opacity-40 group-hover:opacity-100 transition-opacity" />
            </button>
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="w-full flex items-center justify-between rounded-xl border border-red-200/80 bg-red-50/40 hover:bg-red-50 px-4 py-3.5 text-sm font-bold text-red-600 transition-all group cursor-pointer"
            >
              <span className="flex items-center gap-2.5"><Trash2 size={16} className="text-red-500" /> Delete Account</span>
              <ChevronRight size={16} className="opacity-40 group-hover:opacity-100 text-red-500 transition-opacity" />
            </button>
          </div>
        </SectionCard>
      </div>

      {/* Email Verification OTP Modal */}
      <EmailVerificationModal
        isOpen={showEmailModal}
        onClose={handleCloseVerify}
        userEmail={user?.email}
        title="Verify your email to book PG"
        description="Please enter the 6-digit code sent to your email to verify your account and unlock PG reservations."
        onSuccess={handleVerifySuccess}
      />

      {/* Permanent Account Deletion Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />

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