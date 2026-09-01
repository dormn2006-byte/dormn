import mongoose from "mongoose";

const pgImageSchema = new mongoose.Schema({
  image_url: { type: String, required: true },
  display_order: { type: Number, default: 0 },
  is_cover: { type: Number, default: 0 },
});

const pgSchema = new mongoose.Schema(
  {
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    pg_type: { type: String, enum: ["Boys", "Girls", "Coed", "boys", "girls", "coed"], required: true },
    price: { type: Number, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    area: { type: String, default: "" },
    nearby_college: { type: String, default: "" },
    available_rooms: { type: Number, default: 0 },
    amenities: { type: mongoose.Schema.Types.Mixed, default: {} },
    rules: { type: mongoose.Schema.Types.Mixed, default: {} },
    google_map_link: { type: String, default: "" },
    profile_image: { type: String, default: "default-pg.webp" },
    sharing_options: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ["pending", "approved", "rejected", "blocked"], default: "pending" },
    gallery: [pgImageSchema],
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// Normalize pg_type casing before saving
pgSchema.pre("save", function () {
  if (this.pg_type) {
    const map = { boys: "Boys", girls: "Girls", coed: "Coed" };
    this.pg_type = map[this.pg_type.toLowerCase()] || this.pg_type;
  }
});

// Normalize pg_type on updates too
pgSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();
  if (update?.pg_type) {
    const map = { boys: "Boys", girls: "Girls", coed: "Coed" };
    update.pg_type = map[update.pg_type.toLowerCase()] || update.pg_type;
  }
});

const PG = mongoose.model("PG", pgSchema);
export default PG;
