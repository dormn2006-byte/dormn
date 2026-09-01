import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Razorpay from "razorpay";
import {
  createClub,
  getAllActiveClubs,
  getClubById,
  getAllClubsAdmin,
  updateClub,
  deleteClub,
  saveClubImages,
  createClubEvent,
  deleteClubEvent,
  countEventPeople,
  createClubBooking,
  getClubBookingById,
  getBookingByToken,
  getUserBookings,
  getBookingsByClub,
  updateClubBooking,
  createClubTicket,
  createMultipleTickets,
  getUserTickets,
  cancelTicketsByBooking,
} from "../models/clubModel.js";
import User from "../schemas/userSchema.js";
import { processImage } from "../utils/imageProcessor.js";

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ==========================================
// PUBLIC CONTROLLERS
// ==========================================

// GET /clubs - List active clubs with next upcoming night
export const listClubs = async (req, res) => {
  try {
    const clubs = await getAllActiveClubs();
    return res.status(200).json({ success: true, total: clubs.length, clubs });
  } catch (error) {
    console.error("List Clubs Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// GET /clubs/:id - Club details with images and events (live remaining capacity)
export const getClubDetails = async (req, res) => {
  try {
    const club = await getClubById(req.params.id);
    if (!club) {
      return res.status(404).json({ success: false, message: "Club not found" });
    }
    return res.status(200).json({ success: true, club });
  } catch (error) {
    console.error("Get Club Details Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// GET /clubs/invite/:token - Partner invite landing page data
export const getInviteData = async (req, res) => {
  try {
    const booking = await getBookingByToken(req.params.token);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Invalid or expired invite link" });
    }
    if (booking.status === "confirmed") {
      return res.status(400).json({ success: false, message: "This invite has already been accepted" });
    }
    if (booking.status === "cancelled") {
      return res.status(400).json({ success: false, message: "This booking has been cancelled" });
    }
    return res.status(200).json({
      success: true,
      booking: {
        id: booking._id,
        club_name: booking.club_id?.name,
        club_tagline: booking.club_id?.tagline,
        club_cover: booking.club_id?.cover_image,
        event_title: booking.event_id?.title,
        event_date: booking.event_id?.date,
        event_start_time: booking.event_id?.start_time,
        booker_name: booking.booker_id?.full_name,
        booker_gender: booking.booker_id?.gender,
      },
    });
  } catch (error) {
    console.error("Get Invite Data Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ==========================================
// USER BOOKING CONTROLLERS
// ==========================================

// POST /clubs/booking - Create booking (single or couple)
export const createBooking = async (req, res) => {
  try {
    const { club_id, event_id, booking_type, gender } = req.body;

    // Validation
    if (!club_id || !event_id || !booking_type) {
      return res.status(400).json({
        success: false,
        message: "club_id, event_id, and booking_type are required",
      });
    }
    if (!["single", "couple"].includes(booking_type)) {
      return res.status(400).json({
        success: false,
        message: "booking_type must be 'single' or 'couple'",
      });
    }

    // Validate gender for single bookings
    if (booking_type === "single" && !gender) {
      return res.status(400).json({
        success: false,
        message: "Gender is required for single booking",
      });
    }
    if (gender && !["male", "female"].includes(gender)) {
      return res.status(400).json({
        success: false,
        message: "Gender must be 'male' or 'female'",
      });
    }

    // Check club exists and is active
    const club = await getClubById(club_id);
    if (!club || club.status !== "active") {
      return res.status(404).json({ success: false, message: "Club not found or inactive" });
    }

    // Check event exists
    const event = club.events?.find((e) => e._id.toString() === event_id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    // Check capacity (couple = 2 people, single = 1)
    const peopleCount = booking_type === "couple" ? 2 : 1;
    if (event.remaining_capacity < peopleCount) {
      return res.status(400).json({
        success: false,
        message: `Not enough capacity. Only ${event.remaining_capacity} spots left.`,
      });
    }

    // Update user gender if provided
    if (gender) {
      await User.findByIdAndUpdate(req.user.id, { gender });
    }

    const amount = booking_type === "single" ? club.single_entry_fee : 0;
    let invite_token = null;
    let status = "confirmed";

    if (booking_type === "couple") {
      invite_token = crypto.randomBytes(16).toString("hex");
      status = "pending_invite";
    }

    const booking = await createClubBooking({
      club_id,
      event_id,
      booker_id: req.user.id,
      booking_type,
      status,
      payment_status: booking_type === "single" ? "unpaid" : "unpaid",
      amount,
      invite_token,
    });

    return res.status(201).json({
      success: true,
      message: booking_type === "couple"
        ? "Couple booking created. Share the invite link with your partner."
        : "Booking created. Complete payment to get your ticket.",
      booking: {
        id: booking.insertId,
        booking_type,
        amount,
        invite_token,
        status,
      },
    });
  } catch (error) {
    console.error("Create Booking Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// GET /clubs/booking/:id - Get booking status (for polling)
export const getBookingStatus = async (req, res) => {
  try {
    const booking = await getClubBookingById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Only the booker or partner can view
    const userId = req.user.id;
    const bookerId = booking.booker_id?._id?.toString() || booking.booker_id?.toString();
    const partnerId = booking.partner_id?._id?.toString() || booking.partner_id?.toString();
    if (userId !== bookerId && userId !== partnerId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    return res.status(200).json({ success: true, booking });
  } catch (error) {
    console.error("Get Booking Status Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// POST /clubs/booking/:id/create-order - Create Razorpay order for singles
export const createClubOrder = async (req, res) => {
  try {
    const booking = await getClubBookingById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const bookerId = booking.booker_id?._id?.toString() || booking.booker_id?.toString();
    if (req.user.id !== bookerId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (booking.booking_type === "couple") {
      return res.status(400).json({
        success: false,
        message: "Couple bookings are free — no payment needed",
      });
    }

    if (booking.payment_status === "paid") {
      return res.status(400).json({ success: false, message: "Already paid" });
    }

    const amount_in_paise = Math.round(booking.amount * 100);

    const order = await razorpayInstance.orders.create({
      amount: amount_in_paise,
      currency: "INR",
      receipt: `club_booking_${booking._id || booking.id}`,
    });

    // Store the order_id on the booking
    await updateClubBooking(booking._id || booking.id, {
      razorpay_order_id: order.id,
    });

    return res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Create Club Order Error:", error);
    return res.status(500).json({ success: false, message: "Failed to initialize payment" });
  }
};

// POST /clubs/booking/:id/verify - Verify Razorpay payment and generate ticket
export const verifyClubPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing payment details" });
    }

    // 1. Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment verification failed. Invalid signature." });
    }

    // 2. Find booking by razorpay_order_id
    const { ClubBooking } = await import("../schemas/clubSchema.js");
    const booking = await ClubBooking.findOne({ razorpay_order_id });
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found for this order" });
    }

    const bookerId = booking.booker_id?._id?.toString() || booking.booker_id?.toString();
    if (req.user.id !== bookerId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // 3. Update booking with payment details
    await updateClubBooking(booking._id || booking.id, {
      payment_status: "paid",
      razorpay_payment_id,
      razorpay_signature,
    });

    // 4. Generate ticket for single booking
    const clubId = booking.club_id?._id || booking.club_id;
    const eventId = booking.event_id?._id || booking.event_id;

    const ticket = await createClubTicket({
      booking_id: booking._id || booking.id,
      user_id: bookerId,
      club_id: clubId,
      event_id: eventId,
      holder_name: booking.booker_id?.full_name || "Guest",
      type: "single",
      amount: booking.amount,
      status: "active",
    });

    return res.status(200).json({
      success: true,
      message: "Payment verified. Ticket generated.",
      ticket: {
        id: ticket.insertId,
        ticket_code: ticket.ticket_code,
      },
    });
  } catch (error) {
    console.error("Verify Club Payment Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// POST /clubs/booking/:id/cancel - Cancel booking and tickets
export const cancelBooking = async (req, res) => {
  try {
    const booking = await getClubBookingById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const userId = req.user.id;
    const bookerId = booking.booker_id?._id?.toString() || booking.booker_id?.toString();
    if (userId !== bookerId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ success: false, message: "Already cancelled" });
    }

    await updateClubBooking(booking._id || booking.id, { status: "cancelled" });
    await cancelTicketsByBooking(booking._id || booking.id);

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel Booking Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// GET /clubs/my-tickets - Get user's tickets (compute live expiry)
export const getMyTickets = async (req, res) => {
  try {
    const tickets = await getUserTickets(req.user.id);
    return res.status(200).json({ success: true, total: tickets.length, tickets });
  } catch (error) {
    console.error("Get My Tickets Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// POST /clubs/invite/accept - Accept invite
export const acceptInvite = async (req, res) => {
  try {
    const { token, name, email, password, gender } = req.body;

    if (!token || !name || !email || !password || !gender) {
      return res.status(400).json({
        success: false,
        message: "All fields are required (token, name, email, password, gender)",
      });
    }

    if (!["male", "female"].includes(gender)) {
      return res.status(400).json({
        success: false,
        message: "Gender must be 'male' or 'female'",
      });
    }

    // Find booking by token
    const booking = await getBookingByToken(token);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Invalid invite link" });
    }
    if (booking.status === "confirmed") {
      return res.status(400).json({ success: false, message: "Invite already accepted" });
    }
    if (booking.status === "cancelled") {
      return res.status(400).json({ success: false, message: "Booking cancelled" });
    }

    // Enforce boy+girl rule
    const bookerGender = booking.booker_id?.gender;
    if (bookerGender && gender === bookerGender) {
      return res.status(400).json({
        success: false,
        message: "Partner gender must be different from the booker's gender (boy+girl rule)",
      });
    }

    // Find or create partner account
    let partner = await User.findOne({ email: email.toLowerCase() });
    let isNewUser = false;
    let token_jwt;

    if (partner) {
      // Existing user - verify password
      const isMatch = await bcrypt.compare(password, partner.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }
      // Update gender
      partner.gender = gender;
      await partner.save();
    } else {
      // Create new partner account
      const hashedPassword = await bcrypt.hash(password, 10);
      partner = await User.create({
        full_name: name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: "student",
        gender,
      });
      isNewUser = true;
    }

    // Generate JWT for auto-login
    token_jwt = jwt.sign(
      { id: partner._id, email: partner.email, role: partner.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Update booking: confirm and set partner
    await updateClubBooking(booking._id || booking.id, {
      status: "confirmed",
      partner_id: partner._id,
      payment_status: "paid", // couples are always free
    });

    // Generate 2 tickets (one per person)
    const clubId = booking.club_id?._id || booking.club_id;
    const eventId = booking.event_id?._id || booking.event_id;
    const bookerId = booking.booker_id?._id || booking.booker_id;

    const tickets = await createMultipleTickets([
      {
        booking_id: booking._id || booking.id,
        user_id: bookerId,
        club_id: clubId,
        event_id: eventId,
        holder_name: booking.booker_id?.full_name || "Booker",
        type: "couple",
        amount: 0,
        status: "active",
      },
      {
        booking_id: booking._id || booking.id,
        user_id: partner._id,
        club_id: clubId,
        event_id: eventId,
        holder_name: name,
        type: "couple",
        amount: 0,
        status: "active",
      },
    ]);

    return res.status(200).json({
      success: true,
      message: isNewUser
        ? "Account created and booking confirmed. Welcome!"
        : "Booking confirmed. Welcome!",
      token: token_jwt,
      user: {
        id: partner._id,
        full_name: partner.full_name,
        email: partner.email,
        role: partner.role,
      },
      tickets: tickets.map((t) => ({
        ticket_code: t.ticket_code,
        holder_name: t.ticket_code ? undefined : undefined,
      })),
    });
  } catch (error) {
    console.error("Accept Invite Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ==========================================
// ADMIN CONTROLLERS
// ==========================================

// GET /clubs/admin/all - List all clubs with stats
export const adminListClubs = async (req, res) => {
  try {
    const clubs = await getAllClubsAdmin();
    return res.status(200).json({ success: true, total: clubs.length, clubs });
  } catch (error) {
    console.error("Admin List Clubs Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// GET /clubs/admin/bookings?clubId= - List bookings for a club
export const adminClubBookings = async (req, res) => {
  try {
    const { clubId } = req.query;
    if (!clubId) {
      return res.status(400).json({ success: false, message: "clubId is required" });
    }
    const bookings = await getBookingsByClub(clubId);
    return res.status(200).json({ success: true, total: bookings.length, bookings });
  } catch (error) {
    console.error("Admin Club Bookings Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// POST /clubs - Create club (with images)
export const adminCreateClub = async (req, res) => {
  try {
    const {
      name,
      tagline,
      description,
      city,
      area,
      address,
      single_entry_fee,
      contact_phone,
      opening_hours,
    } = req.body;

    if (!name || !city || single_entry_fee === undefined) {
      return res.status(400).json({
        success: false,
        message: "name, city, and single_entry_fee are required",
      });
    }

    // Process uploaded images — req.files is { cover_image: [file], images: [files] }
    let processedImages = [];
    let cover_image = "default-club.webp";

    if (req.files) {
      try {
        // Cover image
        if (req.files.cover_image && req.files.cover_image.length > 0) {
          const processedCover = await processImage(req.files.cover_image[0]);
          processedImages.push(processedCover);
          cover_image = processedCover;
        }

        // Gallery images
        if (req.files.images && req.files.images.length > 0) {
          for (const file of req.files.images) {
            const processedFileName = await processImage(file);
            processedImages.push(processedFileName);
          }
          // If no cover was explicitly uploaded, use first gallery image
          if (cover_image === "default-club.webp" && processedImages.length > 0) {
            cover_image = processedImages[0];
          }
        }
      } catch (imageError) {
        return res.status(imageError.statusCode || 500).json({
          success: false,
          message: imageError.message,
        });
      }
    }

    const result = await createClub({
      name,
      tagline: tagline || "",
      description: description || "",
      city,
      area: area || "",
      address: address || "",
      single_entry_fee,
      cover_image,
      contact_phone: contact_phone || "",
      opening_hours: opening_hours || "",
    });

    // Save gallery images
    if (processedImages.length > 0) {
      await saveClubImages(result.insertId, processedImages);
    }

    return res.status(201).json({
      success: true,
      message: "Club created successfully",
      clubId: result.insertId,
    });
  } catch (error) {
    console.error("Admin Create Club Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// PUT /clubs/:id - Update club
export const adminUpdateClub = async (req, res) => {
  try {
    const { id } = req.params;
    const club = await getClubById(id);
    if (!club) {
      return res.status(404).json({ success: false, message: "Club not found" });
    }

    const updateData = {
      name: req.body.name ?? club.name,
      tagline: req.body.tagline ?? club.tagline,
      description: req.body.description ?? club.description,
      city: req.body.city ?? club.city,
      area: req.body.area ?? club.area,
      address: req.body.address ?? club.address,
      single_entry_fee: req.body.single_entry_fee ?? club.single_entry_fee,
      contact_phone: req.body.contact_phone ?? club.contact_phone,
      opening_hours: req.body.opening_hours ?? club.opening_hours,
      status: req.body.status ?? club.status,
    };

    // Process new images if uploaded
    if (req.files) {
      try {
        const newImages = [];
        if (req.files.cover_image && req.files.cover_image.length > 0) {
          const processedCover = await processImage(req.files.cover_image[0]);
          newImages.push(processedCover);
          updateData.cover_image = processedCover;
        }
        if (req.files.images && req.files.images.length > 0) {
          for (const file of req.files.images) {
            const processedFileName = await processImage(file);
            newImages.push(processedFileName);
          }
          // Save new gallery images
          if (newImages.length > 0) {
            await saveClubImages(id, newImages);
          }
        }
      } catch (imageError) {
        return res.status(imageError.statusCode || 500).json({
          success: false,
          message: imageError.message,
        });
      }
    }

    await updateClub(id, updateData);
    return res.status(200).json({ success: true, message: "Club updated successfully" });
  } catch (error) {
    console.error("Admin Update Club Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// DELETE /clubs/:id - Delete club (cascades)
export const adminDeleteClub = async (req, res) => {
  try {
    const club = await getClubById(req.params.id);
    if (!club) {
      return res.status(404).json({ success: false, message: "Club not found" });
    }
    await deleteClub(req.params.id);
    return res.status(200).json({ success: true, message: "Club deleted successfully" });
  } catch (error) {
    console.error("Admin Delete Club Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// POST /clubs/:id/events - Create club night
export const adminCreateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, start_time, end_time, capacity } = req.body;

    if (!title || !date || !start_time || !end_time || !capacity) {
      return res.status(400).json({
        success: false,
        message: "title, date, start_time, end_time, and capacity are required",
      });
    }

    const club = await getClubById(id);
    if (!club) {
      return res.status(404).json({ success: false, message: "Club not found" });
    }

    const event = await createClubEvent({
      club_id: id,
      title,
      date: new Date(date),
      start_time,
      end_time,
      capacity: Number(capacity),
    });

    return res.status(201).json({
      success: true,
      message: "Club night created successfully",
      eventId: event.insertId,
    });
  } catch (error) {
    console.error("Admin Create Event Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// DELETE /clubs/events/:eventId - Delete club night
export const adminDeleteEvent = async (req, res) => {
  try {
    await deleteClubEvent(req.params.eventId);
    return res.status(200).json({ success: true, message: "Club night deleted successfully" });
  } catch (error) {
    console.error("Admin Delete Event Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
