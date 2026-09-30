import React, { memo } from "react";
import { CreditCard, Star, Edit2, Trash2, ShieldCheck, Check } from "lucide-react";

/**
 * Modern Bank Card component for Owner Banking
 */
const BankAccountCard = memo(({
  account,
  isPrimary = false,
  isSelected = false,
  selectable = false,
  onSelect,
  onEdit,
  onSetPrimary,
  onDelete,
  className = "",
}) => {
  if (!account) return null;

  const holder = account.account_holder || account.accountHolder || "Account Holder";
  const bank = account.bank_name || account.bankName || "Bank";
  const rawNumber = String(account.account_number || account.accountNumber || "");
  const maskedNumber = account.account_number_masked || (rawNumber ? `•••• •••• •••• ${rawNumber.slice(-4)}` : "•••• •••• •••• ••••");
  const ifsc = account.ifsc_code || account.ifscCode || "";
  const upi = account.upi_id || account.upiId || "";

  return (
    <div
      onClick={selectable && onSelect ? () => onSelect(account) : undefined}
      className={`relative overflow-hidden rounded-2xl border transition-all duration-200 ${
        selectable ? "cursor-pointer active:scale-[0.99]" : ""
      } ${
        isSelected
          ? "border-emerald-500 bg-gradient-to-br from-[#0c2415] via-[#10301d] to-[#08180e] shadow-lg ring-2 ring-emerald-500/40 text-white"
          : isPrimary
          ? "border-emerald-500/40 bg-gradient-to-br from-gray-900 via-slate-900 to-emerald-950 text-white shadow-md hover:border-emerald-500/70"
          : "border-gray-200 dark:border-white/10 bg-gradient-to-br from-gray-800 via-gray-900 to-black text-white shadow-xs hover:border-gray-400 dark:hover:border-white/20"
      } ${className}`}
    >
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

      <div className="relative p-3.5 sm:p-4 flex flex-col justify-between min-h-[160px] sm:min-h-[175px]">
        {/* Top: Bank & Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 rounded-lg bg-white/10 backdrop-blur-xs flex items-center justify-center text-emerald-400 border border-white/15 shrink-0">
              <CreditCard size={15} />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs sm:text-sm tracking-tight text-white capitalize leading-tight truncate">
                {bank}
              </h4>
              <p className="text-[9px] sm:text-[10px] text-gray-300 font-mono">
                IFSC: <span className="font-bold text-emerald-300">{ifsc || "—"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isPrimary && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[9px] font-bold uppercase tracking-wider">
                <ShieldCheck size={10} className="text-emerald-400" />
                <span>Primary</span>
              </span>
            )}
            {selectable && isSelected && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-black text-[9px] font-bold uppercase tracking-wider shadow-xs">
                <Check size={10} className="stroke-[3]" />
                <span>Selected</span>
              </span>
            )}
          </div>
        </div>

        {/* Center: Chip & Account Number */}
        <div className="my-2">
          <div className="flex items-center gap-1.5 mb-1 opacity-80">
            <div className="w-6 h-4.5 rounded-xs bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 border border-amber-600/40 flex items-center justify-center">
              <div className="w-4 h-2.5 border border-amber-800/40 rounded-xs grid grid-cols-2 gap-0.5 opacity-60">
                <div className="border-r border-amber-800/40" />
                <div />
              </div>
            </div>
            <svg className="w-3.5 h-3.5 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8.5 16.5a5 5 0 0 1 0-9" />
              <path d="M12 19a9 9 0 0 0 0-14" />
            </svg>
          </div>

          <div className="text-xs sm:text-sm lg:text-base font-mono font-bold tracking-widest text-white drop-shadow-xs">
            {maskedNumber}
          </div>
        </div>

        {/* Bottom: Beneficiary & Actions */}
        <div className="flex items-end justify-between gap-2 pt-1.5 border-t border-white/10">
          <div className="min-w-0 flex-1">
            <span className="text-[8px] uppercase font-bold text-gray-400 tracking-wider block">
              Beneficiary
            </span>
            <span className="text-[11px] sm:text-xs font-bold text-white uppercase tracking-wide truncate block">
              {holder}
            </span>
            {upi && (
              <span className="text-[9px] text-emerald-400 font-mono truncate block">
                UPI: {upi}
              </span>
            )}
          </div>

          {(onEdit || onSetPrimary || onDelete) && (
            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(account)}
                  title="Edit details"
                  className="p-1 sm:p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white transition active:scale-95 cursor-pointer"
                >
                  <Edit2 size={12} />
                </button>
              )}

              {onSetPrimary && !isPrimary && (
                <button
                  type="button"
                  onClick={() => onSetPrimary(account)}
                  title="Set as primary"
                  className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold transition active:scale-95 flex items-center gap-0.5 cursor-pointer"
                >
                  <Star size={10} className="fill-emerald-300" />
                  <span>Set Primary</span>
                </button>
              )}

              {onDelete && !isPrimary && (
                <button
                  type="button"
                  onClick={() => onDelete(account)}
                  title="Remove account"
                  className="p-1 sm:p-1.5 rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition active:scale-95 cursor-pointer"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

BankAccountCard.displayName = "BankAccountCard";

export default BankAccountCard;
