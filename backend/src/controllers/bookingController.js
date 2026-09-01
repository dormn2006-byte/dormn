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
import Payment from "../schemas/paymentSchema.js";

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

    // Create Booking
    const result = await createBooking({
      student_id,
      pg_id,
      owner_id: pg.owner_id,
      message,
      selected_room_type, // NEW: Pass to database model
      booked_price,       // NEW: Pass to database model
    });

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
    const student_id = req.user.id;

    const booking = await Booking.findOne({
      student_id,
      $or: [{ payment_status: "paid" }, { status: "approved" }],
    })
      .sort({ booking_date: -1 })
      .limit(1)
      .populate("pg_id", "title city area address profile_image")
      .lean();

    let paymentInfo = null;
    if (booking) {
      const payment = await Payment.findOne({
        booking_id: booking._id,
        status: "successful",
      }).lean();

      paymentInfo = payment
        ? {
            amount_paid: payment.amount,
            razorpay_payment_id: payment.razorpay_payment_id,
            payment_date: payment.created_at,
          }
        : null;
    }

    const result = booking
      ? {
          booking_id: booking._id,
          booking_status: booking.status,
          payment_status: booking.payment_status,
          booking_date: booking.booking_date,
          selected_room_type: booking.selected_room_type,
          pg_id: booking.pg_id?._id || booking.pg_id,
          title: booking.pg_id?.title,
          city: booking.pg_id?.city,
          area: booking.pg_id?.area,
          address: booking.pg_id?.address,
          profile_image: booking.pg_id?.profile_image,
          ...(paymentInfo || {}),
        }
      : null;

    res.status(200).json({ success: true, booking: result });
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

    const booking = await Booking.findOne({ _id: id, student_id }).lean();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found or does not belong to you",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a booking that is already ${booking.status}`,
      });
    }

    await updateBookingStatus({ booking_id: id, status: "cancelled" });

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