import mongoose from "mongoose";
import { autoIncrement } from "../models/plugins/autoIncrement.js";

// Persistent, addressable notifications. The owner's in-app list previously
// derived everything from bookings/maintenance on the client; this store backs
// events that need an action (e.g. "a rent payment is ready to transfer").
const notificationSchema = new mongoose.Schema(
  {
    _id: { type: Number },

    user_id: { type: Number, ref: "User", required: true, index: true },
    role: { type: String, default: "owner" },

    type: {
      type: String,
      enum: ["payment_settlement", "payout_paid", "payout_failed", "system"],
      default: "system",
    },

    title: { type: String, required: true },
    message: { type: String, default: "" },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Optional call to action rendered as a button in the UI.
    action_type: { type: String, default: null }, // "approve_payout"
    action_ref: { type: String, default: null }, // settlement id

    is_read: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "notifications",
  }
);

notificationSchema.index({ is_read: 1 });

autoIncrement(notificationSchema, "notifications");

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
