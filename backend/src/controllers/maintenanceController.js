import Booking from "../schemas/bookingSchema.js";
import PG from "../schemas/pgSchema.js";
import User from "../schemas/userSchema.js";
import MaintenanceRequest from "../schemas/maintenanceRequestSchema.js";
import { serialize, asWriteResult } from "../utils/serialize.js";
import { notifyOwnerMaintenanceRequest } from "../utils/whatsappService.js";
import { sendMaintenanceAlertToOwnerEmail, sendMaintenanceUpdateToStudentEmail } from "../utils/emailService.js";

// Create a maintenance request (Student)
export const createMaintenanceRequest = async (req, res) => {
  try {
    const student_id = req.user.id;
    const { pg_id, category, location, title, description, priority } = req.body;

    if (!pg_id || !title) {
      return res.status(400).json({ success: false, message: "PG ID and title are required." });
    }

    // Row-Level Security: Verify student has an active or approved booking/stay for this PG
    const bookingCheck = await Booking.findOne({
      student_id,
      pg_id: Number(pg_id),
      status: { $ne: "cancelled" },
    })
      .select("_id")
      .lean();

    if (!bookingCheck && req.user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "You can only submit maintenance requests for PGs where you have an active booking or residence.",
      });
    }

    const created = await MaintenanceRequest.create({
      pg_id: Number(pg_id),
      student_id,
      category: category || "General",
      location: location || null,
      title,
      description: description || null,
      priority: priority || "Normal",
    });
    const result = asWriteResult(created);

    // ── Notifications: Notify PG Owner of new maintenance request (WhatsApp & Email) ──
    try {
      const pgDoc = await PG.findById(Number(pg_id)).select("owner_id title").lean();
      if (pgDoc) {
        const [owner, student] = await Promise.all([
          User.findById(pgDoc.owner_id).select("full_name email phone").lean(),
          User.findById(student_id).select("full_name phone").lean(),
        ]);
        if (owner && student) {
          const row = {
            owner_name: owner.full_name,
            owner_email: owner.email,
            owner_phone: owner.phone,
            student_name: student.full_name,
            student_phone: student.phone,
            pg_title: pgDoc.title,
          };
          const payload = {
            requestId: result.insertId,
            studentName: row.student_name,
            studentPhone: row.student_phone,
            pgTitle: row.pg_title,
            category: category || "General",
            location: location || "Resident Room",
            title,
            description: description || title,
          };

          // 1. WhatsApp
          if (row.owner_phone) {
            notifyOwnerMaintenanceRequest(row.owner_phone, payload)
              .catch(err => console.error("[WhatsApp] Maintenance notify error:", err.message));
          }

          // 2. Email
          if (row.owner_email) {
            sendMaintenanceAlertToOwnerEmail(row.owner_email, row.owner_name, payload)
              .catch(err => console.error("[EmailService] Maintenance notify error:", err.message));
          }
        }
      }
    } catch (notifErr) { console.error("[Notification] Hook error:", notifErr.message); }

    res.status(201).json({
      success: true,
      message: "Maintenance request submitted successfully.",
      requestId: result.insertId,
    });
  } catch (error) {
    console.error("Create Maintenance Request Error:", error);
    res.status(500).json({ success: false, message: "Failed to submit maintenance request." });
  }
};

// Update maintenance request status (Owner)
export const updateMaintenanceStatus = async (req, res) => {
  try {
    const owner_id = req.user.id;
    const { id } = req.params;
    const { status, resolution_note } = req.body;

    const allowed = ["open", "in_progress", "resolved", "closed"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status." });
    }

    // Verify ownership
    const request = await MaintenanceRequest.findById(Number(id))
      .select("pg_id student_id title")
      .lean();

    let authCheck = null;
    if (request) {
      const [pg, student] = await Promise.all([
        PG.findOne({ _id: request.pg_id, owner_id: Number(owner_id) })
          .select("title")
          .lean(),
        User.findById(request.student_id).select("full_name email").lean(),
      ]);
      if (pg && student) {
        authCheck = {
          id: request._id,
          student_id: request.student_id,
          title: request.title,
          pg_title: pg.title,
          student_name: student.full_name,
          student_email: student.email,
        };
      }
    }

    if (!authCheck) {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    const note = resolution_note || null;
    const updateData = { status };
    // resolution_note = COALESCE(?, resolution_note): keep the stored note when null.
    if (note !== null) updateData.resolution_note = note;

    await MaintenanceRequest.updateOne({ _id: Number(id) }, updateData);

    // Email: Notify Student of maintenance status update
    try {
      const student = authCheck;
      if (student?.student_email) {
        sendMaintenanceUpdateToStudentEmail(student.student_email, student.student_name, {
          requestId: id,
          status,
          pgTitle: student.pg_title,
          resolutionNote: resolution_note,
        }).catch(err => console.error("[EmailService] Maintenance update error:", err.message));
      }
    } catch (emailErr) {
      console.error("[EmailService] Maintenance update hook error:", emailErr.message);
    }

    res.status(200).json({ success: true, message: `Request updated to ${status}.` });
  } catch (error) {
    console.error("Update Maintenance Status Error:", error);
    res.status(500).json({ success: false, message: "Failed to update request." });
  }
};

// Get all maintenance requests for owner's PGs
export const getOwnerMaintenanceRequests = async (req, res) => {
  try {
    const owner_id = req.user.id;

    const requests = await MaintenanceRequest.aggregate([
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
        $addFields: {
          student_name: "$u.full_name",
          student_phone: "$u.phone",
          student_email: "$u.email",
          pg_title: "$p.title",
        },
      },
      { $sort: { created_at: -1 } },
      { $project: { p: 0, u: 0 } },
    ]);

    res.status(200).json({ success: true, requests: serialize(requests) });
  } catch (error) {
    console.error("Get Owner Maintenance Requests Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch maintenance requests." });
  }
};

// Get student's own maintenance requests
export const getStudentMaintenanceRequests = async (req, res) => {
  try {
    const student_id = req.user.id;

    const requests = await MaintenanceRequest.aggregate([
      { $match: { student_id: Number(student_id) } },
      {
        $lookup: {
          from: "pgs",
          localField: "pg_id",
          foreignField: "_id",
          as: "p",
        },
      },
      { $unwind: "$p" },
      { $addFields: { pg_title: "$p.title" } },
      { $sort: { created_at: -1 } },
      { $project: { p: 0 } },
    ]);

    res.status(200).json({ success: true, requests: serialize(requests) });
  } catch (error) {
    console.error("Get Student Maintenance Requests Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch your requests." });
  }
};
