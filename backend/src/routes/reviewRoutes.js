import express from "express";
import { 
  fetchReviews, 
  addReview, 
  fetchAdminReviews, 
  toggleReviewStatus, 
  removeReview 
} from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";
import superAdminMiddleware from "../middleware/superAdminMiddleware.js";

const router = express.Router();

// Public route to view reviews (Anyone can see them)
router.get("/", fetchReviews);

// Protected: Logged-in user can submit a review
router.post("/create", protect, addReview);

// SuperAdmin: Moderate reviews
router.get("/admin/all", protect, superAdminMiddleware, fetchAdminReviews);
router.put("/admin/status", protect, superAdminMiddleware, toggleReviewStatus);
router.delete("/admin/:id", protect, superAdminMiddleware, removeReview);

export default router;