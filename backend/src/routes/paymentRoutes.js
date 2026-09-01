import express from "express";
import { createOrder, applyCoupon, verifyPayment, } from "../controllers/paymentController.js";
import { getOwnerPayments } from "../controllers/ownerPaymentController.js";
import { protect ,ownerOnly } from "../middleware/authMiddleware.js"; 


const router = express.Router();

// Apply Coupon (Protected so only logged-in users can check coupons)
router.post("/apply-coupon", protect, applyCoupon);

// Route to initialize payment
router.post("/create-order", protect, createOrder);
router.post("/verify", protect, verifyPayment);
router.get("/owner-payments", protect, ownerOnly, getOwnerPayments);

export default router;