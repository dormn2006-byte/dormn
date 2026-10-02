import express from "express";
import { handleRazorpayWebhook } from "../controllers/webhookController.js";

const router = express.Router();

// Raw body is required to verify the X-Razorpay-Signature HMAC, so this route
// must be mounted BEFORE the global express.json() parser in server.js.
router.post("/razorpay", express.raw({ type: "application/json" }), handleRazorpayWebhook);

export default router;
