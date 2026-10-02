import { useEffect, useState, useCallback, useMemo } from "react";
import {
  CheckCircle2,
  Building2,
  BedDouble,
  Calendar,
  RefreshCw,
  ShieldCheck,
  Tag,
  Loader2,
  AlertTriangle,
  Send,
  Clock,
} from "lucide-react";
import API from "../../services/api";

const SecurePaymentIcon = ({ className = "w-14 h-12" }) => (
  <div className={`flex items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-3 shadow-inner ${className}`}>
    <ShieldCheck className="w-full h-full" strokeWidth={1.8} />
  </div>
);

const formatPaymentDate = (dateStr) => {
  if (!dateStr) return "Recent";
  const d = new Date(dateStr);
  return isNaN(d.getTime())
    ? "Recent"
    : d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
};

const rupees = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// Settlement rows come from the payroll ledger; the legacy payment shape is
// normalised into the same fields so the table stays simple.
const STATUS_META = {
  pending: { label: "Ready to transfer", className: "bg-amber-500/15 text-amber-600 border-amber-500/25", Icon: Clock },
  processing: { label: "Transferring", className: "bg-blue-500/15 text-blue-600 border-blue-500/25", Icon: Loader2 },
  paid: { label: "Transferred", className: "bg-emerald-500/15 text-emerald-500 border-emerald-500/25", Icon: CheckCircle2 },
  failed: { label: "Failed", className: "bg-rose-500/15 text-rose-500 border-rose-500/25", Icon: AlertTriangle },
  no_payout: { label: "Fee applied", className: "bg-gray-500/15 text-gray-500 border-gray-500/25", Icon: ShieldCheck },
};

const OwnerPayments = () => {
  const [settlements, setSettlements] = useState([]);
  const [totals, setTotals] = useState(null);
  const [legacyPayments, setLegacyPayments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [error, setError] = useState("");

  const fetchSettlements = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await API.get("/settlements/mine");

      if (res?.data?.success) {
        setSettlements(Array.isArray(res.data.settlements) ? res.data.settlements : []);
        setTotals(res.data.totals || null);
        setLegacyPayments(null);
        return;
      }
      throw new Error("Unexpected settlements response");
    } catch (err) {
      console.error("Fetch Settlements Error:", err);
      // Fall back to the raw payments ledger so the page still shows revenue.
      try {
        const payRes = await API.get("/payments/owner-payments");
        setLegacyPayments(Array.isArray(payRes?.data?.payments) ? payRes.data.payments : []);
      } catch (fallbackErr) {
        console.error("Fetch Owner Payments Error:", fallbackErr);
        setLegacyPayments([]);
      }
      setSettlements([]);
      setTotals(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  const handleTransfer = async (settlementId) => {
    try {
      setActingId(settlementId);
      setError("");
      await API.post(`/settlements/${settlementId}/approve`);
      await fetchSettlements();
    } catch (err) {
      setError(err?.response?.data?.message || "Could not start the transfer. Please try again.");
    } finally {
      setActingId(null);
    }
  };

  const grossRevenue = useMemo(() => {
    if (totals) return Number(totals.gross_received || 0);
    if (legacyPayments) return legacyPayments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return settlements.reduce((sum, s) => sum + Number(s.gross_amount || 0), 0);
  }, [totals, legacyPayments, settlements]);

  const pendingNet = Number(totals?.pending_net || 0);
  const paidNet = Number(totals?.paid_net || 0);
  const feeCollected = Number(totals?.fee_collected || 0);
  const showSettlementView = !legacyPayments;

  return (
    <div className="space-y-3 sm:space-y-4 max-w-[1600px] mx-auto animate-fadeIn">

      {/* Header & Totals */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0c1220] p-3 sm:p-4 shadow-2xs">
        <div>
          <span className="rounded-lg bg-[#93B733]/15 text-[#93B733] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
            Payouts & Revenue
          </span>
          <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mt-1">
            Received Payments
          </h1>
          <p className="text-[11px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
            Rent collected from students, the company fee, and what has been transferred to your bank.
          </p>
        </div>

        <button
          onClick={fetchSettlements}
          className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition shrink-0 cursor-pointer self-start"
          title="Refresh ledger"
        >
          <RefreshCw size={15} className={loading ? "animate-spin text-[#93B733]" : "text-[#93B733]"} />
          Refresh
        </button>
      </div>

      {/* Money tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0c1220] p-3 shadow-2xs">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Rent Received</p>
          <p className="text-base sm:text-xl font-black text-gray-900 dark:text-white mt-0.5">{rupees(grossRevenue)}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5 p-3 shadow-2xs">
          <p className="text-[10px] uppercase tracking-wider text-amber-500 font-bold">Ready to Transfer</p>
          <p className="text-base sm:text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{rupees(pendingNet)}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 p-3 shadow-2xs">
          <p className="text-[10px] uppercase tracking-wider text-emerald-500 font-bold">Transferred to Bank</p>
          <p className="text-base sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{rupees(paidNet)}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0c1220] p-3 shadow-2xs">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Company Fee</p>
          <p className="text-base sm:text-xl font-black text-gray-500 mt-0.5">{rupees(feeCollected)}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-500/25 bg-rose-50 dark:bg-rose-500/10 px-3 py-2 text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2">
          <AlertTriangle size={14} className="shrink-0" /> {error}
        </div>
      )}

      {!showSettlementView && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-500/25 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
          <AlertTriangle size={14} className="shrink-0" />
          Payout ledger unavailable — showing raw payment records only.
        </div>
      )}

      {/* Transactions */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0c1220] shadow-2xs">
        <div className="p-3 sm:p-3.5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
              {showSettlementView ? "Settlements" : "Paid Transactions"}
            </h2>
            <p className="text-[10px] sm:text-[11px] font-medium text-gray-400">
              {showSettlementView
                ? "Company fee is deducted automatically; transfer the rest to your bank."
                : "Verified student fee receipts"}
            </p>
          </div>
          <span className="rounded-lg bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 px-2.5 py-1 text-[10px] sm:text-[11px] font-bold">
            Total: {showSettlementView ? settlements.length : legacyPayments?.length || 0}
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 dark:border-gray-800 border-t-[#93B733] mb-2"></div>
            <p className="text-[11px] font-bold text-gray-500">Loading payment ledger...</p>
          </div>
        ) : (showSettlementView ? settlements.length === 0 : (legacyPayments?.length || 0) === 0) ? (
          <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center">
            <div className="flex items-center justify-center mb-3">
              <SecurePaymentIcon className="w-16 h-14 opacity-90 transition-transform hover:scale-105" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">No Payments Yet</h3>
            <p className="mt-1 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">
              When an approved student pays rent, the amount will appear here with the company fee already deducted and ready to transfer to your bank.
            </p>
          </div>
        ) : showSettlementView ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <th className="py-2.5 px-3.5">User / Student</th>
                  <th className="py-2.5 px-3.5">PG</th>
                  <th className="py-2.5 px-3.5">Rent Received</th>
                  <th className="py-2.5 px-3.5">Company Fee</th>
                  <th className="py-2.5 px-3.5">Your Payout</th>
                  <th className="py-2.5 px-3.5">Date</th>
                  <th className="py-2.5 px-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-xs font-medium text-gray-700 dark:text-gray-300">
                {settlements.map((item, idx) => {
                  const meta = STATUS_META[item.status] || STATUS_META.pending;
                  const { Icon } = meta;
                  const canTransfer = item.status === "pending" || item.status === "failed";

                  return (
                    <tr key={item.settlement_id || idx} className="transition hover:bg-gray-50/80 dark:hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-2xs">
                            {(item.student_name || "S").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white text-xs">{item.student_name || "Student"}</p>
                            <p className="text-[10px] font-semibold text-gray-400 font-mono">
                              UID: #{item.student_id || "N/A"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5">
                        <p className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1 text-[11px] truncate">
                          <Building2 size={12} className="text-blue-500 shrink-0" />
                          <span className="truncate">{item.pg_title || "PG"}</span>
                        </p>
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap font-bold text-gray-900 dark:text-gray-100">
                        {rupees(item.gross_amount)}
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <span className="text-rose-500 font-bold">-{rupees(item.fee_deducted)}</span>
                        <span className="ml-1 text-[10px] text-gray-400 font-semibold">({item.fee_percent}%)</span>
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap font-black text-[#93B733]">
                        {rupees(item.net_amount)}
                      </td>
                      <td className="py-2.5 px-3.5 text-gray-600 dark:text-gray-400 whitespace-nowrap text-[11px]">
                        <div className="flex items-center gap-1">
                          <Calendar size={11} className="text-gray-400" />
                          <span>{formatPaymentDate(item.created_at)}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase ${meta.className}`}>
                            <Icon size={11} className={item.status === "processing" ? "animate-spin" : ""} />
                            {meta.label}
                          </span>
                          {canTransfer && (
                            <button
                              onClick={() => handleTransfer(item.settlement_id)}
                              disabled={actingId === item.settlement_id}
                              className="inline-flex items-center gap-1 rounded-lg bg-[#93B733] hover:bg-[#82a32d] text-black px-2.5 py-1 text-[10px] font-black transition active:scale-95 disabled:opacity-50 cursor-pointer"
                            >
                              {actingId === item.settlement_id ? (
                                <Loader2 size={11} className="animate-spin" />
                              ) : (
                                <Send size={11} />
                              )}
                              Transfer
                            </button>
                          )}
                        </div>
                        {item.status === "failed" && item.failure_reason && (
                          <p className="mt-1 text-[9px] text-rose-500 font-semibold max-w-[200px] truncate" title={item.failure_reason}>
                            {item.failure_reason}
                          </p>
                        )}
                        {item.status === "paid" && item.payout_utr && (
                          <p className="mt-1 text-[9px] text-gray-400 font-mono">UTR {item.payout_utr}</p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <th className="py-2.5 px-3.5">User / Student</th>
                  <th className="py-2.5 px-3.5">PG & Room Plan</th>
                  <th className="py-2.5 px-3.5">Amount Paid</th>
                  <th className="py-2.5 px-3.5">Payment Reference</th>
                  <th className="py-2.5 px-3.5">Payment Date & Time</th>
                  <th className="py-2.5 px-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-xs font-medium text-gray-700 dark:text-gray-300">
                {(legacyPayments || []).map((item, idx) => (
                  <tr key={item.payment_id || idx} className="transition hover:bg-gray-50/80 dark:hover:bg-white/[0.02]">
                    <td className="py-2.5 px-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-2xs">
                          {(item.student_name || "S").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-xs">{item.student_name}</p>
                          <span className="text-[10px] font-semibold text-gray-400 font-mono">
                            UID: #{item.student_id || item.user_id || "N/A"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3.5">
                      <p className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1 text-[11px] truncate">
                        <Building2 size={12} className="text-blue-500 shrink-0" />
                        <span className="truncate">{item.pg_title}</span>
                      </p>
                      {item.selected_room_type && (
                        <p className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1 mt-0.5">
                          <BedDouble size={11} className="shrink-0" />
                          <span>{item.selected_room_type}</span>
                        </p>
                      )}
                    </td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <div className="font-bold text-[#93B733] text-xs">{rupees(item.amount)}</div>
                      {item.coupon_code && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 text-[9px] font-black tracking-wider mt-1">
                          <Tag size={9} />
                          {item.coupon_code}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3.5 font-mono text-[10px] text-gray-400">
                      {item.razorpay_payment_id || "Direct Verified"}
                    </td>
                    <td className="py-2.5 px-3.5 text-gray-600 dark:text-gray-400 whitespace-nowrap text-[11px]">
                      <div className="flex items-center gap-1">
                        <Calendar size={11} className="text-gray-400" />
                        <span>{formatPaymentDate(item.payment_date)}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 text-emerald-500 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-bold uppercase">
                        <CheckCircle2 size={11} /> Paid
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default OwnerPayments;
