import React, { memo, useEffect, useContext, useCallback } from "react";
import { X, ShieldAlert, ArrowRight, Mail } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import { snoozeVerification } from "../../utils/verificationStorage";

const VerifyEmailPromptPopup = ({ isOpen, onClose, onLater, onVerify, userEmail }) => {
  const { user } = useContext(AuthContext);

  const handleDismiss = useCallback(() => {
    snoozeVerification(user, 3);
    (onLater || onClose)?.();
  }, [user, onLater, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === "Escape" && handleDismiss();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, handleDismiss]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-white dark:bg-[#121212] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        <div className="pointer-events-none absolute -right-16 -top-16 w-36 h-36 bg-amber-500/15 rounded-full blur-2xl" />

        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4 shadow-inner">
            <ShieldAlert size={28} />
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Verify your email to book PG
          </h3>

          <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-sm">
            Your account is active and you can view your dashboard, but room bookings and event passes require a verified email address.
          </p>

          {userEmail && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-neutral-800 text-xs font-semibold text-gray-700 dark:text-gray-300">
              <Mail size={13} className="text-amber-500" />
              <span>{userEmail}</span>
            </div>
          )}

          <div className="mt-6 w-full flex flex-col gap-2.5">
            <button
              onClick={onVerify}
              className="w-full py-3.5 rounded-2xl bg-[#0D3A1D] hover:bg-[#16502a] text-white text-xs sm:text-sm font-black transition shadow-lg shadow-[#0D3A1D]/25 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>Verify Email (10-Min OTP)</span>
              <ArrowRight size={16} />
            </button>

            <button
              onClick={handleDismiss}
              className="w-full py-2 rounded-xl text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition cursor-pointer"
            >
              Later, explore dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(VerifyEmailPromptPopup);
