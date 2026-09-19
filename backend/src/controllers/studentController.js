import User from "../schemas/userSchema.js";
import StudentProfile from "../schemas/studentProfileSchema.js";
import Enrollment from "../schemas/enrollmentSchema.js";
import Booking from "../schemas/bookingSchema.js";
import { serialize } from "../utils/serialize.js";
import { encrypt, decryptEnrollmentObject } from "../utils/encryptionService.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const cleanDigits = (value, max) => {
  const digits = String(value || "").replace(/\D/g, "");
  return max ? digits.slice(-max) : digits;
};

const isValidEmail = (value) => EMAIL_PATTERN.test(String(value || "").trim());

// Aadhaar numbers are 12 digits and never start with 0 or 1.
const isValidAadhar = (value) => /^[2-9]\d{11}$/.test(cleanDigits(value));

const parseJSON = (v, fallback) => {
  if (!v) return fallback;
  if (typeof v === "object") return v;
  try { return JSON.parse(v); } catch { return fallback; }
};

// @route   GET /api/student/profile
// @desc    Get the current student's full profile (with registration data sync)
export const getStudentProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId)
      .select("full_name email phone gender profile_image")
      .lean();
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const profile = await StudentProfile.findOne({ user_id: userId }).lean();
    const enrollment = await Enrollment.findOne({ student_id: userId })
      .sort({ created_at: -1 })
      .lean();

    const e = decryptEnrollmentObject(enrollment || {});
    const p = decryptEnrollmentObject(profile || {});

    const fullProfile = {
      name: p.full_name || user.full_name || "",
      email: user.email || "",
      phone: p.phone || user.phone || e.guardian_phone || "",
      gender: p.gender || user.gender || "",
      dob: p.dob ? new Date(p.dob).toISOString().split("T")[0] : (e.dob ? new Date(e.dob).toISOString().split("T")[0] : ""),
      homeAddress: p.home_address || e.home_address || "",
      homeTown: p.hometown || e.hometown || "",
      pincode: p.pincode || e.pincode || "",
      
      parent1Name: p.parent_1_name || e.parent_1_name || "",
      parent1Relation: p.parent_1_relation || e.parent_1_relation || "Parent",
      parent1Phone: p.parent_1_phone || e.parent_1_phone || "",
      parent2Name: p.parent_2_name || e.parent_2_name || "",
      parent2Relation: p.parent_2_relation || e.parent_2_relation || "Parent",
      parent2Phone: p.parent_2_phone || e.parent_2_phone || "",
      guardianName: p.guardian_name || e.guardian_name || "",
      guardianRelation: p.guardian_relation || e.guardian_relation || "Local Guardian",
      guardianPhone: p.guardian_phone || e.guardian_phone || "",
      guardianEmail: p.guardian_email || e.guardian_email || "",
      aadharNumber: p.aadhar_number || e.aadhar_number || "",
      
      bloodGroup: p.blood_group || e.blood_group || "",
      allergies: p.allergies || e.allergies || "",
      medicalDetails: p.medical_details || e.medical_details || "",
      foodPreference: p.food_preference || e.food_preference || "Veg",
      
      userType: (p.occupation || e.occupation) === "Working Professional" ? "professional" : "student",
      college: p.college_name || e.college_name || "",
      courseName: p.course_name || e.course_name || "",
      courseYear: p.course_year || e.course_year || "",
      admissionYear: p.admission_year || e.admission_year || "",
      collegeIdNumber: p.college_id_number || e.college_id_number || "",
      company: p.workplace_name || e.workplace_name || "",
      designation: p.designation || e.designation || "",
      
      passportPhoto: p.passport_photo || e.passport_photo || user.profile_image || null,
      aadharFront: p.aadhar_front || e.aadhar_front || null,
      aadharBack: p.aadhar_back || e.aadhar_back || null,
      collegeIdImage: p.college_id_image || e.college_id_image || null,
      
      bio: p.bio || "",
      interests: parseJSON(p.interests, parseJSON(e.interests, [])),
      hobbies: parseJSON(p.hobbies, []),
      vibe: p.vibe || "",
      socials: parseJSON(p.socials, {}),
      suggestions: p.suggestions || e.suggestions || "",
      
      isPublic: Boolean(p.is_public ?? 1),
    };

    res.status(200).json({ success: true, profile: fullProfile });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch student profile." });
  }
};

// @route   POST /api/student/profile
// @desc    Create or update full student profile & sync with registration form
export const saveStudentProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const b = req.body || {};

    const cleanPhone = (p) => {
      if (!p) return "";
      const digits = String(p).replace(/\D/g, "");
      return digits.length > 10 ? digits.slice(-10) : digits;
    };

    const fullName = b.name || b.fullName || req.user.full_name || "";
    const phone = cleanPhone(b.phone || req.user.phone || "");
    const isPublic = b.isPublic !== undefined ? (b.isPublic ? 1 : 0) : 1;
    const occupation = b.userType === "professional" ? "Working Professional" : "Student";

    let dob = null;
    if (b.dob && typeof b.dob === "string" && b.dob.trim()) {
      const d = new Date(b.dob);
      if (!isNaN(d.getTime())) {
        dob = d.toISOString().split("T")[0];
      }
    }

    const parent1Phone = encrypt(cleanPhone(b.parent1Phone || b.parent1Contact || ""));
    const parent2Phone = encrypt(cleanPhone(b.parent2Phone || b.parent2Contact || ""));
    const guardianPhone = encrypt(cleanPhone(b.guardianPhone || ""));
    const allergies = encrypt(b.allergies || "");
    const medicalDetails = encrypt(b.medicalDetails || "");
    const collegeIdNumber = encrypt(b.collegeIdNumber || "");

    const passportPhoto = b.passportPhoto || b.photo || null;
    const aadharFront = b.aadharFront || null;
    const aadharBack = b.aadharBack || null;
    const collegeIdImage = b.collegeIdImage || null;

    // interests / hobbies / socials are stored as NATIVE values (no string serialisation).
    const sharedFields = {
      full_name: fullName,
      phone,
      gender: b.gender || "",
      dob,
      home_address: b.homeAddress || "",
      hometown: b.homeTown || b.hometown || "",
      pincode: b.pincode || "",
      parent_1_name: b.parent1Name || "",
      parent_1_relation: b.parent1Relation || "Parent",
      parent_1_phone: parent1Phone,
      parent_2_name: b.parent2Name || "",
      parent_2_relation: b.parent2Relation || "Parent",
      parent_2_phone: parent2Phone,
      guardian_name: b.guardianName || "",
      guardian_relation: b.guardianRelation || "Local Guardian",
      guardian_phone: guardianPhone,
      blood_group: b.bloodGroup || "",
      allergies,
      medical_details: medicalDetails,
      food_preference: b.foodPreference || "Veg",
      occupation,
      college_name: b.college || b.collegeName || "",
      course_name: b.courseName || "",
      course_year: b.courseYear || "",
      admission_year: b.admissionYear || "",
      college_id_number: collegeIdNumber,
      workplace_name: b.company || b.workplaceName || "",
      designation: b.designation || "",
      bio: b.bio || "",
      interests: b.interests || [],
      hobbies: b.hobbies || [],
      vibe: b.vibe || "",
      socials: b.socials || {},
      suggestions: b.suggestions || "",
      is_public: isPublic,
    };

    // Only written when actually supplied, so a save from another form never
    // blanks out an already-stored value.
    if (b.guardianEmail !== undefined) {
      sharedFields.guardian_email = b.guardianEmail || "";
    }
    if (b.aadharNumber !== undefined) {
      sharedFields.aadhar_number = encrypt(cleanDigits(b.aadharNumber));
    }

    const existing = await StudentProfile.findOne({ user_id: userId })
      .select("_id")
      .lean();

    if (existing) {
      // ON DUPLICATE KEY UPDATE: images use COALESCE(VALUES(x), x) so only overwrite
      // when a new value is supplied.
      const updateData = { ...sharedFields };
      if (passportPhoto != null) updateData.passport_photo = passportPhoto;
      if (aadharFront != null) updateData.aadhar_front = aadharFront;
      if (aadharBack != null) updateData.aadhar_back = aadharBack;
      if (collegeIdImage != null) updateData.college_id_image = collegeIdImage;

      await StudentProfile.updateOne({ user_id: userId }, updateData);
    } else {
      await StudentProfile.create({
        user_id: userId,
        ...sharedFields,
        passport_photo: passportPhoto,
        aadhar_front: aadharFront,
        aadhar_back: aadharBack,
        college_id_image: collegeIdImage || null,
      });
    }

    if (fullName && phone) {
      await User.updateOne({ _id: userId }, { full_name: fullName, phone });
    } else if (fullName) {
      await User.updateOne({ _id: userId }, { full_name: fullName });
    } else if (phone) {
      await User.updateOne({ _id: userId }, { phone });
    }

    res.status(200).json({ success: true, message: "Profile saved & synced successfully!", isPublic: Boolean(isPublic) });
  } catch (error) {
    console.error("Save Profile Error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to save student profile." });
  }
};

// @route   POST /api/student/payment-kyc
// @desc    Mandatory tenant details captured immediately before payment
export const savePaymentKyc = async (req, res) => {
  try {
    const student_id = Number(req.user.id);
    const {
      booking_id,
      name,
      email,
      phone,
      guardianName,
      guardianEmail,
      guardianPhone,
      currentAddress,
      aadharNumber,
    } = req.body || {};

    const mobile = cleanDigits(phone, 10);
    const guardianMobile = cleanDigits(guardianPhone, 10);

    // The form gate is UX only — everything is re-validated here.
    const errors = [];
    if (!booking_id) errors.push("Booking ID is required.");
    if (!String(name || "").trim()) errors.push("Name is required.");
    if (!isValidEmail(email)) errors.push("A valid email address is required.");
    if (mobile.length !== 10) errors.push("A valid 10-digit mobile number is required.");
    if (!String(guardianName || "").trim()) errors.push("Guardian name is required.");
    if (!isValidEmail(guardianEmail)) errors.push("A valid guardian email address is required.");
    if (guardianMobile.length !== 10) errors.push("A valid 10-digit guardian mobile number is required.");
    if (!String(currentAddress || "").trim()) errors.push("Current address is required.");
    if (!isValidAadhar(aadharNumber)) errors.push("A valid 12-digit Aadhar number is required.");

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors[0], errors });
    }

    const booking = await Booking.findOne({ _id: Number(booking_id), student_id })
      .select("_id pg_id")
      .lean();

    if (!booking && req.user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. This booking does not belong to your account.",
      });
    }

    const encGuardianPhone = encrypt(guardianMobile);
    const encAadhar = encrypt(cleanDigits(aadharNumber));

    const tenantDetails = {
      full_name: String(name).trim(),
      phone: mobile,
      guardian_name: String(guardianName).trim(),
      guardian_phone: encGuardianPhone,
      guardian_email: String(guardianEmail).trim(),
      home_address: String(currentAddress).trim(),
      aadhar_number: encAadhar,
    };

    // Profile-scoped record — this is what pre-fills the form next time.
    const existingProfile = await StudentProfile.findOne({ user_id: student_id })
      .select("_id")
      .lean();

    if (existingProfile) {
      await StudentProfile.updateOne({ user_id: student_id }, tenantDetails);
    } else {
      await StudentProfile.create({ user_id: student_id, ...tenantDetails });
    }

    // Booking-scoped record so the owner sees the tenant on their KYC list.
    if (booking) {
      const enrollmentDetails = {
        guardian_name: tenantDetails.guardian_name,
        guardian_phone: encGuardianPhone,
        guardian_email: tenantDetails.guardian_email,
        home_address: tenantDetails.home_address,
        aadhar_number: encAadhar,
      };

      const existingEnrollment = await Enrollment.findOne({
        booking_id: Number(booking_id),
      })
        .select("_id status")
        .lean();

      if (existingEnrollment) {
        const enrollmentUpdate = { ...enrollmentDetails };

        // Re-applying after a rejection puts the tenant back into the review
        // queue. A pending or already-verified tenant is left untouched, so a
        // routine payment save can never un-verify an accepted resident.
        if (existingEnrollment.status === "rejected") {
          enrollmentUpdate.status = "pending";
          enrollmentUpdate.rejection_note = null;
          enrollmentUpdate.rejected_at = null;
          enrollmentUpdate.resubmitted_at = new Date();
        }

        await Enrollment.updateOne(
          { _id: existingEnrollment._id },
          enrollmentUpdate
        );
      } else {
        await Enrollment.create({
          booking_id: Number(booking_id),
          student_id,
          pg_id: booking.pg_id,
          status: "pending",
          ...enrollmentDetails,
        });
      }
    }

    // Keep the account record in step (used for WhatsApp/notification contact).
    if (tenantDetails.full_name && mobile) {
      await User.updateOne(
        { _id: student_id },
        { full_name: tenantDetails.full_name, phone: mobile }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Tenant details saved successfully.",
    });
  } catch (error) {
    console.error("Save Payment KYC Error:", error);
    return res.status(500).json({ success: false, message: "Failed to save tenant details." });
  }
};

// @route   GET /api/student/public-profile/:studentId
// @desc    Get student profile for owner view (respects Public vs Private policy)
export const getStudentPublicProfile = async (req, res) => {
  try {
    const { studentId } = req.params;

    const profiles = await StudentProfile.aggregate([
      { $match: { user_id: Number(studentId) } },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "u",
        },
      },
      { $unwind: "$u" },
      {
        $addFields: {
          user_name: "$u.full_name",
          user_phone: "$u.phone",
        },
      },
      { $project: { u: 0 } },
    ]);

    if (profiles.length === 0) {
      const user = await User.findById(Number(studentId))
        .select("full_name phone")
        .lean();
      if (!user) return res.status(404).json({ success: false, message: "Student not found" });
      return res.status(200).json({ success: true, isPublic: true, student: { name: user.full_name, phone: user.phone, collegeOrWorkplace: "Not specified" } });
    }

    const p = decryptEnrollmentObject(serialize(profiles[0]));
    const isPublic = Boolean(p.is_public ?? 1);
    if (!isPublic) {
      return res.status(200).json({
        success: true,
        isPublic: false,
        message: "This profile is Private.",
        student: { name: p.full_name || p.user_name || "Private Tenant", phone: "🔒 Private", collegeOrWorkplace: "🔒 Private", isPrivate: true }
      });
    }

    const isStudent = (p.occupation || "Student").toLowerCase() === "student";
    const collegeOrWorkplace = isStudent
      ? (p.college_name ? `${p.college_name}${p.course_name ? ` (${p.course_name})` : ''}` : "Student")
      : (p.workplace_name ? `${p.workplace_name}${p.designation ? ` (${p.designation})` : ''}` : "Working Professional");

    return res.status(200).json({
      success: true,
      isPublic: true,
      student: {
        name: p.full_name || p.user_name,
        phone: p.phone || p.user_phone,
        occupation: p.occupation || (isStudent ? "Student" : "Working Professional"),
        college: p.college_name || null,
        workplace: p.workplace_name || null,
        designation: p.designation || null,
        courseName: p.course_name || null,
        collegeOrWorkplace,
        isPrivate: false
      }
    });
  } catch (error) {
    console.error("Public Profile Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch public profile." });
  }
};
