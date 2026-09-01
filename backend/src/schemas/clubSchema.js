import mongoose from "mongoose";

// ==========================================
// CLUB IMAGE SUBSCHEMA
// ==========================================
const clubImageSchema = new mongoose.Schema({
  image_url: { type: String, required: true },
  display_order: { type: Number, default: 0 },
});

// ==========================================
// CLUB SCHEMA
// ==========================================
const clubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    tagline: { type: String, default: "" },
    description: { type: String, default: "" },
    city: { type: String, required: true },
    area: { type: String, default: "" },
    address: { type: String, default: "" },
    single_entry_fee: { type: Number, required: true },
    cover_image: { type: String, default: "default-club.webp" },
    contact_phone: { type: String, default: "" },
    opening_hours: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "inactive", "deleted"],
      default: "active",
    },
    images: [clubImageSchema],
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// ==========================================
// CLUB EVENT SCHEMA
// ==========================================
const clubEventSchema = new mongoose.Schema(
  {
    club_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: true,
    },
    title: { type: String, required: true },
    date: { type: Date, required: true },
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },
    capacity: { type: Number, required: true }, // counts PEOPLE
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// ==========================================
// CLUB BOOKING SCHEMA
// ==========================================
const clubBookingSchema = new mongoose.Schema(
  {
    club_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: true,
    },
    event_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClubEvent",
      required: true,
    },
    booker_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    partner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    booking_type: {
      type: String,
      enum: ["single", "couple"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending_invite", "confirmed", "cancelled"],
      default: "confirmed",
    },
    payment_status: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
    amount: { type: Number, default: 0 },
    invite_token: { type: String, default: null },
    razorpay_order_id: { type: String, default: null },
    razorpay_payment_id: { type: String, default: null },
    razorpay_signature: { type: String, default: null },
  },
  { timestamps: { createdAt: "booking_date", updatedAt: "updated_at" } }
);

// ==========================================
// CLUB TICKET SCHEMA
// ==========================================
const clubTicketSchema = new mongoose.Schema(
  {
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClubBooking",
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    club_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: true,
    },
    event_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClubEvent",
      required: true,
    },
    ticket_code: { type: String, required: true, unique: true },
    holder_name: { type: String, required: true },
    type: {
      type: String,
      enum: ["single", "couple"],
      required: true,
    },
    amount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// Indexes for performance
clubEventSchema.index({ club_id: 1, date: 1 });
clubBookingSchema.index({ booker_id: 1 });
clubBookingSchema.index({ event_id: 1 });
clubBookingSchema.index({ invite_token: 1 });
clubTicketSchema.index({ user_id: 1 });
clubTicketSchema.index({ ticket_code: 1 });

const Club = mongoose.model("Club", clubSchema);
const ClubEvent = mongoose.model("ClubEvent", clubEventSchema);
const ClubBooking = mongoose.model("ClubBooking", clubBookingSchema);
const ClubTicket = mongoose.model("ClubTicket", clubTicketSchema);

export { Club, ClubEvent, ClubBooking, ClubTicket };
