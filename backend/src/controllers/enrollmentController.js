import Enrollment from "../schemas/enrollmentSchema.js";
import PG from "../schemas/pgSchema.js";

export const submitEnrollment = async (req, res) => {
  try {
    const student_id = req.user.id;

    const {
      booking_id, pg_id, dob, homeAddress, hometown, pincode,
      parent1Name, parent1Relation, parent1Phone, parent2Name, parent2Relation, parent2Phone,
      guardianName, guardianRelation, guardianPhone,
      foodPreference, bloodGroup, allergies, medicalDetails,
      occupation, workplaceName, designation,
      collegeName, admissionYear, collegeIdNumber, courseName, courseYear,
      interests, suggestions,
    } = req.body;

    const formData = {
      booking_id, student_id, pg_id, dob, home_address: homeAddress, hometown, pincode,
      parent_1_name: parent1Name, parent_1_relation: parent1Relation, parent_1_phone: parent1Phone,
      parent_2_name: parent2Name, parent_2_relation: parent2Relation, parent_2_phone: parent2Phone,
      guardian_name: guardianName, guardian_relation: guardianRelation, guardian_phone: guardianPhone,
      food_preference: foodPreference, blood_group: bloodGroup, allergies, medical_details: medicalDetails,
      occupation, workplace_name: workplaceName, designation,
      college_name: collegeName, admission_year: admissionYear, college_id_number: collegeIdNumber,
      course_name: courseName, course_year: courseYear, interests, suggestions,
    };

    const existing = await Enrollment.findOne({ booking_id });

    if (existing) {
      await Enrollment.findOneAndUpdate({ booking_id }, formData);
      return res.status(200).json({ success: true, message: "Registration Form Updated Successfully!" });
    }

    await Enrollment.create(formData);
    res.status(201).json({ success: true, message: "Registration Form Submitted Successfully!" });
  } catch (error) {
    console.error("Enrollment Submission Error:", error);
    res.status(500).json({ success: false, message: "Failed to submit enrollment form." });
  }
};

export const getEnrollmentForOwner = async (req, res) => {
  try {
    const owner_id = req.user.id;
    const { bookingId } = req.params;

    const form = await Enrollment.findOne({ booking_id: bookingId })
      .populate({ path: "pg_id", select: "title address owner_id" })
      .lean();

    if (!form || form.pg_id?.owner_id?.toString() !== owner_id.toString()) {
      return res.status(404).json({ success: false, message: "Enrollment form not found." });
    }

    res.status(200).json({
      success: true,
      enrollment: {
        ...form,
        pg_title: form.pg_id?.title,
        pg_address: form.pg_id?.address,
        pg_id: form.pg_id?._id || form.pg_id,
      },
    });
  } catch (error) {
    console.error("Fetch Enrollment Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch enrollment form." });
  }
};

// Get all KYC forms for PGs owned by the logged-in user
export const getOwnerEnrollments = async (req, res) => {
  try {
    const owner_id = req.user.id;

    // Find all PG IDs owned by this user
    const ownerPGs = await PG.find({ owner_id }).select("_id").lean();
    const pgIds = ownerPGs.map((p) => p._id);

    const enrollments = await Enrollment.find({ pg_id: { $in: pgIds } })
      .sort({ created_at: -1 })
      .populate("student_id", "full_name email")
      .populate("pg_id", "title")
      .lean();

    const formatted = enrollments.map((e) => ({
      ...e,
      id: e._id,
      student_name: e.student_id?.full_name || "Unknown Student",
      student_email: e.student_id?.email || "",
      pg_title: e.pg_id?.title || "Unknown Property",
      student_id: e.student_id?._id || e.student_id,
      pg_id: e.pg_id?._id || e.pg_id,
    }));

    res.status(200).json({ success: true, enrollments: formatted });
  } catch (error) {
    console.error("Fetch Owner Enrollments Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch tenant registrations." });
  }
};

export const updateEnrollmentStatus = async (req, res) => {
  try {
    const owner_id = req.user.id;
    const { enrollment_id, status } = req.body;

    // Ensure the logged-in owner actually owns the PG associated with this form
    const enrollment = await Enrollment.findById(enrollment_id)
      .populate({ path: "pg_id", select: "owner_id" })
      .lean();

    if (!enrollment || enrollment.pg_id?.owner_id?.toString() !== owner_id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized to update this form." });
    }

    await Enrollment.findByIdAndUpdate(enrollment_id, { status });

    res.status(200).json({ success: true, message: `Tenant status successfully updated to ${status}.` });
  } catch (error) {
    console.error("Update Status Error:", error);
    res.status(500).json({ success: false, message: "Failed to update tenant status." });
  }
};