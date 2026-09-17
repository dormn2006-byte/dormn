import { useState, useEffect, useContext, useCallback, useMemo, memo, lazy, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  IndianRupee, Wrench, Bell, ClipboardList, User,
  Sparkles, ArrowLeft, Compass, CheckCircle2, Clock, Lock, ShieldCheck,
  MapPin, Wifi, Moon, Utensils, Building2, ChevronDown, MessageSquare
} from 'lucide-react';
import api, { IMAGE_BASE_URL } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import MacOSDock from '../components/ui/mac-os-dock';
import { getProfileAvatar } from '../constants/studentDockConfig';

const DEFAULT_PG_IMAGES = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=1400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1400&auto=format&fit=crop"
];

// Lazy sub-views
const PayRent = lazy(() => import('./mypg/PayRent'));
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
  const [approvedBookings, setApprovedBookings] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);

  const [activeReqCount, setActiveReqCount] = useState(0);
  const [unreadNoticesCount, setUnreadNoticesCount] = useState(0);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Mobile accordion state for the 3 info cards
  const [openCards, setOpenCards] = useState({
    specs: false,
    rent: false,
    caretaker: false
  });

  const toggleCard = useCallback((key) => {
    setOpenCards(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

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

  useEffect(() => {
    const fetchStay = async () => {
      try {
        // 1. Primary: Use the dedicated my-pgs endpoint (correctly checks approved OR paid, excludes cancelled)
        const myPgRes = await api.get('/bookings/my-pgs').catch(() => null);
        if (myPgRes?.data?.success && myPgRes.data?.booking) {
          setPgInfo(myPgRes.data.booking);
          setHasEnrolledPG(true);
          setApprovedBookings([]);
          setPendingBookings([]);
          setLoading(false);
          return;
        }

        // 2. Fallback: Check full bookings list for pending/approved-unpaid states
        const bookRes = await api.get('/bookings/my-bookings').catch(() => null);
        const list = Array.isArray(bookRes?.data?.bookings || bookRes?.data) ? (bookRes?.data?.bookings || bookRes?.data) : [];

        // Check for any approved booking (even if my-pgs didn't return it)
        const approvedStay = list.find(b => 
          (b.status === 'approved' || b.payment_status === 'paid') && b.status !== 'cancelled'
        );

        if (approvedStay) {
          setPgInfo(approvedStay);
          setHasEnrolledPG(true);
          setApprovedBookings([]);
          setPendingBookings([]);
        } else {
          // Check for pending bookings
          const pending = groupLatestBookings(list, b => b.status === 'pending');
          if (pending.length > 0) {
            setPendingBookings(pending);
            setApprovedBookings([]);
            setHasEnrolledPG(false);
            setPgInfo(null);
          } else {
            // Check local KYC / enrollments fallback
            try {
              const localKyc = JSON.parse(localStorage.getItem('dormn_kyc_enrollments') || '[]');
              const myKyc = Array.isArray(localKyc) ? localKyc.find(k => (user?.email && k.student_email === user?.email) || (user?.id && k.user_id === user?.id)) : null;
              if (myKyc) {
                setPgInfo({
                  id: myKyc.pg_id || myKyc.id,
                  title: myKyc.pg_title || myKyc.title || "My PG Accommodation",
                  address: myKyc.pg_address || myKyc.address || "Sector 62, Noida",
                  owner_name: myKyc.owner_name || "PG Property Manager",
                  room_no: myKyc.room_no || "204",
                  sharing_type: myKyc.sharing_type || "Twin Sharing",
                  price: myKyc.monthly_rent || myKyc.price || 8500,
                  payment_status: myKyc.payment_status || 'paid',
                  status: 'approved'
                });
                setHasEnrolledPG(true);
                return;
              }
            } catch {}

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
  }, [user]);

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
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
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
    setSearchParams({});
  }, [setSearchParams]);

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
      sub: 'Dues & Invoices'
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
      sub: 'All Owner Updates'
    },
    {
      id: 'chat',
      name: 'PG Chat',
      icon: '/icons/dormn_chat-removebg-preview.png',
      sub: 'Residents & Host Lounge'
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
      sub: 'KYC & Verification'
    },
    {
      id: 'account',
      name: 'My Account',
      icon: user?.profile_image || getProfileAvatar(user?.id),
      sub: 'Profile & Policies'
    }
  ], [activeReqCount, unreadNotifCount, unreadNoticesCount, user?.profile_image, user?.id]);

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
      <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#07090e] text-gray-900 dark:text-white flex flex-col">
        <Navbar />
        
        <div className={`flex-1 w-full mx-auto ${
          activeAction === 'chat' 
            ? 'max-w-full px-2 sm:px-4 md:px-6 pt-2 pb-24 h-[calc(100vh-80px)] flex flex-col' 
            : 'max-w-5xl px-4 sm:px-6 pt-4 sm:pt-6 pb-28'
        }`}>
          <Suspense fallback={<div className="p-12 text-center flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#93B733] border-t-transparent rounded-full animate-spin" /></div>}>
            {activeAction === 'chat' && <PGChat pgInfo={pgInfo} onBack={handleBack} />}
            {activeAction === 'rent' && <PayRent onBack={handleBack} />}
            {activeAction === 'requests' && <MaintenanceRequests pgInfo={pgInfo} onBack={handleBack} />}
            {activeAction === 'notifications' && <ResidentNotifications onBack={handleBack} />}
            {activeAction === 'notices' && <ResidentNotices onBack={handleBack} />}
            {activeAction === 'registration' && <RegistrationForm onBack={handleBack} />}
            {activeAction === 'account' && <MyAccount pgInfo={pgInfo} onBack={handleBack} />}
          </Suspense>
        </div>

        {/* Bottom macOS Dock */}
        <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-center pointer-events-none">
          <div className="pointer-events-auto">
            <MacOSDock apps={DOCK_APPS} variant="resident" onAppClick={handleDockClick} openApps={[activeAction]} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#07090e] text-gray-900 dark:text-white flex flex-col selection:bg-[#93B733]/30">
      <Navbar />

      {/* ── TOP FULL-WIDTH RECTANGULAR HERO BANNER (Edge-to-Edge, Sleek Height) ── */}
      {hasEnrolledPG && pgInfo && (
        <div className="relative w-full h-48 sm:h-56 md:h-64 bg-black overflow-hidden group">
          {/* Background Property Image */}
          <img
            src={pgHeroImage}
            alt={pgInfo.title || pgInfo.pg_name || "PG Accommodation"}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = DEFAULT_PG_IMAGES[0];
            }}
            className="absolute inset-0 w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-105 opacity-90"
          />

          {/* Dark Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/20 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent pointer-events-none" />

          {/* Foreground Content aligned to max-w-6xl */}
          <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-8 md:left-12 right-4 sm:right-8 md:right-12 z-20 max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="px-2.5 py-1 rounded-md bg-[#93B733] text-black text-[11px] font-black uppercase tracking-wider shadow-md">
                  Verified Resident
                </span>
                <span className="text-xs font-semibold text-emerald-200/95 backdrop-blur-md px-2.5 py-0.5 rounded-md bg-black/60 border border-white/20 shadow-sm">
                  Welcome home, {user?.name || user?.full_name || 'Resident'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white capitalize drop-shadow-lg leading-tight">
                {pgInfo.title || pgInfo.pg_name || "Dormn Living Accommodation"}
              </h1>

              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-200 font-medium">
                <MapPin size={14} className="text-[#93B733] shrink-0" />
                <span className="truncate max-w-xl">{pgInfo.address || pgInfo.location || "Sector 62, Noida, Uttar Pradesh"}</span>
              </div>
            </div>

            {/* Right Badges / Chips */}
            <div className="flex items-center gap-3 self-start sm:self-end flex-wrap">
              <div className="px-4 py-2 rounded-xl bg-black/70 backdrop-blur-md border border-white/25 text-white shadow-xl text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#93B733]">Room Allocated</p>
                <p className="text-xs sm:text-sm font-black text-white">{pgInfo.room_no ? `Room ${pgInfo.room_no}` : "Room 204"} • {pgInfo.sharing_type || "Twin Sharing"}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT (3 Cards & Features) ── */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 pb-28 sm:pb-24">
        {hasEnrolledPG && pgInfo ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* 3-Card Balanced Single View Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
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
        ) : (
          /* Non-enrolled / Booking Under Review Card (Zero Scroll, compact) */
          <div className="max-w-2xl mx-auto w-full space-y-4 text-center animate-in fade-in duration-300">
            {approvedBookings.length > 0 ? (
              <div className="border-2 border-dashed border-emerald-400 dark:border-emerald-500/40 rounded-3xl p-6 sm:p-8 bg-emerald-50/40 dark:bg-emerald-500/[0.04] backdrop-blur-md space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">Booking Approved by Owner!</h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 max-w-md mx-auto">
                    Your request for <strong className="text-[#0D3A1D] dark:text-[#93B733]">{approvedBookings[0].title || approvedBookings[0].pg_name || "Accommodation"}</strong> has been accepted.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 justify-center pt-2">
                  <button onClick={() => handlePayNow(approvedBookings[0])} disabled={isPaying} className="inline-flex items-center gap-2 rounded-xl bg-[#93B733] hover:bg-[#82a32d] px-6 py-3 text-xs sm:text-sm font-black text-white shadow-md transition active:scale-95 cursor-pointer">
                    <IndianRupee size={15} />
                    {isPaying ? "Processing..." : `Pay ₹${(Number(approvedBookings[0].booked_price || approvedBookings[0].price || 0)).toLocaleString()} & Unlock Portal`}
                  </button>
                  <button onClick={() => navigate('/my-bookings')} className="inline-flex items-center gap-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#111] px-5 py-3 text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 transition cursor-pointer">
                    View Requests
                  </button>
                </div>
              </div>
            ) : pendingBookings.length > 0 ? (
              <div className="border-2 border-dashed border-amber-300 dark:border-amber-500/30 rounded-3xl p-6 sm:p-8 bg-amber-50/40 dark:bg-amber-500/[0.03] backdrop-blur-md space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                  <Clock size={24} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">Booking Request Under Verification</h2>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 max-w-md mx-auto">
                    Your request for <strong className="text-[#0D3A1D] dark:text-[#93B733]">{pendingBookings[0].title || pendingBookings[0].pg_name || "Accommodation"}</strong> is being reviewed by the owner.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 justify-center pt-2">
                  <button onClick={() => navigate('/my-bookings')} className="inline-flex items-center gap-2 rounded-xl bg-[#0D3A1D] hover:bg-[#16502a] px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-md transition cursor-pointer">
                    Track My Requests
                  </button>
                  <button onClick={() => navigate('/pgs')} className="inline-flex items-center gap-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#111] px-5 py-3 text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 cursor-pointer">
                    Explore Other PGs
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#10141e] border border-gray-200/80 dark:border-white/10 shadow-lg text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#93B733]/15 text-[#4E700F] dark:text-[#93B733] flex items-center justify-center mx-auto shadow-xs">
                  <Lock size={26} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">Welcome to Dormn Resident Hub</h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
                    Enroll into your PG or track your booking to manage rent, maintenance requests, meal notices, and KYC records directly here.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 justify-center pt-2">
                  <button onClick={() => navigate('/pgs')} className="inline-flex items-center gap-2 rounded-xl bg-[#93B733] hover:bg-[#82a32d] px-6 py-3 text-xs sm:text-sm font-black text-white shadow-md transition cursor-pointer">
                    <Compass size={16} />
                    <span>Explore Available PGs</span>
                  </button>
                  <button onClick={() => navigate('/my-bookings')} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#151515] px-5 py-3 text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                    Track Requests
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── BOTTOM MACOS DOCK (All 7 Features from Image) ── */}
      <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-center pointer-events-none">
        <div className="pointer-events-auto">
          <MacOSDock apps={DOCK_APPS} variant="resident" onAppClick={handleDockClick} openApps={activeAction ? [activeAction] : ['/my-pg']} />
        </div>
      </div>
    </div>
  );
}
