import mongoose from "mongoose";
import { autoIncrement } from "../models/plugins/autoIncrement.js";

const savedPGSchema = new mongoose.Schema(
  {
    _id: { type: Number },

    user_id: { type: Number, ref: "User", required: true },
    pg_id: { type: Number, ref: "PG", required: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "saved_pgs",
  }
);

savedPGSchema.index({ user_id: 1, pg_id: 1 }, { unique: true });

autoIncrement(savedPGSchema, "saved_pgs");

const SavedPG = mongoose.model("SavedPG", savedPGSchema);
export default SavedPG;
