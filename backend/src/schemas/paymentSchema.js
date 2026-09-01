import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    booking_id: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pg_id: { type: mongoose.Schema.Types.ObjectId, ref: "PG", required: true },
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    razorpay_order_id: { type: String, default: "" },
    razorpay_payment_id: { type: String, default: "" },
    razorpay_signature: { type: String, default: "" },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["created", "successful", "failed"], default: "created" },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
