import mongoose from "mongoose";
import { autoIncrement } from "../models/plugins/autoIncrement.js";

const paymentSchema = new mongoose.Schema(
  {
    _id: { type: Number },

    booking_id: { type: Number, ref: "Booking", required: true },
    user_id: { type: Number, ref: "User", required: true },
    pg_id: { type: Number, ref: "PG", required: true },
    owner_id: { type: Number, ref: "User", required: true },
    razorpay_order_id: { type: String, default: null },
    razorpay_payment_id: { type: String, default: null },
    razorpay_signature: { type: String, default: null },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["created", "successful", "failed"],
      default: "created",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "payments",
  }
);

paymentSchema.index({ booking_id: 1 });
paymentSchema.index({ user_id: 1 });
paymentSchema.index({ owner_id: 1 });
paymentSchema.index({ razorpay_order_id: 1 });

autoIncrement(paymentSchema, "payments");

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
