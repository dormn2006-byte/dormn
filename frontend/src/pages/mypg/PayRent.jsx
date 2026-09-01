import React, { useState, useEffect, useContext, memo, useCallback, useMemo } from 'react';
import {
  ArrowLeft, IndianRupee, CheckCircle2, Clock,
  Receipt, FileText, Building2, CreditCard, ShieldCheck
} from 'lucide-react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { loadRazorpayScript } from '../../utils/razorpay';
import InvoiceView from './InvoiceView';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';

const PayRent = memo(({ onBack }) => {
  const { user } = useContext(AuthContext);
  const [subTab, setSubTab] = useState('dues');
  const [bookings, setBookings] = useState([]);
  const [activeStay, setActiveStay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPaying, setIsPaying] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchLive = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [bookRes, pgRes] = await Promise.all([
        api.get('/bookings/my-bookings').catch(() => ({ data: [] })),
        api.get('/bookings/my-pgs').catch(() => ({ data: { booking: null } }))
      ]);

      const list = Array.isArray(bookRes.data?.bookings || bookRes.data) ? (bookRes.data?.bookings || bookRes.data) : [];
      setBookings(list);
      setActiveStay(list.find(b => b.payment_status === 'paid' || b.status === 'approved') || pgRes.data?.booking || null);
    } catch {
      setError('Unable to load payment data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLive(); }, [fetchLive]);

  const currentDues = useMemo(() => bookings.filter(b => b.status === 'approved' && b.payment_status !== 'paid'), [bookings]);
  const history = useMemo(() => bookings.filter(b => b.payment_status === 'paid'), [bookings]);

  const handlePay = async (booking) => {
    const amount = Number(booking.booked_price || booking.price || 0);
    if (!amount) return alert('Invalid price details.');

    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) return alert('Payment SDK failed to load.');

    setIsPaying(true);
    try {
      const orderRes = await api.post('/payments/create-order', {
        pg_id: Number(booking.pg_id),
        owner_id: Number(booking.owner_id),
        amount_in_rupees: amount
      });

      const data = orderRes.data;
      if (!data.success) {
        setIsPaying(false);
        return alert(data.message || 'Failed to initialize payment.');
      }

      new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: 'Dormn Resident Stay',
        description: `Rent Payment for ${booking.title || booking.pg_name || 'Accommodation'}`,
        order_id: data.order_id,
        handler: async (response) => {
          try {
            const verifyRes = await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              booking_id: data.booking_id || booking.id
            });
            if (verifyRes.data.success) {
              await fetchLive();
              setSubTab('history');
            }
          } catch {
            alert('Verification failed. Contact support.');
          } finally {
            setIsPaying(false);
          }
        },
        prefill: { name: user?.name || user?.full_name || 'Student', email: user?.email || '', contact: user?.phone || '' },
        theme: { color: '#0D3A1D' }
      }).open();
    } catch {
      alert('Failed to start payment.');
      setIsPaying(false);
    }
  };

  if (selectedInvoice) {
    return <InvoiceView payment={selectedInvoice} pgInfo={activeStay || selectedInvoice} studentName={user?.name || user?.full_name || 'Resident'} onBack={() => setSelectedInvoice(null)} />;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center text-xs sm:text-sm font-bold text-gray-500 hover:text-[#0D3A1D] dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> <span>Back to Home</span>
        </button>
        <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">Payment Portal</span>
      </div>

      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#0D3A1D] dark:text-white tracking-tight">Rent & Invoices</h2>
        <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Real-time payment dashboard for {activeStay?.title || activeStay?.pg_name || 'your PG stay'}</p>
      </div>

      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-gray-100 dark:bg-white/[0.04] border border-gray-200/80 dark:border-white/10 max-w-md">
        <button onClick={() => setSubTab('dues')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${subTab === 'dues' ? 'bg-white dark:bg-[#181818] text-[#0D3A1D] dark:text-white shadow-sm' : 'text-gray-500'}`}>
          <CreditCard className="w-4 h-4" /> <span>Current Dues</span>
          {currentDues.length > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white">{currentDues.length}</span>}
        </button>
        <button onClick={() => setSubTab('history')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${subTab === 'history' ? 'bg-white dark:bg-[#181818] text-[#0D3A1D] dark:text-white shadow-sm' : 'text-gray-500'}`}>
          <Receipt className="w-4 h-4" /> <span>Payment History</span>
          {history.length > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#93B733]/20 text-[#0D3A1D] dark:text-[#93B733]">{history.length}</span>}
        </button>
      </div>

      {error && <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 p-4 rounded-2xl text-center text-rose-600 text-sm">{error}</div>}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <div className="w-8 h-8 border-4 border-[#93B733] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-xs">Fetching real-time records...</p>
        </div>
      ) : subTab === 'dues' ? (
        <div className="space-y-4">
          {currentDues.length > 0 ? currentDues.map((due) => (
            <div key={due.id} className="bg-white dark:bg-[#141414] border border-amber-300 dark:border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-600 border border-amber-200"><Clock className="w-3.5 h-3.5 inline mr-1" /> Rent Due</span>
                  <span className="text-xs text-gray-400">Booked: {fmtDate(due.booking_date || due.created_at)}</span>
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl sm:text-4xl font-black text-[#0D3A1D] dark:text-white">₹{(Number(due.booked_price || due.price || 0)).toLocaleString('en-IN')}</span>
                  <span className="text-xs text-gray-400 font-semibold">/ month</span>
                </div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#93B733]" /> {due.title || due.pg_name} • {due.selected_room_type || due.room_type || 'Standard Room'}
                </p>
              </div>
              <button onClick={() => handlePay(due)} disabled={isPaying} className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#93B733] hover:bg-[#82a32d] active:scale-95 text-white font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50">
                <IndianRupee className="w-4 h-4" /> {isPaying ? 'Processing...' : `Pay ₹${(Number(due.booked_price || due.price || 0)).toLocaleString('en-IN')}`}
              </button>
            </div>
          )) : (
            <div className="bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-200/60 dark:border-emerald-500/20 rounded-3xl p-8 sm:p-12 text-center">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h4 className="text-xl sm:text-2xl font-black text-[#0D3A1D] dark:text-white">Zero Dues</h4>
              <p className="text-xs sm:text-sm font-medium text-emerald-700 dark:text-emerald-400 mt-1">All accommodation payments are fully cleared in real-time. Enjoy your stay!</p>
              {activeStay && (
                <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 dark:bg-white/5 border border-emerald-300 dark:border-emerald-500/20 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Active Stay: {activeStay.title || activeStay.pg_name}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {history.length > 0 ? history.map((item) => (
            <div key={item.id} onClick={() => setSelectedInvoice(item)} className="group bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#93B733]/40 cursor-pointer transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <IndianRupee className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-gray-900 dark:text-white text-base sm:text-lg">₹{(Number(item.booked_price || item.price || 0)).toLocaleString('en-IN')}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-200">Paid</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">{item.title || item.pg_name} • Date: {fmtDate(item.booking_date || item.created_at)}</p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#0D3A1D] dark:text-[#93B733] flex items-center gap-1 group-hover:underline">
                <FileText className="w-3.5 h-3.5" /> View Invoice →
              </span>
            </div>
          )) : (
            <div className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/10 rounded-2xl p-10 text-center">
              <Receipt className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">No payment history records</p>
              <p className="text-xs text-gray-400 mt-1">Completed rent payments will appear here in real-time.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

PayRent.displayName = 'PayRent';
export default PayRent;
