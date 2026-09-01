import express from "express";
import { submitEnrollment, getEnrollmentForOwner ,getOwnerEnrollments ,updateEnrollmentStatus } from "../controllers/enrollmentController.js";
import { protect } from "../middleware/authMiddleware.js"; // Adjust path if needed

const router = express.Router(); 

// @route   POST /api/enrollments/submit
// @desc    Submit KYC / Enrollment Form (Student)
// @access  Private (Logged-in Student)
router.post("/submit", protect, submitEnrollment);

// @route   GET /api/enrollments/owner/:bookingId
// @desc    Get specific enrollment form for PDF generation (PG Owner)
// @access  Private (Logged-in Owner)
router.get("/owner/:bookingId", protect, getEnrollmentForOwner);
router.get("/owner-list", protect, getOwnerEnrollments);
router.put("/status", protect, updateEnrollmentStatus);

export default router;