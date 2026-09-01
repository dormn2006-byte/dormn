import Review from "../schemas/reviewSchema.js";
import User from "../schemas/userSchema.js";

// ==========================================
// PUBLIC & USER FUNCTIONS
// ==========================================

// Fetch approved reviews for the frontend
export const getApprovedReviews = async () => {
  const reviews = await Review.find({ status: "approved" })
    .sort({ created_at: -1 })
    .populate("user_id", "full_name role")
    .lean();

  return reviews.map((r) => ({
    id: r._id,
    rating: r.rating,
    description: r.description,
    title: r.user_id?.full_name || "Unknown",
    tag: r.user_id?.role === "student" ? "Verified Student" : "Working Professional",
  }));
};

// Create a new review
export const createReview = async (userId, rating, description) => {
  return await Review.create({
    user_id: userId,
    rating,
    description,
  });
};


// ==========================================
// SUPER ADMIN FUNCTIONS
// ==========================================

// Fetch ALL reviews with user info
export const getAllReviewsForAdmin = async () => {
  const reviews = await Review.find()
    .sort({ created_at: -1 })
    .populate("user_id", "full_name email")
    .lean();

  return reviews.map((r) => ({
    id: r._id,
    user_id: r.user_id?._id || r.user_id,
    rating: r.rating,
    description: r.description,
    status: r.status,
    created_at: r.created_at,
    full_name: r.user_id?.full_name || "Unknown User",
    email: r.user_id?.email || "No Email provided",
  }));
};

// Update Review Status (Hide or Approve)
export const updateReviewStatus = async (id, status) => {
  return await Review.findByIdAndUpdate(id, { status });
};

// Admin: Delete a Review permanently
export const deleteReview = async (id) => {
  return await Review.findByIdAndDelete(id);
};