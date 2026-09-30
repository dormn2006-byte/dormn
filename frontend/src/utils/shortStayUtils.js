/**
 * Shared Utilities & Helpers for Short Stays (4-5 Days / Daily Guests)
 */

export const formatStayDate = (dateStr) => {
  if (!dateStr) return "Not specified";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(d);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));
    const prefix = diffDays === 0 ? "Today, " : diffDays === 1 ? "Tomorrow, " : diffDays === -1 ? "Yesterday, " : "";

    return (
      prefix +
      d.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    );
  } catch {
    return dateStr;
  }
};

export const calcStayDays = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const ci = new Date(checkIn);
  const co = new Date(checkOut);
  if (isNaN(ci.getTime()) || isNaN(co.getTime()) || co <= ci) return 0;
  return Math.max(1, Math.round((co - ci) / (1000 * 60 * 60 * 24)));
};

export const calcDailyPrice = (monthlyPrice, isAc = false) => {
  const base = Math.round((Number(monthlyPrice) || 6000) / 25);
  return isAc ? base + 100 : base;
};

export const getShortStayStatusMeta = (status) => {
  switch (status) {
    case "approved":
      return {
        label: "Approved",
        badgeCls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
        pillCls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
      };
    case "completed":
      return {
        label: "Completed",
        badgeCls: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
        pillCls: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
      };
    case "rejected":
      return {
        label: "Rejected",
        badgeCls: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
        pillCls: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        badgeCls: "bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-500/30",
        pillCls: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
      };
    case "pending":
    default:
      return {
        label: "Pending Review",
        badgeCls: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
        pillCls: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
      };
  }
};
