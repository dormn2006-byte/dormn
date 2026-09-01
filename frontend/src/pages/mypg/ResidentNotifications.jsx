import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { ArrowLeft, Bell, CheckCircle2, Clock, Wrench, BookOpenCheck, Trash2, Check, IndianRupee, X } from 'lucide-react';
import api from '../../services/api';

const NOTIF_KEY = 'dormn_resident_notifications';
const LS_KEY = 'dormn_resident_requests';
const formatDT = (iso) => iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A';

const ResidentNotifications = memo(({ onBack }) => {
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedNotif, setSelectedNotif] = useState(null);

  const fetchNotifs = useCallback(async () => {
    let list = [];
    try {
      const res = await api.get('/bookings/my-bookings').catch(() => null);
      const bks = Array.isArray(res?.data?.bookings || res?.data) ? (res?.data?.bookings || res?.data) : [];
      bks.forEach(b => {
        const name = b.title || b.pg_name || 'PG Property';
        if (b.status === 'approved' && b.payment_status !== 'paid') {
          list.push({ id: `notif-pay-${b.id}`, type: 'payment_due', category: 'Payment Pending', title: `Rent Payment Pending: ${name}`, message: `Your booking for ${name} is approved! Rent payment of ₹${(Number(b.booked_price || b.price || 0)).toLocaleString()} is pending. Pay now to unlock full portal access.`, status: 'payment_due', created_at: b.booking_date || new Date().toISOString(), read: false });
        } else if (b.status === 'approved' && b.payment_status === 'paid') {
          list.push({ id: `notif-paid-${b.id}`, type: 'booking_update', category: 'Payment Verified', title: `Payment Verified: ${name}`, message: `Rent payment confirmed by PG owner. Stay active.`, status: 'approved', created_at: b.booking_date || new Date().toISOString(), read: false });
        } else if (b.status === 'pending') {
          list.push({ id: `notif-pend-${b.id}`, type: 'booking_update', category: 'Booking Status', title: `Booking Under Review: ${name}`, message: `Booking application for ${name} is under owner review.`, status: 'pending', created_at: b.booking_date || new Date().toISOString(), read: false });
        }
      });
    } catch {}

    try {
      const reqs = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
      if (Array.isArray(reqs)) {
        reqs.forEach(r => {
          if (r.status === 'in_progress') {
            list.push({ id: `notif-ip-${r.id}`, type: 'maintenance_update', category: 'Maintenance In Progress', title: `Work In Progress: ${r.title}`, message: `PG Owner marked issue "${r.title}" as In Progress. Staff assigned.`, note: r.resolution_note || 'Owner assigned technician.', status: 'in_progress', created_at: r.filed_at || r.created_at || new Date().toISOString(), read: false });
          } else if (r.status === 'resolved' || r.status === 'closed') {
            list.push({ id: `notif-res-${r.id}`, type: 'maintenance_update', category: 'Issue Resolved', title: `Issue Completed: ${r.title}`, message: `PG Owner resolved request "${r.title}". Tested & completed.`, note: r.resolution_note || 'Issue resolved by PG Owner.', status: 'resolved', created_at: r.closed_at || r.created_at || new Date().toISOString(), read: false });
          }
        });
      }
    } catch {}

    try {
      const stored = JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]');
      const notices = JSON.parse(localStorage.getItem('dormn_resident_notices') || '[]');
      [...(Array.isArray(stored) ? stored : []), ...(Array.isArray(notices) ? notices : [])].forEach(n => {
        if (n.id && !String(n.id).includes('init') && !String(n.title || '').includes('Dormn Stay has been approved')) list.push(n);
      });
    } catch {}

    const map = new Map();
    list.forEach(i => {
      const k = `${(i.category || '').toLowerCase()}_${(i.title || '').toLowerCase()}`;
      if (!map.has(k) || new Date(i.created_at) > new Date(map.get(k).created_at)) map.set(k, i);
    });

    const dedup = Array.from(map.values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    setNotifications(dedup);
  }, []);

  useEffect(() => {
    fetchNotifs();
    const sync = () => fetchNotifs();
    window.addEventListener('storage', sync);
    window.addEventListener('dormn_request_updated', sync);
    return () => { window.removeEventListener('storage', sync); window.removeEventListener('dormn_request_updated', sync); };
  }, [fetchNotifs]);

  const save = (up) => { setNotifications(up); localStorage.setItem(NOTIF_KEY, JSON.stringify(up)); };
  const markRead = (id) => save(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => save(notifications.map(n => ({ ...n, read: true })));
  const clearAll = () => save([]);

  const handleCardClick = (item) => { if (!item.read) markRead(item.id); setSelectedNotif(item); };
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);
  const filtered = useMemo(() => notifications.filter(n => {
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'payment') return n.type === 'payment_due' || (n.category || '').includes('Payment');
    if (activeTab === 'booking') return n.type === 'booking_update' || (n.category || '').includes('Booking');
    if (activeTab === 'maintenance') return n.type === 'maintenance_update' || (n.category || '').includes('Maintenance');
    return true;
  }), [notifications, activeTab]);

  const getStyle = (type, status) => {
    if (type === 'payment_due' || status === 'payment_due') return { icon: IndianRupee, bg: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400' };
    if (type === 'booking_update' || status === 'approved') return { icon: BookOpenCheck, bg: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' };
    if (type === 'maintenance_update' || status === 'in_progress') return { icon: Wrench, bg: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400' };
    if (status === 'resolved' || status === 'closed') return { icon: CheckCircle2, bg: 'bg-emerald-600', badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' };
    return { icon: Bell, bg: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' };
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center text-xs sm:text-sm font-bold text-gray-500 hover:text-[#0D3A1D] dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Dashboard
        </button>
        <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">Owner Notifications</span>
      </div>

      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#0D3A1D] dark:text-white tracking-tight flex items-center gap-3">
          <Bell className="w-7 h-7 text-[#93B733]" /> Notifications Center
        </h2>
        <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Real-time owner notifications. Click any card to view complete details.</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-gray-100 dark:bg-white/[0.04] border border-gray-200/80 dark:border-white/10 w-fit overflow-x-auto scrollbar-none">
          {[{ id: 'all', label: 'All' }, { id: 'unread', label: 'Unread', count: unreadCount }, { id: 'payment', label: 'Payments' }, { id: 'booking', label: 'Bookings' }, { id: 'maintenance', label: 'Maintenance' }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === tab.id ? 'bg-white dark:bg-[#181818] text-[#0D3A1D] dark:text-white shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
              <span>{tab.label}</span>
              {tab.count > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">{tab.count}</span>}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && <button onClick={markAllRead} className="flex items-center gap-1 text-xs font-bold text-[#93B733] hover:underline cursor-pointer"><Check className="w-3.5 h-3.5" /> Mark all as read</button>}
          {notifications.length > 0 && <button onClick={clearAll} className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-rose-500 cursor-pointer transition-colors"><Trash2 className="w-3.5 h-3.5" /> Clear all</button>}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length > 0 ? filtered.map(item => {
          const style = getStyle(item.type, item.status);
          const Icon = style.icon;
          return (
            <div key={item.id} onClick={() => handleCardClick(item)} className={`group flex items-start gap-4 rounded-3xl border p-5 sm:p-6 transition-all cursor-pointer hover:border-[#93B733] ${!item.read ? 'border-[#93B733]/50 bg-emerald-50/20 dark:bg-[#93B733]/5 shadow-sm' : 'border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414]'}`}>
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${style.bg} text-white shadow-md`}>
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${style.badge}`}>{item.category || 'Notification'}</span>
                  {!item.read && <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />}
                </div>
                <h4 className="text-sm sm:text-base font-black text-gray-900 dark:text-white leading-tight">{item.title}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium line-clamp-2">{item.message}</p>
                <div className="flex items-center gap-3 text-[11px] text-gray-400 font-bold pt-1">
                  <span className="flex items-center gap-1"><Clock size={12} /> {formatDT(item.created_at)}</span>
                  <span className="text-[#93B733] font-black ml-auto group-hover:underline">Click for full details →</span>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="bg-white dark:bg-[#141414] border border-gray-200/80 dark:border-white/10 rounded-3xl p-10 sm:p-14 text-center">
            <div className="w-16 h-16 rounded-3xl bg-[#93B733]/10 dark:bg-[#93B733]/5 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-[#93B733]" />
            </div>
            <h4 className="text-lg font-black text-gray-900 dark:text-white">No notifications found</h4>
            <p className="text-xs text-gray-400 mt-1">Real-time owner updates will automatically populate here.</p>
          </div>
        )}
      </div>

      {selectedNotif && (() => {
        const style = getStyle(selectedNotif.type, selectedNotif.status);
        const Icon = style.icon;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-lg rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#141414] p-6 sm:p-8 shadow-2xl space-y-6">
              <button onClick={() => setSelectedNotif(null)} className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer">
                <X size={20} />
              </button>

              <div className="flex items-center gap-4">
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${style.bg} text-white shadow-lg`}>
                  <Icon size={26} />
                </div>
                <div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${style.badge}`}>
                    {selectedNotif.category || 'Notification'}
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mt-1 leading-snug">
                    {selectedNotif.title}
                  </h3>
                </div>
              </div>

              <div className="space-y-4 text-xs sm:text-sm">
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/5 space-y-2">
                  <span className="text-[11px] font-black uppercase text-gray-400 tracking-wider">Detailed Message</span>
                  <p className="font-medium text-gray-700 dark:text-gray-200 leading-relaxed">{selectedNotif.message}</p>
                </div>

                {(selectedNotif.note || selectedNotif.resolution_note) && (
                  <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 space-y-1">
                    <span className="text-[11px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">Owner Note</span>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">"{selectedNotif.note || selectedNotif.resolution_note}"</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5">
                    <span className="block text-[10px] font-black uppercase text-gray-400">Timestamp</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">{formatDT(selectedNotif.created_at)}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5">
                    <span className="block text-[10px] font-black uppercase text-gray-400">Current Status</span>
                    <span className="font-black text-gray-900 dark:text-white capitalize">{selectedNotif.status?.replace('_', ' ') || 'Active'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end border-t border-gray-200/80 dark:border-white/10">
                <button onClick={() => setSelectedNotif(null)} className="w-full py-3 rounded-xl bg-[#0D3A1D] hover:bg-[#092814] dark:bg-[#93B733] dark:hover:bg-[#82a32d] text-white font-extrabold text-sm transition-all shadow-md cursor-pointer">
                  Close Details
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
});

ResidentNotifications.displayName = 'ResidentNotifications';
export default ResidentNotifications;
