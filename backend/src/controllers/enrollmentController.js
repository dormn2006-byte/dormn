import Booking from "../schemas/bookingSchema.js";
import PG from "../schemas/pgSchema.js";
import User from "../schemas/userSchema.js";
import Enrollment from "../schemas/enrollmentSchema.js";
import StudentProfile from "../schemas/studentProfileSchema.js";
import { serialize } from "../utils/serialize.js";
import { notifyOwnerKYCSubmitted } from "../utils/whatsappService.js";
import { encrypt, decryptEnrollmentObject } from "../utils/encryptionService.js";

// The owner only ever sees the last four digits of an Aadhaar number.
const maskAadhar = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length === 12 ? `XXXX XXXX ${digits.slice(-4)}` : null;
};

export const submitEnrollment = async (req, res) => {
  try {
    const student_id = req.user.id;
    
    // Destructure the massive form payload sent from frontend
    const { 
        booking_id, pg_id, dob, homeAddress, hometown, pincode,
        parent1Name, parent1Relation, parent1Phone, parent2Name, parent2Relation, parent2Phone,
        guardianName, guardianRelation, guardianPhone,
        foodPreference, bloodGroup, allergies, medicalDetails,
        occupation, workplaceName, designation,
        collegeName, admissionYear, collegeIdNumber, courseName, courseYear,
        passportPhoto, aadharFront, aadharBack, collegeIdImage,
        interests, suggestions, isPublic
      } = req.body;

    if (!booking_id) {
      return res.status(400).json({ success: false, message: "Booking ID is required." });
    }

    // Row-Level Security: Ensure this booking actually belongs to the authenticated student
    const bookingAuth = await Booking.findOne({
      _id: Number(booking_id),
      student_id,
    })
      .select("_id")
      .lean();

    if (!bookingAuth && req.user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. This booking does not belong to your account.",
      });
    }

    const existing = await Enrollment.findOne({ booking_id: Number(booking_id) })
      .select("_id")
      .lean();

    const encP1Phone = parent1Phone ? encrypt(parent1Phone) : null;
    const encP2Phone = parent2Phone ? encrypt(parent2Phone) : null;
    const encGPhone = guardianPhone ? encrypt(guardianPhone) : null;
    const encCollegeId = collegeIdNumber ? encrypt(collegeIdNumber) : null;
    const encAllergies = allergies ? encrypt(allergies) : null;
    const encMedical = medicalDetails ? encrypt(medicalDetails) : null;

    // interests is stored as a NATIVE value (was string-serialised when an object).
    if (existing) {
      // If it exists, Update it
      const updateData = {
        dob,
        home_address: homeAddress,
        hometown,
        pincode,
        parent_1_name: parent1Name,
        parent_1_relation: parent1Relation,
        parent_1_phone: encP1Phone,
        parent_2_name: parent2Name,
        parent_2_relation: parent2Relation,
        parent_2_phone: encP2Phone,
        guardian_name: guardianName,
        guardian_relation: guardianRelation,
        guardian_phone: encGPhone,
        food_preference: foodPreference,
        blood_group: bloodGroup,
        allergies: encAllergies,
        medical_details: encMedical,
        occupation,
        workplace_name: workplaceName,
        designation,
        college_name: collegeName,
        admission_year: admissionYear,
        college_id_number: encCollegeId,
        course_name: courseName,
        course_year: courseYear,
        interests,
        suggestions,
      };
      // Images use COALESCE(?, col): keep the stored value when nothing new is supplied.
      if (passportPhoto) updateData.passport_photo = passportPhoto;
      if (aadharFront) updateData.aadhar_front = aadharFront;
      if (aadharBack) updateData.aadhar_back = aadharBack;
      if (collegeIdImage) updateData.college_id_image = collegeIdImage;

      await Enrollment.updateOne({ booking_id: Number(booking_id) }, updateData);
    } else {
      // Otherwise, Insert new form
      await Enrollment.create({
        booking_id,
        student_id,
        pg_id,
        dob,
        home_address: homeAddress,
        hometown,
        pincode,
        parent_1_name: parent1Name,
        parent_1_relation: parent1Relation,
        parent_1_phone: encP1Phone,
        parent_2_name: parent2Name,
        parent_2_relation: parent2Relation,
        parent_2_phone: encP2Phone,
        guardian_name: guardianName,
        guardian_relation: guardianRelation,
        guardian_phone: encGPhone,
        food_preference: foodPreference,
        blood_group: bloodGroup,
        allergies: encAllergies,
        medical_details: encMedical,
        occupation,
        workplace_name: workplaceName,
        designation,
        college_name: collegeName,
        admission_year: admissionYear,
        college_id_number: encCollegeId,
        course_name: courseName,
        course_year: courseYear,
        passport_photo: passportPhoto || null,
        aadhar_front: aadharFront || null,
        aadhar_back: aadharBack || null,
        college_id_image: collegeIdImage || null,
        interests,
        suggestions,
      });
    }

    // ── TWO-WAY SYNC: Automatically update / populate student_profiles table ──
    const pubFlag = isPublic !== undefined ? (isPublic ? 1 : 0) : 1;

    const existingProfile = await StudentProfile.findOne({ user_id: student_id })
      .select("_id")
      .lean();

    if (existingProfile) {
      const updateData = {
        dob: dob || null,
        home_address: homeAddress,
        hometown,
        pincode,
        parent_1_name: parent1Name,
        parent_1_relation: parent1Relation,
        parent_1_phone: encP1Phone,
        parent_2_name: parent2Name,
        parent_2_relation: parent2Relation,
        parent_2_phone: encP2Phone,
        guardian_name: guardianName,
        guardian_relation: guardianRelation,
        guardian_phone: encGPhone,
        blood_group: bloodGroup,
        allergies: encAllergies,
        medical_details: encMedical,
        food_preference: foodPreference,
        occupation,
        college_name: collegeName,
        course_name: courseName,
        course_year: courseYear,
        admission_year: admissionYear,
        college_id_number: encCollegeId,
        workplace_name: workplaceName,
        designation,
        interests,
        suggestions,
        is_public: pubFlag,
      };
      if (passportPhoto) updateData.passport_photo = passportPhoto;
      if (aadharFront) updateData.aadhar_front = aadharFront;
      if (aadharBack) updateData.aadhar_back = aadharBack;
      if (collegeIdImage) updateData.college_id_image = collegeIdImage;

      await StudentProfile.updateOne({ user_id: student_id }, updateData);
    } else {
      await StudentProfile.create({
        user_id: student_id,
        full_name: req.user.full_name || "",
        phone: req.user.phone || encP1Phone || "",
        dob: dob || null,
        home_address: homeAddress,
        hometown,
        pincode,
        parent_1_name: parent1Name,
        parent_1_relation: parent1Relation,
        parent_1_phone: encP1Phone,
        parent_2_name: parent2Name,
        parent_2_relation: parent2Relation,
        parent_2_phone: encP2Phone,
        guardian_name: guardianName,
        guardian_relation: guardianRelation,
        guardian_phone: encGPhone,
        blood_group: bloodGroup,
        allergies: encAllergies,
        medical_details: encMedical,
        food_preference: foodPreference,
        occupation,
        college_name: collegeName,
        course_name: courseName,
        course_year: courseYear,
        admission_year: admissionYear,
        college_id_number: encCollegeId,
        workplace_name: workplaceName,
        designation,
        passport_photo: passportPhoto || null,
        aadhar_front: aadharFront || null,
        aadhar_back: aadharBack || null,
        college_id_image: collegeIdImage || null,
        interests,
        suggestions,
        is_public: pubFlag,
      });
    }

    res.status(200).json({ success: true, message: "Registration Form Submitted & Synced Successfully!" });

    // ── WhatsApp: Notify PG Owner of new KYC submission ──
    try {
      const pgDoc = await PG.findById(Number(pg_id)).select("owner_id title").lean();
      if (pgDoc) {
        const [owner, student] = await Promise.all([
          User.findById(pgDoc.owner_id).select("phone").lean(),
          User.findById(student_id).select("full_name").lean(),
        ]);
        if (owner && student && owner.phone) {
          notifyOwnerKYCSubmitted(owner.phone, {
            bookingId: booking_id,
            studentName: student.full_name,
            pgTitle: pgDoc.title,
          }).catch(err => console.error("[WhatsApp] KYC notify error:", err.message));
        }
      }
    } catch (waErr) { console.error("[WhatsApp] Hook error:", waErr.message); }

  } catch (error) {
    console.error("Enrollment Submission Error:", error);
    res.status(500).json({ success: false, message: "Failed to submit enrollment form." });
  }
};

export const getEnrollmentForOwner = async (req, res) => {
  try {
    const owner_id = req.user.id;
    const { bookingId } = req.params;

    const form = await Enrollment.aggregate([
      { $match: { booking_id: Number(bookingId) } },
      {
        $lookup: {
          from: "pgs",
          localField: "pg_id",
          foreignField: "_id",
          as: "p",
        },
      },
      { $unwind: "$p" },
      { $match: { "p.owner_id": Number(owner_id) } },
      {
        $lookup: {
          from: "users",
          localField: "student_id",
          foreignField: "_id",
          as: "u",
        },
      },
      { $unwind: "$u" },
      {
        $lookup: {
          from: "student_profiles",
          localField: "student_id",
          foreignField: "user_id",
          as: "sp",
        },
      },
      { $unwind: { path: "$sp", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          pg_title: "$p.title",
          pg_address: "$p.address",
          is_public: { $ifNull: ["$sp.is_public", 1] },
          student_full_name: "$u.full_name",
          student_phone: "$u.phone",
        },
      },
      { $project: { p: 0, u: 0, sp: 0 } },
    ]);

    if (form.length === 0) {
      return res.status(404).json({ success: false, message: "Enrollment form not found." });
    }

    const row = decryptEnrollmentObject(serialize(form[0]));
    const isPublic = Boolean(row.is_public ?? 1);

    if (!isPublic) {
      // Return privacy-masked details
      return res.status(200).json({
        success: true,
        is_public: false,
        enrollment: {
          id: row.id,
          booking_id: row.booking_id,
          student_id: row.student_id,
          student_name: row.student_full_name || "Private Tenant",
          student_email: "🔒 Private",
          student_phone: "🔒 Private",
          pg_title: row.pg_title,
          status: row.status,
          created_at: row.created_at,
          is_private: true,
          occupation: "🔒 Private",
          college_name: "🔒 Private",
          workplace_name: "🔒 Private",
          home_address: "🔒 Confidential (Private Profile)",
          parent_1_name: "🔒 Confidential",
          parent_1_phone: "🔒 Confidential",
          guardian_email: "🔒 Private",
          aadhar_number: null,
        }
      });
    }

    res.status(200).json({
      success: true,
      is_public: true,
      enrollment: { ...row, aadhar_number: maskAadhar(row.aadhar_number) },
    });
  } catch (error) {
    console.error("Fetch Enrollment Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch enrollment form." });
  }
};

// @route   GET /api/enrollments/owner-list
// @desc    Get all KYC forms for PGs owned by the logged-in user
// @access  Private (Owner)
export const getOwnerEnrollments = async (req, res) => {
  try {
    const owner_id = req.user.id;

    const enrollments = await Enrollment.aggregate([
      {
        $lookup: {
          from: "pgs",
          localField: "pg_id",
          foreignField: "_id",
          as: "p",
        },
      },
      { $unwind: "$p" },
      { $match: { "p.owner_id": Number(owner_id) } },
      {
        $lookup: {
          from: "users",
          localField: "student_id",
          foreignField: "_id",
          as: "u",
        },
      },
      { $unwind: "$u" },
      {
        $lookup: {
          from: "student_profiles",
          localField: "student_id",
          foreignField: "user_id",
          as: "sp",
        },
      },
      { $unwind: { path: "$sp", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          student_name: { $ifNull: ["$u.full_name", "Unknown Student"] },
          student_email: "$u.email",
          student_phone: "$u.phone",
          pg_title: { $ifNull: ["$p.title", "Unknown Property"] },
          is_public: { $ifNull: ["$sp.is_public", 1] },
        },
      },
      { $sort: { created_at: -1 } },
      { $project: { p: 0, u: 0, sp: 0 } },
    ]);

    // Apply privacy masking if tenant marked profile as private
    const sanitized = serialize(enrollments).map(raw => {
      const e = decryptEnrollmentObject(raw);
      const isPublic = Boolean(e.is_public ?? 1);
      if (!isPublic) {
        return {
          ...e,
          is_private: true,
          home_address: "🔒 Private",
          hometown: "🔒 Private",
          pincode: "🔒 Private",
          parent_1_name: "🔒 Private",
          parent_1_phone: "🔒 Private",
          parent_2_name: "🔒 Private",
          parent_2_phone: "🔒 Private",
          guardian_name: "🔒 Private",
          guardian_phone: "🔒 Private",
          guardian_email: "🔒 Private",
          medical_details: "🔒 Private",
          allergies: "🔒 Private",
          aadhar_number: null,
          aadhar_front: null,
          aadhar_back: null,
          college_id_image: null,
        };
      }
      return {
        ...e,
        is_private: false,
        aadhar_number: maskAadhar(e.aadhar_number),
      };
    });

    res.status(200).json({ success: true, enrollments: sanitized });
  } catch (error) {
    console.error("Fetch Owner Enrollments Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch tenant registrations." });
  }
};

export const updateEnrollmentStatus = async (req, res) => {
  try {
    const owner_id = req.user.id;
    const { enrollment_id, status, rejection_note } = req.body; // status should be 'verified' or 'rejected'

    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'verified' or 'rejected'.",
      });
    }

    const note = String(rejection_note || "").trim();

    // A rejection must always carry a reason so the student knows what to fix.
    if (status === "rejected" && !note) {
      return res.status(400).json({
        success: false,
        message: "Please provide a reason for rejecting this tenant.",
      });
    }

    // 1. Ensure the logged-in owner actually owns the PG associated with this form
    const enrollment = await Enrollment.findById(Number(enrollment_id))
      .select("pg_id")
      .lean();

    let authorized = false;
    if (enrollment) {
      const pg = await PG.findOne({
        _id: enrollment.pg_id,
        owner_id: Number(owner_id),
      })
        .select("_id")
        .lean();
      authorized = !!pg;
    }

    if (!authorized) {
      return res.status(403).json({ success: false, message: "Unauthorized to update this form." });
    }

    // 2. Update the status in the enrollment_forms table
    const update =
      status === "rejected"
        ? { status, rejection_note: note, rejected_at: new Date() }
        : { status, rejection_note: null, rejected_at: null };

    await Enrollment.updateOne({ _id: Number(enrollment_id) }, update);

    res.status(200).json({ success: true, message: `Tenant status successfully updated to ${status}.` });
  } catch (error) {
    console.error("Update Status Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update tenant status." });
  }
};

// @route   GET /api/enrollments/mine
// @desc    The logged-in student's own KYC status and rejection reason
// @access  Private (Student)
export const getMyEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({ student_id: Number(req.user.id) })
      .sort({ updated_at: -1, _id: -1 })
      .select("_id booking_id pg_id status rejection_note rejected_at resubmitted_at created_at updated_at")
      .lean();

    return res.status(200).json({
      success: true,
      enrollment: enrollment ? serialize(enrollment) : null,
    });
  } catch (error) {
    console.error("Fetch My Enrollment Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch your KYC status." });
  }
};
