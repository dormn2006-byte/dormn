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
  getBankAccounts,
  addBankAccount,
  updateBankAccount,
  deleteBankAccount,
  setPrimaryBankAccount,
  sendVerificationOTP,
  verifyEmailOTP,
  getVerificationStatus,
  requestDeleteAccountOTP,
  deleteAccountWithOTP,
} from "../controllers/authController.js";
import { protect, optionalProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleAuth);
router.post("/request-otp", requestOTP);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Email Verification Routes (optionalProtect allows pre-login verification during signup)
router.post("/send-verification-otp", optionalProtect, sendVerificationOTP);
router.post("/verify-email-otp", optionalProtect, verifyEmailOTP);
router.get("/verification-status", protect, getVerificationStatus);

// Protected Profile & Security Routes
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.get("/payout-status", protect, getPayoutStatus);
router.put("/payout-details", protect, updatePayoutDetails);

// Multi-Bank Accounts Management
router.get("/bank-accounts", protect, getBankAccounts);
router.post("/bank-accounts", protect, addBankAccount);
router.put("/bank-accounts/:id", protect, updateBankAccount);
router.delete("/bank-accounts/:id", protect, deleteBankAccount);
router.patch("/bank-accounts/:id/primary", protect, setPrimaryBankAccount);

router.put("/change-password", protect, changePassword);

// Permanent Account Deletion (OTP Verified, 10 min validity)
router.post("/request-delete-account-otp", protect, requestDeleteAccountOTP);
router.post("/delete-account", protect, deleteAccountWithOTP);

export default router;