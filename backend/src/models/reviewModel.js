import Review from "../schemas/reviewSchema.js";
import User from "../schemas/userSchema.js";
import { serialize } from "../utils/serialize.js";

// Fetch approved reviews for the frontend
export const getApprovedReviews = async () => {
  const reviews = await Review.aggregate([
    { $match: { status: "approved" } },
    { $sort: { created_at: -1 } },
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        rating: 1,
        description: 1,
        title: "$user.full_name",
        tag: {
          $cond: [
            { $eq: ["$user.role", "student"] },
            "Verified Student",
            "Working Professional",
          ],
        },
      },
    },
  ]);

  return serialize(reviews);
};

// Create a new review
export const createReview = async (userId, rating, description) => {
  const review = await Review.create({
    user_id: userId,
    rating,
    description,
  });

  return { insertId: review._id, affectedRows: 1 };
};

// Fetch ALL reviews with bulletproof fallbacks and LEFT JOIN
export const getAllReviewsForAdmin = async () => {
  const reviews = await Review.aggregate([
    { $sort: { created_at: -1 } },
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        user_id: 1,
        rating: 1,
        description: 1,
        status: 1,
        created_at: 1,
        full_name: { $ifNull: ["$user.full_name", "Unknown User"] },
        email: { $ifNull: ["$user.email", "No Email provided"] },
      },
    },
  ]);

  return serialize(reviews);
};

// Update Review Status (Hide or Approve)
export const updateReviewStatus = async (id, status) => {
  return Review.updateOne({ _id: id }, { status });
};

// Admin: Delete a Review permanently
export const deleteReview = async (id) => {
  return Review.deleteOne({ _id: id });
};
