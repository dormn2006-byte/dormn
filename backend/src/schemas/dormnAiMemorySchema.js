import mongoose from "mongoose";
import { autoIncrement } from "../models/plugins/autoIncrement.js";

// One document per user — Dr.Dormn's long-term memory.
// Injected into the system prompt of every new conversation so preferences
// survive across chats and devices.
const dormnAiMemorySchema = new mongoose.Schema(
  {
    _id: { type: Number },

    user_id: { type: Number, ref: "User", required: true },

    summary: { type: String, default: "" },
    facts: { type: [String], default: [] },
    preferences: { type: mongoose.Schema.Types.Mixed, default: {} },

    last_updated_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
    collection: "dormn_ai_memory",
  }
);

dormnAiMemorySchema.index({ user_id: 1 }, { unique: true });

autoIncrement(dormnAiMemorySchema, "dormn_ai_memory");

const DormnAiMemory = mongoose.model("DormnAiMemory", dormnAiMemorySchema);
export default DormnAiMemory;
