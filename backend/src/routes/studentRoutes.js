import express from "express";
import {
  getStudentProfile,
  saveStudentProfile,
  savePaymentKyc,
  getStudentPublicProfile,
} from "../controllers/studentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Private profile routes for authenticated student
router.get("/profile", protect, getStudentProfile);
router.post("/profile", protect, saveStudentProfile);
router.put("/profile", protect, saveStudentProfile);

// Mandatory tenant details captured just before payment
router.post("/payment-kyc", protect, savePaymentKyc);

// Public / Owner profile view with privacy guard
router.get("/public-profile/:studentId", getStudentPublicProfile);

export default router;
