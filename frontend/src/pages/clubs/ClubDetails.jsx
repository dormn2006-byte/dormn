import { useState, useEffect, useContext, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, MapPin, Calendar, Clock, Users, Music, Ticket,
  Copy, Check, Share2, ChevronRight, Sparkles, Phone, Info,
  User, Heart
} from "lucide-react";
import api, { IMAGE_BASE_URL } from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import { loadRazorpayScript } from "../../utils/razorpay";
import Navbar from "../../components/Navbar";

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export default function ClubDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [bookingType, setBookingType] = useState("single");
  const [gender, setGender] = useState(user?.gender || "");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [paying, setPaying] = useState(false);
  const [pollingStatus, setPollingStatus] = useState(null);

  useEffect(() => {
    const fetchClub = async () => {
      try {
        const res = await api.get(`/clubs/${id}`);
        const clubData = res.data?.club;
        setClub(clubData);
        if (clubData?.events?.length > 0) {
          setSelectedEvent(clubData.events[0]);
        }
      } catch (err) {
        console.error("Failed to load club:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchClub();
  }, [id]);

  // Poll booking status when in couple mode
  useEffect(() => {
    if (!bookingResult?.id || bookingType !== "couple") return;
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/clubs/booking/${bookingResult.id}`);
        const status = res.data?.booking?.status;
        setPollingStatus(status);
        if (status === "confirmed") {
          clearInterval(interval);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [bookingResult, bookingType]);

  const handleBook = async () => {
    if (!user) return navigate("/auth");
    if (!selectedEvent) return alert("Please select an event.");
    if (!gender) return alert("Please select your gender.");

    setBookingLoading(true);
    try {
      const res = await api.post("/clubs/booking", {
        club_id: club.id,
        event_id: selectedEvent._id || selectedEvent.id,
        booking_type: bookingType,
        gender,
      });

      if (res.data?.success) {
        setBookingResult(res.data.booking);
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Booking failed.");
    } finally {
      setBookingLoading(false);
    }
  };

  const handlePay = async () => {
    setPaying(true);
    try {
      // 1. Load Razorpay SDK
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        alert("Razorpay SDK failed to load. Please check your internet connection.");
        setPaying(false);
        return;
      }

      // 2. Create order on backend
      const orderRes = await api.post(`/clubs/booking/${bookingResult.id}/create-order`);
      const { order_id, amount, currency, key_id } = orderRes.data;

      // 3. Open Razorpay checkout
      const options = {
        key: key_id,
        amount,
        currency,
        name: "Dormn",
        description: `Club Booking — ${club.name}`,
        order_id,
        handler: async (response) => {
          // 4. Verify payment on backend
          try {
            const verifyRes = await api.post(`/clubs/booking/${bookingResult.id}/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (verifyRes.data?.success) {
              setBookingResult((prev) => ({
                ...prev,
                status: "paid",
                ticket_code: verifyRes.data.ticket.ticket_code,
              }));
            }
          } catch (err) {
            alert(err?.response?.data?.message || "Payment verification failed.");
          } finally {
            setPaying(false);
          }
        },
        prefill: {
          name: user?.full_name || "",
          email: user?.email || "",
        },
        theme: {
          color: "#0D3A1D",
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
          },
        },
      };

      new window.Razorpay(options).open();
    } catch (err) {
      alert(err?.response?.data?.message || "Payment failed.");
      setPaying(false);
    }
  };

  const copyInviteLink = useCallback(() => {
    const url = `${window.location.origin}/clubs/invite/${bookingResult.invite_token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [bookingResult]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#0d0d0d] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#93B733] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#0d0d0d] flex flex-col items-center justify-center text-center px-4">
        <Music className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-black text-[#0D3A1D] dark:text-white">Club not found</h2>
        <Link to="/clubs" className="mt-4 text-sm font-bold text-[#93B733] hover:underline">
          ← Back to Clubs
        </Link>
      </div>
    );
  }

  const coverUrl = club.cover_image
    ? `${IMAGE_BASE_URL}/uploads/${club.cover_image}`
    : null;

  return (
    <div className="min-h-screen bg-[#FAF9F5] dark:bg-[#0d0d0d] pb-20">
      <Navbar />
      {/* Hero / Cover */}
      <div className="relative h-56 sm:h-72 md:h-80 overflow-hidden">
        {coverUrl ? (
          <img src={coverUrl} alt={club.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0D3A1D] to-[#1a5c33] flex items-center justify-center">
            <Music className="w-20 h-20 text-[#93B733]/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute top-4 left-4 z-10">
          <Link
            to="/clubs"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/90 dark:bg-black/70 backdrop-blur-sm text-xs font-bold text-[#0D3A1D] dark:text-white shadow-md hover:bg-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
            {club.name}
          </h1>
          {club.tagline && (
            <p className="text-sm font-medium text-gray-300 mt-1">{club.tagline}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-300">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" /> {club.area ? `${club.area}, ` : ""}{club.city}
            </span>
            {club.contact_phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-4 h-4" /> {club.contact_phone}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
        {/* Club Info */}
        {club.description && (
          <div className="mb-6 p-5 rounded-2xl bg-white dark:bg-[#111] border border-gray-100 dark:border-white/10">
            <h3 className="text-sm font-black text-[#0D3A1D] dark:text-white mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-[#93B733]" /> About
            </h3>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
              {club.description}
            </p>
          </div>
        )}

        {/* Entry Fee & Couple Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#111] border border-gray-100 dark:border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-[#93B733]" />
              <span className="text-xs font-black text-[#0D3A1D] dark:text-white uppercase tracking-wider">Single Entry</span>
            </div>
            <p className="text-2xl font-black text-[#0D3A1D] dark:text-[#93B733]">
              ₹{club.single_entry_fee}
            </p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">Per person</p>
          </div>
          <div className="p-5 rounded-2xl bg-purple-50 dark:bg-purple-500/5 border border-purple-200/50 dark:border-purple-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-black text-purple-700 dark:text-purple-400 uppercase tracking-wider">Couple Entry</span>
            </div>
            <p className="text-2xl font-black text-purple-600 dark:text-purple-400">FREE</p>
            <p className="text-xs font-medium text-purple-400/70 dark:text-purple-400/50 mt-1">Boy + Girl only</p>
          </div>
        </div>

        {/* Gallery Images */}
        {club.images && club.images.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-black text-[#0D3A1D] dark:text-white mb-3 uppercase tracking-wider">Gallery</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {club.images.map((img, i) => (
                <div key={i} className="flex-shrink-0 w-40 h-28 sm:w-52 sm:h-36 rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10">
                  <img
                    src={`${IMAGE_BASE_URL}/uploads/${img.image_url}`}
                    alt={`${club.name} gallery ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Events */}
        <div className="mb-6">
          <h3 className="text-sm font-black text-[#0D3A1D] dark:text-white mb-3 uppercase tracking-wider">
            Upcoming Nights
          </h3>
          {club.events && club.events.length > 0 ? (
            <div className="space-y-3">
              {club.events.map((event) => {
                const isSelected = selectedEvent?._id === event._id || selectedEvent?.id === event.id;
                return (
                  <button
                    key={event._id || event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 ${
                      isSelected
                        ? "border-[#93B733] bg-[#93B733]/5 dark:bg-[#93B733]/5 shadow-md shadow-[#93B733]/10"
                        : "border-gray-100 dark:border-white/10 bg-white dark:bg-[#111] hover:border-gray-300 dark:hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="text-base font-black text-[#0D3A1D] dark:text-white">
                          {event.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> {formatDate(event.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {event.start_time} - {event.end_time}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end flex-shrink-0">
                        <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                          event.remaining_capacity > 0
                            ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400"
                            : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                        }`}>
                          {event.remaining_capacity > 0
                            ? `${event.remaining_capacity} spots`
                            : "Full"}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white dark:bg-[#111] border border-gray-100 dark:border-white/10 text-center">
              <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-400">No upcoming nights scheduled</p>
            </div>
          )}
        </div>

        {/* Booking Panel */}
        {selectedEvent && selectedEvent.remaining_capacity > 0 && !bookingResult && (
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#111] border border-gray-100 dark:border-white/10 shadow-lg">
            <h3 className="text-base font-black text-[#0D3A1D] dark:text-white mb-4 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-[#93B733]" /> Book Your Spot
            </h3>

            {/* Booking Type */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => setBookingType("single")}
                className={`flex-1 p-4 rounded-2xl border-2 transition-all ${
                  bookingType === "single"
                    ? "border-[#93B733] bg-[#93B733]/5"
                    : "border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03]"
                }`}
              >
                <User className={`w-5 h-5 mx-auto mb-1.5 ${bookingType === "single" ? "text-[#93B733]" : "text-gray-400"}`} />
                <p className="text-xs font-black text-[#0D3A1D] dark:text-white">Single</p>
                <p className="text-sm font-black text-[#93B733] mt-0.5">₹{club.single_entry_fee}</p>
              </button>
              <button
                onClick={() => setBookingType("couple")}
                className={`flex-1 p-4 rounded-2xl border-2 transition-all ${
                  bookingType === "couple"
                    ? "border-purple-400 bg-purple-50 dark:bg-purple-500/5"
                    : "border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03]"
                }`}
              >
                <Heart className={`w-5 h-5 mx-auto mb-1.5 ${bookingType === "couple" ? "text-purple-500" : "text-gray-400"}`} />
                <p className="text-xs font-black text-[#0D3A1D] dark:text-white">Couple</p>
                <p className="text-sm font-black text-purple-500 mt-0.5">FREE</p>
              </button>
            </div>

            {/* Gender */}
            <div className="mb-4">
              <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                Your Gender
              </label>
              <div className="flex gap-3">
                {["male", "female"].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-bold capitalize transition-all ${
                      gender === g
                        ? "border-[#93B733] bg-[#93B733]/10 text-[#0D3A1D] dark:text-white"
                        : "border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleBook}
              disabled={bookingLoading || !gender}
              className="w-full py-3.5 rounded-2xl bg-[#0D3A1D] dark:bg-[#93B733] text-white dark:text-[#0D3A1D] font-black text-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bookingLoading ? "Booking..." : bookingType === "couple" ? "Generate Invite Link" : `Pay ₹${club.single_entry_fee} & Book`}
            </button>
          </div>
        )}

        {/* Booking Result */}
        {bookingResult && (
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#111] border border-gray-100 dark:border-white/10 shadow-lg">
            {bookingType === "single" ? (
              /* Single: Payment or Ticket */
              <>
                {bookingResult.ticket_code ? (
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-500/10 text-green-600 flex items-center justify-center mx-auto mb-3">
                      <Ticket className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-black text-[#0D3A1D] dark:text-white">Your Ticket is Ready!</h3>
                    <div className="mt-3 px-5 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 inline-block">
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Ticket Code</p>
                      <p className="text-xl font-black text-[#0D3A1D] dark:text-[#93B733] tracking-widest font-mono">
                        {bookingResult.ticket_code}
                      </p>
                    </div>
                    <Link
                      to="/clubs/tickets"
                      className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#93B733] text-[#0D3A1D] text-sm font-bold hover:bg-[#82a32d] transition-all"
                    >
                      View My Tickets <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#93B733]/10 text-[#93B733] flex items-center justify-center mx-auto mb-3">
                      <Ticket className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-black text-[#0D3A1D] dark:text-white">Complete Payment</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Pay ₹{bookingResult.amount} to generate your ticket
                    </p>
                    <button
                      onClick={handlePay}
                      disabled={paying}
                      className="mt-4 px-6 py-3 rounded-2xl bg-[#0D3A1D] text-white font-black text-sm hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {paying ? "Processing..." : `Pay ₹${bookingResult.amount}`}
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* Couple: Invite Link + Status */
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-500/10 text-purple-600 flex items-center justify-center mx-auto mb-3">
                  <Share2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-[#0D3A1D] dark:text-white">
                  {pollingStatus === "confirmed" ? "Booking Confirmed! 🎉" : "Share Invite with Partner"}
                </h3>

                {pollingStatus === "confirmed" ? (
                  <Link
                    to="/clubs/tickets"
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#93B733] text-[#0D3A1D] text-sm font-bold hover:bg-[#82a32d] transition-all"
                  >
                    View My Tickets <ChevronRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
                      Send this link to your partner to confirm the booking
                    </p>
                    <div className="flex items-center gap-2 max-w-md mx-auto">
                      <div className="flex-1 px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-mono text-gray-500 dark:text-gray-400 truncate">
                        {`${window.location.origin}/clubs/invite/${bookingResult.invite_token}`}
                      </div>
                      <button
                        onClick={copyInviteLink}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#93B733] text-[#0D3A1D] text-xs font-bold hover:bg-[#82a32d] transition-all"
                      >
                        {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-3 animate-pulse">
                      Waiting for partner to accept...
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Opening Hours */}
        {club.opening_hours && (
          <div className="mt-6 p-4 rounded-2xl bg-white dark:bg-[#111] border border-gray-100 dark:border-white/10">
            <h4 className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Opening Hours</h4>
            <p className="text-sm font-medium text-[#0D3A1D] dark:text-white">{club.opening_hours}</p>
          </div>
        )}
      </div>
    </div>
  );
}
