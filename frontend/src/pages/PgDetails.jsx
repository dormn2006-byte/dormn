
import { useEffect, useState, useMemo, useContext, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API, { IMAGE_BASE_URL } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { formatDuration } from "../config/mediaLimits";
import AmenitiesModal from "../components/AmenitiesModal";
import EmailVerificationModal from "../components/auth/EmailVerificationModal";
import { isEmailVerified } from "../utils/verificationStorage";
import { calcStayDays, calcDailyPrice } from "../utils/shortStayUtils";
import { getPgFoodPreference } from "../utils/amenities";
import {
  Phone, MessageSquare, CheckCircle2, Clock, ChevronRight, ChevronLeft, ChevronDown,
  X, Sparkles, Building2, AlertCircle, ShieldCheck,
  Share2, Copy, Check, ArrowLeft, BedDouble, BedSingle, Snowflake, Wind, Flame,
  Wifi, Zap, UtensilsCrossed, Shirt, Bath, Car, Droplets, Dumbbell, Tv, PlayCircle,
  CalendarClock, KeyRound, CalendarCheck, CalendarRange, Tag, Apple
} from "lucide-react";
import {
  CheckInCalendarModal,
  ScheduleVisitModal,
  ShortStayCalendarModal,
  VisitSuccessModal,
  VisitAlreadyRequestedModal,
  ShortStaySuccessModal,
  ShortStayAlreadyRequestedModal,
  BookingSuccessModal,
  AuthPromptModal,
} from "./pgDetails/PgDetailsModals";

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

const MediaThumbnail = ({ item, index }) => {
  if (item.type === "video") {
    return (
      <div className="relative h-12 w-full bg-black sm:h-20 md:h-24">
        <video
          src={item.url}
          preload="metadata"
          muted
          playsInline
          className="pointer-events-none h-full w-full object-cover"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/35">
          <PlayCircle className="h-4 w-4 text-white drop-shadow sm:h-5 sm:w-5" />
        </span>
        {Number(item.duration) > 0 && (
          <span className="absolute bottom-0.5 right-0.5 rounded bg-black/75 px-1 py-px text-[8px] font-bold text-white sm:text-[9px]">
            {formatDuration(Number(item.duration))}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={item.url}
      alt={`preview ${index + 1}`}
      loading="lazy"
      decoding="async"
      className="h-12 w-full object-cover sm:h-20 md:h-24"
      onError={(e) => {
        e.currentTarget.src = DEFAULT_DETAILS_FALLBACKS[index % DEFAULT_DETAILS_FALLBACKS.length];
      }}
    />
  );
};


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

const CoolingBadge = ({ isAc, isOptActive = false, className = "" }) => (
  <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${isOptActive ? "text-black font-black" : "text-gray-800 dark:text-white"} ${className}`}>
    {isAc ? (
      <Snowflake className={`w-3.5 h-3.5 shrink-0 ${isOptActive ? "text-black" : "text-sky-500 dark:text-sky-400"}`} />
    ) : (
      <Wind className={`w-3.5 h-3.5 shrink-0 ${isOptActive ? "text-black" : "text-emerald-600 dark:text-[#bbf246]"}`} />
    )}
    <span className={isOptActive ? "text-black font-black" : "text-gray-800 dark:text-white font-bold"}>{isAc ? "AC Room" : "Non-AC"}</span>
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
    } catch {
      parsed = null;
    }
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
  const [existingVisit, setExistingVisit] = useState(null);
  const [showAlreadyVisitedModal, setShowAlreadyVisitedModal] = useState(false);
  const [existingShortStay, setExistingShortStay] = useState(null);
  const [showAlreadyRequestedShortStayModal, setShowAlreadyRequestedShortStayModal] = useState(false);
  const [showShortStayModal, setShowShortStayModal] = useState(false);
  const [shortStayLoading, setShortStayLoading] = useState(false);
  const [shortStaySuccessModal, setShortStaySuccessModal] = useState(false);
  const [shortStaySuccessData, setShortStaySuccessData] = useState(null);
  // Track if user has an active stay at a DIFFERENT PG (blocks new bookings)
  const [activeStayAtOtherPG, setActiveStayAtOtherPG] = useState(null);

  // Check if current user already has a pending or active booking for this PG
  // AND check if they have an active stay at ANY other PG
  // AND check if they have an active scheduled visit or short stay for this PG
  useEffect(() => {
    const checkExistingBookingAndVisits = async () => {
      const token = localStorage.getItem("token");
      if (!token || !user) {
        setExistingBooking(null);
        setActiveStayAtOtherPG(null);
        setExistingVisit(null);
        setExistingShortStay(null);
        return;
      }
      try {
        const [bookRes, visitRes, shortStayRes] = await Promise.all([
          API.get("/bookings/my-bookings").catch(() => ({ data: [] })),
          API.get("/visits/my").catch(() => ({ data: { visits: [] } })),
          API.get("/short-stays/my").catch(() => ({ data: { shortStays: [] } })),
        ]);

        const list = bookRes.data?.bookings || bookRes.data || [];
        if (Array.isArray(list)) {
          // Check for existing booking at THIS PG
          const found = list.find(
            (b) => (Number(b.pg_id) === Number(id) || (b.title || b.pg_name || '').toLowerCase().trim() === (pg?.title || '').toLowerCase().trim()) && 
                   (b.status === "pending" || b.status === "approved" || b.payment_status === "paid")
          );
          setExistingBooking(found || null);

          // Check for active stay at a DIFFERENT PG
          const otherActiveStay = list.find(
            (b) => Number(b.pg_id) !== Number(id) &&
                   (b.status === 'approved' || b.payment_status === 'paid') &&
                   b.status !== 'cancelled'
          );
          setActiveStayAtOtherPG(otherActiveStay || null);
        }

        const visitList = visitRes.data?.visits || [];
        if (Array.isArray(visitList)) {
          const foundVisit = visitList.find(
            (v) => Number(v.pg_id) === Number(id) && (v.status === "pending" || v.status === "confirmed")
          );
          setExistingVisit(foundVisit || null);
        }

        const stayList = shortStayRes.data?.shortStays || [];
        if (Array.isArray(stayList)) {
          const foundStay = stayList.find(
            (s) => Number(s.pg_id) === Number(id) && (s.status === "pending" || s.status === "approved")
          );
          setExistingShortStay(foundStay || null);
        }
      } catch (err) {
        console.error("Check existing booking and visits error:", err);
      }
    };
    checkExistingBookingAndVisits();
  }, [id, user, pg?.title]);

  const bookingStatusMeta = useMemo(() => {
    if (!existingBooking) return null;
    const isApprovedUnpaid = existingBooking.status === 'approved' && existingBooking.payment_status !== 'paid';
    const isPaid = existingBooking.payment_status === 'paid';
    return {
      title: isApprovedUnpaid ? 'Booking Approved by Owner!' : isPaid ? 'Active Resident Stay' : 'Booking Request Under Review',
      sub: isApprovedUnpaid ? 'Your booking for this PG has been APPROVED by the owner! Pay rent now in My PG to unlock full portal access.' : isPaid ? 'You are currently an active resident at this PG.' : 'You have already submitted a booking request for this PG. Status: PENDING OWNER APPROVAL.',
      btnBg: isApprovedUnpaid ? 'bg-emerald-600 hover:bg-emerald-700' : isPaid ? 'bg-[#0D3A1D] hover:bg-[#092814]' : 'bg-amber-600 hover:bg-amber-700',
      btnText: isApprovedUnpaid ? 'Pay in My PG' : isPaid ? 'Resident Portal' : 'View Status',
      btnTextFull: isApprovedUnpaid ? 'Already Approved (Pay in My PG)' : isPaid ? 'Already Active Stay (Resident Portal)' : 'Already Requested (View Request Status)'
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
          if (
            pgData.status !== "approved" &&
            Number(user?.id) !== Number(pgData.owner_id) &&
            user?.role !== "admin" &&
            user?.role !== "superadmin"
          ) {
            setError(
              pgData.status === "removed"
                ? "This property listing has been delisted by administrator and is currently unavailable."
                : "This property listing is currently under review and is not publicly visible."
            );
            setPg(null);
            return;
          }

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
  }, [id, user]);

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

  const pgVideos = useMemo(() => {
    const list = Array.isArray(pg?.videos) ? pg.videos : [];

    return list
      .slice()
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map((video) => ({ ...video, url: formatImageUrl(video.video_url) }))
      .filter((video) => video.url);
  }, [pg]);

  // Videos sit in the same gallery as the photos, listed after them so the
  // cover photo stays first.
  const mediaItems = useMemo(
    () => [
      ...galleryImages.map((url) => ({ type: "image", url })),
      ...pgVideos.map((video) => ({
        type: "video",
        url: video.url,
        duration: video.duration_seconds,
        poster: galleryImages[0] || null,
      })),
    ],
    [galleryImages, pgVideos]
  );

  const mediaCount = mediaItems.length;
const currentActiveIndex = mediaCount > 0
    ? ((activeImageIndex % mediaCount) + mediaCount) % mediaCount
    : 0;
  const activeMedia = mediaItems[currentActiveIndex] || null;
  const displayActiveImage = activeMedia?.type === "image"
    ? activeMedia.url
    : galleryImages[0] || DEFAULT_DETAILS_FALLBACKS[0];

  
// Gallery Controls
  const showNextImage = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (mediaCount <= 1) return;
    setActiveImageIndex((prev) => (prev + 1) % mediaCount);
  };

  const showPreviousImage = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (mediaCount <= 1) return;
    setActiveImageIndex((prev) => (prev - 1 + mediaCount) % mediaCount);
  };

  // State for sleek Booking Success Modal & Auth prompt
  const [bookingSuccessModal, setBookingSuccessModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAmenitiesModal, setShowAmenitiesModal] = useState(false);
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
  const [verificationSource, setVerificationSource] = useState("check_in");
  const [copiedToast, setCopiedToast] = useState(false);
  const [isGalleryLoopPaused, setIsGalleryLoopPaused] = useState(false);

  // Check In & Visit Modal States
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [visitLoading, setVisitLoading] = useState(false);
  const [visitSuccessModal, setVisitSuccessModal] = useState(false);
  const [scheduledVisitInfo, setScheduledVisitInfo] = useState(null);
  const [chosenCheckInDate, setChosenCheckInDate] = useState(null);

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
  }, [pg]);

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

  // Handle Check In button click
  const handleCheckInClick = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setShowAuthModal(true);
      return;
    }

    if (user && !isEmailVerified(user)) {
      setVerificationSource("check_in");
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

    // Open Check-in Date Picker Modal
    setShowCheckInModal(true);
  };

  // Confirm Check-in and proceed to booking
  const handleConfirmCheckIn = async (selectedCheckInDate, promoData = null, durationMonths = 1) => {
    try {
      setBookingLoading(true);
      setChosenCheckInDate(selectedCheckInDate);
      await API.post("/bookings/create", {
        pg_id: Number(id),
        message: `Interested in checking in on ${selectedCheckInDate} for ${selectedRoom.label} for ${durationMonths} month${durationMonths > 1 ? 's' : ''}${promoData?.code ? ` (Promo: ${promoData.code})` : ''}`,
        selected_room_type: selectedRoom.label,
        booked_price: promoData?.final_amount || selectedRoom.price,
        check_in_date: selectedCheckInDate,
        duration_months: durationMonths,
        coupon_code: promoData?.code || null,
        discount_amount: promoData?.discount_applied || 0,
      });
      setExistingBooking({ 
        status: "pending", 
        pg_id: Number(id), 
        check_in_date: selectedCheckInDate,
        coupon_code: promoData?.code || null,
        discount_amount: promoData?.discount_applied || 0,
        booked_price: promoData?.final_amount || selectedRoom.price,
        duration_months: durationMonths,
      });
      setShowCheckInModal(false);
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

  // Handle Request a Visit button click
  const handleRequestVisitClick = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setShowAuthModal(true);
      return;
    }
    // If student already has an active visit request for this PG, show status modal
    if (existingVisit && (existingVisit.status === "pending" || existingVisit.status === "confirmed")) {
      setShowAlreadyVisitedModal(true);
      return;
    }
    setShowVisitModal(true);
  };

  // Confirm visit request submission
  const handleConfirmVisit = async ({
    visitDate,
    visitTimeSlot,
    studentName,
    studentPhone,
    studentEmail,
    notes,
  }) => {
    try {
      setVisitLoading(true);
      await API.post("/visits", {
        pg_id: Number(id),
        visit_date: visitDate,
        visit_time_slot: visitTimeSlot,
        student_name: studentName,
        student_phone: studentPhone,
        student_email: studentEmail,
        notes: notes,
      });
      setExistingVisit({
        pg_id: Number(id),
        visit_date: visitDate,
        visit_time_slot: visitTimeSlot,
        status: "pending",
      });
      setScheduledVisitInfo({
        visitDate,
        visitTimeSlot,
        pgTitle: pg?.title,
      });
      setShowVisitModal(false);
      setVisitSuccessModal(true);
    } catch (error) {
      console.error("Visit Request Error:", error);
      if (error?.response?.data?.code === "VISIT_ALREADY_REQUESTED") {
        setExistingVisit(error?.response?.data?.existingVisit || {
          pg_id: Number(id),
          visit_date: visitDate,
          visit_time_slot: visitTimeSlot,
          status: "pending",
        });
        setShowVisitModal(false);
        setShowAlreadyVisitedModal(true);
        return;
      }
      alert(error?.response?.data?.message || "Failed to schedule visit. Please try again.");
    } finally {
      setVisitLoading(false);
    }
  };

  // Handle Short Stay button click
  const handleShortStayClick = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setShowAuthModal(true);
      return;
    }

    if (user && !isEmailVerified(user)) {
      setVerificationSource("short_stay");
      setShowEmailVerificationModal(true);
      return;
    }

    // If student already has an active short stay request for this PG, show status modal
    if (existingShortStay && (existingShortStay.status === "pending" || existingShortStay.status === "approved")) {
      setShowAlreadyRequestedShortStayModal(true);
      return;
    }
    setShowShortStayModal(true);
  };

  // Confirm Short Stay request submission
  const handleConfirmShortStay = async ({
    checkInDate,
    checkOutDate,
    totalDays,
    roomType,
    isAc,
    guestCount,
    dailyPrice,
    totalAmount,
    studentName,
    studentPhone,
    studentEmail,
    purpose,
  }) => {
    try {
      setShortStayLoading(true);
      const res = await API.post("/short-stays", {
        pg_id: Number(id),
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        room_type: roomType,
        is_ac: isAc,
        guest_count: guestCount,
        daily_price: dailyPrice,
        student_name: studentName,
        student_phone: studentPhone,
        student_email: studentEmail,
        purpose: purpose,
      });

      const newStay = {
        id: res.data?.shortStayId,
        pg_id: Number(id),
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        total_days: totalDays,
        room_type: roomType,
        is_ac: isAc,
        daily_price: dailyPrice,
        total_amount: totalAmount,
        status: "pending",
      };

      setExistingShortStay(newStay);
      setShortStaySuccessData({
        ...newStay,
        pgTitle: pg?.title,
      });
      setShowShortStayModal(false);
      setShortStaySuccessModal(true);
    } catch (error) {
      console.error("Short Stay Request Error:", error);
      if (error?.response?.data?.code === "EMAIL_NOT_VERIFIED") {
        setShowShortStayModal(false);
        setVerificationSource("short_stay");
        setShowEmailVerificationModal(true);
        return;
      }
      if (error?.response?.data?.code === "SHORT_STAY_ALREADY_REQUESTED") {
        setExistingShortStay(error?.response?.data?.existingStay || {
          pg_id: Number(id),
          check_in_date: checkInDate,
          check_out_date: checkOutDate,
          status: "pending",
        });
        setShowShortStayModal(false);
        setShowAlreadyRequestedShortStayModal(true);
        return;
      }
      alert(error?.response?.data?.message || "Failed to submit short stay request. Please try again.");
    } finally {
      setShortStayLoading(false);
    }
  };

  const [mainImageLoaded, setMainImageLoaded] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#000000] font-sans selection:bg-[#93B733] selection:text-white pb-20">
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
    <div className="min-h-screen overflow-x-hidden bg-[#FAF9F5] dark:bg-[#000000] text-[#3A2935] dark:text-white font-sans pb-14 sm:pb-20">
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
      <section className="relative z-10 mx-auto max-w-[1440px] 2xl:max-w-[1600px] px-2.5 py-2.5 sm:px-6 md:px-8 lg:px-10 md:py-6">
        
        {/* Top Header: Back Button, Title, PG Type, Rating, Status & Address (Above Image) */}
        <div className="mb-2.5 sm:mb-5">
          <div className="flex items-center justify-between gap-2 mb-1.5 sm:mb-2.5">
            <button
              type="button"
              onClick={handleBack}
              className="group inline-flex items-center gap-1.5 sm:gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111625] px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 shadow-sm transition-all hover:border-[#93B733] hover:text-[#0D3A1D] dark:hover:text-[#93B733] active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover:-translate-x-0.5 text-gray-500 group-hover:text-[#93B733]" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {pg.sponsored && (
                <span className="rounded-md sm:rounded-lg bg-[#93B733]/10 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[8.5px] sm:text-[10px] font-bold uppercase tracking-wider text-[#93B733]">
                  Sponsored
                </span>
              )}
              
              <span className="rounded-md sm:rounded-lg bg-gray-100 dark:bg-white/10 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[8.5px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                {pg.status || "Active"}
              </span>

              {/* Share Property Button */}
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111625] hover:bg-gray-100 px-2 py-1 sm:px-3 sm:py-1.5 text-[9.5px] sm:text-xs font-bold text-gray-800 dark:text-gray-200 transition cursor-pointer active:scale-95 shadow-xs"
              >
                <Share2 size={11} className="text-[#93B733] shrink-0" />
                <span>{copiedToast ? "Copied!" : "Share"}</span>
              </button>
            </div>
          </div>

          {/* PG Title, Type, Rating & Food Preference */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-lg sm:text-3xl font-black tracking-tight text-[#3A2935] dark:text-white md:text-4xl">
              {pg.title}
            </h1>
            <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl border border-[#93B733]/40 bg-[#93B733]/15 text-[#2c4406] dark:text-[#bbf246] px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-xs">
              <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#93B733] shrink-0" />
              <span>{String(pg.pg_type || "PG").toUpperCase()}</span>
            </span>

            {/* Food Type Badge (Veg / Non-Veg) */}
            {(() => {
              const food = getPgFoodPreference(pg);
              if (food.type === "Veg") {
                return (
                  <span className="inline-flex items-center gap-1.5 rounded-lg sm:rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <UtensilsCrossed className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Veg</span>
                  </span>
                );
              }
              return (
                <span className="inline-flex items-center gap-1.5 rounded-lg sm:rounded-xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-amber-700 shrink-0"></span>
                  <UtensilsCrossed className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Non-Veg</span>
                </span>
              );
            })()}

            <div className="inline-flex items-center gap-1 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-white/[0.04] px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-bold text-[#3A2935] dark:text-white">
              <span className="text-[#93B733]">★</span> {pg.rating || "New"}
            </div>
          </div>

          {/* Address */}
          <p className="mt-1 sm:mt-1.5 text-[11px] sm:text-sm font-medium text-gray-500 md:text-base flex items-center gap-1 sm:gap-1.5">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#93B733] shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            {`${pg.area || ""}, ${pg.city || ""}`}
          </p>
        </div>

        <div className="grid gap-2.5 sm:gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-12">
          
          {/* LEFT SIDE: Details & Gallery */}
          <div className="flex flex-col gap-2.5 sm:gap-8">
            
            {/* Gallery (Bento Box Style) */}
            <div className="rounded-xl sm:rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0d0d0d] p-1 sm:p-2 md:rounded-[2.5rem] md:p-3 shadow-sm">
              <div className="relative overflow-hidden rounded-lg sm:rounded-[1.5rem] md:rounded-[2rem] bg-gray-200 dark:bg-gray-800">
                
                {/* Dormn Verified PG Badge - Top Left */}
                <div className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 z-20 flex items-center gap-1 sm:gap-1.5 rounded-full bg-[#0D3A1D]/90 dark:bg-black/85 backdrop-blur-md px-2.5 py-1 sm:px-3.5 sm:py-1.5 border border-[#93B733]/50 shadow-md">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#93B733] shrink-0" />
                  <span className="text-[9.5px] sm:text-xs font-black tracking-wide text-white uppercase">
                    Dormn Verified PG
                  </span>
                </div>

                {/* Backside Shimmer Skeleton */}
                {!mainImageLoaded && (
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse z-0" />
                )}

                {activeMedia?.type === "video" ? (
                  <video
                    key={activeMedia.url}
                    src={activeMedia.url}
                    poster={activeMedia.poster || undefined}
                    controls
                    playsInline
                    preload="metadata"
                    onLoadedMetadata={() => setMainImageLoaded(true)}
                    className={`h-[190px] sm:h-[360px] md:h-[480px] w-full bg-black object-contain transition-all duration-700 ${
                      mainImageLoaded ? "opacity-100" : "opacity-0"
                    }`}
                  />
                ) : (
                  <img
                    src={displayActiveImage}
                    alt="PG"
                    onLoad={() => setMainImageLoaded(true)}
                    className={`h-[190px] sm:h-[360px] md:h-[480px] w-full object-cover transition-all duration-700 hover:scale-105 ${
                      mainImageLoaded ? "opacity-100" : "opacity-0"
                    }`}
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_DETAILS_FALLBACKS[0];
                      setMainImageLoaded(true);
                    }}
                  />
                )}
                {mediaCount > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={showPreviousImage}
                      aria-label="Previous Image"
                      className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-gray-800 shadow-md transition-all hover:bg-white hover:scale-110 active:scale-95 cursor-pointer"
                    >
                      <ChevronLeft className="h-3.5 w-3.5 sm:h-5 sm:w-5 stroke-[2.5]" />
                    </button>

                    <button
                      type="button"
                      onClick={showNextImage}
                      aria-label="Next Image"
                      className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-gray-800 shadow-md transition-all hover:bg-white hover:scale-110 active:scale-95 cursor-pointer"
                    >
                      <ChevronRight className="h-3.5 w-3.5 sm:h-5 sm:w-5 stroke-[2.5]" />
                    </button>

                    <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 z-20 rounded-full bg-black/70 backdrop-blur-sm px-2 py-0.5 sm:px-3 sm:py-1 text-[9px] sm:text-xs font-semibold text-white">
                      {currentActiveIndex + 1} / {mediaCount}
                    </div>
                  </>
                )}
              </div>

              {/* Single Section Thumbnail Strip: Static 4-col when <= 4, infinite loop marquee moving left when > 4 */}
              {mediaCount <= 4 ? (
                <div className="mt-1 sm:mt-2 md:mt-3 grid grid-cols-4 gap-1 sm:gap-2 md:gap-3">
                  {mediaItems.map((item, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setActiveImageIndex(index)}
                      className={`overflow-hidden rounded-md sm:rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                        currentActiveIndex === index
                          ? "border-[#93B733] shadow-md opacity-100 ring-2 ring-[#93B733]/40 scale-[1.02]"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <MediaThumbnail item={item} index={index} />
                    </button>
                  ))}
                </div>
              ) : (
                <div 
                  className="thumbnail-marquee-container mt-1 sm:mt-2 md:mt-3 overflow-hidden rounded-md sm:rounded-xl"
                  onMouseEnter={() => setIsGalleryLoopPaused(true)}
                  onMouseLeave={() => setIsGalleryLoopPaused(false)}
                  onTouchStart={() => setIsGalleryLoopPaused(true)}
                  onTouchEnd={() => setIsGalleryLoopPaused(false)}
                >
                  <div 
                    className="thumbnail-marquee-track gap-1 sm:gap-2 md:gap-3 py-0.5"
                    style={{
                      animationPlayState: isGalleryLoopPaused ? "paused" : "running",
                      animationDuration: `${Math.max(mediaCount * 2.2, 16)}s`
                    }}
                  >
                    {[...mediaItems, ...mediaItems].map((item, index) => {
                      const realIndex = index % mediaCount;
                      const isSelected = currentActiveIndex === realIndex;
                      return (
                        <button
                          key={`${realIndex}-${index >= mediaCount ? 'dup' : 'orig'}`}
                          type="button"
                          onClick={() => setActiveImageIndex(realIndex)}
                          className={`thumbnail-marquee-item overflow-hidden rounded-md sm:rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? "border-[#93B733] shadow-md opacity-100 ring-2 ring-[#93B733]/40 scale-[1.02]"
                              : "border-transparent opacity-75 hover:opacity-100"
                          }`}
                        >
                          <MediaThumbnail item={item} index={realIndex} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* About / Description Card (Desktop) */}
            <div className="hidden lg:block rounded-xl sm:rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0d0d0d] p-4 sm:p-6 shadow-sm md:rounded-[2.5rem] md:p-8">
              <h3 className="text-base sm:text-xl font-black text-[#3A2935] dark:text-white tracking-tight mb-2 sm:mb-4">
                About this PG
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-gray-600 dark:text-gray-300 md:text-base md:leading-8 whitespace-pre-line">
                {pg.description || "No description provided for this listing."}
              </p>
            </div>

          </div>

          {/* RIGHT SIDE: Booking, Amenities & Actions */}
          <div className="space-y-2.5 sm:space-y-6">
            
            {/* Container for right sidebar */}
            <div className="space-y-2.5 sm:space-y-6">
              
              {/* Pricing & Booking Card */}
              <div id="booking-card" className="rounded-xl sm:rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0d0d0d] p-3 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] md:rounded-[2.5rem] md:p-8">
                <div className="flex items-end justify-between border-b-2 border-gray-100 dark:border-gray-800 pb-2.5 sm:pb-6">
                  <div>
                    <h4 className="text-xl sm:text-3xl font-black text-[#93B733]">
                      ₹{selectedRoom.price ? selectedRoom.price.toLocaleString() : Number(pg.price || 0).toLocaleString()}
                    </h4>
                    <p className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 mt-0.5 sm:mt-1 flex items-center gap-1">
                      <span className="text-gray-500 dark:text-gray-400 font-bold">Selected:</span>
                      <span className="text-gray-900 dark:text-white font-black">{selectedRoom.label || "Per Month"}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-[11px] sm:text-sm font-black text-gray-800 dark:text-white uppercase tracking-wider">{String(pg.pg_type || "").toUpperCase()} PG</h3>
                    <div className="mt-0.5 sm:mt-1 flex items-center justify-end">
                      {(() => {
                        const spotsLeft = pg?.spots_left !== undefined ? pg.spots_left : Number(pg?.available_rooms || 0);
                        return (
                          <span className={`inline-flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-black px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl border ${
                            spotsLeft === 0
                              ? "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40"
                              : spotsLeft <= 3
                              ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40 animate-pulse"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40"
                          }`}>
                            {spotsLeft === 0 ? (
                              <>
                                <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                <span>Fully Booked</span>
                              </>
                            ) : (
                              <>
                                <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 fill-amber-500" />
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
                <div className="mt-2.5 sm:mt-6 border-b-2 border-gray-100 dark:border-gray-800 pb-2.5 sm:pb-6">
                  <div className="flex items-center justify-between mb-1.5 sm:mb-3">
                    <h3 className="font-black text-[11px] sm:text-sm text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1 sm:gap-1.5">
                      <BedDouble className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#4E700F] dark:text-[#bbf246]" />
                      <span>Available Rooms & Sharing</span>
                    </h3>
                    <span className="text-[9.5px] sm:text-xs font-black text-[#4E700F] dark:text-[#bbf246]">
                      {availableRooms.length} {availableRooms.length === 1 ? 'type' : 'types'}
                    </span>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    {availableRooms.map((room) => {
                      const isSelected = selectedRoom.type === room.type;
                      return (
                        <div
                          key={room.type}
                          className={`rounded-lg sm:rounded-xl border p-2 sm:p-2.5 transition-all ${
                            isSelected
                              ? "border-[#93B733] dark:border-[#bbf246] bg-[#93B733]/5 dark:bg-[#bbf246]/10 shadow-xs"
                              : "border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.03]"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1 sm:mb-1.5 text-[11px] sm:text-xs font-black text-gray-900 dark:text-white">
                            <span className="flex items-center gap-1 sm:gap-1.5 capitalize">
                              {room.type === "single" ? <BedSingle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#4E700F] dark:text-[#bbf246]" /> : <BedDouble className="w-3.5 h-3.5 text-[#4E700F] dark:text-[#bbf246]" />}
                              {room.title}
                            </span>
                            <span className="text-[8.5px] sm:text-[9px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-200">
                              {room.badge}
                            </span>
                          </div>

                          <div className={`grid gap-1 sm:gap-1.5 ${room.options.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                            {room.options.map((opt) => {
                              const isOptActive = isSelected && selectedRoom.isAc === opt.isAc;
                              return (
                                <button
                                  key={opt.label}
                                  type="button"
                                  onClick={() => setSelectedRoom({ type: room.type, isAc: opt.isAc, price: opt.price, label: opt.label })}
                                  className={`flex items-center justify-between px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md sm:rounded-lg border text-[10px] sm:text-[11px] font-black transition-all cursor-pointer ${
                                    isOptActive
                                      ? "bg-[#93B733] text-black border-[#93B733] shadow-xs"
                                      : "bg-white dark:bg-white/5 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-white/10 hover:border-[#93B733]"
                                  }`}
                                >
                                  <CoolingBadge isAc={opt.isAc} isOptActive={isOptActive} />
                                  <span className={isOptActive ? "text-black font-black" : "text-gray-900 dark:text-white font-bold"}>
                                    ₹{opt.price.toLocaleString()}
                                  </span>
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
                <div className="mt-2.5 sm:mt-6 space-y-1.5 sm:space-y-3">
                  
                  {bookingStatusMeta && (
                    <div className="rounded-lg sm:rounded-2xl border-2 border-emerald-400 dark:border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-500/10 p-2 sm:p-4 text-xs font-bold text-emerald-900 dark:text-emerald-200 shadow-xs">
                      <div className="flex items-center gap-1.5 sm:gap-2 font-black text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>{bookingStatusMeta.title}</span>
                      </div>
                      <p className="mt-0.5 sm:mt-1 text-[9.5px] sm:text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 leading-snug">{bookingStatusMeta.sub}</p>
                    </div>
                  )}

                  {/* Warning: Active stay at another PG blocks new bookings */}
                  {activeStayAtOtherPG && !existingBooking && (
                    <div className="rounded-lg sm:rounded-2xl border-2 border-amber-400 dark:border-amber-500/40 bg-amber-50/70 dark:bg-amber-500/10 p-2 sm:p-4 text-xs font-bold text-amber-900 dark:text-amber-200 shadow-xs">
                      <div className="flex items-center gap-1.5 sm:gap-2 font-black text-amber-800 dark:text-amber-300 text-xs sm:text-sm">
                        <AlertCircle className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>You Already Have an Active PG Stay</span>
                      </div>
                      <p className="mt-0.5 sm:mt-1 text-[9.5px] sm:text-[11px] font-semibold text-amber-700 dark:text-amber-300 leading-snug">
                        You are currently staying at <strong>"{activeStayAtOtherPG.title || activeStayAtOtherPG.pg_name || 'another PG'}"</strong>. 
                        To book a new PG, please request a cancellation from your current PG owner first.
                      </p>
                      <button
                        onClick={() => navigate('/my-pg?action=account')}
                        className="mt-1.5 sm:mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 px-2.5 py-1 text-[10px] sm:text-[11px] font-bold text-white transition cursor-pointer"
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
                      <div className="space-y-1.5 sm:space-y-2">
                        <div className="grid grid-cols-2 gap-1.5 sm:gap-2.5">
                          {/* Button 1: Check In / Active Stay Portal */}
                          <button
                            onClick={handleCheckInClick}
                            disabled={bookingLoading || isFullyBooked || hasActiveStayElsewhere}
                            className={`w-full flex items-center justify-center gap-1 sm:gap-2 rounded-lg sm:rounded-2xl px-2 py-2 sm:px-4 sm:py-3.5 text-[10.5px] sm:text-sm font-black shadow-xs sm:shadow-md transition-all active:scale-[0.98] ${
                              isFullyBooked || hasActiveStayElsewhere
                                ? "bg-gray-400 dark:bg-gray-800 text-gray-200 cursor-not-allowed shadow-none"
                                : bookingLoading
                                ? "opacity-60 cursor-wait bg-[#93B733] text-black"
                                : bookingStatusMeta
                                ? `${bookingStatusMeta.btnBg} text-white cursor-pointer`
                                : "bg-[#93B733] hover:bg-[#82a32d] text-black hover:shadow-lg cursor-pointer"
                            }`}
                          >
                            <KeyRound className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${bookingStatusMeta ? "text-white" : "text-black"}`} />
                            <span className={`font-black truncate ${bookingStatusMeta ? "text-white" : "text-black"}`}>
                              {bookingLoading ? (
                                'Submitting...'
                              ) : hasActiveStayElsewhere ? (
                                'Cancel Stay'
                              ) : isFullyBooked ? (
                                'Fully Booked'
                              ) : bookingStatusMeta ? (
                                <>
                                  <span className="sm:hidden">{bookingStatusMeta.btnText}</span>
                                  <span className="hidden sm:inline">{bookingStatusMeta.btnTextFull || bookingStatusMeta.btnText}</span>
                                </>
                              ) : (
                                'Check In'
                              )}
                            </span>
                          </button>

                          {/* Button 2: Request a Visit */}
                          <button
                            onClick={handleRequestVisitClick}
                            disabled={isFullyBooked || hasActiveStayElsewhere}
                            className={`w-full flex items-center justify-center gap-1 sm:gap-2 rounded-lg sm:rounded-2xl px-2 py-2 sm:px-4 sm:py-3.5 text-[10.5px] sm:text-sm font-black shadow-xs transition-all active:scale-[0.98] ${
                              isFullyBooked || hasActiveStayElsewhere
                                ? "border border-gray-300 dark:border-gray-800 text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-900 cursor-not-allowed"
                                : existingVisit?.status === "confirmed"
                                ? "border-2 border-blue-500 bg-blue-500 hover:bg-blue-600 text-white cursor-pointer shadow-md"
                                : existingVisit?.status === "pending"
                                ? "border-2 border-amber-500 bg-amber-500/15 dark:bg-amber-500/25 text-amber-800 dark:text-amber-300 hover:bg-amber-500/25 cursor-pointer"
                                : "border-2 border-[#93B733] bg-white dark:bg-[#151515] text-[#0D3A1D] dark:text-[#bbf246] hover:bg-[#93B733]/15 hover:border-[#82a32d] cursor-pointer"
                            }`}
                          >
                            {existingVisit?.status === "confirmed" ? (
                              <CalendarCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white shrink-0" />
                            ) : existingVisit?.status === "pending" ? (
                              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-700 dark:text-amber-300 shrink-0" />
                            ) : (
                              <CalendarClock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#93B733] dark:text-[#bbf246] shrink-0" />
                            )}
                            <span className={`truncate font-black ${existingVisit?.status === "confirmed" ? "text-white" : existingVisit?.status === "pending" ? "text-amber-900 dark:text-amber-300" : "text-[#0D3A1D] dark:text-[#bbf246]"}`}>
                              {existingVisit?.status === "confirmed"
                                ? "Visit Confirmed"
                                : existingVisit?.status === "pending"
                                ? "Visit Requested"
                                : "Request a Visit"}
                            </span>
                          </button>
                        </div>

                        {/* Button 3: Short Stay (4–5 Days / Daily Stay) */}
                        <button
                          onClick={handleShortStayClick}
                          className={`w-full flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-2xl px-2.5 py-2 sm:px-4 sm:py-3.5 text-[11px] sm:text-sm font-black shadow-xs transition-all active:scale-[0.98] cursor-pointer ${
                            existingShortStay?.status === "approved"
                              ? "border-2 border-emerald-500 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                              : existingShortStay?.status === "pending"
                              ? "border-2 border-amber-500 bg-amber-500/15 dark:bg-amber-500/25 text-amber-800 dark:text-amber-300 hover:bg-amber-500/25"
                              : "border-2 border-indigo-500/50 bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-300 hover:bg-indigo-100/90 dark:hover:bg-indigo-900/50 hover:border-indigo-600"
                          }`}
                        >
                          <CalendarRange className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${existingShortStay?.status === "approved" ? "text-white" : existingShortStay?.status === "pending" ? "text-amber-700 dark:text-amber-300" : "text-indigo-600 dark:text-indigo-400"}`} />
                          <span className="truncate">
                            {existingShortStay?.status === "approved" ? (
                              "Short Stay Approved! (View Details)"
                            ) : existingShortStay?.status === "pending" ? (
                              "Short Stay Requested (Waiting Review)"
                            ) : (
                              <>
                                <span className="sm:hidden">Need Short Stay? (Daily / 4-5 Days)</span>
                                <span className="hidden sm:inline">Need a Short Stay? (4–5 Days / Daily Stay)</span>
                              </>
                            )}
                          </span>
                        </button>
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-2 gap-1.5 sm:gap-3 pt-0.5 sm:pt-1">
                    {/* WhatsApp Button */}
                    <button
                      onClick={handleWhatsAppRedirect}
                      className="group relative flex flex-col items-center justify-center p-2 sm:p-3.5 rounded-lg sm:rounded-2xl border-2 border-emerald-500/40 dark:border-emerald-500/30 bg-white dark:bg-black hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 hover:border-[#25D366] dark:hover:border-[#25D366] shadow-xs transition-all duration-200 active:scale-[0.98] cursor-pointer"
                    >
                      <div className="flex items-center gap-1 sm:gap-2">
                        <img 
                          src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" 
                          alt="WhatsApp" 
                          className="h-[14px] w-[14px] sm:h-[20px] sm:w-[20px] object-contain shrink-0"
                          loading="lazy"
                          decoding="async"
                        />
                        <span className="text-[10px] sm:text-xs font-black text-gray-900 dark:text-white tracking-tight">WhatsApp</span>
                      </div>
                      <span className="mt-0.5 sm:mt-1 text-[9px] sm:text-[11px] font-bold text-[#25D366] truncate max-w-full">
                        {displayPhone || "Chat Directly"}
                      </span>
                    </button>

                    {/* Call Owner Button */}
                    <button
                      onClick={handleCallRedirect}
                      className="group relative flex flex-col items-center justify-center p-2 sm:p-3.5 rounded-lg sm:rounded-2xl border-2 border-blue-500/40 dark:border-blue-500/30 bg-white dark:bg-black hover:bg-blue-50/50 dark:hover:bg-blue-950/20 hover:border-[#0066FF] dark:hover:border-[#0066FF] shadow-xs transition-all duration-200 active:scale-[0.98] cursor-pointer"
                    >
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="flex h-[14px] w-[14px] sm:h-[20px] sm:w-[20px] items-center justify-center rounded-full bg-[#0066FF] text-white shadow-xs shrink-0">
                          <Phone size={8} className="text-white fill-white sm:hidden" />
                          <Phone size={11} className="text-white fill-white hidden sm:inline" />
                        </span>
                        <span className="text-[10px] sm:text-xs font-black text-gray-900 dark:text-white tracking-tight">Call Owner</span>
                      </div>
                      <span className="mt-0.5 sm:mt-1 text-[9px] sm:text-[11px] font-bold text-[#0066FF] dark:text-[#38bdf8] truncate max-w-full">
                        {displayPhone || "Direct Phone"}
                      </span>
                    </button>
                  </div>
                </div>
                
                <div className="mt-2.5 sm:mt-6 rounded-lg sm:rounded-xl bg-gray-50 dark:bg-white/[0.04] p-2 sm:p-3.5 text-center text-[10px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300">
                  Owner Contact: <span className="font-black text-gray-950 dark:text-[#bbf246]">{displayPhone || "Available upon request"}</span>
                </div>

                {/* Share / Copy Public Link Section */}
                <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex-1 inline-flex items-center justify-center gap-1 sm:gap-2 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-white/[0.04] hover:bg-gray-100 dark:hover:bg-white/10 py-1.5 sm:py-2.5 px-2 sm:px-3 text-[10px] sm:text-xs font-bold text-gray-800 dark:text-gray-200 transition cursor-pointer active:scale-[0.98]"
                  >
                    {copiedToast ? (
                      <>
                        <Check size={11} className="text-[#355008] dark:text-[#bbf246]" />
                        <span className="text-[#355008] dark:text-[#bbf246] font-black">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={11} className="text-gray-500 dark:text-gray-300" />
                        <span className="text-gray-800 dark:text-white font-bold">Copy Public Link</span>
                      </>
                    )}
                  </button>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Check out ${pg?.title || 'this PG'} on Dormn: ${window.location.href}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 py-1.5 sm:py-2.5 px-2.5 sm:px-3.5 text-[10px] sm:text-xs font-bold text-[#128C7E] dark:text-[#25D366] transition cursor-pointer active:scale-[0.98]"
                    title="Share via WhatsApp"
                  >
                    <MessageSquare size={11} />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Rules & Policies Section - Under Payment Section */}
              <div className="rounded-xl sm:rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0d0d0d] p-3 sm:p-6 shadow-sm md:rounded-[2.5rem] md:p-8 flex flex-col justify-start">
                <div className="flex items-center justify-between gap-2 pb-2 sm:pb-3 border-b border-gray-100 dark:border-white/10">
                  <div>
                    <h3 className="text-sm sm:text-xl font-black text-[#3A2935] dark:text-white tracking-tight">
                      Rules & Policies
                    </h3>
                    <p className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
                      House rules & property guidelines
                    </p>
                  </div>
                  <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9.5px] sm:text-xs font-extrabold bg-[#93B733]/15 text-[#3e5a0c] dark:text-[#93B733] border border-[#93B733]/30 whitespace-nowrap">
                    {cleanRules.length} {cleanRules.length === 1 ? 'Rule' : 'Rules'}
                  </span>
                </div>
                {cleanRules.length > 0 ? (
                  <div className="mt-2.5 sm:mt-4 space-y-1.5 sm:space-y-2.5">
                    {cleanRules.map((rule, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 sm:gap-3 rounded-lg sm:rounded-xl border border-gray-100 dark:border-gray-800/80 bg-gray-50 dark:bg-white/[0.04] px-2.5 py-1.5 sm:px-4 sm:py-2.5 text-[11px] sm:text-sm font-medium text-gray-700 dark:text-gray-200"
                      >
                        <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-[#93B733] shrink-0 mt-1 sm:mt-1.5"></span>
                        <span className="leading-snug sm:leading-relaxed">{rule}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 sm:mt-3 text-[11px] sm:text-sm font-medium text-gray-400">
                    Standard house rules apply.
                  </p>
                )}
              </div>

              {/* Food & Dining Preferences Section */}
              <div className="rounded-xl sm:rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0d0d0d] p-3 sm:p-6 shadow-sm md:rounded-[2.5rem] md:p-8">
                <div className="flex items-center justify-between gap-2 pb-2 sm:pb-3 border-b border-gray-100 dark:border-white/10">
                  <div>
                    <h3 className="text-sm sm:text-xl font-black text-[#3A2935] dark:text-white tracking-tight flex items-center gap-1.5 sm:gap-2">
                      <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5 text-[#93B733]" />
                      <span>Food & Diet Policy</span>
                    </h3>
                    <p className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
                      Meal options and dietary guidelines
                    </p>
                  </div>
                  {(() => {
                    const food = getPgFoodPreference(pg);
                    if (food.type === "Veg") {
                      return (
                        <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9.5px] sm:text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          <span>Veg 🟢</span>
                        </span>
                      );
                    }
                    return (
                      <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9.5px] sm:text-xs font-black bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-700"></span>
                        <span>Non-Veg 🟤</span>
                      </span>
                    );
                  })()}
                </div>

                <div className="mt-2.5 sm:mt-4 p-2.5 sm:p-4 rounded-xl border border-gray-100 dark:border-gray-800/80 bg-gray-50/70 dark:bg-white/[0.03] space-y-2">
                  {(() => {
                    const food = getPgFoodPreference(pg);
                    if (food.type === "Veg") {
                      return (
                        <div className="flex items-start gap-2.5">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                            <UtensilsCrossed size={16} />
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                              Pure Vegetarian Premises
                            </h4>
                            <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">
                              This PG serves pure vegetarian meals only. Non-vegetarian food is strictly prohibited on the premises.
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                          <UtensilsCrossed size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                            Non-Vegetarian Food Allowed
                          </h4>
                          <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">
                            Non-vegetarian meals and food are permitted and served in this PG according to the mess schedule.
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* What this place offers (Amenities) - Right Column */}
              <div className="rounded-xl sm:rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0d0d0d] p-3 sm:p-6 shadow-sm md:rounded-[2.5rem] md:p-8 transition-colors">
                <div className="flex items-center justify-between gap-2 sm:gap-3 pb-2 sm:pb-3 border-b border-gray-100 dark:border-white/10">
                  <div>
                    <h3 className="text-sm sm:text-xl font-black text-[#3A2935] dark:text-white tracking-tight">
                      What this place offers
                    </h3>
                    <p className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
                      Included amenities & resident perks
                    </p>
                  </div>
                  <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9.5px] sm:text-xs font-extrabold bg-[#93B733]/15 text-[#3e5a0c] dark:text-[#93B733] border border-[#93B733]/30 whitespace-nowrap">
                    {cleanAmenities.length} Perks
                  </span>
                </div>

                {cleanAmenities.length > 0 ? (
                  <div className="mt-2.5 sm:mt-5 grid grid-cols-2 sm:grid-cols-2 gap-1.5 sm:gap-2.5">
                    {cleanAmenities.map((item, index) => {
                      const cfg = getAmenityConfig(item);
                      const IconComponent = cfg.icon;
                      return (
                        <div
                          key={index}
                          className="group relative flex items-center gap-1.5 sm:gap-3 rounded-lg sm:rounded-2xl border border-gray-200/80 dark:border-neutral-800/90 bg-gray-50/70 dark:bg-neutral-900/60 p-1.5 sm:p-3 transition-all duration-200 hover:border-[#93B733]/40 hover:bg-white dark:hover:bg-neutral-800/80 hover:shadow-xs"
                        >
                          <div className={`flex h-6 w-6 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-md sm:rounded-xl border ${cfg.bg} ${cfg.color} ${cfg.border} transition-transform duration-200 group-hover:scale-105`}>
                            <IconComponent className="h-3 w-3 sm:h-4.5 sm:w-4.5" strokeWidth={2.2} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] sm:text-sm font-bold tracking-tight text-gray-800 dark:text-gray-100 capitalize leading-tight truncate">
                              {item}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-2 sm:mt-4 text-[11px] sm:text-sm font-medium text-gray-400">
                    Standard verified amenities included.
                  </p>
                )}
              </div>

              {/* About / Description Card (Mobile) */}
              <div className="lg:hidden rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0d0d0d] p-3 sm:p-6 shadow-sm">
                <h3 className="text-sm font-black text-[#3A2935] dark:text-white tracking-tight mb-1.5">
                  About this PG
                </h3>
                <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300 whitespace-pre-line">
                  {pg.description || "No description provided for this listing."}
                </p>
              </div>

              {/* Map / Location Card */}
              <div className="rounded-xl sm:rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0d0d0d] p-3 sm:p-6 shadow-sm md:rounded-[2.5rem] md:p-8">
                <h3 className="text-sm sm:text-xl font-black text-[#3A2935] dark:text-white">Exact Location</h3>
                <p className="mt-1 sm:mt-3 text-[11px] sm:text-sm font-medium leading-relaxed text-gray-600 dark:text-gray-300">
                  {pg.address || `${pg.area || ""}, ${pg.city || ""}`}
                </p>

                {pg.google_map_link ? (
                  <a
                    href={pg.google_map_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2.5 sm:mt-5 flex w-full items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl bg-gray-900 dark:bg-white dark:text-black px-3 py-2 sm:px-5 sm:py-3.5 text-xs sm:text-sm font-bold text-white transition hover:bg-gray-800"
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
      </section>

      {/* ── MODALS ── */}
      {/* Check In Calendar Modal */}
      {showCheckInModal && (
        <CheckInCalendarModal
          pgId={pg?.id || id}
          pgTitle={pg?.title}
          selectedRoom={selectedRoom}
          loading={bookingLoading}
          onClose={() => setShowCheckInModal(false)}
          onConfirm={handleConfirmCheckIn}
        />
      )}

      {/* Schedule Visit Modal */}
      {showVisitModal && (
        <ScheduleVisitModal
          pgTitle={pg?.title}
          pgArea={pg?.area}
          pgCity={pg?.city}
          user={user}
          loading={visitLoading}
          onClose={() => setShowVisitModal(false)}
          onConfirm={handleConfirmVisit}
        />
      )}

      {/* Visit Success Modal */}
      {visitSuccessModal && (
        <VisitSuccessModal
          pgTitle={pg?.title}
          visitInfo={scheduledVisitInfo}
          onClose={() => setVisitSuccessModal(false)}
        />
      )}

      {/* Visit Already Requested Modal */}
      {showAlreadyVisitedModal && (
        <VisitAlreadyRequestedModal
          pgTitle={pg?.title}
          visit={existingVisit}
          onClose={() => setShowAlreadyVisitedModal(false)}
          onNavigate={() => navigate("/my-bookings?tab=visits")}
        />
      )}

      {/* Short Stay Calendar Range Modal */}
      {showShortStayModal && (
        <ShortStayCalendarModal
          pgTitle={pg?.title}
          pgPrice={pg?.price}
          selectedRoom={selectedRoom}
          availableRooms={availableRooms}
          user={user}
          loading={shortStayLoading}
          onClose={() => setShowShortStayModal(false)}
          onConfirm={handleConfirmShortStay}
          onVerifyAccount={() => {
            setShowShortStayModal(false);
            setVerificationSource("short_stay");
            setShowEmailVerificationModal(true);
          }}
        />
      )}

      {/* Short Stay Success Modal */}
      {shortStaySuccessModal && (
        <ShortStaySuccessModal
          data={shortStaySuccessData}
          onClose={() => setShortStaySuccessModal(false)}
          onNavigate={() => navigate("/my-short-stays")}
        />
      )}

      {/* Short Stay Already Requested Modal */}
      {showAlreadyRequestedShortStayModal && (
        <ShortStayAlreadyRequestedModal
          pgTitle={pg?.title}
          stay={existingShortStay}
          onClose={() => setShowAlreadyRequestedShortStayModal(false)}
          onNavigate={() => navigate("/my-short-stays")}
        />
      )}

      {bookingSuccessModal && (
        <BookingSuccessModal
          pgTitle={pg.title}
          roomLabel={selectedRoom.label}
          price={currentRoomPrice}
          checkInDate={chosenCheckInDate}
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
        title={verificationSource === "short_stay" ? "Verify your email for Short Stay" : "Verify your email to book PG"}
        description={verificationSource === "short_stay" ? "Please verify your email with the 6-digit OTP to request a short stay at this PG." : "Please verify your email with the 6-digit OTP to complete booking this PG."}
        onSuccess={() => {
          setShowEmailVerificationModal(false);
          // Automatically reopen appropriate flow once email is verified!
          setTimeout(() => {
            if (verificationSource === "short_stay") {
              setShowShortStayModal(true);
            } else {
              handleCheckInClick();
            }
          }, 300);
        }}
      />
    </div>
  );
};

export default PgDetails;
