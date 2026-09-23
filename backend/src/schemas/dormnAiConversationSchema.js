import mongoose from "mongoose";
import { autoIncrement } from "../models/plugins/autoIncrement.js";

const dormnAiConversationSchema = new mongoose.Schema(
  {
    _id: { type: Number },

    user_id: { type: Number, ref: "User", required: true },
    title: { type: String, default: "New chat" },

    // Rolling summary of the turns that have already fallen out of the
    // short-term window. Keeps long chats coherent without resending everything.
    summary: { type: String, default: "" },
    summarized_upto_message_id: { type: Number, default: 0 },

    message_count: { type: Number, default: 0 },
    last_message_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "dormn_ai_conversations",
  }
);

dormnAiConversationSchema.index({ user_id: 1, updated_at: -1 });

autoIncrement(dormnAiConversationSchema, "dormn_ai_conversations");

const DormnAiConversation = mongoose.model(
  "DormnAiConversation",
  dormnAiConversationSchema
);
export default DormnAiConversation;
