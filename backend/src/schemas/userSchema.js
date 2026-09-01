import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["student", "owner", "superadmin"], default: "student" },
    gender: { type: String, enum: ["male", "female", null], default: null },
    phone: { type: String, default: null },
    profile_image: { type: String, default: null },
    otp_code: { type: String, default: null },
    otp_expiry: { type: Date, default: null },
    subscription_tier: { type: String, default: "Pro Tier" },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const User = mongoose.model("User", userSchema);
export default User;
