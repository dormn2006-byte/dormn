import mongoose from "mongoose";
import { autoIncrement } from "../models/plugins/autoIncrement.js";

const dormnAiMessageSchema = new mongoose.Schema(
  {
    _id: { type: Number },

    conversation_id: {
      type: Number,
      ref: "DormnAiConversation",
      required: true,
    },
    user_id: { type: Number, ref: "User", required: true },

    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, default: "" },

    // PG listing cards the tools returned for this turn, stored so they survive
    // a reload (the browser keeps them in state only for the live stream).
    pgs: { type: [mongoose.Schema.Types.Mixed], default: [] },

    // Which tools the assistant used for this turn, e.g.
    // [{ name: "search_pgs", args: {...} }]. Stored for auditability only —
    // it is never replayed into the model context.
    tool_calls: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
    collection: "dormn_ai_messages",
  }
);

dormnAiMessageSchema.index({ conversation_id: 1, created_at: 1 });
dormnAiMessageSchema.index({ user_id: 1 });

autoIncrement(dormnAiMessageSchema, "dormn_ai_messages");

const DormnAiMessage = mongoose.model("DormnAiMessage", dormnAiMessageSchema);
export default DormnAiMessage;
