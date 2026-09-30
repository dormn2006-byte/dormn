import React, { useState, useEffect, memo } from "react";
import { X, Building2, User, CreditCard, Hash, QrCode, ShieldCheck, Check } from "lucide-react";
import api from "../../../services/api";

const BankAccountModal = memo(({
  isOpen,
  onClose,
  accountToEdit = null,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    account_holder: "",
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    upi_id: "",
    is_primary: false,
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isEditing = Boolean(accountToEdit && accountToEdit.id);

  useEffect(() => {
    if (isOpen) {
      if (accountToEdit) {
        setFormData({
          account_holder: accountToEdit.account_holder || accountToEdit.accountHolder || "",
          bank_name: accountToEdit.bank_name || accountToEdit.bankName || "",
          account_number: accountToEdit.account_number || accountToEdit.accountNumber || "",
          ifsc_code: accountToEdit.ifsc_code || accountToEdit.ifscCode || "",
          upi_id: accountToEdit.upi_id || accountToEdit.upiId || "",
          is_primary: Boolean(accountToEdit.is_primary),
        });
      } else {
        setFormData({
          account_holder: "",
          bank_name: "",
          account_number: "",
          ifsc_code: "",
          upi_id: "",
          is_primary: false,
        });
      }
      setErrorMessage("");
    }
  }, [isOpen, accountToEdit]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : name === "ifsc_code" ? value.toUpperCase() : value,
    }));
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { account_holder, bank_name, account_number, ifsc_code, upi_id, is_primary } = formData;

    if (!account_holder?.trim()) return setErrorMessage("Please enter Beneficiary / Account Holder Name.");
    if (!bank_name?.trim()) return setErrorMessage("Please enter Bank Name.");
    if (!account_number?.trim()) return setErrorMessage("Please enter Account Number.");
    if (!ifsc_code?.trim()) return setErrorMessage("Please enter IFSC Code.");

    const cleanIfsc = ifsc_code.trim().toUpperCase();
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
      return setErrorMessage("Invalid IFSC Code format (e.g. HDFC0001234, SBIN0001234).");
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const payload = {
        account_holder: account_holder.trim(),
        bank_name: bank_name.trim(),
        account_number: account_number.trim(),
        ifsc_code: cleanIfsc,
        upi_id: upi_id?.trim() || "",
        is_primary,
      };

      const res = isEditing
        ? await api.put(`/auth/bank-accounts/${accountToEdit.id}`, payload)
        : await api.post("/auth/bank-accounts", payload);

      if (res.data?.success) {
        if (onSuccess) {
          onSuccess(res.data.bank_account || res.data.user?.bank_accounts?.[0], res.data.bank_accounts, res.data.user);
        }
        onClose();
      } else {
        setErrorMessage(res.data?.message || "Failed to save bank account.");
      }
    } catch (err) {
      console.error("Save Bank Account Error:", err);
      setErrorMessage(err.response?.data?.message || "Failed to save bank account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#121212] p-4 sm:p-6 shadow-2xl animate-[slideUp_0.25s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="h-8.5 w-8.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Building2 size={17} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-white leading-tight">
                {isEditing ? "Edit Bank Account" : "Add Settlement Bank Account"}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400">
                Connect your account for automated student payouts
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-3.5 space-y-3">
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
              <User size={12} className="text-emerald-600 dark:text-emerald-400" />
              <span>Beneficiary / Account Holder Name <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="text"
              name="account_holder"
              required
              value={formData.account_holder}
              onChange={handleChange}
              placeholder="e.g. John Doe / PG Enterprise"
              className="w-full h-9.5 sm:h-10.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 px-3 text-xs sm:text-sm font-semibold text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-[#181818] transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                <Building2 size={12} className="text-emerald-600 dark:text-emerald-400" />
                <span>Bank Name <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                name="bank_name"
                required
                value={formData.bank_name}
                onChange={handleChange}
                placeholder="e.g. HDFC Bank, SBI"
                className="w-full h-9.5 sm:h-10.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 px-3 text-xs sm:text-sm font-semibold text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-[#181818] transition"
              />
            </div>

            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                <Hash size={12} className="text-emerald-600 dark:text-emerald-400" />
                <span>IFSC Code <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                name="ifsc_code"
                required
                maxLength={11}
                value={formData.ifsc_code}
                onChange={handleChange}
                placeholder="e.g. HDFC0001234"
                className="w-full h-9.5 sm:h-10.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 px-3 text-xs sm:text-sm font-semibold uppercase text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-[#181818] transition font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
              <CreditCard size={12} className="text-emerald-600 dark:text-emerald-400" />
              <span>Bank Account Number <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="text"
              name="account_number"
              required
              value={formData.account_number}
              onChange={handleChange}
              placeholder="Enter full bank account number"
              className="w-full h-9.5 sm:h-10.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 px-3 text-xs sm:text-sm font-semibold text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-[#181818] transition font-mono tracking-wider"
            />
          </div>

          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
              <QrCode size={12} className="text-emerald-600 dark:text-emerald-400" />
              <span>Instant UPI ID (Optional)</span>
            </label>
            <input
              type="text"
              name="upi_id"
              value={formData.upi_id}
              onChange={handleChange}
              placeholder="e.g. name@okhdfcbank"
              className="w-full h-9.5 sm:h-10.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 px-3 text-xs sm:text-sm font-semibold text-gray-900 dark:text-white outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-[#181818] transition"
            />
          </div>

          <div className="pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="is_primary"
                checked={formData.is_primary}
                onChange={handleChange}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 dark:border-gray-700"
              />
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <ShieldCheck size={13} className="text-emerald-500" />
                Set as Primary Settlement Bank Account
              </span>
            </label>
          </div>

          <div className="pt-2.5 border-t border-gray-100 dark:border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check size={13} className="stroke-[3]" />
                  <span>{isEditing ? "Update Account" : "Save Account"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

BankAccountModal.displayName = "BankAccountModal";

export default BankAccountModal;
