import { useState, useContext } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Eye, EyeOff, KeyRound, Mail, ArrowLeft, CheckCircle2, User, Phone, Lock, ShieldCheck } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import { GoogleLogin } from "@react-oauth/google";

const checkPasswordRules = (pwd) => {
  const p = pwd || "";
  const hasMinLength = p.length > 8; // more than 8 characters (at least 9 chars)
  const hasUpper = /[A-Z]/.test(p);
  const hasLower = /[a-z]/.test(p);
  const hasNumber = /[0-9]/.test(p);
  const validCount = [hasMinLength, hasUpper, hasLower, hasNumber].filter(Boolean).length;
  const isFullyValid = hasMinLength && hasUpper && hasLower && hasNumber;
  return { hasMinLength, hasUpper, hasLower, hasNumber, validCount, isFullyValid };
};

const PasswordAuditBox = ({ rules }) => {
  const { validCount, hasMinLength, hasUpper, hasLower, hasNumber } = rules;
  const isStrong = validCount === 4;
  const colorCls = isStrong ? "text-emerald-600" : validCount >= 2 ? "text-amber-600" : "text-rose-500";
  const label = isStrong ? "Strong (Audit Passed)" : validCount === 3 ? "Good" : validCount === 2 ? "Fair" : "Weak";

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-3.5 space-y-2 text-xs animate-fadeIn">
      <div className="flex items-center justify-between font-bold">
        <span className="text-gray-500 text-[11px] uppercase tracking-wider flex items-center gap-1">
          <ShieldCheck size={13} className="text-[#0D3A1D]" /> Security Audit
        </span>
        <span className={`text-[11px] font-black ${colorCls}`}>{label}</span>
      </div>

      <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden flex gap-1">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-full flex-1 rounded-full transition-all duration-300 ${
              validCount >= step ? (isStrong ? "bg-emerald-500" : validCount >= 2 ? "bg-amber-500" : "bg-rose-500") : "bg-transparent"
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
        {[
          { label: "More than 8 chars", ok: hasMinLength },
          { label: "1 Uppercase (A-Z)", ok: hasUpper },
          { label: "1 Lowercase (a-z)", ok: hasLower },
          { label: "Any number (0-9)", ok: hasNumber },
        ].map((c) => (
          <div key={c.label} className={`flex items-center gap-1.5 font-semibold ${c.ok ? "text-emerald-600" : "text-gray-400"}`}>
            <CheckCircle2 size={13} className={c.ok ? "text-emerald-500 shrink-0" : "text-gray-300 shrink-0"} />
            <span>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const bgImages = [
  "/auth-bg/bg-1.webp", "/auth-bg/bg-2.webp", "/auth-bg/bg-3.webp", "/auth-bg/bg-4.webp",
  "/auth-bg/bg-5.webp", "/auth-bg/bg-6.webp", "/auth-bg/bg-7.webp", "/auth-bg/bg-8.webp",
  "/auth-bg/bg-9.webp", "/auth-bg/bg-10.webp", "/auth-bg/bg-11.webp", "/auth-bg/bg-12.webp",
  "/auth-bg/bg-13.webp", "/auth-bg/bg-14.webp", "/auth-bg/bg-15.webp", "/auth-bg/bg-16.webp",
  "/auth-bg/bg-17.webp", "/auth-bg/bg-18.webp", "/auth-bg/bg-19.webp"
];

const MarqueeRow = ({ images, direction = "left", speed = "60s" }) => (
  <div className="flex-1 w-full overflow-hidden flex pointer-events-none">
    <div className={`flex gap-3 shrink-0 h-full ${direction === "left" ? "animate-slide-left" : "animate-slide-right"}`} style={{ "--speed": speed }}>
      {[...images, ...images].map((src, idx) => (
        <div key={idx} className="h-full aspect-[4/5] rounded-[1.5rem] overflow-hidden shadow-2xl shrink-0 pointer-events-auto">
          <img src={src} alt="bg-grid" className="w-full h-full object-cover transition-transform duration-[10s] hover:scale-110" />
        </div>
      ))}
    </div>
  </div>
);

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useContext(AuthContext);

  const roleParam = searchParams.get("role");
  const modeParam = searchParams.get("mode");
  const redirectParam = searchParams.get("redirect");

  const [authMode, setAuthMode] = useState(modeParam === "signup" ? "signup" : "login");
  const [userRole, setUserRole] = useState(roleParam === "owner" ? "owner" : "student");
  const [loginMethod, setLoginMethod] = useState("password");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({ full_name: "", email: "", phone: "", password: "", gender: "" });

  const passwordRules = checkPasswordRules(formData.password);
  const resetPasswordRules = checkPasswordRules(newPassword);

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      if (!credentialResponse?.credential) {
        throw new Error("No credential received from Google");
      }

      const res = await api.post("/auth/google", {
        token: credentialResponse.credential,
        role: userRole,
        gender: formData.gender || null
      });

      if (res.data?.success) {
        const user = res.data.user;
        const isEventAdmin = user.role === "event_admin" || user.role === "event_manager";

        if (userRole === "owner" && user.role !== "owner" && user.role !== "superadmin" && !isEventAdmin) {
          setError("Access denied. You do not have owner privileges.");
          setLoading(false);
          return;
        }

        login(user, res.data.token);
        if (redirectParam && redirectParam !== "/auth") navigate(redirectParam);
        else if (isEventAdmin) navigate("/event-admin/dashboard");
        else if (user.role === "superadmin") navigate("/superadmin/dashboard");
        else if (user.role === "owner") navigate("/owner/dashboard");
        else navigate("/student/dashboard");
      }
    } catch (err) {
      console.error("Google sign-in error:", err);
      setError(err.response?.data?.message || "Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google sign-in was cancelled or failed to authenticate.");
  };

  const handleRequestOtp = async () => {
    if (!formData.email) return setError("Please enter your email address first.");
    try {
      setLoading(true);
      setError("");
      const res = await api.post("/auth/request-otp", { email: formData.email });
      if (res.data?.success) {
        setOtpSent(true);
        setSuccessMessage("6-digit login OTP sent to your email!");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResetOtp = async () => {
    if (!formData.email) return setError("Please enter your registered email address.");
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");
      const res = await api.post("/auth/forgot-password", { email: formData.email });
      if (res.data?.success) {
        setResetOtpSent(true);
        setSuccessMessage("Password reset code sent to your email!");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetOtp.trim() || !newPassword) return setError("Please enter the 6-digit code and a new password.");
    if (!resetPasswordRules.isFullyValid) {
      return setError("Password must have more than 8 characters, at least 1 uppercase letter, 1 lowercase letter, and 1 number.");
    }
    if (newPassword !== confirmPassword) return setError("Passwords do not match.");

    try {
      setLoading(true);
      setError("");
      const res = await api.post("/auth/reset-password", { email: formData.email, otp: resetOtp.trim(), newPassword });
      if (res.data?.success) {
        setSuccessMessage("Password reset successfully! You can now log in.");
        setAuthMode("login");
        setLoginMethod("password");
        setResetOtpSent(false);
        setResetOtp("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (authMode === "forgot") {
      return resetOtpSent ? handleResetPassword() : handleRequestResetOtp();
    }

    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      if (authMode === "login") {
        if (loginMethod === "otp" && !otpSent) return handleRequestOtp();

        const payload = { email: formData.email, ...(loginMethod === "password" ? { password: formData.password } : { otp }) };
        const res = await api.post("/auth/login", payload);

        if (res.data?.success) {
          const user = res.data.user;
          const isEventAdmin = user.role === "event_admin" || user.role === "event_manager";

          if (userRole === "owner" && user.role !== "owner" && user.role !== "superadmin" && !isEventAdmin) {
            setError("Access denied. You do not have owner privileges.");
            setLoading(false);
            return;
          }

          login(user, res.data.token);
          if (redirectParam && redirectParam !== "/auth") navigate(redirectParam);
          else if (isEventAdmin) navigate("/event-admin/dashboard");
          else if (user.role === "superadmin") navigate("/superadmin/dashboard");
          else if (user.role === "owner") navigate("/owner/dashboard");
          else navigate("/student/dashboard");
        }
      } else {
        if (!agreeTerms || !agreePrivacy) {
          setError("You must agree to both the Terms & Conditions and Privacy Policy.");
          setLoading(false);
          return;
        }
        if (!formData.gender) {
          setError("Please select your gender.");
          setLoading(false);
          return;
        }
        if (!passwordRules.isFullyValid) {
          setError("Password must have more than 8 characters, at least 1 uppercase letter, 1 lowercase letter, and 1 number.");
          setLoading(false);
          return;
        }

        const payload = {
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password,
          role: userRole,
          gender: formData.gender,
          ...(userRole === "owner" ? { phone: formData.phone } : {})
        };

        const res = await api.post("/auth/register", payload);
        if (res.data?.success) {
          login(res.data.user, res.data.token);
          if (redirectParam) navigate(redirectParam);
          else if (userRole === "owner") navigate("/owner/dashboard");
          else navigate("/student/dashboard");
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || `${authMode === "login" ? "Login" : "Signup"} failed.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col font-sans selection:bg-[#93B733] selection:text-white bg-[#FAF9F5] overflow-hidden">
      {/* Background Gradients & Marquee */}
      <div className="absolute inset-0 z-0 block md:hidden overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-[10%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-[#93B733] blur-[80px]" />
        <div className="absolute top-[40%] -right-[20%] w-[80vw] h-[80vw] rounded-full bg-[#0D3A1D] blur-[100px]" />
        <div className="absolute -bottom-[10%] -left-[20%] w-[90vw] h-[90vw] rounded-full bg-[#93B733] blur-[90px]" />
      </div>

      <div className="absolute inset-0 z-0 hidden md:block overflow-hidden pointer-events-none bg-[#2A1B25]">
        <div className="flex flex-col gap-3 py-3 opacity-[0.35] h-full justify-center">
          <MarqueeRow images={bgImages} direction="right" speed="55s" />
          <MarqueeRow images={[...bgImages.slice(7), ...bgImages.slice(0, 7)]} direction="left" speed="65s" />
          <MarqueeRow images={[...bgImages.slice(13), ...bgImages.slice(0, 13)]} direction="right" speed="60s" />
        </div>
      </div>

      <div className="absolute inset-0 z-0 flex flex-col items-center justify-center pointer-events-none overflow-hidden opacity-30 md:opacity-20 mix-blend-overlay md:mix-blend-color-dodge">
        <span className="text-[22vw] md:text-[14vw] font-black text-[#93B733] -rotate-6 -ml-[20vw] tracking-tighter leading-[0.75] select-none">DORMN</span>
        <span className="text-[25vw] md:text-[16vw] font-black text-[#0D3A1D] md:text-[#FAF9F5] rotate-3 ml-[15vw] tracking-tighter leading-[0.75] select-none">DORMN</span>
        <span className="text-[22vw] md:text-[14vw] font-black text-[#93B733] -rotate-2 -ml-[10vw] tracking-tighter leading-[0.75] select-none">DORMN</span>
      </div>

      {/* Top Navbar */}
      <nav className="relative z-20 px-5 py-4 md:px-8 flex justify-between items-center bg-white/70 backdrop-blur-xl border-b border-white/20 md:border-none md:bg-transparent">
        <div onClick={() => navigate("/")} className="flex cursor-pointer items-center gap-3 group">
          <img src="/logo-sm.webp" alt="Dormn Logo" className="h-10 w-10 rounded-xl object-contain shadow-lg shadow-black/10 transition-transform group-hover:scale-105" />
          <h1 className="text-xl font-black tracking-tight text-[#0D3A1D] md:text-white">Dormn</h1>
        </div>
        <button onClick={() => navigate("/")} className="text-sm font-bold text-[#0D3A1D] md:text-white/80 hover:text-[#93B733] md:hover:text-white transition cursor-pointer">
          Back Home
        </button>
      </nav>

      {/* Card Container */}
      <div className="relative z-10 flex flex-1 items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-[480px] bg-white/95 backdrop-blur-2xl rounded-[2rem] md:rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-white/50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="text-center px-6 pt-8 pb-5 border-b border-gray-100/80">
            <h2 className="text-xl font-black text-[#0D3A1D]">
              {authMode === "forgot" ? "Reset Your Password" : authMode === "login" ? "Welcome Back" : "Create an Account"}
            </h2>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              {authMode === "forgot"
                ? (resetOtpSent ? "Enter verification code and your new password" : "We'll send a 6-digit recovery code to your email")
                : authMode === "login"
                  ? "Access your dashboard and PG community lounge"
                  : "Find & book verified student PGs with ease"}
            </p>
          </div>

          <div className="p-6 md:p-8 flex-1 flex flex-col">
            {/* Role Switcher */}
            {authMode !== "forgot" && (
              <div className="flex rounded-xl bg-gray-100/80 p-1.5 mb-6 border border-gray-200/50">
                <button type="button" onClick={() => setUserRole("student")} className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition flex justify-center items-center cursor-pointer ${userRole === "student" ? "bg-white text-[#0D3A1D] shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700"}`}>
                  Student
                </button>
                <button type="button" onClick={() => setUserRole("owner")} className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition flex justify-center items-center cursor-pointer ${userRole === "owner" ? "bg-white text-[#0D3A1D] shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700"}`}>
                  Property Owner
                </button>
              </div>
            )}

            {/* Notifications */}
            {successMessage && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-bold text-red-600 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Google Authentication (Login & Signup) */}
            {authMode !== "forgot" && (
              <div className="mb-5">
                <div className="w-full flex justify-center [&>div]:!w-full [&_iframe]:!w-full shadow-sm hover:shadow transition-shadow rounded-full">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="outline"
                    size="large"
                    shape="pill"
                    text={authMode === "login" ? "signin_with" : "signup_with"}
                    width="100%"
                    logo_alignment="center"
                  />
                </div>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200/80" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 font-bold uppercase tracking-wider text-gray-400 text-[10px]">
                      or continue with email
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════ FORGOT PASSWORD ══════════ */}
            {authMode === "forgot" ? (
              <form className="space-y-4 flex-1" onSubmit={handleSubmit}>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Registered Email address"
                    disabled={resetOtpSent}
                    className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50/50 pl-11 pr-5 py-4 text-sm font-semibold text-[#0D3A1D] outline-none placeholder:text-gray-400 focus:border-[#93B733] focus:bg-white disabled:opacity-60"
                    required
                  />
                </div>

                {resetOtpSent && (
                  <>
                    <div className="relative">
                      <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={resetOtp}
                        onChange={(e) => setResetOtp(e.target.value)}
                        placeholder="6-digit reset code"
                        maxLength={6}
                        className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50/50 pl-11 pr-5 py-4 text-sm font-semibold text-[#0D3A1D] outline-none placeholder:text-gray-400 focus:border-[#93B733] focus:bg-white tracking-widest"
                        required
                        autoFocus
                      />
                    </div>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New Password (> 8 characters)"
                        className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50/50 pl-4 pr-12 py-4 text-sm font-semibold text-[#0D3A1D] outline-none placeholder:text-gray-400 focus:border-[#93B733] focus:bg-white"
                        required
                      />
                      <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    {newPassword && <PasswordAuditBox rules={resetPasswordRules} />}

                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm New Password"
                        className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50/50 pl-4 pr-12 py-4 text-sm font-semibold text-[#0D3A1D] outline-none placeholder:text-gray-400 focus:border-[#93B733] focus:bg-white"
                        required
                      />
                    </div>
                  </>
                )}

                <button type="submit" disabled={loading || (resetOtpSent && !resetPasswordRules.isFullyValid)} className="mt-4 w-full rounded-2xl bg-[#93B733] px-6 py-4 text-sm font-black text-white shadow-[0_8px_20px_rgba(147,183,51,0.3)] transition hover:scale-[1.02] hover:bg-[#82a32d] active:scale-[0.98] disabled:opacity-50 cursor-pointer">
                  {loading ? "Processing..." : resetOtpSent ? "Reset Password & Save" : "Send Recovery Code"}
                </button>

                {resetOtpSent && (
                  <button type="button" onClick={handleRequestResetOtp} disabled={loading} className="w-full text-center text-xs font-bold text-gray-500 hover:text-[#0D3A1D] transition cursor-pointer pt-1">
                    Didn&apos;t receive code? Resend
                  </button>
                )}

                <div className="pt-3 text-center">
                  <button type="button" onClick={() => { setAuthMode("login"); setError(""); setSuccessMessage(""); setResetOtpSent(false); }} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D3A1D] hover:text-[#93B733] transition cursor-pointer">
                    <ArrowLeft size={14} /> Back to Login
                  </button>
                </div>
              </form>
            ) : (
              /* ══════════ LOGIN / SIGNUP ══════════ */
              <form className="space-y-4 flex-1" onSubmit={handleSubmit}>
                {authMode === "signup" && (
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="Full Name"
                      className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50/50 pl-11 pr-5 py-4 text-sm font-semibold text-[#0D3A1D] outline-none placeholder:text-gray-400 focus:border-[#93B733] focus:bg-white"
                      required
                    />
                  </div>
                )}

                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email address"
                    className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50/50 pl-11 pr-5 py-4 text-sm font-semibold text-[#0D3A1D] outline-none placeholder:text-gray-400 focus:border-[#93B733] focus:bg-white"
                    required
                  />
                </div>

                {authMode === "signup" && (
                  <div className="space-y-1.5 pt-1">
                    <label className="block text-xs font-bold text-gray-700 px-1">Gender</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Male", value: "male" },
                        { label: "Female", value: "female" },
                        { label: "Prefer not to say", value: "prefer_not_to_say" }
                      ].map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => { setFormData((p) => ({ ...p, gender: item.value })); setError(""); }}
                          className={`flex items-center justify-center rounded-2xl border-2 px-2 py-3.5 text-xs font-bold transition cursor-pointer text-center ${
                            formData.gender === item.value ? "border-[#93B733] bg-[#93B733]/15 text-[#0D3A1D] shadow-sm ring-2 ring-[#93B733]/30 scale-[1.02]" : "border-gray-100 bg-gray-50/50 text-gray-600 hover:bg-gray-100/70"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {authMode === "login" && (
                  <div className="flex rounded-xl bg-gray-100/80 p-1 mb-2 border border-gray-200/50">
                    <button type="button" onClick={() => { setLoginMethod("password"); setOtpSent(false); setError(""); setSuccessMessage(""); }} className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition cursor-pointer ${loginMethod === "password" ? "bg-white text-[#0D3A1D] shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700"}`}>
                      Password
                    </button>
                    <button type="button" onClick={() => { setLoginMethod("otp"); setError(""); setSuccessMessage(""); }} className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition cursor-pointer ${loginMethod === "otp" ? "bg-white text-[#0D3A1D] shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700"}`}>
                      Email OTP
                    </button>
                  </div>
                )}

                {authMode === "signup" && userRole === "owner" && (
                  <div className="relative">
                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Phone number"
                      className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50/50 pl-11 pr-5 py-4 text-sm font-semibold text-[#0D3A1D] outline-none placeholder:text-gray-400 focus:border-[#93B733] focus:bg-white"
                      required
                    />
                  </div>
                )}

                {(authMode === "signup" || (authMode === "login" && loginMethod === "password")) && (
                  <div className="space-y-2">
                    <div className="relative">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder={authMode === "signup" ? "Password (> 8 characters)" : "Password"}
                        className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50/50 pl-11 pr-12 py-4 text-sm font-semibold text-[#0D3A1D] outline-none placeholder:text-gray-400 focus:border-[#93B733] focus:bg-white"
                        required={authMode === "signup" || loginMethod === "password"}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    {/* Live Password Security Audit Checklist (Signup Mode) */}
                    {authMode === "signup" && formData.password && <PasswordAuditBox rules={passwordRules} />}
                  </div>
                )}

                {authMode === "login" && loginMethod === "otp" && otpSent && (
                  <div className="relative">
                    <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      name="otp"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50/50 pl-11 pr-5 py-4 text-sm font-semibold text-[#0D3A1D] outline-none placeholder:text-gray-400 focus:border-[#93B733] focus:bg-white tracking-widest"
                      required
                      autoFocus
                    />
                  </div>
                )}

                {authMode === "signup" && (
                  <div className="space-y-3 pt-3 border-t border-gray-100">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="mt-0.5 h-4.5 w-4.5 rounded border-gray-300 accent-[#0D3A1D] cursor-pointer shrink-0" />
                      <span className="text-xs text-gray-600 font-medium leading-snug">
                        I agree to the <Link to="/terms-and-conditions" target="_blank" className="font-bold text-[#0D3A1D] underline hover:text-[#93B733]">Terms & Conditions</Link>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} className="mt-0.5 h-4.5 w-4.5 rounded border-gray-300 accent-[#0D3A1D] cursor-pointer shrink-0" />
                      <span className="text-xs text-gray-600 font-medium leading-snug">
                        I accept the <Link to="/privacy-policy" target="_blank" className="font-bold text-[#0D3A1D] underline hover:text-[#93B733]">Privacy Policy</Link>
                      </span>
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || (authMode === "signup" && (!agreeTerms || !agreePrivacy || !formData.gender || !passwordRules.isFullyValid))}
                  className="mt-6 w-full rounded-2xl bg-[#93B733] px-6 py-4 text-sm font-black text-white shadow-[0_8px_20px_rgba(147,183,51,0.3)] transition hover:scale-[1.02] hover:bg-[#82a32d] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Processing..." : authMode === "login" ? (loginMethod === "otp" && !otpSent ? "Send OTP via Email" : "Log in securely") : "Create Account"}
                </button>

                {authMode === "login" && loginMethod === "password" && (
                  <div className="mt-5 text-center">
                    <button type="button" onClick={() => { setAuthMode("forgot"); setError(""); setSuccessMessage(""); setResetOtpSent(false); }} className="text-xs font-bold text-[#0D3A1D] hover:text-[#93B733] transition hover:underline cursor-pointer">
                      Forgot your password?
                    </button>
                  </div>
                )}
              </form>
            )}

            {/* Mode Toggle */}
            {authMode !== "forgot" && (
              <>
                <div className="relative my-7">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                  <div className="relative flex justify-center text-sm"><span className="bg-white px-4 text-[10px] font-black uppercase tracking-widest text-gray-400">or</span></div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500 mb-3">{authMode === "login" ? "Don't have an account?" : "Already have an account?"}</p>
                  <button type="button" onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setError(""); setSuccessMessage(""); setOtpSent(false); setOtp(""); }} className="w-full rounded-2xl border-2 border-[#0D3A1D] bg-transparent px-6 py-4 text-sm font-black text-[#0D3A1D] transition hover:bg-gray-50 active:scale-[0.98] cursor-pointer">
                    {authMode === "login" ? "Sign up for Dormn" : "Log in instead"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
