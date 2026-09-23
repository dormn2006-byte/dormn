import mongoose from "mongoose";
import { autoIncrement } from "../models/plugins/autoIncrement.js";

const bookingSchema = new mongoose.Schema(
  {
    _id: { type: Number },

    student_id: { type: Number, ref: "User", required: true },
    pg_id: { type: Number, ref: "PG", required: true },
    owner_id: { type: Number, ref: "User", required: true },
    message: { type: String, default: "" },
    selected_room_type: { type: String, default: null },
    booked_price: { type: Number, default: null },

    // Scheduled physical visit to the PG (student-selected)
    visit_date: { type: String, default: null }, // "YYYY-MM-DD"
    visit_time: { type: String, default: null }, // "10:00 AM"
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

    cancellation_status: { type: String, default: "none" },
    cancellation_reason: { type: String, default: null },
    cancellation_requested_at: { type: Date, default: null },
    cancelled_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: "booking_date", updatedAt: "updated_at" },
    collection: "bookings",
  }
);

bookingSchema.index({ student_id: 1 });
bookingSchema.index({ owner_id: 1 });
bookingSchema.index({ pg_id: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ payment_status: 1 });

autoIncrement(bookingSchema, "bookings");

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
