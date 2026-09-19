import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    _id: { type: String },

    title: { type: String, required: true },
    tagline: { type: String, default: null },
    category: { type: String, required: true },
    category_label: { type: String, default: null },
    location: { type: String, default: null },
    city: { type: String, default: null },
    phone: { type: String, default: null },

    single_price: { type: Number, default: 0 },
    couple_price: { type: String, default: "FREE" },
    couple_condition: { type: String, default: null },

    cover_image: { type: String, default: null },
    banner_image: { type: String, default: null },
    gallery: { type: mongoose.Schema.Types.Mixed, default: [] },
    about: { type: String, default: null },
    upcoming_night: { type: mongoose.Schema.Types.Mixed, default: null },
    badge: { type: String, default: null },
    rules: { type: mongoose.Schema.Types.Mixed, default: [] },

    status: { type: String, default: "active" },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "events",
  }
);

eventSchema.index({ category: 1 });
eventSchema.index({ status: 1 });

const Event = mongoose.model("Event", eventSchema);
export default Event;
