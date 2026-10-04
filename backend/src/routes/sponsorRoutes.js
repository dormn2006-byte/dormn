import express from "express";
import {
  cancelSponsorshipController,
  createSponsorOrderController,
  getOwnerSponsorshipsController,
  getSlotStatusController,
  getSponsoredPGsController,
  verifySponsorPaymentController,
} from "../controllers/sponsorController.js";
import { protect, ownerOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public — the Home and Explore pages read these.
router.get("/", getSponsoredPGsController);          // ?placement=home|explore
router.get("/slots", getSlotStatusController);

// Owner-only — dashboard + payment.
router.get("/owner", protect, ownerOnly, getOwnerSponsorshipsController);
router.post("/create-order", protect, ownerOnly, createSponsorOrderController);
router.post("/verify", protect, ownerOnly, verifySponsorPaymentController);
router.delete("/:id", protect, ownerOnly, cancelSponsorshipController);

export default router;
