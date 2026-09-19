import mongoose from "mongoose";
import { autoIncrement } from "../models/plugins/autoIncrement.js";

const eventTicketInviteSchema = new mongoose.Schema(
  {
    _id: { type: Number },

    invite_code: { type: String, required: true, unique: true },
    ticket_code: { type: String, required: true },
    event_id: { type: String, required: true },
    event_title: { type: String, required: true },
    category: { type: String, default: "events" },
    ticket_type: {
      type: String,
      enum: ["couple", "group"],
      required: true,
    },

    booker_user_id: { type: Number, ref: "User", required: true },
    booker_name: { type: String, required: true },
    booker_email: { type: String, required: true },
    booker_phone: { type: String, default: null },

    invitee_email: { type: String, default: null },
    invitee_name: { type: String, default: null },
    invitee_user_id: { type: Number, ref: "User", default: null },
    invitee_phone: { type: String, default: null },

    base_price: { type: Number, default: 0 },
    net_amount: { type: Number, default: 0 },
    event_date: { type: String, default: null },
    event_location: { type: String, default: null },
    event_image: { type: String, default: null },
    group_size: { type: Number, default: 2 },
    slot_number: { type: Number, default: 1 },

    status: {
      type: String,
      enum: ["pending", "accepted", "expired", "cancelled"],
      default: "pending",
    },
    accepted_at: { type: Date, default: null },
    expires_at: { type: Date, required: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
    collection: "event_ticket_invites",
  }
);

eventTicketInviteSchema.index({ ticket_code: 1 });
eventTicketInviteSchema.index({ booker_user_id: 1 });
eventTicketInviteSchema.index({ invitee_user_id: 1 });
eventTicketInviteSchema.index({ status: 1 });

autoIncrement(eventTicketInviteSchema, "event_ticket_invites");

const EventTicketInvite = mongoose.model(
  "EventTicketInvite",
  eventTicketInviteSchema
);
export default EventTicketInvite;
