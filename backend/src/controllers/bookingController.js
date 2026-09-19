import {
  createBooking,
  getStudentBookings,
  getOwnerBookings,
  updateBookingStatus,
  getStudentIdByBooking,
  pauseOtherBookings,
} from "../models/bookingModel.js";

import { getPGById } from "../models/pgModel.js";
import Booking from "../schemas/bookingSchema.js";
import PG from "../schemas/pgSchema.js";
import User from "../schemas/userSchema.js";
import Payment from "../schemas/paymentSchema.js";
import { notifyOwnerNewBooking, notifyStudentBookingStatus } from "../utils/whatsappService.js";
import { 
  sendBookingRequestToOwnerEmail, 
  sendBookingStatusToStudentEmail,
  sendStayCancellationAlertToOwnerEmail,
  sendStayCancellationStatusToStudentEmail
} from "../utils/emailService.js";

// Bookings that count as a live/active stay
const activeStayFilter = (studentId) => ({
  student_id: Number(studentId),
  status: { $ne: "cancelled" },
  $or: [{ status: "approved" }, { status: "paid" }],
});

// Malformed ids used to match no rows under MySQL; map them to a value that
// likewise matches nothing instead of letting NaN raise a CastError.
const toNumericId = (value) => {
  const id = Number(value);
  return Number.isFinite(id) ? id : -1;
};

// Create Booking Request
export const createBookingController = async (req, res) => {
  try {
    const student_id = req.user.id;

    const {
      pg_id,
      message,
      selected_room_type, // NEW: Capture the user's AC/Non-AC Sharing selection
      booked_price,       // NEW: Capture the specific price they agreed to
    } = req.body;

    // Validation
    if (!pg_id) {
      return res.status(400).json({
        success: false,
        message: "PG ID is required",
      });
    }

    // Get PG Details
    const pg = await getPGById(pg_id);

    if (!pg) {
      return res.status(404).json({
        success: false,
        message: "PG not found",
      });
    }

    if (pg.spots_left !== undefined && pg.spots_left <= 0) {
      return res.status(400).json({
        success: false,
        message: "Sorry, this PG has 0 spots left (Fully Booked).",
      });
    }

    // ── Guard: Block booking if student already has an active PG stay ──
    const activeStay = await Booking.findOne(activeStayFilter(student_id))
      .sort({ _id: -1 })
      .lean();

    if (activeStay) {
      const stayPg = await PG.findById(activeStay.pg_id).select("title").lean();

      return res.status(400).json({
        success: false,
        message: `You already have an active PG stay at "${stayPg?.title}". Please request a cancellation from your current PG owner before booking a new one.`,
        code: "ACTIVE_STAY_EXISTS",
        activePgTitle: stayPg?.title,
        activeBookingId: activeStay._id,
      });
    }

    // Create Booking
    const result = await createBooking({
      student_id,
      pg_id,
      owner_id: pg.owner_id,
      message,
      selected_room_type, // NEW: Pass to database model
      booked_price,       // NEW: Pass to database model
    });

    // ── Notifications: Notify PG Owner of new booking (WhatsApp & Email) ──
    try {
      const [ownerUser, studentUser] = await Promise.all([
        User.findById(pg.owner_id).select("full_name email phone").lean(),
        User.findById(student_id).select("full_name email phone").lean(),
      ]);

      if (ownerUser) {
        const notifyPayload = {
          bookingId: result.insertId,
          studentName: studentUser?.full_name || "Student",
          studentPhone: studentUser?.phone || "",
          pgTitle: pg.title,
          roomType: selected_room_type || "",
          price: booked_price || pg.price || "",
        };

        // 1. WhatsApp Alert
        if (ownerUser.phone) {
          notifyOwnerNewBooking(ownerUser.phone, notifyPayload)
            .catch(err => console.error("[WhatsApp] Booking notify error:", err.message));
        }

        // 2. Email Alert
        if (ownerUser.email) {
          sendBookingRequestToOwnerEmail(ownerUser.email, ownerUser.full_name, notifyPayload)
            .catch(err => console.error("[EmailService] Booking notify error:", err.message));
        }
      }
    } catch (notifErr) { console.error("[Notification] Hook error:", notifErr.message); }

    return res.status(201).json({
      success: true,
      message: "Booking request sent successfully",
      bookingId: result.insertId,
    });
  } catch (error) {
    console.log("Create Booking Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Get Student Bookings
export const getStudentBookingsController = async (
  req,
  res
) => {
  try {
    const student_id = req.user.id;

    const bookings = await getStudentBookings(student_id);

    return res.status(200).json({
      success: true,
      total: bookings.length,
      bookings,
    });
  } catch (error) {
    console.log("Get Student Bookings Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Get Owner Booking Requests
export const getOwnerBookingsController = async (
  req,
  res
) => {
  try {
    const owner_id = req.user.id;

    const bookings = await getOwnerBookings(owner_id);

    return res.status(200).json({
      success: true,
      total: bookings.length,
      bookings,
    });
  } catch (error) {
    console.log("Get Owner Bookings Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Update Booking Status
export const updateBookingStatusController = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const { status } = req.body;

    // Validation
    const allowedStatus = [
      "approved",
      "rejected",
      "cancelled",
    ];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking status",
      });
    }

    // Row-Level Security: Verify that this booking belongs to the logged-in owner
    const ownerCheck = await Booking.findOne({
      _id: toNumericId(id),
      owner_id: Number(req.user.id),
    })
      .select("_id")
      .lean();

    if (!ownerCheck && req.user.role !== "superadmin" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. This booking does not belong to your property.",
      });
    }

    // Capacity check if approving
    if (status === "approved") {
      const bookingDetails = await Booking.findById(toNumericId(id))
        .select("pg_id status")
        .lean();

      if (bookingDetails && bookingDetails.status !== "approved") {
        const pg = await getPGById(bookingDetails.pg_id);
        if (pg && pg.spots_left <= 0) {
          return res.status(400).json({
            success: false,
            message: `Cannot approve booking. All ${pg.available_rooms} spots for this PG are already filled.`,
          });
        }
      }
    }

    await updateBookingStatus({
      booking_id: id,
      status,
    });

    // Auto-pause: when a booking is approved, pause all other pending bookings by the same student
    if (status === "approved") {
      const studentId = await getStudentIdByBooking(toNumericId(id));
      if (studentId) {
        await pauseOtherBookings(studentId, toNumericId(id));
      }
    }

    // ── Notifications: Notify Student of booking status change (WhatsApp & Email) ──
    try {
      const bookingDoc = await Booking.findById(toNumericId(id))
        .select("student_id pg_id owner_id")
        .lean();

      if (bookingDoc) {
        const [pgDoc, ownerDoc, studentDoc] = await Promise.all([
          PG.findById(bookingDoc.pg_id).select("title").lean(),
          User.findById(bookingDoc.owner_id).select("full_name").lean(),
          User.findById(bookingDoc.student_id).select("full_name email phone").lean(),
        ]);

        const statusPayload = {
          bookingId: id,
          status,
          pgTitle: pgDoc?.title,
          ownerName: ownerDoc?.full_name,
        };

        // 1. WhatsApp Alert
        if (studentDoc?.phone) {
          notifyStudentBookingStatus(studentDoc.phone, statusPayload)
            .catch(err => console.error("[WhatsApp] Status notify error:", err.message));
        }

        // 2. Email Alert
        if (studentDoc?.email) {
          sendBookingStatusToStudentEmail(studentDoc.email, studentDoc.full_name, statusPayload)
            .catch(err => console.error("[EmailService] Status notify error:", err.message));
        }
      }
    } catch (notifErr) { console.error("[Notification] Hook error:", notifErr.message); }

    return res.status(200).json({
      success: true,
      message: `Booking ${status} successfully`,
    });
  } catch (error) {
    console.log("Update Booking Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Get all PGs booked by the logged-in student
export const getMyPgs = async (req, res) => {
  try {
    const student_id = req.user.id; // From the protect middleware

    const booking = await Booking.findOne({
      student_id: Number(student_id),
      status: { $ne: "cancelled" },
      $or: [{ payment_status: "paid" }, { status: "approved" }],
    })
      .sort({ booking_date: -1 })
      .lean();

    if (!booking) {
      return res.status(200).json({ success: true, booking: null });
    }

    const [pg, payment] = await Promise.all([
      PG.findById(booking.pg_id).lean(),
      Payment.findOne({ booking_id: booking._id, status: "successful" })
        .sort({ _id: -1 })
        .lean(),
    ]);

    const row = {
      booking_id: booking._id,
      booking_status: booking.status,
      payment_status: booking.payment_status,
      booking_date: booking.booking_date,
      selected_room_type: booking.selected_room_type,
      cancellation_status: booking.cancellation_status,
      cancellation_reason: booking.cancellation_reason,
      cancellation_requested_at: booking.cancellation_requested_at,
      pg_id: pg?._id,
      title: pg?.title,
      city: pg?.city,
      area: pg?.area,
      address: pg?.address,
      profile_image: pg?.profile_image,
      amount_paid: payment?.amount,
      razorpay_payment_id: payment?.razorpay_payment_id,
      payment_date: payment?.created_at,
    };

    res.status(200).json({ 
      success: true, 
      booking: row
    });
  } catch (error) {
    console.error("Fetch My Pgs Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch your enrolled PG" });
  }
};

// Cancel Booking Request (Student can cancel their own pending bookings)
export const cancelBookingController = async (req, res) => {
  try {
    const student_id = req.user.id;
    const { id } = req.params;

    // Verify this booking belongs to the student and is still pending
    const rows = await Booking.findOne({
      _id: toNumericId(id),
      student_id: Number(student_id),
    })
      .select("_id status")
      .lean();

    if (!rows) {
      return res.status(404).json({
        success: false,
        message: "Booking not found or does not belong to you",
      });
    }

    if (rows.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a booking that is already ${rows.status}`,
      });
    }

    await updateBookingStatus({
      booking_id: id,
      status: "cancelled",
    });

    return res.status(200).json({
      success: true,
      message: "Booking request cancelled successfully",
    });
  } catch (error) {
    console.log("Cancel Booking Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// STAY CANCELLATION REQUESTS (Student -> Owner Workflow)
// ─────────────────────────────────────────────────────────────────────────────

// 1. Student requests stay cancellation for enrolled/active PG
export const requestStayCancellationController = async (req, res) => {
  try {
    const student_id = req.user.id;
    const { bookingId, reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a reason for the cancellation request.",
      });
    }

    let targetBookingId = bookingId ? toNumericId(bookingId) : null;

    // If no bookingId provided, look up the active paid/approved booking for this student
    if (!targetBookingId) {
      const activeBooking = await Booking.findOne(activeStayFilter(student_id))
        .sort({ booking_date: -1 })
        .select("_id")
        .lean();

      if (!activeBooking) {
        return res.status(404).json({
          success: false,
          message: "No active stay found to cancel.",
        });
      }
      targetBookingId = activeBooking._id;
    }

    // Verify booking belongs to student
    const booking = await Booking.findOne({
      _id: targetBookingId,
      student_id: Number(student_id),
    })
      .select("_id owner_id pg_id status")
      .lean();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking record not found or does not belong to you.",
      });
    }

    const pg = await PG.findById(booking.pg_id).select("title").lean();

    // Update cancellation status to 'pending'
    await Booking.updateOne(
      { _id: targetBookingId },
      {
        cancellation_status: "pending",
        cancellation_reason: reason.trim(),
        cancellation_requested_at: new Date(),
      }
    );

    // ── Notifications: Notify Owner of Cancellation / Move-out Request ──
    try {
      const [ownerUser, studentUser] = await Promise.all([
        User.findById(booking.owner_id).select("full_name email phone").lean(),
        User.findById(student_id).select("full_name email phone").lean(),
      ]);

      if (ownerUser?.email) {
        sendStayCancellationAlertToOwnerEmail(ownerUser.email, ownerUser.full_name, {
          bookingId: targetBookingId,
          studentName: studentUser?.full_name || "Resident",
          studentPhone: studentUser?.phone || "N/A",
          pgTitle: pg?.title,
          reason: reason.trim(),
        }).catch(err => console.error("[EmailService] Stay cancellation email error:", err.message));
      }
    } catch (notifErr) {
      console.error("[Cancellation] Notification error:", notifErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "Cancellation request sent to PG owner successfully.",
    });
  } catch (error) {
    console.error("Request Stay Cancellation Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit cancellation request.",
    });
  }
};

// 2. Owner fetches all cancellation requests for their PGs
export const getOwnerCancellationsController = async (req, res) => {
  try {
    const owner_id = Number(req.user.id);
    const { status } = req.query; // 'pending' | 'approved' | 'rejected' | 'all'

    const baseFilter = {
      owner_id,
      cancellation_status: { $nin: [null, "none"] },
    };

    const listFilter = { ...baseFilter };
    if (status && status !== "all") {
      listFilter.cancellation_status = status;
    }

    const bookings = await Booking.find(listFilter)
      .sort({ cancellation_requested_at: -1, booking_date: -1 })
      .lean();

    // Calculate count stats across all cancellation statuses
    const [total, pending, approved, rejected] = await Promise.all([
      Booking.countDocuments(baseFilter),
      Booking.countDocuments({ ...baseFilter, cancellation_status: "pending" }),
      Booking.countDocuments({ ...baseFilter, cancellation_status: "approved" }),
      Booking.countDocuments({ ...baseFilter, cancellation_status: "rejected" }),
    ]);

    const pgIds = [...new Set(bookings.map((b) => b.pg_id).filter((v) => v != null))];
    const studentIds = [
      ...new Set(bookings.map((b) => b.student_id).filter((v) => v != null)),
    ];

    const [pgs, students] = await Promise.all([
      PG.find({ _id: { $in: pgIds } }).lean(),
      User.find({ _id: { $in: studentIds } }).lean(),
    ]);

    const pgMap = new Map(pgs.map((p) => [p._id, p]));
    const studentMap = new Map(students.map((u) => [u._id, u]));

    const rows = bookings.map((b) => {
      const pg = pgMap.get(b.pg_id) || {};
      const student = studentMap.get(b.student_id) || {};

      return {
        booking_id: b._id,
        id: b._id,
        student_id: b.student_id,
        pg_id: b.pg_id,
        booking_status: b.status,
        payment_status: b.payment_status,
        selected_room_type: b.selected_room_type,
        booked_price: b.booked_price,
        booking_date: b.booking_date,
        cancellation_status: b.cancellation_status,
        cancellation_reason: b.cancellation_reason,
        cancellation_requested_at: b.cancellation_requested_at,
        pg_title: pg.title,
        pg_address: pg.address,
        pg_city: pg.city,
        pg_area: pg.area,
        pg_image: pg.profile_image,
        pg_price: pg.price,
        student_name: student.full_name,
        student_email: student.email,
        student_phone: student.phone,
      };
    });

    const counts = { total, pending, approved, rejected };

    return res.status(200).json({
      success: true,
      total: rows.length,
      cancellations: rows,
      counts,
    });
  } catch (error) {
    console.error("Get Owner Cancellations Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch cancellation requests.",
    });
  }
};

// 3. Owner accepts or rejects cancellation request
export const handleStayCancellationController = async (req, res) => {
  try {
    const owner_id = Number(req.user.id);
    const { bookingId, action } = req.body; // action: 'approve' | 'reject'

    if (!bookingId || !action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Valid bookingId and action ('approve' or 'reject') are required.",
      });
    }

    // Verify booking belongs to owner
    const booking = await Booking.findOne({
      _id: toNumericId(bookingId),
      owner_id,
    })
      .select("_id student_id pg_id cancellation_status")
      .lean();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking record not found or does not belong to your property.",
      });
    }

    const [pg, student, owner] = await Promise.all([
      PG.findById(booking.pg_id).select("title").lean(),
      User.findById(booking.student_id).select("full_name email phone").lean(),
      User.findById(owner_id).select("full_name").lean(),
    ]);

    if (action === 'approve') {
      // Set cancellation_status to 'approved' and booking status to 'cancelled'
      // This frees up the room spot automatically, while preserving student profile & registration KYC!
      await Booking.updateOne(
        { _id: toNumericId(bookingId), owner_id },
        {
          cancellation_status: "approved",
          status: "cancelled",
          cancelled_at: new Date(),
        }
      );
    } else {
      // Action is 'reject'
      await Booking.updateOne(
        { _id: toNumericId(bookingId), owner_id },
        { cancellation_status: "rejected" }
      );
    }

    // Email: Notify Student of Cancellation Decision
    try {
      if (student?.email) {
        sendStayCancellationStatusToStudentEmail(student.email, student.full_name, {
          bookingId,
          action,
          pgTitle: pg?.title,
          ownerName: owner?.full_name,
        }).catch(err => console.error("[EmailService] Stay cancellation decision email error:", err.message));
      }
    } catch (emailErr) {
      console.error("[EmailService] Decision hook error:", emailErr.message);
    }

    if (action === 'approve') {
      return res.status(200).json({
        success: true,
        message: "Cancellation request accepted. The resident has been checked out and the spot is now available for new bookings.",
      });
    } else {
      return res.status(200).json({
        success: true,
        message: "Cancellation request was rejected.",
      });
    }
  } catch (error) {
    console.error("Handle Stay Cancellation Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process cancellation action.",
    });
  }
};
