import mongoose from "mongoose";
import { autoIncrement } from "../models/plugins/autoIncrement.js";

const ownerSubscriptionSchema = new mongoose.Schema(
  {
    _id: { type: Number },

    owner_id: { type: Number, ref: "User", required: true },
    plan_name: { type: String, required: true },
    billing_cycle: {
      type: String,
      enum: ["monthly", "yearly"],
      required: true,
    },
    amount: { type: Number, required: true },
    razorpay_order_id: { type: String, default: null },
    razorpay_payment_id: { type: String, default: null },
    razorpay_signature: { type: String, default: null },
    status: {
      type: String,
      enum: ["created", "successful", "failed", "refunded"],
      default: "created",
    },
    valid_from: { type: Date, required: true },
    valid_until: { type: Date, required: true },
    cancelled_at: { type: Date, default: null },
    custom_plan_config: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "owner_subscriptions",
  }
);

ownerSubscriptionSchema.index({ owner_id: 1 });
ownerSubscriptionSchema.index({ status: 1 });
ownerSubscriptionSchema.index({ razorpay_order_id: 1 });

autoIncrement(ownerSubscriptionSchema, "owner_subscriptions");

const OwnerSubscription = mongoose.model(
  "OwnerSubscription",
  ownerSubscriptionSchema
);
export default OwnerSubscription;
