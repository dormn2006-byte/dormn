import { useState, useEffect, useContext, useCallback, useMemo, memo, lazy, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  IndianRupee, Wrench, Bell, ClipboardList, User,
  Sparkles, ArrowLeft, Compass, CheckCircle2, Clock, Lock, ShieldCheck,
  MapPin, Wifi, Moon, Utensils, Building2, ChevronDown, MessageSquare,
  AlertTriangle, FileText, Users, Phone, MessageCircle, X, HardHat,
  ChevronRight, Calendar, ExternalLink
} from 'lucide-react';
import api, { IMAGE_BASE_URL } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import MacOSDock from '../components/ui/mac-os-dock';
import { getProfileAvatar } from '../constants/studentDockConfig';

const ROLE_STYLES = {
  "Cook / Chef": { icon: "👨‍🍳", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  "Electrician": { icon: "⚡", color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20" },
  "Security Guard": { icon: "🛡️", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  "Housekeeper / Cleaner": { icon: "🧹", color: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20" },
  "Plumber": { icon: "🔧", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  "Warden / Manager": { icon: "👔", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
  "Carpenter": { icon: "🪚", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20" },
  "Laundry / Dhobi": { icon: "🧺", color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20" },
  "Maintenance Tech": { icon: "🛠️", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" },
  "Other": { icon: "👤", color: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20" },
};

const getStaffRoleStyle = (role) => {
  if (!role) return { icon: "👤", color: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20" };
  if (ROLE_STYLES[role]) return ROLE_STYLES[role];
  const rLower = role.toLowerCase();
  for (const [key, val] of Object.entries(ROLE_STYLES)) {
    if (key.toLowerCase() === rLower || key.toLowerCase().includes(rLower) || rLower.includes(key.toLowerCase())) {
      return val;
    }
  }
  return { icon: "👤", color: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20" };
};

const formatStaffAvatar = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  if (url.startsWith("/uploads/")) return `${IMAGE_BASE_URL}${url}`;
  if (url.startsWith("/api/uploads/")) return `${IMAGE_BASE_URL}${url.replace('/api', '')}`;
  return `${IMAGE_BASE_URL}/uploads/${url}`;
};

const formatUserAvatar = (user) => {
  if (!user) return getProfileAvatar();
  const raw = user.profile_image || user.avatar;
  if (!raw) return getProfileAvatar(user.id);
  if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:")) return raw;
  if (raw.startsWith("/uploads/")) return `${IMAGE_BASE_URL}${raw}`;
  if (raw.startsWith("/api/uploads/")) return `${IMAGE_BASE_URL}${raw.replace('/api', '')}`;
  if (raw.startsWith("/icons/")) return raw;
  return `${IMAGE_BASE_URL}/uploads/${raw}`;
};

const DEFAULT_PG_IMAGES = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=1400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1400&auto=format&fit=crop"
];

const formatPgImage = (item, fallbackIdx = 0) => {
  if (!item) return DEFAULT_PG_IMAGES[fallbackIdx % DEFAULT_PG_IMAGES.length];
  const raw = item.profile_image || item.pg_image || item.image || (Array.isArray(item.images) && item.images[0]);
  if (!raw) return DEFAULT_PG_IMAGES[((Number(item.pg_id || item.id || 0)) + fallbackIdx) % DEFAULT_PG_IMAGES.length];
  if (raw.startsWith('http') || raw.startsWith('data:')) return raw;
  if (raw.startsWith('/uploads/')) return `${IMAGE_BASE_URL}${raw}`;
  if (raw.startsWith('/api/uploads/')) return `${IMAGE_BASE_URL}${raw.replace('/api', '')}`;
  return `${IMAGE_BASE_URL}/uploads/${raw}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
};

// Lazy sub-views
const PayRent = lazy(() => import('./mypg/PayRent'));
const PaymentKycForm = lazy(() => import('./mypg/PaymentKycForm'));
const RegistrationForm = lazy(() => import('./mypg/RegistrationForm'));
const MyAccount = lazy(() => import('./mypg/MyAccount'));
const MaintenanceRequests = lazy(() => import('./mypg/MaintenanceRequests'));
const ResidentNotices = lazy(() => import('./mypg/ResidentNotices'));
const ResidentNotifications = lazy(() => import('./mypg/ResidentNotifications'));
const PGChat = lazy(() => import('./mypg/PGChat'));

const groupLatestBookings = (list, filterFn) => {
  const map = new Map();
  list.filter(filterFn).forEach(b => {
    const key = (b.title || b.pg_title || b.pg_name || String(b.pg_id || '')).toLowerCase().trim();
    const curTime = new Date(b.created_at || 0).getTime() || Number(b.id) || 0;
    const prev = map.get(key);
    if (!prev || curTime > (new Date(prev.created_at || 0).getTime() || Number(prev.id) || 0)) {
      map.set(key, b);
    }
  });
  return Array.from(map.values());
};

export default function MyPG() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const actionParam = searchParams.get('action');
  const [activeAction, setActiveAction] = useState(actionParam || null);
  const [hasEnrolledPG, setHasEnrolledPG] = useState(false);
  const [pgInfo, setPgInfo] = useState(null);
  const [pgCardsList, setPgCardsList] = useState([]);
  const [selectedPg, setSelectedPg] = useState(null);
  const [approvedBookings, setApprovedBookings] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  // Tenant details are confirmed before every payment; this resets on each visit.
  const [paymentKycDone, setPaymentKycDone] = useState(false);
  const [kycInfo, setKycInfo] = useState(null);
  const [activeBookingId, setActiveBookingId] = useState(null);

  const [activeReqCount, setActiveReqCount] = useState(0);
  const [unreadNoticesCount, setUnreadNoticesCount] = useState(0);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Mobile accordion state for the 3 info cards
  const [openCards, setOpenCards] = useState({
    specs: false,
    rent: false,
    caretaker: false,
    staff: false
  });
  const [pgStaff, setPgStaff] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);


  const toggleCard = useCallback((key) => {
    setOpenCards(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const [isChatInputFocused, setIsChatInputFocused] = useState(false);

  useEffect(() => {
    const handleChatKeyboard = (e) => {
      setIsChatInputFocused(!!e.detail?.focused);
    };
    window.addEventListener('dormn_chat_keyboard', handleChatKeyboard);
    return () => window.removeEventListener('dormn_chat_keyboard', handleChatKeyboard);
  }, []);

  useEffect(() => {
    if (activeAction !== 'chat') {
      setIsChatInputFocused(false);
    }
  }, [activeAction]);

  useEffect(() => {
    if (actionParam) setActiveAction(actionParam);
  }, [actionParam]);

  useEffect(() => {
    try {
      localStorage.removeItem('dormn_resident_requests');
      localStorage.removeItem('dormn_resident_notices');
      localStorage.removeItem('dormn_resident_notifications');
    } catch {}

    const updateCounts = async () => {
      if (!user) return;
      const userKey = user?.id ? `u_${user.id}` : user?.email ? `e_${user.email.replace(/[^a-zA-Z0-9]/g, '_')}` : null;

      try {
        const res = await api.get('/maintenance/student').catch(() => null);
        if (res?.data?.success && Array.isArray(res.data.requests)) {
          setActiveReqCount(res.data.requests.filter(r => r.status !== 'closed' && r.status !== 'resolved').length);
        } else if (userKey) {
          const reqs = JSON.parse(localStorage.getItem(`dormn_resident_requests_${userKey}`) || '[]');
          setActiveReqCount(Array.isArray(reqs) ? reqs.filter(r => r.status !== 'closed' && r.status !== 'resolved').length : 0);
        } else {
          setActiveReqCount(0);
        }
      } catch {
        setActiveReqCount(0);
      }

      try {
        const notices = userKey ? JSON.parse(localStorage.getItem(`dormn_resident_notices_${userKey}`) || '[]') : [];
        setUnreadNoticesCount(Array.isArray(notices) ? notices.filter(n => !n.read).length : 0);
      } catch {
        setUnreadNoticesCount(0);
      }

      try {
        const notifs = userKey ? JSON.parse(localStorage.getItem(`dormn_resident_notifications_${userKey}`) || '[]') : [];
        setUnreadNotifCount(Array.isArray(notifs) ? notifs.filter(n => !n.read).length : 0);
      } catch {
        setUnreadNotifCount(0);
      }
    };

    updateCounts();
    window.addEventListener('storage', updateCounts);
    window.addEventListener('dormn_request_updated', updateCounts);
    return () => {
      window.removeEventListener('storage', updateCounts);
      window.removeEventListener('dormn_request_updated', updateCounts);
    };
  }, [user]);

  const handleSelectPg = useCallback((card) => {
    setSelectedPg(card);
    setPgInfo(card);
    setActiveBookingId(card.booking_id || card.id || null);

    if (card.cardType === 'enrolled') {
      setHasEnrolledPG(true);
      setApprovedBookings([]);
      setPendingBookings([]);
    } else if (card.cardType === 'approved') {
      setHasEnrolledPG(false);
      setApprovedBookings([card]);
      setPendingBookings([]);
    } else {
      setHasEnrolledPG(false);
      setApprovedBookings([]);
      setPendingBookings([card]);
    }

    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (card.pg_id || card.id) next.set('pgId', card.pg_id || card.id);
      return next;
    });

    try {
      window.scrollTo({ top: 0, behavior: 'instant' });
    } catch {}
  }, [setSearchParams]);

  const handleBackToCards = useCallback(() => {
    setSelectedPg(null);
    setPgInfo(null);
    setHasEnrolledPG(false);
    setApprovedBookings([]);
    setPendingBookings([]);
    setActiveAction(null);
    setSearchParams({});

    try {
      window.scrollTo({ top: 0, behavior: 'instant' });
    } catch {}
  }, [setSearchParams]);

  useEffect(() => {
    const fetchStay = async () => {
      if (!user) {
        setPgCardsList([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [myPgRes, bookRes] = await Promise.all([
          api.get('/bookings/my-pgs').catch(() => null),
          api.get('/bookings/my-bookings').catch(() => null),
        ]);

        const paidBookings = Array.isArray(myPgRes?.data?.bookings)
          ? myPgRes.data.bookings
          : myPgRes?.data?.booking
          ? [myPgRes.data.booking]
          : [];

        const allBookings = Array.isArray(bookRes?.data?.bookings || bookRes?.data)
          ? (bookRes?.data?.bookings || bookRes?.data)
          : [];

        const cardsMap = new Map();

        // 1. Paid & Active bookings
        paidBookings.forEach((b, idx) => {
          if (b && (b.payment_status === 'paid' || b.status === 'paid') && b.status !== 'cancelled') {
            const key = String(b.pg_id || b.id || b.title || idx);
            cardsMap.set(key, {
              ...b,
              cardType: 'enrolled',
              statusBadge: 'Active Resident',
              statusBadgeColor: 'emerald',
            });
          }
        });

        allBookings.forEach((b, idx) => {
          if ((b.payment_status === 'paid' || b.status === 'paid') && b.status !== 'cancelled') {
            const key = String(b.pg_id || b.id || b.title || idx);
            if (!cardsMap.has(key)) {
              cardsMap.set(key, {
                ...b,
                cardType: 'enrolled',
                statusBadge: 'Active Resident',
                statusBadgeColor: 'emerald',
              });
            }
          }
        });

        // 2. Approved bookings (awaiting payment)
        const approved = groupLatestBookings(allBookings, b => b.status === 'approved' && b.payment_status !== 'paid');
        approved.forEach((b, idx) => {
          const key = String(b.pg_id || b.id || b.title || idx);
          if (!cardsMap.has(key)) {
            cardsMap.set(key, {
              ...b,
              cardType: 'approved',
              statusBadge: 'Approved - Pay Rent',
              statusBadgeColor: 'blue',
            });
          }
        });

        // 3. Pending bookings
        const pending = groupLatestBookings(allBookings, b => b.status === 'pending');
        pending.forEach((b, idx) => {
          const key = String(b.pg_id || b.id || b.title || idx);
          if (!cardsMap.has(key)) {
            cardsMap.set(key, {
              ...b,
              cardType: 'pending',
              statusBadge: 'Application Under Review',
              statusBadgeColor: 'amber',
            });
          }
        });

        const cards = Array.from(cardsMap.values());
        setPgCardsList(cards);

        // Check if pgId param is in URL
        const pgIdParam = searchParams.get('pgId');
        if (pgIdParam) {
          const matched = cards.find(c => String(c.pg_id || c.id) === String(pgIdParam));
          if (matched) {
            handleSelectPg(matched);
            return;
          }
        }

        // If an action (e.g. chat, rent) is passed without pgId, auto-select first enrolled PG
        const actionParamVal = searchParams.get('action');
        if (actionParamVal && cards.length > 0) {
          const firstEnrolled = cards.find(c => c.cardType === 'enrolled') || cards[0];
          handleSelectPg(firstEnrolled);
        }
      } catch (err) {
        console.error("Fetch stay error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStay();
  }, [user, handleSelectPg]);


  useEffect(() => {
    const fetchStaff = async () => {
      const targetPgId = pgInfo?.pg_id || pgInfo?.id || pgInfo?._id;
      if (!targetPgId) {
        setPgStaff([]);
        return;
      }
      setStaffLoading(true);
      try {
        const res = await api.get(`/staff/pg/${targetPgId}`);
        const staffData = res.data?.staff || res.data?.data || [];
        if (res.data?.success && Array.isArray(staffData)) {
          setPgStaff(staffData);
        } else {
          setPgStaff([]);
        }
      } catch (err) {
        console.warn("Failed to load PG staff:", err);
        setPgStaff([]);
      } finally {
        setStaffLoading(false);
      }
    };

    if (hasEnrolledPG && pgInfo) {
      fetchStaff();
    }
  }, [hasEnrolledPG, pgInfo]);

  const handlePayNow = async (booking) => {
    const amount = Number(booking.booked_price || booking.price || 0);
    if (!amount) return alert("Invalid price details.");

    const { loadRazorpayScript } = await import('../utils/razorpay');
    const res = await loadRazorpayScript();
    if (!res) return alert("Payment SDK failed to load.");

    setIsPaying(true);
    try {
      const { data } = await api.post('/payments/create-order', {
        booking_id: Number(booking.id || booking.booking_id),
        pg_id: Number(booking.pg_id),
        owner_id: Number(booking.owner_id),
        amount_in_rupees: amount,
      });

      if (!data.success) {
        setIsPaying(false);
        return alert(data.message || 'Failed to initialize payment.');
      }

      const options = {
        key: data.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency || "INR",
        name: "Dormn Housing",
        description: `Rent Payment for ${booking.title || 'PG'}`,
        order_id: data.order_id,
        handler: async (response) => {
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              booking_id: data.booking_id || booking.id,
            });
            alert("Payment Successful! Your booking is confirmed.");
            window.location.reload();
          } catch (err) {
            alert(err?.response?.data?.message || "Payment verification failed.");
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

  const handleBack = useCallback(() => {
    setActiveAction(null);
    setSearchParams(prev => {
      const next = new URLSearchParams();
      if (selectedPg && (selectedPg.pg_id || selectedPg.id)) {
        next.set('pgId', selectedPg.pg_id || selectedPg.id);
      }
      return next;
    });
  }, [selectedPg, setSearchParams]);

  const handlePaymentKycDone = useCallback(() => setPaymentKycDone(true), []);

  // The student's own KYC status — drives the "action required" banner.
  const loadKycStatus = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/enrollments/mine');
      setKycInfo(res?.data?.enrollment || null);
    } catch {
      setKycInfo(null);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadKycStatus();
  }, [user, loadKycStatus]);

  const handleReapplyDone = useCallback(() => {
    setActiveAction(null);
    setSearchParams({});
    loadKycStatus();
  }, [loadKycStatus, setSearchParams]);

  const handleDockClick = useCallback((appId) => {
    setActiveAction(appId);
    setSearchParams({ action: appId });
  }, [setSearchParams]);

  // Resident dock apps with macOS 3D icons from /icons/
  const DOCK_APPS = useMemo(() => [
    {
      id: 'rent',
      name: 'Pay Rent',
      icon: '/icons/payrents-removebg-preview.png',
      sub: 'Dues & Invoices',
      iconScale: 1.25
    },
    {
      id: 'requests',
      name: 'Requests',
      icon: '/icons/requests-removebg-preview.png',
      badge: activeReqCount,
      sub: 'Helpdesk & Complaints'
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: '/icons/notifications-removebg-preview.png',
      badge: unreadNotifCount,
      sub: 'All Owner Updates',
      iconScale: 1.25
    },
    {
      id: 'chat',
      name: 'PG Chat',
      icon: '/icons/dormn_chat-removebg-preview.png',
      sub: 'Residents & Host Lounge',
      iconScale: 1.65
    },
    {
      id: 'notices',
      name: 'View Notices',
      icon: '/icons/notices-removebg-preview.png',
      badge: unreadNoticesCount,
      sub: 'Owner Announcements'
    },
    {
      id: 'registration',
      name: 'Registration',
      icon: '/icons/regestration_from-removebg-preview.png',
      sub: 'KYC & Verification',
      iconScale: 1.15
    },
    {
      id: 'account',
      name: 'My Account',
      icon: formatUserAvatar(user),
      sub: 'Profile & Policies',
      isProfile: true
    }
  ], [activeReqCount, unreadNotifCount, unreadNoticesCount, user]);

  const pgHeroImage = useMemo(() => {
    if (!pgInfo) return DEFAULT_PG_IMAGES[0];
    const raw = pgInfo.profile_image || pgInfo.pg_image || pgInfo.image;
    if (!raw) return DEFAULT_PG_IMAGES[(pgInfo.pg_id || pgInfo.id || 0) % DEFAULT_PG_IMAGES.length];
    if (raw.startsWith('http') || raw.startsWith('data:')) return raw;
    if (raw.startsWith('/uploads/')) return `${IMAGE_BASE_URL}${raw}`;
    return `${IMAGE_BASE_URL}/uploads/${raw}`;
  }, [pgInfo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#07090e] flex items-center justify-center">
        <div className="w-9 h-9 border-4 border-[#93B733] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Render Sub-view when a feature is selected
  if (activeAction) {
    return (
      <div className={`bg-[#FAF9F5] dark:bg-[#07090e] text-gray-900 dark:text-white flex flex-col ${
        activeAction === 'chat' ? 'h-[100dvh] max-h-[100dvh] overflow-hidden' : 'min-h-screen'
      }`}>
        <Navbar />
        
        <div className={`flex-1 w-full mx-auto ${
          activeAction === 'chat' 
            ? `max-w-full px-0 sm:px-4 md:px-6 pt-0 sm:pt-2 ${
                isChatInputFocused ? 'pb-0' : 'pb-[4.75rem]'
              } sm:pb-24 flex-1 h-full min-h-0 flex flex-col overflow-hidden transition-[padding] duration-200` 
            : 'max-w-5xl px-3 sm:px-6 pt-3 sm:pt-6 pb-20 sm:pb-28'
        }`}>
          <Suspense fallback={<div className="p-12 text-center flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#93B733] border-t-transparent rounded-full animate-spin" /></div>}>
            {activeAction === 'chat' && <PGChat pgInfo={pgInfo} onBack={handleBack} />}
            {activeAction === 'rent' && (
              paymentKycDone
                ? <PayRent onBack={handleBack} />
                : <PaymentKycForm onBack={handleBack} onDone={handlePaymentKycDone} />
            )}
            {activeAction === 'requests' && <MaintenanceRequests pgInfo={pgInfo} onBack={handleBack} />}
            {activeAction === 'notifications' && <ResidentNotifications onBack={handleBack} />}
            {activeAction === 'notices' && <ResidentNotices onBack={handleBack} />}
            {activeAction === 'registration' && <RegistrationForm onBack={handleBack} />}
            {activeAction === 'reapply' && (
              <PaymentKycForm
                onBack={handleBack}
                mode="reapply"
                bookingId={kycInfo?.booking_id || activeBookingId}
                onDone={handleReapplyDone}
              />
            )}
            {activeAction === 'account' && <MyAccount pgInfo={pgInfo} onBack={handleBack} />}
          </Suspense>
        </div>

        {/* Bottom macOS Dock */}
        {hasEnrolledPG && (
          <div className={`fixed bottom-1.5 sm:bottom-4 left-0 right-0 z-40 flex justify-center pointer-events-none pb-[env(safe-area-inset-bottom,0px)] transition-all duration-300 ${
            activeAction === 'chat' && isChatInputFocused 
              ? 'translate-y-36 opacity-0 pointer-events-none' 
              : 'translate-y-0 opacity-100'
          }`}>
            <div className="pointer-events-auto">
              <MacOSDock apps={DOCK_APPS} variant="resident" onAppClick={handleDockClick} openApps={[activeAction]} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#07090e] text-gray-900 dark:text-white flex flex-col selection:bg-[#93B733]/30">
      <Navbar />

      {/* ── KYC REJECTED — ACTION REQUIRED ── */}
      {kycInfo?.status === 'rejected' && (
        <div className="w-full bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-500/30">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
                <AlertTriangle size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-black text-rose-800 dark:text-rose-300">
                  Action required — your tenant details were not accepted
                </h3>
                {kycInfo.rejection_note && (
                  <p className="text-xs font-medium text-rose-700/90 dark:text-rose-400/90 mt-1 leading-relaxed">
                    <span className="font-black">Owner&apos;s reason:</span> {kycInfo.rejection_note}
                  </p>
                )}
                <p className="text-[11px] font-medium text-rose-600/80 dark:text-rose-400/70 mt-1">
                  Correct your details and re-submit for review — you do not need to pay again.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDockClick('reapply')}
              className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 px-5 py-2.5 text-xs font-black text-white shadow-md transition active:scale-[0.98]"
            >
              <FileText size={14} /> Reapply with correct details
            </button>
          </div>
        </div>
      )}

      {/* ── TOP SWITCHER / BACK BAR (When viewing a specific PG) ── */}
      {selectedPg && (
        <div className="bg-white/95 dark:bg-[#0c101a]/95 backdrop-blur-md border-b border-gray-200 dark:border-white/10 px-3.5 sm:px-8 py-2 sm:py-2.5 sticky top-12 sm:top-20 z-30 flex items-center justify-between">
          <button
            onClick={handleBackToCards}
            className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-black text-gray-700 dark:text-gray-200 hover:text-[#93B733] dark:hover:text-[#93B733] transition cursor-pointer"
          >
            <ArrowLeft size={15} />
            <span>All My PGs ({pgCardsList.length})</span>
          </button>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">Accommodation:</span>
            <span className="text-xs sm:text-sm font-black text-gray-900 dark:text-white truncate max-w-[130px] sm:max-w-[200px]">
              {selectedPg.title || selectedPg.pg_name || "PG Accommodation"}
            </span>
            {pgCardsList.length > 1 && (
              <button
                onClick={handleBackToCards}
                className="text-[11px] sm:text-xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-[#93B733]/20 text-[#0D3A1D] dark:text-[#93B733] transition cursor-pointer ml-1"
              >
                Switch PG
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── TOP FULL-WIDTH RECTANGULAR HERO BANNER (Edge-to-Edge, Sleek Height) ── */}
      {selectedPg && (
        <div className="relative w-full min-h-[175px] sm:h-56 md:h-64 bg-black overflow-hidden group flex flex-col justify-end">
          {/* Background Property Image */}
          <img
            src={formatPgImage(selectedPg)}
            alt={selectedPg.title || selectedPg.pg_name || "PG Accommodation"}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = DEFAULT_PG_IMAGES[0];
            }}
            className="absolute inset-0 w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-105 opacity-90"
          />

          {/* Dark Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/30 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent pointer-events-none" />

          {/* Foreground Content aligned to max-w-6xl */}
          <div className="relative z-20 w-full max-w-6xl mx-auto px-3.5 sm:px-8 md:px-12 pt-2.5 pb-3 sm:pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 sm:gap-4">
            <div className="space-y-1 sm:space-y-1.5 max-w-3xl">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-0.5">
                {selectedPg.cardType === 'enrolled' ? (
                  <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-[#93B733] text-black text-[10px] sm:text-[11px] font-black uppercase tracking-wider shadow-md">
                    Verified Resident
                  </span>
                ) : selectedPg.cardType === 'approved' ? (
                  <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-blue-500 text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider shadow-md">
                    Approved by Owner
                  </span>
                ) : (
                  <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-amber-500 text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider shadow-md">
                    Application Under Review
                  </span>
                )}
                <span className="text-[10px] sm:text-xs font-semibold text-emerald-200/95 backdrop-blur-md px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-md bg-black/60 border border-white/20 shadow-sm truncate max-w-[220px] sm:max-w-none">
                  {selectedPg.cardType === 'enrolled'
                    ? `Welcome home, ${user?.name || user?.full_name || 'Resident'}`
                    : `Application for ${selectedPg.title || selectedPg.pg_name || 'Accommodation'}`}
                </span>
              </div>

              <h1 className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight text-white capitalize drop-shadow-lg leading-tight">
                {selectedPg.title || selectedPg.pg_name || "Dormn Living Accommodation"}
              </h1>

              <div className="flex items-center gap-1 text-[11px] sm:text-sm text-gray-200 font-medium">
                <MapPin size={13} className="text-[#93B733] shrink-0" />
                <span className="truncate max-w-xl">{selectedPg.address || selectedPg.location || "Sector 62, Noida, Uttar Pradesh"}</span>
              </div>
            </div>

            {/* Right Badges / Chips */}
            <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-end flex-wrap">
              <div className="px-2.5 py-1 sm:px-4 sm:py-2 rounded-xl bg-black/70 backdrop-blur-md border border-white/25 text-white shadow-xl text-left flex items-center sm:block gap-2 sm:gap-0">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#93B733]">
                  {selectedPg.cardType === 'enrolled' ? "Room Allocated" : "Room Choice"}
                </p>
                <p className="text-xs sm:text-sm font-black text-white">
                  {selectedPg.room_no ? `Room ${selectedPg.room_no} • ` : ""}{selectedPg.selected_room_type || selectedPg.sharing_type || "Twin Sharing"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT (3 Cards & Features) ── */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 md:px-8 py-3.5 sm:py-8 pb-24 sm:pb-24">
        {hasEnrolledPG && pgInfo ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* 3-Card Balanced Single View Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              
              {/* CARD 1: STAY & ROOM DETAILS */}
              <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#10141e] border border-gray-200/80 dark:border-white/10 shadow-sm flex flex-col justify-between transition-all">
                {/* Header (Clickable on Mobile) */}
                <div 
                  onClick={() => toggleCard('specs')}
                  className="w-full flex items-center justify-between cursor-pointer md:cursor-default select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center flex-shrink-0">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-gray-900 dark:text-white">Your Stay Specs</h3>
                      <p className="text-[11px] font-medium text-gray-400">Room & Amenities</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                    <button 
                      type="button" 
                      className="md:hidden p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-transform duration-300"
                      aria-label="Toggle details"
                    >
                      <ChevronDown size={18} className={`transform transition-transform duration-300 ${openCards.specs ? 'rotate-180 text-blue-500' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Collapsible Content */}
                <div className={`${openCards.specs ? 'block' : 'hidden'} md:block pt-4 border-t border-gray-100 dark:border-white/5 md:border-0 md:pt-4 space-y-4`}>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-white/5">
                      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><Wifi size={13} className="text-blue-400" /> High-Speed Wi-Fi</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">{pgInfo.wifi_ssid || "Dormn-5G-HighSpeed"}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-white/5">
                      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><Utensils size={13} className="text-amber-400" /> Food Plan</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">3 Meals Included (Veg / Non-Veg)</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5"><Moon size={13} className="text-indigo-400" /> Gate Curfew</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">{pgInfo.curfew_time || "10:30 PM"} (Biometric)</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); handleDockClick('requests'); }}
                    className="w-full py-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Wrench size={14} />
                    <span>Raise Room Request ({activeReqCount} active)</span>
                  </button>
                </div>
              </div>

              {/* CARD 2: RENT & DUES SNAPSHOT */}
              <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#10141e] border border-gray-200/80 dark:border-white/10 shadow-sm flex flex-col justify-between transition-all">
                {/* Header (Clickable on Mobile) */}
                <div 
                  onClick={() => toggleCard('rent')}
                  className="w-full flex items-center justify-between cursor-pointer md:cursor-default select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
                      <IndianRupee size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-gray-900 dark:text-white">Rent & Invoices</h3>
                      <p className="text-[11px] font-medium text-gray-400">Monthly Dues</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                      pgInfo.payment_status === 'paid'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }`}>
                      {pgInfo.payment_status === 'paid' ? 'Paid & Active' : 'Payment Due'}
                    </span>
                    <button 
                      type="button" 
                      className="md:hidden p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-transform duration-300"
                      aria-label="Toggle details"
                    >
                      <ChevronDown size={18} className={`transform transition-transform duration-300 ${openCards.rent ? 'rotate-180 text-emerald-500' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Collapsible Content */}
                <div className={`${openCards.rent ? 'block' : 'hidden'} md:block pt-4 border-t border-gray-100 dark:border-white/5 md:border-0 md:pt-4 space-y-4`}>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-white/5">
                      <span className="text-gray-500 dark:text-gray-400">Monthly Rent</span>
                      <span className="text-sm font-black text-[#0D3A1D] dark:text-[#93B733]">₹{(Number(pgInfo.booked_price || pgInfo.price || 8500)).toLocaleString()} / mo</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-white/5">
                      <span className="text-gray-500 dark:text-gray-400">Next Due Date</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">5th of upcoming month</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-gray-500 dark:text-gray-400">Electricity & Power</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">Included (100% Free)</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); handleDockClick('rent'); }}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <IndianRupee size={14} />
                    <span>{pgInfo.payment_status === 'paid' ? 'View Invoices & Receipts' : 'Pay Rent & View Dues'}</span>
                  </button>
                </div>
              </div>

              {/* CARD 3: OWNER & WARDEN DESK */}
              <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#10141e] border border-gray-200/80 dark:border-white/10 shadow-sm flex flex-col justify-between transition-all">
                {/* Header (Clickable on Mobile) */}
                <div 
                  onClick={() => toggleCard('caretaker')}
                  className="w-full flex items-center justify-between cursor-pointer md:cursor-default select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center flex-shrink-0">
                      <User size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-gray-900 dark:text-white">Property Caretaker</h3>
                      <p className="text-[11px] font-medium text-gray-400">Owner & Warden Desk</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase">
                      Verified Host
                    </span>
                    <button 
                      type="button" 
                      className="md:hidden p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-transform duration-300"
                      aria-label="Toggle details"
                    >
                      <ChevronDown size={18} className={`transform transition-transform duration-300 ${openCards.caretaker ? 'rotate-180 text-purple-500' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Collapsible Content */}
                <div className={`${openCards.caretaker ? 'block' : 'hidden'} md:block pt-4 border-t border-gray-100 dark:border-white/5 md:border-0 md:pt-4 space-y-4`}>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-white/5">
                      <span className="text-gray-500 dark:text-gray-400">Caretaker / Owner</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">{pgInfo.owner_name || "PG Property Manager"}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-white/5">
                      <span className="text-gray-500 dark:text-gray-400">Emergency Desk</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">+91 XXXXXXXXXX</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-gray-500 dark:text-gray-400">Owner Notices</span>
                      <span className="font-bold text-amber-500">{unreadNoticesCount > 0 ? `${unreadNoticesCount} new notices` : "All caught up"}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDockClick('chat'); }}
                      className="py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <MessageSquare size={13} />
                      <span>Chat</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDockClick('notices'); }}
                      className="py-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Sparkles size={13} />
                      <span>Notices</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDockClick('notifications'); }}
                      className="py-2.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Bell size={13} />
                      <span>Updates</span>
                    </button>
                  </div>
                </div>
              </div>

            
{/* CARD 4: PG STAFF & HELPDESK */}
              <div className="p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#10141e] border border-gray-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between transition-all">
                {/* Header (Clickable on Mobile) */}
                <div 
                  onClick={() => toggleCard('staff')}
                  className="w-full flex items-center justify-between cursor-pointer md:cursor-default select-none"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Users size={16} className="sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white">PG Staff</h3>
                      <p className="text-[10px] sm:text-[11px] font-medium text-gray-400">Cook, Guards & Tech</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] sm:text-[10px] font-black uppercase">
                      {pgStaff.length > 0 ? `${pgStaff.length} On Duty` : "Staff"}
                    </span>
                    <button 
                      type="button" 
                      className="md:hidden p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-transform duration-300"
                      aria-label="Toggle details"
                    >
                      <ChevronDown size={16} className={`transform transition-transform duration-300 ${openCards.staff ? 'rotate-180 text-amber-500' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Collapsible Content */}
                <div className={`${openCards.staff ? 'block' : 'hidden'} md:block pt-3 border-t border-gray-100 dark:border-white/5 md:border-0 md:pt-4 space-y-2.5 sm:space-y-4`}>
                  {staffLoading ? (
                    <div className="py-4 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-[#93B733] border-t-transparent rounded-full animate-spin" />
                      <span>Loading...</span>
                    </div>
                  ) : pgStaff.length === 0 ? (
                    <div className="py-2.5 text-center">
                      <p className="text-xs text-gray-400">No staff members listed yet.</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Contact owner for support.</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {pgStaff.slice(0, 2).map((member, idx) => {
                        const roleCfg = getStaffRoleStyle(member.role);
                        const avatar = formatStaffAvatar(member.image_url);
                        const cleanPhone = (member.phone || "").replace(/[^0-9+]/g, "");
                        const cleanWa = (member.whatsapp || member.phone || "").replace(/[^0-9]/g, "");

                        return (
                          <div key={member.id || member._id || idx} className="p-1.5 sm:p-2 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden bg-gray-200 dark:bg-white/10 shrink-0 flex items-center justify-center text-xs font-bold">
                                {avatar ? (
                                  <img src={avatar} alt={member.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                ) : (
                                  roleCfg.icon || member.name.charAt(0)
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{member.name}</p>
                                <span className={`inline-block text-[9px] font-semibold px-1 py-0.2 rounded border ${roleCfg.color} truncate`}>
                                  {roleCfg.icon} {member.role}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {cleanPhone && (
                                <a
                                  href={`tel:${cleanPhone}`}
                                  title={`Call ${member.name}`}
                                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center transition"
                                >
                                  <Phone size={11} />
                                </a>
                              )}
                              {cleanWa && (
                                <a
                                  href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(`Hi ${member.name}, I am a resident at ${pgInfo.title || pgInfo.pg_name || 'the PG'}.`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={`WhatsApp ${member.name}`}
                                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 flex items-center justify-center transition"
                                >
                                  <MessageCircle size={11} />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <button
                    onClick={(e) => { e.stopPropagation(); setShowStaffModal(true); }}
                    className="w-full py-2 sm:py-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 text-amber-600 dark:text-amber-400 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Users size={13} />
                    <span>{pgStaff.length > 2 ? `View All ${pgStaff.length} Staff` : 'View PG Staff'}</span>
                  </button>
                </div>
              </div>

            
            </div>

            {/* Bottom Quick Feature Summary Pill Bar */}
            <div className="p-3.5 rounded-2xl bg-gray-50/80 dark:bg-[#121622] border border-gray-200/60 dark:border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <ShieldCheck size={16} className="text-[#93B733]" />
                <span className="font-bold">Digital Resident Portal</span>
                <span className="text-gray-400">• Click any feature below on the dock to access your tools</span>
              </div>
              <div className="flex items-center gap-4 font-bold text-gray-500 dark:text-gray-400 text-[11px]">
                <button onClick={() => handleDockClick('registration')} className="hover:text-[#93B733] transition flex items-center gap-1 cursor-pointer">
                  <ClipboardList size={13} /> KYC Verified
                </button>
                <button onClick={() => handleDockClick('account')} className="hover:text-[#93B733] transition flex items-center gap-1 cursor-pointer">
                  <User size={13} /> Profile & Policy
                </button>
              </div>
            </div>
          </div>
        ) : selectedPg ? (
          /* Detailed view for selected non-enrolled PG */
          selectedPg.cardType === 'approved' ? (
            /* Approved Booking Details Card */
            <div className="max-w-2xl mx-auto w-full space-y-4 text-center animate-in fade-in duration-300">
              <div className="border-2 border-dashed border-emerald-400 dark:border-emerald-500/40 rounded-3xl p-6 sm:p-8 bg-emerald-50/40 dark:bg-emerald-500/[0.04] backdrop-blur-md space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">Booking Approved by Owner!</h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 max-w-md mx-auto">
                    Your request for <strong className="text-[#0D3A1D] dark:text-[#93B733]">{selectedPg.title || selectedPg.pg_name || "Accommodation"}</strong> has been accepted. Pay rent to confirm your room.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-black/40 border border-emerald-200/60 dark:border-emerald-500/20 text-xs text-left space-y-1.5 max-w-md mx-auto">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Room Type:</span>
                    <span className="font-bold text-gray-900 dark:text-white">{selectedPg.selected_room_type || 'Standard'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Monthly Rent:</span>
                    <span className="font-black text-[#0D3A1D] dark:text-[#93B733]">₹{(Number(selectedPg.booked_price || selectedPg.price || 0)).toLocaleString()}/mo</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 justify-center pt-2">
                  <button onClick={() => handlePayNow(selectedPg)} disabled={isPaying} className="inline-flex items-center gap-2 rounded-xl bg-[#93B733] hover:bg-[#82a32d] px-6 py-3 text-xs sm:text-sm font-black text-white shadow-md transition active:scale-95 cursor-pointer">
                    <IndianRupee size={15} />
                    {isPaying ? "Processing..." : `Pay ₹${(Number(selectedPg.booked_price || selectedPg.price || 0)).toLocaleString()} & Unlock Portal`}
                  </button>
                  <button onClick={() => navigate('/pg/' + (selectedPg.pg_id || selectedPg.id))} className="inline-flex items-center gap-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#111] px-5 py-3 text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 transition cursor-pointer">
                    <ExternalLink size={14} />
                    View PG Listing
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Pending Booking Details Card */
            <div className="max-w-2xl mx-auto w-full space-y-4 text-center animate-in fade-in duration-300">
              <div className="border-2 border-dashed border-amber-300 dark:border-amber-500/30 rounded-3xl p-6 sm:p-8 bg-amber-50/40 dark:bg-amber-500/[0.03] backdrop-blur-md space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                  <Clock size={24} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">Booking Request Under Verification</h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 max-w-md mx-auto">
                    Your request for <strong className="text-[#0D3A1D] dark:text-[#93B733]">{selectedPg.title || selectedPg.pg_name || "Accommodation"}</strong> is being reviewed by the owner.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-black/40 border border-amber-200/60 dark:border-amber-500/20 text-xs text-left space-y-1.5 max-w-md mx-auto">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Room Type:</span>
                    <span className="font-bold text-gray-900 dark:text-white">{selectedPg.selected_room_type || 'Standard'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Monthly Rent:</span>
                    <span className="font-black text-gray-900 dark:text-white">₹{(Number(selectedPg.booked_price || selectedPg.price || 0)).toLocaleString()}/mo</span>
                  </div>
                  {selectedPg.visit_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Visit Scheduled:</span>
                      <span className="font-bold text-amber-600">{selectedPg.visit_date} {selectedPg.visit_time || ''}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 justify-center pt-2">
                  <button onClick={() => navigate('/pg/' + (selectedPg.pg_id || selectedPg.id))} className="inline-flex items-center gap-2 rounded-xl bg-[#0D3A1D] hover:bg-[#16502a] px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-md transition cursor-pointer">
                    <ExternalLink size={14} />
                    View PG Listing
                  </button>
                  <button onClick={() => navigate('/pgs')} className="inline-flex items-center gap-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#111] px-5 py-3 text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 cursor-pointer">
                    Explore Other PGs
                  </button>
                </div>
              </div>
            </div>
          )
        ) : (
          /* Cards Grid View (when no PG is selected) */
          pgCardsList.length > 0 ? (
            <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-[#93B733]/15 text-[#4E700F] dark:text-[#93B733] text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
                      Student Portal
                    </span>
                    <span className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                      • {pgCardsList.length} {pgCardsList.length === 1 ? 'Accommodation' : 'Accommodations'}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                    My PG Accommodations
                  </h1>
                  <p className="text-[11px] sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Manage your enrolled stays and track all your applications in one place.
                  </p>
                </div>

                <button
                  onClick={() => navigate('/pgs')}
                  className="inline-flex items-center gap-1.5 sm:gap-2 rounded-xl bg-[#0D3A1D] dark:bg-[#93B733] hover:bg-[#16502a] dark:hover:bg-[#82a32d] px-3.5 py-2 text-xs font-bold text-white dark:text-black shadow-md transition active:scale-95 cursor-pointer self-start sm:self-auto"
                >
                  <Compass size={14} />
                  <span>Explore More PGs</span>
                </button>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
                {pgCardsList.map((card, idx) => {
                  const cardImg = formatPgImage(card, idx);
                  const isEnrolled = card.cardType === 'enrolled';
                  const isApproved = card.cardType === 'approved';

                  return (
                    <div
                      key={card.booking_id || card.id || idx}
                      onClick={() => handleSelectPg(card)}
                      className="group relative rounded-2xl sm:rounded-3xl bg-white dark:bg-[#10141e] border border-gray-200/80 dark:border-white/10 overflow-hidden shadow-xs sm:shadow-sm hover:shadow-xl hover:border-[#93B733]/60 transition-all duration-300 flex flex-col cursor-pointer"
                    >
                      {/* Card Image */}
                      <div className="relative h-32 sm:h-44 w-full overflow-hidden bg-gray-100 dark:bg-black/40">
                        <img
                          src={cardImg}
                          alt={card.title || card.pg_name || "PG Accommodation"}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = DEFAULT_PG_IMAGES[idx % DEFAULT_PG_IMAGES.length];
                          }}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

                        {/* Badges */}
                        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5">
                          {isEnrolled ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-600/90 text-white text-[10px] sm:text-[11px] font-black backdrop-blur-md shadow-md">
                              <CheckCircle2 size={11} /> Active Resident
                            </span>
                          ) : isApproved ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-600/90 text-white text-[10px] sm:text-[11px] font-black backdrop-blur-md shadow-md">
                              <Sparkles size={11} /> Approved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/90 text-white text-[10px] sm:text-[11px] font-black backdrop-blur-md shadow-md">
                              <Clock size={11} /> Under Review
                            </span>
                          )}

                          {card.selected_room_type && (
                            <span className="px-1.5 py-0.5 rounded-md bg-black/60 text-white/90 text-[9px] sm:text-[10px] font-bold backdrop-blur-md border border-white/20 truncate max-w-[120px]">
                              {card.selected_room_type}
                            </span>
                          )}
                        </div>

                        {/* Title over image bottom */}
                        <div className="absolute bottom-2.5 left-2.5 right-2.5">
                          <h3 className="text-sm sm:text-lg font-black text-white capitalize drop-shadow-md truncate">
                            {card.title || card.pg_name || "Dormn Living Accommodation"}
                          </h3>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between space-y-2.5 sm:space-y-4">
                        <div className="space-y-1.5 sm:space-y-2">
                          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-gray-600 dark:text-gray-300">
                            <MapPin size={12} className="text-[#93B733] shrink-0" />
                            <span className="truncate">
                              {card.city || card.area ? `${card.area ? card.area + ', ' : ''}${card.city}` : card.address || "Sector 62, Noida"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-white/5 text-[11px] sm:text-xs">
                            <span className="text-gray-500 dark:text-gray-400">Monthly Rent</span>
                            <span className="font-black text-[#0D3A1D] dark:text-[#93B733] text-xs sm:text-sm">
                              ₹{(Number(card.booked_price || card.price || 0)).toLocaleString()}/mo
                            </span>
                          </div>

                          {(card.booking_date || card.created_at) && (
                            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-gray-400">
                              <Calendar size={11} />
                              <span>Applied {formatDate(card.booking_date || card.created_at)}</span>
                            </div>
                          )}
                        </div>

                        {/* Action CTA */}
                        <div className="pt-1 sm:pt-2">
                          {isEnrolled ? (
                            <button
                              type="button"
                              className="w-full py-2 sm:py-2.5 px-3 rounded-xl bg-[#0D3A1D] hover:bg-[#16502a] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition active:scale-98 cursor-pointer"
                            >
                              <span>Open Resident Portal</span>
                              <ChevronRight size={13} />
                            </button>
                          ) : isApproved ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePayNow(card);
                              }}
                              className="w-full py-2.5 px-3 rounded-xl bg-[#93B733] hover:bg-[#82a32d] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition active:scale-98 cursor-pointer"
                            >
                              <IndianRupee size={13} />
                              <span>Pay Rent & Confirm</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="w-full py-2.5 px-3 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer"
                            >
                              <span>View Details</span>
                              <ChevronRight size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#10141e] border border-gray-200/80 dark:border-white/10 shadow-lg text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#93B733]/15 text-[#4E700F] dark:text-[#93B733] flex items-center justify-center mx-auto shadow-xs">
                <Lock size={26} />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">Welcome to Dormn Resident Hub</h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
                  {user 
                    ? "Enroll into your PG or track your booking to manage rent, maintenance requests, meal notices, and KYC records directly here."
                    : "Sign up to Dormn to get resident access, track your bookings, manage rent, and view all accommodation details here."
                  }
                </p>
              </div>
              <div className="flex flex-wrap gap-3 justify-center pt-2">
                {!user ? (
                  <>
                    <button onClick={() => navigate('/auth')} className="inline-flex items-center gap-2 rounded-xl bg-[#0D3A1D] hover:bg-[#15532a] px-6 py-3 text-xs sm:text-sm font-black text-white shadow-md transition cursor-pointer">
                      <span>Sign Up / Log In</span>
                    </button>
                    <button onClick={() => navigate('/pgs')} className="inline-flex items-center gap-2 rounded-xl bg-[#93B733] hover:bg-[#82a32d] px-6 py-3 text-xs sm:text-sm font-black text-white shadow-md transition cursor-pointer">
                      <Compass size={16} />
                      <span>Explore Available PGs</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => navigate('/pgs')} className="inline-flex items-center gap-2 rounded-xl bg-[#93B733] hover:bg-[#82a32d] px-6 py-3 text-xs sm:text-sm font-black text-white shadow-md transition cursor-pointer">
                      <Compass size={16} />
                      <span>Explore Available PGs</span>
                    </button>
                    <button onClick={() => navigate('/my-bookings')} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#151515] px-5 py-3 text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                      Track Requests
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        )}
      </main>

      {/* ── PG STAFF DIRECTORY MODAL (Mobile-Optimized) ── */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl max-h-[88vh] rounded-2xl sm:rounded-3xl bg-white dark:bg-[#121622] border border-gray-200 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-3.5 py-2.5 sm:px-6 sm:py-3.5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Users size={16} className="sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white">PG Staff Directory</h3>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                    {pgInfo?.title || pgInfo?.pg_name || "Accommodation"} • {pgStaff.length} On Duty
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowStaffModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-600 dark:text-gray-300 flex items-center justify-center transition cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-3 sm:p-5 overflow-y-auto space-y-2.5">
              {pgStaff.length === 0 ? (
                <div className="text-center py-8">
                  <Users size={28} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300">No staff members registered yet</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Please reach out directly to the PG owner.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {pgStaff.map((staff, idx) => {
                    const roleCfg = getStaffRoleStyle(staff.role);
                    const avatar = formatStaffAvatar(staff.image_url);
                    const cleanPhone = (staff.phone || "").replace(/[^0-9+]/g, "");
                    const cleanWa = (staff.whatsapp || staff.phone || "").replace(/[^0-9]/g, "");

                    return (
                      <div
                        key={staff.id || staff._id || idx}
                        className="rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] p-2.5 sm:p-3.5 flex flex-col justify-between space-y-2 hover:border-[#93B733]/50 transition"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden bg-gray-200 dark:bg-white/10 shrink-0 flex items-center justify-center text-sm font-black border border-gray-200 dark:border-white/10">
                            {avatar ? (
                              <img
                                src={avatar}
                                alt={staff.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  e.currentTarget.nextElementSibling?.classList.remove("hidden");
                                }}
                              />
                            ) : null}
                            <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-[#93B733]/20 to-emerald-500/20 text-gray-700 dark:text-gray-200 ${avatar ? "hidden" : "flex"}`}>
                              {roleCfg.icon || staff.name.charAt(0)}
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white truncate">
                              {staff.name}
                            </h4>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border mt-0.5 ${roleCfg.color}`}>
                              <span>{roleCfg.icon}</span>
                              <span className="truncate">{staff.role}</span>
                            </span>
                          </div>
                        </div>

                        {staff.timings && (
                          <div className="flex items-center gap-1 text-[11px] text-gray-600 dark:text-gray-400 bg-white dark:bg-black/20 px-2 py-1 rounded-lg border border-gray-100 dark:border-white/5">
                            <Clock size={11} className="text-[#93B733] shrink-0" />
                            <span className="truncate">{staff.timings}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 pt-1 border-t border-gray-200/60 dark:border-white/5">
                          {cleanPhone ? (
                            <a
                              href={`tel:${cleanPhone}`}
                              className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition flex items-center justify-center gap-1"
                            >
                              <Phone size={11} />
                              <span>Call</span>
                            </a>
                          ) : (
                            <span className="text-[11px] text-gray-400">No phone</span>
                          )}

                          {cleanWa ? (
                            <a
                              href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(`Hi ${staff.name}, I am a resident at ${pgInfo?.title || pgInfo?.pg_name || 'the PG'}.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 py-1.5 px-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs"
                            >
                              <MessageCircle size={11} />
                              <span>WhatsApp</span>
                            </a>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-3.5 py-2.5 bg-gray-50 dark:bg-black/30 border-t border-gray-100 dark:border-white/10 flex items-center justify-between text-[11px] text-gray-500">
              <span className="truncate max-w-[200px] sm:max-w-none">Direct staff directory for residents</span>
              <button
                onClick={() => setShowStaffModal(false)}
                className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-white/10 hover:bg-gray-300 text-gray-800 dark:text-gray-200 font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      
      {/* ── BOTTOM MACOS DOCK (All 7 Features from Image) ── */}
      {hasEnrolledPG && (
        <div className="fixed bottom-1.5 sm:bottom-4 left-0 right-0 z-40 flex justify-center pointer-events-none pb-[env(safe-area-inset-bottom,0px)]">
          <div className="pointer-events-auto">
            <MacOSDock apps={DOCK_APPS} variant="resident" onAppClick={handleDockClick} openApps={activeAction ? [activeAction] : ['/my-pg']} />
          </div>
        </div>
      )}
    </div>
  );
}
