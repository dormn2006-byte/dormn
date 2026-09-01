import cache from "memory-cache";
import { 
  getApprovedReviews, 
  createReview, 
  deleteReview, 
  getAllReviewsForAdmin, 
  updateReviewStatus 
} from "../models/reviewModel.js";

// Cache Duration: 5 minutes (300,000 milliseconds)
const CACHE_DURATION = 5 * 60 * 1000;

// Get all approved reviews for the homepage (WITH CACHING)
export const fetchReviews = async (req, res) => {
  try {
    const cacheKey = "approved_reviews_public";
    const cachedData = cache.get(cacheKey);

    // 🚀 CACHE HIT: Serve instantly from RAM with zero database load!
    if (cachedData) {
      return res.status(200).json({ success: true, reviews: cachedData, source: "ram-cache" });
    }

    // CACHE MISS: Query database
    const reviews = await getApprovedReviews();
    
    // Save into cache for future requests
    cache.put(cacheKey, reviews, CACHE_DURATION);

    res.status(200).json({ success: true, reviews, source: "database" });
  } catch (error) {
    console.error("Fetch Reviews Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch reviews" });
  }
};

// Add a new review (And invalidate cache so updates show immediately)
export const addReview = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required. Please log in to submit a review." 
      });
    }

    const userId = req.user.id; 
    const { rating, description } = req.body;

    if (!description) {
      return res.status(400).json({ success: false, message: "Review description is required" });
    }

    await createReview(userId, rating, description);

    // 🧹 CACHE INVALIDATION: Clear cache so the new review appears right away
    cache.del("approved_reviews_public");

    res.status(201).json({ success: true, message: "Review submitted successfully!" });
  } catch (error) {
    console.error("Add Review Error:", error);
    res.status(500).json({ success: false, message: "Failed to submit review" });
  }
};

// --- SUPER ADMIN CONTROLLERS ---

export const fetchAdminReviews = async (req, res) => {
  try {
    const reviews = await getAllReviewsForAdmin();
    res.status(200).json({ success: true, reviews });
  } catch (error) {
    console.error("Admin Fetch Reviews Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch admin reviews" });
  }
};

export const toggleReviewStatus = async (req, res) => {
  try {
    const { id, status } = req.body;
    await updateReviewStatus(id, status);

    // 🧹 CACHE INVALIDATION: Clear public cache when admin hides/approves a review
    cache.del("approved_reviews_public");

    res.status(200).json({ success: true, message: `Review marked as ${status}` });
  } catch (error) {
    console.error("Status Update Error:", error);
    res.status(500).json({ success: false, message: "Failed to update status" });
  }
};

export const removeReview = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteReview(id);

    // 🧹 CACHE INVALIDATION: Clear public cache when admin deletes a review
    cache.del("approved_reviews_public");

    res.status(200).json({ success: true, message: "Review deleted permanently" });
  } catch (error) {
    console.error("Delete Review Error:", error);
    res.status(500).json({ success: false, message: "Failed to delete review" });
  }
};