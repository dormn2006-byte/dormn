import React, { useState, useEffect, useContext, memo, useMemo, useCallback } from 'react';
import {
  ArrowLeft, Wrench, CheckCircle2, Clock, AlertTriangle,
  Send, Sparkles, ChevronRight, X,
  Wifi, Snowflake, ShowerHead, Droplets, Shirt, Zap,
  Utensils, Lightbulb, HelpCircle, ShieldCheck, MapPin, User, Building2
} from 'lucide-react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const LS_KEY = 'dormn_resident_requests';

const AMENITY_MAP = {
  wifi: { icon: Wifi, color: 'text-blue-500 bg-blue-500/10' },
  ac: { icon: Snowflake, color: 'text-cyan-500 bg-cyan-500/10' },
  geyser: { icon: ShowerHead, color: 'text-orange-500 bg-orange-500/10' },
  ro: { icon: Droplets, color: 'text-sky-500 bg-sky-500/10' },
  water: { icon: Droplets, color: 'text-sky-500 bg-sky-500/10' },
  laundry: { icon: Shirt, color: 'text-indigo-500 bg-indigo-500/10' },
  power: { icon: Zap, color: 'text-amber-500 bg-amber-500/10' },
  housekeeping: { icon: Sparkles, color: 'text-emerald-500 bg-emerald-500/10' },
  cleaning: { icon: Sparkles, color: 'text-emerald-500 bg-emerald-500/10' },
  mess: { icon: Utensils, color: 'text-rose-500 bg-rose-500/10' },
  food: { icon: Utensils, color: 'text-rose-500 bg-rose-500/10' },
  cctv: { icon: ShieldCheck, color: 'text-emerald-500 bg-emerald-500/10' },
  security: { icon: ShieldCheck, color: 'text-emerald-500 bg-emerald-500/10' },
  plumbing: { icon: Wrench, color: 'text-teal-500 bg-teal-500/10' },
  electrical: { icon: Lightbulb, color: 'text-yellow-500 bg-yellow-500/10' },
};

const DEFAULT_AMENITIES = [
  'High-Speed Wi-Fi', 'Air Conditioner (AC)', 'Geyser & Hot Water', 'RO Drinking Water',
  'Washing Machine / Laundry', 'Power Backup & Inverter', 'Housekeeping & Cleaning',
  'Mess & Food Service', 'CCTV & Security', 'Plumbing & Washroom', 'Electrical & Lighting', 'Others'
];

const LOCATIONS = [
  'My Room / Bed Area', 'Attached Washroom', 'Common Floor / Corridor',
  'Kitchen / Dining Area', 'Balcony / Terrace', 'Main Entrance / Gate', 'Other Area'
];

const getAmenityConfig = (name) => {
  const clean = String(name || '').toLowerCase();
  for (const [key, conf] of Object.entries(AMENITY_MAP)) {
    if (clean.includes(key)) return { name, ...conf };
  }
  return { name, icon: HelpCircle, color: 'text-purple-500 bg-purple-500/10' };
};

const formatDT = (iso) => iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A';

const getInitialRequests = () => [
  {
    id: 'req-1787822400001',
    pg_id: 1,
    pg_title: 'Dormn Luxury Stay (Sector 62)',
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
    filed_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    closed_at: null,
    resolution_note: ''
  }
];

export default function MaintenanceRequests({ pgInfo, onBack }) {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('active');
  const [requests, setRequests] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Form State
  const [selectedAmenity, setSelectedAmenity] = useState(null);
  const [otherText, setOtherText] = useState('');
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(false);

  const availableAmenities = useMemo(() => {
    let list = DEFAULT_AMENITIES;
    const raw = pgInfo?.amenities;
    if (Array.isArray(raw)) list = raw;
    else if (typeof raw === 'string') {
      try { const p = JSON.parse(raw); if (Array.isArray(p)) list = p; }
      catch { list = raw.split(',').map(s => s.trim()).filter(Boolean); }
    }
    const mapped = list.map(item => getAmenityConfig(typeof item === 'string' ? item : item.name || String(item)));
    if (!mapped.some(m => m.name.toLowerCase() === 'others')) {
      mapped.push({ name: 'Others', icon: HelpCircle, color: 'text-purple-500 bg-purple-500/10' });
    }
    return mapped;
  }, [pgInfo]);

  useEffect(() => {
    try {
      let local = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
      if (!Array.isArray(local) || local.length === 0) {
        local = getInitialRequests();
        localStorage.setItem(LS_KEY, JSON.stringify(local));
      }
      setRequests(local);
    } catch { setRequests(getInitialRequests()); }
  }, []);

  const saveRequests = (updated) => {
    setRequests(updated);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
    try {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('dormn_request_updated'));
    } catch {}
    if (selectedTicket) {
      const fresh = updated.find(r => r.id === selectedTicket.id);
      if (fresh) setSelectedTicket(fresh);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!selectedAmenity || !title.trim()) return alert('Please select an amenity and enter an issue summary.');

    setSubmitting(true);
    const now = new Date().toISOString();
    const newTicket = {
      id: `req-${Date.now()}`,
      pg_id: pgInfo?.id || pgInfo?.pg_id || 1,
      pg_title: pgInfo?.title || pgInfo?.pg_name || 'My PG Stay',
      student_id: user?.id,
      student_name: user?.name || user?.full_name || 'Resident',
      student_phone: user?.phone || 'On file',
      category: selectedAmenity === 'Others' ? (otherText || 'Other Maintenance') : selectedAmenity,
      location,
      title: title.trim(),
      description: desc.trim(),
      priority,
      status: 'open',
      created_at: now,
      filed_at: now,
      closed_at: null,
      resolution_note: ''
    };

    try { await api.post('/student-portal/requests', newTicket).catch(() => null); } catch {}
    saveRequests([newTicket, ...requests]);

    setSelectedAmenity(null);
    setOtherText('');
    setTitle('');
    setDesc('');
    setPriority('Normal');
    setSubmitting(false);
    setToast(true);
    setTimeout(() => setToast(false), 3500);
    setActiveTab('active');
  };

  const handleClose = (id) => {
    const now = new Date().toISOString();
    saveRequests(requests.map(r => r.id === id ? { ...r, status: 'closed', closed_at: now } : r));
  };

  const active = useMemo(() => requests.filter(r => r.status !== 'closed'), [requests]);
  const previous = useMemo(() => requests.filter(r => r.status === 'closed'), [requests]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-2">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center text-xs sm:text-sm font-bold text-gray-500 hover:text-[#0D3A1D] dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Dashboard
        </button>
        <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">Resident Helpdesk</span>
      </div>

      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#0D3A1D] dark:text-white tracking-tight">Maintenance & Amenities Helpdesk</h2>
        <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Select an amenity below to file a complaint directly with your PG manager.</p>
      </div>

      {toast && (
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-300">Your request has been submitted to the PG Owner! Track its status below.</p>
        </div>
      )}

      {/* AMENITIES SELECTOR & INLINE FORM */}
      <div className="bg-white dark:bg-[#141414] border border-gray-200/80 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#93B733]" /> PG Amenities & Services
          </h3>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Click any amenity to report an issue:</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
          {availableAmenities.map((amenity) => {
            const isSelected = selectedAmenity === amenity.name;
            const Icon = amenity.icon;
            return (
              <button
                type="button"
                key={amenity.name}
                onClick={() => setSelectedAmenity(isSelected ? null : amenity.name)}
                className={`group flex items-center gap-2.5 p-3 rounded-2xl border text-xs font-bold transition-all text-left cursor-pointer ${
                  isSelected ? 'border-[#93B733] bg-[#93B733]/15 text-[#0D3A1D] dark:text-[#93B733] ring-2 ring-[#93B733]/30 shadow-xs' : 'border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] text-gray-700 dark:text-gray-300 hover:border-gray-300'
                }`}
              >
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-colors ${amenity.color}`}>
                  <Icon className="w-4 h-4" strokeWidth={2.2} />
                </div>
                <span className="truncate">{amenity.name}</span>
              </button>
            );
          })}
        </div>

        {selectedAmenity && (
          <form onSubmit={handleCreate} className="pt-6 border-t border-gray-100 dark:border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#93B733]/15 text-[#0D3A1D] dark:text-[#93B733]">Selected: {selectedAmenity}</span>
              <button type="button" onClick={() => setSelectedAmenity(null)} className="text-xs font-bold text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer">Cancel</button>
            </div>

            {selectedAmenity === 'Others' && (
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Specify Other Issue <span className="text-red-400">*</span></label>
                <input type="text" required value={otherText} onChange={e => setOtherText(e.target.value)} placeholder="e.g. Door latch broken, Window repair..." className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-[#93B733]/50 focus:border-[#93B733] outline-none" />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Location / Area</label>
                <div className="relative">
                  <select value={location} onChange={e => setLocation(e.target.value)} className="w-full appearance-none rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] pl-4 pr-10 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-[#93B733]/50 focus:border-[#93B733] outline-none cursor-pointer">
                    {LOCATIONS.map(l => <option key={l} value={l} className="dark:bg-[#181818]">{l}</option>)}
                  </select>
                  <ChevronRight className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Issue Summary <span className="text-red-400">*</span></label>
                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder={`e.g. ${selectedAmenity} issue`} className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-[#93B733]/50 focus:border-[#93B733] outline-none" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Detailed Description</label>
              <textarea rows={2} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Add any specific details..." className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-[#93B733]/50 focus:border-[#93B733] outline-none resize-none" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-gray-400">Priority:</span>
                {['Normal', 'Urgent'].map(p => (
                  <button type="button" key={p} onClick={() => setPriority(p)} className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${priority === p ? p === 'Urgent' ? 'border-rose-500 bg-rose-500/15 text-rose-600' : 'border-[#93B733] bg-[#93B733]/15 text-[#0D3A1D] dark:text-[#93B733]' : 'border-gray-200 dark:border-white/10 text-gray-500'}`}>{p}</button>
                ))}
              </div>
              <button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#93B733] hover:bg-[#82a32d] active:scale-95 text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50">
                <Send className="w-3.5 h-3.5" /> {submitting ? 'Submitting...' : 'Submit Complaint to Owner'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* REQUESTS LIST TABS */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-gray-100 dark:bg-white/[0.04] border border-gray-200/80 dark:border-white/10 w-fit">
          <button onClick={() => setActiveTab('active')} className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'active' ? 'bg-white dark:bg-[#181818] text-[#0D3A1D] dark:text-white shadow-xs' : 'text-gray-500'}`}>
            <Wrench className="w-3.5 h-3.5" /> <span>Active Requests</span>
            {active.length > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500 text-white">{active.length}</span>}
          </button>
          <button onClick={() => setActiveTab('previous')} className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'previous' ? 'bg-white dark:bg-[#181818] text-[#0D3A1D] dark:text-white shadow-xs' : 'text-gray-500'}`}>
            <Clock className="w-3.5 h-3.5" /> <span>Previous Requests</span>
            {previous.length > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#93B733]/20 text-[#0D3A1D] dark:text-[#93B733]">{previous.length}</span>}
          </button>
        </div>

        {/* List of Tickets (Clickable to open detailed vertical timeline) */}
        <div className="space-y-3">
          {(activeTab === 'active' ? active : previous).length > 0 ? (
            (activeTab === 'active' ? active : previous).map((req) => (
              <div
                key={req.id}
                onClick={() => setSelectedTicket(req)}
                className="group bg-white dark:bg-[#141414] border border-gray-200/80 dark:border-white/10 hover:border-[#93B733]/60 dark:hover:border-[#93B733]/40 rounded-3xl p-5 sm:p-6 shadow-xs transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#93B733]/15 text-[#0D3A1D] dark:text-[#93B733]">{req.category}</span>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">• {req.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      req.status === 'closed'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400'
                        : req.status === 'resolved'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400'
                        : req.status === 'in_progress'
                        ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400'
                        : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400'
                    }`}>
                      {req.status === 'closed' ? <CheckCircle2 className="w-3 h-3" /> : req.status === 'resolved' ? <CheckCircle2 className="w-3 h-3" /> : req.status === 'in_progress' ? <Wrench className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {req.status === 'closed' ? 'Completed & Closed' : req.status === 'resolved' ? 'Resolved by Owner' : req.status === 'in_progress' ? 'In Progress' : 'Under Review'}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${req.priority === 'Urgent' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20' : 'bg-gray-100 text-gray-600 dark:bg-white/10'}`}>{req.priority || 'Normal'}</span>
                  </div>
                </div>

                <div className="py-2.5">
                  <h4 className="text-base sm:text-lg font-black text-gray-900 dark:text-white group-hover:text-[#93B733] transition-colors">{req.title}</h4>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{req.description || 'No description provided.'}</p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 text-xs text-gray-400 border-t border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-3 text-[11px]">
                    <span>Opened: <strong className="text-gray-700 dark:text-gray-300">{formatDT(req.created_at || req.filed_at)}</strong></span>
                    {req.closed_at && <span>• Closed: <strong className="text-emerald-600 dark:text-emerald-400">{formatDT(req.closed_at)}</strong></span>}
                  </div>
                  <span className="text-xs font-bold text-[#0D3A1D] dark:text-[#93B733] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    View Progress Timeline <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white dark:bg-[#141414] border border-gray-200/80 dark:border-white/10 rounded-3xl p-10 text-center">
              <CheckCircle2 className="w-10 h-10 text-[#93B733] mx-auto mb-2" />
              <h4 className="text-base font-black text-gray-900 dark:text-white">{activeTab === 'active' ? 'No Active Requests' : 'No Previous Requests'}</h4>
              <p className="text-xs text-gray-400 mt-1">{activeTab === 'active' ? 'Click any amenity above to file a complaint if you need assistance.' : 'Completed and closed maintenance requests will appear here.'}</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          TICKET DETAILS MODAL WITH VERTICAL STEPPER
          ═══════════════════════════════════════════ */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 max-w-xl w-full my-8 shadow-2xl relative space-y-6">
            {/* Close Modal Button */}
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Ticket Header & Status */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-[#93B733]/15 text-[#0D3A1D] dark:text-[#93B733]">
                  {selectedTicket.category}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                  {selectedTicket.location}
                </span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${selectedTicket.priority === 'Urgent' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20' : 'bg-gray-100 text-gray-600 dark:bg-white/10'}`}>
                  {selectedTicket.priority || 'Normal'}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {selectedTicket.title}
              </h3>
            </div>

            {/* Resident's Written Description Section */}
            <div className="space-y-1.5 p-4 rounded-2xl bg-gray-50/90 dark:bg-white/[0.04] border border-gray-200/80 dark:border-white/10">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#93B733] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> Description Written by Resident
              </span>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
                {selectedTicket.description ? selectedTicket.description : 'No additional description provided.'}
              </p>
            </div>

            {/* Property & Stay Info */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 text-xs">
              <div>
                <span className="text-gray-400 font-medium block text-[10px] uppercase">Property</span>
                <strong className="text-gray-800 dark:text-gray-200 truncate block">{selectedTicket.pg_title || pgInfo?.title || 'PG Accommodation'}</strong>
              </div>
              <div>
                <span className="text-gray-400 font-medium block text-[10px] uppercase">Resident</span>
                <strong className="text-gray-800 dark:text-gray-200 truncate block">{selectedTicket.student_name || user?.name || 'Resident'}</strong>
              </div>
            </div>

            {/* ═══════════════════════════════════════════
                VERTICAL STEPPER: "IS IT DONE OR NOT"
                ═══════════════════════════════════════════ */}
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">
                Resolution Timeline & Progress
              </h4>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 dark:before:bg-white/10">
                {/* Step 1: Submitted */}
                <div className="relative">
                  <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-4 ring-white dark:ring-[#141414]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">1. Request Submitted & Registered</span>
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">Done</span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      Complaint registered and sent to PG Manager / Owner.
                    </p>
                    <span className="text-[10px] text-gray-400 block mt-1">
                      {formatDT(selectedTicket.created_at || selectedTicket.filed_at)}
                    </span>
                  </div>
                </div>

                {/* Step 2: In Progress / Assigned */}
                <div className="relative">
                  <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-[#141414] ${
                    selectedTicket.status === 'in_progress' || selectedTicket.status === 'resolved' || selectedTicket.status === 'closed'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-white/10 text-gray-400'
                  }`}>
                    {selectedTicket.status === 'in_progress' || selectedTicket.status === 'resolved' || selectedTicket.status === 'closed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">2. Acknowledged & In Progress</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        selectedTicket.status === 'in_progress'
                          ? 'text-blue-600 bg-blue-50 dark:bg-blue-500/10'
                          : selectedTicket.status === 'resolved' || selectedTicket.status === 'closed'
                          ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10'
                          : 'text-gray-400 bg-gray-100 dark:bg-white/5'
                      }`}>
                        {selectedTicket.status === 'in_progress' ? 'In Progress' : selectedTicket.status === 'resolved' || selectedTicket.status === 'closed' ? 'Done' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      {selectedTicket.status === 'in_progress' || selectedTicket.status === 'resolved' || selectedTicket.status === 'closed'
                        ? 'Maintenance technician assigned and inspecting the issue.'
                        : 'Awaiting inspection by PG maintenance staff.'}
                    </p>
                  </div>
                </div>

                {/* Step 3: Resolved by Owner */}
                <div className="relative">
                  <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-[#141414] ${
                    selectedTicket.status === 'resolved' || selectedTicket.status === 'closed'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-200 dark:bg-white/10 text-gray-400'
                  }`}>
                    {selectedTicket.status === 'resolved' || selectedTicket.status === 'closed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">3. Issue Resolved by Owner</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        selectedTicket.status === 'resolved' || selectedTicket.status === 'closed'
                          ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10'
                          : 'text-gray-400 bg-gray-100 dark:bg-white/5'
                      }`}>
                        {selectedTicket.status === 'resolved' || selectedTicket.status === 'closed' ? 'Done' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      {selectedTicket.resolution_note || (selectedTicket.status === 'resolved' || selectedTicket.status === 'closed' ? 'Repair work completed and verified on-site.' : 'Owner will resolve and verify on-site.')}
                    </p>
                  </div>
                </div>

                {/* Step 4: Closed */}
                <div className="relative">
                  <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-[#141414] ${
                    selectedTicket.status === 'closed'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-200 dark:bg-white/10 text-gray-400'
                  }`}>
                    {selectedTicket.status === 'closed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">4. Resident Confirmation & Closed</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        selectedTicket.status === 'closed'
                          ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10'
                          : 'text-gray-400 bg-gray-100 dark:bg-white/5'
                      }`}>
                        {selectedTicket.status === 'closed' ? 'Done' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      {selectedTicket.status === 'closed'
                        ? 'Resident verified resolution and archived the request.'
                        : 'Resident can confirm and close once satisfied.'}
                    </p>
                    {selectedTicket.closed_at && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">
                        Closed At: {formatDT(selectedTicket.closed_at)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5">
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"
              >
                Back to List
              </button>

              {selectedTicket.status !== 'closed' && (
                <button
                  onClick={() => {
                    handleClose(selectedTicket.id);
                  }}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0D3A1D] hover:bg-[#16502a] dark:bg-[#93B733] dark:hover:bg-[#82a32d] text-white dark:text-[#0D3A1D] text-xs font-black shadow-md transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Confirm & Close Ticket
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
