import mongoose from "mongoose";
import { autoIncrement } from "../models/plugins/autoIncrement.js";

const enrollmentSchema = new mongoose.Schema(
  {
    _id: { type: Number },

    booking_id: { type: Number, ref: "Booking", required: true },
    student_id: { type: Number, ref: "User", required: true },
    pg_id: { type: Number, ref: "PG", required: true },

    dob: { type: Date, default: null },
    home_address: { type: String, default: "" },
    hometown: { type: String, default: "" },
    pincode: { type: String, default: "" },

    parent_1_name: { type: String, default: "" },
    parent_1_relation: { type: String, default: "" },
    parent_1_phone: { type: String, default: "" },
    parent_2_name: { type: String, default: "" },
    parent_2_relation: { type: String, default: "" },
    parent_2_phone: { type: String, default: "" },
    guardian_name: { type: String, default: "" },
    guardian_relation: { type: String, default: "" },
    guardian_phone: { type: String, default: "" },
    guardian_email: { type: String, default: "" },

    aadhar_number: { type: String, default: null },

    food_preference: { type: String, default: "" },
    blood_group: { type: String, default: "" },
    allergies: { type: String, default: "" },
    medical_details: { type: String, default: "" },

    occupation: { type: String, default: "" },
    workplace_name: { type: String, default: "" },
    designation: { type: String, default: "" },
    college_name: { type: String, default: "" },
    admission_year: { type: String, default: "" },
    college_id_number: { type: String, default: "" },
    course_name: { type: String, default: "" },
    course_year: { type: String, default: "" },

    passport_photo: { type: String, default: null },
    aadhar_front: { type: String, default: null },
    aadhar_back: { type: String, default: null },
    college_id_image: { type: String, default: null },

    interests: { type: mongoose.Schema.Types.Mixed, default: null },
    suggestions: { type: String, default: "" },

    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },

    rejection_note: { type: String, default: null },
    rejected_at: { type: Date, default: null },
    resubmitted_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "enrollment_forms",
  }
);

enrollmentSchema.index({ booking_id: 1 });
enrollmentSchema.index({ student_id: 1 });
enrollmentSchema.index({ pg_id: 1 });

autoIncrement(enrollmentSchema, "enrollment_forms");

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);
export default Enrollment;
