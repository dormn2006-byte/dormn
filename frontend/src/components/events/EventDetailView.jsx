import React, { useState, useMemo } from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Ticket,
  Users,
  ShieldCheck,
  CheckCircle2,
  Share2,
  Tag,
  AlertCircle,
} from "lucide-react";
import SEOHead from "../common/SEOHead";
import Navbar from "../Navbar";
import { getEventTimeStatus, validateCoupon } from "../../services/eventAdminService";

const GROUP_SIZES = [2, 3, 4, 5, 6, 7, 8, 9, 10];
const QUICK_COUPONS = ["DORMN50", "PARTY200", "EXPIRED10"];

export default function EventDetailView({
  currentEvent,
  selectedPassType,
  setSelectedPassType,
  groupSize,
  setGroupSize,
  guestName,
  setGuestName,
  guestPhone,
  setGuestPhone,
  handleBookPass,
  bookingSuccess,
  onBack,
  renderInviteModal,
  renderMacOSDock,
}) {
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");

  const timeStatus = useMemo(() => getEventTimeStatus(currentEvent), [currentEvent]);

  const { effectiveGroupSize, basePrice, discountAmount, netPayable } = useMemo(() => {
    const size = selectedPassType === "couple" ? 2 : selectedPassType === "group" ? groupSize : 1;
    let base = typeof currentEvent.singlePrice === "number" ? currentEvent.singlePrice : 499;
    if (selectedPassType === "couple") {
      base = typeof currentEvent.couplePrice === "number" ? currentEvent.couplePrice : currentEvent.couplePrice === "FREE" ? 0 : 999;
    } else if (selectedPassType === "group") {
      const perHead = typeof currentEvent.singlePrice === "number" ? currentEvent.singlePrice : 499;
      base = perHead * size;
    }

    let discount = 0;
    if (appliedCoupon?.valid && appliedCoupon.coupon) {
      if (appliedCoupon.coupon.discountPercent) {
        discount = Math.round((base * Number(appliedCoupon.coupon.discountPercent)) / 100);
      } else if (appliedCoupon.coupon.discountAmount) {
        discount = Math.min(base, Number(appliedCoupon.coupon.discountAmount));
      }
    }

    return {
      effectiveGroupSize: size,
      basePrice: base,
      discountAmount: discount,
      netPayable: Math.max(0, base - discount),
    };
  }, [selectedPassType, groupSize, currentEvent, appliedCoupon]);

  const handleApplyCoupon = (e) => {
    if (e) e.preventDefault();
    setCouponError("");
    setCouponSuccess("");

    if (!couponInput.trim()) {
      setCouponError("Please enter a coupon code.");
      setAppliedCoupon(null);
      return;
    }

    const res = validateCoupon(couponInput, currentEvent, basePrice);
    if (!res.valid) {
      setCouponError(res.error);
      setAppliedCoupon(null);
      setCouponSuccess("");
    } else {
      setAppliedCoupon(res);
      setCouponSuccess(res.message);
      setCouponError("");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
    setCouponSuccess("");
  };

  const onSubmitBooking = (e) => {
    e.preventDefault();
    handleBookPass(
      e,
      appliedCoupon
        ? {
            ...appliedCoupon,
            discountAmount,
            netAmount: netPayable,
          }
        : null
    );
  };

  return (
    <div className="min-h-screen events-page-wrapper bg-[#FAF9FD] dark:bg-[#06080F] text-gray-900 dark:text-white selection:bg-pink-500 selection:text-white relative overflow-x-hidden pb-32 sm:pb-36">
      {/* Dynamic Ambient Background Glows */}
      <div className="pointer-events-none fixed -left-32 -top-32 h-96 w-96 rounded-full bg-purple-300/25 dark:bg-purple-600/20 blur-[120px] z-0"></div>
      <div className="pointer-events-none fixed -right-32 top-1/3 h-96 w-96 rounded-full bg-pink-300/25 dark:bg-pink-600/20 blur-[120px] z-0"></div>
      <div className="pointer-events-none fixed bottom-0 left-1/3 h-96 w-96 rounded-full bg-amber-300/15 dark:bg-amber-500/10 blur-[120px] z-0"></div>

      <SEOHead
        title={`${currentEvent.title} | Dormn Events & Nightlife`}
        description={currentEvent.tagline || currentEvent.about}
      />
      <Navbar />

      {/* Top Hero Banner */}
      <div className="relative h-72 sm:h-96 w-full bg-black overflow-hidden z-10">
        <img
          src={currentEvent.bannerImage || currentEvent.coverImage}
          alt={currentEvent.title}
          className="w-full h-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#FAF9FD] dark:from-[#06080F] via-black/40 to-transparent"></div>

        <button
          onClick={onBack}
          className="absolute top-6 left-4 sm:left-12 z-20 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md text-xs font-bold transition cursor-pointer border border-white/20 shadow-lg"
        >
          <ArrowLeft size={16} />
          <span>Back to Catalog</span>
        </button>

        <div className="absolute bottom-6 left-4 sm:left-12 right-4 sm:right-12 z-20 max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="px-3 py-1 rounded-md bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 text-xs font-black uppercase tracking-wider">
                {currentEvent.categoryLabel || currentEvent.category}
              </span>
              {timeStatus.label && (
                <span
                  className={`px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider backdrop-blur-md border flex items-center gap-1.5 ${
                    timeStatus.isUrgent
                      ? "bg-amber-100 dark:bg-amber-950/85 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/50"
                      : "bg-pink-100 dark:bg-pink-950/80 text-pink-800 dark:text-pink-300 border-pink-200 dark:border-pink-500/40"
                  }`}
                >
                  <Clock
                    size={13}
                    className={
                      timeStatus.isUrgent
                        ? "text-amber-500 dark:text-amber-400 animate-pulse"
                        : "text-pink-600 dark:text-pink-400"
                    }
                  />
                  <span>{timeStatus.label}</span>
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white capitalize drop-shadow-md">
              {currentEvent.title}
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-purple-900/90 dark:text-purple-200/90 mt-1 capitalize max-w-2xl">
              {currentEvent.tagline}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-4 py-2 rounded-xl bg-purple-600 text-white font-black text-sm shadow-lg shadow-purple-600/30">
              {typeof currentEvent.singlePrice === "number"
                ? `₹${currentEvent.singlePrice} Single`
                : `${currentEvent.singlePrice}`}
            </span>
            <span className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-black text-sm shadow-lg shadow-pink-600/30">
              Couples {currentEvent.couplePrice || "FREE"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 mt-8 sm:mt-10 relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: About, Details, Gallery */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Info Box */}
          <div className="events-card-bg bg-white dark:bg-[#0D0B1C]/90 border border-purple-200 dark:border-purple-500/25 rounded-3xl p-6 shadow-xl backdrop-blur-xl">
            <h2 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="text-pink-600 dark:text-pink-400" size={18} />
              <span>Event Night & Schedule</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="events-upcoming-box p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-500/20">
                <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider block mb-1">
                  Upcoming Night
                </span>
                <p className="text-sm font-black text-gray-900 dark:text-white capitalize">
                  {currentEvent.upcomingNight?.title || "Special Night"}
                </p>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300 mt-2">
                  <Calendar size={13} className="text-pink-600 dark:text-pink-400" />
                  <span>{currentEvent.upcomingNight?.dateFormatted || "Upcoming Soon"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300 mt-1">
                  <Clock size={13} className="text-purple-600 dark:text-purple-400" />
                  <span>{currentEvent.upcomingNight?.time || "9pm onwards"}</span>
                </div>
              </div>

              <div className="events-upcoming-box p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-500/20">
                <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider block mb-1">
                  Location & Contact
                </span>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white">
                  <MapPin size={14} className="text-pink-600 dark:text-pink-400 shrink-0" />
                  <span className="capitalize">{currentEvent.location}, {currentEvent.city}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300 mt-2">
                  <Phone size={13} className="text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>+91 {currentEvent.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-pink-600 dark:text-pink-400 mt-2">
                  <ShieldCheck size={14} />
                  <span>{currentEvent.coupleCondition || "Couple Free Entry"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="events-card-bg bg-white dark:bg-[#0D0B1C]/90 border border-purple-200 dark:border-purple-500/25 rounded-3xl p-6 shadow-xl backdrop-blur-xl">
            <h2 className="text-lg font-black text-gray-900 dark:text-white mb-3">About the Experience</h2>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
              {currentEvent.about}
            </p>
          </div>

          {/* Gallery */}
          {currentEvent.gallery && currentEvent.gallery.length > 0 && (
            <div className="events-card-bg bg-white dark:bg-[#0D0B1C]/90 border border-purple-200 dark:border-purple-500/25 rounded-3xl p-6 shadow-xl backdrop-blur-xl">
              <h2 className="text-lg font-black text-gray-900 dark:text-white mb-4">Venue & Vibe Gallery</h2>
              <div className="grid grid-cols-3 gap-3">
                {currentEvent.gallery.map((imgUrl, idx) => (
                  <div key={idx} className="h-28 sm:h-36 rounded-2xl overflow-hidden bg-black shadow-md">
                    <img
                      src={imgUrl}
                      alt={`${currentEvent.title} photo ${idx + 1}`}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Column: Booking / RSVP Pass Form */}
        <div className="space-y-6">
          <div className="events-card-bg bg-white dark:bg-[#0D0B1C]/90 border border-purple-200 dark:border-purple-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl sticky top-24">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 text-white flex items-center justify-center font-black shadow-md shadow-pink-500/30">
                <Ticket size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">RSVP / Book Your Pass</h3>
                <p className="text-xs font-semibold text-purple-700 dark:text-purple-300/80">
                  Instant gate entry confirmation
                </p>
              </div>
            </div>

            <form onSubmit={onSubmitBooking} className="space-y-4">
              {/* Pass Type Selector */}
              <div>
                <label className="block text-xs font-bold text-purple-900 dark:text-purple-300/90 mb-2 ml-1">
                  Select Pass Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPassType("single")}
                    className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                      selectedPassType === "single"
                        ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/30"
                        : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <span className="block text-xs font-black">SINGLE</span>
                    <span className="text-[11px] font-bold opacity-90">
                      ₹{typeof currentEvent.singlePrice === "number" ? currentEvent.singlePrice : 499}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPassType("couple")}
                    className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                      selectedPassType === "couple"
                        ? "bg-gradient-to-r from-pink-600 to-rose-600 text-white border-pink-600 shadow-md shadow-pink-600/30"
                        : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <span className="block text-xs font-black">COUPLE</span>
                    <span className="text-[11px] font-bold opacity-90">
                      {currentEvent.couplePrice || "FREE"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPassType("group")}
                    className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                      selectedPassType === "group"
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30"
                        : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <span className="block text-xs font-black">GROUP</span>
                    <span className="text-[11px] font-bold opacity-90">Multi-Pass</span>
                  </button>
                </div>
              </div>

              {/* Group Size Selector */}
              {selectedPassType === "group" && (
                <div className="p-3.5 rounded-2xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-pink-600 dark:text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Users size={14} />
                      <span>Select Group Size (2 - 10)</span>
                    </span>
                    <span className="text-xs font-black text-gray-900 dark:text-white">
                      {groupSize} Passes (You + {groupSize - 1} Friends)
                    </span>
                  </div>
                  <div className="grid grid-cols-5 sm:grid-cols-9 gap-1.5">
                    {GROUP_SIZES.map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setGroupSize(num)}
                        className={`py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                          groupSize === num
                            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-pink-500/30 scale-105"
                            : "bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-white/15 border border-purple-100 dark:border-transparent"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-purple-800/80 dark:text-purple-200/80 font-semibold pt-1">
                    Total:{" "}
                    <span className="text-pink-600 dark:text-pink-400 font-black">
                      ₹{(typeof currentEvent.singlePrice === "number" ? currentEvent.singlePrice : 499) * groupSize}
                    </span>{" "}
                    (₹{typeof currentEvent.singlePrice === "number" ? currentEvent.singlePrice : 499} per person)
                  </p>
                </div>
              )}

              {/* Notice for Couple / Group passes */}
              {(selectedPassType === "couple" || selectedPassType === "group") && (
                <div className="p-3.5 rounded-2xl bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-500/30 text-xs font-bold text-pink-900 dark:text-pink-300 flex items-center gap-2.5">
                  <Share2 size={16} className="text-pink-600 dark:text-pink-400 shrink-0" />
                  <span>
                    {selectedPassType === "couple"
                      ? "A shareable invite link will be generated after booking to invite your partner!"
                      : `Shareable invite links will be generated for all ${groupSize - 1} of your group members!`}
                  </span>
                </div>
              )}

              {/* Guest Name */}
              <div>
                <label className="block text-xs font-bold text-purple-900 dark:text-purple-300/90 mb-1.5 ml-1">
                  Guest Full Name
                </label>
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Enter full name"
                  className="events-input-bg w-full px-4 py-3 rounded-2xl border border-purple-200 dark:border-purple-500/30 bg-gray-50 dark:bg-black/60 text-gray-900 dark:text-white text-sm font-semibold outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              {/* Guest Phone */}
              <div>
                <label className="block text-xs font-bold text-purple-900 dark:text-purple-300/90 mb-1.5 ml-1">
                  WhatsApp Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="events-input-bg w-full px-4 py-3 rounded-2xl border border-purple-200 dark:border-purple-500/30 bg-gray-50 dark:bg-black/60 text-gray-900 dark:text-white text-sm font-semibold outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              {/* Coupon Code Section */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1.5 ml-1">
                  <label className="block text-xs font-bold text-purple-900 dark:text-purple-300/90 flex items-center gap-1.5">
                    <Tag size={13} className="text-pink-600 dark:text-pink-400" />
                    <span>Have a Promo / Coupon Code?</span>
                  </label>
                  {appliedCoupon && (
                    <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                      Applied
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase());
                        if (couponError) setCouponError("");
                      }}
                      placeholder="e.g. DORMN50, PARTY200"
                      disabled={!!appliedCoupon}
                      className="events-input-bg w-full uppercase tracking-wider px-4 py-3 rounded-2xl border border-purple-200 dark:border-purple-500/30 bg-gray-50 dark:bg-black/60 text-gray-900 dark:text-white text-sm font-bold outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-60"
                    />
                  </div>

                  {appliedCoupon ? (
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="px-4 py-3 rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-xs font-black transition cursor-pointer"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black transition shadow-md shadow-purple-600/30 cursor-pointer"
                    >
                      Apply
                    </button>
                  )}
                </div>

                {/* Quick Hint / Try suggestions */}
                {!appliedCoupon && !couponError && (
                  <div className="mt-1.5 flex items-center gap-1.5 flex-wrap text-[11px]">
                    <span className="text-gray-400 text-[10px]">Try:</span>
                    {QUICK_COUPONS.map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => {
                          setCouponInput(code);
                          setCouponError("");
                        }}
                        className="px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-500/20 bg-purple-50/50 dark:bg-purple-950/30 hover:bg-pink-50 dark:hover:bg-pink-950/40 text-purple-700 dark:text-purple-300 font-mono text-[10px] font-bold cursor-pointer transition"
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                )}

                {/* Coupon Error State (Code Not Found OR Capacity Expired) */}
                {couponError && (
                  <div className="mt-2.5 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 font-semibold animate-fadeIn">
                    <AlertCircle size={16} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">{couponError}</p>
                    </div>
                  </div>
                )}

                {/* Coupon Success State with Live Capacity & Remaining Spots */}
                {appliedCoupon && (
                  <div className="mt-2.5 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/40 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 font-semibold animate-fadeIn">
                    <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-black text-emerald-900 dark:text-emerald-200">
                        {appliedCoupon.coupon.code} Applied Successfully!
                      </p>
                      <p className="text-[11px] opacity-90 mt-0.5">
                        Saved ₹{discountAmount} on this booking.
                      </p>
                      <div className="mt-2 flex items-center gap-2 flex-wrap text-[10px] font-bold text-emerald-700 dark:text-emerald-300/90 bg-emerald-100/60 dark:bg-emerald-900/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                        <span>Capacity: {appliedCoupon.maxUses} total uses</span>
                        <span>•</span>
                        <span>Used {appliedCoupon.usedCount} times</span>
                        <span>•</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-black">
                          {appliedCoupon.remainingUses} spots left
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Price Summary Breakdown */}
              <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-500/20 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-300">
                  <span>Base Price ({selectedPassType.toUpperCase()})</span>
                  <span>₹{basePrice}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="flex items-center gap-1">
                      <Tag size={12} />
                      <span>Discount ({appliedCoupon?.coupon?.code})</span>
                    </span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}

                <div className="pt-1.5 border-t border-purple-200/60 dark:border-purple-500/20 flex items-center justify-between">
                  <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                    Net Payable
                  </span>
                  <div className="text-right">
                    {discountAmount > 0 && (
                      <span className="text-[11px] text-gray-400 line-through mr-1.5 font-bold">
                        ₹{basePrice}
                      </span>
                    )}
                    <span className="text-base font-black text-purple-700 dark:text-pink-400">
                      {netPayable === 0 ? "FREE" : `₹${netPayable}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-sm transition shadow-xl shadow-pink-600/30 cursor-pointer flex items-center justify-center gap-2 transform active:scale-98"
              >
                {bookingSuccess ? (
                  <>
                    <CheckCircle2 size={18} className="text-emerald-300" />
                    <span>Pass Confirmed! Redirecting...</span>
                  </>
                ) : (
                  <>
                    <Ticket size={18} />
                    <span>
                      {netPayable === 0
                        ? "Reserve Free Pass"
                        : `Pay ₹${netPayable} & Reserve Pass`}
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {renderInviteModal && renderInviteModal()}
      {renderMacOSDock && renderMacOSDock()}
    </div>
  );
}
