import express from "express";
import {
  registerUser,
  loginUser,
  requestOTP,
} from "../controllers/authController.js";
import {
  protect,
  adminOnly,
  ownerOnly,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Test Route
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Auth route working successfully",
  });
});
router.get("/deployment-test", (req, res) => {
  res.json({
    success: true,
    message: "Latest code deployed successfully",
  });
});
// Register Route
router.post("/register", registerUser);

// Login Route
router.post("/login", loginUser);

router.post("/request-otp", requestOTP);

// Protected User Route
router.get("/profile", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Protected profile route accessed",
    user: req.user,
  });
});

// Admin Only Route
router.get("/admin", protect, adminOnly, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome Admin",
  });
});

// PG Owner Only Route
router.get("/owner", protect, ownerOnly, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome PG Owner",
  });
});

export default router;