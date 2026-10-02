import express from "express";

import {
  createPromoCode,
  deletePromoCode,
  listOwnerPromoCodes,
  updatePromoCode,
  validatePromoCodeForCheckout,
} from "../controllers/promoCodeController.js";
import { ownerOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Students validating a code at checkout — note this one is NOT owner-gated,
// which is why the guards are per route rather than `router.use(ownerOnly)`.
router.post("/validate", protect, validatePromoCodeForCheckout);

// Owner dashboard CRUD
router.get("/", protect, ownerOnly, listOwnerPromoCodes);
router.post("/", protect, ownerOnly, createPromoCode);
router.put("/:id", protect, ownerOnly, updatePromoCode);
router.delete("/:id", protect, ownerOnly, deletePromoCode);

export default router;
