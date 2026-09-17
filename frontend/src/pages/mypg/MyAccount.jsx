import { useState, useEffect, useContext, useCallback, memo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, User, Mail, Phone, Shield, FileText,
  HelpCircle, LogOut, ChevronRight, CheckCircle,
  Building2, MapPin, AlertTriangle, CheckCircle2,
  Clock, DoorOpen, X, Send, Sparkles, Info
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import EmailVerificationModal from '../../components/auth/EmailVerificationModal';
import { isEmailVerified } from '../../utils/verificationStorage';

const REASON_PRESETS = [
  'Relocating to another area or city',
  'College semester / Internship completed',
  'Found accommodation closer to university / workplace',
  'Financial / Budgetary reasons',
  'Personal or family reasons',
];

const POLICY_LINKS = [
  { title: 'Terms & Conditions', desc: 'Platform usage rules and resident agreement', icon: FileText, path: '/terms' },
  { title: 'Privacy Policy', desc: 'How your personal data and documents are protected', icon: Shield, path: '/privacy' },
  { title: 'Cancellation & Refund Policy', desc: 'Booking cancellation, notice period, and deposit refunds', icon: HelpCircle, path: '/terms#cancellation' },
];

export default function MyAccount({ onBack, pgInfo: initialPgInfo }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [pgInfo, setPgInfo] = useState(initialPgInfo || null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [submittingCancel, setSubmittingCancel] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const isVerified = isEmailVerified(user);

  const handleOpenVerify = useCallback(() => setIsVerifyModalOpen(true), []);
  const handleCloseVerify = useCallback(() => setIsVerifyModalOpen(false), []);

  useEffect(() => {
    if (initialPgInfo) {
      setPgInfo(initialPgInfo);
    } else {
      api.get('/bookings/my-pgs')
        .then(res => res?.data?.success && res.data?.booking && setPgInfo(res.data.booking))
        .catch(err => console.error('Fetch current stay error:', err));
    }
  }, [initialPgInfo]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
      navigate('/auth');
    }
  };

  const handleSelectTag = (tag) => {
    setSelectedTag(tag);
    setCancelReason(!cancelReason || REASON_PRESETS.includes(cancelReason) ? tag : `${tag}. ${cancelReason}`);
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) return alert('Please provide a reason for the cancellation request.');
    if (!acceptTerms) return alert('Please check the confirmation box to proceed.');

    setSubmittingCancel(true);
    try {
      const bookingId = pgInfo?.booking_id || pgInfo?.id;
      const res = await api.post('/bookings/request-stay-cancellation', { bookingId, reason: cancelReason.trim() });
      if (res?.data?.success) {
        setStatusMessage({
          type: 'success',
          text: 'Cancellation request submitted to the PG Owner. Your profile data and event tickets remain safely saved in your account.',
        });
        setPgInfo(prev => ({
          ...prev,
          cancellation_status: 'pending',
          cancellation_reason: cancelReason.trim(),
          cancellation_requested_at: new Date().toISOString(),
        }));
        setIsCancelModalOpen(false);
        setCancelReason('');
        setSelectedTag('');
        setAcceptTerms(false);
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to submit cancellation request. Please try again.');
    } finally {
      setSubmittingCancel(false);
    }
  };

  const cancellationStatus = pgInfo?.cancellation_status || 'none';

  return (
    <div className='max-w-4xl mx-auto'>
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200/80 dark:border-white/10">
        <button
          onClick={onBack}
          className='inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-800 text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 hover:text-[#0D3A1D] dark:hover:text-[#93B733] transition shadow-xs cursor-pointer active:scale-95'
        >
          <ArrowLeft size={16} /> <span>Back to My PG</span>
        </button>
        <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">Account & Policies</span>
      </div>

      {/* Header */}
      <div className='mb-5'>
        <h2 className='text-2xl sm:text-3xl font-black text-[#0D3A1D] dark:text-white tracking-tight'>
          My Account
        </h2>
        <p className='text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mt-1'>
          Manage your stay, account credentials, security, and view platform policies
        </p>
      </div>

      {statusMessage && (
        <div className={`mb-6 p-4 rounded-2xl border flex items-start gap-3 text-sm animate-in fade-in duration-300 ${
          statusMessage.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
            : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300'
        }`}>
          <CheckCircle2 className='w-5 h-5 shrink-0 mt-0.5' />
          <div className='flex-1 font-bold'>{statusMessage.text}</div>
          <button onClick={() => setStatusMessage(null)} className='text-gray-400 hover:text-gray-600 dark:hover:text-white'>
            <X size={16} />
          </button>
        </div>
      )}

      <div className='space-y-6'>
        {/* CURRENT STAY & CANCELLATION REQUEST CARD */}
        {pgInfo && (
          <div className='rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-white/[0.03] p-6 sm:p-8 shadow-sm'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-white/5'>
              <div className='flex items-center gap-4 min-w-0'>
                <div className='w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0D3A1D] to-[#164e29] text-[#93B733] flex items-center justify-center text-xl font-black shrink-0 shadow-md'>
                  <Building2 className='w-7 h-7 text-[#93B733]' />
                </div>
                <div className='min-w-0'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <h3 className='text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tight truncate'>
                      {pgInfo.title || pgInfo.pg_name || 'Enrolled PG Stay'}
                    </h3>
                    <span className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'>
                      <CheckCircle className='w-3 h-3' /> Active Stay
                    </span>
                  </div>
                  <p className='text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1 truncate'>
                    <MapPin size={12} className='text-[#93B733] shrink-0' />
                    <span className='truncate'>{pgInfo.address || pgInfo.area || 'Campus Sector'}</span>
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className='self-start sm:self-center'>
                {cancellationStatus === 'pending' ? (
                  <span className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-black uppercase tracking-wide animate-pulse'>
                    <Clock size={14} /> Cancellation Pending
                  </span>
                ) : cancellationStatus === 'approved' ? (
                  <span className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-500/15 border border-gray-500/30 text-gray-700 dark:text-gray-400 text-xs font-black uppercase tracking-wide'>
                    <CheckCircle2 size={14} /> Cancelled
                  </span>
                ) : cancellationStatus === 'rejected' ? (
                  <span className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs font-black uppercase tracking-wide'>
                    <AlertTriangle size={14} /> Request Rejected
                  </span>
                ) : (
                  <span className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold'>
                    <Shield size={14} /> Enrolled
                  </span>
                )}
              </div>
            </div>

            {/* Room & Rent Summary Specs */}
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6'>
              <div className='rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50/70 dark:bg-white/[0.02] p-4'>
                <span className='text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1'>Allocated Room</span>
                <p className='text-sm font-black text-gray-900 dark:text-white'>{pgInfo.selected_room_type || pgInfo.sharing_type || 'Standard Room'}</p>
              </div>
              <div className='rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50/70 dark:bg-white/[0.02] p-4'>
                <span className='text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1'>Monthly Rent</span>
                <p className='text-sm font-black text-[#0D3A1D] dark:text-[#93B733]'>₹{(Number(pgInfo.booked_price || pgInfo.price || 0)).toLocaleString()} / month</p>
              </div>
              <div className='rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50/70 dark:bg-white/[0.02] p-4'>
                <span className='text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1'>Dormn Data Retention</span>
                <p className='text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1'>
                  <Sparkles size={14} className='text-emerald-500' /> KYC & Events Saved
                </p>
              </div>
            </div>

            {/* Cancellation Status & Action Banner */}
            {cancellationStatus === 'pending' ? (
              <div className='p-4 sm:p-5 rounded-2xl bg-amber-500/[0.08] border border-amber-500/20 space-y-2'>
                <div className='flex items-center gap-2 text-amber-800 dark:text-amber-300 font-black text-sm'>
                  <Clock size={16} className='text-amber-500 animate-spin' style={{ animationDuration: '3s' }} />
                  <span>Cancellation Request is Under Review by PG Owner</span>
                </div>
                <p className='text-xs text-gray-600 dark:text-gray-300'>
                  Requested on <strong>{pgInfo.cancellation_requested_at ? new Date(pgInfo.cancellation_requested_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'recently'}</strong>.
                  Reason: <em className='text-gray-800 dark:text-gray-200 font-medium'>"{pgInfo.cancellation_reason || 'Moving out'}"</em>
                </p>
                <div className='pt-2 flex items-center gap-2 text-[11px] text-amber-700 dark:text-amber-400/90'>
                  <Info size={13} />
                  <span>Once approved, your spot is freed and you can book another PG immediately. Profile & tickets stay intact.</span>
                </div>
              </div>
            ) : cancellationStatus === 'rejected' ? (
              <div className='p-4 sm:p-5 rounded-2xl bg-rose-500/[0.08] border border-rose-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3'>
                <div className='space-y-1'>
                  <div className='flex items-center gap-2 text-rose-800 dark:text-rose-300 font-black text-sm'>
                    <AlertTriangle size={16} className='text-rose-500' />
                    <span>Your Previous Cancellation Request Was Not Approved</span>
                  </div>
                  <p className='text-xs text-gray-600 dark:text-gray-300'>Please contact your property caretaker or submit an updated request.</p>
                </div>
                <button onClick={() => setIsCancelModalOpen(true)} className='px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm cursor-pointer shrink-0'>
                  Resubmit Request
                </button>
              </div>
            ) : (
              <div className='p-4 sm:p-5 rounded-2xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
                <div className='space-y-1'>
                  <h4 className='text-sm font-black text-gray-900 dark:text-white'>Need to Move Out or Change Accommodation?</h4>
                  <p className='text-xs text-gray-500 dark:text-gray-400 max-w-lg'>
                    Submit a cancellation request to your PG owner. When accepted, your booking is released so you can book another PG without having to refill KYC forms.
                  </p>
                </div>
                <button onClick={() => setIsCancelModalOpen(true)} className='inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 text-xs font-black transition active:scale-95 cursor-pointer shrink-0'>
                  <DoorOpen size={15} />
                  <span>Request Cancellation</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Profile Details Card */}
        <div className='rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-white/[0.03] p-6 sm:p-8'>
          <div className='flex items-center gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-white/5'>
            <div className='w-16 h-16 rounded-2xl bg-[#93B733]/15 text-[#93B733] flex items-center justify-center text-2xl font-black shrink-0'>
              {user?.name ? user.name.charAt(0).toUpperCase() : <User className='w-8 h-8' />}
            </div>
            <div className='min-w-0'>
              <div className='flex items-center gap-2'>
                <h3 className='text-xl font-black text-gray-900 dark:text-white tracking-tight truncate'>
                  {user?.name || user?.full_name || 'Resident'}
                </h3>
                <span className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#93B733]/15 text-[#0D3A1D] dark:text-[#93B733]'>
                  <CheckCircle className='w-3 h-3' /> Verified
                </span>
              </div>
              <p className='text-xs font-semibold text-gray-400 mt-0.5 capitalize'>Role: {user?.role || 'Resident Student'}</p>
            </div>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
            <div className='rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50/70 dark:bg-white/[0.02] p-4'>
              <span className='text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 mb-1.5'><User className='w-3.5 h-3.5 text-[#93B733]' /> Full Name</span>
              <p className='text-sm font-bold text-gray-900 dark:text-white truncate'>{user?.name || user?.full_name || 'Not provided'}</p>
            </div>
            <div className='rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50/70 dark:bg-white/[0.02] p-4'>
              <div className='flex items-center justify-between gap-1 mb-1.5'>
                <span className='text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5'><Mail className='w-3.5 h-3.5 text-[#93B733]' /> Email Address</span>
                {isVerified ? (
                  <span className='inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'>
                    <CheckCircle2 size={10} /> Verified
                  </span>
                ) : (
                  <button
                    type='button'
                    onClick={handleOpenVerify}
                    className='inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition cursor-pointer'
                  >
                    <Clock size={10} /> Verify
                  </button>
                )}
              </div>
              <p className='text-sm font-bold text-gray-900 dark:text-white truncate'>{user?.email || 'Not provided'}</p>
            </div>
            <div className='rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50/70 dark:bg-white/[0.02] p-4'>
              <span className='text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 mb-1.5'><Phone className='w-3.5 h-3.5 text-[#93B733]' /> Mobile Number</span>
              <p className='text-sm font-bold text-gray-900 dark:text-white truncate'>{user?.phone || user?.mobile || 'Not provided'}</p>
            </div>
          </div>
        </div>

        {/* Legal & Policies Section */}
        <div className='rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-white/[0.03] p-6 sm:p-8'>
          <h3 className='text-lg font-black text-[#0D3A1D] dark:text-white tracking-tight mb-4'>Legal & Platform Policies</h3>
          <div className='divide-y divide-gray-100 dark:divide-white/5'>
            {POLICY_LINKS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Link key={idx} to={item.path} className='group flex items-center justify-between py-4 hover:px-2 rounded-xl transition-all'>
                  <div className='flex items-center gap-3.5 min-w-0'>
                    <div className='w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/[0.05] group-hover:bg-[#93B733]/15 text-gray-600 dark:text-gray-400 group-hover:text-[#93B733] flex items-center justify-center shrink-0 transition-colors'>
                      <Icon className='w-5 h-5' />
                    </div>
                    <div>
                      <h4 className='text-sm font-bold text-gray-900 dark:text-white group-hover:text-[#93B733] transition-colors'>{item.title}</h4>
                      <p className='text-xs text-gray-500 dark:text-gray-400'>{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className='w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform shrink-0' />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Logout Action Card */}
        <div className='rounded-3xl border border-red-500/20 bg-red-500/[0.03] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
          <div>
            <h4 className='text-base font-black text-red-600 dark:text-red-400'>Account Session</h4>
            <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>Securely sign out of your resident portal session across this device</p>
          </div>
          <button onClick={handleLogout} className='inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0'>
            <LogOut className='w-4 h-4' /> Log Out
          </button>
        </div>
      </div>

      {/* CANCELLATION REQUEST MODAL */}
      {isCancelModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200'>
          <div className='relative w-full max-w-xl rounded-3xl bg-white dark:bg-[#10141e] border border-gray-200 dark:border-white/10 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto'>
            <div className='flex items-start justify-between gap-3 border-b border-gray-100 dark:border-white/10 pb-4'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0'>
                  <DoorOpen size={22} />
                </div>
                <div>
                  <h3 className='text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tight'>Request Stay Cancellation</h3>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>{pgInfo?.title || pgInfo?.pg_name || 'Current PG'}</p>
                </div>
              </div>
              <button onClick={() => setIsCancelModalOpen(false)} className='w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center text-gray-500 transition cursor-pointer'>
                <X size={16} />
              </button>
            </div>

            <div className='p-4 rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/20 space-y-1.5'>
              <div className='flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs'>
                <Sparkles size={14} className='text-emerald-500' /> Zero Data Loss Guarantee
              </div>
              <p className='text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed'>
                When accepted, you will be unassigned from this PG so you can freely book other PGs. All your <strong>KYC forms, profile, and event passes</strong> are retained permanently!
              </p>
            </div>

            <form onSubmit={handleCancelSubmit} className='space-y-4'>
              <div>
                <label className='block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2'>Select Reason Preset</label>
                <div className='flex flex-wrap gap-2'>
                  {REASON_PRESETS.map((preset, idx) => (
                    <button key={idx} type='button' onClick={() => handleSelectTag(preset)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border cursor-pointer ${selectedTag === preset ? 'bg-[#0D3A1D] text-white border-[#0D3A1D] dark:bg-[#93B733] dark:text-black dark:border-[#93B733]' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-gray-400'}`}>{preset}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className='block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5'>Cancellation Reason / Comments <span className='text-rose-500'>*</span></label>
                <textarea rows={3} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder='Provide any additional details or preferred move-out date...' required className='w-full rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] p-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#93B733]' />
              </div>

              <label className='flex items-start gap-2.5 p-3 rounded-2xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/5 text-xs text-gray-600 dark:text-gray-300 cursor-pointer'>
                <input type='checkbox' checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className='mt-0.5 rounded text-[#0D3A1D] focus:ring-[#93B733] cursor-pointer' />
                <span>I understand that this request will be sent directly to the PG owner for review and approval according to the notice period policy.</span>
              </label>

              <div className='flex items-center justify-end gap-3 pt-2'>
                <button type='button' onClick={() => setIsCancelModalOpen(false)} className='px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition cursor-pointer'>Close</button>
                <button type='submit' disabled={submittingCancel || !cancelReason.trim() || !acceptTerms} className='inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-black shadow-md transition active:scale-95 cursor-pointer'>
                  <Send size={14} />
                  <span>{submittingCancel ? 'Submitting...' : 'Send Cancellation Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Verification Modal */}
      <EmailVerificationModal
        isOpen={isVerifyModalOpen}
        onClose={handleCloseVerify}
        userEmail={user?.email}
        title="Verify your email"
        description="Please enter the 6-digit code sent to your email to verify your resident account."
        onSuccess={handleCloseVerify}
      />
    </div>
  );
}