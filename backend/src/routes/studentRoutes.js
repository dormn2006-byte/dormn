import express from "express";
import {
  getStudentProfile,
  saveStudentProfile,
  getStudentPublicProfile,
} from "../controllers/studentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Private profile routes for authenticated student
router.get("/profile", protect, getStudentProfile);
router.post("/profile", protect, saveStudentProfile);
router.put("/profile", protect, saveStudentProfile);

// Public / Owner profile view with privacy guard
router.get("/public-profile/:studentId", getStudentPublicProfile);

export default router;
