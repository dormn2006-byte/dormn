import React, { useState, useEffect, useRef, useContext, useCallback, memo } from "react";
import { Mail, Clock, CheckCircle2, AlertCircle, X, RefreshCw, ShieldCheck, ArrowRight } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import API from "../../services/api";
import { clearVerificationSnooze } from "../../utils/verificationStorage";

const EmailVerificationModal = ({
  isOpen,
  onClose,
  onSuccess,
  userEmail: propEmail,
  title = "Verify your email to book PG",
  description = "Please enter the 6-digit code sent to your email to verify your account and book PGs or events.",
}) => {
  const { user, updateUser } = useContext(AuthContext);
  const targetEmail = propEmail || user?.email || "";

  const [otpDigits, setOtpDigits] = useState(Array(6).fill(""));
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [resendCooldown, setResendCooldown] = useState(0);
  const [status, setStatus] = useState({ loading: false, sending: false, success: false, error: "", info: "" });
  const inputRefs = useRef([]);

  const sendOtp = useCallback(async (isInitial = false) => {
    if (!targetEmail) return;
    setStatus((p) => ({ ...p, sending: true, error: isInitial ? p.error : "", info: "" }));
    try {
      const res = await API.post("/auth/send-verification-otp", { email: targetEmail });
      if (res.data?.success) {
        setTimeLeft(600);
        setResendCooldown(30);
        setStatus((p) => ({ ...p, sending: false, info: isInitial ? "Code sent to your email!" : "New code sent (valid for 10 mins)." }));
      } else {
        setStatus((p) => ({ ...p, sending: false, error: res.data?.message || "Failed to send code." }));
      }
    } catch (err) {
      setStatus((p) => ({ ...p, sending: false, error: err?.response?.data?.message || "Failed to send verification code." }));
    }
  }, [targetEmail]);

  // Open reset, keyboard listeners, & auto-send
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);

    if (targetEmail) {
      setOtpDigits(Array(6).fill(""));
      setStatus({ loading: false, sending: false, success: false, error: "", info: "" });
      setTimeLeft(600);
      sendOtp(true);
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    }
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, targetEmail, sendOtp, onClose]);

  // Combined countdown timer
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTimeLeft((p) => Math.max(0, p - 1));
      setResendCooldown((p) => Math.max(0, p - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const updateDigits = (cleanDigits, startIdx = 0) => {
    const updated = [...otpDigits];
    cleanDigits.split("").forEach((c, i) => {
      if (startIdx + i < 6) updated[startIdx + i] = c;
    });
    setOtpDigits(updated);
    setStatus((p) => ({ ...p, error: "" }));
    inputRefs.current[Math.min(startIdx + cleanDigits.length, 5)]?.focus();
  };

  const handleDigitChange = (index, value) => {
    if (status.success) return;
    const clean = value.replace(/\D/g, "");
    if (clean.length > 1) {
      updateDigits(clean.slice(0, 6), 0);
      return;
    }
    const updated = [...otpDigits];
    updated[index] = clean;
    setOtpDigits(updated);
    setStatus((p) => ({ ...p, error: "" }));
    if (clean && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) updateDigits(pasted, 0);
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const otp = otpDigits.join("");
    if (otp.length !== 6) return setStatus((p) => ({ ...p, error: "Please enter the full 6-digit code." }));
    if (timeLeft <= 0) return setStatus((p) => ({ ...p, error: "Code expired (10-min limit reached). Please resend." }));

    setStatus((p) => ({ ...p, loading: true, error: "" }));
    try {
      const res = await API.post("/auth/verify-email-otp", { otp, email: targetEmail });
      if (res.data?.success) {
        setStatus((p) => ({ ...p, loading: false, success: true, info: "Email verified! Unlocking booking..." }));
        updateUser?.({ is_email_verified: 1, isEmailVerified: true });
        clearVerificationSnooze(user);
        setTimeout(() => {
          onSuccess?.();
          onClose?.();
        }, 1100);
      } else {
        setStatus((p) => ({ ...p, loading: false, error: res.data?.message || "Invalid code." }));
      }
    } catch (err) {
      const isExp = err?.response?.data?.code === "OTP_EXPIRED";
      setStatus((p) => ({
        ...p,
        loading: false,
        error: isExp ? "Verification code expired. Please click 'Resend Code'." : err?.response?.data?.message || "Verification failed.",
      }));
    }
  };

  if (!isOpen) return null;

  const isExpired = timeLeft <= 0;
  const isComplete = otpDigits.every(Boolean);
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-white dark:bg-[#121212] border border-gray-100 dark:border-neutral-800 rounded-3xl shadow-2xl p-6 sm:p-8">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition cursor-pointer">
          <X size={18} />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0D3A1D]/10 dark:bg-[#93B733]/15 text-[#0D3A1D] dark:text-[#93B733] mb-3">
            {status.success ? <CheckCircle2 size={30} className="text-emerald-500 animate-bounce" /> : <ShieldCheck size={28} />}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            {status.success ? "Email Verified!" : title}
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm mx-auto">
            {status.success ? "Your account is now authorized to book PGs and Events." : description}
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-neutral-800 text-xs font-semibold text-gray-700 dark:text-gray-300">
            <Mail size={13} className="text-[#0D3A1D] dark:text-[#93B733]" />
            <span>{targetEmail}</span>
          </div>
        </div>

        {status.error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center gap-2 text-xs font-medium text-red-700 dark:text-red-300 animate-shake">
            <AlertCircle size={15} className="shrink-0" />
            <span>{status.error}</span>
          </div>
        )}

        {status.info && !status.error && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 size={15} className="shrink-0" />
            <span>{status.info}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex justify-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                disabled={status.success || status.loading}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-black rounded-xl border-2 transition outline-none ${
                  digit
                    ? "border-[#0D3A1D] dark:border-[#93B733] bg-[#0D3A1D]/5 dark:bg-[#93B733]/10 text-gray-900 dark:text-white"
                    : isExpired
                    ? "border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 text-gray-400"
                    : "border-gray-200 dark:border-neutral-700 bg-transparent text-gray-900 dark:text-white focus:border-[#0D3A1D] dark:focus:border-[#93B733]"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-xs font-semibold px-1">
            <div className={`flex items-center gap-1.5 ${isExpired ? "text-red-500" : timeLeft <= 120 ? "text-amber-500 animate-pulse" : "text-gray-600 dark:text-gray-300"}`}>
              <Clock size={14} className={isExpired || timeLeft <= 120 ? "animate-pulse" : "text-[#0D3A1D] dark:text-[#93B733]"} />
              <span>{isExpired ? "Code Expired (10 mins passed)" : `Valid for: ${mm}:${ss}`}</span>
            </div>

            <button
              type="button"
              onClick={() => sendOtp(false)}
              disabled={status.sending || resendCooldown > 0 || status.success}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#0D3A1D] dark:text-[#93B733] hover:underline disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={12} className={status.sending ? "animate-spin" : ""} />
              <span>{status.sending ? "Sending..." : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={status.loading || !isComplete || isExpired || status.success}
            className={`w-full py-3.5 rounded-2xl font-black text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
              status.success
                ? "bg-emerald-600 text-white"
                : isComplete && !isExpired
                ? "bg-[#0D3A1D] hover:bg-[#092814] text-white shadow-[#0D3A1D]/30 active:scale-[0.99]"
                : "bg-gray-200 dark:bg-neutral-800 text-gray-400 dark:text-neutral-500 cursor-not-allowed shadow-none"
            }`}
          >
            {status.loading ? (
              <><RefreshCw size={16} className="animate-spin" /><span>Verifying Code...</span></>
            ) : status.success ? (
              <><CheckCircle2 size={18} /><span>Verified! Proceeding...</span></>
            ) : (
              <><span>Verify & Unlock Bookings</span><ArrowRight size={16} /></>
            )}
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] text-gray-400 dark:text-gray-500 font-medium">
          Dormn OTPs are valid for 10 minutes. Never share your verification codes.
        </p>
      </div>
    </div>
  );
};

export default memo(EmailVerificationModal);
