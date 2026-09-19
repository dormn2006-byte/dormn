import mongoose from "mongoose";
import { autoIncrement } from "../models/plugins/autoIncrement.js";

const pgChatConversationSchema = new mongoose.Schema(
  {
    _id: { type: Number },

    pg_id: { type: Number, ref: "PG", required: true },
    type: {
      type: String,
      enum: ["main", "group", "direct"],
      default: "group",
    },
    title: { type: String, required: true },
    description: { type: String, default: null },
    icon: { type: String, default: "users" },
    created_by: { type: Number, ref: "User", required: true },
    members_json: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
    collection: "pg_chat_conversations",
  }
);

pgChatConversationSchema.index({ pg_id: 1 });

autoIncrement(pgChatConversationSchema, "pg_chat_conversations");

const PgChatConversation = mongoose.model(
  "PgChatConversation",
  pgChatConversationSchema
);
export default PgChatConversation;
