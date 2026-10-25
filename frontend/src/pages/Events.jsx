import React, { useState, useEffect, useMemo, useContext, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sparkles, Music, CalendarHeart, Ticket, Search } from "lucide-react";
import Navbar from "../components/Navbar";
import SEOHead from "../components/common/SEOHead";
import { AuthContext } from "../context/AuthContext";
import {
  getAdminEvents,
  fetchEventsFromDB,
  recordEventBooking,
  isEventCompleted,
} from "../services/eventAdminService";
import api from "../services/api";
import MacOSDock from "../components/ui/mac-os-dock";
import EVENTS_DATA from "../data/eventsData";
import EventCard from "../components/events/EventCard";
import EventInviteModal from "../components/events/EventInviteModal";
import EventTicketsView from "../components/events/EventTicketsView";
import EventDetailView from "../components/events/EventDetailView";
import EmailVerificationModal from "../components/auth/EmailVerificationModal";

export { EVENTS_DATA };

export default function Events() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useContext(AuthContext);

  // Live real-time events from MySQL DB / Local cache / Fallback
  const [liveEvents, setLiveEvents] = useState(() => {
    const admin = getAdminEvents();
    return admin && admin.length > 0 ? admin : EVENTS_DATA;
  });

  useEffect(() => {
    fetchEventsFromDB().then((dbEvents) => {
      if (Array.isArray(dbEvents) && dbEvents.length > 0) {
        setLiveEvents(dbEvents);
      }
    });

    const handleUpdate = () => {
      const admin = getAdminEvents();
      setLiveEvents(admin && admin.length > 0 ? admin : EVENTS_DATA);
    };
    window.addEventListener("dormn_events_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("dormn_events_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  // View parameters
  const selectedEventId = searchParams.get("id");
  const viewParam = searchParams.get("view"); // 'tickets'
  const categoryParam = searchParams.get("category");

  // Filter and Booking state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryState, setActiveCategoryState] = useState("all");
  
  const activeCategory = categoryParam || activeCategoryState || "all";

  const setActiveCategory = useCallback((cat) => {
    setActiveCategoryState(cat);
  }, []);
  const [selectedPassType, setSelectedPassType] = useState("single");
  const [groupSize, setGroupSize] = useState(4);
  const [activeInviteModal, setActiveInviteModal] = useState(null);
  const [copiedInviteUrl, setCopiedInviteUrl] = useState(null);
  const [guestName, setGuestName] = useState(user?.full_name || user?.name || "");
  const [guestPhone, setGuestPhone] = useState(user?.phone || "");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
  const [pendingPassBooking, setPendingPassBooking] = useState(null);

  // User VIP Tickets stored in localStorage
  const [tickets, setTickets] = useState(() => {
    try {
      const saved = localStorage.getItem("dormn_event_tickets");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        ticketCode: "DN-CLUB-DE5046",
        eventId: "disco-club",
        eventTitle: "disco club",
        eventNight: "the tuesday night",
        dateTime: "Wed, 9 Sept, 2026 · 9pm",
        guestName: "Guest",
        passType: "SINGLE",
        status: "ACTIVE",
        image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80",
        bookedAt: new Date().toISOString(),
      },
      {
        ticketCode: "DN-CLUB-166A56",
        eventId: "disco-club",
        eventTitle: "disco club",
        eventNight: "the tuesday night",
        dateTime: "Wed, 9 Sept, 2026 · 9pm",
        guestName: "Ronak owner",
        passType: "COUPLE",
        status: "ACTIVE",
        image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80",
        bookedAt: new Date().toISOString(),
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem("dormn_event_tickets", JSON.stringify(tickets));
    } catch {}
  }, [tickets]);

  // Active Event for Detail Page
  const currentEvent = useMemo(() => {
    if (!selectedEventId) return null;
    return liveEvents.find((e) => e.id === selectedEventId) || null;
  }, [selectedEventId, liveEvents]);

  // Featured Events for Hero Slider
  const featuredEvents = useMemo(() => {
    let activeEvents = liveEvents.filter((e) => !isEventCompleted(e));
    if (user?.city) {
      const cityEvents = activeEvents.filter(
        (e) => e.city?.toLowerCase() === user.city.toLowerCase()
      );
      if (cityEvents.length > 0) return cityEvents.slice(0, 5);
    }
    return activeEvents.slice(0, 5);
  }, [liveEvents, user]);

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    if (featuredEvents.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % featuredEvents.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredEvents.length, currentSlideIndex]);

  // Filtered Events - automatically removes completed events from the public catalog
  const filteredEvents = useMemo(() => {
    return liveEvents.filter((item) => {
      if (isEventCompleted(item)) return false;

      const matchCat = activeCategory === "all" || item.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.city.toLowerCase().includes(q) ||
        item.tagline?.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [activeCategory, searchQuery, liveEvents]);

  // 5 MacOS Dock Apps (All Experiences, Clubs, Concerts, Events, My VIP Tickets)
  const eventsDockApps = useMemo(() => {
    const allCount = liveEvents.filter((e) => !isEventCompleted(e)).length;
    const clubsCount = liveEvents.filter((e) => !isEventCompleted(e) && e.category === "clubs").length;
    const concertsCount = liveEvents.filter((e) => !isEventCompleted(e) && e.category === "concerts").length;
    const campusCount = liveEvents.filter((e) => !isEventCompleted(e) && e.category === "events").length;

    return [
      {
        id: "all",
        name: `All Experiences (${allCount})`,
        badge: null,
        icon: <Sparkles className="w-full h-full p-1" />,
      },
      {
        id: "clubs",
        name: `Clubs & Nightlife (${clubsCount})`,
        badge: null,
        icon: <Music className="w-full h-full p-1" />,
      },
      {
        id: "concerts",
        name: `Live Concerts (${concertsCount})`,
        badge: null,
        icon: <CalendarHeart className="w-full h-full p-1" />,
      },
      {
        id: "events",
        name: `Campus Events (${campusCount})`,
        badge: null,
        icon: <Sparkles className="w-full h-full p-1" />,
      },
      {
        id: "tickets",
        name: `My VIP Tickets (${tickets.length})`,
        badge: tickets.length,
        icon: <Ticket className="w-full h-full p-1" />,
      },
    ];
  }, [liveEvents, tickets]);

  const handleDockClick = useCallback(
    (appIdOrObj) => {
      const targetId = typeof appIdOrObj === "object" && appIdOrObj !== null ? appIdOrObj.id : appIdOrObj;
      if (targetId === "tickets") {
        setSearchParams({ view: "tickets" });
      } else if (targetId === "all") {
        setActiveCategory("all");
        setSearchParams({});
      } else {
        setActiveCategory(targetId);
        setSearchParams({ category: targetId });
      }
    },
    [setActiveCategory, setSearchParams]
  );

  const currentOpenApps = useMemo(() => {
    if (viewParam === "tickets") return ["tickets"];
    if (currentEvent) return [currentEvent.category];
    return [activeCategory || "all"];
  }, [viewParam, currentEvent, activeCategory]);

  const renderMacOSDock = () => (
    <div className="fixed bottom-3 sm:bottom-5 left-0 right-0 z-40 flex justify-center pointer-events-none px-2">
      <div className="pointer-events-auto">
        <MacOSDock
          apps={eventsDockApps}
          onAppClick={handleDockClick}
          openApps={currentOpenApps}
          variant="party"
        />
      </div>
    </div>
  );

  const copyTicketCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Handle Pass Booking Confirmation
  const handleBookPass = async (e, appliedCouponData = null) => {
    if (e?.preventDefault) e.preventDefault();
    if (!currentEvent) return;

    // Check user authentication
    const token = localStorage.getItem("token");
    if (!token || !user) {
      navigate("/auth?redirect=" + encodeURIComponent("/events" + (currentEvent ? `?id=${currentEvent.id}` : "")));
      return;
    }

    // Check email verification (Non-Google email logins must be verified before reserving passes)
    const isEmailVerified = Boolean(user?.is_email_verified) || user?.auth_provider === "google";
    if (!isEmailVerified) {
      setPendingPassBooking(appliedCouponData);
      setShowEmailVerificationModal(true);
      return;
    }

    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const prefix =
      currentEvent.category === "concerts"
        ? "DN-CONCERT"
        : currentEvent.category === "events"
        ? "DN-EVENT"
        : "DN-CLUB";
    const generatedTicketCode = `${prefix}-${randomSuffix}`;
    const effectiveGroupSize = selectedPassType === "couple" ? 2 : selectedPassType === "group" ? groupSize : 1;

    let basePrice = typeof currentEvent.singlePrice === "number" ? currentEvent.singlePrice : 499;
    if (selectedPassType === "couple") {
      basePrice =
        typeof currentEvent.couplePrice === "number"
          ? currentEvent.couplePrice
          : currentEvent.couplePrice === "FREE"
          ? 0
          : 999;
    } else if (selectedPassType === "group") {
      const perHead = typeof currentEvent.singlePrice === "number" ? currentEvent.singlePrice : 499;
      basePrice = perHead * effectiveGroupSize;
    }

    let discount = 0;
    let netAmount = basePrice;
    let couponCode = null;

    if (appliedCouponData && appliedCouponData.valid && appliedCouponData.coupon) {
      couponCode = appliedCouponData.coupon.code;
      discount = appliedCouponData.discountAmount || 0;
      netAmount = Math.max(0, basePrice - discount);
    }

    recordEventBooking({
      ticketCode: generatedTicketCode,
      eventId: currentEvent.id,
      eventTitle: currentEvent.title,
      category: currentEvent.category,
      guestName: guestName || "Dormn Resident",
      guestPhone: guestPhone || user?.phone || "N/A",
      guestEmail: user?.email || "resident@dormn.com",
      ticketType: selectedPassType,
      quantity: effectiveGroupSize,
      seatsCount: effectiveGroupSize,
      basePrice,
      discount,
      netAmount,
      couponCode,
      paymentMethod: netAmount === 0 ? "Free Pass RSVP" : "UPI",
    });

    let createdInvites = [];
    if (selectedPassType === "couple" || selectedPassType === "group") {
      try {
        const invitePayload = {
          ticketCode: generatedTicketCode,
          eventId: currentEvent.id,
          eventTitle: currentEvent.title,
          category: currentEvent.category,
          ticketType: selectedPassType,
          groupSize: effectiveGroupSize,
          basePrice,
          netAmount,
          eventDate: currentEvent.upcomingNight?.dateFormatted || currentEvent.upcomingNight?.shortDate || "Upcoming",
          eventLocation: `${currentEvent.location}, ${currentEvent.city}`,
          eventImage: currentEvent.coverImage,
          bookerPhone: guestPhone,
        };
        const resp = await api.post("/event-tickets/create-invite", invitePayload);
        if (resp.data.success && resp.data.invites) {
          createdInvites = resp.data.invites;
        }
      } catch (err) {
        console.warn("Could not save server invites, falling back to local codes:", err.message);
        const count = selectedPassType === "couple" ? 1 : effectiveGroupSize - 1;
        for (let i = 1; i <= count; i++) {
          const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
          const code = `INV-${selectedPassType === "couple" ? "CPL" : "GRP"}-${suffix}`;
          createdInvites.push({
            inviteCode: code,
            inviteLink: `/events/invite/${code}`,
            slotNumber: i,
            status: "pending",
            slotLabel: selectedPassType === "couple" ? "Partner Pass Link" : `Member ${i + 1} Pass Link`,
          });
        }
      }
    }

    const newTicket = {
      ticketCode: generatedTicketCode,
      eventId: currentEvent.id,
      eventTitle: currentEvent.title,
      eventNight: currentEvent.upcomingNight?.title || "Night Event",
      dateTime: `${currentEvent.upcomingNight?.shortDate || ""}${
        currentEvent.upcomingNight?.shortTime ? ` · ${currentEvent.upcomingNight.shortTime}` : ""
      }`,
      guestName: guestName || "Dormn Guest",
      passType: selectedPassType.toUpperCase(),
      groupSize: effectiveGroupSize,
      status: "ACTIVE",
      image: currentEvent.coverImage,
      invites: createdInvites,
      bookedAt: new Date().toISOString(),
    };

    setTickets((prev) => [newTicket, ...prev]);
    setBookingSuccess(true);

    if (createdInvites.length > 0) {
      setActiveInviteModal({
        ticket: newTicket,
        invites: createdInvites,
        ticketType: selectedPassType,
      });
      setBookingSuccess(false);
    } else {
      setTimeout(() => {
        setBookingSuccess(false);
        setSearchParams({ view: "tickets" });
      }, 1200);
    }
  };

  const renderInviteModalComponent = () => (
    <>
      <EventInviteModal
        activeInviteModal={activeInviteModal}
        onClose={() => setActiveInviteModal(null)}
        copiedInviteUrl={copiedInviteUrl}
        setCopiedInviteUrl={setCopiedInviteUrl}
        onViewTickets={() => setSearchParams({ view: "tickets" })}
      />
      <EmailVerificationModal
        isOpen={showEmailVerificationModal}
        onClose={() => setShowEmailVerificationModal(false)}
        userEmail={user?.email}
        title="Verify Email to Book Passes"
        description="To reserve passes and confirm your student event ticket, please enter the 6-digit OTP sent to your email."
        onSuccess={() => {
          setShowEmailVerificationModal(false);
          setTimeout(() => {
            handleBookPass({ preventDefault: () => {} }, pendingPassBooking);
          }, 300);
        }}
      />
    </>
  );

  // VIEW 1: MY TICKETS
  if (viewParam === "tickets") {
    return (
      <EventTicketsView
        tickets={tickets}
        isEventCompleted={isEventCompleted}
        copyTicketCode={copyTicketCode}
        copiedCode={copiedCode}
        setActiveInviteModal={setActiveInviteModal}
        onBack={() => setSearchParams({})}
        onSelectEvent={(id) => setSearchParams({ id })}
        renderInviteModal={renderInviteModalComponent}
        renderMacOSDock={renderMacOSDock}
      />
    );
  }

  // VIEW 2: EVENT DETAIL & BOOKING
  if (currentEvent) {
    return (
      <EventDetailView
        currentEvent={currentEvent}
        selectedPassType={selectedPassType}
        setSelectedPassType={setSelectedPassType}
        groupSize={groupSize}
        setGroupSize={setGroupSize}
        guestName={guestName}
        setGuestName={setGuestName}
        guestPhone={guestPhone}
        setGuestPhone={setGuestPhone}
        handleBookPass={handleBookPass}
        bookingSuccess={bookingSuccess}
        onBack={() => setSearchParams({})}
        renderInviteModal={renderInviteModalComponent}
        renderMacOSDock={renderMacOSDock}
      />
    );
  }

  // VIEW 3: DISCOVER CATALOG
  return (
    <div className="min-h-screen events-page-wrapper bg-[#FAF9FD] dark:bg-[#06080F] text-gray-900 dark:text-white selection:bg-pink-500 selection:text-white relative overflow-x-hidden pb-32 sm:pb-36">
      {/* Dynamic Ambient Background Glows */}
      <div className="pointer-events-none fixed -left-32 -top-32 h-96 w-96 rounded-full bg-purple-300/25 dark:bg-purple-600/20 blur-[120px] z-0"></div>
      <div className="pointer-events-none fixed -right-32 top-1/3 h-96 w-96 rounded-full bg-pink-300/25 dark:bg-pink-600/20 blur-[120px] z-0"></div>
      <div className="pointer-events-none fixed bottom-0 left-1/3 h-96 w-96 rounded-full bg-amber-300/15 dark:bg-amber-500/10 blur-[120px] z-0"></div>

      <SEOHead
        title="Dormn Events | Discover Concerts, Club Nights & Campus Meetups"
        description="Book your spot at the hottest club nights, live concerts, and student meetups with zero hassle. Singles pay, couples enter free."
      />
      <Navbar />

      {/* Electric Party Hero Section with Featured Event Slider */}
      <div className="relative overflow-hidden bg-gray-900 border-b border-purple-200/70 dark:border-purple-500/20 text-white h-[50vh] min-h-[400px] max-h-[600px] flex items-center z-10 transition-all duration-700">
        
        {/* Full-width Background Image */}
        {featuredEvents.length > 0 && (
          <div className="absolute inset-0 z-0 transition-opacity duration-1000">
            <img 
              src={featuredEvents[currentSlideIndex]?.coverImage} 
              className="w-full h-full object-cover" 
              alt={featuredEvents[currentSlideIndex]?.title} 
            />
            {/* Dark gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
          </div>
        )}

        <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 w-full relative z-10 py-16">
          
          {/* Dynamic Event Slider */}
          {featuredEvents.length > 0 ? (
            <div className="flex items-center justify-between w-full animate-[fadeIn_0.5s_ease-out]">
              
              {/* Left Arrow (Desktop only) */}
              <button 
                onClick={() => setCurrentSlideIndex((prev) => (prev - 1 + featuredEvents.length) % featuredEvents.length)}
                className="hidden md:flex p-3 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-md transition -ml-4 border border-white/10"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>

              {/* Slider Content */}
              <div className="flex-1 flex flex-col items-start gap-4 md:gap-6 w-full max-w-4xl px-2 md:px-8">
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white capitalize leading-tight drop-shadow-lg line-clamp-2 md:line-clamp-3">
                  {featuredEvents[currentSlideIndex].title}
                </h1>
                
                <div>
                  <button 
                    onClick={() => setSearchParams({ id: featuredEvents[currentSlideIndex].id })}
                    className="px-8 py-3 rounded-full bg-pink-600 hover:bg-pink-700 text-white font-black uppercase tracking-wide hover:scale-105 transition-transform shadow-lg cursor-pointer"
                  >
                    Book now
                  </button>
                </div>
              </div>

              {/* Right Arrow (Desktop only) */}
              <button 
                onClick={() => setCurrentSlideIndex((prev) => (prev + 1) % featuredEvents.length)}
                className="hidden md:flex p-3 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-md transition -mr-4 border border-white/10"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>

            </div>
          ) : (
            <div className="py-20 text-left px-8">
              <h1 className="text-4xl sm:text-6xl font-black text-white">Discover Club Nights & Concerts</h1>
            </div>
          )}
        </div>
      </div>

      {/* Global Search Bar - Placed below the hero slider */}
      <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 mt-6 relative z-10">
        <div className="relative w-full max-w-3xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500 dark:text-purple-300/60" size={17} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by club, concert, artist, or city..."
            className="events-input-bg w-full pl-11 pr-4 py-3 sm:py-3.5 rounded-full bg-white dark:bg-[#120D26]/90 border border-purple-200 dark:border-purple-500/30 text-gray-900 dark:text-white placeholder-purple-400/60 dark:placeholder-purple-300/40 text-xs sm:text-sm font-medium outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-purple-700 hover:text-purple-950 dark:text-purple-300 dark:hover:text-white cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area - Category Rows or Grid */}
      <div className="max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 mt-6 sm:mt-10 relative z-10">
        {filteredEvents.length === 0 ? (
          <div className="events-card-bg bg-white dark:bg-[#0D0B1C]/90 border border-purple-200 dark:border-purple-500/25 rounded-3xl p-12 text-center shadow-xl backdrop-blur-xl">
            <Sparkles className="mx-auto text-pink-600 dark:text-pink-400/70 mb-3" size={40} />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {searchQuery ? "No matching experiences found" : "No upcoming events posted yet"}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 max-w-md mx-auto">
              {searchQuery
                ? "Try searching with a different term, city, or reset category filters."
                : "Check back soon for upcoming concerts, nightclub events, and campus meetups! Event managers will post new listings shortly."}
            </p>
          </div>
        ) : activeCategory === "all" && !searchQuery ? (
          <div className="space-y-4">
            {[
              { id: 'clubs', title: 'Hottest Nightclubs & Bars', items: filteredEvents.filter(e => e.category === 'clubs') },
              { id: 'concerts', title: 'Live Concerts & Stadium Fests', items: filteredEvents.filter(e => e.category === 'concerts') },
              { id: 'events', title: 'College Fests & Standup Events', items: filteredEvents.filter(e => e.category === 'events') },
            ].map(cat => cat.items.length > 0 && (
              <div key={cat.id} className="mb-10 sm:mb-12">
                <div className="flex items-center justify-between mb-4 sm:mb-5 pr-2">
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                    {cat.title}
                  </h2>
                  <button 
                    onClick={() => { setActiveCategory(cat.id); setSearchParams({ category: cat.id }); }}
                    className="text-xs font-black uppercase tracking-wider text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition"
                  >
                    View more &rarr;
                  </button>
                </div>
                {/* Horizontal Scroll Row */}
                <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 sm:gap-6 pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {cat.items.map((item) => (
                    <div key={item.id} className="snap-start shrink-0 w-[240px] sm:w-[280px] md:w-[320px]">
                      <EventCard item={item} onSelect={(id) => setSearchParams({ id })} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-10 sm:mb-12">
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {activeCategory === "clubs" ? "Hottest Nightclubs & Bars" : activeCategory === "concerts" ? "Live Concerts & Stadium Fests" : activeCategory === "events" ? "College Fests & Standup Events" : "Search Results"}
              </h2>
              <span className="text-xs font-bold text-purple-700 dark:text-purple-300/80">
                {filteredEvents.length} {filteredEvents.length === 1 ? "experience" : "experiences"} live
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-5 sm:gap-6">
              {filteredEvents.map((item) => (
                <EventCard key={item.id} item={item} onSelect={(id) => setSearchParams({ id })} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Invite Share Modal */}
      {renderInviteModalComponent()}

      {/* Floating macOS Dock Navbar */}
      {renderMacOSDock()}
    </div>
  );
}
