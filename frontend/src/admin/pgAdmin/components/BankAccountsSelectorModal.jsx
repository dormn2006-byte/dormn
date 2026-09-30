import React, { useState, useEffect, useCallback, memo } from "react";
import { X, Plus, CreditCard, Building2, Check } from "lucide-react";
import BankAccountCard from "./BankAccountCard";
import BankAccountModal from "./BankAccountModal";
import api from "../../../services/api";

const BankAccountsSelectorModal = memo(({
  isOpen,
  onClose,
  selectedAccountId,
  onAccountSelect,
}) => {
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeSelectedId, setActiveSelectedId] = useState(selectedAccountId || null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState(null);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/auth/bank-accounts");
      if (res.data?.success) {
        const accounts = res.data.bank_accounts || [];
        setBankAccounts(accounts);
        if (!activeSelectedId && accounts.length > 0) {
          const primary = accounts.find((a) => a.is_primary) || accounts[0];
          setActiveSelectedId(primary?.id);
        }
      }
    } catch (err) {
      console.error("Failed to load bank accounts:", err);
    } finally {
      setLoading(false);
    }
  }, [activeSelectedId]);

  useEffect(() => {
    if (isOpen) {
      setActiveSelectedId(selectedAccountId || null);
      fetchAccounts();
    }
  }, [isOpen, selectedAccountId, fetchAccounts]);

  if (!isOpen) return null;

  const handleNewlyAdded = (newAccount, allAccounts) => {
    if (Array.isArray(allAccounts) && allAccounts.length > 0) {
      setBankAccounts(allAccounts);
    } else if (newAccount) {
      setBankAccounts((prev) => [...prev, newAccount]);
    }
    if (newAccount?.id) {
      setActiveSelectedId(newAccount.id);
    }
  };

  const handleConfirm = () => {
    const selected = bankAccounts.find((a) => a.id === activeSelectedId);
    if (selected && onAccountSelect) {
      onAccountSelect(selected);
    }
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#121212] p-4 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] animate-[slideUp_0.25s_ease-out]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 dark:border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-8.5 w-8.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CreditCard size={17} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-white leading-tight">
                  Select Settlement Bank Account
                </h3>
                <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400">
                  Choose where tenant rents and security deposits will be credited
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

          {/* Body List */}
          <div className="overflow-y-auto py-3.5 space-y-3 flex-1 pr-0.5 scrollbar-thin">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Saved Accounts ({bankAccounts.length})
              </span>
              <button
                type="button"
                onClick={() => {
                  setAccountToEdit(null);
                  setIsAddModalOpen(true);
                }}
                className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                <Plus size={13} />
                <span>Add Bank Account</span>
              </button>
            </div>

            {loading ? (
              <div className="py-10 text-center text-xs text-gray-400 font-semibold">
                Loading accounts...
              </div>
            ) : bankAccounts.length === 0 ? (
              <div className="py-8 px-4 text-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] space-y-2.5">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                  <Building2 size={22} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">No Bank Accounts Found</h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 max-w-sm mx-auto">
                    Add a bank account to enable rent and token deposit payouts.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAccountToEdit(null);
                    setIsAddModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Add Bank Account</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {bankAccounts.map((account) => (
                  <BankAccountCard
                    key={account.id}
                    account={account}
                    isPrimary={Boolean(account.is_primary)}
                    isSelected={activeSelectedId === account.id}
                    selectable={true}
                    onSelect={() => setActiveSelectedId(account.id)}
                    onEdit={() => {
                      setAccountToEdit(account);
                      setIsAddModalOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setAccountToEdit(null);
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition cursor-pointer"
            >
              <Plus size={13} />
              <span>Add New Bank</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!activeSelectedId || bankAccounts.length === 0}
                className="px-4.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Check size={13} className="stroke-[3]" />
                <span>Connect Selected Bank</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {isAddModalOpen && (
        <BankAccountModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          accountToEdit={accountToEdit}
          onSuccess={handleNewlyAdded}
        />
      )}
    </>
  );
});

BankAccountsSelectorModal.displayName = "BankAccountsSelectorModal";

export default BankAccountsSelectorModal;
