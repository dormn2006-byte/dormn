import mongoose from "mongoose";

const savedPGSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pg_id: { type: mongoose.Schema.Types.ObjectId, ref: "PG", required: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// Prevent duplicate saves
savedPGSchema.index({ user_id: 1, pg_id: 1 }, { unique: true });

const SavedPG = mongoose.model("SavedPG", savedPGSchema);
export default SavedPG;
