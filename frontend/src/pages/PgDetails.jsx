
import { useEffect, useState, useMemo, useContext, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import API, { IMAGE_BASE_URL } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import EmailVerificationModal from "../components/auth/EmailVerificationModal";
import VisitSchedulePicker from "../components/booking/VisitSchedulePicker";
import { formatVisitDate } from "../utils/visitDate";
import {
  Phone, MessageSquare, CheckCircle2, Clock, ChevronRight, ChevronLeft,
  X, Sparkles, Building2, MapPin, AlertCircle, ShieldCheck, User, ExternalLink,
  Share2, Copy, Check, ArrowLeft, BedDouble, BedSingle, Snowflake, Wind, Flame,
  Wifi, Zap, UtensilsCrossed, Shirt, Bath, Car, Droplets, Dumbbell, Tv
} from "lucide-react";

const AMENITY_MAP = [
  { match: /power|backup|generator|electricity/i, icon: Zap, bg: "bg-amber-500/10 dark:bg-amber-400/15", color: "text-amber-600 dark:text-amber-400", border: "border-amber-200/60 dark:border-amber-500/25" },
  { match: /geyser|hot water|heater/i, icon: Flame, bg: "bg-rose-500/10 dark:bg-rose-400/15", color: "text-rose-600 dark:text-rose-400", border: "border-rose-200/60 dark:border-rose-500/25" },
  { match: /bath|washroom|toilet|shower/i, icon: Bath, bg: "bg-teal-500/10 dark:bg-teal-400/15", color: "text-teal-600 dark:text-teal-400", border: "border-teal-200/60 dark:border-teal-500/25" },
  { match: /water|ro|purified|drinking/i, icon: Droplets, bg: "bg-blue-500/10 dark:bg-blue-400/15", color: "text-blue-600 dark:text-blue-400", border: "border-blue-200/60 dark:border-blue-500/25" },
  { match: /security|cctv|guard|safety/i, icon: ShieldCheck, bg: "bg-emerald-500/10 dark:bg-emerald-400/15", color: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200/60 dark:border-emerald-500/25" },
  { match: /food|meal|dinner|lunch|breakfast|kitchen|cook/i, icon: UtensilsCrossed, bg: "bg-orange-500/10 dark:bg-orange-400/15", color: "text-orange-600 dark:text-orange-400", border: "border-orange-200/60 dark:border-orange-500/25" },
  { match: /laundry|wash|iron/i, icon: Shirt, bg: "bg-purple-500/10 dark:bg-purple-400/15", color: "text-purple-600 dark:text-purple-400", border: "border-purple-200/60 dark:border-purple-500/25" },
  { match: /wifi|wi-fi|internet|speed/i, icon: Wifi, bg: "bg-cyan-500/10 dark:bg-cyan-400/15", color: "text-cyan-600 dark:text-cyan-400", border: "border-cyan-200/60 dark:border-cyan-500/25" },
  { match: /\b(ac|air conditioner|air conditioning|cooling)\b/i, icon: Snowflake, bg: "bg-sky-500/10 dark:bg-sky-400/15", color: "text-sky-600 dark:text-sky-400", border: "border-sky-200/60 dark:border-sky-500/25" },
  { match: /housekeeping|cleaning|clean|maid/i, icon: Sparkles, bg: "bg-[#93B733]/15", color: "text-[#4E700F] dark:text-[#93B733]", border: "border-[#93B733]/30" },
  { match: /parking|car|bike|vehicle/i, icon: Car, bg: "bg-indigo-500/10 dark:bg-indigo-400/15", color: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-200/60 dark:border-indigo-500/25" },
  { match: /gym|fitness|workout/i, icon: Dumbbell, bg: "bg-rose-500/10 dark:bg-rose-400/15", color: "text-rose-600 dark:text-rose-400", border: "border-rose-200/60 dark:border-rose-500/25" },
  { match: /fridge|refrigerator/i, icon: Wind, bg: "bg-blue-500/10 dark:bg-blue-400/15", color: "text-blue-600 dark:text-blue-400", border: "border-blue-200/60 dark:border-blue-500/25" },
  { match: /tv|television/i, icon: Tv, bg: "bg-violet-500/10 dark:bg-violet-400/15", color: "text-violet-600 dark:text-violet-400", border: "border-violet-200/60 dark:border-violet-500/25" },
];

const DEFAULT_AMENITY_CFG = {
  icon: CheckCircle2,
  bg: "bg-[#93B733]/10",
  color: "text-[#4E700F] dark:text-[#93B733]",
  border: "border-[#93B733]/25",
};

const getAmenityConfig = (name) => {
  const str = String(name || "").trim();
  for (let i = 0; i < AMENITY_MAP.length; i++) {
    if (AMENITY_MAP[i].match.test(str)) return AMENITY_MAP[i];
  }
  return DEFAULT_AMENITY_CFG;
};

const formatImageUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  const c = url.trim();
  if (/^(https?:|data:)/i.test(c)) return c;
  const p = c.startsWith("/") ? c : `/${c}`;
  return `${IMAGE_BASE_URL}${p.startsWith("/uploads/") ? p : `/uploads${p}`}`;
};

const DEFAULT_DETAILS_FALLBACKS = [
  "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80",
];

const parseListField = (val) => {
  if (!val) return [];
  try {
    const p = typeof val === "string" ? (val.trim().startsWith("[") ? JSON.parse(val) : val.split(",")) : val;
    return (Array.isArray(p) ? p : [p]).map((x) => String(x).replace(/[\]"']/g, "").trim()).filter(Boolean);
  } catch {
    return String(val).split(",").map((s) => s.trim()).filter(Boolean);
  }
};

const ROOM_DEFS = [
  {
    key: "single",
    title: "Single Room",
    badge: "Private",
    occupancy: "1 Person",
    desc: "Dedicated private room with full privacy",
    perks: ["Full Privacy", "Personal Wardrobe", "Study Desk"],
    fNonAc: 1,
    fAc: 1.25,
  },
  {
    key: "double",
    title: "Double Sharing",
    badge: "2 Sharing",
    occupancy: "2 Persons",
    desc: "Shared room with 1 roommate & separate beds",
    perks: ["Twin Beds", "Individual Wardrobe", "High-speed Wi-Fi"],
    fNonAc: 0.85,
    fAc: 1.05,
  },
  {
    key: "triple",
    title: "Triple Sharing",
    badge: "3 Sharing",
    occupancy: "3 Persons",
    desc: "Budget-friendly shared room for students & pros",
    perks: ["Best Value", "Shared Storage", "Study Area"],
    fNonAc: 0.72,
    fAc: 0.95,
  },
];

const CoolingBadge = ({ isAc, className = "" }) => (
  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${className}`}>
    {isAc ? (
      <Snowflake className="w-3.5 h-3.5 text-sky-400 shrink-0" />
    ) : (
      <Wind className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
    )}
    <span>{isAc ? "AC Room" : "Non-AC"}</span>
  </span>
);

// Resolves available room types and their AC / Non-AC configurations concisely
const resolveRoomConfigurations = (pgData) => {
  if (!pgData) return [];
  const base = Math.max(1000, Number(pgData.price) || 6000);

  let parsed = null;
  if (pgData.sharing_options) {
    try {
      parsed = typeof pgData.sharing_options === "string" ? JSON.parse(pgData.sharing_options) : pgData.sharing_options;
    } catch {}
  }

  const hasConfig = parsed && ROOM_DEFS.some((d) => parsed[d.key]?.available || parsed[d.key]?.ac_price || parsed[d.key]?.non_ac_price);

  return ROOM_DEFS
    .filter((d) => !hasConfig || parsed?.[d.key]?.available || parsed?.[d.key]?.ac_price || parsed?.[d.key]?.non_ac_price)
    .map((d) => {
      const opt = parsed?.[d.key];
      const nonAcP = Number(opt?.non_ac_price) || Math.round(base * d.fNonAc);
      const acP = Number(opt?.ac_price) || Math.round(base * d.fAc);

      const options = [];
      if (opt?.non_ac_price || !opt?.ac_price) options.push({ isAc: false, price: nonAcP, label: `${d.title} (Non-AC)` });
      if (opt?.ac_price || !opt?.non_ac_price) options.push({ isAc: true, price: acP, label: `${d.title} (AC)` });

      return {
        type: d.key,
        title: d.title,
        badge: d.badge,
        occupancy: d.occupancy,
        desc: d.desc,
        perks: d.perks,
        options,
      };
    });
};

const PgDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [pg, setPg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Tracking the user's selected room type and price
  const [selectedRoom, setSelectedRoom] = useState({
    type: "single",
    isAc: false,
    price: 0,
    label: "Single Room (Non-AC)",
  });

  // Available room configurations for this PG
  const availableRooms = useMemo(() => resolveRoomConfigurations(pg), [pg]);

  // Track if user already booked this PG and is under verification
  const [existingBooking, setExistingBooking] = useState(null);
  // Track if user has an active stay at a DIFFERENT PG (blocks new bookings)
  const [activeStayAtOtherPG, setActiveStayAtOtherPG] = useState(null);

  // Check if current user already has a pending or active booking for this PG
  // AND check if they have an active stay at ANY other PG
  useEffect(() => {
    const checkExistingBooking = async () => {
      const token = localStorage.getItem("token");
      if (!token || !user) { setExistingBooking(null); setActiveStayAtOtherPG(null); return; }
      try {
        const res = await API.get("/bookings/my-bookings");
        const list = res.data?.bookings || res.data || [];
        if (!Array.isArray(list)) { setExistingBooking(null); setActiveStayAtOtherPG(null); return; }

        // A booking stops counting as an active stay once it is cancelled.
        // An owner-approved stay cancellation flips status to "cancelled" but
        // keeps payment_status as "paid", so cancelled must be excluded here.
        const isCancelledBooking = (b) =>
          b.status === "cancelled" ||
          b.status === "rejected" ||
          b.cancellation_status === "approved";

        // Check for existing booking at THIS PG
        const found = list.find(
          (b) => (Number(b.pg_id) === Number(id) || (b.title || b.pg_name || '').toLowerCase().trim() === (pg?.title || '').toLowerCase().trim()) && 
                 !isCancelledBooking(b) &&
                 (b.status === "pending" || b.status === "approved" || b.payment_status === "paid")
        );
        setExistingBooking(found || null);

        // Check for active stay at a DIFFERENT PG
        const otherActiveStay = list.find(
          (b) => Number(b.pg_id) !== Number(id) &&
                 (b.status === 'approved' || b.payment_status === 'paid') &&
                 !isCancelledBooking(b)
        );
        setActiveStayAtOtherPG(otherActiveStay || null);
      } catch (err) { console.error("Check existing booking error:", err); }
    };
    checkExistingBooking();
  }, [id, user, pg?.title]);

  const bookingStatusMeta = useMemo(() => {
    if (!existingBooking) return null;
    const isApprovedUnpaid = existingBooking.status === 'approved' && existingBooking.payment_status !== 'paid';
    const isPaid = existingBooking.payment_status === 'paid';
    return {
      title: isApprovedUnpaid ? 'Booking Approved by Owner!' : isPaid ? 'Active Resident Stay' : 'Booking Request Under Review',
      sub: isApprovedUnpaid ? 'Your booking for this PG has been APPROVED by the owner! Pay rent now in My PG to unlock full portal access.' : isPaid ? 'You are currently an active resident at this PG.' : 'You have already submitted a booking request for this PG. Status: PENDING OWNER APPROVAL.',
      btnBg: isApprovedUnpaid ? 'bg-emerald-600 hover:bg-emerald-700' : isPaid ? 'bg-[#0D3A1D] hover:bg-[#092814]' : 'bg-amber-600 hover:bg-amber-700',
      btnText: isApprovedUnpaid ? 'Already Approved (Pay Now in My PG)' : isPaid ? 'Already Active Stay (View Resident Portal)' : 'Already Requested (View Request Status)'
    };
  }, [existingBooking]);

  // (Coupon and payment moved to My Requests page after owner approval)

  useEffect(() => {
    const fetchPG = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/pg/${id}`);
        const pgData = res.data?.pg;
        if (pgData) {
          setPg(pgData);
          const resolved = resolveRoomConfigurations(pgData);
          if (resolved.length > 0 && resolved[0].options?.length > 0) {
            const firstOpt = resolved[0].options[0];
            setSelectedRoom({ type: resolved[0].type, isAc: firstOpt.isAc, price: firstOpt.price, label: firstOpt.label });
          } else {
            setSelectedRoom({ type: "single", isAc: false, price: Number(pgData.price) || 0, label: "Single Room (Non-AC)" });
          }
        }
      } catch (err) {
        console.error("PG Details Error:", err);
        setError("Failed to load PG details");
      } finally {
        setLoading(false);
      }
    };

    fetchPG();
  }, [id]);

  const cleanAmenities = useMemo(() => parseListField(pg?.amenities), [pg?.amenities]);
  const cleanRules = useMemo(() => parseListField(pg?.rules), [pg?.rules]);

  const galleryImages = useMemo(() => {
    if (!pg) return DEFAULT_DETAILS_FALLBACKS;
    const raw = [];
    if (pg.images) {
      try {
        const p = typeof pg.images === "string" ? JSON.parse(pg.images) : pg.images;
        if (Array.isArray(p)) raw.push(...p); else raw.push(p);
      } catch { raw.push(pg.images); }
    }
    if (Array.isArray(pg.gallery)) pg.gallery.forEach((g) => g?.image_url && raw.push(g.image_url));
    if (pg.profile_image) raw.push(pg.profile_image);
    if (pg.image) raw.push(pg.image);

    const formatted = raw.map(formatImageUrl).filter(Boolean);
    return formatted.length > 0 ? formatted : DEFAULT_DETAILS_FALLBACKS;
  }, [pg]);

  const currentActiveIndex = galleryImages.length > 0 
    ? ((activeImageIndex % galleryImages.length) + galleryImages.length) % galleryImages.length 
    : 0;
  const displayActiveImage = galleryImages[currentActiveIndex] || DEFAULT_DETAILS_FALLBACKS[0];

  // Gallery Controls
  const showNextImage = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (galleryImages.length <= 1) return;
    setActiveImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const showPreviousImage = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (galleryImages.length <= 1) return;
    setActiveImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  // State for sleek Booking Success Modal & Auth prompt
  const [bookingSuccessModal, setBookingSuccessModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [isGalleryLoopPaused, setIsGalleryLoopPaused] = useState(false);

  // Inline visit scheduler (date + time) shown inside the booking card
  const [showVisitPicker, setShowVisitPicker] = useState(false);
  const [scheduledVisit, setScheduledVisit] = useState({ date: "", time: "" });

  // Direct Share & Copy Link Handler
  const handleShare = useCallback(async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: `${pg?.title || 'PG'} | Dormn`,
      text: `Check out ${pg?.title || 'this PG'} located at ${pg?.area ? `${pg.area}, ${pg.city}` : 'Dormn'}: ${shareUrl}`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("Native share failed, falling back to copy:", err);
        }
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 3000);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  }, [pg?.title, pg?.area, pg?.city]);

  // Memoized Real-time Owner Phone Number Details
  const { cleanPhoneDigits, formattedWaNumber, displayPhone } = useMemo(() => {
    const raw = pg?.owner_phone || pg?.phone || "";
    const digits = String(raw).replace(/\D/g, "");
    return {
      cleanPhoneDigits: digits,
      formattedWaNumber: digits.length === 10 ? `91${digits}` : digits,
      displayPhone: raw
        ? digits.length === 10
          ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
          : raw
        : null,
    };
  }, [pg?.owner_phone, pg?.phone]);

  // Real-time WhatsApp Redirect with customized prefilled message
  const handleWhatsAppRedirect = useCallback(() => {
    if (!cleanPhoneDigits) {
      alert("Owner contact number is not provided for this listing.");
      return;
    }
    const priceText = selectedRoom.price ? ` at ₹${selectedRoom.price.toLocaleString()}/month` : "";
    const message = encodeURIComponent(
      `Hi ${pg?.owner_name || "Owner"}, I found your property "${pg?.title}" on Dormn and I am interested in ${selectedRoom.label || "a room"}${priceText}. Could you please share more details?`
    );
    window.open(`https://wa.me/${formattedWaNumber}?text=${message}`, "_blank");
  }, [cleanPhoneDigits, formattedWaNumber, pg?.owner_name, pg?.title, selectedRoom.label, selectedRoom.price]);

  // Real-time Call Redirect
  const handleCallRedirect = useCallback(() => {
    if (!cleanPhoneDigits) {
      alert("Owner contact number is not provided for this listing.");
      return;
    }
    window.location.href = `tel:${cleanPhoneDigits}`;
  }, [cleanPhoneDigits]);

  // Smart Back Navigation (goes back in history if available, else /pgs)
  const handleBack = useCallback(() => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate("/pgs");
    }
  }, [navigate]);

  const handleBookVisit = async () => {
    // Auth Check
    const token = localStorage.getItem("token");
    if (!token) {
      setShowAuthModal(true);
      return;
    }

    // Email Verification Check (Non-Google email users must verify their email before booking)
    const isEmailVerified = Boolean(user?.is_email_verified) || user?.auth_provider === "google";
    if (user && !isEmailVerified) {
      setShowEmailVerificationModal(true);
      return;
    }

    if (existingBooking) {
      if (existingBooking.status === "approved" && existingBooking.payment_status !== "paid") {
        navigate("/my-pg");
      } else if (existingBooking.payment_status === "paid") {
        navigate("/my-pg");
      } else {
        navigate("/my-bookings");
      }
      return;
    }

    if (activeStayAtOtherPG) {
      alert(`You already have an active PG stay at "${activeStayAtOtherPG.title || activeStayAtOtherPG.pg_name || 'another PG'}". You cannot book another PG until you request a cancellation from your current PG owner and they accept it.`);
      return;
    }

    const currentSpotsLeft = pg?.spots_left !== undefined ? pg.spots_left : Number(pg?.available_rooms || 0);
    if (currentSpotsLeft <= 0) {
      alert("Sorry, all spots for this PG have already been booked.");
      return;
    }

    // All checks passed — reveal the inline calendar so the student can pick
    // the day & time they'll physically visit the PG.
    setShowVisitPicker(true);
  };

  // Submit the visit/booking request with the student-chosen schedule
  const handleConfirmVisit = async (date, time) => {
    if (!date || !time) {
      alert("Please select both a visit date and a time slot.");
      return;
    }

    try {
      setBookingLoading(true);
      await API.post("/bookings/create", {
        pg_id: Number(id),
        message: `Visit requested on ${formatVisitDate(date)} at ${time} for ${selectedRoom.label}`,
        selected_room_type: selectedRoom.label,
        booked_price: selectedRoom.price,
        visit_date: date,
        visit_time: time,
      });
      setScheduledVisit({ date, time });
      setShowVisitPicker(false);
      setExistingBooking({ status: "pending", pg_id: Number(id) });
      setBookingSuccessModal(true);
    } catch (error) {
      console.error("Booking Error:", error);
      if (error?.response?.data?.code === "EMAIL_NOT_VERIFIED") {
        setShowEmailVerificationModal(true);
        return;
      }
      alert(error?.response?.data?.message || "Failed to create booking request. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };


  const [mainImageLoaded, setMainImageLoaded] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#000000] font-sans selection:bg-[#93B733] selection:text-white pb-20">
        <Navbar />
        <section className="relative z-10 mx-auto max-w-[1440px] 2xl:max-w-[1600px] px-4 py-8 sm:px-6 md:px-8 lg:px-10 md:py-12">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-12">
            <div className="flex flex-col gap-8">
              <div className="rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0d0d0d] p-3 shadow-sm md:rounded-[2.5rem]">
                <div className="h-[300px] md:h-[480px] w-full rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse" />
                <div className="mt-3 grid grid-cols-4 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-16 sm:h-20 md:h-24 w-full rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (error || !pg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F5] dark:bg-[#000000] text-[#3A2935] dark:text-white px-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
        <p className="font-bold text-lg text-red-500 mb-4">{error || "PG Not Found"}</p>
        <button
          onClick={() => navigate("/pgs")}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0D3A1D] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#092814] cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Explore PGs</span>
        </button>
      </div>
    );
  }

  const currentRoomPrice = selectedRoom.price || pg?.price || 0;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FAF9F5] dark:bg-[#000000] text-[#3A2935] dark:text-white font-sans selection:bg-[#93B733] selection:text-white pb-20">
      {/* Navbar */}
      <Navbar />

      {/* Floating Copied Toast Notification */}
      {copiedToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2.5 rounded-full bg-[#0D3A1D] px-5 py-2.5 text-white shadow-xl border border-white/20">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#93B733]">
              <Check size={12} className="text-[#0D3A1D] stroke-[3]" />
            </div>
            <span className="text-xs font-black">Direct PG Link Copied to Clipboard!</span>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <section className="relative z-10 mx-auto max-w-[1440px] 2xl:max-w-[1600px] px-3 py-4 sm:px-6 md:px-8 lg:px-10 md:py-6">
        
        {/* Top Back Navigation */}
        <div className="mb-3 sm:mb-4">
          <button
            type="button"
            onClick={handleBack}
            className="group inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111625] px-3.5 py-1.5 text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 shadow-sm transition-all hover:border-[#93B733] hover:text-[#0D3A1D] dark:hover:text-[#93B733] active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 text-gray-500 group-hover:text-[#93B733]" />
            <span>Back</span>
          </button>
        </div>

        <div className="grid gap-4 sm:gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-12">
          
          {/* LEFT SIDE: Details & Gallery */}
          <div className="flex flex-col gap-4 sm:gap-8">
            
            {/* Gallery (Bento Box Style) */}
            <div className="rounded-2xl sm:rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0d0d0d] p-1.5 sm:p-2 md:rounded-[2.5rem] md:p-3 shadow-sm">
              <div className="relative overflow-hidden rounded-xl sm:rounded-[1.5rem] md:rounded-[2rem] bg-gray-200 dark:bg-gray-800">
                
                {/* Backside Shimmer Skeleton */}
                {!mainImageLoaded && (
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse z-0" />
                )}

                <img
                  src={displayActiveImage}
                  alt="PG"
                  onLoad={() => setMainImageLoaded(true)}
                  className={`h-[220px] sm:h-[360px] md:h-[480px] w-full object-cover transition-all duration-700 hover:scale-105 ${
                    mainImageLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_DETAILS_FALLBACKS[0];
                    setMainImageLoaded(true);
                  }}
                />
                {galleryImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={showPreviousImage}
                      aria-label="Previous Image"
                      className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-gray-800 shadow-md transition-all hover:bg-white hover:scale-110 active:scale-95 cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.5]" />
                    </button>

                    <button
                      type="button"
                      onClick={showNextImage}
                      aria-label="Next Image"
                      className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-gray-800 shadow-md transition-all hover:bg-white hover:scale-110 active:scale-95 cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.5]" />
                    </button>

                    <div className="absolute bottom-2.5 right-2.5 sm:bottom-4 sm:right-4 z-20 rounded-full bg-black/70 backdrop-blur-sm px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-semibold text-white">
                      {currentActiveIndex + 1} / {galleryImages.length}
                    </div>
                  </>
                )}
              </div>

              {/* Single Section Thumbnail Strip: Static 4-col when <= 4, infinite loop marquee moving left when > 4 */}
              {galleryImages.length <= 4 ? (
                <div className="mt-1.5 sm:mt-2 md:mt-3 grid grid-cols-4 gap-1.5 sm:gap-2 md:gap-3">
                  {galleryImages.map((img, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setActiveImageIndex(index)}
                      className={`overflow-hidden rounded-lg sm:rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                        currentActiveIndex === index
                          ? "border-[#93B733] shadow-md opacity-100 ring-2 ring-[#93B733]/40 scale-[1.02]"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`preview ${index + 1}`}
                        loading="lazy"
                        decoding="async"
                        className="h-12 w-full object-cover sm:h-20 md:h-24"
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_DETAILS_FALLBACKS[index % DEFAULT_DETAILS_FALLBACKS.length];
                        }}
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <div 
                  className="thumbnail-marquee-container mt-1.5 sm:mt-2 md:mt-3 overflow-hidden rounded-lg sm:rounded-xl"
                  onMouseEnter={() => setIsGalleryLoopPaused(true)}
                  onMouseLeave={() => setIsGalleryLoopPaused(false)}
                  onTouchStart={() => setIsGalleryLoopPaused(true)}
                  onTouchEnd={() => setIsGalleryLoopPaused(false)}
                >
                  <div 
                    className="thumbnail-marquee-track gap-1.5 sm:gap-2 md:gap-3 py-0.5"
                    style={{
                      animationPlayState: isGalleryLoopPaused ? "paused" : "running",
                      animationDuration: `${Math.max(galleryImages.length * 2.2, 16)}s`
                    }}
                  >
                    {[...galleryImages, ...galleryImages].map((img, index) => {
                      const realIndex = index % galleryImages.length;
                      const isSelected = currentActiveIndex === realIndex;
                      return (
                        <button
                          key={`${realIndex}-${index >= galleryImages.length ? 'dup' : 'orig'}`}
                          type="button"
                          onClick={() => setActiveImageIndex(realIndex)}
                          className={`thumbnail-marquee-item overflow-hidden rounded-lg sm:rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? "border-[#93B733] shadow-md opacity-100 ring-2 ring-[#93B733]/40 scale-[1.02]"
                              : "border-transparent opacity-75 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={img}
                            alt={`preview ${realIndex + 1}`}
                            loading="lazy"
                            decoding="async"
                            className="h-12 w-full object-cover sm:h-20 md:h-24 pointer-events-none"
                            onError={(e) => {
                              e.currentTarget.src = DEFAULT_DETAILS_FALLBACKS[realIndex % DEFAULT_DETAILS_FALLBACKS.length];
                            }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* About / Header Section */}
            <div className="rounded-2xl sm:rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0d0d0d] p-4 sm:p-6 shadow-sm md:rounded-[2.5rem] md:p-10">
              <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="rounded-lg bg-green-50 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-green-700">
                    Verified Stay
                  </span>

                  {pg.sponsored && (
                    <span className="rounded-lg bg-[#93B733]/10 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#93B733]">
                      Sponsored
                    </span>
                  )}
                  
                  <span className="rounded-lg bg-gray-100 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-600">
                    {pg.status || "Active"}
                  </span>
                </div>

                {/* Share PG Direct Button */}
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-white/5 hover:bg-gray-100 px-2.5 py-1 sm:px-3.5 sm:py-1.5 text-[10px] sm:text-xs font-bold text-gray-800 dark:text-gray-200 transition cursor-pointer active:scale-95 shadow-xs"
                >
                  <Share2 size={12} className="text-[#93B733] shrink-0" />
                  <span>{copiedToast ? "Link Copied!" : "Share Property"}</span>
                </button>
              </div>

              <h1 className="text-xl sm:text-3xl font-black tracking-tight text-[#3A2935] md:text-5xl">
                {pg.title}
              </h1>

              <p className="mt-1.5 sm:mt-3 text-xs sm:text-sm font-medium text-gray-500 md:text-base flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#93B733] shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                {`${pg.area || ""}, ${pg.city || ""}`}
              </p>

              <div className="mt-3 sm:mt-6 flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1.5 sm:gap-2 rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-white/[0.04] px-3 py-1.5 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold text-[#3A2935] dark:text-white">
                  <span className="text-[#93B733]">★</span> {pg.rating || "New"} Ratings
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-white/[0.04] px-3 py-1.5 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold text-[#3A2935] dark:text-white">
                  <Building2 className="w-4 h-4 text-[#93B733]" /> {String(pg.pg_type || "PG").toUpperCase()}
                </div>
              </div>

              {/* Description */}
              <p className="mt-4 sm:mt-8 text-xs sm:text-sm leading-relaxed text-gray-600 dark:text-gray-300 md:text-base md:leading-8 whitespace-pre-line">
                {pg.description || "No description provided for this listing."}
              </p>
            </div>

            {/* Rules & Policies Section - Left Column */}
            <div className="rounded-2xl sm:rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0d0d0d] p-4 sm:p-6 shadow-sm md:rounded-[2.5rem] md:p-10 flex flex-col justify-start">
              <h2 className="text-base sm:text-2xl md:text-3xl font-black text-[#3A2935] dark:text-white">Rules & Policies</h2>
              {cleanRules.length > 0 ? (
                <div className="mt-3 sm:mt-6 space-y-2 sm:space-y-3">
                  {cleanRules.map((rule, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2.5 sm:gap-3.5 rounded-xl sm:rounded-2xl border-2 border-gray-100 dark:border-gray-800/80 bg-gray-50 dark:bg-white/[0.04] px-3.5 py-2.5 sm:px-5 sm:py-4 text-xs sm:text-sm md:text-base font-medium text-gray-700 dark:text-gray-200"
                    >
                      <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-[#93B733] shrink-0 mt-1 sm:mt-1.5 md:mt-2"></span>
                      <span className="leading-relaxed">{rule}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 sm:mt-4 text-xs sm:text-sm font-medium text-gray-400">
                  Standard house rules apply.
                </p>
              )}
            </div>

          </div>

          {/* RIGHT SIDE: Booking, Amenities & Actions */}
          <div className="space-y-4 sm:space-y-6">
            
            {/* Container for right sidebar */}
            <div className="space-y-4 sm:space-y-6">
              
              {/* Pricing & Booking Card */}
              <div id="booking-card" className="rounded-2xl sm:rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0d0d0d] p-4 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] md:rounded-[2.5rem] md:p-8">
                <div className="flex items-end justify-between border-b-2 border-gray-100 dark:border-gray-800 pb-4 sm:pb-6">
                  <div>
                    <h4 className="text-2xl sm:text-3xl font-black text-[#93B733]">
                      ₹{selectedRoom.price ? selectedRoom.price.toLocaleString() : Number(pg.price || 0).toLocaleString()}
                    </h4>
                    <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 mt-0.5 sm:mt-1 flex items-center gap-1">
                      <span>Selected:</span>
                      <span className="text-gray-900 dark:text-white font-black">{selectedRoom.label || "Per Month"}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-xs sm:text-sm font-bold text-[#3A2935] dark:text-gray-200">{String(pg.pg_type || "").toUpperCase()} PG</h3>
                    <div className="mt-1 flex items-center justify-end">
                      {(() => {
                        const spotsLeft = pg?.spots_left !== undefined ? pg.spots_left : Number(pg?.available_rooms || 0);
                        return (
                          <span className={`inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-black px-2.5 py-1 rounded-xl border ${
                            spotsLeft === 0
                              ? "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40"
                              : spotsLeft <= 3
                              ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40 animate-pulse"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40"
                          }`}>
                            {spotsLeft === 0 ? (
                              <>
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Fully Booked</span>
                              </>
                            ) : (
                              <>
                                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                <span>{spotsLeft} Spots Left</span>
                              </>
                            )}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Compact Room Selection (Sharing Options) */}
                <div className="mt-4 sm:mt-6 border-b-2 border-gray-100 dark:border-gray-800 pb-4 sm:pb-6">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <h3 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <BedDouble className="w-4 h-4 text-[#93B733]" />
                      <span>Available Rooms & Sharing</span>
                    </h3>
                    <span className="text-[10px] sm:text-xs font-bold text-[#93B733]">
                      {availableRooms.length} {availableRooms.length === 1 ? 'type' : 'types'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {availableRooms.map((room) => {
                      const isSelected = selectedRoom.type === room.type;
                      return (
                        <div
                          key={room.type}
                          className={`rounded-xl border-2 p-2.5 transition-all ${
                            isSelected
                              ? "border-[#93B733] bg-[#93B733]/5 dark:bg-[#93B733]/10 shadow-xs"
                              : "border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.03]"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5 text-xs font-bold text-gray-900 dark:text-white">
                            <span className="flex items-center gap-1.5 capitalize">
                              {room.type === "single" ? <BedSingle className="w-3.5 h-3.5 text-[#93B733]" /> : <BedDouble className="w-3.5 h-3.5 text-[#93B733]" />}
                              {room.title}
                            </span>
                            <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                              {room.badge}
                            </span>
                          </div>

                          <div className={`grid gap-1.5 ${room.options.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                            {room.options.map((opt) => {
                              const isOptActive = isSelected && selectedRoom.isAc === opt.isAc;
                              return (
                                <button
                                  key={opt.label}
                                  type="button"
                                  onClick={() => setSelectedRoom({ type: room.type, isAc: opt.isAc, price: opt.price, label: opt.label })}
                                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                                    isOptActive
                                      ? "bg-[#93B733] text-white border-[#93B733] shadow-xs"
                                      : "bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-[#93B733]"
                                  }`}
                                >
                                  <CoolingBadge isAc={opt.isAc} className={isOptActive ? "text-white" : ""} />
                                  <span>₹{opt.price.toLocaleString()}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* --- ACTION BUTTONS --- */}
                <div className="mt-4 sm:mt-6 space-y-2.5 sm:space-y-3">
                  
                  {bookingStatusMeta && (
                    <div className="rounded-xl sm:rounded-2xl border-2 border-emerald-400 dark:border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-500/10 p-3 sm:p-4 text-xs font-bold text-emerald-900 dark:text-emerald-200 shadow-xs">
                      <div className="flex items-center gap-1.5 sm:gap-2 font-black text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>{bookingStatusMeta.title}</span>
                      </div>
                      <p className="mt-1 text-[10px] sm:text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">{bookingStatusMeta.sub}</p>
                    </div>
                  )}

                  {/* Warning: Active stay at another PG blocks new bookings */}
                  {activeStayAtOtherPG && !existingBooking && (
                    <div className="rounded-xl sm:rounded-2xl border-2 border-amber-400 dark:border-amber-500/40 bg-amber-50/70 dark:bg-amber-500/10 p-3 sm:p-4 text-xs font-bold text-amber-900 dark:text-amber-200 shadow-xs">
                      <div className="flex items-center gap-1.5 sm:gap-2 font-black text-amber-800 dark:text-amber-300 text-xs sm:text-sm">
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>You Already Have an Active PG Stay</span>
                      </div>
                      <p className="mt-1 text-[10px] sm:text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                        You are currently staying at <strong>"{activeStayAtOtherPG.title || activeStayAtOtherPG.pg_name || 'another PG'}"</strong>. 
                        To book a new PG, please request a cancellation from your current PG owner first.
                      </p>
                      <button
                        onClick={() => navigate('/my-pg?action=account')}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 px-3 py-1.5 text-[11px] font-bold text-white transition cursor-pointer"
                      >
                        Request Cancellation →
                      </button>
                    </div>
                  )}

                  {(() => {
                    const spotsLeft = pg?.spots_left !== undefined ? pg.spots_left : Number(pg?.available_rooms || 0);
                    const isFullyBooked = spotsLeft <= 0 && !existingBooking;
                    const hasActiveStayElsewhere = !!activeStayAtOtherPG && !existingBooking;

                    return (
                      <button
                        onClick={handleBookVisit}
                        disabled={bookingLoading || isFullyBooked || hasActiveStayElsewhere}
                        className={`w-full rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm font-bold text-white shadow-md transition-all active:scale-[0.98] ${
                          isFullyBooked || hasActiveStayElsewhere
                            ? "bg-gray-400 dark:bg-gray-800 text-gray-200 cursor-not-allowed shadow-none"
                            : bookingLoading
                            ? "opacity-60 cursor-wait bg-[#93B733]"
                            : bookingStatusMeta
                            ? `${bookingStatusMeta.btnBg} cursor-pointer`
                            : "bg-[#93B733] hover:bg-[#82a32d] hover:shadow-lg cursor-pointer"
                        }`}
                      >
                        {bookingLoading
                          ? 'Submitting Request...'
                          : hasActiveStayElsewhere
                          ? 'Cancel Current Stay First'
                          : isFullyBooked
                          ? 'Fully Booked (0 Spots Left)'
                          : bookingStatusMeta
                          ? bookingStatusMeta.btnText
                          : 'Request a Visit / Book Now'}
                      </button>
                    );
                  })()}

                  {/* Inline visit calendar — appears right below the Request a Visit button */}
                  {showVisitPicker && (
                    <VisitSchedulePicker
                      loading={bookingLoading}
                      onCancel={() => setShowVisitPicker(false)}
                      onConfirm={handleConfirmVisit}
                    />
                  )}

                  <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-0.5 sm:pt-1">
                    {/* WhatsApp Button */}
                    <button
                      onClick={handleWhatsAppRedirect}
                      className="group relative flex flex-col items-center justify-center p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border-2 border-emerald-500/40 dark:border-emerald-500/30 bg-white dark:bg-black hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 hover:border-[#25D366] dark:hover:border-[#25D366] shadow-xs transition-all duration-200 active:scale-[0.98] cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <img 
                          src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" 
                          alt="WhatsApp" 
                          className="h-[16px] w-[16px] sm:h-[20px] sm:w-[20px] object-contain shrink-0"
                          loading="lazy"
                          decoding="async"
                        />
                        <span className="text-[11px] sm:text-xs font-black text-gray-900 dark:text-white tracking-tight">WhatsApp</span>
                      </div>
                      <span className="mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] font-bold text-[#25D366] truncate max-w-full">
                        {displayPhone || "Chat Directly"}
                      </span>
                    </button>

                    {/* Call Owner Button */}
                    <button
                      onClick={handleCallRedirect}
                      className="group relative flex flex-col items-center justify-center p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border-2 border-blue-500/40 dark:border-blue-500/30 bg-white dark:bg-black hover:bg-blue-50/50 dark:hover:bg-blue-950/20 hover:border-[#0066FF] dark:hover:border-[#0066FF] shadow-xs transition-all duration-200 active:scale-[0.98] cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="flex h-[16px] w-[16px] sm:h-[20px] sm:w-[20px] items-center justify-center rounded-full bg-[#0066FF] text-white shadow-xs shrink-0">
                          <Phone size={9} className="text-white fill-white sm:hidden" />
                          <Phone size={11} className="text-white fill-white hidden sm:inline" />
                        </span>
                        <span className="text-[11px] sm:text-xs font-black text-gray-900 dark:text-white tracking-tight">Call Owner</span>
                      </div>
                      <span className="mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] font-bold text-[#0066FF] dark:text-[#38bdf8] truncate max-w-full">
                        {displayPhone || "Direct Phone"}
                      </span>
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 sm:mt-6 rounded-lg sm:rounded-xl bg-gray-50 dark:bg-white/[0.04] p-2.5 sm:p-3.5 text-center text-[11px] sm:text-xs font-medium text-gray-500 dark:text-gray-400">
                  Owner Contact: <span className="font-black text-[#0D3A1D] dark:text-[#93B733]">{displayPhone || "Available upon request"}</span>
                </div>

                {/* Share / Copy Public Link Section */}
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-white/[0.04] hover:bg-gray-100 dark:hover:bg-white/10 py-2 sm:py-2.5 px-2.5 sm:px-3 text-[11px] sm:text-xs font-bold text-gray-800 dark:text-gray-200 transition cursor-pointer active:scale-[0.98]"
                  >
                    {copiedToast ? (
                      <>
                        <Check size={12} className="text-[#93B733]" />
                        <span className="text-[#93B733] font-black">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} className="text-gray-500" />
                        <span>Copy Public Link</span>
                      </>
                    )}
                  </button>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Check out ${pg?.title || 'this PG'} on Dormn: ${window.location.href}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg sm:rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 py-2 sm:py-2.5 px-2.5 sm:px-3.5 text-[11px] sm:text-xs font-bold text-[#128C7E] dark:text-[#25D366] transition cursor-pointer active:scale-[0.98]"
                    title="Share via WhatsApp"
                  >
                    <MessageSquare size={12} />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* What this place offers (Amenities) - Right Column */}
              <div className="rounded-2xl sm:rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0d0d0d] p-4 sm:p-6 shadow-sm md:rounded-[2.5rem] md:p-8 transition-colors">
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-white/10">
                  <div>
                    <h3 className="text-base sm:text-xl font-black text-[#3A2935] dark:text-white tracking-tight">
                      What this place offers
                    </h3>
                    <p className="text-[11px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
                      Included amenities & resident perks
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-extrabold bg-[#93B733]/15 text-[#3e5a0c] dark:text-[#93B733] border border-[#93B733]/30 whitespace-nowrap">
                    {cleanAmenities.length} Perks
                  </span>
                </div>

                {cleanAmenities.length > 0 ? (
                  <div className="mt-4 sm:mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                    {cleanAmenities.map((item, index) => {
                      const cfg = getAmenityConfig(item);
                      const IconComponent = cfg.icon;
                      return (
                        <div
                          key={index}
                          className="group relative flex items-center gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl border border-gray-200/80 dark:border-neutral-800/90 bg-gray-50/70 dark:bg-neutral-900/60 p-2.5 sm:p-3 transition-all duration-200 hover:border-[#93B733]/40 hover:bg-white dark:hover:bg-neutral-800/80 hover:shadow-xs"
                        >
                          <div className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl border ${cfg.bg} ${cfg.color} ${cfg.border} transition-transform duration-200 group-hover:scale-105`}>
                            <IconComponent className="h-4 w-4 sm:h-4.5 sm:w-4.5" strokeWidth={2.2} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs sm:text-sm font-bold tracking-tight text-gray-800 dark:text-gray-100 capitalize">
                              {item}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-4 text-xs sm:text-sm font-medium text-gray-400">
                    Standard verified amenities included.
                  </p>
                )}
              </div>

              {/* Map / Location Card */}
              <div className="rounded-2xl sm:rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0d0d0d] p-4 sm:p-6 shadow-sm md:rounded-[2.5rem] md:p-8">
                <h3 className="text-base sm:text-xl font-black text-[#3A2935] dark:text-white">Exact Location</h3>
                <p className="mt-1.5 sm:mt-3 text-xs sm:text-sm font-medium leading-relaxed text-gray-600 dark:text-gray-300">
                  {pg.address || `${pg.area || ""}, ${pg.city || ""}`}
                </p>

                {pg.google_map_link ? (
                  <a
                    href={pg.google_map_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 sm:mt-5 flex w-full items-center justify-center gap-2 rounded-lg sm:rounded-xl bg-gray-900 dark:bg-white dark:text-black px-4 py-2.5 sm:px-5 sm:py-3.5 text-xs sm:text-sm font-bold text-white transition hover:bg-gray-800"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white dark:text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                    Open Google Maps
                  </a>
                ) : (
                  <div className="mt-3 sm:mt-5 rounded-lg sm:rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#151515] p-2.5 sm:p-3.5 text-center text-xs sm:text-sm font-bold text-gray-400">
                    Map location not provided
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>

        {/* ── ADVERTISEMENT BANNER (Moved to the very bottom / last of page) ── */}
        <div className="mt-6 sm:mt-10 rounded-2xl sm:rounded-[2.5rem] border-2 border-dashed border-gray-300 dark:border-gray-800 bg-gray-50/80 dark:bg-[#0d0d0d] p-5 sm:p-8 text-center transition-colors hover:border-gray-400">
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Advertisement
          </p>
          <h3 className="mt-1 sm:mt-2 text-base sm:text-xl font-black text-[#3A2935] dark:text-white">
            Promote Your PG
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Reach thousands of students and working professionals looking for verified accommodations.
          </p>
          <button className="mt-3 sm:mt-4 rounded-xl border-2 border-[#3A2935] dark:border-white bg-white dark:bg-[#111] px-5 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm font-bold text-[#3A2935] dark:text-white transition hover:bg-[#3A2935] hover:text-white cursor-pointer active:scale-95">
            Learn More
          </button>
        </div>
      </section>

      {/* ── MODALS ── */}
      {bookingSuccessModal && (
        <BookingSuccessModal
          pgTitle={pg.title}
          roomLabel={selectedRoom.label}
          price={currentRoomPrice}
          visitDate={scheduledVisit.date}
          visitTime={scheduledVisit.time}
          onClose={() => setBookingSuccessModal(false)}
          onTrack={() => navigate("/my-bookings")}
        />
      )}

      {showAuthModal && (
        <AuthPromptModal
          pgId={id}
          onClose={() => setShowAuthModal(false)}
          onLogin={() => navigate("/auth?redirect=" + encodeURIComponent(`/pg/${id}`))}
        />
      )}

      {/* Email Verification Modal (10-minute validity) */}
      <EmailVerificationModal
        isOpen={showEmailVerificationModal}
        onClose={() => setShowEmailVerificationModal(false)}
        userEmail={user?.email}
        title="Verify your email to book PG"
        description="Please verify your email with the 6-digit OTP to complete booking this PG."
        onSuccess={() => {
          setShowEmailVerificationModal(false);
          // Automatically re-trigger booking visit once email is verified!
          setTimeout(() => {
            handleBookVisit();
          }, 300);
        }}
      />
    </div>
  );
};

// ── MEMOIZED MODAL SUBCOMPONENTS (Optimized to avoid re-rendering on parent carousel/scroll) ──

const BookingSuccessModal = ({ pgTitle, roomLabel, price, visitDate, visitTime, onClose, onTrack }) => (
  <div 
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
    onClick={onClose}
  >
    <div 
      className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border-2 border-emerald-500/40 bg-white dark:bg-[#111111] p-6 sm:p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition"
      >
        <X size={20} />
      </button>

      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-emerald-500 to-[#93B733] text-white shadow-lg shadow-emerald-500/25 mb-4">
        <Sparkles className="w-10 h-10 text-white" />
      </div>

      <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
        Request Sent Successfully!
      </h3>
      <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 mt-2 max-w-md mx-auto leading-relaxed">
        Your visit / booking application for <strong className="text-[#0D3A1D] dark:text-[#93B733]">{pgTitle}</strong> has been received by the property owner.
      </p>

      <div className="mt-6 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.03] p-4 text-left space-y-2.5 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-white/10">
          <span className="font-semibold text-gray-500 dark:text-gray-400">Selected Room</span>
          <span className="font-black text-gray-900 dark:text-white">{roomLabel || "Base Room"}</span>
        </div>
        <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-white/10">
          <span className="font-semibold text-gray-500 dark:text-gray-400">Monthly Rent</span>
          <span className="font-black text-[#0D3A1D] dark:text-[#93B733]">₹{price?.toLocaleString()} / mo</span>
        </div>
        {visitDate && visitTime && (
          <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-white/10">
            <span className="font-semibold text-gray-500 dark:text-gray-400">Visit Scheduled</span>
            <span className="inline-flex items-center gap-1 font-black text-gray-900 dark:text-white">
              <Clock size={12} className="text-[#93B733]" />
              {formatVisitDate(visitDate)} · {visitTime}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-500 dark:text-gray-400">Application Status</span>
          <span className="inline-flex items-center gap-1 font-extrabold text-amber-700 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider text-[10px]">
            <Clock size={12} /> Under Owner Review
          </span>
        </div>
      </div>

      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-4 leading-relaxed">
        Once the owner approves your application, you can view your approval and access the resident stay dashboard.
      </p>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button
          onClick={onTrack}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#93B733] hover:bg-[#82a32d] px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
        >
          Track in My Requests <ChevronRight size={16} />
        </button>
        <button
          onClick={onClose}
          className="inline-flex items-center justify-center rounded-2xl border border-gray-300 dark:border-white/15 bg-white dark:bg-white/5 px-5 py-3.5 text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/10 transition"
        >
          Back to Details
        </button>
      </div>
    </div>
  </div>
);

const AuthPromptModal = ({ onClose, onLogin }) => (
  <div 
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
    onClick={onClose}
  >
    <div 
      className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111] p-6 sm:p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-white"
      >
        <X size={18} />
      </button>
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#93B733]/15 text-[#93B733] text-2xl mb-4">
        🔒
      </div>
      <h3 className="text-xl font-black text-gray-900 dark:text-white">
        Login Required
      </h3>
      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
        Please sign in or create an account to send a visit/booking request to the property owner.
      </p>
      <div className="mt-6 flex flex-col gap-2.5">
        <button
          onClick={onLogin}
          className="w-full rounded-xl bg-[#0D3A1D] hover:bg-[#16502a] py-3 text-xs font-bold text-white transition shadow-sm"
        >
          Log In / Register
        </button>
        <button
          onClick={onClose}
          className="w-full rounded-xl border border-gray-200 dark:border-white/10 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
);

export default PgDetails;
