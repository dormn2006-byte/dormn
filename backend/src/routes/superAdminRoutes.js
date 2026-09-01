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

// Dashboard Stats
router.get(
  "/dashboard-stats",
  protect,
  superAdminMiddleware,
  getDashboardStats
);

// PG Management
router.get(
  "/pgs",
  protect,
  superAdminMiddleware,
  getAllPGs
);

router.get(
  "/pending-pgs",
  protect,
  superAdminMiddleware,
  getPendingPGs
);

router.put(
  "/approve-pg/:id",
  protect,
  superAdminMiddleware,
  approvePG
);

router.put(
  "/reject-pg/:id",
  protect,
  superAdminMiddleware,
  rejectPG
);

router.put(
  "/block-pg/:id",
  protect,
  superAdminMiddleware,
  blockPG
);

router.delete(
  "/delete-pg/:id",
  protect,
  superAdminMiddleware,
  deletePG
);

// User Management
router.get(
  "/all-users",
  protect,
  superAdminMiddleware,
  getAllUsers
);

router.get(
  "/all-bookings",
  protect,
  superAdminMiddleware,
  getAllBookings
);

router.get(
  "/owners",
  protect,
  superAdminMiddleware,
  getAllOwners
);

router.get(
  "/students",
  protect,
  superAdminMiddleware,
  getAllStudents
);

router.delete(
  "/delete-user/:id",
  protect,
  superAdminMiddleware,
  deleteUser
);
router.get(
  "/owner-pgs/:ownerId",
  protect,
  superAdminMiddleware,
  getOwnerPGs
);

router.get(
  "/pg/:id",
  protect,
  superAdminMiddleware,
  getPGDetails
);

router.get(
  "/owner/:id",
  protect,
  superAdminMiddleware,
  getOwnerDetails
);

router.get(
  "/student/:id",
  protect,
  superAdminMiddleware,
  getStudentDetails
);

router.get(
  "/student-bookings/:studentId",
  protect,
  superAdminMiddleware,
  getStudentBookings
);

export default router;