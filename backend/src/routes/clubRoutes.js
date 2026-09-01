import express from "express";
import {
  listClubs,
  getClubDetails,
  getInviteData,
  createBooking,
  getBookingStatus,
  createClubOrder,
  verifyClubPayment,
  cancelBooking,
  getMyTickets,
  acceptInvite,
  adminListClubs,
  adminClubBookings,
  adminCreateClub,
  adminUpdateClub,
  adminDeleteClub,
  adminCreateEvent,
  adminDeleteEvent,
} from "../controllers/clubController.js";
import { protect } from "../middleware/authMiddleware.js";
import superAdminMiddleware from "../middleware/superAdminMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// ==========================================
// IMPORTANT: Route ordering matters!
// Static routes & /booking/* BEFORE /:id
// ==========================================

// PUBLIC ENDPOINTS
router.get("/", listClubs);

// INVITE ROUTES (before /:id)
router.get("/invite/:token", getInviteData);
router.post("/invite/accept", acceptInvite);

// USER TICKETS (before /:id)
router.get("/my-tickets", protect, getMyTickets);

// ADMIN ROUTES (before /:id)
router.get("/admin/all", protect, superAdminMiddleware, adminListClubs);
router.get("/admin/bookings", protect, superAdminMiddleware, adminClubBookings);

// BOOKING ROUTES (MUST be before /:id to avoid Express matching "booking" as an id)
router.post("/booking", protect, createBooking);
router.get("/booking/:id", protect, getBookingStatus);
router.post("/booking/:id/create-order", protect, createClubOrder);
router.post("/booking/:id/verify", protect, verifyClubPayment);
router.post("/booking/:id/cancel", protect, cancelBooking);

// CLUB DETAILS (/:id LAST among GET routes)
router.get("/:id", getClubDetails);

// ADMIN CLUB MANAGEMENT (POST/PUT/DELETE - won't conflict with GET /:id)
router.post("/", protect, superAdminMiddleware, upload.fields([
  { name: "cover_image", maxCount: 1 },
  { name: "images", maxCount: 10 },
]), adminCreateClub);
router.put("/:id", protect, superAdminMiddleware, upload.fields([
  { name: "cover_image", maxCount: 1 },
  { name: "images", maxCount: 10 },
]), adminUpdateClub);
router.delete("/:id", protect, superAdminMiddleware, adminDeleteClub);
router.post("/:id/events", protect, superAdminMiddleware, adminCreateEvent);
router.delete("/events/:eventId", protect, superAdminMiddleware, adminDeleteEvent);

export default router;
