import { useEffect, useState, useCallback, useMemo } from "react";
import { CreditCard, CheckCircle2, Building2, User, BedDouble, Calendar, RefreshCw } from "lucide-react";
import API from "../../services/api";

const SecurePaymentIcon = ({ className = "w-28 h-24" }) => (
  <svg
    viewBox="0 0 120 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Back Card */}
    <rect
      x="28"
      y="8"
      width="82"
      height="52"
      rx="10"
      transform="rotate(13 28 8)"
      className="stroke-gray-400 dark:stroke-gray-500 fill-transparent"
      strokeWidth="4"
    />
    <line
      x1="35"
      y1="23"
      x2="110"
      y2="40"
      className="stroke-gray-800 dark:stroke-gray-300"
      strokeWidth="7"
      strokeLinecap="round"
    />

    {/* Front Card */}
    <rect
      x="6"
      y="30"
      width="88"
      height="56"
      rx="12"
      className="stroke-gray-900 dark:stroke-white fill-white dark:fill-[#0c1220]"
      strokeWidth="4.5"
    />
    {/* Chip */}
    <rect
      x="16"
      y="48"
      width="18"
      height="14"
      rx="4"
      className="fill-gray-900 dark:fill-white"
    />
    {/* Card lines */}
    <line
      x1="42"
      y1="68"
      x2="66"
      y2="68"
      className="stroke-gray-900 dark:stroke-white"
      strokeWidth="4.5"
      strokeLinecap="round"
    />

    {/* Lock Container */}
    <g transform="translate(68, 50)">
      {/* Lock Shackle */}
      <path
        d="M12 12V8C12 4.68629 14.6863 2 18 2C21.3137 2 24 4.68629 24 8V12"
        className="stroke-gray-900 dark:stroke-white fill-none"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Lock Body */}
      <rect
        x="6"
        y="12"
        width="24"
        height="22"
        rx="6"
        className="fill-gray-900 dark:fill-white"
      />
      {/* Checkmark inside Lock */}
      <path
        d="M13 22.5L16.5 26L23 18.5"
        className="stroke-white dark:stroke-[#0c1220] fill-none"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  </svg>
);

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
    <div className="space-y-6 max-w-[1600px] mx-auto">
      
      {/* Header & Total Earnings */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0c1220] p-6 shadow-sm">
        <div>
          <span className="rounded-xl bg-[#93B733]/15 text-[#93B733] px-3.5 py-1 text-xs font-black uppercase tracking-wider">
            Verified Revenue
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-2">
            Received Payments
          </h1>
          <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
            Real-time ledger of completed student payments for your PGs and rooms.
          </p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-5 min-w-[240px]">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Total Revenue Collected</p>
            <p className="text-2xl sm:text-3xl font-black text-[#93B733] mt-1">
              ₹{Number(totalRevenue).toLocaleString()}
            </p>
          </div>

          <button
            onClick={fetchPayments}
            className="flex items-center gap-2 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition shrink-0"
            title="Refresh Ledger"
          >
            <RefreshCw size={18} className={loading ? "animate-spin text-[#93B733]" : "text-[#93B733]"} />
          </button>
        </div>
      </div>

      {/* Transaction History Card */}
      <div className="overflow-hidden rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0c1220] shadow-sm">
        <div className="p-6 border-b border-gray-100 dark:border-white/10 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-black text-gray-900 dark:text-white">Paid Transactions</h2>
            <p className="text-xs font-medium text-gray-400">Verified student fee receipts</p>
          </div>
          <span className="rounded-xl bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 px-3.5 py-1.5 text-xs font-black">
            Total Paid: {payments.length}
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 dark:border-gray-800 border-t-[#93B733] mb-3"></div>
            <p className="text-xs font-bold text-gray-500">Loading payment receipts...</p>
          </div>
        ) : payments.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center p-16 sm:p-20 text-center">
            <div className="flex items-center justify-center mb-6">
              <SecurePaymentIcon className="w-32 h-28 drop-shadow-sm transition-transform hover:scale-105" />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white">No Paid Transactions Yet</h3>
            <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md leading-relaxed">
              Once an approved student completes payment via Razorpay, their verified transaction receipt (User ID, PG name, Room type, Amount & Timestamp) will appear here automatically.
            </p>
          </div>
        ) : (
          /* Payments Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] text-[11px] font-black uppercase tracking-wider text-gray-400">
                  <th className="py-4 px-6">User / Student</th>
                  <th className="py-4 px-6">PG & Room Plan</th>
                  <th className="py-4 px-6">Amount Paid</th>
                  <th className="py-4 px-6">Payment Reference</th>
                  <th className="py-4 px-6">Payment Date & Time</th>
                  <th className="py-4 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-xs font-medium text-gray-700 dark:text-gray-300">
                {payments.map((item, idx) => (
                  <tr key={item.payment_id || idx} className="transition hover:bg-gray-50/80 dark:hover:bg-white/[0.02]">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-sm font-black text-white">
                          {(item.student_name || "S").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-gray-900 dark:text-white text-sm">{item.student_name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold text-gray-400 font-mono">
                              UID: #{item.student_id || item.user_id || "N/A"}
                            </span>
                            <span className="text-gray-300 dark:text-gray-700">•</span>
                            <span className="text-gray-400 text-[11px]">{item.student_email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 text-xs">
                        <Building2 size={14} className="text-blue-500 shrink-0" />
                        <span>{item.pg_title}</span>
                      </p>
                      <p className="text-[11px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 mt-0.5">
                        <BedDouble size={13} className="shrink-0" />
                        <span>{item.selected_room_type || "Standard Room"}</span>
                      </p>
                    </td>
                    <td className="py-4 px-6 font-black text-[#93B733] text-sm whitespace-nowrap">
                      ₹{Number(item.amount).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 font-mono text-[11px] text-gray-400">
                      {item.razorpay_payment_id || "Direct Verified"}
                    </td>
                    <td className="py-4 px-6 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-gray-400" />
                        <span>
                          {item.payment_date
                            ? new Date(item.payment_date).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : "Recent"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 text-[11px] font-black uppercase">
                        <CheckCircle2 size={13} /> Paid
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