import User from "../schemas/userSchema.js";
import PG from "../schemas/pgSchema.js";
import Booking from "../schemas/bookingSchema.js";
import { serialize } from "../utils/serialize.js";

// Reusable join stages: pgs + users, LEFT JOIN style (preserve nulls) where the
// original query used a LEFT JOIN, inner-join style (plain $unwind) otherwise.
const pgOwnerLookup = [
  {
    $lookup: {
      from: "users",
      localField: "owner_id",
      foreignField: "_id",
      as: "owner",
    },
  },
];

// Get Dashboard Stats
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalOwners,
      totalStudents,
      totalPGs,
      pendingPGs,
      approvedPGs,
      rejectedPGs,
      totalBookings,
    ] = await Promise.all([
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

// Get All PGs
export const getAllPGs = async (req, res) => {
  try {
    const pgs = await PG.aggregate([
      ...pgOwnerLookup,
      { $unwind: "$owner" },
      {
        $addFields: {
          owner_name: "$owner.full_name",
          owner_email: "$owner.email",
        },
      },
      { $project: { owner: 0 } },
      { $sort: { created_at: -1 } },
    ]);

    return res.status(200).json({
      success: true,
      total: pgs.length,
      pgs: serialize(pgs),
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
    const pgs = await PG.aggregate([
      { $match: { status: "pending" } },
      ...pgOwnerLookup,
      { $unwind: "$owner" },
      {
        $addFields: {
          owner_name: "$owner.full_name",
          owner_email: "$owner.email",
        },
      },
      { $project: { owner: 0 } },
      { $sort: { created_at: -1 } },
    ]);

    return res.status(200).json({
      success: true,
      total: pgs.length,
      pgs: serialize(pgs),
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

    await PG.updateOne({ _id: Number(id) }, { status: "approved" });

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

    await PG.updateOne({ _id: Number(id) }, { status: "rejected" });

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

    await PG.updateOne({ _id: Number(id) }, { status: "blocked" });

    return res.status(200).json({
      success: true,
      message: "PG blocked successfully",
    });
  } catch (error) {
    console.log("Block PG Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Delete PG
export const deletePG = async (req, res) => {
  try {
    const { id } = req.params;

    await PG.deleteOne({ _id: Number(id) });

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
    const users = await User.find()
      .select("full_name email role created_at")
      .sort({ created_at: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      total: users.length,
      users: serialize(users),
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

    await User.deleteOne({ _id: Number(id) });

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
    const bookings = await Booking.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "student_id",
          foreignField: "_id",
          as: "u",
        },
      },
      { $unwind: { path: "$u", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "pgs",
          localField: "pg_id",
          foreignField: "_id",
          as: "p",
        },
      },
      { $unwind: { path: "$p", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          student_name: { $ifNull: ["$u.full_name", null] },
          student_email: { $ifNull: ["$u.email", null] },
          pg_title: { $ifNull: ["$p.title", null] },
        },
      },
      { $sort: { booking_date: -1 } },
      { $project: { u: 0, p: 0 } },
    ]);

    return res.status(200).json({
      success: true,
      total: bookings.length,
      bookings: serialize(bookings),
    });
  } catch (error) {
    console.log("Get Bookings Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get All Owners
export const getAllOwners = async (req, res) => {
  try {
    const owners = await User.find({ role: "owner" })
      .select("full_name email phone role created_at")
      .sort({ created_at: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      total: owners.length,
      owners: serialize(owners),
    });
  } catch (error) {
    console.log("Get Owners Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get All PGs of Specific Owner
export const getOwnerPGs = async (req, res) => {
  try {
    const { ownerId } = req.params;

    const pgs = await PG.find({ owner_id: Number(ownerId) })
      .select("title city area price available_rooms status created_at")
      .sort({ created_at: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      ownerId,
      total: pgs.length,
      pgs: serialize(pgs),
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

    const bookings = await Booking.aggregate([
      { $match: { student_id: Number(studentId) } },
      {
        $lookup: {
          from: "pgs",
          localField: "pg_id",
          foreignField: "_id",
          as: "p",
        },
      },
      { $unwind: { path: "$p", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "student_id",
          foreignField: "_id",
          as: "u",
        },
      },
      { $unwind: { path: "$u", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          booking_date: 1,
          status: 1,
          payment_status: 1,
          message: 1,
          pg_id: "$p._id",
          pg_title: "$p.title",
          city: "$p.city",
          area: "$p.area",
          price: "$p.price",
          student_name: { $ifNull: ["$u.full_name", null] },
          student_email: { $ifNull: ["$u.email", null] },
        },
      },
      { $sort: { booking_date: -1 } },
    ]);

    return res.status(200).json({
      success: true,
      studentId,
      total: bookings.length,
      bookings: serialize(bookings),
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
    const students = await User.find({ role: "student" })
      .select("full_name email phone role created_at")
      .sort({ created_at: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      total: students.length,
      students: serialize(students),
    });
  } catch (error) {
    console.log("Get Students Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getOwnerDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const owner = await User.findOne({ _id: Number(id), role: "owner" })
      .select("full_name email phone role created_at")
      .lean();

    if (!owner) {
      return res.status(404).json({
        success: false,
        message: "Owner not found",
      });
    }

    return res.status(200).json({
      success: true,
      owner: serialize(owner),
    });
  } catch (error) {
    console.log("Get Owner Details Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getPGDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const [pg] = await PG.aggregate([
      { $match: { _id: Number(id) } },
      ...pgOwnerLookup,
      { $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          owner_name: { $ifNull: ["$owner.full_name", null] },
          owner_email: { $ifNull: ["$owner.email", null] },
        },
      },
      { $project: { owner: 0 } },
      { $limit: 1 },
    ]);

    if (!pg) {
      return res.status(404).json({
        success: false,
        message: "PG not found",
      });
    }

    return res.status(200).json({
      success: true,
      pg: serialize(pg),
    });
  } catch (error) {
    console.log("Get PG Details Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getStudentDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await User.findOne({ _id: Number(id), role: "student" })
      .select("full_name email phone role created_at")
      .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    return res.status(200).json({
      success: true,
      student: serialize(student),
    });
  } catch (error) {
    console.log("Get Student Details Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
