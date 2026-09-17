import pool from "../config/db.js";
import { encrypt, decryptEnrollmentObject } from "../utils/encryptionService.js";

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
    const [users] = await pool.execute(
      "SELECT id, full_name, email, phone, gender, profile_image FROM users WHERE id = ?",
      [userId]
    );
    if (users.length === 0) return res.status(404).json({ success: false, message: "User not found" });
    const user = users[0];

    const [profiles] = await pool.execute("SELECT * FROM student_profiles WHERE user_id = ?", [userId]);
    const [enrollments] = await pool.execute("SELECT * FROM enrollment_forms WHERE student_id = ? ORDER BY created_at DESC LIMIT 1", [userId]);

    const e = decryptEnrollmentObject(enrollments[0] || {});
    const p = decryptEnrollmentObject(profiles[0] || {});

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

    await pool.execute(
      `INSERT INTO student_profiles (
        user_id, full_name, phone, gender, dob, home_address, hometown, pincode,
        parent_1_name, parent_1_relation, parent_1_phone,
        parent_2_name, parent_2_relation, parent_2_phone,
        guardian_name, guardian_relation, guardian_phone,
        blood_group, allergies, medical_details, food_preference,
        occupation, college_name, course_name, course_year, admission_year, college_id_number,
        workplace_name, designation,
        passport_photo, aadhar_front, aadhar_back, college_id_image,
        bio, interests, hobbies, vibe, socials, suggestions, is_public
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        full_name = VALUES(full_name), phone = VALUES(phone), gender = VALUES(gender), dob = VALUES(dob),
        home_address = VALUES(home_address), hometown = VALUES(hometown), pincode = VALUES(pincode),
        parent_1_name = VALUES(parent_1_name), parent_1_relation = VALUES(parent_1_relation), parent_1_phone = VALUES(parent_1_phone),
        parent_2_name = VALUES(parent_2_name), parent_2_relation = VALUES(parent_2_relation), parent_2_phone = VALUES(parent_2_phone),
        guardian_name = VALUES(guardian_name), guardian_relation = VALUES(guardian_relation), guardian_phone = VALUES(guardian_phone),
        blood_group = VALUES(blood_group), allergies = VALUES(allergies), medical_details = VALUES(medical_details), food_preference = VALUES(food_preference),
        occupation = VALUES(occupation), college_name = VALUES(college_name), course_name = VALUES(course_name), course_year = VALUES(course_year),
        admission_year = VALUES(admission_year), college_id_number = VALUES(college_id_number), workplace_name = VALUES(workplace_name), designation = VALUES(designation),
        passport_photo = COALESCE(VALUES(passport_photo), passport_photo), aadhar_front = COALESCE(VALUES(aadhar_front), aadhar_front),
        aadhar_back = COALESCE(VALUES(aadhar_back), aadhar_back), college_id_image = COALESCE(VALUES(college_id_image), college_id_image),
        bio = VALUES(bio), interests = VALUES(interests), hobbies = VALUES(hobbies), vibe = VALUES(vibe), socials = VALUES(socials), suggestions = VALUES(suggestions), is_public = VALUES(is_public)`,
      [
        userId, fullName, phone, b.gender || "", dob, b.homeAddress || "", b.homeTown || b.hometown || "", b.pincode || "",
        b.parent1Name || "", b.parent1Relation || "Parent", encrypt(cleanPhone(b.parent1Phone || b.parent1Contact || "")),
        b.parent2Name || "", b.parent2Relation || "Parent", encrypt(cleanPhone(b.parent2Phone || b.parent2Contact || "")),
        b.guardianName || "", b.guardianRelation || "Local Guardian", encrypt(cleanPhone(b.guardianPhone || "")),
        b.bloodGroup || "", encrypt(b.allergies || ""), encrypt(b.medicalDetails || ""), b.foodPreference || "Veg",
        occupation, b.college || b.collegeName || "", b.courseName || "", b.courseYear || "", b.admissionYear || "", encrypt(b.collegeIdNumber || ""),
        b.company || b.workplaceName || "", b.designation || "",
        b.passportPhoto || b.photo || null, b.aadharFront || null, b.aadharBack || null, collegeIdImage || null,
        b.bio || "", JSON.stringify(b.interests || []), JSON.stringify(b.hobbies || []), b.vibe || "", JSON.stringify(b.socials || {}), b.suggestions || "",
        isPublic
      ]
    );

    if (fullName && phone) {
      await pool.execute("UPDATE users SET full_name = ?, phone = ? WHERE id = ?", [fullName, phone, userId]);
    } else if (fullName) {
      await pool.execute("UPDATE users SET full_name = ? WHERE id = ?", [fullName, userId]);
    } else if (phone) {
      await pool.execute("UPDATE users SET phone = ? WHERE id = ?", [phone, userId]);
    }

    res.status(200).json({ success: true, message: "Profile saved & synced successfully!", isPublic: Boolean(isPublic) });
  } catch (error) {
    console.error("Save Profile Error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to save student profile." });
  }
};

// @route   GET /api/student/public-profile/:studentId
// @desc    Get student profile for owner view (respects Public vs Private policy)
export const getStudentPublicProfile = async (req, res) => {
  try {
    const { studentId } = req.params;
    const [profiles] = await pool.execute(
      `SELECT sp.*, u.full_name AS user_name, u.phone AS user_phone
       FROM student_profiles sp
       JOIN users u ON sp.user_id = u.id
       WHERE sp.user_id = ?`,
      [studentId]
    );

    if (profiles.length === 0) {
      const [users] = await pool.execute("SELECT full_name, phone FROM users WHERE id = ?", [studentId]);
      if (users.length === 0) return res.status(404).json({ success: false, message: "Student not found" });
      return res.status(200).json({ success: true, isPublic: true, student: { name: users[0].full_name, phone: users[0].phone, collegeOrWorkplace: "Not specified" } });
    }

    const p = decryptEnrollmentObject(profiles[0]);
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

