import db from "../config/db.js";

// Get Dashboard Stats
export const getDashboardStats = async (req, res) => {
  try {
    const [[totalUsers]] = await db.execute(
      `SELECT COUNT(*) AS totalUsers FROM users`
    );

    const [[totalOwners]] = await db.execute(
      `SELECT COUNT(*) AS totalOwners FROM users WHERE role = 'owner'`
    );

    const [[totalStudents]] = await db.execute(
      `SELECT COUNT(*) AS totalStudents FROM users WHERE role = 'student'`
    );

    const [[totalPGs]] = await db.execute(
      `SELECT COUNT(*) AS totalPGs FROM pgs`
    );

    const [[pendingPGs]] = await db.execute(
      `SELECT COUNT(*) AS pendingPGs FROM pgs WHERE status = 'pending'`
    );

    const [[approvedPGs]] = await db.execute(
      `SELECT COUNT(*) AS approvedPGs FROM pgs WHERE status = 'approved'`
    );

    const [[rejectedPGs]] = await db.execute(
      `SELECT COUNT(*) AS rejectedPGs FROM pgs WHERE status = 'rejected'`
    );

    const [[totalBookings]] = await db.execute(
      `SELECT COUNT(*) AS totalBookings FROM bookings`
    );

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers: totalUsers.totalUsers,
        totalOwners: totalOwners.totalOwners,
        totalStudents: totalStudents.totalStudents,
        totalPGs: totalPGs.totalPGs,
        pendingPGs: pendingPGs.pendingPGs,
        approvedPGs: approvedPGs.approvedPGs,
        rejectedPGs: rejectedPGs.rejectedPGs,
        totalBookings: totalBookings.totalBookings,
      },
    });
  } catch (error) {
    console.log("Dashboard Stats Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get All PGs
export const getAllPGs = async (req, res) => {
  try {
    const [pgs] = await db.execute(`
      SELECT
        pgs.*,
        users.full_name AS owner_name,
        users.email AS owner_email
      FROM pgs
      JOIN users ON pgs.owner_id = users.id
      ORDER BY pgs.created_at DESC
    `);

    return res.status(200).json({
      success: true,
      total: pgs.length,
      pgs,
    });
  } catch (error) {
    console.log("Get All PGs Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get Pending PGs
export const getPendingPGs = async (req, res) => {
  try {
    const [pgs] = await db.execute(`
      SELECT
        pgs.*,
        users.full_name AS owner_name,
        users.email AS owner_email
      FROM pgs
      JOIN users ON pgs.owner_id = users.id
      WHERE pgs.status = 'pending'
      ORDER BY pgs.created_at DESC
    `);

    return res.status(200).json({
      success: true,
      total: pgs.length,
      pgs,
    });
  } catch (error) {
    console.log("Pending PGs Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Approve PG
export const approvePG = async (req, res) => {
  try {
    const { id } = req.params;

    await db.execute(
      `
      UPDATE pgs
      SET status = 'approved'
      WHERE id = ?
      `,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: "PG approved successfully",
    });
  } catch (error) {
    console.log("Approve PG Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Reject PG
export const rejectPG = async (req, res) => {
  try {
    const { id } = req.params;

    await db.execute(
      `
      UPDATE pgs
      SET status = 'rejected'
      WHERE id = ?
      `,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: "PG rejected successfully",
    });
  } catch (error) {
    console.log("Reject PG Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const blockPG = async (req, res) => {
  try {
    const { id } = req.params;

    await db.execute(
      `
      UPDATE pgs
      SET status = 'blocked'
      WHERE id = ?
      `,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'PG blocked successfully',
    });
  } catch (error) {
    console.log('Block PG Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// Delete PG
export const deletePG = async (req, res) => {
  try {
    const { id } = req.params;

    await db.execute(
      `DELETE FROM pgs WHERE id = ?`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: "PG deleted successfully",
    });
  } catch (error) {
    console.log("Delete PG Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get All Users
export const getAllUsers = async (req, res) => {
  try {
    const [users] = await db.execute(`
      SELECT id, full_name, email, role, created_at
      FROM users
      ORDER BY created_at DESC
    `);

    return res.status(200).json({
      success: true,
      total: users.length,
      users,
    });
  } catch (error) {
    console.log("Get Users Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Delete User
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    await db.execute(
      `DELETE FROM users WHERE id = ?`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.log("Delete User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const [bookings] = await db.execute(`
      SELECT
        b.*,
        u.full_name AS student_name,
        u.email AS student_email,
        p.title AS pg_title
      FROM bookings b
      LEFT JOIN users u ON b.student_id = u.id
      LEFT JOIN pgs p ON b.pg_id = p.id
      ORDER BY b.booking_date DESC
    `);

    return res.status(200).json({
      success: true,
      total: bookings.length,
      bookings,
    });
  } catch (error) {
    console.log('Get Bookings Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// Get All Owners
export const getAllOwners = async (req, res) => {
  try {
    const [owners] = await db.execute(`
      SELECT
        id,
        full_name,
        email,
        phone,
        role,
        created_at
      FROM users
      WHERE role = 'owner'
      ORDER BY created_at DESC
    `);

    return res.status(200).json({
      success: true,
      total: owners.length,
      owners,
    });
  } catch (error) {
    console.log('Get Owners Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// Get All PGs of Specific Owner
export const getOwnerPGs = async (req, res) => {
  try {
    const { ownerId } = req.params;

    const [pgs] = await db.execute(
      `
      SELECT
        id,
        title,
        city,
        area,
        price,
        available_rooms,
        status,
        created_at
      FROM pgs
      WHERE owner_id = ?
      ORDER BY created_at DESC
      `,
      [ownerId]
    );

    return res.status(200).json({
      success: true,
      ownerId,
      total: pgs.length,
      pgs,
    });
  } catch (error) {
    console.log("Get Owner PGs Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get Booking History of Specific Student
export const getStudentBookings = async (req, res) => {
  try {
    const { studentId } = req.params;

    const [bookings] = await db.execute(
      `
      SELECT
        b.id,
        b.booking_date,
        b.status,
        b.payment_status,
        b.message,
        p.id AS pg_id,
        p.title AS pg_title,
        p.city,
        p.area,
        p.price,
        u.full_name AS student_name,
        u.email AS student_email
      FROM bookings b
      LEFT JOIN pgs p ON b.pg_id = p.id
      LEFT JOIN users u ON b.student_id = u.id
      WHERE b.student_id = ?
      ORDER BY b.booking_date DESC
      `,
      [studentId]
    );

    return res.status(200).json({
      success: true,
      studentId,
      total: bookings.length,
      bookings,
    });
  } catch (error) {
    console.log("Get Student Bookings Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
// Get All Students
export const getAllStudents = async (req, res) => {
  try {
    const [students] = await db.execute(`
      SELECT
        id,
        full_name,
        email,
        phone,
        role,
        created_at
      FROM users
      WHERE role = 'student'
      ORDER BY created_at DESC
    `);

    return res.status(200).json({
      success: true,
      total: students.length,
      students,
    });
  } catch (error) {
    console.log('Get Students Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

export const getOwnerDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const [owners] = await db.execute(
      `
      SELECT
        id,
        full_name,
        email,
        phone,
        role,
        created_at
      FROM users
      WHERE id = ? AND role = 'owner'
      `,
      [id]
    );

    if (owners.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Owner not found',
      });
    }

    return res.status(200).json({
      success: true,
      owner: owners[0],
    });
  } catch (error) {
    console.log('Get Owner Details Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

export const getPGDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const [pgs] = await db.execute(
      `
      SELECT
        pgs.*,
        users.full_name AS owner_name,
        users.email AS owner_email
      FROM pgs
      LEFT JOIN users ON pgs.owner_id = users.id
      WHERE pgs.id = ?
      `,
      [id]
    );

    if (pgs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'PG not found',
      });
    }

    return res.status(200).json({
      success: true,
      pg: pgs[0],
    });
  } catch (error) {
    console.log('Get PG Details Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

export const getStudentDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const [students] = await db.execute(
      `
      SELECT
        id,
        full_name,
        email,
        phone,
        role,
        created_at
      FROM users
      WHERE id = ? AND role = 'student'
      `,
      [id]
    );

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    return res.status(200).json({
      success: true,
      student: students[0],
    });
  } catch (error) {
    console.log('Get Student Details Error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};