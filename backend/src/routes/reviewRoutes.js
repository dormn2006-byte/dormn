import express from "express";
import { fetchReviews, addReview } from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js"; // Ensure this is imported!

const router = express.Router();

// Public route to view reviews (Anyone can see them)
router.get("/", fetchReviews);

// 🛡️ CRITICAL: 'protect' MUST be here before 'addReview'
router.post("/create", protect, addReview);

export default router;