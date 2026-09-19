import mongoose from "mongoose";
import { autoIncrement } from "../models/plugins/autoIncrement.js";

const userSchema = new mongoose.Schema(
  {
    _id: { type: Number },

    full_name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "owner", "superadmin", "event_admin", "event_manager", "admin"],
      default: "student",
    },
    gender: { type: String, default: null },
    phone: { type: String, default: null },
    profile_image: { type: String, default: null },

    otp_code: { type: String, default: null },
    otp_expiry: { type: Date, default: null },
    email_otp_code: { type: String, default: null },
    email_otp_expiry: { type: Date, default: null },
    is_email_verified: { type: Number, default: 0 },
    auth_provider: { type: String, default: "local" },

    subscription_tier: { type: String, default: "free" },
    subscription_status: { type: String, default: "trial" },
    subscription_cycle: { type: String, default: null },
    subscription_started_at: { type: Date, default: null },
    subscription_expires_at: { type: Date, default: null },
    max_pg_listings: { type: Number, default: 1 },
    custom_plan_config: { type: mongoose.Schema.Types.Mixed, default: null },

    secondary_phone: { type: String, default: null },
    business_name: { type: String, default: null },
    office_address: { type: String, default: null },
    city: { type: String, default: null },
    state: { type: String, default: null },
    pincode: { type: String, default: null },
    operating_since: { type: String, default: null },

    bank_name: { type: String, default: null },
    account_holder: { type: String, default: null },
    account_number: { type: String, default: null },
    ifsc_code: { type: String, default: null },
    upi_id: { type: String, default: null },
    pan_number: { type: String, default: null },
    gstin: { type: String, default: null },
    aadhaar_masked: { type: String, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "users",
  }
);

userSchema.index({ role: 1 });

autoIncrement(userSchema, "users");

const User = mongoose.model("User", userSchema);
export default User;
