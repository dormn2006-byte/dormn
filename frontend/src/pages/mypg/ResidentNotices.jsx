import { useState, useEffect, useMemo, memo } from 'react';
import { ArrowLeft, Bell, CheckCircle2, Clock, Wrench, Trash2 } from 'lucide-react';

const NOTICES_KEY = 'dormn_resident_notices';
const formatDT = (iso) => iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A';

const ResidentNotices = memo(({ onBack }) => {
  const [notices, setNotices] = useState([]);
  const [activeTab, setActiveTab] = useState('unread');

  useEffect(() => {
    try { setNotices(JSON.parse(localStorage.getItem(NOTICES_KEY) || '[]')); } catch { setNotices([]); }
  }, []);

  const save = (updated) => { setNotices(updated); localStorage.setItem(NOTICES_KEY, JSON.stringify(updated)); };
  const markRead = (id) => save(notices.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => save(notices.map(n => ({ ...n, read: true })));
  const clearAll = () => save([]);

  const unread = useMemo(() => notices.filter(n => !n.read), [notices]);
  const read = useMemo(() => notices.filter(n => n.read), [notices]);
  const list = activeTab === 'unread' ? unread : read;

  const getStatusStyle = (status) => {
    if (status === 'resolved') return { icon: CheckCircle2, color: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400' };
    if (status === 'in_progress') return { icon: Wrench, color: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400' };
    return { icon: Clock, color: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400' };
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center text-xs sm:text-sm font-bold text-gray-500 hover:text-[#0D3A1D] dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Dashboard
        </button>
        <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">My Notices</span>
      </div>

      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#0D3A1D] dark:text-white tracking-tight flex items-center gap-3">
          <Bell className="w-7 h-7 text-[#93B733]" /> Notices & Updates
        </h2>
        <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Real-time updates from your PG owner on maintenance requests and announcements.</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-gray-100 dark:bg-white/[0.04] border border-gray-200/80 dark:border-white/10 w-fit">
          <button onClick={() => setActiveTab('unread')} className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'unread' ? 'bg-white dark:bg-[#181818] text-[#0D3A1D] dark:text-white shadow-xs' : 'text-gray-500'}`}>
            <Bell className="w-3.5 h-3.5" /> New
            {unread.length > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">{unread.length}</span>}
          </button>
          <button onClick={() => setActiveTab('read')} className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'read' ? 'bg-white dark:bg-[#181818] text-[#0D3A1D] dark:text-white shadow-xs' : 'text-gray-500'}`}>
            <CheckCircle2 className="w-3.5 h-3.5" /> Read
            {read.length > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300">{read.length}</span>}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {unread.length > 0 && <button onClick={markAllRead} className="text-xs font-bold text-[#93B733] hover:underline cursor-pointer">Mark all as read</button>}
          {notices.length > 0 && <button onClick={clearAll} className="flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-rose-500 cursor-pointer transition-colors"><Trash2 className="w-3 h-3" /> Clear all</button>}
        </div>
      </div>

      <div className="space-y-3">
        {list.length > 0 ? list.map(notice => {
          const style = getStatusStyle(notice.status);
          const StatusIcon = style.icon;
          return (
            <div key={notice.id} onClick={() => !notice.read && markRead(notice.id)} className={`bg-white dark:bg-[#141414] border rounded-3xl p-5 sm:p-6 transition-all cursor-pointer ${!notice.read ? 'border-[#93B733]/40 bg-emerald-50/20 dark:bg-[#93B733]/5 shadow-sm' : 'border-gray-200/80 dark:border-white/10'}`}>
              <div className="flex items-start gap-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${style.color} text-white shadow-md`}>
                  <StatusIcon size={18} />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${style.badge}`}>
                      {notice.status === 'resolved' ? 'Issue Resolved' : notice.status === 'in_progress' ? 'In Progress' : 'Update'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#93B733]/15 text-[#0D3A1D] dark:text-[#93B733]">{notice.category}</span>
                    {!notice.read && <span className="h-2 w-2 rounded-full bg-[#93B733] animate-pulse" />}
                  </div>
                  <h4 className="text-sm sm:text-base font-black text-gray-900 dark:text-white leading-tight">{notice.title}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{notice.message}</p>
                  <div className="flex items-center gap-3 text-[11px] text-gray-400 font-medium pt-1">
                    <span className="flex items-center gap-1"><Clock size={11} /> {formatDT(notice.created_at)}</span>
                    {notice.status === 'resolved' && <span className="text-emerald-600 dark:text-emerald-400 font-bold">Action needed: Close the ticket in Requests</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="bg-white dark:bg-[#141414] border border-gray-200/80 dark:border-white/10 rounded-3xl p-10 sm:p-14 text-center">
            <div className="w-16 h-16 rounded-3xl bg-[#93B733]/10 dark:bg-[#93B733]/5 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-[#93B733]" />
            </div>
            <h4 className="text-lg font-black text-gray-900 dark:text-white">{activeTab === 'unread' ? 'All caught up!' : 'No read notices'}</h4>
            <p className="text-xs text-gray-400 mt-1">{activeTab === 'unread' ? 'You have no new notifications from your PG owner.' : 'Notices you have read will appear here.'}</p>
          </div>
        )}
      </div>
    </div>
  );
});

ResidentNotices.displayName = 'ResidentNotices';
export default ResidentNotices;
