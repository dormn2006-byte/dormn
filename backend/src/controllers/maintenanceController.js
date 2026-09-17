import pool from "../config/db.js";
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
    const [bookingCheck] = await pool.execute(
      `SELECT id FROM bookings 
       WHERE student_id = ? AND pg_id = ? AND status != 'cancelled'
       LIMIT 1`,
      [student_id, pg_id]
    );

    if (bookingCheck.length === 0 && req.user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "You can only submit maintenance requests for PGs where you have an active booking or residence.",
      });
    }

    const [result] = await pool.execute(
      `INSERT INTO maintenance_requests (pg_id, student_id, category, location, title, description, priority)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [pg_id, student_id, category || "General", location || null, title, description || null, priority || "Normal"]
    );

    // ── Notifications: Notify PG Owner of new maintenance request (WhatsApp & Email) ──
    try {
      const [info] = await pool.execute(
        `SELECT o.full_name AS owner_name, o.email AS owner_email, o.phone AS owner_phone, 
                u.full_name AS student_name, u.phone AS student_phone, p.title AS pg_title
         FROM pgs p
         JOIN users o ON p.owner_id = o.id
         JOIN users u ON u.id = ?
         WHERE p.id = ?`,
        [student_id, pg_id]
      );
      if (info.length > 0) {
        const row = info[0];
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
    const [authCheck] = await pool.execute(
      `SELECT mr.id, mr.student_id, mr.title, p.title AS pg_title, u.full_name AS student_name, u.email AS student_email
       FROM maintenance_requests mr
       JOIN pgs p ON mr.pg_id = p.id
       JOIN users u ON mr.student_id = u.id
       WHERE mr.id = ? AND p.owner_id = ?`,
      [id, owner_id]
    );

    if (authCheck.length === 0) {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    await pool.execute(
      `UPDATE maintenance_requests SET status = ?, resolution_note = COALESCE(?, resolution_note) WHERE id = ?`,
      [status, resolution_note || null, id]
    );

    // Email: Notify Student of maintenance status update
    try {
      const student = authCheck[0];
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

    const [requests] = await pool.execute(
      `SELECT mr.*, u.full_name AS student_name, u.phone AS student_phone, u.email AS student_email, p.title AS pg_title
       FROM maintenance_requests mr
       JOIN users u ON mr.student_id = u.id
       JOIN pgs p ON mr.pg_id = p.id
       WHERE p.owner_id = ?
       ORDER BY mr.created_at DESC`,
      [owner_id]
    );

    res.status(200).json({ success: true, requests });
  } catch (error) {
    console.error("Get Owner Maintenance Requests Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch maintenance requests." });
  }
};

// Get student's own maintenance requests
export const getStudentMaintenanceRequests = async (req, res) => {
  try {
    const student_id = req.user.id;

    const [requests] = await pool.execute(
      `SELECT mr.*, p.title AS pg_title
       FROM maintenance_requests mr
       JOIN pgs p ON mr.pg_id = p.id
       WHERE mr.student_id = ?
       ORDER BY mr.created_at DESC`,
      [student_id]
    );

    res.status(200).json({ success: true, requests });
  } catch (error) {
    console.error("Get Student Maintenance Requests Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch your requests." });
  }
};
