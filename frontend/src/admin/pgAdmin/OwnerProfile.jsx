import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  User,
  Zap,
  ShieldCheck,
  Check,
  Lock,
  Mail,
  Phone,
  Building,
  Save,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  Clock,
  RotateCcw,
  CreditCard,
  BadgeCheck,
  CheckCircle2,
  PhoneCall,
  MapPin,
  HelpCircle
} from "lucide-react";
import api from "../../services/api";

// ── Compact Reusable Input Components ──────────────────────────────
const InputField = ({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  disabled,
  type = "text",
  required,
  className = "",
  uppercase = false,
  rows
}) => (
  <div className={className}>
    <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <Icon
          size={14}
          className={`absolute left-3 ${rows ? "top-2.5" : "top-1/2 -translate-y-1/2"} text-gray-400`}
        />
      )}
      {rows ? (
        <textarea
          rows={rows}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full rounded-lg sm:rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#161616] ${
            Icon ? "pl-8 sm:pl-9" : "px-3"
          } pr-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full rounded-lg sm:rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#161616] ${
            Icon ? "pl-8 sm:pl-9" : "px-3"
          } pr-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 ${
            disabled ? "bg-gray-100 dark:bg-[#121212] cursor-not-allowed opacity-75" : ""
          } ${uppercase ? "uppercase" : ""}`}
        />
      )}
    </div>
  </div>
);

const PasswordInput = ({
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder = "••••••••",
  disabled,
  required,
  minLength
}) => (
  <div>
    <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">{label}</label>
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        minLength={minLength}
        className="w-full rounded-lg sm:rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#161616] pl-3 pr-9 py-2 text-xs sm:text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 disabled:opacity-50"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  </div>
);

// ── Tab Config ──────────────────────────────────────────────────────
const TABS = [
  { id: "profile", label: "Profile & Business", icon: User },
  { id: "payouts", label: "Bank & Payouts", icon: CreditCard },
  { id: "kyc", label: "Legal KYC", icon: BadgeCheck },
  { id: "security", label: "Security & Password", icon: Lock },
  { id: "tier", label: "Plan & Tier", icon: Zap }
];

const OwnerProfile = ({ defaultTab = "profile" }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState(tabParam || defaultTab);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const [profileData, setProfileData] = useState({
    fullName: storedUser?.full_name || storedUser?.name || "",
    email: storedUser?.email || "",
    phone: storedUser?.phone || "",
    secondaryPhone: storedUser?.secondary_phone || "",
    gender: storedUser?.gender || "prefer_not_to_say",
    businessName: storedUser?.business_name || "",
    officeAddress: storedUser?.office_address || "",
    city: storedUser?.city || "",
    state: storedUser?.state || "",
    pincode: storedUser?.pincode || "",
    operatingSince: storedUser?.operating_since || "",
    bankName: storedUser?.bank_name || "",
    accountHolder: storedUser?.account_holder || storedUser?.full_name || "",
    accountNumber: storedUser?.account_number || "",
    ifscCode: storedUser?.ifsc_code || "",
    upiId: storedUser?.upi_id || "",
    panNumber: storedUser?.pan_number || "",
    gstin: storedUser?.gstin || "",
    aadhaarMasked: storedUser?.aadhaar_masked || ""
  });

  const [isSavingPayout, setIsSavingPayout] = useState(false);

  // Load real profile and payout details from database on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/profile");
        if (res.data?.success && res.data.user) {
          const u = res.data.user;
          setProfileData({
            fullName: u.full_name || "",
            email: u.email || "",
            phone: u.phone || "",
            secondaryPhone: u.secondary_phone || "",
            gender: u.gender || "prefer_not_to_say",
            businessName: u.business_name || "",
            officeAddress: u.office_address || "",
            city: u.city || "",
            state: u.state || "",
            pincode: u.pincode || "",
            operatingSince: u.operating_since || "",
            bankName: u.bank_name || "",
            accountHolder: u.account_holder || u.full_name || "",
            accountNumber: u.account_number || "",
            ifscCode: u.ifsc_code || "",
            upiId: u.upi_id || "",
            panNumber: u.pan_number || "",
            gstin: u.gstin || "",
            aadhaarMasked: u.aadhaar_masked || ""
          });
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
      }
    };
    fetchProfile();
  }, []);

  const updateField = (key, val) => setProfileData((prev) => ({ ...prev, [key]: val }));

  // Password & OTP States
  const [passwordMode, setPasswordMode] = useState("idle");
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [showPass, setShowPass] = useState({ current: false, newPass: false, confirm: false });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // 10-Minute Timer (600 seconds)
  const [otpCode, setOtpCode] = useState("");
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(600);
  const [isOtpTimerActive, setIsOtpTimerActive] = useState(false);

  useEffect(() => {
    if (tabParam) setActiveTab(tabParam);
  }, [tabParam]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
    setSuccessMessage("");
    setErrorMessage("");
  };

  // Timer Tick
  useEffect(() => {
    if (!isOtpTimerActive || otpSecondsLeft <= 0) {
      if (otpSecondsLeft === 0) setIsOtpTimerActive(false);
      return;
    }
    const interval = setInterval(() => setOtpSecondsLeft((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [isOtpTimerActive, otpSecondsLeft]);

  const formattedTimer = useMemo(() => {
    const m = Math.floor(otpSecondsLeft / 60);
    const s = otpSecondsLeft % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [otpSecondsLeft]);

  const showToast = (msg, isErr = false) => {
    if (isErr) {
      setErrorMessage(msg);
      setSuccessMessage("");
    } else {
      setSuccessMessage(msg);
      setErrorMessage("");
      setTimeout(() => setSuccessMessage(""), 4000);
    }
  };

  // Save General Profile & Business Details
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.put("/auth/profile", {
        full_name: profileData.fullName,
        phone: profileData.phone,
        secondary_phone: profileData.secondaryPhone,
        gender: profileData.gender,
        business_name: profileData.businessName,
        office_address: profileData.officeAddress,
        city: profileData.city,
        state: profileData.state,
        pincode: profileData.pincode,
        operating_since: profileData.operatingSince,
        pan_number: profileData.panNumber,
        gstin: profileData.gstin,
        aadhaar_masked: profileData.aadhaarMasked
      });
      if (res.data?.success) {
        localStorage.setItem("user", JSON.stringify({ ...storedUser, ...res.data.user }));
        window.dispatchEvent(new Event("storage"));
        showToast("Profile & business details updated successfully!");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update profile details.", true);
    } finally {
      setIsSaving(false);
    }
  };

  // Save Bank Account & Payout Method
  const handleSavePayout = async (e) => {
    if (e) e.preventDefault();
    if (!profileData.accountHolder?.trim()) {
      showToast("Please enter the Beneficiary / Account Holder Name.", true);
      return;
    }
    if (!profileData.bankName?.trim()) {
      showToast("Please enter the Bank Name.", true);
      return;
    }
    if (!profileData.accountNumber?.trim()) {
      showToast("Please enter the Bank Account Number.", true);
      return;
    }
    if (!profileData.ifscCode?.trim()) {
      showToast("Please enter the IFSC Code.", true);
      return;
    }

    setIsSavingPayout(true);
    try {
      const res = await api.put("/auth/payout-details", {
        account_holder: profileData.accountHolder,
        bank_name: profileData.bankName,
        account_number: profileData.accountNumber,
        ifsc_code: profileData.ifscCode,
        upi_id: profileData.upiId
      });

      if (res.data?.success) {
        localStorage.setItem("user", JSON.stringify({ ...storedUser, ...res.data.user }));
        window.dispatchEvent(new Event("storage"));
        showToast("Bank account and payout details saved successfully!");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save bank payout details.", true);
    } finally {
      setIsSavingPayout(false);
    }
  };

  // Standard Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    const { current, newPass, confirm } = passwords;
    if (!current || !newPass) return showToast("Please enter both current and new passwords.", true);
    if (newPass.length < 6) return showToast("New password must be at least 6 characters.", true);
    if (newPass !== confirm) return showToast("New password and confirmation do not match.", true);

    try {
      setPasswordLoading(true);
      const res = await api.put("/auth/change-password", { currentPassword: current, newPassword: newPass });
      if (res.data?.success) {
        showToast("Your password was updated successfully!");
        setPasswordMode("idle");
        setPasswords({ current: "", newPass: "", confirm: "" });
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to change password. Check your current password.", true);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Request 10-Minute Recovery OTP
  const handleRequestForgotOtp = async () => {
    try {
      setPasswordLoading(true);
      const res = await api.post("/auth/forgot-password", { email: profileData.email });
      if (res.data?.success) {
        setPasswordMode("forgot_otp");
        setOtpSecondsLeft(600);
        setIsOtpTimerActive(true);
        showToast("A 6-digit recovery code has been sent to your email! Valid for 10 minutes.");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to send recovery OTP.", true);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Reset Password with 10-Minute OTP
  const handleVerifyOtpAndResetPassword = async (e) => {
    e.preventDefault();
    const { newPass, confirm } = passwords;
    if (otpSecondsLeft <= 0) return showToast("This OTP has expired. Please click 'Resend Code' for a new OTP.", true);
    if (!otpCode.trim() || otpCode.trim().length !== 6) return showToast("Please enter the complete 6-digit OTP code.", true);
    if (!newPass || newPass.length < 6) return showToast("New password must be at least 6 characters.", true);
    if (newPass !== confirm) return showToast("Passwords do not match.", true);

    try {
      setPasswordLoading(true);
      const res = await api.post("/auth/reset-password", {
        email: profileData.email,
        otp: otpCode.trim(),
        newPassword: newPass
      });
      if (res.data?.success) {
        showToast("Password reset successfully! Your new password is now active.");
        setPasswordMode("idle");
        setOtpCode("");
        setPasswords({ current: "", newPass: "", confirm: "" });
        setIsOtpTimerActive(false);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Invalid or expired OTP. Please check the code.", true);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4 max-w-[1400px] mx-auto pb-6 sm:pb-8">
      {/* ── Top Hero Header Card (Scaled down to match Dashboard) ── */}
      <div className="rounded-xl sm:rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#111] p-3.5 sm:p-5 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 relative z-10">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-pink-500 via-rose-500 to-cyan-500 text-base sm:text-lg font-bold text-white shadow-xs">
              {(profileData.fullName?.charAt(0) || "O").toUpperCase()}
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white tracking-tight truncate">
                  {profileData.fullName}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <ShieldCheck size={11} /> Verified
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Zap size={10} className="fill-current" /> Pro Tier
                </span>
              </div>

              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <span className="truncate max-w-[140px] sm:max-w-none">{profileData.businessName}</span>
                <span>•</span>
                <span>ID: #{storedUser?.id || "OWN-17"}</span>
                <span>•</span>
                <span>Since {profileData.operatingSince}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => handleTabChange("security")}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-lg sm:rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 transition border border-gray-200 dark:border-white/10 cursor-pointer shrink-0"
          >
            <Lock size={13} className="text-cyan-500" />
            <span>Manage Password</span>
          </button>
        </div>
      </div>

      {/* ── Tabs Navigation Bar (Compact & Sleek) ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleTabChange(id)}
            className={`flex items-center gap-1.5 rounded-lg sm:rounded-xl px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === id
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white dark:bg-[#111] border border-gray-200/80 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <Icon size={13} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ── Toast Alerts ── */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 sm:p-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={15} className="shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-2.5 sm:p-3 text-xs font-semibold text-rose-600 dark:text-rose-400">
          <AlertCircle size={15} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ── TAB 1: PROFILE & BUSINESS DETAILS ── */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="space-y-3 sm:space-y-4">
          <div className="rounded-xl sm:rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#111] p-3.5 sm:p-5 shadow-xs">
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5 mb-3 sm:mb-4">
              <User size={15} className="text-blue-500" />
              <span>Personal Contact Details</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <InputField
                label="Full Name"
                icon={User}
                value={profileData.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                required
              />
              <InputField
                label="Registered Email (Locked)"
                icon={Mail}
                value={profileData.email}
                disabled
              />
              <InputField
                label="Primary Phone Number"
                icon={Phone}
                type="tel"
                value={profileData.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="+91 98765 43210"
              />
              <InputField
                label="WhatsApp / Emergency Phone"
                icon={PhoneCall}
                type="tel"
                value={profileData.secondaryPhone}
                onChange={(e) => updateField("secondaryPhone", e.target.value)}
                placeholder="+91 98765 43211"
              />
            </div>
          </div>

          <div className="rounded-xl sm:rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#111] p-3.5 sm:p-5 shadow-xs">
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5 mb-3 sm:mb-4">
              <Building size={15} className="text-cyan-500" />
              <span>PG Brand & Office Credentials</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <InputField
                label="PG Brand / Business Name"
                icon={Building}
                value={profileData.businessName}
                onChange={(e) => updateField("businessName", e.target.value)}
                placeholder="e.g. Dormn PG Management"
              />
              <InputField
                label="Operating Since"
                value={profileData.operatingSince}
                onChange={(e) => updateField("operatingSince", e.target.value)}
                placeholder="2022"
              />
              <InputField
                className="sm:col-span-2"
                label="Registered Office Address"
                icon={MapPin}
                rows={2}
                value={profileData.officeAddress}
                onChange={(e) => updateField("officeAddress", e.target.value)}
                placeholder="Plot No. 45, Knowledge Park, Near Amity University"
              />
              <InputField
                label="City"
                value={profileData.city}
                onChange={(e) => updateField("city", e.target.value)}
              />
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  State & PIN Code
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={profileData.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    placeholder="State"
                    className="w-full rounded-lg sm:rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#161616] px-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={profileData.pincode}
                    onChange={(e) => updateField("pincode", e.target.value)}
                    placeholder="PIN Code"
                    className="w-full rounded-lg sm:rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#161616] px-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="pt-4 sm:pt-5 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-lg sm:rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-bold text-white transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Save size={14} />
                <span>{isSaving ? "Saving..." : "Save Profile Details"}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ── TAB 2: BANK & PAYOUT DETAILS ── */}
      {activeTab === "payouts" && (
        <div className="space-y-3 sm:space-y-4">
          <div className="rounded-xl sm:rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#111] p-3.5 sm:p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2.5 sm:mb-3">
              <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <CreditCard size={15} className="text-emerald-500" />
                <span>Bank Account for Settlements</span>
              </h3>
              {profileData.accountNumber && profileData.ifscCode && profileData.accountHolder ? (
                <span className="self-start sm:self-auto inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 size={11} /> Active Account
                </span>
              ) : (
                <span className="self-start sm:self-auto inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <AlertCircle size={11} /> Action Required: Not Configured
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3 sm:mb-4 leading-relaxed">
              All student rent transactions and token bookings will be automatically credited to this designated account via Razorpay Settlements.
              {!profileData.accountNumber && (
                <span className="block mt-1 text-amber-600 dark:text-amber-400 font-semibold">
                  ⚠️ Note: You must configure and save your bank details here before you can add a PG property.
                </span>
              )}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <InputField
                label="Beneficiary Name"
                placeholder="e.g. Rahul Sharma"
                value={profileData.accountHolder}
                onChange={(e) => updateField("accountHolder", e.target.value)}
              />
              <InputField
                label="Bank Name"
                placeholder="e.g. HDFC Bank, State Bank of India"
                value={profileData.bankName}
                onChange={(e) => updateField("bankName", e.target.value)}
              />
              <InputField
                label="Account Number"
                placeholder="Enter bank account number"
                value={profileData.accountNumber}
                onChange={(e) => updateField("accountNumber", e.target.value)}
              />
              <InputField
                label="IFSC Code"
                uppercase
                placeholder="e.g. HDFC0001234"
                value={profileData.ifscCode}
                onChange={(e) => updateField("ifscCode", e.target.value)}
              />
              <InputField
                className="sm:col-span-2"
                label="Instant UPI ID for Rent Deposits"
                placeholder="e.g. username@okhdfcbank or 9876543210@upi"
                value={profileData.upiId}
                onChange={(e) => updateField("upiId", e.target.value)}
              />
            </div>
            <div className="pt-4 sm:pt-5 flex justify-end">
              <button
                type="button"
                onClick={handleSavePayout}
                disabled={isSavingPayout}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-lg sm:rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-bold text-white transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Check size={14} />
                <span>{isSavingPayout ? "Saving Payout..." : "Save Payout Method"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: LEGAL KYC & VERIFICATION ── */}
      {activeTab === "kyc" && (
        <div className="space-y-3 sm:space-y-4">
          <div className="rounded-xl sm:rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#111] p-3.5 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <BadgeCheck size={15} className="text-blue-500" />
                <span>Government KYC & Verification</span>
              </h3>
              <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <ShieldCheck size={11} /> Level 3
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5">
              {[
                { label: "PAN Card", val: profileData.panNumber, badge: profileData.panNumber ? "Verified by Admin" : "Pending Upload" },
                { label: "GSTIN (Optional)", val: profileData.gstin, badge: profileData.gstin ? "Active GST Registration" : "Not Provided" },
                { label: "Aadhaar Document", val: profileData.aadhaarMasked, badge: profileData.aadhaarMasked ? "UIDAI Compliant" : "Pending Verification" }
              ].map(({ label, val, badge }) => (
                <div key={label} className="p-3 sm:p-3.5 rounded-lg sm:rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#161616]">
                  <span className="text-[10px] font-semibold uppercase text-gray-400 block mb-0.5">{label}</span>
                  <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white font-mono">{val || "Not provided"}</span>
                  <div className={`mt-2 flex items-center gap-1 text-[11px] font-semibold ${val ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"}`}>
                    <CheckCircle2 size={11} /> {badge}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: SECURITY & PASSWORD ── */}
      {activeTab === "security" && (
        <div className="space-y-3 sm:space-y-4">
          <div className="rounded-xl sm:rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#111] p-3.5 sm:p-5 shadow-xs">
            <div className="pb-3 sm:pb-4 border-b border-gray-100 dark:border-white/10 mb-3 sm:mb-4">
              <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Lock size={15} className="text-cyan-500" />
                <span>Security & Password Settings</span>
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Manage your landlord credentials and two-step verification security.
              </p>
            </div>

            {/* STATE 1: IDLE VIEW */}
            {passwordMode === "idle" && (
              <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#161616] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 block mb-0.5">
                    Current Password Status
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-bold tracking-widest text-gray-900 dark:text-white">
                      ••••••••••••
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 text-[10px] font-semibold border border-emerald-500/20">
                      <CheckCircle2 size={11} /> Protected
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 font-medium">
                    We recommend updating your password periodically.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordMode("change");
                      setErrorMessage("");
                      setSuccessMessage("");
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-lg sm:rounded-xl bg-blue-600 hover:bg-blue-500 px-3.5 py-2 text-xs font-bold text-white transition shadow-xs cursor-pointer"
                  >
                    <KeyRound size={13} />
                    <span>Change Password</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPasswordMode("forgot_confirm");
                      setErrorMessage("");
                      setSuccessMessage("");
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-lg sm:rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 px-3.5 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 transition cursor-pointer"
                  >
                    <HelpCircle size={13} className="text-amber-500" />
                    <span>Forgot Password?</span>
                  </button>
                </div>
              </div>
            )}

            {/* STATE 2: CHANGE PASSWORD FORM */}
            {passwordMode === "change" && (
              <form onSubmit={handleChangePassword} className="space-y-3 sm:space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-white/10">
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <KeyRound size={14} className="text-blue-500" />
                    <span>Enter Current & New Password</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setPasswordMode("idle")}
                    className="text-xs font-semibold text-gray-400 hover:text-gray-700 dark:hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <PasswordInput
                    label="Current Password"
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    show={showPass.current}
                    onToggle={() => setShowPass({ ...showPass, current: !showPass.current })}
                    required
                  />
                  <PasswordInput
                    label="New Password (min 6 chars)"
                    value={passwords.newPass}
                    onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                    show={showPass.newPass}
                    onToggle={() => setShowPass({ ...showPass, newPass: !showPass.newPass })}
                    required
                    minLength={6}
                    placeholder="New Password"
                  />
                  <PasswordInput
                    label="Confirm New Password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    show={showPass.confirm}
                    onToggle={() => setShowPass({ ...showPass, confirm: !showPass.confirm })}
                    required
                    placeholder="Repeat New Password"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordMode("forgot_confirm");
                      setErrorMessage("");
                    }}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-left"
                  >
                    Forgot current password? Use Email OTP
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPasswordMode("idle")}
                      className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg sm:rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="flex-1 sm:flex-initial px-4 py-1.5 sm:px-5 sm:py-2 rounded-lg sm:rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-xs transition cursor-pointer disabled:opacity-50"
                    >
                      {passwordLoading ? "Saving..." : "Update Password"}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* STATE 3: FORGOT PASSWORD CONFIRMATION */}
            {passwordMode === "forgot_confirm" && (
              <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-amber-500">
                  <HelpCircle size={16} />
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                    Send 10-Minute Recovery Code
                  </h4>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  We will send a 6-digit recovery code to:
                  <strong className="text-gray-900 dark:text-white font-bold ml-1">{profileData.email}</strong>.
                  <br />
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">
                    Valid for exactly 10 minutes.
                  </span>
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={passwordLoading}
                    onClick={handleRequestForgotOtp}
                    className="flex items-center justify-center gap-1.5 rounded-lg sm:rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    <Mail size={13} />
                    <span>{passwordLoading ? "Sending..." : "Send Recovery OTP"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPasswordMode("idle")}
                    className="px-3 py-2 rounded-lg sm:rounded-xl border border-gray-300 dark:border-white/10 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* STATE 4: FORGOT PASSWORD OTP & 10-MINUTE TIMER */}
            {passwordMode === "forgot_otp" && (
              <form onSubmit={handleVerifyOtpAndResetPassword} className="space-y-3 sm:space-y-4 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-blue-500/20 bg-blue-500/[0.02] animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-white dark:bg-[#161616] border border-gray-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      otpSecondsLeft > 60 ? "bg-blue-500/20 text-blue-500" : "bg-rose-500/20 text-rose-500 animate-pulse"
                    }`}>
                      <Clock size={15} />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide block">
                        OTP Window
                      </span>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300 truncate max-w-[180px] sm:max-w-none block">
                        Sent to: <strong className="text-gray-900 dark:text-white">{profileData.email}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <span className="text-xs font-medium text-gray-400">Expires:</span>
                    <span className={`text-sm font-bold font-mono px-2 py-0.5 rounded-md ${
                      otpSecondsLeft > 60
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 animate-pulse"
                    }`}>
                      {formattedTimer}
                    </span>
                  </div>
                </div>

                {otpSecondsLeft <= 0 && (
                  <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle size={14} />
                      <span>OTP expired after 10 minutes.</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRequestForgotOtp}
                      className="px-2.5 py-1 rounded-md bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 transition cursor-pointer shrink-0"
                    >
                      Resend
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      6-Digit OTP
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      disabled={otpSecondsLeft <= 0}
                      className="w-full rounded-lg sm:rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#161616] px-3 py-2 text-center text-sm sm:text-base font-bold tracking-widest text-gray-900 dark:text-white outline-none focus:border-blue-500 disabled:opacity-50"
                      required
                    />
                  </div>
                  <PasswordInput
                    label="New Password"
                    value={passwords.newPass}
                    onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                    show={showPass.newPass}
                    onToggle={() => setShowPass({ ...showPass, newPass: !showPass.newPass })}
                    disabled={otpSecondsLeft <= 0}
                    required
                    minLength={6}
                    placeholder="New Password"
                  />
                  <PasswordInput
                    label="Confirm Password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    show={showPass.confirm}
                    onToggle={() => setShowPass({ ...showPass, confirm: !showPass.confirm })}
                    disabled={otpSecondsLeft <= 0}
                    required
                    placeholder="Repeat Password"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-gray-100 dark:border-white/10">
                  <button
                    type="button"
                    onClick={handleRequestForgotOtp}
                    disabled={passwordLoading}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center justify-center sm:justify-start gap-1"
                  >
                    <RotateCcw size={12} />
                    <span>Resend OTP Code</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPasswordMode("idle");
                        setIsOtpTimerActive(false);
                      }}
                      className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg sm:rounded-xl border border-gray-300 dark:border-white/10 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={passwordLoading || otpSecondsLeft <= 0 || otpCode.length !== 6}
                      className="flex-1 sm:flex-initial px-4 py-1.5 sm:px-5 sm:py-2 rounded-lg sm:rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-xs transition cursor-pointer disabled:opacity-50"
                    >
                      {passwordLoading ? "Verifying..." : "Verify & Update"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 5: MEMBERSHIP TIER ── */}
      {activeTab === "tier" && (
        <div className="space-y-3 sm:space-y-4">
          <div className="rounded-xl sm:rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-blue-600/10 p-4 sm:p-5 text-gray-900 dark:text-white shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="flex items-center gap-2">
                <Zap size={18} className="text-emerald-500 dark:text-emerald-400" />
                <span className="text-base sm:text-lg font-bold">Pro Landlord Plan</span>
              </div>
              <span className="rounded-md bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider shadow-xs">
                Active
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3 max-w-2xl">
              Includes unlimited verified PG listings, top search prominence, tenant digital KYC, and automated settlements.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-medium pt-2.5 border-t border-emerald-500/15">
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-semibold block mb-0.5">Billing</span>
                <span className="text-xs sm:text-sm font-bold">Monthly</span>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase font-semibold block mb-0.5">Renewal</span>
                <span className="text-xs sm:text-sm font-bold">Nov 30, 2026</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-gray-400 text-[10px] uppercase font-semibold block mb-0.5">Listings</span>
                <span className="text-xs sm:text-sm font-bold">Unlimited</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#111]">
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">Need to change your subscription?</h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Explore annual discounts and enterprise packages</p>
            </div>
            <button
              onClick={() => navigate("/owner/pricing")}
              className="w-full sm:w-auto rounded-lg sm:rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-xs font-bold transition shadow-xs cursor-pointer shrink-0 text-center"
            >
              Explore Plans
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerProfile;
