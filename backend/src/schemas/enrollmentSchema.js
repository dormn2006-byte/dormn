import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema(
  {
    booking_id: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pg_id: { type: mongoose.Schema.Types.ObjectId, ref: "PG", required: true },
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
    interests: { type: String, default: "" },
    suggestions: { type: String, default: "" },
    status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);
export default Enrollment;
