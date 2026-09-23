import Booking from "../schemas/bookingSchema.js";
import PG from "../schemas/pgSchema.js";
import User from "../schemas/userSchema.js";
import { serialize } from "../utils/serialize.js";

// Create Booking
export const createBooking = async ({
  student_id,
  pg_id,
  owner_id,
  message,
  selected_room_type,
  booked_price,
  visit_date,
  visit_time,
}) => {
  const booking = await Booking.create({
    student_id,
    pg_id,
    owner_id,
    message,
    selected_room_type,
    booked_price,
    visit_date,
    visit_time,
  });

  return { insertId: booking._id, affectedRows: 1 };
};

const withBookingJoins = (bookings, pgMap, userMap, userField, alias) =>
  bookings.map((booking) => {
    const pg = pgMap.get(booking.pg_id) || {};
    const user = userMap.get(booking[userField]) || {};

    return {
      ...booking,
      title: pg.title,
      city: pg.city,
      area: pg.area,
      price: pg.price,
      profile_image: pg.profile_image,
      [`${alias}_name`]: user.full_name ?? null,
      [`${alias}_email`]: user.email ?? null,
      [`${alias}_phone`]: user.phone ?? null,
    };
  });

const loadJoinMaps = async (bookings) => {
  const pgIds = [...new Set(bookings.map((b) => b.pg_id).filter((v) => v != null))];
  const userIds = [
    ...new Set(
      bookings
        .flatMap((b) => [b.owner_id, b.student_id])
        .filter((v) => v != null)
    ),
  ];

  const [pgs, users] = await Promise.all([
    PG.find({ _id: { $in: pgIds } }).lean(),
    User.find({ _id: { $in: userIds } }).lean(),
  ]);

  return {
    pgMap: new Map(pgs.map((pg) => [pg._id, pg])),
    userMap: new Map(users.map((user) => [user._id, user])),
  };
};

// Get Student Bookings
export const getStudentBookings = async (student_id) => {
  const bookings = await Booking.find({ student_id })
    .sort({ booking_date: -1 })
    .lean();

  const { pgMap, userMap } = await loadJoinMaps(bookings);

  return serialize(
    withBookingJoins(bookings, pgMap, userMap, "owner_id", "owner")
  );
};

// Get Owner Booking Requests
export const getOwnerBookings = async (owner_id) => {
  const bookings = await Booking.find({
    owner_id,
    status: { $ne: "paused" },
  })
    .sort({ booking_date: -1 })
    .lean();

  const { pgMap, userMap } = await loadJoinMaps(bookings);

  return serialize(
    withBookingJoins(bookings, pgMap, userMap, "student_id", "student")
  );
};

// Update Booking Status
export const updateBookingStatus = async ({ booking_id, status }) => {
  const isCancelled = status === "cancelled" || status === "rejected";

  return Booking.updateOne(
    { _id: booking_id },
    isCancelled
      ? { status, cancelled_at: new Date() }
      : { status }
  );
};

// Get student_id from a booking
export const getStudentIdByBooking = async (booking_id) => {
  const booking = await Booking.findById(booking_id).select("student_id").lean();
  return booking ? booking.student_id : null;
};

// Pause all other pending bookings for a student (when one gets approved)
export const pauseOtherBookings = async (student_id, exclude_booking_id) => {
  return Booking.updateMany(
    {
      student_id,
      _id: { $ne: exclude_booking_id },
      status: "pending",
    },
    { status: "paused" }
  );
};
