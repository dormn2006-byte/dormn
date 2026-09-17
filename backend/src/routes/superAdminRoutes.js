import express from "express";
import {
  getDashboardStats,
  getAllPGs,
  getPendingPGs,
  approvePG,
  rejectPG,
  blockPG,
  deletePG,
  getAllUsers,
  deleteUser,
  getAllBookings,
  getAllOwners,
  getAllStudents,
  getOwnerPGs,
  getStudentBookings,
  getPGDetails,
  getOwnerDetails,
  getStudentDetails,
} from "../controllers/superAdminController.js";

import { protect } from "../middleware/authMiddleware.js";
import superAdminMiddleware from "../middleware/superAdminMiddleware.js";

const router = express.Router();

// 🛡️ All routes in this router require superadmin authorization
router.use(protect, superAdminMiddleware);

// Platform & Directory Metrics
router.get("/dashboard-stats", getDashboardStats);
router.get("/pgs", getAllPGs);
router.get("/pending-pgs", getPendingPGs);

// Property Moderation Actions (with alias support)
router.put(["/approve-pg/:id", "/pg/:id/approve"], approvePG);
router.put(["/reject-pg/:id", "/pg/:id/reject"], rejectPG);
router.put("/block-pg/:id", blockPG);
router.delete(["/delete-pg/:id", "/pg/:id"], deletePG);

// User & Entity Management
router.get("/all-users", getAllUsers);
router.get("/all-bookings", getAllBookings);
router.get("/owners", getAllOwners);
router.get("/students", getAllStudents);
router.delete("/delete-user/:id", deleteUser);

// Entity Details
router.get("/owner-pgs/:ownerId", getOwnerPGs);
router.get("/pg/:id", getPGDetails);
router.get("/owner/:id", getOwnerDetails);
router.get("/student/:id", getStudentDetails);
router.get("/student-bookings/:studentId", getStudentBookings);

export default router;