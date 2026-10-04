import mongoose from "mongoose";
import { autoIncrement } from "../models/plugins/autoIncrement.js";

const pgSponsorshipSchema = new mongoose.Schema(
  {
    _id: { type: Number },

    owner_id: { type: Number, ref: "User", required: true },
    pg_id: { type: Number, ref: "PG", required: true },
    placement: {
      type: String,
      enum: ["home", "explore"],
      required: true,
    },
    amount: { type: Number, required: true },
    razorpay_order_id: { type: String, default: null },
    razorpay_payment_id: { type: String, default: null },
    razorpay_signature: { type: String, default: null },
    // created  -> slot held while a payment is in flight
    // active   -> live and shown in its placement
    // expired  -> past expires_at, or an abandoned reservation
    status: {
      type: String,
      enum: ["created", "active", "expired", "failed", "cancelled"],
      default: "created",
    },
    starts_at: { type: Date, default: null },
    expires_at: { type: Date, default: null },
    cancelled_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "pg_sponsorships",
  }
);

pgSponsorshipSchema.index({ placement: 1, status: 1, expires_at: 1 });
pgSponsorshipSchema.index({ owner_id: 1 });
pgSponsorshipSchema.index({ pg_id: 1, placement: 1, status: 1 });
pgSponsorshipSchema.index({ razorpay_order_id: 1 });

autoIncrement(pgSponsorshipSchema, "pg_sponsorships");

const PGSponsorship = mongoose.model("PGSponsorship", pgSponsorshipSchema);
export default PGSponsorship;
