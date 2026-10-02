import express from "express";
import { protect, ownerOnly } from "../middleware/authMiddleware.js";
import {
  getMySettlements,
  approveSettlementController,
} from "../controllers/settlementController.js";

const router = express.Router();

router.get("/mine", protect, ownerOnly, getMySettlements);
router.post("/:id/approve", protect, ownerOnly, approveSettlementController);

export default router;
