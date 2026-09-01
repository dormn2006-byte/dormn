import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    description: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved", "hidden"], default: "pending" },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const Review = mongoose.model("Review", reviewSchema);
export default Review;
