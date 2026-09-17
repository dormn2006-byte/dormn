import express from "express";
import {
  registerUser,
  loginUser,
  requestOTP,
  forgotPassword,
  resetPassword,
  googleAuth,
  changePassword,
  updateProfile,
  getProfile,
  updatePayoutDetails,
  getPayoutStatus,
  sendVerificationOTP,
  verifyEmailOTP,
  getVerificationStatus,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleAuth);
router.post("/request-otp", requestOTP);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Email Verification Routes (Protected or with email body fallback)
router.post("/send-verification-otp", protect, sendVerificationOTP);
router.post("/verify-email-otp", protect, verifyEmailOTP);
router.get("/verification-status", protect, getVerificationStatus);

// Protected Profile & Security Routes
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.get("/payout-status", protect, getPayoutStatus);
router.put("/payout-details", protect, updatePayoutDetails);
router.put("/change-password", protect, changePassword);

export default router;