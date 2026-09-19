import { Club, ClubEvent, ClubBooking, ClubTicket } from "../schemas/clubSchema.js";
import User from "../schemas/userSchema.js";
import crypto from "crypto";
import { serialize } from "../utils/serialize.js";

// ==========================================
// CLUB CRUD
// ==========================================

// Create Club
export const createClub = async (clubData) => {
  const club = await Club.create(clubData);
  return { insertId: club._id };
};

// Get All Active Clubs (with next upcoming event)
export const getAllActiveClubs = async () => {
  const clubs = await Club.find({ status: "active" })
    .sort({ created_at: -1 })
    .lean();

  // Attach next upcoming event to each club
  const clubsWithEvents = await Promise.all(
    clubs.map(async (club) => {
      const nextEvent = await ClubEvent.findOne({
        club_id: club._id,
        date: { $gte: new Date() },
      })
        .sort({ date: 1 })
        .lean();

      // Calculate remaining capacity for next event
      let remaining_capacity = null;
      if (nextEvent) {
        const peopleCount = await countEventPeople(nextEvent._id);
        remaining_capacity = nextEvent.capacity - peopleCount;
      }

      return {
        ...serialize(club),
        next_event: nextEvent ? serialize(nextEvent) : null,
        remaining_capacity,
      };
    })
  );

  return clubsWithEvents;
};

// Get Club By ID (with images, events, live capacity)
export const getClubById = async (id) => {
  const clubId = Number(id);
  if (!id || !Number.isFinite(clubId)) return null;

  const club = await Club.findById(clubId).lean();
  if (!club) return null;

  // Get upcoming events
  const events = await ClubEvent.find({
    club_id: clubId,
    date: { $gte: new Date() },
  })
    .sort({ date: 1 })
    .lean();

  // Calculate remaining capacity per event
  const eventsWithCapacity = await Promise.all(
    events.map(async (event) => {
      const peopleCount = await countEventPeople(event._id);
      return {
        ...serialize(event),
        remaining_capacity: event.capacity - peopleCount,
      };
    })
  );

  return {
    ...serialize(club),
    events: eventsWithCapacity,
  };
};

// Get All Clubs (admin view - all statuses)
export const getAllClubsAdmin = async () => {
  const clubs = await Club.find()
    .sort({ created_at: -1 })
    .lean();

  const clubsWithStats = await Promise.all(
    clubs.map(async (club) => {
      const totalBookings = await ClubBooking.countDocuments({
        club_id: club._id,
        status: "confirmed",
      });
      const totalRevenue = await ClubBooking.aggregate([
        { $match: { club_id: club._id, status: "confirmed", payment_status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);

      return {
        ...serialize(club),
        total_bookings: totalBookings,
        total_revenue: totalRevenue[0]?.total || 0,
      };
    })
  );

  return clubsWithStats;
};

// Update Club
export const updateClub = async (id, clubData) => {
  return await Club.findByIdAndUpdate(Number(id), clubData, { new: true });
};

// Delete Club (cascade: images, events, bookings, tickets)
export const deleteClub = async (id) => {
  const clubId = Number(id);
  await ClubTicket.deleteMany({ club_id: clubId });
  await ClubBooking.deleteMany({ club_id: clubId });
  await ClubEvent.deleteMany({ club_id: clubId });
  await Club.findByIdAndDelete(clubId);
};

// ==========================================
// CLUB IMAGES
// ==========================================

export const saveClubImages = async (clubId, images) => {
  if (!images || images.length === 0) return;
  const imageDocs = images.map((img, i) => ({
    image_url: img,
    display_order: i + 1,
  }));
  await Club.findByIdAndUpdate(Number(clubId), {
    $push: { images: { $each: imageDocs } },
  });
};

// ==========================================
// CLUB EVENTS
// ==========================================

export const createClubEvent = async (eventData) => {
  const event = await ClubEvent.create(eventData);
  return { insertId: event._id };
};

export const getClubEvents = async (clubId) => {
  const events = await ClubEvent.find({ club_id: Number(clubId) })
    .sort({ date: 1 })
    .lean();
  return serialize(events);
};

export const deleteClubEvent = async (eventId) => {
  // Cascade: delete bookings and tickets for this event
  const id = Number(eventId);
  const event = await ClubEvent.findById(id);
  if (event) {
    await ClubTicket.deleteMany({ event_id: id });
    await ClubBooking.deleteMany({ event_id: id });
    await ClubEvent.findByIdAndDelete(id);
  }
};

// ==========================================
// CAPACITY HELPERS
// ==========================================

// Count confirmed PEOPLE for an event (single=1, couple=2)
const countEventPeople = async (eventId) => {
  const bookings = await ClubBooking.find({
    event_id: Number(eventId),
    status: "confirmed",
  }).lean();

  return bookings.reduce((count, b) => {
    return count + (b.booking_type === "couple" ? 2 : 1);
  }, 0);
};

export { countEventPeople };

// ==========================================
// CLUB BOOKINGS
// ==========================================

// Create Booking
export const createClubBooking = async (bookingData) => {
  const booking = await ClubBooking.create(bookingData);
  return { insertId: booking._id };
};

// Get Booking By ID
export const getClubBookingById = async (id) => {
  const bookingId = Number(id);
  if (!id || !Number.isFinite(bookingId)) return null;
  const booking = await ClubBooking.findById(bookingId)
    .populate("club_id", "name single_entry_fee cover_image")
    .populate("event_id", "title date start_time end_time")
    .populate("booker_id", "full_name email gender")
    .populate("partner_id", "full_name email gender")
    .lean();
  return booking ? serialize(booking) : null;
};

// Get Booking By Invite Token
export const getBookingByToken = async (token) => {
  const booking = await ClubBooking.findOne({ invite_token: token })
    .populate("club_id", "name single_entry_fee cover_image tagline")
    .populate("event_id", "title date start_time end_time capacity")
    .populate("booker_id", "full_name email gender")
    .lean();
  return booking ? serialize(booking) : null;
};

// Get User's Bookings
export const getUserBookings = async (userId) => {
  const bookings = await ClubBooking.find({ booker_id: Number(userId) })
    .sort({ booking_date: -1 })
    .populate("club_id", "name cover_image city area")
    .populate("event_id", "title date start_time end_time")
    .lean();
  return serialize(bookings);
};

// Get Bookings For Admin (by club)
export const getBookingsByClub = async (clubId) => {
  const bookings = await ClubBooking.find({ club_id: Number(clubId) })
    .sort({ booking_date: -1 })
    .populate("booker_id", "full_name email")
    .populate("partner_id", "full_name email")
    .populate("event_id", "title date start_time end_time")
    .lean();
  return serialize(bookings);
};

// Update Booking
export const updateClubBooking = async (id, updateData) => {
  return await ClubBooking.findByIdAndUpdate(Number(id), updateData, { new: true });
};

// ==========================================
// CLUB TICKETS
// ==========================================

// Generate unique ticket code
const generateTicketCode = () => {
  const hex = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `DN-CLUB-${hex}`;
};

// Create Ticket
export const createClubTicket = async (ticketData) => {
  // Ensure unique ticket code
  let ticket_code;
  let exists = true;
  while (exists) {
    ticket_code = generateTicketCode();
    const existing = await ClubTicket.findOne({ ticket_code });
    if (!existing) exists = false;
  }

  const ticket = await ClubTicket.create({ ...ticketData, ticket_code });
  return { insertId: ticket._id, ticket_code };
};

// Create Multiple Tickets
export const createMultipleTickets = async (ticketsData) => {
  const results = [];
  for (const data of ticketsData) {
    const result = await createClubTicket(data);
    results.push(result);
  }
  return results;
};

// Get User's Tickets (with live expiry)
export const getUserTickets = async (userId) => {
  const tickets = await ClubTicket.find({ user_id: Number(userId) })
    .sort({ created_at: -1 })
    .populate("club_id", "name cover_image city area")
    .populate("event_id", "title date start_time end_time")
    .lean();

  const now = new Date();

  return tickets.map((ticket) => {
    const eventDate = ticket.event_id?.date;
    const isExpired = eventDate && new Date(eventDate) < now;
    return {
      ...serialize(ticket),
      status: isExpired ? "expired" : ticket.status,
    };
  });
};

// Get Tickets By Booking
export const getTicketsByBooking = async (bookingId) => {
  const tickets = await ClubTicket.find({ booking_id: Number(bookingId) }).lean();
  return serialize(tickets);
};

// Cancel Tickets By Booking
export const cancelTicketsByBooking = async (bookingId) => {
  await ClubTicket.updateMany(
    { booking_id: Number(bookingId) },
    { status: "cancelled" }
  );
};
