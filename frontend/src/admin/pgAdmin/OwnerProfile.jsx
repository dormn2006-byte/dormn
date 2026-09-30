import { useState, useEffect, useMemo, useContext } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
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
  HelpCircle,
  FileText,
  Trash2,
  Plus
} from "lucide-react";
import api from "../../services/api";
import DeleteAccountModal from "../../components/auth/DeleteAccountModal";
import BankAccountCard from "./components/BankAccountCard";
import BankAccountModal from "./components/BankAccountModal";

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
  rows,
  maxLength
}) => (
  <div className={className}>
    <label className="block text-[10px] lg:text-xs font-bold text-gray-500 dark:text-gray-400 lg:text-gray-700 dark:lg:text-gray-300 mb-0.5 lg:mb-1.5 truncate">
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <Icon
          size={12}
          className={`absolute left-2 sm:left-2.5 lg:left-3.5 ${rows ? "top-2 lg:top-3" : "top-1/2 -translate-y-1/2"} text-gray-400 pointer-events-none lg:w-4 lg:h-4`}
        />
      )}
      {rows ? (
        <textarea
          rows={rows}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full rounded-md sm:rounded-lg lg:rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#161616] ${
            Icon ? "pl-6 sm:pl-7 lg:pl-10" : "px-2 sm:px-2.5 lg:px-3.5"
          } pr-2 lg:pr-3 py-1 lg:py-2.5 text-xs lg:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-blue-500`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          className={`w-full h-8 lg:h-11 rounded-md sm:rounded-lg lg:rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#161616] ${
            Icon ? "pl-6 sm:pl-7 lg:pl-10" : "px-2 sm:px-2.5 lg:px-3.5"
          } pr-2 lg:pr-3.5 text-xs lg:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-blue-500 ${
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
    <label className="block text-[10px] lg:text-xs font-bold text-gray-500 dark:text-gray-400 lg:text-gray-700 dark:lg:text-gray-300 mb-0.5 lg:mb-1.5 truncate">{label}</label>
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        minLength={minLength}
        className="w-full h-8 lg:h-11 rounded-md sm:rounded-lg lg:rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#161616] pl-2.5 lg:pl-3.5 pr-8 lg:pr-10 text-xs lg:text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 disabled:opacity-50"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-2.5 lg:right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
      >
        {show ? <EyeOff size={14} className="lg:w-4 lg:h-4" /> : <Eye size={14} className="lg:w-4 lg:h-4" />}
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

const mapUserToProfile = (u = {}) => ({
  fullName: u.full_name || u.name || "",
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

const OwnerProfile = ({ defaultTab = "profile" }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, updateUser } = useContext(AuthContext) || {};
  const tabParam = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState(tabParam || defaultTab);
  const [isSaving, setIsSaving] = useState(false);
  const [isProfileSaved, setIsProfileSaved] = useState(false);
  const [isSavingPayout, setIsSavingPayout] = useState(false);
  const [isSavingKyc, setIsSavingKyc] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const [profileData, setProfileData] = useState(() => mapUserToProfile(storedUser));
  const [isPayoutSaved, setIsPayoutSaved] = useState(() => Boolean(storedUser?.account_number && storedUser?.ifsc_code));

  // Helper to extract or synthesize initial bank accounts
  const getInitialAccounts = () => {
    if (Array.isArray(storedUser?.bank_accounts) && storedUser.bank_accounts.length > 0) {
      return storedUser.bank_accounts;
    }
    if (storedUser?.account_number && storedUser?.ifsc_code) {
      return [{
        id: "primary-account",
        account_holder: storedUser.account_holder || storedUser.full_name || "Account Holder",
        bank_name: storedUser.bank_name || "Primary Bank",
        account_number: storedUser.account_number,
        account_number_masked: `•••• •••• •••• ${String(storedUser.account_number).slice(-4)}`,
        ifsc_code: storedUser.ifsc_code,
        upi_id: storedUser.upi_id || "",
        is_primary: true,
      }];
    }
    return [];
  };

  // Multi-Bank Accounts State
  const [bankAccounts, setBankAccounts] = useState(getInitialAccounts);
  const [isBankLoading, setIsBankLoading] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState(null);

  // Sync updated user to context and localStorage
  const syncUser = (u) => {
    if (updateUser) updateUser(u);
    else localStorage.setItem("user", JSON.stringify({ ...storedUser, ...u }));
  };

  const fetchBankAccounts = async () => {
    try {
      setIsBankLoading(true);
      const res = await api.get("/auth/bank-accounts");
      if (res.data?.success) {
        let accounts = res.data.bank_accounts || [];
        if (accounts.length === 0 && (storedUser?.account_number || user?.account_number)) {
          const accNum = storedUser?.account_number || user?.account_number;
          const ifsc = storedUser?.ifsc_code || user?.ifsc_code;
          if (accNum && ifsc) {
            accounts = [{
              id: "primary-account",
              account_holder: storedUser?.account_holder || user?.account_holder || storedUser?.full_name || user?.full_name || "Account Holder",
              bank_name: storedUser?.bank_name || user?.bank_name || "Primary Bank",
              account_number: accNum,
              account_number_masked: `•••• •••• •••• ${String(accNum).slice(-4)}`,
              ifsc_code: ifsc,
              upi_id: storedUser?.upi_id || user?.upi_id || "",
              is_primary: true,
            }];
          }
        }
        setBankAccounts(accounts);
        setIsPayoutSaved(accounts.length > 0);
      }
    } catch (err) {
      console.error("Failed to load bank accounts:", err);
    } finally {
      setIsBankLoading(false);
    }
  };

  // Load real profile and payout details from database on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/auth/profile");
        if (res.data?.success && res.data.user) {
          const u = res.data.user;
          setProfileData(mapUserToProfile(u));
          syncUser(u);
          if (u.account_number && u.ifsc_code) setIsPayoutSaved(true);
          if (Array.isArray(u.bank_accounts) && u.bank_accounts.length > 0) {
            setBankAccounts(u.bank_accounts);
            setIsPayoutSaved(true);
          } else if (u.account_number && u.ifsc_code) {
            setBankAccounts([{
              id: "primary-account",
              account_holder: u.account_holder || u.full_name || "Account Holder",
              bank_name: u.bank_name || "Primary Bank",
              account_number: u.account_number,
              account_number_masked: `•••• •••• •••• ${String(u.account_number).slice(-4)}`,
              ifsc_code: u.ifsc_code,
              upi_id: u.upi_id || "",
              is_primary: true,
            }]);
            setIsPayoutSaved(true);
          }
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
      }
    })();
    fetchBankAccounts();
  }, []);

  // Ensure fresh accounts are fetched whenever user opens the Bank & Payouts tab
  useEffect(() => {
    if (activeTab === "payouts") {
      fetchBankAccounts();
    }
  }, [activeTab]);

  const handleSetPrimaryBank = async (acc) => {
    try {
      const res = await api.patch(`/auth/bank-accounts/${acc.id}/primary`);
      if (res.data?.success) {
        setBankAccounts(res.data.bank_accounts || []);
        syncUser(res.data.user);
        if (res.data.user) setProfileData(mapUserToProfile(res.data.user));
        showToast("Primary settlement bank account updated!");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to set primary bank account", true);
    }
  };

  const handleDeleteBank = async (acc) => {
    if (!window.confirm(`Are you sure you want to remove ${acc.bank_name} (${acc.account_number_masked || acc.account_number})?`)) return;
    try {
      const res = await api.delete(`/auth/bank-accounts/${acc.id}`);
      if (res.data?.success) {
        setBankAccounts(res.data.bank_accounts || []);
        syncUser(res.data.user);
        if (res.data.user) setProfileData(mapUserToProfile(res.data.user));
        showToast("Bank account removed successfully!");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to remove bank account", true);
    }
  };

  const handleBankSuccess = (savedAcc, allAccounts, updatedUser) => {
    if (allAccounts && allAccounts.length > 0) {
      setBankAccounts(allAccounts);
    } else {
      fetchBankAccounts();
    }
    if (updatedUser) {
      syncUser(updatedUser);
      setProfileData(mapUserToProfile(updatedUser));
    }
    showToast(accountToEdit ? "Bank account updated successfully!" : "New bank account added successfully!");
    setIsBankModalOpen(false);
    setAccountToEdit(null);
  };

  const updateField = (key, val) => {
    setProfileData((prev) => ({ ...prev, [key]: val }));
    if (["accountHolder", "bankName", "accountNumber", "ifscCode", "upiId"].includes(key)) {
      setIsPayoutSaved(false);
    } else {
      setIsProfileSaved(false);
    }
  };

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
        syncUser(res.data.user);
        setIsProfileSaved(true);
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
    const { accountHolder, bankName, accountNumber, ifscCode, upiId } = profileData;
    if (!accountHolder?.trim()) return showToast("Please enter Beneficiary / Account Holder Name.", true);
    if (!bankName?.trim()) return showToast("Please enter Bank Name.", true);
    if (!accountNumber?.trim()) return showToast("Please enter Bank Account Number.", true);
    if (!ifscCode?.trim()) return showToast("Please enter IFSC Code.", true);

    const cleanIfsc = ifscCode.trim().toUpperCase();
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
      return showToast("Invalid IFSC Code format (e.g. HDFC0001234, SBIN0001234).", true);
    }

    setIsSavingPayout(true);
    try {
      const res = await api.put("/auth/payout-details", {
        account_holder: accountHolder.trim(),
        bank_name: bankName.trim(),
        account_number: accountNumber.trim(),
        ifsc_code: cleanIfsc,
        upi_id: upiId?.trim() || ""
      });
      if (res.data?.success) {
        syncUser(res.data.user);
        setIsPayoutSaved(true);
        showToast("Bank account and payout details saved successfully!");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save bank payout details.", true);
    } finally {
      setIsSavingPayout(false);
    }
  };

  // Save Legal KYC & Government Identification
  const handleSaveKyc = async (e) => {
    if (e) e.preventDefault();
    const pan = profileData.panNumber?.trim()?.toUpperCase();
    const aadhaar = profileData.aadhaarMasked?.trim();
    const gstin = profileData.gstin?.trim()?.toUpperCase();

    if (!pan && !aadhaar && !gstin) return showToast("Please enter at least a PAN Number or Aadhaar Number.", true);
    if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) return showToast("Invalid PAN format (e.g. ABCDE1234F).", true);

    setIsSavingKyc(true);
    try {
      const res = await api.put("/auth/profile", {
        pan_number: pan || null,
        aadhaar_masked: aadhaar || null,
        gstin: gstin || null
      });
      if (res.data?.success) {
        syncUser(res.data.user);
        showToast("KYC details submitted successfully! Encrypted & queued for verification.");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to submit KYC details.", true);
    } finally {
      setIsSavingKyc(false);
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
    <div className="space-y-2.5 sm:space-y-3 lg:space-y-4.5 max-w-[1200px] mx-auto pb-6">
      {/* ── Top Hero Header Card ── */}
      <div className="rounded-xl lg:rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#111] p-2.5 sm:p-3.5 lg:p-5 shadow-xs lg:shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 lg:gap-4 relative z-10">
          <div className="flex items-center gap-2.5 lg:gap-3.5 w-full sm:w-auto">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 lg:h-13 lg:w-13 shrink-0 items-center justify-center rounded-lg lg:rounded-xl bg-gradient-to-tr from-pink-500 via-rose-500 to-cyan-500 text-sm sm:text-base lg:text-xl font-black text-white shadow-xs">
              {(profileData.fullName?.charAt(0) || "O").toUpperCase()}
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 lg:gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base lg:text-xl font-black text-gray-900 dark:text-white tracking-tight truncate">
                  {profileData.fullName}
                </h1>
                <span className="inline-flex items-center gap-0.5 lg:gap-1 rounded-md bg-blue-500/10 px-1.5 lg:px-2.5 py-0.2 lg:py-0.5 text-[9px] lg:text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <ShieldCheck size={10} className="lg:w-3.5 lg:h-3.5" /> Verified
                </span>
                <span className="inline-flex items-center gap-0.5 lg:gap-1 rounded-md bg-emerald-500/10 px-1.5 lg:px-2.5 py-0.2 lg:py-0.5 text-[9px] lg:text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Zap size={9} className="fill-current lg:w-3 lg:h-3" /> {user?.subscription_tier ? `${user.subscription_tier.charAt(0).toUpperCase() + user.subscription_tier.slice(1)} Tier` : "Free Tier"}
                </span>
              </div>

              <p className="text-[10px] lg:text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5 lg:mt-1 flex flex-wrap items-center gap-x-1.5 lg:gap-x-2 gap-y-0.5">
                <span className="truncate max-w-[140px] sm:max-w-none font-semibold text-gray-700 dark:text-gray-300">{profileData.businessName || "PG Owner"}</span>
                <span>•</span>
                <span>ID: #{storedUser?.id || "OWN-17"}</span>
                <span>•</span>
                <span>Since {profileData.operatingSince || "2024"}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => handleTabChange("security")}
            className="self-start sm:self-auto flex items-center justify-center gap-1.5 rounded-lg lg:rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 px-2.5 py-1 lg:px-4 lg:py-2 text-[10px] sm:text-[11px] lg:text-xs font-bold text-gray-700 dark:text-gray-300 transition border border-gray-200 dark:border-white/10 cursor-pointer shrink-0"
          >
            <Lock size={12} className="text-cyan-500 lg:w-3.5 lg:h-3.5" />
            <span>Manage Password</span>
          </button>
        </div>
      </div>

      {/* ── Tabs Navigation Bar ── */}
      <div className="flex items-center gap-1 lg:gap-2 overflow-x-auto pb-0.5 scrollbar-none">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleTabChange(id)}
            className={`flex items-center gap-1 lg:gap-1.5 rounded-lg lg:rounded-xl px-2.5 py-1 lg:px-4 lg:py-2.5 text-[11px] lg:text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === id
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white dark:bg-[#111] border border-gray-200/80 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <Icon size={12} className="lg:w-3.5 lg:h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ── Toast Alerts ── */}
      {successMessage && (
        <div className="flex items-center gap-1.5 lg:gap-2 rounded-lg lg:rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2 lg:p-3 text-[11px] lg:text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={13} className="shrink-0 lg:w-4 lg:h-4" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center gap-1.5 lg:gap-2 rounded-lg lg:rounded-xl bg-rose-500/10 border border-rose-500/20 p-2 lg:p-3 text-[11px] lg:text-xs font-semibold text-rose-600 dark:text-rose-400">
          <AlertCircle size={13} className="shrink-0 lg:w-4 lg:h-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ── TAB 1: PROFILE & BUSINESS DETAILS ── */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="space-y-2.5 sm:space-y-3 lg:space-y-4">
          <div className="rounded-xl lg:rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#111] p-3 sm:p-3.5 lg:p-6 shadow-xs lg:shadow-sm">
            <h3 className="text-xs lg:text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5 lg:gap-2 mb-2.5 lg:mb-4">
              <User size={14} className="text-blue-500 lg:w-4 lg:h-4" />
              <span>Personal Contact Details</span>
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5 lg:gap-4">
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
                placeholder="10-digit number"
              />
              <InputField
                label="WhatsApp / Emergency Phone"
                icon={PhoneCall}
                type="tel"
                value={profileData.secondaryPhone}
                onChange={(e) => updateField("secondaryPhone", e.target.value)}
                placeholder="WhatsApp contact number"
              />
            </div>
          </div>

          <div className="rounded-xl lg:rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#111] p-3 sm:p-3.5 lg:p-6 shadow-xs lg:shadow-sm">
            <h3 className="text-xs lg:text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5 lg:gap-2 mb-2.5 lg:mb-4">
              <Building size={14} className="text-cyan-500 lg:w-4 lg:h-4" />
              <span>PG Brand &amp; Office Credentials</span>
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5 lg:gap-4">
              <InputField
                label="PG Brand / Business Name"
                icon={Building}
                value={profileData.businessName}
                onChange={(e) => updateField("businessName", e.target.value)}
                placeholder="Enter PG brand name"
              />
              <InputField
                label="Operating Since"
                value={profileData.operatingSince}
                onChange={(e) => updateField("operatingSince", e.target.value)}
                placeholder="e.g. 2024"
              />
              <InputField
                className="col-span-2"
                label="Registered Office Address"
                icon={MapPin}
                rows={1}
                value={profileData.officeAddress}
                onChange={(e) => updateField("officeAddress", e.target.value)}
                placeholder="Enter registered office address"
              />
              <InputField
                label="City"
                value={profileData.city}
                onChange={(e) => updateField("city", e.target.value)}
                placeholder="Enter city"
              />
              <div>
                <label className="block text-[10px] lg:text-xs font-bold text-gray-500 dark:text-gray-400 lg:text-gray-700 dark:lg:text-gray-300 mb-0.5 lg:mb-1.5 truncate">
                  State &amp; PIN Code
                </label>
                <div className="grid grid-cols-2 gap-1.5 lg:gap-2">
                  <input
                    type="text"
                    value={profileData.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    placeholder="State"
                    className="w-full h-8 lg:h-11 rounded-md sm:rounded-lg lg:rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#161616] px-2 lg:px-3.5 text-xs lg:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={profileData.pincode}
                    onChange={(e) => updateField("pincode", e.target.value)}
                    placeholder="PIN"
                    className="w-full h-8 lg:h-11 rounded-md sm:rounded-lg lg:rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#161616] px-2 lg:px-3.5 text-xs lg:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="pt-3 lg:pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-lg lg:rounded-xl bg-blue-600 hover:bg-blue-500 h-8 lg:h-11 px-4 lg:px-6 text-xs lg:text-sm font-bold text-white transition shadow-xs lg:shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isProfileSaved ? <Check size={13} className="lg:w-4 lg:h-4 stroke-[2.5]" /> : <Save size={13} className="lg:w-4 lg:h-4" />}
                <span>{isSaving ? "Saving..." : isProfileSaved ? "Saved" : "Save Profile Details"}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ── TAB 2: BANK & PAYOUT DETAILS ── */}
      {activeTab === "payouts" && (
        <div className="space-y-3 sm:space-y-4">
          <div className="rounded-xl lg:rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#111] p-3 sm:p-4 lg:p-6 shadow-xs lg:shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100 dark:border-white/10">
              <div>
                <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-white flex items-center gap-1.5 lg:gap-2">
                  <CreditCard size={16} className="text-emerald-500" />
                  <span>Settlement Bank Accounts</span>
                </h3>
                <p className="text-[11px] lg:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Manage bank accounts where your PG student rent and token deposits will be transferred.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAccountToEdit(null);
                  setIsBankModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition shadow-sm hover:scale-105 active:scale-95 cursor-pointer shrink-0"
              >
                <Plus size={14} className="stroke-[3]" />
                <span>+ Add Bank Account</span>
              </button>
            </div>

            {/* Bank Accounts List / Cards */}
            <div className="mt-4">
              {isBankLoading ? (
                <div className="py-12 text-center text-xs font-semibold text-gray-400 animate-pulse">
                  Loading saved bank accounts...
                </div>
              ) : bankAccounts.length === 0 ? (
                <div className="py-10 px-4 text-center rounded-2xl border-2 border-dashed border-amber-300 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/10 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                    <Building size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900 dark:text-white">No Bank Account Configured</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 max-w-md mx-auto leading-relaxed">
                      You must add at least one bank account before you can list your PG properties and receive tenant rent payouts.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAccountToEdit(null);
                      setIsBankModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition shadow-md hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Plus size={14} className="stroke-[3]" />
                    <span>Add Bank Account Now</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {bankAccounts.map((acc) => (
                    <BankAccountCard
                      key={acc.id}
                      account={acc}
                      isPrimary={Boolean(acc.is_primary)}
                      onEdit={(account) => {
                        setAccountToEdit(account);
                        setIsBankModalOpen(true);
                      }}
                      onSetPrimary={handleSetPrimaryBank}
                      onDelete={bankAccounts.length > 1 ? handleDeleteBank : undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: LEGAL KYC & VERIFICATION ── */}
      {activeTab === "kyc" && (
        <div className="space-y-2.5 sm:space-y-3 lg:space-y-4">
          <div className="rounded-xl lg:rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#111] p-3 sm:p-3.5 lg:p-6 shadow-xs lg:shadow-sm">
            <div className="flex items-center justify-between mb-1.5 lg:mb-2">
              <h3 className="text-xs lg:text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5 lg:gap-2">
                <BadgeCheck size={14} className="text-blue-500 lg:w-4 lg:h-4" />
                <span>Government KYC &amp; Verification</span>
              </h3>
              <span className="inline-flex items-center gap-0.5 lg:gap-1 rounded-md bg-blue-500/10 px-1.5 lg:px-2.5 py-0.2 lg:py-0.5 text-[9px] lg:text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <ShieldCheck size={10} className="lg:w-3.5 lg:h-3.5" /> Level 3
              </span>
            </div>
            <p className="text-[10px] lg:text-xs text-gray-500 dark:text-gray-400 mb-2.5 lg:mb-4 leading-relaxed">
              Submit your official tax and identity documents for landlord accreditation, regulatory compliance, and verified badges.
            </p>

            {/* Current Verified Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 lg:gap-3 mb-3 lg:mb-4">
              {[
                { label: "PAN Card", val: profileData.panNumber, badge: profileData.panNumber ? "Verified / Active" : "Action Required" },
                { label: "GSTIN (Optional)", val: profileData.gstin, badge: profileData.gstin ? "Active GST" : "Not Provided" },
                { label: "Aadhaar Document", val: profileData.aadhaarMasked, badge: profileData.aadhaarMasked ? "UIDAI Compliant" : "Action Required", span: "col-span-2 sm:col-span-1" }
              ].map(({ label, val, badge, span }) => (
                <div key={label} className={`p-2 sm:p-2.5 lg:p-4 rounded-lg lg:rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#161616] ${span || ""}`}>
                  <span className="text-[9px] lg:text-xs font-semibold uppercase text-gray-400 block mb-0.5">{label}</span>
                  <span className="text-xs lg:text-sm font-bold text-gray-900 dark:text-white font-mono truncate block">{val || "Not provided"}</span>
                  <div className={`mt-1 lg:mt-1.5 flex items-center gap-1 text-[10px] lg:text-xs font-semibold ${val ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                    {val ? <CheckCircle2 size={10} className="lg:w-3.5 lg:h-3.5" /> : <AlertCircle size={10} className="lg:w-3.5 lg:h-3.5" />}
                    <span>{badge}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* KYC Input & Submission Form */}
            <form onSubmit={handleSaveKyc} className="pt-2.5 lg:pt-4 border-t border-gray-100 dark:border-white/10">
              <h4 className="text-[11px] lg:text-xs font-bold text-gray-900 dark:text-white mb-2 lg:mb-3 flex items-center gap-1 lg:gap-1.5">
                <FileText size={12} className="text-blue-500 lg:w-3.5 lg:h-3.5" />
                <span>Enter &amp; Verify Identification Details</span>
              </h4>

              <div className="grid grid-cols-2 gap-2 sm:gap-2.5 lg:gap-4">
                <InputField
                  label="PAN Card Number"
                  icon={BadgeCheck}
                  uppercase
                  value={profileData.panNumber}
                  onChange={(e) => updateField("panNumber", e.target.value.toUpperCase())}
                  placeholder="e.g. ABCDE1234F"
                  maxLength={10}
                />
                <InputField
                  label="Aadhaar Number (UID)"
                  icon={ShieldCheck}
                  value={profileData.aadhaarMasked}
                  onChange={(e) => updateField("aadhaarMasked", e.target.value)}
                  placeholder="12-digit Aadhaar UID"
                  maxLength={14}
                />
                <InputField
                  className="col-span-2"
                  label="GSTIN Number (Optional)"
                  icon={Building}
                  uppercase
                  value={profileData.gstin}
                  onChange={(e) => updateField("gstin", e.target.value.toUpperCase())}
                  placeholder="15-digit GSTIN (e.g. 07AAAAA0000A1Z5)"
                  maxLength={15}
                />
              </div>

              <div className="pt-3 lg:pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingKyc}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-lg lg:rounded-xl bg-blue-600 hover:bg-blue-500 h-8 lg:h-11 px-4 lg:px-6 text-xs lg:text-sm font-bold text-white transition shadow-xs lg:shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Save size={13} className="lg:w-4 lg:h-4" />
                  <span>{isSavingKyc ? "Submitting KYC..." : "Submit KYC for Verification"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── TAB 4: SECURITY & PASSWORD ── */}
      {activeTab === "security" && (
        <div className="space-y-2.5 sm:space-y-3 lg:space-y-4">
          <div className="rounded-xl lg:rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#111] p-3 sm:p-3.5 lg:p-6 shadow-xs lg:shadow-sm">
            <div className="pb-2 lg:pb-3 border-b border-gray-100 dark:border-white/10 mb-2.5 lg:mb-4">
              <h3 className="text-xs lg:text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5 lg:gap-2">
                <Lock size={14} className="text-cyan-500 lg:w-4 lg:h-4" />
                <span>Security &amp; Password Settings</span>
              </h3>
              <p className="text-[10px] lg:text-xs text-gray-500 dark:text-gray-400 mt-0.5 lg:mt-1">
                Manage your landlord credentials and two-step verification security.
              </p>
            </div>

            {/* STATE 1: IDLE VIEW */}
            {passwordMode === "idle" && (
              <div className="p-2.5 sm:p-3 lg:p-5 rounded-lg lg:rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#161616] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 lg:gap-4">
                <div>
                  <span className="text-[9px] lg:text-xs font-semibold uppercase tracking-wide text-gray-400 block mb-0.5">
                    Current Password Status
                  </span>
                  <div className="flex items-center gap-1.5 lg:gap-2">
                    <span className="text-xs sm:text-sm lg:text-base font-bold tracking-widest text-gray-900 dark:text-white">
                      ••••••••••••
                    </span>
                    <span className="inline-flex items-center gap-0.5 lg:gap-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 lg:px-2.5 py-0.2 lg:py-0.5 text-[9px] lg:text-xs font-semibold border border-emerald-500/20">
                      <CheckCircle2 size={10} className="lg:w-3.5 lg:h-3.5" /> Protected
                    </span>
                  </div>
                  <p className="text-[10px] lg:text-xs text-gray-500 dark:text-gray-400 mt-0.5 lg:mt-1 font-medium">
                    We recommend updating your password periodically.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 lg:gap-2 w-full sm:w-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordMode("change");
                      setErrorMessage("");
                      setSuccessMessage("");
                    }}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1 rounded-lg lg:rounded-xl bg-blue-600 hover:bg-blue-500 h-8 lg:h-10 px-3 lg:px-4 text-[11px] lg:text-xs font-bold text-white transition shadow-xs lg:shadow-sm cursor-pointer"
                  >
                    <KeyRound size={12} className="lg:w-3.5 lg:h-3.5" />
                    <span>Change Password</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPasswordMode("forgot_confirm");
                      setErrorMessage("");
                      setSuccessMessage("");
                    }}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1 rounded-lg lg:rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 h-8 lg:h-10 px-3 lg:px-4 text-[11px] lg:text-xs font-semibold text-gray-700 dark:text-gray-300 transition cursor-pointer"
                  >
                    <HelpCircle size={12} className="text-amber-500 lg:w-3.5 lg:h-3.5" />
                    <span>Forgot?</span>
                  </button>
                </div>
              </div>
            )}

            {/* STATE 2: CHANGE PASSWORD FORM */}
            {passwordMode === "change" && (
              <form onSubmit={handleChangePassword} className="space-y-2.5 lg:space-y-3.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-1.5 lg:pb-2 border-b border-gray-100 dark:border-white/10">
                  <h4 className="text-xs lg:text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1 lg:gap-1.5">
                    <KeyRound size={13} className="text-blue-500 lg:w-4 lg:h-4" />
                    <span>Enter Current &amp; New Password</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setPasswordMode("idle")}
                    className="text-[11px] lg:text-xs font-semibold text-gray-400 hover:text-gray-700 dark:hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 lg:gap-3">
                  <PasswordInput
                    label="Current Password"
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    show={showPass.current}
                    onToggle={() => setShowPass({ ...showPass, current: !showPass.current })}
                    required
                  />
                  <PasswordInput
                    label="New Password"
                    value={passwords.newPass}
                    onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                    show={showPass.newPass}
                    onToggle={() => setShowPass({ ...showPass, newPass: !showPass.newPass })}
                    required
                    minLength={6}
                    placeholder="Min 6 chars"
                  />
                  <PasswordInput
                    label="Confirm New Password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    show={showPass.confirm}
                    onToggle={() => setShowPass({ ...showPass, confirm: !showPass.confirm })}
                    required
                    placeholder="Repeat password"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 lg:pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordMode("forgot_confirm");
                      setErrorMessage("");
                    }}
                    className="text-[11px] lg:text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Forgot current password?
                  </button>

                  <div className="flex items-center gap-1.5 lg:gap-2">
                    <button
                      type="button"
                      onClick={() => setPasswordMode("idle")}
                      className="h-8 lg:h-10 px-2.5 lg:px-4 rounded-lg lg:rounded-xl border border-gray-200 dark:border-white/10 text-[11px] lg:text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="h-8 lg:h-10 px-3 lg:px-5 rounded-lg lg:rounded-xl bg-blue-600 hover:bg-blue-500 text-[11px] lg:text-xs font-bold text-white shadow-xs lg:shadow-sm transition cursor-pointer disabled:opacity-50"
                    >
                      {passwordLoading ? "Saving..." : "Update Password"}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* STATE 3: FORGOT PASSWORD CONFIRMATION */}
            {passwordMode === "forgot_confirm" && (
              <div className="p-2.5 sm:p-3 lg:p-5 rounded-lg lg:rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2 lg:space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-1.5 text-amber-500">
                  <HelpCircle size={14} className="lg:w-4 lg:h-4" />
                  <h4 className="text-xs lg:text-sm font-bold text-gray-900 dark:text-white">
                    Send 10-Minute Recovery Code
                  </h4>
                </div>
                <p className="text-[11px] lg:text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  We will send a 6-digit recovery code to: <strong className="text-gray-900 dark:text-white">{profileData.email}</strong>. Valid for 10 minutes.
                </p>
                <div className="flex items-center gap-1.5 lg:gap-2 pt-0.5">
                  <button
                    type="button"
                    disabled={passwordLoading}
                    onClick={handleRequestForgotOtp}
                    className="flex items-center justify-center gap-1 rounded-lg lg:rounded-xl bg-blue-600 hover:bg-blue-500 h-8 lg:h-10 px-3 lg:px-4 text-[11px] lg:text-xs font-bold text-white shadow-xs lg:shadow-sm transition cursor-pointer disabled:opacity-50"
                  >
                    <Mail size={12} className="lg:w-3.5 lg:h-3.5" />
                    <span>{passwordLoading ? "Sending..." : "Send OTP"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPasswordMode("idle")}
                    className="h-8 lg:h-10 px-2.5 lg:px-4 rounded-lg lg:rounded-xl border border-gray-300 dark:border-white/10 text-[11px] lg:text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* STATE 4: FORGOT PASSWORD OTP & 10-MINUTE TIMER */}
            {passwordMode === "forgot_otp" && (
              <form onSubmit={handleVerifyOtpAndResetPassword} className="space-y-2.5 lg:space-y-3.5 p-2.5 sm:p-3.5 lg:p-5 rounded-lg lg:rounded-xl border border-blue-500/20 bg-blue-500/[0.02] animate-in fade-in duration-200">
                <div className="flex items-center justify-between gap-2 p-2 lg:p-3 rounded-lg lg:rounded-xl bg-white dark:bg-[#161616] border border-gray-200 dark:border-white/10">
                  <div className="flex items-center gap-1.5 lg:gap-2">
                    <div className={`flex h-7 w-7 lg:h-9 lg:w-9 items-center justify-center rounded-md lg:rounded-lg ${
                      otpSecondsLeft > 60 ? "bg-blue-500/20 text-blue-500" : "bg-rose-500/20 text-rose-500 animate-pulse"
                    }`}>
                      <Clock size={13} className="lg:w-4 lg:h-4" />
                    </div>
                    <div>
                      <span className="text-[9px] lg:text-xs font-semibold text-gray-400 uppercase block">OTP Window</span>
                      <span className="text-[11px] lg:text-xs font-medium text-gray-600 dark:text-gray-300 truncate max-w-[150px] sm:max-w-none block">
                        Sent to: <strong className="text-gray-900 dark:text-white">{profileData.email}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] lg:text-xs text-gray-400">Expires:</span>
                    <span className={`text-xs lg:text-sm font-bold font-mono px-1.5 py-0.2 rounded ${
                      otpSecondsLeft > 60
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 animate-pulse"
                    }`}>
                      {formattedTimer}
                    </span>
                  </div>
                </div>

                {otpSecondsLeft <= 0 && (
                  <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] lg:text-xs font-semibold flex items-center justify-between gap-1.5">
                    <span>OTP expired.</span>
                    <button
                      type="button"
                      onClick={handleRequestForgotOtp}
                      className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] lg:text-xs font-bold hover:bg-rose-500 cursor-pointer shrink-0"
                    >
                      Resend
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 lg:gap-3">
                  <div>
                    <label className="block text-[10px] lg:text-xs font-bold text-gray-500 dark:text-gray-400 mb-0.5 lg:mb-1.5">6-Digit OTP</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      disabled={otpSecondsLeft <= 0}
                      className="w-full h-8 lg:h-11 rounded-md sm:rounded-lg lg:rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#161616] px-2 lg:px-3 text-center text-xs lg:text-sm font-bold tracking-widest text-gray-900 dark:text-white outline-none focus:border-blue-500 disabled:opacity-50"
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

                <div className="flex items-center justify-between gap-2 pt-1 lg:pt-2 border-t border-gray-100 dark:border-white/10">
                  <button
                    type="button"
                    onClick={handleRequestForgotOtp}
                    disabled={passwordLoading}
                    className="text-[11px] lg:text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw size={11} className="lg:w-3.5 lg:h-3.5" />
                    <span>Resend OTP</span>
                  </button>
                  <div className="flex items-center gap-1.5 lg:gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPasswordMode("idle");
                        setIsOtpTimerActive(false);
                      }}
                      className="h-8 lg:h-10 px-2.5 lg:px-4 rounded-lg lg:rounded-xl border border-gray-300 dark:border-white/10 text-[11px] lg:text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={passwordLoading || otpSecondsLeft <= 0 || otpCode.length !== 6}
                      className="h-8 lg:h-10 px-3 lg:px-5 rounded-lg lg:rounded-xl bg-emerald-600 hover:bg-emerald-500 text-[11px] lg:text-xs font-bold text-white shadow-xs lg:shadow-sm transition cursor-pointer disabled:opacity-50"
                    >
                      {passwordLoading ? "Verifying..." : "Verify & Update"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Danger Zone: Delete Account */}
          <div className="rounded-xl lg:rounded-2xl border border-red-500/20 bg-red-500/5 p-3 sm:p-3.5 lg:p-6 shadow-xs lg:shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs lg:text-sm font-black text-red-600 dark:text-red-400 flex items-center gap-1.5 lg:gap-2">
                  <Trash2 size={14} className="lg:w-4 lg:h-4" />
                  <span>Delete Landlord Account</span>
                </h4>
                <p className="text-[10px] lg:text-xs text-gray-500 dark:text-gray-400 mt-0.5 lg:mt-1 max-w-xl font-medium">
                  Permanently erase your property owner account, profile settings, and login credentials from Dormn. Requires email OTP verification (valid for 10 mins).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="self-start sm:self-auto flex items-center gap-1.5 rounded-lg lg:rounded-xl bg-red-600 hover:bg-red-700 text-white h-8 lg:h-10 px-3 lg:px-4 text-[11px] lg:text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
              >
                <Trash2 size={12} className="lg:w-3.5 lg:h-3.5" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: MEMBERSHIP TIER ── */}
      {activeTab === "tier" && (
        <div className="space-y-2.5 sm:space-y-3 lg:space-y-4">
          <div className="rounded-xl lg:rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-blue-600/10 p-3 sm:p-3.5 lg:p-6 text-gray-900 dark:text-white shadow-xs lg:shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-2 lg:mb-3">
              <div className="flex items-center gap-1.5 lg:gap-2">
                <Zap size={15} className="text-emerald-500 dark:text-emerald-400 lg:w-5 lg:h-5" />
                <span className="text-xs sm:text-sm lg:text-base font-black">
                  {user?.subscription_tier ? `${user.subscription_tier.charAt(0).toUpperCase() + user.subscription_tier.slice(1)} Plan` : "Free Plan"}
                </span>
              </div>
              <span className={`rounded-md px-2 py-0.2 lg:px-2.5 lg:py-0.5 text-[9px] lg:text-xs font-bold uppercase tracking-wider shadow-xs ${
                user?.subscription_status === 'active' ? 'bg-emerald-500 text-white' : user?.subscription_status === 'trial' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
              }`}>
                {user?.subscription_status === 'trial' ? 'Free Trial' : (user?.subscription_status || 'Trial').toUpperCase()}
              </span>
            </div>
            <p className="text-[11px] lg:text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-2.5 lg:mb-4 max-w-2xl">
              Includes {user?.max_pg_listings >= 999 ? "unlimited" : user?.max_pg_listings || 1} verified PG listing(s), search prominence, tenant digital KYC, and automated settlements.
            </p>
            <div className="grid grid-cols-3 gap-2 lg:gap-4 text-xs font-medium pt-2 lg:pt-3 border-t border-emerald-500/15">
              <div>
                <span className="text-gray-400 text-[9px] lg:text-xs uppercase font-semibold block">Billing</span>
                <span className="text-[11px] sm:text-xs lg:text-sm font-bold">{user?.subscription_cycle ? user.subscription_cycle.charAt(0).toUpperCase() + user.subscription_cycle.slice(1) : "Monthly"}</span>
              </div>
              <div>
                <span className="text-gray-400 text-[9px] lg:text-xs uppercase font-semibold block">Expires / Renews</span>
                <span className="text-[11px] sm:text-xs lg:text-sm font-bold">
                  {user?.subscription_expires_at ? new Date(user.subscription_expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "30 Days Trial"}
                </span>
              </div>
              <div>
                <span className="text-gray-400 text-[9px] lg:text-xs uppercase font-semibold block">Max Listings</span>
                <span className="text-[11px] sm:text-xs lg:text-sm font-bold">
                  {user?.max_pg_listings >= 999 ? "Unlimited" : user?.max_pg_listings || 1}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 lg:gap-4 p-2.5 sm:p-3 lg:p-5 rounded-xl lg:rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#111]">
            <div>
              <h4 className="text-xs lg:text-sm font-black text-gray-900 dark:text-white">Need to change your subscription?</h4>
              <p className="text-[10px] lg:text-xs text-gray-500 dark:text-gray-400 mt-0.5">Explore annual discounts and enterprise packages</p>
            </div>
            <button
              onClick={() => navigate("/owner/pricing")}
              className="w-full sm:w-auto rounded-lg lg:rounded-xl bg-blue-600 hover:bg-blue-500 text-white h-8 lg:h-10 px-3.5 lg:px-5 text-[11px] lg:text-xs font-bold transition shadow-xs lg:shadow-sm cursor-pointer shrink-0 text-center"
            >
              Explore Plans
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Bank Account Modal */}
      {isBankModalOpen && (
        <BankAccountModal
          isOpen={isBankModalOpen}
          onClose={() => {
            setIsBankModalOpen(false);
            setAccountToEdit(null);
          }}
          accountToEdit={accountToEdit}
          onSuccess={handleBankSuccess}
        />
      )}

      {/* Permanent Account Deletion Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
};

export default OwnerProfile;
