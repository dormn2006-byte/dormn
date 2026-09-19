import mongoose from "mongoose";
import { autoIncrement } from "../models/plugins/autoIncrement.js";

const reviewSchema = new mongoose.Schema(
  {
    _id: { type: Number },

    user_id: { type: Number, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "hidden"],
      default: "pending",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "reviews",
  }
);

reviewSchema.index({ user_id: 1 });
reviewSchema.index({ status: 1 });

autoIncrement(reviewSchema, "reviews");

const Review = mongoose.model("Review", reviewSchema);
export default Review;
