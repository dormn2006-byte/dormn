import Booking from "../schemas/bookingSchema.js";
import PG from "../schemas/pgSchema.js";
import User from "../schemas/userSchema.js";
import Payment from "../schemas/paymentSchema.js";

// Create Booking
export const createBooking = async ({
  student_id,
  pg_id,
  owner_id,
  message,
  selected_room_type,
  booked_price,
}) => {
  const booking = await Booking.create({
    student_id,
    pg_id,
    owner_id,
    message,
    selected_room_type,
    booked_price,
  });

  return { insertId: booking._id };
};

// Get Student Bookings (with PG + Owner info)
export const getStudentBookings = async (student_id) => {
  const bookings = await Booking.find({ student_id })
    .sort({ booking_date: -1 })
    .populate("pg_id", "title city area price profile_image")
    .populate("owner_id", "full_name phone")
    .lean();

  return bookings.map((b) => ({
    ...b,
    id: b._id,
    title: b.pg_id?.title,
    city: b.pg_id?.city,
    area: b.pg_id?.area,
    price: b.pg_id?.price,
    profile_image: b.pg_id?.profile_image,
    owner_name: b.owner_id?.full_name,
    owner_phone: b.owner_id?.phone,
    pg_id: b.pg_id?._id || b.pg_id,
    owner_id: b.owner_id?._id || b.owner_id,
  }));
};

// Get Owner Booking Requests (excluding paused)
export const getOwnerBookings = async (owner_id) => {
  const bookings = await Booking.find({ owner_id, status: { $ne: "paused" } })
    .sort({ booking_date: -1 })
    .populate("pg_id", "title city area price profile_image")
    .populate("student_id", "full_name email phone")
    .lean();

  return bookings.map((b) => ({
    ...b,
    id: b._id,
    title: b.pg_id?.title,
    city: b.pg_id?.city,
    area: b.pg_id?.area,
    price: b.pg_id?.price,
    profile_image: b.pg_id?.profile_image,
    student_name: b.student_id?.full_name,
    student_email: b.student_id?.email,
    student_phone: b.student_id?.phone,
    pg_id: b.pg_id?._id || b.pg_id,
    student_id: b.student_id?._id || b.student_id,
  }));
};

// Update Booking Status
export const updateBookingStatus = async ({ booking_id, status }) => {
  return await Booking.findByIdAndUpdate(booking_id, { status });
};

// Get student_id from a booking
export const getStudentIdByBooking = async (booking_id) => {
  const booking = await Booking.findById(booking_id).select("student_id").lean();
  return booking?.student_id || null;
};

// Pause all other pending bookings for a student (when one gets approved)
export const pauseOtherBookings = async (student_id, exclude_booking_id) => {
  return await Booking.updateMany(
    {
      student_id,
      _id: { $ne: exclude_booking_id },
      status: "pending",
    },
    { status: "paused" }
  );
};