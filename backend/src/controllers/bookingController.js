import {
  createBooking,
  getStudentBookings,
  getOwnerBookings,
  updateBookingStatus,
  getStudentIdByBooking,
  pauseOtherBookings,
} from "../models/bookingModel.js";

import { getPGById } from "../models/pgModel.js";
import pool from "../config/db.js";
import { notifyOwnerNewBooking, notifyStudentBookingStatus } from "../utils/whatsappService.js";
import { 
  sendBookingRequestToOwnerEmail, 
  sendBookingStatusToStudentEmail,
  sendStayCancellationAlertToOwnerEmail,
  sendStayCancellationStatusToStudentEmail
} from "../utils/emailService.js";

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
    const [activeStay] = await pool.execute(
      `SELECT b.id, b.pg_id, p.title AS pg_title
       FROM bookings b
       JOIN pgs p ON b.pg_id = p.id
       WHERE b.student_id = ?
         AND (b.status = 'approved' OR b.payment_status = 'paid')
         AND b.status != 'cancelled'
       LIMIT 1`,
      [student_id]
    );

    if (activeStay.length > 0) {
      return res.status(400).json({
        success: false,
        message: `You already have an active PG stay at "${activeStay[0].pg_title}". Please request a cancellation from your current PG owner before booking a new one.`,
        code: "ACTIVE_STAY_EXISTS",
        activePgTitle: activeStay[0].pg_title,
        activeBookingId: activeStay[0].id,
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
      const [ownerRows] = await pool.execute(`SELECT full_name, email, phone FROM users WHERE id = ?`, [pg.owner_id]);
      const [studentRows] = await pool.execute(`SELECT full_name, email, phone FROM users WHERE id = ?`, [student_id]);
      
      const ownerUser = ownerRows[0];
      const studentUser = studentRows[0];

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
    const [ownerCheck] = await pool.execute(
      `SELECT id FROM bookings WHERE id = ? AND owner_id = ?`,
      [id, req.user.id]
    );

    if (ownerCheck.length === 0 && req.user.role !== "superadmin" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. This booking does not belong to your property.",
      });
    }

    // Capacity check if approving
    if (status === "approved") {
      const [bookingDetails] = await pool.execute(`SELECT pg_id, status FROM bookings WHERE id = ?`, [id]);
      if (bookingDetails.length > 0 && bookingDetails[0].status !== "approved") {
        const pgId = bookingDetails[0].pg_id;
        const pg = await getPGById(pgId);
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
      const studentId = await getStudentIdByBooking(id);
      if (studentId) {
        await pauseOtherBookings(studentId, id);
      }
    }

    // ── Notifications: Notify Student of booking status change (WhatsApp & Email) ──
    try {
      const [bookingRows] = await pool.execute(
        `SELECT b.student_id, b.pg_id, p.title AS pg_title, u.full_name AS owner_name, 
                s.full_name AS student_name, s.email AS student_email, s.phone AS student_phone
         FROM bookings b
         JOIN pgs p ON b.pg_id = p.id
         JOIN users u ON b.owner_id = u.id
         JOIN users s ON b.student_id = s.id
         WHERE b.id = ?`,
        [id]
      );
      if (bookingRows.length > 0) {
        const row = bookingRows[0];
        const statusPayload = {
          bookingId: id,
          status,
          pgTitle: row.pg_title,
          ownerName: row.owner_name,
        };

        // 1. WhatsApp Alert
        if (row.student_phone) {
          notifyStudentBookingStatus(row.student_phone, statusPayload)
            .catch(err => console.error("[WhatsApp] Status notify error:", err.message));
        }

        // 2. Email Alert
        if (row.student_email) {
          sendBookingStatusToStudentEmail(row.student_email, row.student_name, statusPayload)
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

    // This SQL query is 100% aligned with your actual MySQL database columns
    const [bookings] = await pool.execute(
      `SELECT 
        b.id AS booking_id, 
        b.status AS booking_status, 
        b.payment_status, 
        b.booking_date, 
        b.selected_room_type,
        b.cancellation_status,
        b.cancellation_reason,
        b.cancellation_requested_at,
        p.id AS pg_id, 
        p.title, 
        p.city, 
        p.area, 
        p.address,
        p.profile_image, 
        pay.amount AS amount_paid, 
        pay.razorpay_payment_id,
        pay.created_at AS payment_date
       FROM bookings b
       JOIN pgs p ON b.pg_id = p.id
       LEFT JOIN payments pay ON b.id = pay.booking_id AND pay.status = 'successful'
       WHERE b.student_id = ? AND (b.payment_status = 'paid' OR b.status = 'approved') AND b.status != 'cancelled'
       ORDER BY b.booking_date DESC
       LIMIT 1`,
      [student_id]
    );

    res.status(200).json({ 
      success: true, 
      booking: bookings.length > 0 ? bookings[0] : null 
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
    const [rows] = await pool.execute(
      `SELECT id, status FROM bookings WHERE id = ? AND student_id = ?`,
      [id, student_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found or does not belong to you",
      });
    }

    if (rows[0].status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a booking that is already ${rows[0].status}`,
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

    let targetBookingId = bookingId;

    // If no bookingId provided, look up the active paid/approved booking for this student
    if (!targetBookingId) {
      const [activeBookings] = await pool.execute(
        `SELECT id FROM bookings WHERE student_id = ? AND (payment_status = 'paid' OR status = 'approved') AND status != 'cancelled' ORDER BY booking_date DESC LIMIT 1`,
        [student_id]
      );
      if (activeBookings.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No active stay found to cancel.",
        });
      }
      targetBookingId = activeBookings[0].id;
    }

    // Verify booking belongs to student
    const [rows] = await pool.execute(
      `SELECT b.id, b.owner_id, b.pg_id, b.status, p.title AS pg_title 
       FROM bookings b 
       JOIN pgs p ON b.pg_id = p.id 
       WHERE b.id = ? AND b.student_id = ?`,
      [targetBookingId, student_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking record not found or does not belong to you.",
      });
    }

    const booking = rows[0];

    // Update cancellation status to 'pending'
    await pool.execute(
      `UPDATE bookings 
       SET cancellation_status = 'pending', 
           cancellation_reason = ?, 
           cancellation_requested_at = NOW() 
       WHERE id = ?`,
      [reason.trim(), targetBookingId]
    );

    // ── Notifications: Notify Owner of Cancellation / Move-out Request ──
    try {
      const [ownerRows] = await pool.execute(`SELECT full_name, email, phone FROM users WHERE id = ?`, [booking.owner_id]);
      const [studentRows] = await pool.execute(`SELECT full_name, email, phone FROM users WHERE id = ?`, [student_id]);
      const ownerUser = ownerRows[0];
      const studentUser = studentRows[0];

      if (ownerUser?.email) {
        sendStayCancellationAlertToOwnerEmail(ownerUser.email, ownerUser.full_name, {
          bookingId: targetBookingId,
          studentName: studentUser?.full_name || "Resident",
          studentPhone: studentUser?.phone || "N/A",
          pgTitle: booking.pg_title,
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
    const owner_id = req.user.id;
    const { status } = req.query; // 'pending' | 'approved' | 'rejected' | 'all'

    let query = `
      SELECT 
        b.id AS booking_id,
        b.id,
        b.student_id,
        b.pg_id,
        b.status AS booking_status,
        b.payment_status,
        b.selected_room_type,
        b.booked_price,
        b.booking_date,
        b.cancellation_status,
        b.cancellation_reason,
        b.cancellation_requested_at,
        p.title AS pg_title,
        p.address AS pg_address,
        p.city AS pg_city,
        p.area AS pg_area,
        p.profile_image AS pg_image,
        p.price AS pg_price,
        u.full_name AS student_name,
        u.email AS student_email,
        u.phone AS student_phone
      FROM bookings b
      JOIN pgs p ON b.pg_id = p.id
      JOIN users u ON b.student_id = u.id
      WHERE b.owner_id = ? AND (b.cancellation_status != 'none' AND b.cancellation_status IS NOT NULL)
    `;

    const params = [owner_id];

    if (status && status !== 'all') {
      query += ` AND b.cancellation_status = ?`;
      params.push(status);
    }

    query += ` ORDER BY b.cancellation_requested_at DESC, b.booking_date DESC`;

    const [rows] = await pool.execute(query, params);

    // Calculate count stats across all cancellation statuses
    const [statsRows] = await pool.execute(
      `SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN cancellation_status = 'pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN cancellation_status = 'approved' THEN 1 ELSE 0 END) AS approved,
        SUM(CASE WHEN cancellation_status = 'rejected' THEN 1 ELSE 0 END) AS rejected
       FROM bookings 
       WHERE owner_id = ? AND (cancellation_status != 'none' AND cancellation_status IS NOT NULL)`,
      [owner_id]
    );

    const counts = {
      total: statsRows[0]?.total || 0,
      pending: Number(statsRows[0]?.pending || 0),
      approved: Number(statsRows[0]?.approved || 0),
      rejected: Number(statsRows[0]?.rejected || 0),
    };

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
    const owner_id = req.user.id;
    const { bookingId, action } = req.body; // action: 'approve' | 'reject'

    if (!bookingId || !action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Valid bookingId and action ('approve' or 'reject') are required.",
      });
    }

    // Verify booking belongs to owner
    const [rows] = await pool.execute(
      `SELECT b.id, b.student_id, b.pg_id, b.cancellation_status, p.title AS pg_title, 
              u.full_name AS student_name, u.email AS student_email, u.phone AS student_phone,
              o.full_name AS owner_name
       FROM bookings b
       JOIN pgs p ON b.pg_id = p.id
       JOIN users u ON b.student_id = u.id
       JOIN users o ON b.owner_id = o.id
       WHERE b.id = ? AND b.owner_id = ?`,
      [bookingId, owner_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking record not found or does not belong to your property.",
      });
    }

    const booking = rows[0];

    if (action === 'approve') {
      // Set cancellation_status to 'approved' and booking status to 'cancelled'
      // This frees up the room spot automatically, while preserving student profile & registration KYC!
      await pool.execute(
        `UPDATE bookings 
         SET cancellation_status = 'approved', 
             status = 'cancelled',
             cancelled_at = NOW()
         WHERE id = ? AND owner_id = ?`,
        [bookingId, owner_id]
      );
    } else {
      // Action is 'reject'
      await pool.execute(
        `UPDATE bookings 
         SET cancellation_status = 'rejected' 
         WHERE id = ? AND owner_id = ?`,
        [bookingId, owner_id]
      );
    }

    // Email: Notify Student of Cancellation Decision
    try {
      if (booking.student_email) {
        sendStayCancellationStatusToStudentEmail(booking.student_email, booking.student_name, {
          bookingId,
          action,
          pgTitle: booking.pg_title,
          ownerName: booking.owner_name,
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