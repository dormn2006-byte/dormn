import mongoose from "mongoose";
import { autoIncrement } from "../models/plugins/autoIncrement.js";

const pgImageSchema = new mongoose.Schema(
  {
    image_url: { type: String, required: true },
    display_order: { type: Number, default: 0 },
    is_cover: { type: Number, default: 0 },
  },
  { _id: false }
);

const pgSchema = new mongoose.Schema(
  {
    _id: { type: Number },

    owner_id: { type: Number, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    pg_type: {
      type: String,
      enum: ["Boys", "Girls", "Coed", "boys", "girls", "coed"],
      required: true,
    },
    price: { type: Number, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    area: { type: String, default: "" },
    nearby_college: { type: String, default: "" },
    available_rooms: { type: Number, default: 0 },
    amenities: { type: mongoose.Schema.Types.Mixed, default: [] },
    rules: { type: mongoose.Schema.Types.Mixed, default: [] },
    google_map_link: { type: String, default: "" },
    profile_image: { type: String, default: "default-pg.webp" },
    sharing_options: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "blocked"],
      default: "pending",
    },
    gallery: { type: [pgImageSchema], default: [] },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "pgs",
  }
);

const normalizePgType = (value) => {
  if (!value || typeof value !== "string") return value;
  const map = { boys: "Boys", girls: "Girls", coed: "Coed" };
  return map[value.toLowerCase()] || value;
};

pgSchema.pre("save", function () {
  if (this.pg_type) this.pg_type = normalizePgType(this.pg_type);
});

pgSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();
  const next = update?.$set?.pg_type ?? update?.pg_type;
  if (next) {
    const normalized = normalizePgType(next);
    if (update.$set) update.$set.pg_type = normalized;
    else update.pg_type = normalized;
  }
});

pgSchema.index({ owner_id: 1 });
pgSchema.index({ status: 1 });
pgSchema.index({ city: 1 });
pgSchema.index({ area: 1 });
pgSchema.index({ nearby_college: 1 });

autoIncrement(pgSchema, "pgs");

const PG = mongoose.model("PG", pgSchema);
export default PG;
