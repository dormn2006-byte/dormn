import { useState, useEffect } from "react";
import {
  X,
  User,
  Zap,
  Settings as SettingsIcon,
  ShieldCheck,
  Check,
  Bell,
  Lock,
  Mail,
  Phone,
  Building,
  Save
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const OwnerProfileModal = ({ isOpen, onClose, initialTab = "profile" }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [formData, setFormData] = useState({
    fullName: user?.full_name || user?.name || "Owner",
    email: user?.email || "owner@example.com",
    phone: user?.phone || "+91 98765 43210",
    businessName: user?.business_name || "Dormn PG Management",
    notifications: {
      bookings: true,
      sms: true,
      email: true,
      marketing: false,
    },
  });

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-3xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0a0f1d] text-gray-900 dark:text-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden transition-all">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 px-7 py-5 bg-gray-50/80 dark:bg-white/[0.03]">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-cyan-500 text-lg font-black text-white shadow-md shadow-pink-500/20">
              {(formData.fullName?.charAt(0) || "O").toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
                {formData.fullName}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold mt-0.5">
                <ShieldCheck size={15} />
                <span>Verified PG Owner</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 dark:border-white/15 bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector Navigation */}
        <div className="flex border-b border-gray-200 dark:border-white/10 px-7 pt-2 gap-2 bg-gray-50/40 dark:bg-white/[0.01]">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-xs font-black transition-all ${
              activeTab === "profile"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <User size={16} />
            <span>Profile Details</span>
          </button>

          <button
            onClick={() => setActiveTab("tier")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-xs font-black transition-all ${
              activeTab === "tier"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <Zap size={16} />
            <span>Membership Tier</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-xs font-black transition-all ${
              activeTab === "settings"
                ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <SettingsIcon size={16} />
            <span>Account Settings</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-7 max-h-[70vh] overflow-y-auto space-y-6">
          {savedSuccess && (
            <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
              <Check size={18} />
              <span>Your changes have been saved successfully!</span>
            </div>
          )}

          {/* TAB 1: PROFILE */}
          {activeTab === "profile" && (
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-900 dark:text-gray-200 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full rounded-2xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-[#141b2d] pl-11 pr-4 py-3.5 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-900 dark:text-gray-200 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-3.5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-2xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-[#141b2d] pl-11 pr-4 py-3.5 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-900 dark:text-gray-200 mb-2">
                    Mobile Phone
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-4 top-3.5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded-2xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-[#141b2d] pl-11 pr-4 py-3.5 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-900 dark:text-gray-200 mb-2">
                  PG Brand / Business Name
                </label>
                <div className="relative">
                  <Building size={16} className="absolute left-4 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full rounded-2xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-[#141b2d] pl-11 pr-4 py-3.5 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 px-7 py-3.5 text-xs font-black text-white hover:opacity-95 transition shadow-lg shadow-blue-500/25 disabled:opacity-50"
                >
                  <Save size={16} />
                  <span>{isSaving ? "Saving..." : "Save Profile Changes"}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: MEMBERSHIP TIER */}
          {activeTab === "tier" && (
            <div className="space-y-5">
              <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-blue-600/10 p-7 text-gray-900 dark:text-white shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <Zap size={22} className="text-emerald-500 dark:text-emerald-400" />
                    <span className="text-2xl font-black">Pro Owner Tier</span>
                  </div>
                  <span className="rounded-full bg-emerald-500 px-3.5 py-1 text-[10px] font-black text-white uppercase tracking-wider shadow-sm">
                    Active Plan
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-5">
                  Enjoy unlimited property listings, top #1 search placement, AI analytics, and instant student booking notifications.
                </p>
                <div className="grid grid-cols-2 gap-4 text-xs font-bold pt-3 border-t border-emerald-500/20">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block text-[10px] uppercase font-bold">Billing Cycle</span>
                    <span className="text-sm font-black">Monthly Subscription</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block text-[10px] uppercase font-bold">Renewal Date</span>
                    <span className="text-sm font-black">Nov 30, 2026</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 p-5 rounded-2xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-[#141b2d]">
                <div>
                  <h4 className="text-xs font-black text-gray-900 dark:text-white">Want to upgrade or change plans?</h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Explore our Yearly discounts & Free tiers</p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    navigate("/owner/pricing");
                  }}
                  className="rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-950 px-5 py-3 text-xs font-black hover:opacity-90 transition shrink-0 shadow-md"
                >
                  View Plans
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: ACCOUNT SETTINGS */}
          {activeTab === "settings" && (
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <h4 className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-2 mb-3.5">
                  <Bell size={16} className="text-blue-500" />
                  <span>Notification Preferences</span>
                </h4>
                
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-4 rounded-2xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-[#141b2d] cursor-pointer">
                    <div>
                      <span className="text-xs font-bold block text-gray-900 dark:text-white">Booking Requests</span>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">Get notified when students apply for your PG</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.notifications.bookings}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notifications: { ...formData.notifications, bookings: e.target.checked },
                        })
                      }
                      className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 rounded-2xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-[#141b2d] cursor-pointer">
                    <div>
                      <span className="text-xs font-bold block text-gray-900 dark:text-white">SMS Alerts</span>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400">Receive instant SMS alerts for urgent inquiries</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.notifications.sms}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notifications: { ...formData.notifications, sms: e.target.checked },
                        })
                      }
                      className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-2 mb-3.5">
                  <Lock size={16} className="text-cyan-500" />
                  <span>Security & Password</span>
                </h4>

                <div className="space-y-3">
                  <input
                    type="password"
                    placeholder="Current Password"
                    className="w-full rounded-2xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-[#141b2d] px-4 py-3.5 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-blue-500"
                  />
                  <input
                    type="password"
                    placeholder="New Password"
                    className="w-full rounded-2xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-[#141b2d] px-4 py-3.5 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 px-7 py-3.5 text-xs font-black text-white hover:opacity-95 transition shadow-lg shadow-blue-500/25 disabled:opacity-50"
                >
                  <Save size={16} />
                  <span>{isSaving ? "Saving..." : "Save Preferences"}</span>
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default OwnerProfileModal;
