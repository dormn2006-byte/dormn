import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pg_id: { type: mongoose.Schema.Types.ObjectId, ref: "PG", required: true },
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, default: "" },
    selected_room_type: { type: String, default: null },
    booked_price: { type: Number, default: null },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled", "paused"],
      default: "pending",
    },
    payment_status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
  },
  { timestamps: { createdAt: "booking_date", updatedAt: "updated_at" } }
);

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
