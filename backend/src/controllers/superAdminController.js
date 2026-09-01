import User from "../schemas/userSchema.js";
import PG from "../schemas/pgSchema.js";
import Booking from "../schemas/bookingSchema.js";

// Get Dashboard Stats
export const getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalOwners, totalStudents, totalPGs, pendingPGs, approvedPGs, rejectedPGs, totalBookings] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "owner" }),
      User.countDocuments({ role: "student" }),
      PG.countDocuments(),
      PG.countDocuments({ status: "pending" }),
      PG.countDocuments({ status: "approved" }),
      PG.countDocuments({ status: "rejected" }),
      Booking.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalOwners,
        totalStudents,
        totalPGs,
        pendingPGs,
        approvedPGs,
        rejectedPGs,
        totalBookings,
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

// Helper: flatten PG with owner info
const flattenPG = (pg) => ({
  ...pg,
  id: pg._id,
  owner_name: pg.owner_id?.full_name || "",
  owner_email: pg.owner_id?.email || "",
  owner_id: pg.owner_id?._id || pg.owner_id,
});

// Get All PGs
export const getAllPGs = async (req, res) => {
  try {
    const pgs = await PG.find()
      .sort({ created_at: -1 })
      .populate("owner_id", "full_name email")
      .lean();

    return res.status(200).json({
      success: true,
      total: pgs.length,
      pgs: pgs.map(flattenPG),
    });
  } catch (error) {
    console.log("Get All PGs Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get Pending PGs
export const getPendingPGs = async (req, res) => {
  try {
    const pgs = await PG.find({ status: "pending" })
      .sort({ created_at: -1 })
      .populate("owner_id", "full_name email")
      .lean();

    return res.status(200).json({
      success: true,
      total: pgs.length,
      pgs: pgs.map(flattenPG),
    });
  } catch (error) {
    console.log("Pending PGs Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Approve PG
export const approvePG = async (req, res) => {
  try {
    await PG.findByIdAndUpdate(req.params.id, { status: "approved" });
    return res.status(200).json({ success: true, message: "PG approved successfully" });
  } catch (error) {
    console.log("Approve PG Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Reject PG
export const rejectPG = async (req, res) => {
  try {
    await PG.findByIdAndUpdate(req.params.id, { status: "rejected" });
    return res.status(200).json({ success: true, message: "PG rejected successfully" });
  } catch (error) {
    console.log("Reject PG Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const blockPG = async (req, res) => {
  try {
    await PG.findByIdAndUpdate(req.params.id, { status: "blocked" });
    return res.status(200).json({ success: true, message: "PG blocked successfully" });
  } catch (error) {
    console.log("Block PG Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Delete PG
export const deletePG = async (req, res) => {
  try {
    await PG.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: "PG deleted successfully" });
  } catch (error) {
    console.log("Delete PG Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get All Users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("full_name email role created_at")
      .sort({ created_at: -1 })
      .lean();

    return res.status(200).json({ success: true, total: users.length, users });
  } catch (error) {
    console.log("Get Users Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Delete User
export const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.log("Delete User Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .sort({ booking_date: -1 })
      .populate("student_id", "full_name email")
      .populate("pg_id", "title")
      .lean();

    const formatted = bookings.map((b) => ({
      ...b,
      id: b._id,
      student_name: b.student_id?.full_name,
      student_email: b.student_id?.email,
      pg_title: b.pg_id?.title,
      student_id: b.student_id?._id || b.student_id,
      pg_id: b.pg_id?._id || b.pg_id,
    }));

    return res.status(200).json({ success: true, total: formatted.length, bookings: formatted });
  } catch (error) {
    console.log("Get Bookings Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get All Owners
export const getAllOwners = async (req, res) => {
  try {
    const owners = await User.find({ role: "owner" })
      .select("full_name email phone role created_at")
      .sort({ created_at: -1 })
      .lean();

    return res.status(200).json({ success: true, total: owners.length, owners });
  } catch (error) {
    console.log("Get Owners Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get All PGs of Specific Owner
export const getOwnerPGs = async (req, res) => {
  try {
    const { ownerId } = req.params;

    const pgs = await PG.find({ owner_id: ownerId })
      .select("title city area price available_rooms status created_at")
      .sort({ created_at: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      ownerId,
      total: pgs.length,
      pgs: pgs.map((p) => ({ ...p, id: p._id })),
    });
  } catch (error) {
    console.log("Get Owner PGs Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get Booking History of Specific Student
export const getStudentBookings = async (req, res) => {
  try {
    const { studentId } = req.params;

    const bookings = await Booking.find({ student_id: studentId })
      .sort({ booking_date: -1 })
      .populate("pg_id", "title city area price")
      .populate("student_id", "full_name email")
      .lean();

    const formatted = bookings.map((b) => ({
      id: b._id,
      booking_date: b.booking_date,
      status: b.status,
      payment_status: b.payment_status,
      message: b.message,
      pg_id: b.pg_id?._id || b.pg_id,
      pg_title: b.pg_id?.title,
      city: b.pg_id?.city,
      area: b.pg_id?.area,
      price: b.pg_id?.price,
      student_name: b.student_id?.full_name,
      student_email: b.student_id?.email,
    }));

    return res.status(200).json({
      success: true,
      studentId,
      total: formatted.length,
      bookings: formatted,
    });
  } catch (error) {
    console.log("Get Student Bookings Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
// Get All Students
export const getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "student" })
      .select("full_name email phone role created_at")
      .sort({ created_at: -1 })
      .lean();

    return res.status(200).json({ success: true, total: students.length, students });
  } catch (error) {
    console.log("Get Students Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getOwnerDetails = async (req, res) => {
  try {
    const owner = await User.findOne({ _id: req.params.id, role: "owner" })
      .select("full_name email phone role created_at")
      .lean();

    if (!owner) {
      return res.status(404).json({ success: false, message: "Owner not found" });
    }

    return res.status(200).json({ success: true, owner });
  } catch (error) {
    console.log("Get Owner Details Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getPGDetails = async (req, res) => {
  try {
    const pg = await PG.findById(req.params.id)
      .populate("owner_id", "full_name email")
      .lean();

    if (!pg) {
      return res.status(404).json({ success: false, message: "PG not found" });
    }

    return res.status(200).json({
      success: true,
      pg: {
        ...pg,
        id: pg._id,
        owner_name: pg.owner_id?.full_name || "",
        owner_email: pg.owner_id?.email || "",
        owner_id: pg.owner_id?._id || pg.owner_id,
      },
    });
  } catch (error) {
    console.log("Get PG Details Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getStudentDetails = async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: "student" })
      .select("full_name email phone role created_at")
      .lean();

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    return res.status(200).json({ success: true, student });
  } catch (error) {
    console.log("Get Student Details Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};