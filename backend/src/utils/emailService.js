import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

let cachedTransporter = null;

const getTransporter = () => {
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (!user || !pass) return null;

  if (!cachedTransporter) {
    const isService = Boolean(process.env.SMTP_SERVICE);
    const host = process.env.SMTP_HOST || (isService ? undefined : "smtp.gmail.com");
    const port = parseInt(process.env.SMTP_PORT || (isService ? "465" : "587"), 10);
    const secure = process.env.SMTP_SECURE !== undefined 
      ? process.env.SMTP_SECURE === "true" 
      : port === 465;

    const transportOptions = isService
      ? {
          service: process.env.SMTP_SERVICE,
          auth: { user, pass },
          pool: true,
          maxConnections: 3,
          maxMessages: 100,
        }
      : {
          host,
          port,
          secure,
          auth: { user, pass },
          pool: true,
          maxConnections: 3,
          maxMessages: 100,
          tls: {
            rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== "false",
          },
          connectionTimeout: 10000,
          greetingTimeout: 5000,
          socketTimeout: 15000,
        };

    cachedTransporter = nodemailer.createTransport(transportOptions);
  }
  return cachedTransporter;
};

/** Verify SMTP configuration and connection */
export const verifyEmailService = async () => {
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (!user || !pass) {
    return {
      configured: false,
      message: "SMTP is not configured in .env (Missing SMTP_USER and/or SMTP_PASS).",
    };
  }

  try {
    const transporter = getTransporter();
    await transporter.verify();
    return {
      configured: true,
      verified: true,
      user,
      message: `SMTP connection established successfully with ${user}`,
    };
  } catch (error) {
    return {
      configured: true,
      verified: false,
      user,
      error: error.message,
      code: error.code,
    };
  }
};

/** Unified responsive email layout template */
const wrapEmail = (title, innerHtml, badge = "DORMN SECURITY") => `
  <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:560px;margin:auto;padding:28px;color:#1f2937;background:#ffffff;border-radius:20px;border:1px solid #e5e7eb;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
    <div style="margin-bottom:18px;">
      <span style="background:#0D3A1D;color:#93B733;font-size:11px;font-weight:800;padding:5px 12px;border-radius:8px;text-transform:uppercase;letter-spacing:1px;">${badge}</span>
    </div>
    <h2 style="color:#0D3A1D;margin:10px 0;font-size:20px;font-weight:800;">${title}</h2>
    ${innerHtml}
    <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0;" />
    <p style="font-size:11px;color:#9ca3af;margin:0;">© ${new Date().getFullYear()} Dormn Platform. All rights reserved. • <a href="mailto:info@dormn.com" style="color:#0D3A1D;font-weight:bold;text-decoration:none;">info@dormn.com</a></p>
  </div>
`;

/** Base email dispatcher */
export const sendEmail = async (to, subject, html) => {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.warn(`[EmailService] ⚠️ SMTP not configured in .env (skipping send to ${to}). Set SMTP_USER and SMTP_PASS in backend/.env to send real emails.`);
      return false;
    }
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const from = process.env.SMTP_FROM || `"Dormn" <${user}>`;

    // Generate plain-text version to maximize anti-spam reputation score
    const plainText = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text: plainText,
      html,
      headers: {
        "X-Entity-Ref-ID": `dormn-${Date.now()}`,
        "X-Mailer": "Dormn-Mailer-v2",
      },
    });
    console.log(`[EmailService] ✅ Email sent to ${to} (${info.messageId})`);
    return true;
  } catch (error) {
    console.error("[EmailService] ❌ Email Error:", error.message);
    return false;
  }
};

/** Generic OTP Card Builder */
const buildOtpCard = (otp, expiryText = "5 minutes") => `
  <div style="background:#f9fafb;border:1.5px dashed #93B733;border-radius:14px;padding:18px;margin:20px 0;text-align:center;">
    <div style="font-size:34px;font-weight:900;letter-spacing:8px;color:#0D3A1D;font-family:monospace;">${otp}</div>
    <p style="font-size:12px;color:#6b7280;margin:6px 0 0 0;">Valid for ${expiryText}. Do not share this code with anyone.</p>
  </div>
`;

/** 1. Login OTP Email */
export const sendOTPEmail = async (to, otp) => {
  console.log(`[AUTH-DEV] 🔑 Login OTP for ${to}: ${otp}`);
  const html = wrapEmail(
    "Dormn Verification",
    `<p style="font-size:14px;color:#4b5563;">Your one-time login verification password (OTP) is:</p>${buildOtpCard(otp, "5 minutes")}`,
    "DORMN AUTH"
  );
  return sendEmail(to, `${otp} is your Dormn Verification Code`, html);
};

/** 1b. Account Email Verification OTP (Valid for 10 minutes) */
export const sendEmailVerificationOTP = async (to, otp, name) => {
  console.log(`[AUTH-DEV] 🔑 Email Verification OTP for ${to}: ${otp} (Valid for 10 minutes)`);
  const html = wrapEmail(
    "Verify Your Email Address",
    `<p style="font-size:14px;color:#374151;">Hi <strong>${name || "there"}</strong>,</p>
     <p style="font-size:14px;color:#4b5563;">Thank you for registering with Dormn. Please verify your email address to unlock room booking, visit scheduling, and event pass reservations.</p>
     ${buildOtpCard(otp, "10 minutes")}
     <p style="font-size:13px;color:#6b7280;">This OTP is valid for <strong>10 minutes</strong>. After 10 minutes, it will expire and cannot be used. If you did not request this, you can safely disregard this email.</p>`,
    "EMAIL VERIFICATION"
  );
  return sendEmail(to, `${otp} is your Dormn Email Verification Code`, html);
};

/** 2. Password Reset Code Email */
export const sendPasswordResetEmail = async (to, otp, name) => {
  console.log(`[AUTH-DEV] 🔐 Password Reset OTP for ${to}: ${otp}`);
  const html = wrapEmail(
    "Password Reset Request",
    `<p style="font-size:14px;color:#374151;">Hi <strong>${name || "there"}</strong>,</p>
     <p style="font-size:14px;color:#4b5563;">We received a request to reset your password. Use the verification code below:</p>
     ${buildOtpCard(otp, "10 minutes")}
     <p style="font-size:13px;color:#6b7280;">If you did not request this, please ignore this email or reach out to support.</p>`,
    "ACCOUNT RECOVERY"
  );
  return sendEmail(to, `${otp} is your Dormn Password Reset Code`, html);
};

/** 3. Password Changed Confirmation Alert */
export const sendPasswordChangedAlert = async (to, name) => {
  const time = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const html = wrapEmail(
    "Password Changed Successfully",
    `<p style="font-size:14px;color:#374151;">Hi <strong>${name || "there"}</strong>,</p>
     <p style="font-size:14px;color:#4b5563;">The password for your account (<strong>${to}</strong>) was successfully updated on <strong>${time} IST</strong>.</p>
     <p style="font-size:13px;color:#6b7280;">If you did not make this change, please contact us immediately.</p>`,
    "SECURITY NOTICE"
  );
  return sendEmail(to, "🔒 Your Dormn Password Has Been Changed", html);
};

/** 4. New Login Alert */
export const sendLoginAlert = async (to, name) => {
  const time = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const html = wrapEmail(
    "New Login Detected",
    `<p style="font-size:14px;color:#374151;">Hi <strong>${name || "there"}</strong>,</p>
     <p style="font-size:14px;color:#4b5563;">We detected a successful login to your Dormn account on <strong>${time} IST</strong>.</p>
     <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:14px;margin:16px 0;font-size:13px;color:#4b5563;">
       <p style="margin:0 0 6px 0;"><strong>Account:</strong> ${to}</p>
       <p style="margin:0;"><strong>Time:</strong> ${time}</p>
     </div>
     <p style="font-size:13px;color:#6b7280;">If this was you, no action is needed. If unexpected, contact <a href="mailto:info@dormn.com" style="color:#0D3A1D;font-weight:bold;">info@dormn.com</a>.</p>`,
    "DORMN SECURITY"
  );
  return sendEmail(to, "🔐 Security Alert: New Login to your Dormn Account", html);
};

/** 5. Welcome Email */
export const sendWelcomeEmail = async (to, name, role) => {
  const isOwner = role === "owner";
  const inner = isOwner
    ? `<p style="font-size:14px;color:#374151;">Welcome to the partner network! Connect your property with verified students across colleges.</p>
       <h3 style="color:#0D3A1D;font-size:14px;margin:16px 0 8px 0;">Getting Started:</h3>
       <ul style="font-size:13px;color:#4b5563;line-height:1.6;padding-left:20px;margin:0;">
         <li>Complete and publish your property listing.</li>
         <li>Manage student booking requests directly.</li>
         <li>Chat with residents in your PG Community Lounge.</li>
       </ul>`
    : `<p style="font-size:14px;color:#374151;">Welcome to Dormn! Finding verified PGs and hostels near your college is now fast and easy.</p>
       <h3 style="color:#0D3A1D;font-size:14px;margin:16px 0 8px 0;">What you can do:</h3>
       <ul style="font-size:13px;color:#4b5563;line-height:1.6;padding-left:20px;margin:0;">
         <li>Explore thousands of verified student rooms.</li>
         <li>Save favorites to compare amenities and pricing.</li>
         <li>Join your PG Community Chat once booked.</li>
       </ul>`;

  const html = wrapEmail(
    `Welcome to Dormn, ${name || "there"}!`,
    inner,
    isOwner ? "PARTNER WELCOME" : "STUDENT WELCOME"
  );
  return sendEmail(to, isOwner ? "Welcome to the Dormn Partner Community!" : "Welcome to Dormn – Find Your Next Home", html);
};

/** 6. Booking Request Alert to PG Owner */
export const sendBookingRequestToOwnerEmail = async (to, ownerName, { bookingId, studentName, studentPhone, pgTitle, roomType, price }) => {
  const html = wrapEmail(
    "New Booking Request Received!",
    `<p style="font-size:14px;color:#374151;">Hi <strong>${ownerName || "PG Owner"}</strong>,</p>
     <p style="font-size:14px;color:#4b5563;">You have received a new booking request for your property:</p>
     <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:16px 0;font-size:13px;color:#374151;line-height:1.7;">
       <p style="margin:0 0 6px 0;"><strong>Booking ID:</strong> #BK-${bookingId}</p>
       <p style="margin:0 0 6px 0;"><strong>Property:</strong> ${pgTitle || "Your PG"}</p>
       <p style="margin:0 0 6px 0;"><strong>Student Name:</strong> ${studentName || "N/A"}</p>
       <p style="margin:0 0 6px 0;"><strong>Student Contact:</strong> ${studentPhone || "N/A"}</p>
       <p style="margin:0 0 6px 0;"><strong>Room Type:</strong> ${roomType || "Standard"}</p>
       <p style="margin:0;"><strong>Agreed Rent:</strong> ₹${price || "N/A"}/month</p>
     </div>
     <p style="font-size:13px;color:#6b7280;">Please sign in to your Dormn owner dashboard to review and approve or decline this application.</p>`,
    "NEW BOOKING"
  );
  return sendEmail(to, `🏠 New Booking Request for ${pgTitle || "Your PG"} (#BK-${bookingId})`, html);
};

/** 7. Booking Status Update to Student (Approved / Rejected) */
export const sendBookingStatusToStudentEmail = async (to, studentName, { bookingId, status, pgTitle, ownerName }) => {
  const isApproved = status === "approved";
  const badge = isApproved ? "BOOKING APPROVED" : "BOOKING UPDATE";
  const title = isApproved ? "Your Booking Has Been Approved! 🎉" : `Booking Application ${status.toUpperCase()}`;

  const html = wrapEmail(
    title,
    `<p style="font-size:14px;color:#374151;">Hi <strong>${studentName || "Student"}</strong>,</p>
     <p style="font-size:14px;color:#4b5563;">
       ${isApproved 
         ? `Great news! The owner of <strong>${pgTitle || "your selected PG"}</strong> has approved your booking application.` 
         : `Your booking application for <strong>${pgTitle || "your selected PG"}</strong> has been updated to: <strong>${status}</strong>.`}
     </p>
     <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:16px 0;font-size:13px;color:#374151;line-height:1.7;">
       <p style="margin:0 0 6px 0;"><strong>Booking ID:</strong> #BK-${bookingId}</p>
       <p style="margin:0 0 6px 0;"><strong>PG Property:</strong> ${pgTitle || "N/A"}</p>
       <p style="margin:0 0 6px 0;"><strong>Owner:</strong> ${ownerName || "PG Owner"}</p>
       <p style="margin:0;"><strong>Current Status:</strong> <span style="font-weight:bold;color:${isApproved ? '#0D3A1D' : '#dc2626'};">${status.toUpperCase()}</span></p>
     </div>
     ${isApproved 
       ? `<p style="font-size:13px;color:#4b5563;">Please log in to your Dormn account, complete rent payment, and submit your tenant KYC to finalize your move-in.</p>` 
       : `<p style="font-size:13px;color:#6b7280;">You can explore other verified student accommodations anytime on Dormn.</p>`}`,
    badge
  );
  return sendEmail(to, `${isApproved ? "✅ Approved" : "📋 Update"}: Booking #BK-${bookingId} at ${pgTitle || "Dormn"}`, html);
};

/** 8. Payment Receipt to Student */
export const sendPaymentReceiptToStudentEmail = async (to, studentName, { bookingId, pgTitle, amount, paymentId }) => {
  const html = wrapEmail(
    "Rent Payment Receipt",
    `<p style="font-size:14px;color:#374151;">Hi <strong>${studentName || "Student"}</strong>,</p>
     <p style="font-size:14px;color:#4b5563;">Thank you! We have successfully received your payment for your stay at <strong>${pgTitle || "your PG"}</strong>.</p>
     <div style="background:#f9fafb;border:1.5px solid #93B733;border-radius:12px;padding:18px;margin:18px 0;font-size:13px;color:#374151;line-height:1.7;">
       <p style="margin:0 0 6px 0;font-size:18px;font-weight:900;color:#0D3A1D;">Amount Paid: ₹${amount}</p>
       <p style="margin:0 0 6px 0;"><strong>Booking ID:</strong> #BK-${bookingId}</p>
       <p style="margin:0 0 6px 0;"><strong>Accommodation:</strong> ${pgTitle || "N/A"}</p>
       <p style="margin:0;"><strong>Razorpay Payment ID:</strong> ${paymentId || "N/A"}</p>
     </div>
     <p style="font-size:13px;color:#6b7280;">Your booking is now confirmed. You can view your payment history and submit resident KYC forms in your Dormn portal.</p>`,
    "PAYMENT RECEIPT"
  );
  return sendEmail(to, `🧾 Payment Receipt: ₹${amount} for ${pgTitle || "Dormn"}`, html);
};

/** 9. Payment Received Alert to Owner */
export const sendPaymentAlertToOwnerEmail = async (to, ownerName, { bookingId, studentName, pgTitle, amount, paymentId }) => {
  const html = wrapEmail(
    "Rent Payment Received!",
    `<p style="font-size:14px;color:#374151;">Hi <strong>${ownerName || "PG Owner"}</strong>,</p>
     <p style="font-size:14px;color:#4b5563;">A resident rent payment has been successfully completed for <strong>${pgTitle || "your property"}</strong>.</p>
     <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:16px 0;font-size:13px;color:#374151;line-height:1.7;">
       <p style="margin:0 0 6px 0;font-size:16px;font-weight:bold;color:#0D3A1D;">Amount Received: ₹${amount}</p>
       <p style="margin:0 0 6px 0;"><strong>Resident:</strong> ${studentName || "Student"}</p>
       <p style="margin:0 0 6px 0;"><strong>Booking ID:</strong> #BK-${bookingId}</p>
       <p style="margin:0 0 6px 0;"><strong>Property:</strong> ${pgTitle || "Your PG"}</p>
       <p style="margin:0;"><strong>Transaction ID:</strong> ${paymentId || "N/A"}</p>
     </div>
     <p style="font-size:13px;color:#6b7280;">This resident's spot is secured. You can view detailed payment statements in your Owner Financials tab.</p>`,
    "PAYMENT RECEIVED"
  );
  return sendEmail(to, `💰 Payment Received: ₹${amount} from ${studentName || "Resident"} for ${pgTitle || "Your PG"}`, html);
};

/** 10. Owner Subscription Receipt */
export const sendSubscriptionReceiptToOwnerEmail = async (to, ownerName, { planName, billingCycle, amount, paymentId, expiresAt, maxListings }) => {
  const formattedExpiry = expiresAt ? new Date(expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '30 days';
  const html = wrapEmail(
    "Dormn Partner Plan Activated! 🎉",
    `<p style="font-size:14px;color:#374151;">Hi <strong>${ownerName || "Partner"}</strong>,</p>
     <p style="font-size:14px;color:#4b5563;">Your <strong>${planName ? planName.toUpperCase() : "PARTNER"}</strong> subscription plan is now active.</p>
     <div style="background:#f9fafb;border:1.5px solid #93B733;border-radius:12px;padding:18px;margin:18px 0;font-size:13px;color:#374151;line-height:1.7;">
       <p style="margin:0 0 6px 0;font-size:18px;font-weight:900;color:#0D3A1D;">Amount Paid: ₹${amount}</p>
       <p style="margin:0 0 6px 0;"><strong>Plan Tier:</strong> ${planName?.toUpperCase()} (${billingCycle || 'monthly'})</p>
       <p style="margin:0 0 6px 0;"><strong>Max PG Listings:</strong> ${maxListings || 1} Property Listing(s)</p>
       <p style="margin:0 0 6px 0;"><strong>Active Until:</strong> ${formattedExpiry}</p>
       <p style="margin:0;"><strong>Transaction ID:</strong> ${paymentId || "N/A"}</p>
     </div>
     <p style="font-size:13px;color:#4b5563;">Your property listings are now published and visible to thousands of verified students across Dormn.</p>`,
    "SUBSCRIPTION ACTIVATED"
  );
  return sendEmail(to, `🌟 Subscription Activated: ${planName?.toUpperCase()} Tier on Dormn`, html);
};

/** 11. Stay Cancellation Request Alert to Owner */
export const sendStayCancellationAlertToOwnerEmail = async (to, ownerName, { bookingId, studentName, studentPhone, pgTitle, reason }) => {
  const html = wrapEmail(
    "Resident Move-Out / Cancellation Request",
    `<p style="font-size:14px;color:#374151;">Hi <strong>${ownerName || "PG Owner"}</strong>,</p>
     <p style="font-size:14px;color:#4b5563;">A resident has requested to cancel their stay / checkout from <strong>${pgTitle || "your property"}</strong>:</p>
     <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:16px 0;font-size:13px;color:#374151;line-height:1.7;">
       <p style="margin:0 0 6px 0;"><strong>Booking ID:</strong> #BK-${bookingId}</p>
       <p style="margin:0 0 6px 0;"><strong>Resident:</strong> ${studentName || "Resident"}</p>
       <p style="margin:0 0 6px 0;"><strong>Contact:</strong> ${studentPhone || "N/A"}</p>
       <p style="margin:0 0 6px 0;"><strong>Property:</strong> ${pgTitle || "Your PG"}</p>
       <p style="margin:0;"><strong>Reason:</strong> ${reason || "Not specified"}</p>
     </div>
     <p style="font-size:13px;color:#6b7280;">Please sign in to your owner dashboard to review and approve or decline this cancellation request.</p>`,
    "CANCELLATION REQUEST"
  );
  return sendEmail(to, `📋 Move-Out Request: ${studentName || "Resident"} at ${pgTitle || "Your PG"} (#BK-${bookingId})`, html);
};

/** 12. Stay Cancellation Status to Student */
export const sendStayCancellationStatusToStudentEmail = async (to, studentName, { bookingId, action, pgTitle, ownerName }) => {
  const isApproved = action === 'approve';
  const html = wrapEmail(
    isApproved ? "Stay Cancellation Approved" : "Stay Cancellation Declined",
    `<p style="font-size:14px;color:#374151;">Hi <strong>${studentName || "Resident"}</strong>,</p>
     <p style="font-size:14px;color:#4b5563;">
       ${isApproved 
         ? `The PG owner has approved your move-out / cancellation request for <strong>${pgTitle || "your accommodation"}</strong>. Your checkout is confirmed and you are now free to book another stay.` 
         : `Your stay cancellation request for <strong>${pgTitle || "your accommodation"}</strong> was reviewed and declined by the PG owner.`}
     </p>
     <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:16px 0;font-size:13px;color:#374151;line-height:1.7;">
       <p style="margin:0 0 6px 0;"><strong>Booking ID:</strong> #BK-${bookingId}</p>
       <p style="margin:0 0 6px 0;"><strong>Property:</strong> ${pgTitle || "N/A"}</p>
       <p style="margin:0 0 6px 0;"><strong>Owner:</strong> ${ownerName || "PG Owner"}</p>
       <p style="margin:0;"><strong>Status:</strong> <span style="font-weight:bold;color:${isApproved ? '#0D3A1D' : '#dc2626'};">${isApproved ? 'APPROVED / CHECKED OUT' : 'DECLINED'}</span></p>
     </div>`,
    isApproved ? "CHECKOUT CONFIRMED" : "CANCELLATION UPDATE"
  );
  return sendEmail(to, `${isApproved ? '✅ Checkout Confirmed' : '📋 Update'}: Cancellation Request #BK-${bookingId}`, html);
};

/** 13. Maintenance Alert to PG Owner */
export const sendMaintenanceAlertToOwnerEmail = async (to, ownerName, { requestId, studentName, studentPhone, pgTitle, category, location, title, description }) => {
  const html = wrapEmail(
    "New Maintenance Request Filed",
    `<p style="font-size:14px;color:#374151;">Hi <strong>${ownerName || "PG Owner"}</strong>,</p>
     <p style="font-size:14px;color:#4b5563;">A resident has submitted a new maintenance ticket for <strong>${pgTitle || "your PG"}</strong>:</p>
     <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:16px 0;font-size:13px;color:#374151;line-height:1.7;">
       <p style="margin:0 0 6px 0;"><strong>Ticket ID:</strong> #MT-${requestId}</p>
       <p style="margin:0 0 6px 0;"><strong>Issue Title:</strong> ${title || "Maintenance issue"}</p>
       <p style="margin:0 0 6px 0;"><strong>Category:</strong> ${category || "General"}</p>
       <p style="margin:0 0 6px 0;"><strong>Location:</strong> ${location || "Resident Room"}</p>
       <p style="margin:0 0 6px 0;"><strong>Resident:</strong> ${studentName || "Resident"} (${studentPhone || "N/A"})</p>
       <p style="margin:0;"><strong>Description:</strong> ${description || "No further details provided"}</p>
     </div>
     <p style="font-size:13px;color:#6b7280;">Log in to your Dormn owner portal to assign staff or mark this ticket in progress.</p>`,
    "MAINTENANCE TICKET"
  );
  return sendEmail(to, `🔧 Maintenance Request: ${title || "Issue"} at ${pgTitle || "Your PG"} (#MT-${requestId})`, html);
};

/** 14. Maintenance Status Update to Student */
export const sendMaintenanceUpdateToStudentEmail = async (to, studentName, { requestId, status, pgTitle, resolutionNote }) => {
  const isResolved = status === 'resolved' || status === 'closed';
  const label = isResolved ? "Resolved & Completed" : status === 'in_progress' ? "In Progress / Assigned" : status;
  const html = wrapEmail(
    `Maintenance Issue ${isResolved ? 'Resolved' : 'Updated'}`,
    `<p style="font-size:14px;color:#374151;">Hi <strong>${studentName || "Resident"}</strong>,</p>
     <p style="font-size:14px;color:#4b5563;">Your maintenance ticket for <strong>${pgTitle || "your PG"}</strong> has been updated:</p>
     <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:16px 0;font-size:13px;color:#374151;line-height:1.7;">
       <p style="margin:0 0 6px 0;"><strong>Ticket ID:</strong> #MT-${requestId}</p>
       <p style="margin:0 0 6px 0;"><strong>Current Status:</strong> <span style="font-weight:bold;color:${isResolved ? '#0D3A1D' : '#d97706'};">${label.toUpperCase()}</span></p>
       <p style="margin:0;"><strong>Owner Note:</strong> ${resolutionNote || (isResolved ? 'Issue has been completed by staff.' : 'Technician assigned and working on issue.')}</p>
     </div>`,
    isResolved ? "ISSUE RESOLVED" : "TICKET UPDATE"
  );
  return sendEmail(to, `🔧 Maintenance Update: Ticket #MT-${requestId} (${label})`, html);
};