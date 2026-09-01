import { useState, useEffect, useContext, useCallback, useMemo, memo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  IndianRupee, Wrench, PartyPopper, Bell, ClipboardList, User,
  Sparkles, Dumbbell, CalendarHeart, ArrowLeft, Compass, CheckCircle2, Clock, ChevronRight
} from 'lucide-react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { loadRazorpayScript } from '../utils/razorpay';

// Sub-views
import PayRent from './mypg/PayRent';
import RegistrationForm from './mypg/RegistrationForm';
import MyAccount from './mypg/MyAccount';
import MaintenanceRequests from './mypg/MaintenanceRequests';
import ResidentNotices from './mypg/ResidentNotices';
import ResidentNotifications from './mypg/ResidentNotifications';
import DrDormnChat from '../components/common/DrDormnChat';

const HOME_ACTIONS = [
  { id: 'rent', label: 'Pay Rent', sub: 'Dues & Invoices', icon: IndianRupee, color: '#10b981', bg: 'rgba(16,185,129,0.15)', shadow: '0 8px 25px rgba(16,185,129,0.25)' },
  { id: 'requests', label: 'Requests', sub: 'Helpdesk & Complaints', icon: Wrench, color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', shadow: '0 8px 25px rgba(59,130,246,0.25)' },
  { id: 'notifications', label: 'Notifications', sub: 'All Owner Updates', icon: Bell, color: '#6366f1', bg: 'rgba(99,102,241,0.15)', shadow: '0 8px 25px rgba(99,102,241,0.25)' },
  { id: 'events', label: 'Explore Events', sub: 'Meetups & Activities', icon: PartyPopper, color: '#a855f7', bg: 'rgba(168,85,247,0.15)', shadow: '0 8px 25px rgba(168,85,247,0.25)' },
  { id: 'notices', label: 'View Notices', sub: 'Owner Announcements', icon: Sparkles, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', shadow: '0 8px 25px rgba(245,158,11,0.25)' },
  { id: 'registration', label: 'Registration', sub: 'KYC & Verification', icon: ClipboardList, color: '#ec4899', bg: 'rgba(236,72,153,0.15)', shadow: '0 8px 25px rgba(236,72,153,0.25)' },
  { id: 'account', label: 'My Account', sub: 'Profile & Policies', icon: User, color: '#06b6d4', bg: 'rgba(6,182,212,0.15)', shadow: '0 8px 25px rgba(6,182,212,0.25)' },
];

export default function MyPG({ defaultTab }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const activeTab = searchParams.get("tab") || defaultTab || "my-pg";
  const [activeAction, setActiveAction] = useState(null);
  const [hoveredAction, setHoveredAction] = useState(null);
  const [hasEnrolledPG, setHasEnrolledPG] = useState(false);
  const [pgInfo, setPgInfo] = useState(null);
  const [approvedBookings, setApprovedBookings] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);

  const [activeReqCount, setActiveReqCount] = useState(0);
  const [unreadNoticesCount, setUnreadNoticesCount] = useState(0);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  useEffect(() => {
    const updateCounts = () => {
      try {
        const reqs = JSON.parse(localStorage.getItem('dormn_resident_requests') || '[]');
        setActiveReqCount(Array.isArray(reqs) ? reqs.filter(r => r.status !== 'closed').length : 0);
      } catch {}
      try {
        const notices = JSON.parse(localStorage.getItem('dormn_resident_notices') || '[]');
        setUnreadNoticesCount(Array.isArray(notices) ? notices.filter(n => !n.read).length : 0);
      } catch {}
      try {
        const notifs = JSON.parse(localStorage.getItem('dormn_resident_notifications') || '[]');
        setUnreadNotifCount(Array.isArray(notifs) ? notifs.filter(n => !n.read).length : 0);
      } catch {}
    };
    updateCounts();
    window.addEventListener('storage', updateCounts);
    window.addEventListener('dormn_request_updated', updateCounts);
    return () => {
      window.removeEventListener('storage', updateCounts);
      window.removeEventListener('dormn_request_updated', updateCounts);
    };
  }, []);

  useEffect(() => {
    if (activeTab !== "my-pg") setActiveAction(null);
  }, [activeTab]);

  useEffect(() => {
    const fetchStay = async () => {
      try {
        const bookRes = await api.get('/bookings/my-bookings').catch(() => null);
        const list = Array.isArray(bookRes?.data?.bookings || bookRes?.data) ? (bookRes?.data?.bookings || bookRes?.data) : [];
        const paidStay = list.find(b => b.payment_status === 'paid');
        
        const rawApproved = list.filter(b => b.status === 'approved' && b.payment_status !== 'paid');
        const appGrouped = {};
        rawApproved.forEach(b => {
          const pgKey = (b.title || b.pg_title || b.pg_name || String(b.pg_id || '')).toLowerCase().trim();
          const bTime = new Date(b.created_at || 0).getTime() || Number(b.id) || 0;
          const gTime = appGrouped[pgKey] ? (new Date(appGrouped[pgKey].created_at || 0).getTime() || Number(appGrouped[pgKey].id) || 0) : -1;
          if (!appGrouped[pgKey] || bTime > gTime) {
            appGrouped[pgKey] = b;
          }
        });
        const approvedUnpaid = Object.values(appGrouped);

        const rawPending = list.filter(b => b.status === 'pending');
        const pendGrouped = {};
        rawPending.forEach(b => {
          const pgKey = (b.title || b.pg_title || b.pg_name || String(b.pg_id || '')).toLowerCase().trim();
          const bTime = new Date(b.created_at || 0).getTime() || Number(b.id) || 0;
          const gTime = pendGrouped[pgKey] ? (new Date(pendGrouped[pgKey].created_at || 0).getTime() || Number(pendGrouped[pgKey].id) || 0) : -1;
          if (!pendGrouped[pgKey] || bTime > gTime) {
            pendGrouped[pgKey] = b;
          }
        });
        const pending = Object.values(pendGrouped);

        if (paidStay) {
          setPgInfo(paidStay);
          setHasEnrolledPG(true);
          setApprovedBookings([]);
          setPendingBookings([]);
        } else if (approvedUnpaid.length > 0) {
          setApprovedBookings(approvedUnpaid);
          setHasEnrolledPG(false);
          setPendingBookings([]);
          setPgInfo(null);
        } else if (pending.length > 0) {
          setPendingBookings(pending);
          setApprovedBookings([]);
          setHasEnrolledPG(false);
          setPgInfo(null);
        } else {
          const res = await api.get('/bookings/my-pgs').catch(() => null);
          if (res?.data?.success && res.data?.booking && res.data.booking.payment_status === 'paid') {
            setPgInfo(res.data.booking);
            setHasEnrolledPG(true);
          } else {
            setHasEnrolledPG(false);
            setPgInfo(null);
          }
        }
      } catch (err) {
        console.error("Fetch stay error:", err);
        setHasEnrolledPG(false);
      } finally {
        setLoading(false);
      }
    };
    fetchStay();
  }, []);

  const handlePayNow = async (booking) => {
    const amount = Number(booking.booked_price || booking.price || 0);
    if (!amount) return alert("Invalid price details.");

    const res = await loadRazorpayScript();
    if (!res) return alert("Payment SDK failed to load.");

    setIsPaying(true);
    try {
      const orderRes = await api.post("/payments/create-order", {
        pg_id: Number(booking.pg_id),
        owner_id: Number(booking.owner_id),
        amount_in_rupees: amount
      });

      const orderData = orderRes.data;
      if (!orderData.success) {
        setIsPaying(false);
        return alert(orderData.message || "Failed to initialize payment.");
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Dormn Platform",
        description: `Booking activation for ${booking.pg_name || booking.title || "Accommodation"}`,
        order_id: orderData.order_id,
        handler: async (response) => {
          try {
            const verifyRes = await api.post("/payments/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              booking_id: orderData.booking_id || booking.id
            });
            if (verifyRes.data.success) {
              setHasEnrolledPG(true);
              setPgInfo({ ...booking, payment_status: 'paid' });
              setApprovedBookings([]);
            }
          } catch (err) {
            alert("Payment completed, but verification failed.");
          } finally {
            setIsPaying(false);
          }
        },
        prefill: {
          name: user?.name || user?.full_name || "Student",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: { color: "#0D3A1D" }
      };

      new window.Razorpay(options).open();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to start payment.");
      setIsPaying(false);
    }
  };

  const handleBack = useCallback(() => setActiveAction(null), []);

  const renderActionView = () => {
    switch (activeAction) {
      case 'rent': return <PayRent onBack={handleBack} />;
      case 'requests': return <MaintenanceRequests pgInfo={pgInfo} onBack={handleBack} />;
      case 'notifications': return <ResidentNotifications onBack={handleBack} />;
      case 'events': return <ComingSoon title="Explore Events" subtitle="Discover community meetups, weekend trips, and game nights." onBack={handleBack} />;
      case 'notices': return <ResidentNotices onBack={handleBack} />;
      case 'registration': return <RegistrationForm onBack={handleBack} />;
      case 'account': return <MyAccount onBack={handleBack} />;
      default: return null;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "events": return <ComingSoonRedirect title="Club Nights & Events" subtitle="Discover nightlife, book club nights, and get your tickets." onBack={handleBack} redirectPath="/clubs" />;
      case "gym": return <EmptySection icon={Dumbbell} title="Gym & Fitness" subtitle="Your personalized fitness dashboard is coming soon." />;
      case "dr-dormn": return <DrDormnChat userName={user?.name} />;
      default: return renderMyPgContent();
    }
  };

  const renderMyPgContent = () => {
    if (activeAction) return renderActionView();

    if (hasEnrolledPG) {
      return (
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2 pt-2">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0D3A1D] dark:text-white tracking-tight">
              Welcome to <span className="text-[#93B733]">{pgInfo?.title || pgInfo?.pg_name || 'your PG'}</span>
            </h2>
            <div className="text-lg sm:text-2xl font-bold text-gray-700 dark:text-gray-200 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-[#93B733]" />
              <span>{user?.name || user?.full_name || 'Resident'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5 max-w-4xl mx-auto pt-4">
            {HOME_ACTIONS.map((action) => {
              const Icon = action.icon;
              const isHovered = hoveredAction === action.id;
              const badge = action.id === 'requests' ? activeReqCount : action.id === 'notifications' ? unreadNotifCount : action.id === 'notices' ? unreadNoticesCount : 0;

              return (
                <button
                  key={action.id}
                  onClick={() => setActiveAction(action.id)}
                  onMouseEnter={() => setHoveredAction(action.id)}
                  onMouseLeave={() => setHoveredAction(null)}
                  style={{
                    borderColor: isHovered ? action.color : undefined,
                    backgroundColor: isHovered ? action.bg : undefined,
                    boxShadow: isHovered ? action.shadow : undefined,
                  }}
                  className={`group relative flex items-center justify-between p-4.5 rounded-3xl border-2 transition-all duration-300 active:scale-[0.98] cursor-pointer text-left select-none ${
                    isHovered ? 'scale-[1.02]' : 'border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      style={{
                        borderColor: isHovered ? action.color : undefined,
                        backgroundColor: isHovered ? action.bg : undefined,
                      }}
                      className="relative w-13 h-13 sm:w-14 sm:h-14 rounded-2xl border flex items-center justify-center shrink-0 border-gray-200/60 dark:border-white/10 bg-white dark:bg-[#141414] shadow-xs transition-all duration-300"
                    >
                      <Icon className="w-6 h-6 sm:w-7 sm:h-7 transition-transform duration-300 group-hover:scale-110" style={{ color: action.color }} strokeWidth={2.2} />
                      {badge > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white shadow-md animate-pulse">
                          {badge}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h4
                        style={{ color: isHovered ? action.color : undefined }}
                        className={`text-base font-extrabold tracking-tight transition-colors duration-300 ${
                          isHovered ? '' : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {action.label}
                      </h4>
                      <p className="text-xs font-semibold text-gray-400 dark:text-gray-400 truncate mt-0.5">
                        {action.sub}
                      </p>
                    </div>
                  </div>

                  <ChevronRight
                    size={18}
                    className="text-gray-300 dark:text-gray-600 group-hover:translate-x-1 transition-transform duration-300 shrink-0 ml-2"
                    style={{ color: isHovered ? action.color : undefined }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">My Resident Dashboard</h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Manage your stay and keep your records updated.</p>
        </div>

        <div className="space-y-5">
          {approvedBookings.map((booking) => (
            <div key={booking.id} className="border-2 border-dashed border-emerald-400 dark:border-emerald-500/40 rounded-[2.5rem] p-8 sm:p-10 flex flex-col items-center justify-center text-center bg-emerald-50/40 dark:bg-emerald-500/[0.04] backdrop-blur-md">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-2">Booking Approved by Owner!</h2>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 max-w-md mb-2">
                Your request for <strong className="text-[#0D3A1D] dark:text-[#93B733]">{booking.title || booking.pg_name || "Accommodation"}</strong> has been accepted.
              </p>
              <div className="flex flex-wrap gap-3 justify-center mt-6">
                <button onClick={() => handlePayNow(booking)} disabled={isPaying} className="inline-flex items-center gap-2 rounded-xl bg-[#93B733] hover:bg-[#82a32d] px-7 py-3.5 text-sm font-bold text-white shadow-md transition-all active:scale-[0.98]">
                  <IndianRupee size={16} />
                  {isPaying ? "Processing..." : `Pay ₹${(Number(booking.booked_price || booking.price || 0)).toLocaleString()} & Unlock Portal`}
                </button>
                <button onClick={() => navigate('/my-bookings')} className="inline-flex items-center gap-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#111] px-6 py-3.5 text-sm font-bold text-gray-800 dark:text-gray-200 transition-all">
                  View Request Details
                </button>
              </div>
            </div>
          ))}

          {pendingBookings.map((booking) => (
            <div key={booking.id} className="border-2 border-dashed border-amber-300 dark:border-amber-500/30 rounded-[2.5rem] p-8 sm:p-10 flex flex-col items-center justify-center text-center bg-amber-50/40 dark:bg-amber-500/[0.03] backdrop-blur-md">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                <Clock className="w-8 h-8" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-2">Booking Request Under Verification</h2>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 max-w-md mb-6">
                Your request for <strong className="text-[#0D3A1D] dark:text-[#93B733]">{booking.title || booking.pg_name || "Accommodation"}</strong> is under review.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <button onClick={() => navigate('/my-bookings')} className="inline-flex items-center gap-2 rounded-xl bg-[#0D3A1D] hover:bg-[#16502a] px-6 py-3 text-sm font-bold text-white shadow-md transition-all">
                  Track My Requests
                </button>
                <button onClick={() => navigate('/pgs')} className="inline-flex items-center gap-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#111] px-6 py-3 text-sm font-bold text-gray-800 dark:text-gray-200">
                  Explore Other PGs
                </button>
              </div>
            </div>
          ))}

          {approvedBookings.length === 0 && pendingBookings.length === 0 && (
            <div className="border-2 border-dashed border-gray-300 dark:border-white/20 rounded-[2.5rem] p-12 sm:p-16 flex flex-col items-center justify-center text-center bg-white/40 dark:bg-white/[0.02] backdrop-blur-md">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-2">No Active Enrolled PG Found</h2>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 max-w-md mb-8">You are not currently enrolled in any verified PG stay.</p>
              <button onClick={() => navigate('/pgs')} className="inline-flex items-center gap-2 rounded-xl bg-[#93B733] hover:bg-[#82a32d] px-6 py-3 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all">
                Explore Available PGs
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#0d0d0d] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#93B733] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#0d0d0d] text-gray-900 dark:text-white">
      <Navbar />
      <main className={`mx-auto px-4 sm:px-6 md:px-8 py-6 pb-20 transition-all ${activeTab === "dr-dormn" ? "max-w-6xl xl:max-w-7xl" : "max-w-5xl"}`}>
        {renderTabContent()}
      </main>
    </div>
  );
}

const EmptySection = memo(({ icon: Icon, title, subtitle }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center max-w-lg mx-auto">
    <div className="w-20 h-20 rounded-3xl bg-[#93B733]/10 dark:bg-[#93B733]/5 flex items-center justify-center mb-6">
      <Icon className="w-10 h-10 text-[#93B733]" strokeWidth={1.8} />
    </div>
    <h3 className="text-2xl font-black text-[#0D3A1D] dark:text-white tracking-tight mb-2">{title}</h3>
    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm">{subtitle}</p>
    <div className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#93B733]/10 text-[#0D3A1D] dark:text-[#93B733] text-xs font-black uppercase tracking-widest">
      <Sparkles className="w-3.5 h-3.5" /> Coming Soon
    </div>
  </div>
));
EmptySection.displayName = 'EmptySection';

const ComingSoon = memo(({ title, subtitle, onBack }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
    <button onClick={onBack} className="self-start flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#0D3A1D] dark:text-gray-400 dark:hover:text-white transition-colors mb-8 cursor-pointer">
      <ArrowLeft className="w-4 h-4" /> Back
    </button>
    <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4 text-gray-400">
      <Compass className="w-8 h-8" />
    </div>
    <h3 className="text-xl font-black text-[#0D3A1D] dark:text-white tracking-tight mb-1">{title}</h3>
    <p className="text-xs font-medium text-gray-400 leading-relaxed">{subtitle}</p>
  </div>
));
ComingSoon.displayName = 'ComingSoon';

const ComingSoonRedirect = memo(({ title, subtitle, onBack, redirectPath }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
    <button onClick={onBack} className="self-start flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#0D3A1D] dark:text-gray-400 dark:hover:text-white transition-colors mb-8 cursor-pointer">
      <ArrowLeft className="w-4 h-4" /> Back
    </button>
    <div className="w-16 h-16 rounded-2xl bg-[#93B733]/10 dark:bg-[#93B733]/5 flex items-center justify-center mb-4 text-[#93B733]">
      <PartyPopper className="w-8 h-8" />
    </div>
    <h3 className="text-xl font-black text-[#0D3A1D] dark:text-white tracking-tight mb-1">{title}</h3>
    <p className="text-xs font-medium text-gray-400 leading-relaxed mb-5">{subtitle}</p>
    <button
      onClick={() => window.location.href = redirectPath}
      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#93B733] text-[#0D3A1D] text-sm font-black hover:bg-[#82a32d] transition-all shadow-md"
    >
      Explore Now →
    </button>
  </div>
));
ComingSoonRedirect.displayName = 'ComingSoonRedirect';
