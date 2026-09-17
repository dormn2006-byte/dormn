import db from "../config/db.js";

// Create Booking
export const createBooking = async ({
  student_id,
  pg_id,
  owner_id,
  message,
  selected_room_type, // NEW: Extract selected room type
  booked_price,       // NEW: Extract booked price
}) => {
  const query = `
    INSERT INTO bookings (
      student_id,
      pg_id,
      owner_id,
      message,
      selected_room_type,
      booked_price
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const [result] = await db.execute(query, [
    student_id,
    pg_id,
    owner_id,
    message,
    selected_room_type, // NEW: Insert into database
    booked_price,       // NEW: Insert into database
  ]);

  return result;
};

// Get Student Bookings
export const getStudentBookings = async (student_id) => {
  const query = `
    SELECT
      bookings.*,
      pgs.title,
      pgs.city,
      pgs.area,
      pgs.price,
      pgs.profile_image,
      users.full_name AS owner_name,
      users.phone AS owner_phone
    FROM bookings
    JOIN pgs ON bookings.pg_id = pgs.id
    JOIN users ON bookings.owner_id = users.id
    WHERE bookings.student_id = ?
    ORDER BY bookings.booking_date DESC
  `;

  const [rows] = await db.execute(query, [student_id]);

  return rows;
};

// Get Owner Booking Requests
export const getOwnerBookings = async (owner_id) => {
  const query = `
    SELECT
      bookings.*,
      pgs.title,
      pgs.city,
      pgs.area,
      pgs.price,
      pgs.profile_image,
      users.full_name AS student_name,
      users.email AS student_email,
      users.phone AS student_phone
    FROM bookings
    JOIN pgs ON bookings.pg_id = pgs.id
    JOIN users ON bookings.student_id = users.id
    WHERE bookings.owner_id = ? AND bookings.status != 'paused'
    ORDER BY bookings.booking_date DESC
  `;

  const [rows] = await db.execute(query, [owner_id]);

  return rows;
};

// Update Booking Status
export const updateBookingStatus = async ({
  booking_id,
  status,
}) => {
  const isCancelled = status === "cancelled" || status === "rejected";
  const query = isCancelled
    ? `UPDATE bookings SET status = ?, cancelled_at = NOW() WHERE id = ?`
    : `UPDATE bookings SET status = ? WHERE id = ?`;

  const [result] = await db.execute(query, [
    status,
    booking_id,
  ]);

  return result;
};

// Get student_id from a booking
export const getStudentIdByBooking = async (booking_id) => {
  const [rows] = await db.execute(
    `SELECT student_id FROM bookings WHERE id = ?`,
    [booking_id]
  );
  return rows.length > 0 ? rows[0].student_id : null;
};

// Pause all other pending bookings for a student (when one gets approved)
export const pauseOtherBookings = async (student_id, exclude_booking_id) => {
  const [result] = await db.execute(
    `UPDATE bookings SET status = 'paused' WHERE student_id = ? AND id != ? AND status = 'pending'`,
    [student_id, exclude_booking_id]
  );
  return result;
};