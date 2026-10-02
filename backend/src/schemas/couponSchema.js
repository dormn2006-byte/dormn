import mongoose from "mongoose";
import { autoIncrement } from "../models/plugins/autoIncrement.js";

const couponSchema = new mongoose.Schema(
  {
    _id: { type: Number },

    // null => legacy/global coupon. Set for owner-created promo codes.
    owner_id: { type: Number, ref: "User", default: null, index: true },
    pg_id: { type: Number, ref: 'PG', default: null },
    title: String,
    description: String,

    code: { type: String, required: true, unique: true, uppercase: true, trim: true },

    discount_type: {
      type: String,
      enum: ["flat", "percentage"],
      required: true,
    },
    discount_value: { type: Number, required: true },
    min_booking_amount: { type: Number, default: 0 },
    // Upper bound when discount_type is "percentage". Ignored for flat.
    max_discount_amount: { type: Number, default: null },

    // Which of the owner's PGs the code applies to. Empty => all of them.
    pg_ids: { type: [Number], default: [] },

    expiry_date: { type: Date, required: true },

    // Lifecycle for a one-time-use code. `reserved` is held while a Razorpay
    // order is open so two people can't both spend the same code; it moves to
    // `used` on a verified payment and back to `active` if that payment fails
    // or the checkout is abandoned (see the sweep in server.js).
    status: {
      type: String,
      enum: ["active", "reserved", "used"],
      default: "active",
    },
    reserved_order_id: { type: String, default: null },
    reserved_at: { type: Date, default: null },
    used_at: { type: Date, default: null },
    used_by_user_id: { type: Number, ref: "User", default: null },
    used_booking_id: { type: Number, ref: "Booking", default: null },

    // Legacy fields from the original coupon model. Rows created before the
    // promo-code feature still carry them; new codes are governed by `status`.
    usage_limit: { type: Number, default: 1 },
    used_count: { type: Number, default: 0 },
    is_active: { type: Number, default: 1 },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "coupons",
  }
);

couponSchema.index({ owner_id: 1, status: 1 });

autoIncrement(couponSchema, "coupons");

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;
