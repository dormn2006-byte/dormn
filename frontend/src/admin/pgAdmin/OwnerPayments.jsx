import { useEffect, useState, useCallback, useMemo } from "react";
import { CheckCircle2, Building2, BedDouble, Calendar, RefreshCw, ShieldCheck, Tag } from "lucide-react";
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

const OwnerPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch direct owner payments ledger
      const res = await API.get("/payments/owner-payments").catch(() => null);
      
      if (res?.data?.success && Array.isArray(res.data.payments) && res.data.payments.length > 0) {
        setPayments(res.data.payments);
      } else {
        // Fallback to verified paid bookings
        const bookRes = await API.get("/bookings/owner-bookings").catch(() => null);
        const allBookings = Array.isArray(bookRes?.data?.bookings) ? bookRes.data.bookings : [];
        
        // Strict filter: ONLY records where payment is completed / paid
        const paidRecords = allBookings
          .filter((b) => b.payment_status === "paid")
          .map((b) => ({
            payment_id: b.razorpay_payment_id || `PAY-BK-${b.id}`,
            booking_id: b.id,
            student_id: b.student_id,
            student_name: b.student_name || "Student Resident",
            student_email: b.student_email || "N/A",
            student_phone: b.student_phone || "",
            pg_title: b.title || b.pg_title || "PG Accommodation",
            selected_room_type: b.selected_room_type || "Standard Room",
            amount: Number(b.booked_price || b.price || 0),
            razorpay_payment_id: b.razorpay_payment_id || `RZP-${b.id}`,
            payment_date: b.created_at || b.booking_date || new Date().toISOString(),
            status: "successful"
          }));

        setPayments(paidRecords);
      }
    } catch (err) {
      console.error("Fetch Owner Payments Error:", err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const totalRevenue = useMemo(
    () => payments.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [payments]
  );

  return (
    <div className="space-y-3 sm:space-y-4 max-w-[1600px] mx-auto animate-fadeIn">
      
      {/* Header & Total Earnings */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0c1220] p-3 sm:p-4 shadow-2xs">
        <div>
          <span className="rounded-lg bg-[#93B733]/15 text-[#93B733] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
            Verified Revenue
          </span>
          <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mt-1">
            Received Payments
          </h1>
          <p className="text-[11px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
            Real-time ledger of completed student payments for your PGs and rooms.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-2 sm:p-2.5 min-w-[160px]">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Total Revenue Collected</p>
            <p className="text-lg sm:text-xl font-black text-[#93B733] mt-0.5">
              ₹{Number(totalRevenue).toLocaleString()}
            </p>
          </div>

          <button
            onClick={fetchPayments}
            className="flex items-center justify-center rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition shrink-0 cursor-pointer"
            title="Refresh Ledger"
          >
            <RefreshCw size={15} className={loading ? "animate-spin text-[#93B733]" : "text-[#93B733]"} />
          </button>
        </div>
      </div>

      {/* Transaction History Card */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0c1220] shadow-2xs">
        <div className="p-3 sm:p-3.5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">Paid Transactions</h2>
            <p className="text-[10px] sm:text-[11px] font-medium text-gray-400">Verified student fee receipts</p>
          </div>
          <span className="rounded-lg bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 px-2.5 py-1 text-[10px] sm:text-[11px] font-bold">
            Total Paid: {payments.length}
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 dark:border-gray-800 border-t-[#93B733] mb-2"></div>
            <p className="text-[11px] font-bold text-gray-500">Loading payment receipts...</p>
          </div>
        ) : payments.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center">
            <div className="flex items-center justify-center mb-3">
              <SecurePaymentIcon className="w-16 h-14 opacity-90 transition-transform hover:scale-105" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">No Paid Transactions Yet</h3>
            <p className="mt-1 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">
              Once an approved student completes payment via Razorpay, their verified transaction receipt (User ID, PG name, Room type, Amount & Timestamp) will appear here automatically.
            </p>
          </div>
        ) : (
          /* Payments Table */
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
                {payments.map((item, idx) => (
                  <tr key={item.payment_id || idx} className="transition hover:bg-gray-50/80 dark:hover:bg-white/[0.02]">
                    <td className="py-2.5 px-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-2xs">
                          {(item.student_name || "S").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-xs">{item.student_name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-semibold text-gray-400 font-mono">
                              UID: #{item.student_id || item.user_id || "N/A"}
                            </span>
                            <span className="text-gray-300 dark:text-gray-700">•</span>
                            <span className="text-gray-400 text-[10px] truncate max-w-[130px]">{item.student_email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3.5">
                      <p className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1 text-[11px] truncate">
                        <Building2 size={12} className="text-blue-500 shrink-0" />
                        <span className="truncate">{item.pg_title}</span>
                      </p>
                      <p className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1 mt-0.5">
                        <BedDouble size={11} className="shrink-0" />
                        <span>{item.selected_room_type || "Standard Room"}</span>
                      </p>
                    </td>
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <div className="font-bold text-[#93B733] text-xs">
                        ₹{Number(item.amount).toLocaleString()}
                      </div>
                      {item.coupon_code && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 text-[9px] font-black tracking-wider">
                            <Tag size={9} />
                            {item.coupon_code}
                          </span>
                          {Number(item.discount_amount) > 0 && (
                            <span className="text-[9px] text-gray-400 font-semibold line-through">
                              ₹{Number(item.original_amount || (Number(item.amount) + Number(item.discount_amount))).toLocaleString()}
                            </span>
                          )}
                        </div>
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