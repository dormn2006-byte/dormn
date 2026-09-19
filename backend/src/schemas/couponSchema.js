import mongoose from "mongoose";
import { autoIncrement } from "../models/plugins/autoIncrement.js";

const couponSchema = new mongoose.Schema(
  {
    _id: { type: Number },

    code: { type: String, required: true, unique: true, uppercase: true },
    discount_type: {
      type: String,
      enum: ["flat", "percentage"],
      required: true,
    },
    discount_value: { type: Number, required: true },
    min_booking_amount: { type: Number, default: 0 },
    max_discount_amount: { type: Number, default: null },
    expiry_date: { type: Date, required: true },
    usage_limit: { type: Number, default: null },
    used_count: { type: Number, default: 0 },
    is_active: { type: Number, default: 1 },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "coupons",
  }
);

autoIncrement(couponSchema, "coupons");

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;
