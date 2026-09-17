import pool from "../config/db.js";
import { notifyOwnerKYCSubmitted } from "../utils/whatsappService.js";
import { encrypt, decryptEnrollmentObject } from "../utils/encryptionService.js";

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
    const [bookingAuth] = await pool.execute(
      "SELECT id FROM bookings WHERE id = ? AND student_id = ?",
      [booking_id, student_id]
    );

    if (bookingAuth.length === 0 && req.user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. This booking does not belong to your account.",
      });
    }

    const [existing] = await pool.execute(
      "SELECT id FROM enrollment_forms WHERE booking_id = ?", 
      [booking_id]
    );

    const encP1Phone = parent1Phone ? encrypt(parent1Phone) : null;
    const encP2Phone = parent2Phone ? encrypt(parent2Phone) : null;
    const encGPhone = guardianPhone ? encrypt(guardianPhone) : null;
    const encCollegeId = collegeIdNumber ? encrypt(collegeIdNumber) : null;
    const encAllergies = allergies ? encrypt(allergies) : null;
    const encMedical = medicalDetails ? encrypt(medicalDetails) : null;

    if (existing.length > 0) {
      // If it exists, Update it
      await pool.execute(
        `UPDATE enrollment_forms SET 
          dob=?, home_address=?, hometown=?, pincode=?, parent_1_name=?, parent_1_relation=?, parent_1_phone=?, 
          parent_2_name=?, parent_2_relation=?, parent_2_phone=?, guardian_name=?, guardian_relation=?, guardian_phone=?, 
          food_preference=?, blood_group=?, allergies=?, medical_details=?, 
          occupation=?, workplace_name=?, designation=?, 
          college_name=?, admission_year=?, college_id_number=?, course_name=?, course_year=?, 
          passport_photo=COALESCE(?, passport_photo), aadhar_front=COALESCE(?, aadhar_front), aadhar_back=COALESCE(?, aadhar_back), college_id_image=COALESCE(?, college_id_image),
          interests=?, suggestions=?
         WHERE booking_id = ?`,
        [
          dob, homeAddress, hometown, pincode, parent1Name, parent1Relation, encP1Phone,
          parent2Name, parent2Relation, encP2Phone, guardianName, guardianRelation, encGPhone,
          foodPreference, bloodGroup, encAllergies, encMedical, 
          occupation, workplaceName, designation,
          collegeName, admissionYear, encCollegeId, courseName, courseYear,
          passportPhoto || null, aadharFront || null, aadharBack || null, collegeIdImage || null,
          typeof interests === 'object' ? JSON.stringify(interests) : interests, suggestions, booking_id
        ]
      );
    } else {
      // Otherwise, Insert new form
      await pool.execute(
        `INSERT INTO enrollment_forms 
        (booking_id, student_id, pg_id, dob, home_address, hometown, pincode, parent_1_name, parent_1_relation, parent_1_phone, parent_2_name, parent_2_relation, parent_2_phone, guardian_name, guardian_relation, guardian_phone, food_preference, blood_group, allergies, medical_details, occupation, workplace_name, designation, college_name, admission_year, college_id_number, course_name, course_year, passport_photo, aadhar_front, aadhar_back, college_id_image, interests, suggestions) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          booking_id, student_id, pg_id, dob, homeAddress, hometown, pincode, parent1Name, parent1Relation, encP1Phone,
          parent2Name, parent2Relation, encP2Phone, guardianName, guardianRelation, encGPhone,
          foodPreference, bloodGroup, encAllergies, encMedical, 
          occupation, workplaceName, designation,
          collegeName, admissionYear, encCollegeId, courseName, courseYear,
          passportPhoto || null, aadharFront || null, aadharBack || null, collegeIdImage || null,
          typeof interests === 'object' ? JSON.stringify(interests) : interests, suggestions
        ]
      );
    }

    // ── TWO-WAY SYNC: Automatically update / populate student_profiles table ──
    const pubFlag = isPublic !== undefined ? (isPublic ? 1 : 0) : 1;
    await pool.execute(
      `INSERT INTO student_profiles (
        user_id, full_name, phone, dob, home_address, hometown, pincode,
        parent_1_name, parent_1_relation, parent_1_phone,
        parent_2_name, parent_2_relation, parent_2_phone,
        guardian_name, guardian_relation, guardian_phone,
        blood_group, allergies, medical_details, food_preference,
        occupation, college_name, course_name, course_year, admission_year, college_id_number,
        workplace_name, designation,
        passport_photo, aadhar_front, aadhar_back, college_id_image,
        interests, suggestions, is_public
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        dob = VALUES(dob),
        home_address = VALUES(home_address),
        hometown = VALUES(hometown),
        pincode = VALUES(pincode),
        parent_1_name = VALUES(parent_1_name),
        parent_1_relation = VALUES(parent_1_relation),
        parent_1_phone = VALUES(parent_1_phone),
        parent_2_name = VALUES(parent_2_name),
        parent_2_relation = VALUES(parent_2_relation),
        parent_2_phone = VALUES(parent_2_phone),
        guardian_name = VALUES(guardian_name),
        guardian_relation = VALUES(guardian_relation),
        guardian_phone = VALUES(guardian_phone),
        blood_group = VALUES(blood_group),
        allergies = VALUES(allergies),
        medical_details = VALUES(medical_details),
        food_preference = VALUES(food_preference),
        occupation = VALUES(occupation),
        college_name = VALUES(college_name),
        course_name = VALUES(course_name),
        course_year = VALUES(course_year),
        admission_year = VALUES(admission_year),
        college_id_number = VALUES(college_id_number),
        workplace_name = VALUES(workplace_name),
        designation = VALUES(designation),
        passport_photo = COALESCE(VALUES(passport_photo), passport_photo),
        aadhar_front = COALESCE(VALUES(aadhar_front), aadhar_front),
        aadhar_back = COALESCE(VALUES(aadhar_back), aadhar_back),
        college_id_image = COALESCE(VALUES(college_id_image), college_id_image),
        interests = VALUES(interests),
        suggestions = VALUES(suggestions),
        is_public = COALESCE(VALUES(is_public), is_public)
      `,
      [
        student_id, req.user.full_name || "", req.user.phone || encP1Phone || "", dob || null, homeAddress, hometown, pincode,
        parent1Name, parent1Relation, encP1Phone,
        parent2Name, parent2Relation, encP2Phone,
        guardianName, guardianRelation, encGPhone,
        bloodGroup, encAllergies, encMedical, foodPreference,
        occupation, collegeName, courseName, courseYear, admissionYear, encCollegeId,
        workplaceName, designation,
        passportPhoto || null, aadharFront || null, aadharBack || null, collegeIdImage || null,
        typeof interests === 'object' ? JSON.stringify(interests) : interests, suggestions,
        pubFlag
      ]
    );

    res.status(200).json({ success: true, message: "Registration Form Submitted & Synced Successfully!" });

    // ── WhatsApp: Notify PG Owner of new KYC submission ──
    try {
      const [ownerInfo] = await pool.execute(
        `SELECT o.phone AS owner_phone, u.full_name AS student_name, p.title AS pg_title
         FROM pgs p
         JOIN users o ON p.owner_id = o.id
         JOIN users u ON u.id = ?
         WHERE p.id = ?`,
        [student_id, pg_id]
      );
      if (ownerInfo.length > 0 && ownerInfo[0].owner_phone) {
        notifyOwnerKYCSubmitted(ownerInfo[0].owner_phone, {
          bookingId: booking_id,
          studentName: ownerInfo[0].student_name,
          pgTitle: ownerInfo[0].pg_title,
        }).catch(err => console.error("[WhatsApp] KYC notify error:", err.message));
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

    const [form] = await pool.execute(
      `SELECT e.*, p.title AS pg_title, p.address AS pg_address,
              COALESCE(sp.is_public, 1) AS is_public,
              u.full_name AS student_full_name,
              u.phone AS student_phone
       FROM enrollment_forms e
       JOIN pgs p ON e.pg_id = p.id
       JOIN users u ON e.student_id = u.id
       LEFT JOIN student_profiles sp ON e.student_id = sp.user_id
       WHERE e.booking_id = ? AND p.owner_id = ?`,
      [bookingId, owner_id]
    );

    if (form.length === 0) {
      return res.status(404).json({ success: false, message: "Enrollment form not found." });
    }

    const row = decryptEnrollmentObject(form[0]);
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
        }
      });
    }

    res.status(200).json({ success: true, is_public: true, enrollment: row });
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

    const [enrollments] = await pool.execute(
      `SELECT 
        e.*, 
        COALESCE(u.full_name, 'Unknown Student') AS student_name, 
        u.email AS student_email,
        u.phone AS student_phone,
        COALESCE(p.title, 'Unknown Property') AS pg_title,
        COALESCE(sp.is_public, 1) AS is_public
       FROM enrollment_forms e
       JOIN pgs p ON e.pg_id = p.id
       JOIN users u ON e.student_id = u.id
       LEFT JOIN student_profiles sp ON e.student_id = sp.user_id
       WHERE p.owner_id = ?
       ORDER BY e.created_at DESC`,
      [owner_id]
    );

    // Apply privacy masking if tenant marked profile as private
    const sanitized = enrollments.map(raw => {
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
          medical_details: "🔒 Private",
          allergies: "🔒 Private",
          aadhar_front: null,
          aadhar_back: null,
          college_id_image: null,
        };
      }
      return {
        ...e,
        is_private: false,
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
    const { enrollment_id, status } = req.body; // status should be 'verified' or 'rejected'

    // 1. Ensure the logged-in owner actually owns the PG associated with this form
    const [authCheck] = await pool.execute(
      `SELECT p.id FROM enrollment_forms e 
       JOIN pgs p ON e.pg_id = p.id 
       WHERE e.id = ? AND p.owner_id = ?`,
      [enrollment_id, owner_id]
    );

    if (authCheck.length === 0) {
      return res.status(403).json({ success: false, message: "Unauthorized to update this form." });
    }

    // 2. Update the status in the enrollment_forms table
    await pool.execute(
      `UPDATE enrollment_forms SET status = ? WHERE id = ?`,
      [status, enrollment_id]
    );

    res.status(200).json({ success: true, message: `Tenant status successfully updated to ${status}.` });
  } catch (error) {
    console.error("Update Status Error:", error);
    res.status(500).json({ success: false, message: "Failed to update tenant status." });
  }
};
