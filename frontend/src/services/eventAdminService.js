import API from "./api.js";
import EVENTS_DATA from "../data/eventsData.js";

const STORAGE_KEYS = {
  EVENTS: "dormn_admin_events_list",
  COUPONS: "dormn_admin_coupons_list",
  ATTENDEES: "dormn_admin_attendees_list"
};

const getStored = (key, fallback) => {
  try {
    if (typeof window === "undefined" || !window.localStorage) return fallback;
    const val = localStorage.getItem(key);
    return val !== null ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
};

const getEventEndOfDay = (eventOrDate, explicitStatus) => {
  if (explicitStatus === "completed" || explicitStatus === "ended") return 0;
  if (!eventOrDate) return null;

  let str = eventOrDate;
  if (typeof eventOrDate === "object") {
    if (eventOrDate.status === "completed" || eventOrDate.status === "ended") return 0;
    str = eventOrDate.upcomingNight?.dateFormatted || eventOrDate.dateTime || eventOrDate.eventNight || eventOrDate.eventDate || eventOrDate.date;
  }

  if (typeof str === "string") {
    try {
      const datePart = str.split("·")[0].split("-")[0].replace(/^[a-zA-Z]+,?\s+/, "").trim();
      const parsed = Date.parse(datePart);
      if (!isNaN(parsed)) {
        const end = new Date(parsed);
        end.setHours(23, 59, 59, 999);
        return end.getTime();
      }
    } catch {}
  }
  return null;
};

export const isEventCompleted = (eventOrDate, explicitStatus) => {
  if (explicitStatus === "completed" || explicitStatus === "ended") return true;
  const end = getEventEndOfDay(eventOrDate, explicitStatus);
  return end !== null ? (end === 0 || Date.now() > end) : false;
};

export const getEventTimeStatus = (eventOrDate, explicitStatus) => {
  if (explicitStatus === "completed" || explicitStatus === "ended") {
    return { isCompleted: true, label: "Event Completed", daysLeft: 0, isClose: false };
  }
  const end = getEventEndOfDay(eventOrDate, explicitStatus);
  if (end === null) return { isCompleted: false, label: null, daysLeft: null, isClose: false };
  if (end === 0 || Date.now() > end) return { isCompleted: true, label: "Event Completed", daysLeft: 0, isClose: false };

  const diffMs = end - Date.now();
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.ceil(diffMs / 86400000);

  let label = null;
  if (diffHours <= 24) label = diffHours <= 1 ? "Event concludes in 1 hour" : `Event concludes in ${diffHours} hours`;
  else if (diffDays === 1) label = "Event concludes in 1 day";
  else if (diffDays <= 7) label = `Event concludes in ${diffDays} days`;

  return {
    isCompleted: false,
    label,
    daysLeft: diffDays,
    hoursLeft: diffHours,
    isUrgent: diffDays <= 3,
    isClose: diffDays <= 7
  };
};

const DEFAULT_COUPONS = [
  {
    id: "cpn-dormn50",
    code: "DORMN50",
    discountPercent: 50,
    discountAmount: null,
    maxUses: 100,
    usedCount: 18,
    applicableCategory: "all",
    status: "active",
    description: "50% off on all events, concerts & clubs"
  },
  {
    id: "cpn-party200",
    code: "PARTY200",
    discountPercent: null,
    discountAmount: 200,
    maxUses: 50,
    usedCount: 42,
    applicableCategory: "all",
    status: "active",
    description: "Flat ₹200 discount on pass bookings"
  },
  {
    id: "cpn-expired10",
    code: "EXPIRED10",
    discountPercent: null,
    discountAmount: 100,
    maxUses: 10,
    usedCount: 10,
    applicableCategory: "all",
    status: "expired",
    description: "Flash promo code (Capacity exhausted)"
  },
  {
    id: "cpn-clubvip",
    code: "VIPCLUB",
    discountPercent: 20,
    discountAmount: null,
    maxUses: 100,
    usedCount: 15,
    applicableCategory: "clubs",
    status: "active",
    description: "20% off exclusively for Nightclubs & VIP tables"
  },
  {
    id: "cpn-campusfest",
    code: "CAMPUS150",
    discountPercent: null,
    discountAmount: 150,
    maxUses: 80,
    usedCount: 22,
    applicableCategory: "events",
    status: "active",
    description: "Flat ₹150 off for College & Campus Events"
  }
];

export const initEventAdminStore = (forceReset = false) => {
  if (typeof window === "undefined" || !window.localStorage) return;
  if (forceReset || localStorage.getItem(STORAGE_KEYS.EVENTS) === null) {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(EVENTS_DATA));
  }
  const existingCoupons = getStored(STORAGE_KEYS.COUPONS, null);
  if (forceReset || existingCoupons === null || !existingCoupons.length) {
    localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(DEFAULT_COUPONS));
  }
  if (forceReset || localStorage.getItem(STORAGE_KEYS.ATTENDEES) === null) {
    localStorage.setItem(STORAGE_KEYS.ATTENDEES, JSON.stringify([]));
  }
};
initEventAdminStore(false);

export const fetchEventsFromDB = async () => {
  try {
    const res = await API.get("/events");
    if (res.data?.success && Array.isArray(res.data.events) && res.data.events.length > 0) {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(res.data.events));
      window.dispatchEvent(new Event("dormn_events_updated"));
      return res.data.events;
    }
  } catch (err) {
    console.warn("Using cached events, could not reach MySQL DB:", err.message);
  }
  return getAdminEvents();
};

export const getAdminEvents = () => {
  const stored = getStored(STORAGE_KEYS.EVENTS, null);
  return Array.isArray(stored) && stored.length > 0 ? stored : EVENTS_DATA;
};

export const getAdminCoupons = () => {
  const coupons = getStored(STORAGE_KEYS.COUPONS, []);
  return coupons && coupons.length > 0 ? coupons : DEFAULT_COUPONS;
};

export const getAdminAttendees = () => getStored(STORAGE_KEYS.ATTENDEES, []);

export const validateCoupon = (inputCode, event, totalAmount) => {
  if (!inputCode || typeof inputCode !== "string" || !inputCode.trim()) {
    return { valid: false, error: "Please enter a coupon code." };
  }

  const code = inputCode.trim().toUpperCase();
  const coupons = getAdminCoupons();
  const coupon = coupons.find((c) => c.code.toUpperCase() === code);

  if (!coupon) {
    return { valid: false, error: "Invalid coupon code. Please check and try again." };
  }

  const maxUses = Number(coupon.maxUses) || 100;
  const usedCount = Number(coupon.usedCount) || 0;

  // Check if capacity is exhausted or marked expired
  if (coupon.status === "expired" || coupon.status === "disabled" || usedCount >= maxUses) {
    return {
      valid: false,
      error: `This coupon code is expired. Capacity has been fully used (${usedCount}/${maxUses} used).`,
      isExpired: true,
      coupon,
      usedCount,
      maxUses,
    };
  }

  // Check date expiry if provided
  if (coupon.expiryDate) {
    const expTime = new Date(coupon.expiryDate).getTime() + 86400000;
    if (Date.now() > expTime) {
      return {
        valid: false,
        error: "This coupon code has expired.",
        isExpired: true,
        coupon,
        usedCount,
        maxUses,
      };
    }
  }

  // Check applicable category
  if (
    coupon.applicableCategory &&
    coupon.applicableCategory !== "all" &&
    event?.category &&
    coupon.applicableCategory !== event.category
  ) {
    return {
      valid: false,
      error: `This coupon is only valid for ${coupon.applicableCategory} listings.`,
    };
  }

  // Calculate discount amount
  let discountAmount = 0;
  if (coupon.discountPercent) {
    discountAmount = Math.round((totalAmount * Number(coupon.discountPercent)) / 100);
  } else if (coupon.discountAmount) {
    discountAmount = Math.min(totalAmount, Number(coupon.discountAmount));
  }

  const remaining = Math.max(0, maxUses - usedCount);

  return {
    valid: true,
    coupon,
    discountAmount,
    netAmount: Math.max(0, totalAmount - discountAmount),
    usedCount,
    maxUses,
    remainingUses: remaining,
    message: `Coupon "${coupon.code}" applied! Saved ₹${discountAmount}. (Used: ${usedCount}/${maxUses} times · ${remaining} spots left)`,
  };
};

export const saveAdminCoupon = (coupon) => {
  const coupons = getAdminCoupons();
  const idx = coupons.findIndex(c => c.id === coupon.id || c.code === coupon.code);
  const updated = {
    ...coupon,
    id: coupon.id || `cpn-${Date.now()}`,
    status: coupon.status || "active",
    usedCount: coupon.usedCount || 0
  };
  if (idx >= 0) coupons[idx] = updated;
  else coupons.unshift(updated);
  localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(coupons));
  window.dispatchEvent(new Event("dormn_events_updated"));
  return coupons;
};

export const deleteAdminCoupon = (couponId) => {
  const coupons = getAdminCoupons().filter(c => c.id !== couponId);
  localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(coupons));
  window.dispatchEvent(new Event("dormn_events_updated"));
  return coupons;
};

export const toggleAttendeeCheckin = (ticketId) => {
  const attendees = getAdminAttendees();
  const idx = attendees.findIndex(a => a.id === ticketId);
  if (idx >= 0) {
    attendees[idx].status = attendees[idx].status === "checked_in" ? "confirmed" : "checked_in";
    localStorage.setItem(STORAGE_KEYS.ATTENDEES, JSON.stringify(attendees));
    window.dispatchEvent(new Event("dormn_tickets_updated"));
  }
  return attendees;
};

export const saveAdminEvent = async (eventData) => {
  const events = getAdminEvents();
  const idx = events.findIndex(e => e.id === eventData.id);
  const targetId = eventData.id || `event-${Date.now()}`;
  const fullData = { ...eventData, id: targetId };

  if (idx >= 0) events[idx] = { ...events[idx], ...fullData };
  else events.unshift({ status: "upcoming", ...fullData });

  localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  window.dispatchEvent(new Event("dormn_events_updated"));

  try {
    if (idx >= 0) await API.put(`/events/${targetId}`, fullData);
    else await API.post("/events", fullData);
  } catch (err) {
    console.warn("Could not sync event to MySQL DB:", err.message);
  }

  return events;
};

export const deleteAdminEvent = async (eventId) => {
  const events = getAdminEvents().filter(e => e.id !== eventId);
  localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  window.dispatchEvent(new Event("dormn_events_updated"));

  try {
    await API.delete(`/events/${eventId}`);
  } catch (err) {
    console.warn("Could not delete event from MySQL DB:", err.message);
  }

  return events;
};

export const recordEventBooking = (booking) => {
  const attendees = getAdminAttendees();
  const events = getAdminEvents();

  const newAttendee = {
    id: booking.ticketCode || `TKT-${Date.now().toString().slice(-6)}`,
    eventId: booking.eventId,
    eventTitle: booking.eventTitle,
    category: booking.category || "events",
    guestName: booking.guestName || "Guest",
    guestPhone: booking.guestPhone || "+91 98765 43210",
    guestEmail: booking.guestEmail || "guest@dormn.com",
    ticketType: booking.ticketType || "single",
    quantity: booking.quantity || 1,
    seatsCount: booking.ticketType === "couple" ? 2 : booking.ticketType === "group" ? (booking.quantity || 4) : 1,
    basePrice: booking.basePrice || 0,
    discount: booking.discount || 0,
    netAmount: booking.netAmount || 0,
    couponCode: booking.couponCode || null,
    status: "confirmed",
    bookingDate: new Date().toISOString(),
    paymentMethod: booking.paymentMethod || "UPI"
  };

  attendees.unshift(newAttendee);
  localStorage.setItem(STORAGE_KEYS.ATTENDEES, JSON.stringify(attendees));

  const evIdx = events.findIndex(e => e.id === booking.eventId);
  if (evIdx >= 0 && events[evIdx].upcomingNight) {
    events[evIdx].upcomingNight.spotsLeft = Math.max(0, (events[evIdx].upcomingNight.spotsLeft || 50) - (newAttendee.seatsCount || 1));
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  }

  if (booking.couponCode) {
    const coupons = getAdminCoupons();
    const cIdx = coupons.findIndex(c => c.code?.toUpperCase() === booking.couponCode.toUpperCase());
    if (cIdx >= 0) {
      const newUsed = (Number(coupons[cIdx].usedCount) || 0) + 1;
      coupons[cIdx].usedCount = newUsed;
      const maxUses = Number(coupons[cIdx].maxUses) || 100;
      if (newUsed >= maxUses) {
        coupons[cIdx].status = "expired";
      }
      localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(coupons));
    }
  }

  window.dispatchEvent(new Event("dormn_events_updated"));
  window.dispatchEvent(new Event("dormn_tickets_updated"));
  return newAttendee;
};

const getTimeSeries = (timeframe) => {
  const configs = {
    day: ["12 AM", "3 AM", "6 AM", "9 AM", "12 PM", "3 PM", "6 PM", "8 PM", "9 PM", "10 PM", "11 PM"],
    week: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    month: ["Week 1", "Week 2", "Week 3", "Week 4"],
    year: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  };
  return (configs[timeframe] || configs.month).map(label => ({
    label, revenue: 0, tickets: 0, couples: 0, groups: 0, singles: 0
  }));
};

export const computeEventAnalytics = (entity = "all", timeframe = "month") => {
  const allEvents = getAdminEvents();
  const allAttendees = getAdminAttendees();
  const allCoupons = getAdminCoupons();

  let filtered = allAttendees;
  let targetEventObj = null;

  if (entity.startsWith("category:")) {
    const cat = entity.replace("category:", "");
    filtered = allAttendees.filter(a => a.category === cat);
  } else if (entity !== "all") {
    filtered = allAttendees.filter(a => a.eventId === entity);
    targetEventObj = allEvents.find(e => e.id === entity);
  }

  const timeLimits = { day: 86400000, week: 604800000, month: 2592000000, year: 31536000000 };
  const maxAge = timeLimits[timeframe] || timeLimits.month;
  const now = Date.now();
  const activeAttendees = filtered.filter(a => (now - new Date(a.bookingDate).getTime()) <= maxAge);

  let totalAttendeesCount = 0, totalGrossRevenue = 0, totalDiscountsGiven = 0;
  let singleCount = 0, singleRev = 0;
  let coupleCount = 0, coupleAttendees = 0, coupleRev = 0, freeCouples = 0;
  let groupCount = 0, groupAttendees = 0, groupRev = 0;

  const couponStatsMap = {};
  allCoupons.forEach(c => {
    couponStatsMap[c.code] = { ...c, usedCount: 0, totalDiscountGiven: 0, revenueGenerated: 0 };
  });

  activeAttendees.forEach(a => {
    const seats = a.seatsCount || (a.ticketType === "couple" ? 2 : a.ticketType === "group" ? 5 : 1);
    totalAttendeesCount += seats;
    totalGrossRevenue += a.netAmount || 0;
    totalDiscountsGiven += a.discount || 0;

    if (a.ticketType === "single") {
      singleCount++;
      singleRev += a.netAmount || 0;
    } else if (a.ticketType === "couple") {
      coupleCount++;
      coupleAttendees += seats;
      coupleRev += a.netAmount || 0;
      if (!a.netAmount) freeCouples++;
    } else if (a.ticketType === "group") {
      groupCount++;
      groupAttendees += seats;
      groupRev += a.netAmount || 0;
    }

    if (a.couponCode) {
      if (!couponStatsMap[a.couponCode]) {
        couponStatsMap[a.couponCode] = { code: a.couponCode, usedCount: 0, totalDiscountGiven: 0, revenueGenerated: 0, status: "active" };
      }
      couponStatsMap[a.couponCode].usedCount++;
      couponStatsMap[a.couponCode].totalDiscountGiven += a.discount || 0;
      couponStatsMap[a.couponCode].revenueGenerated += a.netAmount || 0;
    }
  });

  const totalBuyers = activeAttendees.length;

  return {
    entity,
    timeframe,
    targetEventObj,
    kpis: {
      totalTicketBuyers: totalBuyers,
      totalAttendeesCount,
      totalGrossRevenue,
      totalDiscountsGiven,
      avgOrderValue: totalBuyers > 0 ? Math.round(totalGrossRevenue / totalBuyers) : 0,
      singleTickets: { count: singleCount, revenue: singleRev, percentage: totalBuyers > 0 ? Math.round((singleCount / totalBuyers) * 100) : 0 },
      coupleTickets: { count: coupleCount, attendeesCount: coupleAttendees, revenue: coupleRev, freeEntries: freeCouples, percentage: totalBuyers > 0 ? Math.round((coupleCount / totalBuyers) * 100) : 0 },
      groupTickets: { count: groupCount, attendeesCount: groupAttendees, revenue: groupRev, avgGroupSize: groupCount > 0 ? (groupAttendees / groupCount).toFixed(1) : "0", percentage: totalBuyers > 0 ? Math.round((groupCount / totalBuyers) * 100) : 0 }
    },
    trendData: getTimeSeries(timeframe),
    ticketDistributionData: [
      { name: "Single Passes", value: singleCount, revenue: singleRev, color: "#3B82F6" },
      { name: "Couple Passes", value: coupleCount, revenue: coupleRev, color: "#A855F7" },
      { name: "Group Passes", value: groupCount, revenue: groupRev, color: "#10B981" }
    ],
    categorySplitData: ["concerts", "clubs", "events"].map(cat => ({
      category: cat === "concerts" ? "Concerts" : cat === "clubs" ? "Clubs & Nightlife" : "Events & Fests",
      revenue: activeAttendees.filter(a => a.category === cat).reduce((s, a) => s + (a.netAmount || 0), 0),
      tickets: activeAttendees.filter(a => a.category === cat).length,
      fill: cat === "concerts" ? "#EC4899" : cat === "clubs" ? "#8B5CF6" : "#10B981"
    })),
    couponsList: Object.values(couponStatsMap).sort((a, b) => b.usedCount - a.usedCount),
    recentBookings: activeAttendees.slice(0, 10),
    totalCouponsActive: allCoupons.filter(c => c.status === "active").length
  };
};
