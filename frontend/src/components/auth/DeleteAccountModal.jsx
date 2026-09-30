import { useState, useEffect, useRef, useContext, memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, X, ArrowRight, RefreshCw, Mail, AlertTriangle } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";

function DeleteAccountModal({ isOpen, onClose }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setAgreeTerms(false);
      setAgreePrivacy(false);
      setOtpDigits(["", "", "", "", "", ""]);
      setError("");
      setCooldown(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  if (!isOpen) return null;

  const handleRequestOtp = async (isResend = false) => {
    if (!isResend && (!agreeTerms || !agreePrivacy)) {
      return setError("Please accept both Terms & Conditions and Privacy Policy.");
    }
    try {
      setLoading(true);
      setError("");
      const res = await api.post("/auth/request-delete-account-otp");
      if (res.data?.success) {
        setStep(2);
        setCooldown(60);
        setOtpDigits(["", "", "", "", "", ""]);
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send deletion code.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (idx, val) => {
    const clean = val.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[idx] = clean;
    setOtpDigits(next);
    setError("");
    if (clean && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!paste) return;
    const next = Array.from({ length: 6 }, (_, i) => paste[i] || "");
    setOtpDigits(next);
    inputRefs.current[Math.min(paste.length, 5)]?.focus();
  };

  const fullOtp = otpDigits.join("");

  const handleConfirmDelete = async (e) => {
    e?.preventDefault();
    if (fullOtp.length !== 6) return setError("Please enter the complete 6-digit verification code.");

    try {
      setLoading(true);
      setError("");
      const res = await api.post("/auth/delete-account", { otp: fullOtp, agreeTerms, agreePrivacy });
      if (res.data?.success) {
        onClose();
        logout();
        navigate("/", { state: { accountDeleted: true }, replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Deletion failed. Please verify your OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div onClick={loading ? undefined : onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />
      <div className="relative w-full max-w-md rounded-3xl border border-gray-100 dark:border-white/10 bg-white dark:bg-[#121212] p-6 sm:p-7 shadow-2xl z-10 text-gray-900 dark:text-white animate-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition cursor-pointer disabled:opacity-50"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3.5 mb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 shrink-0">
            <Trash2 size={22} />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Delete Account</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Permanent and irreversible action</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-3 text-xs font-semibold text-red-600 dark:text-red-400 flex items-start gap-2">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {step === 1 ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-red-500/15 bg-red-500/5 p-4 text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              You are about to permanently delete your account (<strong>{user?.email}</strong>). All profile details, saved properties, and histories will be permanently removed.
            </div>

            <div className="space-y-2.5 pt-1">
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 hover:bg-gray-100/60 dark:hover:bg-white/10 transition">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-red-600 cursor-pointer shrink-0"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-snug">
                  I agree to the <Link to="/terms-and-conditions" target="_blank" className="font-bold text-red-600 dark:text-red-400 underline">Terms &amp; Conditions</Link>.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 hover:bg-gray-100/60 dark:hover:bg-white/10 transition">
                <input
                  type="checkbox"
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-red-600 cursor-pointer shrink-0"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-snug">
                  I accept the <Link to="/privacy-policy" target="_blank" className="font-bold text-red-600 dark:text-red-400 underline">Privacy Policy</Link> on data deletion.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-white/10">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRequestOtp(false)}
                disabled={loading || !agreeTerms || !agreePrivacy}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Sending OTP..." : "Proceed"}
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConfirmDelete} className="space-y-4">
            <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4 text-center space-y-1.5">
              <div className="flex items-center justify-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                <Mail size={14} className="text-red-500 shrink-0" />
                <span>Code sent to <strong className="font-bold text-gray-900 dark:text-white truncate max-w-[200px] inline-block align-bottom">{user?.email}</strong></span>
              </div>
              <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">⏱️ Valid for 10 minutes only</p>
            </div>

            <div className="flex items-center justify-center gap-2 sm:gap-2.5 py-2" onPaste={handleOtpPaste}>
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  autoFocus={idx === 0}
                  className="w-10 h-12 sm:w-12 sm:h-14 rounded-2xl border-2 border-gray-200 dark:border-white/15 bg-white dark:bg-black text-center text-lg sm:text-xl font-black text-gray-900 dark:text-white outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all shadow-sm"
                />
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
              <span>Didn't get the code?</span>
              <button
                type="button"
                onClick={() => handleRequestOtp(true)}
                disabled={loading || cooldown > 0}
                className="flex items-center gap-1 font-bold text-red-600 dark:text-red-400 hover:underline disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                <span>{cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}</span>
              </button>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || fullOtp.length !== 6}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                <Trash2 size={14} />
                <span>{loading ? "Deleting..." : "Permanently Delete"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default memo(DeleteAccountModal);
