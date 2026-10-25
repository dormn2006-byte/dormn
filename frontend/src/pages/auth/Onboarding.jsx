import { useState, useContext, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import {
  GraduationCap,
  Building2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles
} from "lucide-react";
import CollegeCombobox from "../../components/ui/CollegeCombobox";

const VIBE_OPTIONS = [
  "Night Owl 🦉",
  "Early Bird 🌅",
  "Quiet & Focused 🎧",
  "Fitness Freak 💪",
  "Extrovert 🗣️",
  "Foodie 🍕",
  "Party Animal 🎉",
  "Neat Freak ✨"
];

const YEAR_OPTIONS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "5th Year",
  "Post Graduate"
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, token, updateUser, login } = useContext(AuthContext);

  useEffect(() => {
    if (!token && !user) {
      navigate("/auth");
    }
  }, [token, user, navigate]);

  const [step, setStep] = useState(1);
  const roleParam = searchParams.get("role");
  const [selectedRole, setSelectedRole] = useState(roleParam === "owner" ? "owner" : "student"); // "student" (tenant) or "owner" (pg owner)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Tenant / Student Form State
  const [tenantData, setTenantData] = useState({
    userType: "student", // "student" or "professional"
    college: "",
    courseName: "",
    courseYear: "1st Year",
    admissionYear: new Date().getFullYear().toString(),
    company: "",
    designation: "",
    hometown: "",
    homeAddress: "",
    pincode: "",
    foodPreference: "Veg",
    vibe: "Quiet & Focused 🎧",
    interests: [],
    parent1Name: "",
    parent1Relation: "Parent",
    parent1Phone: "",
    bio: ""
  });

  // PG Owner Form State
  const [ownerData, setOwnerData] = useState({
    businessName: "",
    officeAddress: "",
    city: "",
    state: "",
    pincode: "",
    secondaryPhone: "",
    operatingSince: "",
    panNumber: ""
  });

  const handleTenantChange = (field, val) => {
    setTenantData((prev) => ({ ...prev, [field]: val }));
  };

  const handleOwnerChange = (field, val) => {
    setOwnerData((prev) => ({ ...prev, [field]: val }));
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Submit Tenant Details
  const handleTenantSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError("");

      const cleanDigits = (v) => String(v || "").replace(/\D/g, "");
      const phone = cleanDigits(user?.phone);
      const parentPhone = cleanDigits(tenantData.parent1Phone);

      if (parentPhone && parentPhone.length !== 10) {
        setError("Please enter a valid 10-digit mobile number for Guardian/Parent Phone.");
        setIsSubmitting(false);
        return;
      }

      const payload = {
        name: user?.full_name || user?.name || "",
        fullName: user?.full_name || user?.name || "",
        phone: phone || user?.phone || "",
        userType: tenantData.userType,
        occupation: tenantData.userType === "professional" ? "Working Professional" : "Student",
        college: tenantData.college,
        collegeName: tenantData.college,
        courseName: tenantData.courseName,
        courseYear: tenantData.courseYear,
        admissionYear: tenantData.admissionYear,
        company: tenantData.company,
        workplaceName: tenantData.company,
        designation: tenantData.designation,
        homeAddress: tenantData.homeAddress,
        hometown: tenantData.hometown,
        homeTown: tenantData.hometown,
        pincode: tenantData.pincode,
        foodPreference: tenantData.foodPreference,
        vibe: tenantData.vibe,
        interests: tenantData.interests,
        parent1Name: tenantData.parent1Name,
        parent1Relation: tenantData.parent1Relation,
        parent1Phone: parentPhone,
        parent1Contact: parentPhone,
        bio: tenantData.bio,
        isPublic: true
      };

      // 1. Save to Student Profile API
      const res = await api.post("/student/profile", payload);

      // 2. Ensure user role is student and onboarding completed
      try {
        const authRes = await api.put("/auth/profile", { role: "student", onboarding_completed: true });
        if (authRes.data?.user && authRes.data?.token) {
          login(authRes.data.user, authRes.data.token);
        }
      } catch {}

      // 3. Sync to localStorage for instant local availability
      const userKey = user?.id ? `u_${user.id}` : user?.email ? `e_${user.email.replace(/[^a-zA-Z0-9]/g, '_')}` : null;
      if (userKey) {
        try {
          localStorage.setItem(`dormn_student_profile_${userKey}`, JSON.stringify(payload));
          localStorage.setItem(`dormn_registration_form_${userKey}`, JSON.stringify(payload));
        } catch {}
      }

      if (updateUser) {
        updateUser({
          full_name: payload.fullName,
          phone: payload.phone
        });
      }

      window.dispatchEvent(new Event("dormn_profile_updated"));
      navigate("/student/dashboard");
    } catch (err) {
      console.error("Tenant onboarding error:", err);
      setError(err.response?.data?.message || err.message || "Failed to save details. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit PG Owner Details
  const handleOwnerSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError("");

      const cleanDigits = (v) => String(v || "").replace(/\D/g, "");
      const secondaryPhone = cleanDigits(ownerData.secondaryPhone);

      if (secondaryPhone && secondaryPhone.length !== 10) {
        setError("Please enter a valid 10-digit secondary contact number.");
        setIsSubmitting(false);
        return;
      }

      const payload = {
        role: "owner",
        onboarding_completed: true,
        business_name: ownerData.businessName || "My PG Property",
        office_address: ownerData.officeAddress,
        city: ownerData.city,
        state: ownerData.state,
        pincode: ownerData.pincode,
        secondary_phone: secondaryPhone,
        operating_since: ownerData.operatingSince,
        pan_number: ownerData.panNumber
      };

      // 1. Update Profile & Role to owner
      const res = await api.put("/auth/profile", payload);

      if (res.data?.success) {
        if (res.data.token && res.data.user) {
          login(res.data.user, res.data.token);
        } else if (updateUser) {
          updateUser({ role: "owner", onboarding_completed: true, ...payload });
        }
        navigate("/owner/dashboard");
      } else {
        throw new Error(res.data?.message || "Failed to update owner profile");
      }
    } catch (err) {
      console.error("Owner onboarding error:", err);
      setError(err.response?.data?.message || err.message || "Failed to save property owner details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    const targetRole = selectedRole === "owner" ? "owner" : "student";
    try {
      const res = await api.put("/auth/profile", { role: targetRole, onboarding_completed: true });
      if (res.data?.token && res.data?.user) login(res.data.user, res.data.token);
    } catch {}
    if (selectedRole === "owner") {
      navigate("/owner/dashboard");
    } else {
      navigate("/student/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#0c0f17] text-gray-900 dark:text-gray-100 flex flex-col font-sans transition-colors duration-200">
      {/* Header */}
      <header className="w-full border-b border-gray-200/80 dark:border-white/10 bg-white/80 dark:bg-[#121622]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-3.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <img src="/logo-sm.webp" alt="Dormn Logo" className="h-7 w-7 sm:h-8 sm:w-8 object-contain" />
            <span className="text-base sm:text-lg font-black tracking-tight text-[#0D3A1D] dark:text-white">Dormn</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 truncate max-w-[130px] sm:max-w-xs">
              <span className="hidden xs:inline">Welcome, </span>
              <strong className="text-gray-900 dark:text-white">{user?.full_name?.split(" ")[0] || "User"}</strong>
            </span>
            <button
              onClick={handleSkip}
              className="shrink-0 text-[11px] sm:text-xs font-bold text-gray-400 hover:text-gray-700 dark:hover:text-white underline cursor-pointer"
            >
              Skip for now
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3.5 sm:px-6 py-4 sm:py-10">
        {/* Progress Indicator */}
        <div className="mb-4 sm:mb-8">
          <div className="flex items-center justify-center gap-2 sm:gap-3 text-[10px] sm:text-xs font-black uppercase tracking-wider text-gray-400 mb-1.5 sm:mb-2">
            <span className={step === 1 ? "text-[#93B733]" : "text-gray-500"}>Step 1: Account Type</span>
            <span>•</span>
            <span className={step === 2 ? "text-[#93B733]" : "text-gray-400"}>Step 2: Profile Details</span>
          </div>
          <div className="w-full max-w-[200px] sm:max-w-xs mx-auto h-1 sm:h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#93B733] transition-all duration-300"
              style={{ width: step === 1 ? "50%" : "100%" }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs sm:text-sm font-semibold flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── STEP 1: CHOOSE TENANT VS PG OWNER ── */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="text-center max-w-xl mx-auto mb-4 sm:mb-8">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-[#93B733]/15 text-[#0D3A1D] dark:text-[#93B733] text-[10px] sm:text-xs font-black uppercase tracking-wider mb-1.5 sm:mb-3">
                <Sparkles size={12} /> Quick Onboarding
              </span>
              <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-[#0D3A1D] dark:text-white tracking-tight">
                Tell us who you are
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 sm:mt-2 font-medium">
                Choose how you'll be using Dormn so we can set up the right tools & profile for you.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-6 max-w-3xl mx-auto">
              {/* Card 1: Tenant / Student */}
              <div
                onClick={() => handleRoleSelect("student")}
                className="group relative rounded-2xl sm:rounded-3xl p-4 sm:p-7 border-2 border-gray-200/90 dark:border-white/10 hover:border-[#93B733] dark:hover:border-[#93B733] bg-white dark:bg-[#141824] shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between active:scale-[0.99]"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-2.5 sm:mb-4">
                    <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                      <GraduationCap size={22} className="sm:w-7 sm:h-7" />
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#4E700F] dark:text-[#93B733] bg-[#93B733]/10 px-2 py-0.5 rounded-full">
                      Resident & Seeker
                    </span>
                  </div>

                  <h2 className="text-base sm:text-xl font-black text-gray-900 dark:text-white tracking-tight">
                    I am a Tenant / Student
                  </h2>
                  <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    Looking for student PGs, verified hostels, daily or monthly stays, meal plans, and community living.
                  </p>

                  <div className="mt-2.5 sm:mt-4 space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <CheckCircle2 size={13} className="text-[#93B733] shrink-0" />
                      <span>Browse & book verified accommodations</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <CheckCircle2 size={13} className="text-[#93B733] shrink-0" />
                      <span>Digital KYC, rent receipts & payments</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <CheckCircle2 size={13} className="text-[#93B733] shrink-0" />
                      <span>PG Lounge, resident notices & events</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 sm:mt-6 pt-2.5 sm:pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs font-black text-[#0D3A1D] dark:text-[#93B733] group-hover:translate-x-1 transition-transform">
                  <span>Continue as Tenant</span>
                  <ArrowRight size={15} />
                </div>
              </div>

              {/* Card 2: PG Owner / Host */}
              <div
                onClick={() => handleRoleSelect("owner")}
                className="group relative rounded-2xl sm:rounded-3xl p-4 sm:p-7 border-2 border-gray-200/90 dark:border-white/10 hover:border-[#93B733] dark:hover:border-[#93B733] bg-white dark:bg-[#141824] shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between active:scale-[0.99]"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-2.5 sm:mb-4">
                    <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                      <Building2 size={22} className="sm:w-7 sm:h-7" />
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-full">
                      Property Host
                    </span>
                  </div>

                  <h2 className="text-base sm:text-xl font-black text-gray-900 dark:text-white tracking-tight">
                    I am a PG Owner
                  </h2>
                  <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    Listing and managing student properties, tracking tenant KYC, room occupancy, and automating rent collections.
                  </p>

                  <div className="mt-2.5 sm:mt-4 space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <CheckCircle2 size={13} className="text-[#93B733] shrink-0" />
                      <span>List rooms, pricing, amenities & photos</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <CheckCircle2 size={13} className="text-[#93B733] shrink-0" />
                      <span>Tenant directory & automated KYC tracking</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <CheckCircle2 size={13} className="text-[#93B733] shrink-0" />
                      <span>Direct bank payouts & occupancy analytics</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 sm:mt-6 pt-2.5 sm:pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs font-black text-[#0D3A1D] dark:text-[#93B733] group-hover:translate-x-1 transition-transform">
                  <span>Continue as PG Owner</span>
                  <ArrowRight size={15} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: QUESTIONNAIRE & PROFILE SETUP ── */}
        {step === 2 && selectedRole === "student" && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300 max-w-2xl mx-auto">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-3 sm:mb-4 cursor-pointer"
            >
              <ArrowLeft size={14} /> Back to account type
            </button>

            <div className="rounded-2xl sm:rounded-3xl border border-gray-200/90 dark:border-white/10 bg-white dark:bg-[#141824] p-4 sm:p-8 shadow-lg sm:shadow-xl">
              <div className="pb-3.5 sm:pb-5 border-b border-gray-100 dark:border-white/10 mb-4 sm:mb-6">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#4E700F] dark:text-[#93B733] bg-[#93B733]/10 px-2 py-0.5 rounded-full">
                  Tenant Profile
                </span>
                <h2 className="text-lg sm:text-2xl font-black text-[#0D3A1D] dark:text-white mt-1.5">
                  Tell us about your studies & stay preferences
                </h2>
                <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                  These answers automatically configure your resident profile and registration details.
                </p>
              </div>

              <form onSubmit={handleTenantSubmit} className="space-y-4 sm:space-y-6">
                {/* 1. What describes you */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                    What describes you best?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleTenantChange("userType", "student")}
                      className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold border-2 transition text-center cursor-pointer ${
                        tenantData.userType === "student"
                          ? "border-[#93B733] bg-[#93B733]/10 text-[#0D3A1D] dark:text-[#93B733]"
                          : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                      }`}
                    >
                      🎓 Student
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTenantChange("userType", "professional")}
                      className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold border-2 transition text-center cursor-pointer ${
                        tenantData.userType === "professional"
                          ? "border-[#93B733] bg-[#93B733]/10 text-[#0D3A1D] dark:text-[#93B733]"
                          : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                      }`}
                    >
                      💼 Working Professional
                    </button>
                  </div>
                </div>

                {/* College or Workplace */}
                {tenantData.userType === "student" ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                        College or University Name
                      </label>
                      <CollegeCombobox
                        value={tenantData.college}
                        onChange={(val) => handleTenantChange("college", val)}
                        placeholder="Search your college (e.g. Amity, DU, IIT...)"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                          Course / Degree
                        </label>
                        <input
                          type="text"
                          value={tenantData.courseName}
                          onChange={(e) => handleTenantChange("courseName", e.target.value)}
                          placeholder="e.g. B.Tech CS, BBA, MBBS"
                          className="w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs sm:text-sm outline-none focus:border-[#93B733]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                          Academic Year
                        </label>
                        <select
                          value={tenantData.courseYear}
                          onChange={(e) => handleTenantChange("courseYear", e.target.value)}
                          className="w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs sm:text-sm outline-none focus:border-[#93B733]"
                        >
                          {YEAR_OPTIONS.map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                        Company / Workplace
                      </label>
                      <input
                        type="text"
                        value={tenantData.company}
                        onChange={(e) => handleTenantChange("company", e.target.value)}
                        placeholder="e.g. Google, TCS, Deloitte"
                        className="w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs sm:text-sm outline-none focus:border-[#93B733]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                        Designation / Role
                      </label>
                      <input
                        type="text"
                        value={tenantData.designation}
                        onChange={(e) => handleTenantChange("designation", e.target.value)}
                        placeholder="e.g. Associate Analyst, Developer"
                        className="w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs sm:text-sm outline-none focus:border-[#93B733]"
                      />
                    </div>
                  </div>
                )}

                {/* Hometown & Pincode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      Hometown / City
                    </label>
                    <input
                      type="text"
                      value={tenantData.hometown}
                      onChange={(e) => handleTenantChange("hometown", e.target.value)}
                      placeholder="e.g. Lucknow, Jaipur, Patna"
                      className="w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs sm:text-sm outline-none focus:border-[#93B733]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      Pincode
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={tenantData.pincode}
                      onChange={(e) => handleTenantChange("pincode", e.target.value.replace(/\D/g, ""))}
                      placeholder="e.g. 201301"
                      className="w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs sm:text-sm outline-none focus:border-[#93B733]"
                    />
                  </div>
                </div>

                {/* Food Preference */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Food & Meal Plan Preference
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: "Veg", label: "Pure Veg 🌱" },
                      { id: "Non-Veg", label: "Non-Veg 🍗" },
                      { id: "Both", label: "Both / Any 🍽️" }
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => handleTenantChange("foodPreference", f.id)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                          tenantData.foodPreference === f.id
                            ? "bg-[#93B733] text-white border-[#7d9e26] shadow-xs"
                            : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-gray-300"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Living Vibe */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Your Living Vibe
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {VIBE_OPTIONS.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => handleTenantChange("vibe", v)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                          tenantData.vibe === v
                            ? "bg-[#0D3A1D] text-white dark:bg-[#93B733] dark:text-black shadow-xs"
                            : "bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="pt-2 border-t border-gray-100 dark:border-white/5">
                  <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3">
                    Emergency / Parent Contact (Optional)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                        Parent / Guardian Name
                      </label>
                      <input
                        type="text"
                        value={tenantData.parent1Name}
                        onChange={(e) => handleTenantChange("parent1Name", e.target.value)}
                        placeholder="Parent name"
                        className="w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs sm:text-sm outline-none focus:border-[#93B733]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                        Emergency Mobile Phone
                      </label>
                      <input
                        type="tel"
                        maxLength={10}
                        value={tenantData.parent1Phone}
                        onChange={(e) => handleTenantChange("parent1Phone", e.target.value.replace(/\D/g, ""))}
                        placeholder="10-digit mobile number"
                        className="w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs sm:text-sm outline-none focus:border-[#93B733]"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 sm:pt-4 flex items-center justify-between gap-2.5">
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-white cursor-pointer"
                  >
                    Skip to Profile
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-[#93B733] hover:bg-[#83a42d] text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <span>Continue to Profile</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── STEP 2: PG OWNER QUESTIONNAIRE ── */}
        {step === 2 && selectedRole === "owner" && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300 max-w-2xl mx-auto">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-3 sm:mb-4 cursor-pointer"
            >
              <ArrowLeft size={14} /> Back to account type
            </button>

            <div className="rounded-2xl sm:rounded-3xl border border-gray-200/90 dark:border-white/10 bg-white dark:bg-[#141824] p-4 sm:p-8 shadow-lg sm:shadow-xl">
              <div className="pb-3.5 sm:pb-5 border-b border-gray-100 dark:border-white/10 mb-4 sm:mb-6">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-full">
                  Property Host Setup
                </span>
                <h2 className="text-lg sm:text-2xl font-black text-[#0D3A1D] dark:text-white mt-1.5">
                  Set up your PG business & property brand
                </h2>
                <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Fill in your property details to start receiving room bookings and managing tenants.
                </p>
              </div>

              <form onSubmit={handleOwnerSubmit} className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    PG Property / Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerData.businessName}
                    onChange={(e) => handleOwnerChange("businessName", e.target.value)}
                    placeholder="e.g. Royal Living Student PG, GreenHouse Hostels"
                    className="w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs sm:text-sm outline-none focus:border-[#93B733]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={ownerData.city}
                      onChange={(e) => handleOwnerChange("city", e.target.value)}
                      placeholder="e.g. Noida, Delhi NCR, Kota"
                      className="w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs sm:text-sm outline-none focus:border-[#93B733]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={ownerData.state}
                      onChange={(e) => handleOwnerChange("state", e.target.value)}
                      placeholder="e.g. Uttar Pradesh, Rajasthan"
                      className="w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs sm:text-sm outline-none focus:border-[#93B733]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Property / Office Address
                  </label>
                  <input
                    type="text"
                    value={ownerData.officeAddress}
                    onChange={(e) => handleOwnerChange("officeAddress", e.target.value)}
                    placeholder="e.g. Sector 62, Near Gate 2, Noida"
                    className="w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs sm:text-sm outline-none focus:border-[#93B733]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      Pincode
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={ownerData.pincode}
                      onChange={(e) => handleOwnerChange("pincode", e.target.value.replace(/\D/g, ""))}
                      placeholder="e.g. 201309"
                      className="w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs sm:text-sm outline-none focus:border-[#93B733]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      Secondary / WhatsApp Phone
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      value={ownerData.secondaryPhone}
                      onChange={(e) => handleOwnerChange("secondaryPhone", e.target.value.replace(/\D/g, ""))}
                      placeholder="WhatsApp contact for tenants"
                      className="w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs sm:text-sm outline-none focus:border-[#93B733]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      Hospitality Experience (Operating Since)
                    </label>
                    <input
                      type="text"
                      value={ownerData.operatingSince}
                      onChange={(e) => handleOwnerChange("operatingSince", e.target.value)}
                      placeholder="e.g. 2021 or 4 Years"
                      className="w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs sm:text-sm outline-none focus:border-[#93B733]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      Business PAN (Optional)
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={ownerData.panNumber}
                      onChange={(e) => handleOwnerChange("panNumber", e.target.value.toUpperCase())}
                      placeholder="e.g. ABCDE1234F"
                      className="w-full h-11 px-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs sm:text-sm uppercase outline-none focus:border-[#93B733]"
                    />
                  </div>
                </div>

                <div className="pt-3 sm:pt-4 flex items-center justify-between gap-2.5">
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-white cursor-pointer"
                  >
                    Skip to Dashboard
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-[#93B733] hover:bg-[#83a42d] text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <span>Continue to Dashboard</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
