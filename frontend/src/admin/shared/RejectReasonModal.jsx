import { useState, useEffect } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

/**
 * Reason capture for rejecting a tenant's KYC.
 * The reason is mandatory — the student needs to know what to correct before reapplying.
 */
const RejectReasonModal = ({ isOpen, onClose, onSubmit, tenantName, pgTitle, submitting = false }) => {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setTouched(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isValid = reason.trim().length > 0;

  const handleSubmit = (event) => {
    event.preventDefault();
    setTouched(true);
    if (!isValid || submitting) return;
    onSubmit(reason.trim());
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !submitting && onClose()}
      />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg rounded-3xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0c1220] shadow-2xl p-6 sm:p-8 space-y-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-500">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">Reject tenant details</h3>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                {tenantName ? `For ${tenantName}` : 'For this tenant'}
                {pgTitle ? ` • ${pgTitle}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => !submitting && onClose()}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition"
          >
            <X size={16} />
          </button>
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-gray-400">
            Reason for rejection <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="e.g. Aadhar number doesn't match the uploaded document. Please re-enter your correct details."
            className={`w-full rounded-xl border bg-gray-50 dark:bg-white/5 px-3.5 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 outline-none resize-none transition-all placeholder:text-gray-400 placeholder:font-normal ${
              touched && !isValid
                ? 'border-rose-300 dark:border-rose-500/50 focus:border-rose-400'
                : 'border-gray-200 dark:border-white/15 focus:border-blue-500'
            }`}
          />
          {touched && !isValid ? (
            <p className="mt-1.5 text-[11px] font-bold text-rose-500">Please explain why you are rejecting this tenant.</p>
          ) : (
            <p className="mt-1.5 text-[11px] font-medium text-gray-400">
              This note is shown to the student so they can correct their details and reapply.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={() => !submitting && onClose()}
            disabled={submitting}
            className="rounded-2xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-white/5 px-5 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isValid || submitting}
            className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 hover:bg-rose-500 px-5 py-2.5 text-xs font-black text-white shadow-md shadow-rose-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? <><Loader2 size={14} className="animate-spin" /> Rejecting...</> : 'Reject Tenant'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RejectReasonModal;
