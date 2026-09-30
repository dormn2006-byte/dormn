import { memo } from "react";

const StatusBadge = memo(({ status, paymentStatus }) => {
  const isPaid = paymentStatus === "paid" || status === "paid";
  const cls = isPaid ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : status === "approved" ? "bg-amber-50 text-amber-700 border-amber-200"
    : status === "rejected" ? "bg-rose-50 text-rose-700 border-rose-200"
    : status === "cancelled" ? "bg-gray-50 text-gray-500 border-gray-200"
    : status === "paused" ? "bg-blue-50 text-blue-500 border-blue-200"
    : "bg-amber-50 text-amber-700 border-amber-200";

  const label = isPaid ? "Paid & Confirmed"
    : status === "approved" ? "Approved (Awaiting Payment)"
    : status || "pending";

  return <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${cls}`}>{label}</span>;
});
StatusBadge.displayName = "StatusBadge";

export default StatusBadge;
