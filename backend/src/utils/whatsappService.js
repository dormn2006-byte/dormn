import WhatsappLog from "../schemas/whatsappLogSchema.js";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

// ══════════════════════════════════════════════════════════
// WhatsApp Cloud API Service for Dormn PG Platform
// Sends instant WhatsApp alerts to PG owners & students
// with built-in deduplication via whatsapp_logs DB table
// ══════════════════════════════════════════════════════════

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || "https://graph.facebook.com/v21.0";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

// Format phone number to international format (India +91)
const formatPhone = (phone) => {
  if (!phone) return null;
  let cleaned = String(phone).replace(/[\s\-\(\)]/g, "");
  if (cleaned.startsWith("+")) cleaned = cleaned.substring(1);
  if (cleaned.startsWith("91") && cleaned.length === 12) return cleaned;
  if (cleaned.length === 10) return `91${cleaned}`;
  return cleaned;
};

// ─── Core: Send a WhatsApp text message ───
const sendWhatsAppMessage = async (phone, messageText) => {
  const formattedPhone = formatPhone(phone);
  if (!formattedPhone || !PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    console.log("[WhatsApp] Skipped — missing config or phone:", { phone: formattedPhone, hasConfig: !!(PHONE_NUMBER_ID && ACCESS_TOKEN) });
    return false;
  }

  try {
    const response = await fetch(`${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "text",
        text: { body: messageText },
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`[WhatsApp] ✅ Message sent to ${formattedPhone}`);
      return true;
    } else {
      console.error(`[WhatsApp] ❌ Failed to send to ${formattedPhone}:`, data?.error?.message || data);
      return false;
    }
  } catch (error) {
    console.error("[WhatsApp] Network Error:", error.message);
    return false;
  }
};

// ─── Deduplication: Check if this event was already sent ───
const isDuplicate = async (eventType, eventRefId, recipientPhone) => {
  try {
    const existing = await WhatsappLog.findOne({
      event_type: eventType,
      event_ref_id: String(eventRefId),
      recipient_phone: formatPhone(recipientPhone),
    })
      .select("_id")
      .lean();

    return Boolean(existing);
  } catch (err) {
    // Collection might not exist yet — treat as not duplicate
    console.error("[WhatsApp] Dedup check error:", err.message);
    return false;
  }
};

// ─── Log a sent message for deduplication ───
const logSentMessage = async (eventType, eventRefId, recipientPhone, status = "sent") => {
  try {
    // Mirrors the old `INSERT IGNORE`: only writes when the (event_type,
    // event_ref_id, recipient_phone) unique key doesn't already exist.
    await WhatsappLog.updateOne(
      {
        event_type: eventType,
        event_ref_id: String(eventRefId),
        recipient_phone: formatPhone(recipientPhone),
      },
      {
        $setOnInsert: {
          message_status: status,
          sent_at: new Date(),
        },
      },
      { upsert: true }
    );
  } catch (err) {
    console.error("[WhatsApp] Log error:", err.message);
  }
};

// ─── Send with deduplication wrapper ───
const sendWithDedup = async (eventType, eventRefId, phone, messageText) => {
  // Check for duplicate
  if (await isDuplicate(eventType, eventRefId, phone)) {
    console.log(`[WhatsApp] ⏭️ Skipped duplicate: ${eventType}/${eventRefId} → ${phone}`);
    return false;
  }

  const success = await sendWhatsAppMessage(phone, messageText);
  await logSentMessage(eventType, eventRefId, phone, success ? "sent" : "failed");
  return success;
};

// ══════════════════════════════════════════════════════════
// PUBLIC API — Call these from your controllers
// ══════════════════════════════════════════════════════════

/**
 * Notify PG Owner: New booking request received
 */
export const notifyOwnerNewBooking = async (ownerPhone, { bookingId, studentName, studentPhone, pgTitle, roomType, price }) => {
  const message = `🏠 *New Booking Request!*

📋 *Booking ID:* BK-${bookingId}
👤 *Student:* ${studentName || "N/A"}
📞 *Phone:* ${studentPhone || "N/A"}
🏢 *PG:* ${pgTitle || "Your PG"}
🛏️ *Room Type:* ${roomType || "Not specified"}
💰 *Price:* ₹${price || "N/A"}/month

👉 Login to your Dormn dashboard to *Approve* or *Reject*.
🔗 https://dormn.com/owner/bookings`;

  return sendWithDedup("booking_new", bookingId, ownerPhone, message);
};

/**
 * Notify Student: Booking status changed (approved/rejected)
 */
export const notifyStudentBookingStatus = async (studentPhone, { bookingId, status, pgTitle, ownerName }) => {
  const statusEmoji = status === "approved" ? "✅" : status === "rejected" ? "❌" : "📋";
  const statusText = status.charAt(0).toUpperCase() + status.slice(1);

  const message = `${statusEmoji} *Booking ${statusText}!*

📋 *Booking ID:* BK-${bookingId}
🏢 *PG:* ${pgTitle || "N/A"}
👤 *Owner:* ${ownerName || "PG Owner"}

${status === "approved"
    ? "🎉 Congratulations! Your booking has been approved. Please proceed with payment and KYC registration on your Dormn dashboard."
    : status === "rejected"
    ? "We're sorry, the PG owner has declined this request. You can explore other PGs on Dormn."
    : `Your booking status has been updated to: ${statusText}.`
  }

🔗 https://dormn.com/my-bookings`;

  return sendWithDedup("booking_status", `${bookingId}_${status}`, studentPhone, message);
};

/**
 * Notify PG Owner: Payment received from student
 */
export const notifyOwnerPaymentReceived = async (ownerPhone, { bookingId, studentName, pgTitle, amount, paymentId }) => {
  const message = `💳 *Payment Received!*

💰 *Amount:* ₹${amount}
👤 *Paid by:* ${studentName || "Student"}
🏢 *PG:* ${pgTitle || "Your PG"}
🔖 *Payment ID:* ${paymentId || "N/A"}

The student's booking has been automatically approved.

🔗 https://dormn.com/owner/payments`;

  return sendWithDedup("payment_received", bookingId, ownerPhone, message);
};

/**
 * Notify PG Owner: New KYC / Registration form submitted
 */
export const notifyOwnerKYCSubmitted = async (ownerPhone, { bookingId, studentName, pgTitle }) => {
  const message = `📋 *New Tenant Registration!*

👤 *Student:* ${studentName || "N/A"}
🏢 *PG:* ${pgTitle || "Your PG"}

The tenant has submitted their KYC registration form. Please review and verify on your Dormn dashboard.

🔗 https://dormn.com/owner/kyc-forms`;

  return sendWithDedup("kyc_submitted", bookingId, ownerPhone, message);
};

/**
 * Notify PG Owner: Maintenance request filed by student
 */
export const notifyOwnerMaintenanceRequest = async (ownerPhone, { requestId, studentName, studentPhone, pgTitle, category, location, description }) => {
  const message = `🔧 *Maintenance Request Filed!*

🏢 *PG:* ${pgTitle || "Your PG"}
👤 *Resident:* ${studentName || "N/A"}
📞 *Phone:* ${studentPhone || "N/A"}
📂 *Category:* ${category || "General"}
📍 *Location:* ${location || "N/A"}
📝 *Issue:* ${description || "No description provided"}

Please respond via your Dormn dashboard.

🔗 https://dormn.com/owner/requests`;

  return sendWithDedup("maintenance_request", requestId, ownerPhone, message);
};

export default {
  notifyOwnerNewBooking,
  notifyStudentBookingStatus,
  notifyOwnerPaymentReceived,
  notifyOwnerKYCSubmitted,
  notifyOwnerMaintenanceRequest,
};
