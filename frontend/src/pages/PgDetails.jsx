
import { useEffect, useState, useMemo, useContext, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import API, { IMAGE_BASE_URL } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import {
  Phone, MessageSquare, CheckCircle2, Clock, ChevronRight,
  X, Sparkles, Building2, MapPin, AlertCircle, ShieldCheck, User, ExternalLink
} from "lucide-react";

// Amenity Icon Mapper for a cleaner UI
const getAmenityIcon = (name) => {
  const cleanName = String(name || "").toLowerCase().trim();
  const icons = {
    wifi: "📶",
    ac: "❄️",
    "ac rooms": "❄️",
    food: "🍽️",
    "food included": "🍽️",
    laundry: "🧺",
    parking: "🚗",
    "power backup": "⚡",
    security: "🛡️",
    "cctv security": "🛡️",
    gym: "🏋️",
    "attached bathroom": "🚿",
    housekeeping: "🧹",
    "ro water": "💧",
  };

  if (icons[cleanName]) return icons[cleanName];
  if (cleanName.includes("wifi")) return "📶";
  if (cleanName.includes("ac")) return "❄️";
  if (cleanName.includes("food") || cleanName.includes("meal")) return "🍽️";
  if (cleanName.includes("laundry")) return "🧺";
  if (cleanName.includes("parking")) return "🚗";
  if (cleanName.includes("power")) return "⚡";
  if (cleanName.includes("security") || cleanName.includes("cctv")) return "🛡️";
  if (cleanName.includes("gym")) return "🏋️";
  if (cleanName.includes("bath")) return "🚿";
  if (cleanName.includes("water")) return "💧";

  return "✨";
};

const formatImageUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  const clean = url.trim();
  if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("data:")) {
    return clean;
  }
  const cleanPath = clean.startsWith("/") ? clean : `/${clean}`;
  if (cleanPath.startsWith("/uploads/")) {
    return `${IMAGE_BASE_URL}${cleanPath}`;
  }
  return `${IMAGE_BASE_URL}/uploads${cleanPath}`;
};

const DEFAULT_DETAILS_FALLBACKS = [
  "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80",
];

const parseListField = (value) => {
  if (!value) return [];

  let list;
  if (typeof value === "string") {
    try {
      list = JSON.parse(value);
    } catch {
      list = value.split(",");
    }
  } else if (Array.isArray(value)) {
    list = value;
  } else {
    list = [value];
  }

  if (!Array.isArray(list)) list = [list];

  return list
    .map((item) =>
      typeof item === "string"
        ? item.replace(/[\]"']/g, "").trim()
        : String(item).trim()
    )
    .filter(Boolean);
};

const PgDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [pg, setPg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState("");

  // Tracking the user's selected room type and price
  const [selectedRoom, setSelectedRoom] = useState({
    type: "Base",
    isAc: false,
    price: 0,
    label: "Starting Price",
  });

  // Track if user already booked this PG and is under verification
  const [existingBooking, setExistingBooking] = useState(null);

  // Check if current user already has a pending or active booking for this PG
  useEffect(() => {
    const checkExistingBooking = async () => {
      const token = localStorage.getItem("token");
      if (!token || !user) { setExistingBooking(null); return; }
      try {
        const res = await API.get("/bookings/my-bookings");
        const list = res.data?.bookings || res.data || [];
        const found = Array.isArray(list) && list.find(
          (b) => (Number(b.pg_id) === Number(id) || (b.title || b.pg_name || '').toLowerCase().trim() === (pg?.title || '').toLowerCase().trim()) && 
                 (b.status === "pending" || b.status === "approved" || b.payment_status === "paid")
        );
        setExistingBooking(found || null);
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
        
        // Safely parse sharing options
        let parsedSharing = {};
        if (pgData?.sharing_options) {
           try {
             parsedSharing = typeof pgData.sharing_options === 'string' 
                ? JSON.parse(pgData.sharing_options) 
                : pgData.sharing_options;
           } catch (e) {
             console.error("Error parsing sharing options", e);
           }
        }
        if (pgData) {
          pgData.parsed_sharing = parsedSharing;
          setPg(pgData);

          // Set default price
          setSelectedRoom({
            type: "Base",
            isAc: false,
            price: Number(pgData.price) || 0,
            label: "Starting Price"
          });
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

  const cleanAmenities = parseListField(pg?.amenities);
  const cleanRules = parseListField(pg?.rules);

  const galleryImages = (() => {
    if (!pg) return [];
    const rawList = [];

    // 1. Check pg.images (JSON string or Array)
    if (pg.images) {
      try {
        const parsed = typeof pg.images === "string" ? JSON.parse(pg.images) : pg.images;
        if (Array.isArray(parsed)) rawList.push(...parsed);
      } catch {
        rawList.push(pg.images);
      }
    }

    // 2. Check pg.gallery array
    if (Array.isArray(pg.gallery) && pg.gallery.length > 0) {
      pg.gallery.forEach((g) => {
        if (g?.image_url) rawList.push(g.image_url);
      });
    }

    // 3. Check pg.profile_image / pg.image
    if (pg.profile_image) rawList.push(pg.profile_image);
    if (pg.image) rawList.push(pg.image);

    const formatted = rawList.map(formatImageUrl).filter(Boolean);
    if (formatted.length > 0) return formatted;

    return DEFAULT_DETAILS_FALLBACKS;
  })();

  const displayActiveImage = galleryImages.includes(activeImage)
    ? activeImage
    : galleryImages[0];

  // Gallery Controls
  const showNextImage = () => {
    if (galleryImages.length <= 1) return;
    const currentIndex = galleryImages.indexOf(displayActiveImage);
    const nextIndex = (currentIndex + 1) % galleryImages.length;
    setActiveImage(galleryImages[nextIndex]);
  };

  const showPreviousImage = () => {
    if (galleryImages.length <= 1) return;
    const currentIndex = galleryImages.indexOf(displayActiveImage);
    const prevIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
    setActiveImage(galleryImages[prevIndex]);
  };

  // State for sleek Booking Success Modal & Auth prompt
  const [bookingSuccessModal, setBookingSuccessModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

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
    const message = encodeURIComponent(
      `Hi ${pg?.owner_name || "Owner"}, I found your property "${pg?.title}" on Dormn and I am interested in the ${selectedRoom.label || "room"}. Could you please share more details?`
    );
    window.open(`https://wa.me/${formattedWaNumber}?text=${message}`, "_blank");
  }, [cleanPhoneDigits, formattedWaNumber, pg?.owner_name, pg?.title, selectedRoom.label]);

  // Real-time Call Redirect
  const handleCallRedirect = useCallback(() => {
    if (!cleanPhoneDigits) {
      alert("Owner contact number is not provided for this listing.");
      return;
    }
    window.location.href = `tel:${cleanPhoneDigits}`;
  }, [cleanPhoneDigits]);

  const handleBookVisit = async () => {
    // Auth Check
    const token = localStorage.getItem("token");
    if (!token) {
      setShowAuthModal(true);
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

    try {
      setBookingLoading(true);
      await API.post("/bookings/create", {
        pg_id: Number(id),
        message: `Interested in booking a visit for ${selectedRoom.label}`,
        selected_room_type: selectedRoom.label,
        booked_price: selectedRoom.price,
      });
      setExistingBooking({ status: "pending", pg_id: Number(id) });
      setBookingSuccessModal(true);
    } catch (error) {
      console.error("Booking Error:", error);
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
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F5] dark:bg-[#000000] text-red-500 font-bold text-lg">
        {error || "PG Not Found"}
      </div>
    );
  }

  const currentRoomPrice = selectedRoom.price || pg?.price || 0;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FAF9F5] dark:bg-[#000000] text-[#3A2935] dark:text-white font-sans selection:bg-[#93B733] selection:text-white pb-20">
      {/* Navbar */}
      <Navbar />

      {/* Main Layout */}
      <section className="relative z-10 mx-auto max-w-[1440px] 2xl:max-w-[1600px] px-4 py-8 sm:px-6 md:px-8 lg:px-10 md:py-12">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-12">
          
          {/* LEFT SIDE: Details & Gallery */}
          <div className="flex flex-col gap-8">
            
            {/* Gallery (Bento Box Style) */}
            <div className="rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0d0d0d] p-2 shadow-sm md:rounded-[2.5rem] md:p-3">
              <div className="relative overflow-hidden rounded-[1.5rem] md:rounded-[2rem] bg-gray-200 dark:bg-gray-800">
                
                {/* Backside Shimmer Skeleton */}
                {!mainImageLoaded && (
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse z-0" />
                )}

                <img
                  src={displayActiveImage}
                  alt="PG"
                  onLoad={() => setMainImageLoaded(true)}
                  className={`h-[300px] w-full object-cover transition-all duration-700 hover:scale-105 md:h-[480px] ${
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
                      onClick={showPreviousImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-3 shadow-lg transition hover:bg-white"
                    >
                      ←
                    </button>

                    <button
                      onClick={showNextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-3 shadow-lg transition hover:bg-white"
                    >
                      →
                    </button>

                    <div className="absolute bottom-4 right-4 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">
                      {galleryImages.indexOf(displayActiveImage) + 1} / {galleryImages.length}
                    </div>
                  </>
                )}
              </div>

              <div className="mt-2 grid grid-cols-4 gap-2 md:mt-3 md:gap-3">
                {galleryImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(img)}
                    className={`overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                      displayActiveImage === img
                        ? "border-[#93B733] shadow-md opacity-100"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img}
                      alt="preview"
                      className="h-16 w-full object-cover sm:h-20 md:h-24"
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_DETAILS_FALLBACKS[index % DEFAULT_DETAILS_FALLBACKS.length];
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* About / Header Section */}
            <div className="rounded-[2rem] border-2 border-gray-100 bg-white p-6 shadow-sm md:rounded-[2.5rem] md:p-10">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="rounded-lg bg-green-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-green-700">
                  Verified Stay
                </span>

                {pg.sponsored && (
                  <span className="rounded-lg bg-[#93B733]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#93B733]">
                    Sponsored
                  </span>
                )}
                
                <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-600">
                  {pg.status || "Active"}
                </span>
              </div>

              <h1 className="text-3xl font-black tracking-tight text-[#3A2935] md:text-5xl">
                {pg.title}
              </h1>

              <p className="mt-3 text-sm font-medium text-gray-500 md:text-base flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[#93B733]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                {`${pg.area || ""}, ${pg.city || ""}`}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-[#3A2935] dark:text-white">
                  <span className="text-[#93B733]">★</span> {pg.rating || "New"} Ratings
                </div>
                <div className="flex items-center gap-2 rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-[#3A2935] dark:text-white">
                  <span className="text-xl">🏠</span> {String(pg.pg_type || "PG").toUpperCase()}
                </div>
              </div>

              <p className="mt-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300 md:text-base md:leading-8 whitespace-pre-line">
                {pg.description || "No description provided for this listing."}
              </p>
            </div>

          </div>

          {/* RIGHT SIDE: Booking & Actions */}
          <div className="space-y-6">
            
            {/* Sticky Container for right sidebar */}
            <div className="sticky top-[100px] space-y-6">
              
              {/* Pricing & Booking Card */}
              <div className="rounded-[2rem] border-2 border-gray-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] md:rounded-[2.5rem] md:p-8">
                <div className="flex items-end justify-between border-b-2 border-gray-100 pb-6">
                  <div>
                    <h4 className="text-3xl font-black text-[#93B733]">
                      ₹{selectedRoom.price ? selectedRoom.price.toLocaleString() : Number(pg.price || 0).toLocaleString()}
                    </h4>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mt-1">
                      {selectedRoom.label || "Per Month"}
                    </p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-sm font-bold text-[#3A2935]">{String(pg.pg_type || "").toUpperCase()} PG</h3>
                    <p className="mt-1 text-xs font-medium text-gray-500">
                      Rooms Left: <span className="font-bold text-[#3A2935]">{pg.available_rooms || 0}</span>
                    </p>
                  </div>
                </div>

                {/* Dynamic Room Selection (Sharing Options) */}
                {pg.parsed_sharing && Object.keys(pg.parsed_sharing).length > 0 && (
                  <div className="mt-6 border-b-2 border-gray-100 pb-6">
                    <h3 className="font-bold text-xs text-gray-500 mb-3 uppercase tracking-wider">Select Room Type</h3>
                    <div className="space-y-3">
                      {Object.entries(pg.parsed_sharing).map(([type, options]) => {
                        if (!options?.available) return null;
                        
                        return (
                          <div key={type} className="grid grid-cols-2 gap-2">
                            {options.ac_price && (
                              <button
                                onClick={() => setSelectedRoom({
                                   type, isAc: true, price: Number(options.ac_price), label: `${type} Sharing (AC)`
                                })}
                                className={`p-3 text-left rounded-xl border-2 transition-all ${
                                  selectedRoom.type === type && selectedRoom.isAc 
                                  ? 'border-[#93B733] bg-[#93B733]/10' 
                                  : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                                }`}
                              >
                                <div className="text-xs font-bold capitalize text-[#3A2935]">{type}</div>
                                <div className="text-[10px] text-gray-400 mb-0.5">AC Room</div>
                                <div className="text-xs font-black text-[#93B733]">₹{Number(options.ac_price).toLocaleString()}</div>
                              </button>
                            )}
                            
                            {options.non_ac_price && (
                              <button
                                onClick={() => setSelectedRoom({
                                  type, isAc: false, price: Number(options.non_ac_price), label: `${type} Sharing (Non-AC)`
                                })}
                                className={`p-3 text-left rounded-xl border-2 transition-all ${
                                  selectedRoom.type === type && !selectedRoom.isAc 
                                  ? 'border-[#93B733] bg-[#93B733]/10' 
                                  : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                                }`}
                              >
                                <div className="text-xs font-bold capitalize text-[#3A2935]">{type}</div>
                                <div className="text-[10px] text-gray-400 mb-0.5">Non-AC Room</div>
                                <div className="text-xs font-black text-[#93B733]">₹{Number(options.non_ac_price).toLocaleString()}</div>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* --- ACTION BUTTONS --- */}
                <div className="mt-6 space-y-3">
                  
                  {bookingStatusMeta && (
                    <div className="rounded-2xl border-2 border-emerald-400 dark:border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-500/10 p-4 text-xs font-bold text-emerald-900 dark:text-emerald-200 shadow-sm">
                      <div className="flex items-center gap-2 font-black text-emerald-800 dark:text-emerald-300 text-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>{bookingStatusMeta.title}</span>
                      </div>
                      <p className="mt-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">{bookingStatusMeta.sub}</p>
                    </div>
                  )}

                  <button
                    onClick={handleBookVisit}
                    disabled={bookingLoading}
                    className={`w-full rounded-2xl px-5 py-4 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 ${bookingStatusMeta ? bookingStatusMeta.btnBg : 'bg-[#93B733] hover:bg-[#82a32d]'}`}
                  >
                    {bookingLoading ? 'Submitting Request...' : bookingStatusMeta ? bookingStatusMeta.btnText : 'Request a Visit / Book Now'}
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* WhatsApp Button - Theme Background (White / Black) with Official Real WhatsApp Logo */}
                    <button
                      onClick={handleWhatsAppRedirect}
                      className="group relative flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 border-emerald-500/40 dark:border-emerald-500/30 bg-white dark:bg-black hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 hover:border-[#25D366] dark:hover:border-[#25D366] shadow-xs transition-all duration-200 active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-2">
                        <img 
                          src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" 
                          alt="WhatsApp" 
                          className="h-[20px] w-[20px] object-contain shrink-0"
                          loading="lazy"
                          decoding="async"
                        />
                        <span className="text-xs font-black text-gray-900 dark:text-white tracking-tight">WhatsApp</span>
                      </div>
                      <span className="mt-1 text-[11px] font-bold text-[#25D366] truncate max-w-full">
                        {displayPhone || "Chat Directly"}
                      </span>
                    </button>

                    {/* Call Owner Button - Theme Background (White / Black) with Official Call Logo */}
                    <button
                      onClick={handleCallRedirect}
                      className="group relative flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 border-blue-500/40 dark:border-blue-500/30 bg-white dark:bg-black hover:bg-blue-50/50 dark:hover:bg-blue-950/20 hover:border-[#0066FF] dark:hover:border-[#0066FF] shadow-xs transition-all duration-200 active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-[#0066FF] text-white shadow-xs shrink-0">
                          <Phone size={11} className="text-white fill-white" />
                        </span>
                        <span className="text-xs font-black text-gray-900 dark:text-white tracking-tight">Call Owner</span>
                      </div>
                      <span className="mt-1 text-[11px] font-bold text-[#0066FF] dark:text-[#38bdf8] truncate max-w-full">
                        {displayPhone || "Direct Phone"}
                      </span>
                    </button>
                  </div>
                </div>
                
                <div className="mt-6 rounded-xl bg-gray-50 dark:bg-white/[0.04] p-3.5 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                  Owner Contact: <span className="font-black text-[#0D3A1D] dark:text-[#93B733]">{displayPhone || "Available upon request"}</span>
                </div>
              </div>

              {/* Map / Location Card */}
              <div className="rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0d0d0d] p-6 shadow-sm md:rounded-[2.5rem] md:p-8">
                <h3 className="text-xl font-black text-[#3A2935] dark:text-white">Exact Location</h3>
                <p className="mt-3 text-sm font-medium leading-relaxed text-gray-600 dark:text-gray-300">
                  {pg.address || `${pg.area || ""}, ${pg.city || ""}`}
                </p>

                {pg.google_map_link ? (
                  <a
                    href={pg.google_map_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 dark:bg-white dark:text-black px-5 py-3.5 text-sm font-bold text-white transition hover:bg-gray-800"
                  >
                    <svg className="w-4 h-4 text-white dark:text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                    Open Google Maps
                  </a>
                ) : (
                  <div className="mt-5 rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#151515] p-3.5 text-center text-sm font-bold text-gray-400">
                    Map location not provided
                  </div>
                )}
              </div>

              {/* Advertisement Space */}
              <div className="rounded-[2rem] border-2 border-dashed border-gray-300 dark:border-gray-800 bg-gray-50 dark:bg-[#0d0d0d] p-8 text-center transition-colors hover:border-gray-400">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Advertisement
                </p>
                <h3 className="mt-2 text-xl font-black text-[#3A2935] dark:text-white">
                  Promote Your PG
                </h3>
                <button className="mt-4 rounded-xl border-2 border-[#3A2935] dark:border-white bg-white dark:bg-[#111] px-5 py-2.5 text-xs font-bold text-[#3A2935] dark:text-white transition hover:bg-[#3A2935] hover:text-white">
                  Learn More
                </button>
              </div>

            </div>
          </div>

        </div>

        {/* ── FULL-WIDTH LARGE SECTION: Side-by-Side Large Cards (What this place offers & Rules) ── */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Amenities Section - Full Scale */}
          <div className="rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0d0d0d] p-6 shadow-sm md:rounded-[2.5rem] md:p-10 flex flex-col justify-start">
            <h2 className="text-2xl md:text-3xl font-black text-[#3A2935] dark:text-white">What this place offers</h2>
            {cleanAmenities.length > 0 ? (
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                {cleanAmenities.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-white/[0.04] px-4 py-3.5 text-sm md:text-base font-semibold text-gray-700 dark:text-gray-200 transition hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-100 dark:hover:bg-white/[0.07]"
                  >
                    <span className="text-xl md:text-2xl shrink-0">{getAmenityIcon(item)}</span>
                    <span className="capitalize truncate">{item}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm font-medium text-gray-400">
                Standard amenities included.
              </p>
            )}
          </div>

          {/* Rules & Policies Section - Full Scale */}
          <div className="rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0d0d0d] p-6 shadow-sm md:rounded-[2.5rem] md:p-10 flex flex-col justify-start">
            <h2 className="text-2xl md:text-3xl font-black text-[#3A2935] dark:text-white">Rules & Policies</h2>
            {cleanRules.length > 0 ? (
              <div className="mt-6 space-y-3">
                {cleanRules.map((rule, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3.5 rounded-2xl border-2 border-gray-100 dark:border-gray-800/80 bg-gray-50 dark:bg-white/[0.04] px-5 py-4 text-sm md:text-base font-medium text-gray-700 dark:text-gray-200"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-[#93B733] shrink-0 mt-1.5 md:mt-2"></span>
                    <span className="leading-relaxed">{rule}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm font-medium text-gray-400">
                Standard house rules apply.
              </p>
            )}
          </div>

        </div>
      </section>

      {/* ── MODALS ── */}
      {bookingSuccessModal && (
        <BookingSuccessModal
          pgTitle={pg.title}
          roomLabel={selectedRoom.label}
          price={currentRoomPrice}
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
    </div>
  );
};

// ── MEMOIZED MODAL SUBCOMPONENTS (Optimized to avoid re-rendering on parent carousel/scroll) ──

const BookingSuccessModal = ({ pgTitle, roomLabel, price, onClose, onTrack }) => (
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

      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-emerald-500 to-[#93B733] text-white text-3xl shadow-lg shadow-emerald-500/25 mb-4">
        🎉
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
