import mongoose from "mongoose";
import { autoIncrement } from "../models/plugins/autoIncrement.js";

const studentProfileSchema = new mongoose.Schema(
  {
    _id: { type: Number },

    user_id: { type: Number, ref: "User", required: true, unique: true },

    full_name: { type: String, default: null },
    phone: { type: String, default: null },
    gender: { type: String, default: null },
    dob: { type: Date, default: null },
    home_address: { type: String, default: null },
    hometown: { type: String, default: null },
    pincode: { type: String, default: null },

    parent_1_name: { type: String, default: null },
    parent_1_relation: { type: String, default: null },
    parent_1_phone: { type: String, default: null },
    parent_2_name: { type: String, default: null },
    parent_2_relation: { type: String, default: null },
    parent_2_phone: { type: String, default: null },
    guardian_name: { type: String, default: null },
    guardian_relation: { type: String, default: null },
    guardian_phone: { type: String, default: null },
    guardian_email: { type: String, default: null },

    aadhar_number: { type: String, default: null },

    blood_group: { type: String, default: null },
    allergies: { type: String, default: null },
    medical_details: { type: String, default: null },
    food_preference: { type: String, default: null },
    occupation: { type: String, default: "Student" },

    college_name: { type: String, default: null },
    course_name: { type: String, default: null },
    course_year: { type: String, default: null },
    admission_year: { type: String, default: null },
    college_id_number: { type: String, default: null },
    workplace_name: { type: String, default: null },
    designation: { type: String, default: null },

    passport_photo: { type: String, default: null },
    aadhar_front: { type: String, default: null },
    aadhar_back: { type: String, default: null },
    college_id_image: { type: String, default: null },

    bio: { type: String, default: null },
    interests: { type: mongoose.Schema.Types.Mixed, default: null },
    hobbies: { type: mongoose.Schema.Types.Mixed, default: null },
    vibe: { type: String, default: null },
    socials: { type: mongoose.Schema.Types.Mixed, default: null },
    suggestions: { type: String, default: null },
    is_public: { type: Number, default: 1 },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "student_profiles",
  }
);

autoIncrement(studentProfileSchema, "student_profiles");

const StudentProfile = mongoose.model("StudentProfile", studentProfileSchema);
export default StudentProfile;
