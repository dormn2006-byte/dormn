import { useEffect, useState, useCallback, useMemo } from 'react';
import { Wrench, CheckCircle2, Clock, RefreshCw, X, Search, MessageSquare, Phone, Building2, ChevronRight } from 'lucide-react';
import api from '../../services/api';

const LS_KEY = 'dormn_resident_requests', NOTICES_KEY = 'dormn_resident_notices';
const formatDT = (iso) => iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A';

const DEFAULT_USER_REQUESTS = [
  {
    id: 'req-1787822400001',
    pg_id: 1,
    pg_title: 'Dormn Stay',
    student_id: 101,
    student_name: 'Sudhanshu Gummadidala',
    student_phone: '+91 98765 43210',
    category: 'Electrical & Lighting',
    location: 'My Room / Bed Area',
    title: 'Tube light flickering in Room 204',
    description: 'The tube light keeps flickering constantly. Needs replacement.',
    priority: 'Normal',
    status: 'open',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    filed_at: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

export default function OwnerRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReq, setSelectedReq] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [note, setNote] = useState('');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      let dbReqs = [];
      try { dbReqs = (await api.get('/student-portal/owner-requests')).data?.requests || []; } catch {}
      try {
        let local = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
        if (Array.isArray(local)) {
          const clean = local.filter(r => 
            r.student_name !== 'Rahul Sharma' && 
            !String(r.id).includes('demo') && 
            !String(r.title || '').toLowerCase().includes('wi-fi router speed issue')
          );
          if (clean.length !== local.length) {
            localStorage.setItem(LS_KEY, JSON.stringify(clean));
          }
          local = clean;
        }
        if (!Array.isArray(local) || local.length === 0) {
          local = DEFAULT_USER_REQUESTS;
          localStorage.setItem(LS_KEY, JSON.stringify(local));
        }
        const ids = new Set(dbReqs.map(r => String(r.id)));
        local.forEach(lr => { if (!ids.has(String(lr.id))) dbReqs.push(lr); });
      } catch {}
      setRequests(dbReqs);
    } catch (e) {
      console.error('Fetch requests error:', e);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchRequests();
    const sync = () => fetchRequests();
    window.addEventListener('storage', sync);
    window.addEventListener('dormn_request_updated', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('dormn_request_updated', sync);
    };
  }, [fetchRequests]);

  const handleStatusUpdate = async (reqId, newStatus) => {
    setProcessingId(reqId);
    const ownerNote = note || (newStatus === 'resolved' ? 'Issue resolved by PG Owner.' : 'Maintenance work in progress.');

    try {
      const local = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
      localStorage.setItem(LS_KEY, JSON.stringify(local.map(r => String(r.id) === String(reqId) ? { ...r, status: newStatus, resolution_note: ownerNote } : r)));
    } catch {}

    const req = requests.find(r => String(r.id) === String(reqId));
    if (req) {
      try {
        const notices = JSON.parse(localStorage.getItem(NOTICES_KEY) || '[]');
        const notifs = JSON.parse(localStorage.getItem('dormn_resident_notifications') || '[]');
        const lbl = newStatus === 'resolved' ? 'Issue Resolved' : newStatus === 'in_progress' ? 'Work In Progress' : 'Status Updated';
        const newNotif = {
          id: `notif-${Date.now()}`, type: 'maintenance_update', category: 'Maintenance',
          title: `${lbl}: ${req.title}`, message: ownerNote, status: newStatus, created_at: new Date().toISOString(), read: false
        };
        notices.unshift({
          id: `notice-${Date.now()}`, type: 'request_update', request_id: req.id, category: req.category || 'Maintenance',
          title: `${lbl}: ${req.title}`, message: ownerNote, status: newStatus, created_at: new Date().toISOString(), read: false
        });
        notifs.unshift(newNotif);
        localStorage.setItem(NOTICES_KEY, JSON.stringify(notices));
        localStorage.setItem('dormn_resident_notifications', JSON.stringify(notifs));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('dormn_request_updated'));
      } catch {}
    }

    try { await api.put(`/student-portal/requests/${reqId}/status`, { status: newStatus, resolution_note: ownerNote }); } catch {}

    setSelectedReq(null); setNote(''); setProcessingId(null); fetchRequests();
  };

  const counts = useMemo(() => ({
    all: requests.length,
    open: requests.filter(r => r.status === 'open').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    resolved: requests.filter(r => r.status === 'resolved' || r.status === 'closed').length,
  }), [requests]);

  const filtered = useMemo(() => requests.filter(r => {
    const matchStatus = activeFilter === 'all' ? true : activeFilter === 'resolved' ? (r.status === 'resolved' || r.status === 'closed') : r.status === activeFilter;
    const matchSearch = !searchTerm || [r.title, r.student_name, r.category].some(s => (s || '').toLowerCase().includes(searchTerm.toLowerCase()));
    return matchStatus && matchSearch;
  }), [requests, activeFilter, searchTerm]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-3xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0c1220] p-5 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
          {[{ id: 'all', label: 'All Requests', count: counts.all }, { id: 'open', label: 'Open / New', count: counts.open }, { id: 'in_progress', label: 'In Progress', count: counts.in_progress }, { id: 'resolved', label: 'Resolved', count: counts.resolved }].map(tab => (
            <button key={tab.id} onClick={() => setActiveFilter(tab.id)} className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-black transition-all shrink-0 cursor-pointer ${activeFilter === tab.id ? 'bg-[#0D3A1D] text-white shadow-lg' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'}`}>
              <span>{tab.label}</span>
              <span className={`rounded-xl px-2 py-0.5 text-xs font-black ${activeFilter === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-200'}`}>{tab.count}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Search requests..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full rounded-2xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-white/5 py-3 pl-10 pr-4 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-[#93B733]" />
          </div>
          <button onClick={fetchRequests} className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition shrink-0 cursor-pointer">
            <RefreshCw size={14} className={loading ? 'animate-spin text-[#93B733]' : 'text-[#93B733]'} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0c1220] p-16 text-center shadow-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 dark:border-gray-800 border-t-[#93B733] mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-500">Loading maintenance requests...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0c1220] p-16 text-center shadow-sm">
          <Wrench size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-black text-gray-900 dark:text-white">No requests found</h3>
          <p className="text-xs text-gray-500 mt-1">Resident maintenance requests will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(req => (
            <div key={req.id} onClick={() => { setSelectedReq(req); setNote(req.resolution_note || ''); }} className={`group flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl border p-5 cursor-pointer transition-all ${req.status === 'open' ? 'border-amber-400/50 bg-amber-50/30 dark:bg-amber-500/[0.03] shadow-sm' : req.status === 'in_progress' ? 'border-blue-400/40 bg-blue-50/20 dark:bg-blue-500/[0.03]' : 'border-gray-200 dark:border-white/15 bg-white dark:bg-[#0c1220]'}`}>
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-md ${req.status === 'open' ? 'bg-gradient-to-tr from-amber-500 to-orange-500' : req.status === 'in_progress' ? 'bg-gradient-to-tr from-blue-500 to-cyan-500' : 'bg-gradient-to-tr from-emerald-500 to-teal-500'} text-white`}>
                  <Wrench size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-black text-gray-900 dark:text-white truncate">{req.student_name || 'Resident'}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#93B733]/15 text-[#0D3A1D] dark:text-[#93B733]">{req.category || 'Maintenance'}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${req.status === 'open' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : req.status === 'in_progress' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'}`}>
                      {req.status === 'open' ? 'New' : req.status === 'in_progress' ? 'In Progress' : req.status === 'closed' ? 'Closed' : 'Resolved'}
                    </span>
                    {req.priority === 'Urgent' && <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-100 dark:bg-rose-500/20 text-rose-600">Urgent</span>}
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white leading-tight">{req.title}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">{req.description || 'No description.'}</p>
                  <div className="flex items-center gap-3 text-[11px] font-bold text-gray-400 mt-2">
                    <span className="flex items-center gap-1"><Building2 size={12} className="text-[#93B733]" />{req.pg_title || 'PG Property'}</span>
                    <span className="flex items-center gap-1"><Clock size={12} />{formatDT(req.created_at || req.filed_at)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                {req.status === 'open' && <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />}
                <ChevronRight size={18} className="text-gray-400 group-hover:text-[#93B733] transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4">
          <div className="relative w-full max-w-xl rounded-3xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0a0f1d] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 px-6 py-5 bg-gray-50/80 dark:bg-white/[0.03]">
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-md ${selectedReq.status === 'open' ? 'bg-gradient-to-tr from-amber-500 to-orange-500' : selectedReq.status === 'in_progress' ? 'bg-gradient-to-tr from-blue-500 to-cyan-500' : 'bg-gradient-to-tr from-emerald-500 to-teal-500'}`}>
                  <Wrench size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white">{selectedReq.student_name || 'Resident'}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400">PG Resident</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${selectedReq.status === 'resolved' || selectedReq.status === 'closed' ? 'bg-emerald-500/20 text-emerald-400' : selectedReq.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {selectedReq.status}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedReq(null)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 dark:border-white/15 bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-white transition cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#141b2d] p-4 space-y-2.5 text-xs font-bold">
                {[
                  { label: 'Resident Student', value: selectedReq.student_name || 'Resident', color: 'text-gray-900 dark:text-white font-black' },
                  { label: 'Phone Number', value: selectedReq.student_phone || 'On File', color: 'text-emerald-500 font-bold' },
                  { label: 'Category', value: selectedReq.category, color: 'text-[#93B733] font-black' },
                  { label: 'Location / Room', value: selectedReq.location || 'N/A' },
                  { label: 'Priority', value: selectedReq.priority || 'Normal', color: selectedReq.priority === 'Urgent' ? 'text-rose-500 font-black' : '' },
                  { label: 'Filed At', value: formatDT(selectedReq.created_at || selectedReq.filed_at) },
                  { label: 'Property Stay', value: selectedReq.pg_title || 'PG Property' }
                ].map((item, idx) => (
                  <div key={item.label} className={`flex items-center justify-between ${idx > 0 ? 'border-t border-gray-200 dark:border-white/10 pt-2.5' : ''}`}>
                    <span className="text-gray-400 uppercase text-[10px]">{item.label}</span>
                    <span className={item.color || 'text-gray-900 dark:text-white'}>{item.value}</span>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <MessageSquare size={14} className="text-[#93B733]" /> Resident's Raised Complaint & Details
                </h4>
                <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 p-4 space-y-2">
                  <h5 className="text-sm font-black text-gray-900 dark:text-white">{selectedReq.title}</h5>
                  <div className="border-t border-gray-200 dark:border-white/10 pt-2 mt-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase text-[9px] mb-1">Detailed Description:</p>
                    <p className="text-xs leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-medium">{selectedReq.description || 'No additional description provided.'}</p>
                  </div>
                </div>
              </div>

              {selectedReq.status !== 'resolved' && selectedReq.status !== 'closed' && (
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Owner Note to Resident (Optional)</label>
                  <textarea rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="E.g., Plumber dispatched. Expected fix by 4 PM today." className="w-full rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#060913] p-3 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-[#93B733] resize-none" />
                </div>
              )}

              <div className="pt-2 flex flex-wrap gap-2.5 justify-end">
                {selectedReq.status === 'open' && (
                  <button disabled={processingId === selectedReq.id} onClick={() => handleStatusUpdate(selectedReq.id, 'in_progress')} className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-3 text-xs font-black text-white transition shadow-md disabled:opacity-50 cursor-pointer">
                    <Wrench size={16} /> <span>{processingId === selectedReq.id ? 'Updating...' : 'Mark In Progress'}</span>
                  </button>
                )}
                {selectedReq.status !== 'resolved' && selectedReq.status !== 'closed' && (
                  <button disabled={processingId === selectedReq.id} onClick={() => handleStatusUpdate(selectedReq.id, 'resolved')} className="flex items-center gap-2 rounded-xl bg-[#0D3A1D] hover:bg-[#07130B] dark:bg-[#93B733] dark:hover:bg-[#82a32d] px-5 py-3 text-xs font-black text-white dark:text-gray-950 transition shadow-md disabled:opacity-50 cursor-pointer">
                    <CheckCircle2 size={16} /> <span>{processingId === selectedReq.id ? 'Updating...' : 'Mark as Completed'}</span>
                  </button>
                )}
                {selectedReq.student_phone && (
                  <a href={`tel:${selectedReq.student_phone}`} className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/15 bg-gray-100 dark:bg-white/10 px-4 py-3 text-xs font-bold text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition">
                    <Phone size={16} /> Call Resident
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
