import Razorpay from "razorpay";
import dotenv from "dotenv";
import crypto from "crypto";
import Coupon from "../schemas/couponSchema.js";
import Booking from "../schemas/bookingSchema.js";
import Payment from "../schemas/paymentSchema.js";
import User from "../schemas/userSchema.js";
import PG from "../schemas/pgSchema.js";
import { notifyOwnerPaymentReceived } from "../utils/whatsappService.js";
import { sendPaymentReceiptToStudentEmail, sendPaymentAlertToOwnerEmail } from "../utils/emailService.js";
import { postWelcomeMessageForBooking } from "./pgChatController.js";
import { pauseOtherBookings } from "../models/bookingModel.js";

dotenv.config({ quiet: true });

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Coupon codes are stored uppercase; MySQL's default collation made the old
// lookups case-insensitive, so normalize input to keep that behaviour.
const normalizeCouponCode = (code) => String(code ?? "").toUpperCase();

// ==========================================
// 1. API: APPLY COUPON (For Frontend Preview)
// ==========================================
export const applyCoupon = async (req, res) => {
  try {
    const { code, original_amount } = req.body;

    // 1. Find the coupon
    const coupon = await Coupon.findOne({
      code: normalizeCouponCode(code),
      is_active: true,
    }).lean();

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Invalid or inactive coupon code." });
    }

    // 2. Security Checks
    if (new Date(coupon.expiry_date) < new Date()) {
      return res.status(400).json({ success: false, message: "This coupon has expired." });
    }
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return res.status(400).json({ success: false, message: "This coupon usage limit has been reached." });
    }
    if (Number(original_amount) < Number(coupon.min_booking_amount)) {
      return res.status(400).json({ success: false, message: `Requires a minimum booking of ₹${coupon.min_booking_amount}.` });
    }

    // 3. Calculate Discount
    let discount = 0;
    if (coupon.discount_type === 'flat') {
      discount = Number(coupon.discount_value);
    } else if (coupon.discount_type === 'percentage') {
      discount = (Number(original_amount) * Number(coupon.discount_value)) / 100;
      if (coupon.max_discount_amount && discount > Number(coupon.max_discount_amount)) {
        discount = Number(coupon.max_discount_amount);
      }
    }

    let final_amount = Number(original_amount) - discount;

    // 🚨 RAZORPAY RULE: Amount can never be less than ₹1.00
    if (final_amount < 1) {
      final_amount = 1.00;
    }

    res.status(200).json({
      success: true,
      discount_applied: discount,
      final_amount: final_amount,
      message: "Coupon applied successfully!"
    });

  } catch (error) {
    console.error("Apply Coupon Error:", error);
    res.status(500).json({ success: false, message: "Failed to apply coupon." });
  }
};

// ==========================================
// 2. API: CREATE SECURE ORDER (Updated)
// ==========================================
export const createOrder = async (req, res) => {
  try {
    const { pg_id, owner_id, amount_in_rupees, coupon_code, booking_id } = req.body;
    const user_id = req.user.id;
    let final_amount = Number(amount_in_rupees);

    // If frontend sends a coupon, backend MUST re-verify it securely
    if (coupon_code) {
      const coupon = await Coupon.findOne({
        code: normalizeCouponCode(coupon_code),
        is_active: true,
      }).lean();

      if (coupon) {
        // Ensure it's valid
        if (new Date(coupon.expiry_date) >= new Date() && (!coupon.usage_limit || coupon.used_count < coupon.usage_limit)) {

          let discount = 0;
          if (coupon.discount_type === 'flat') discount = Number(coupon.discount_value);
          else if (coupon.discount_type === 'percentage') discount = (final_amount * Number(coupon.discount_value)) / 100;

          final_amount = final_amount - discount;

          // Force minimum ₹1.00
          if (final_amount < 1) final_amount = 1.00;
        }
      }
    }

    // Convert to Paise (Razorpay requirement)
    // Math.round prevents decimal errors like 100.0000001
    const amount_in_paise = Math.round(final_amount * 100);

    const options = {
      amount: amount_in_paise,
      currency: "INR",
      receipt: `receipt_pg_${pg_id}_user_${user_id}`
    };

    const order = await razorpayInstance.orders.create(options);

    // ── Link to Existing Booking or Create if None Exists ──
    let finalBookingId = booking_id ? Number(booking_id) : null;

    if (finalBookingId) {
      // Validate booking belongs to user
      const existingBooking = await Booking.findOne({
        _id: finalBookingId,
        student_id: Number(user_id),
      })
        .select("_id pg_id owner_id")
        .lean();

      if (!existingBooking) {
        return res.status(404).json({ success: false, message: "Booking record not found or unauthorized." });
      }
    } else {
      // Check if there is an existing pending or approved booking for this user and PG
      const existingBooking = await Booking.findOne({
        student_id: Number(user_id),
        pg_id: Number(pg_id),
        status: { $ne: "cancelled" },
      })
        .sort({ _id: -1 })
        .select("_id")
        .lean();

      if (existingBooking) {
        finalBookingId = existingBooking._id;
      } else {
        const booking = await Booking.create({
          student_id: Number(user_id),
          pg_id: Number(pg_id),
          owner_id: Number(owner_id),
          status: "pending",
          payment_status: "pending",
        });
        finalBookingId = booking._id;
      }
    }

    await Payment.create({
      booking_id: finalBookingId,
      user_id: Number(user_id),
      pg_id: Number(pg_id),
      owner_id: Number(owner_id),
      razorpay_order_id: order.id,
      amount: final_amount,
      status: "created",
    });

    res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      booking_id: finalBookingId,
      key_id: process.env.RAZORPAY_KEY_ID,
    });

  } catch (error) {
    console.error("Razorpay Create Order Error:", error);
    res.status(500).json({ success: false, message: "Failed to initialize payment" });
  }
};
export const verifyPayment = async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_id } = req.body;
      const targetBookingId = booking_id || req.body.bookingId;
      const userId = req.user.id;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ success: false, message: "Missing required payment verification parameters" });
      }

      // 1. Verify that this payment record exists and belongs to the logged-in student
      const payRecord = await Payment.findOne({ razorpay_order_id })
        .select("_id booking_id user_id")
        .lean();

      if (!payRecord || (Number(payRecord.user_id) !== Number(userId) && req.user.role !== "superadmin")) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized. Payment record does not match your authenticated account.",
        });
      }

      const verifiedBookingId = Number(targetBookingId) || payRecord.booking_id;

      // 2. Create the expected signature using Secret Key
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

      // 3. Constant-time comparison to protect against timing attacks
      const expectedBuffer = Buffer.from(expectedSignature, "utf-8");
      const signatureBuffer = Buffer.from(razorpay_signature, "utf-8");
      const isSignatureValid = expectedBuffer.length === signatureBuffer.length &&
        crypto.timingSafeEqual(expectedBuffer, signatureBuffer);

      if (isSignatureValid) {
        // 4. Update the Payments table to 'successful'
        await Payment.updateOne(
          { razorpay_order_id },
          {
            razorpay_payment_id,
            razorpay_signature,
            status: "successful",
          }
        );

        // 5. Update the Bookings table to 'approved' and 'paid'
        await Booking.updateOne(
          { _id: verifiedBookingId },
          { status: "approved", payment_status: "paid" }
        );

        // 6. Auto-pause all other pending bookings by this student
        try {
          await pauseOtherBookings(userId, verifiedBookingId);
        } catch (pauseErr) {
          console.error("[Payment] Pause other bookings error:", pauseErr.message);
        }

        // 7. Post Auto-Welcome message from PG Owner in PG Community Chat
        try {
          await postWelcomeMessageForBooking(verifiedBookingId);
        } catch (chatErr) {
          console.error("[PG-Chat] Auto-welcome hook error:", chatErr.message);
        }

        // 8. Notifications: WhatsApp & Email to Owner + Receipt Email to Student
        try {
          const pay = await Payment.findOne({ razorpay_order_id }).lean();

          if (pay) {
            const [student, owner, pg] = await Promise.all([
              User.findById(pay.user_id).lean(),
              User.findById(pay.owner_id).lean(),
              PG.findById(pay.pg_id).lean(),
            ]);

            const payInfo = {
              amount: pay.amount,
              owner_id: pay.owner_id,
              student_name: student?.full_name,
              student_email: student?.email,
              student_phone: student?.phone,
              pg_title: pg?.title,
              owner_name: owner?.full_name,
              owner_email: owner?.email,
              owner_phone: owner?.phone,
            };

            // 1. WhatsApp to Owner
            if (payInfo.owner_phone) {
              notifyOwnerPaymentReceived(payInfo.owner_phone, {
                bookingId: verifiedBookingId,
                studentName: payInfo.student_name,
                pgTitle: payInfo.pg_title,
                amount: payInfo.amount,
                paymentId: razorpay_payment_id,
              }).catch(err => console.error("[WhatsApp] Payment notify error:", err.message));
            }

            // 2. Email Alert to Owner
            if (payInfo.owner_email) {
              sendPaymentAlertToOwnerEmail(payInfo.owner_email, payInfo.owner_name, {
                bookingId: verifiedBookingId,
                studentName: payInfo.student_name,
                pgTitle: payInfo.pg_title,
                amount: payInfo.amount,
                paymentId: razorpay_payment_id,
              }).catch(err => console.error("[EmailService] Owner payment alert error:", err.message));
            }

            // 3. Email Receipt to Student
            if (payInfo.student_email) {
              sendPaymentReceiptToStudentEmail(payInfo.student_email, payInfo.student_name, {
                bookingId: verifiedBookingId,
                pgTitle: payInfo.pg_title,
                amount: payInfo.amount,
                paymentId: razorpay_payment_id,
              }).catch(err => console.error("[EmailService] Student receipt email error:", err.message));
            }
          }
        } catch (notifErr) { console.error("[Payment] Notification hook error:", notifErr.message); }

        res.status(200).json({ success: true, message: "Payment verified successfully!" });
      } else {
        // Signatures didn't match (Someone tried to fake a payment!)
        await Payment.updateOne(
          { razorpay_order_id },
          { status: "failed" }
        );
        res.status(400).json({ success: false, message: "Payment verification failed. Invalid signature." });
      }
    } catch (error) {
      console.error("Payment Verification Error:", error);
      res.status(500).json({ success: false, message: "Internal server error during verification." });
    }
  };
