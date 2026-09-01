import { memo } from "react";

const StatusBadge = memo(({ status }) => (
  <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${
    status === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : status === "rejected" ? "bg-rose-50 text-rose-700 border-rose-200"
    : "bg-amber-50 text-amber-700 border-amber-200"
  }`}>{status || "pending"}</span>
));
StatusBadge.displayName = "StatusBadge";

export default StatusBadge;
