import mongoose from "mongoose";
import { autoIncrement } from "../models/plugins/autoIncrement.js";

// Payroll ledger: one row per successful rent payment. It records what the
// company keeps (fee_deducted) and what the owner is owed (net_amount), plus
// the state of the outbound payout to the owner's bank account.
const settlementSchema = new mongoose.Schema(
  {
    _id: { type: Number },

    payment_id: { type: Number, ref: "Payment", required: true, unique: true },
    booking_id: { type: Number, ref: "Booking", default: null },
    owner_id: { type: Number, ref: "User", required: true },
    pg_id: { type: Number, ref: "PG", default: null },
    student_id: { type: Number, ref: "User", default: null },

    // Snapshot of the amounts, so the ledger stays readable even if the booking
    // or its rent is edited later.
    gross_amount: { type: Number, required: true },
    fee_percent: { type: Number, default: 0 },
    fee_total: { type: Number, default: 0 },
    fee_deducted: { type: Number, default: 0 },
    net_amount: { type: Number, required: true },

    status: {
      type: String,
      enum: ["pending", "processing", "paid", "failed", "no_payout"],
      default: "pending",
    },

    // Which saved bank account the payout targets (bank_accounts[].id).
    bank_account_id: { type: String, default: null },

    razorpay_payout_id: { type: String, default: null },
    payout_utr: { type: String, default: null },
    failure_reason: { type: String, default: null },

    approved_at: { type: Date, default: null },
    paid_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "settlements",
  }
);

settlementSchema.index({ owner_id: 1 });
settlementSchema.index({ status: 1 });

autoIncrement(settlementSchema, "settlements");

const Settlement = mongoose.model("Settlement", settlementSchema);
export default Settlement;
