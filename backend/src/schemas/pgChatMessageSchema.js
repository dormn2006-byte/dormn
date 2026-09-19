import mongoose from "mongoose";
import { autoIncrement } from "../models/plugins/autoIncrement.js";

const pgChatMessageSchema = new mongoose.Schema(
  {
    _id: { type: Number },

    pg_id: { type: Number, ref: "PG", required: true },
    conversation_id: { type: Number, ref: "PgChatConversation", default: null },
    recipient_id: { type: Number, ref: "User", default: null },
    sender_id: { type: Number, ref: "User", required: true },
    sender_role: {
      type: String,
      enum: ["owner", "student", "superadmin"],
      default: "student",
    },
    sender_name: { type: String, required: true },
    sender_avatar: { type: String, default: null },
    room_no: { type: String, default: null },
    message: { type: String, required: true },
    message_type: {
      type: String,
      enum: ["text", "image", "announcement"],
      default: "text",
    },
    is_pinned: { type: Number, default: 0 },
    is_encrypted: { type: Number, default: 1 },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
    collection: "pg_chat_messages",
  }
);

pgChatMessageSchema.index({ pg_id: 1, created_at: 1 });
pgChatMessageSchema.index({ sender_id: 1 });
pgChatMessageSchema.index({ conversation_id: 1 });
pgChatMessageSchema.index({ recipient_id: 1 });

autoIncrement(pgChatMessageSchema, "pg_chat_messages");

const PgChatMessage = mongoose.model("PgChatMessage", pgChatMessageSchema);
export default PgChatMessage;
