

import express from "express";

import {
  createBookingController,
  getStudentBookingsController,
  getOwnerBookingsController,
  updateBookingStatusController,
  cancelBookingController,
  getMyPgs,
  requestStayCancellationController,
  getOwnerCancellationsController,
  handleStayCancellationController,
} from "../controllers/bookingController.js";

import {
  protect,
  ownerOnly,
  requireVerifiedEmail,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Create Booking Request (Student - requires verified email)
router.post(
  "/create",
  protect,
  requireVerifiedEmail,
  createBookingController
);

// Get Logged In Student Bookings
router.get(
  "/my-bookings",
  protect,
  getStudentBookingsController
);

// Get Owner Booking Requests
router.get(
  "/owner-bookings",
  protect,
  ownerOnly,
  getOwnerBookingsController
);

router.get("/my-pgs", protect, getMyPgs);

// Cancel Booking Request (Student cancels their own pending booking)
router.put(
  "/:id/cancel",
  protect,
  cancelBookingController
);

// Update Booking Status (Owner)
router.put(
  "/:id/status",  // <-- Flipped!
  protect,
  ownerOnly,
  updateBookingStatusController
);

// ── Stay Cancellation Endpoints ──
// Student requests cancellation for enrolled PG
router.post(
  "/request-stay-cancellation",
  protect,
  requestStayCancellationController
);

// Owner fetches cancellation requests for their PGs
router.get(
  "/owner-cancellations",
  protect,
  ownerOnly,
  getOwnerCancellationsController
);

// Owner approves/rejects cancellation request
router.post(
  "/handle-stay-cancellation",
  protect,
  ownerOnly,
  handleStayCancellationController
);

export default router;