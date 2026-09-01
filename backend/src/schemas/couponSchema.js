import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    discount_type: { type: String, enum: ["flat", "percentage"], required: true },
    discount_value: { type: Number, required: true },
    min_booking_amount: { type: Number, default: 0 },
    max_discount_amount: { type: Number, default: null },
    expiry_date: { type: Date, required: true },
    usage_limit: { type: Number, default: null },
    used_count: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;
