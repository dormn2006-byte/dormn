import Razorpay from "razorpay";
import dotenv from "dotenv";
import crypto from "crypto";
import Booking from "../schemas/bookingSchema.js";
import Payment from "../schemas/paymentSchema.js";
import User from "../schemas/userSchema.js";
import PG from "../schemas/pgSchema.js";
import {
  consumePromoCode,
  releasePromoCode,
  reservePromoCode,
  setReservedOrder,
  validatePromoCode,
} from "../services/promoCodeService.js";
import { notifyOwnerPaymentReceived } from "../utils/whatsappService.js";
import { sendPaymentReceiptToStudentEmail, sendPaymentAlertToOwnerEmail } from "../utils/emailService.js";
import { postWelcomeMessageForBooking } from "./pgChatController.js";
import { pauseOtherBookings } from "../models/bookingModel.js";
import { createSettlementForPayment } from "../services/settlementService.js";
import { clampMonths } from "../services/feeService.js";

dotenv.config({ quiet: true });

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ==========================================
// 1. API: APPLY COUPON (For Frontend Preview)
// ==========================================
// Preview only — it computes a discount but never claims the code. The
// authoritative figure is recomputed when the order is created.
export const applyCoupon = async (req, res) => {
  try {
    const { code, original_amount, pg_id } = req.body;

    const result = await validatePromoCode({
      code,
      pgId: pg_id,
      amount: Number(original_amount),
    });

    if (!result.ok) {
      return res.status(400).json({ success: false, message: result.error });
    }

    return res.status(200).json({
      success: true,
      discount_applied: result.discount,
      final_amount: result.finalAmount,
      message: "Coupon applied successfully!",
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
  const { pg_id, owner_id, amount_in_rupees, coupon_code, booking_id } = req.body;
  const user_id = req.user.id;

  // Tracked so a failure after claiming can hand the code back.
  let reservedCouponId = null;

  try {
    // ── 1. Resolve the booking BEFORE charging, so the amount comes from our
    //       own records rather than a number the browser chose. ──
    let booking = null;

    if (booking_id) {
      booking = await Booking.findOne({
        _id: Number(booking_id),
        student_id: Number(user_id),
      })
        .select("_id pg_id owner_id booked_price")
        .lean();

      if (!booking) {
        return res.status(404).json({ success: false, message: "Booking record not found or unauthorized." });
      }
    } else {
      booking = await Booking.findOne({
        student_id: Number(user_id),
        pg_id: Number(pg_id),
        status: { $ne: "cancelled" },
      })
        .sort({ _id: -1 })
        .select("_id pg_id owner_id booked_price")
        .lean();

      if (!booking) {
        const created = await Booking.create({
          student_id: Number(user_id),
          pg_id: Number(pg_id),
          owner_id: Number(owner_id),
          status: "pending",
          payment_status: "pending",
        });

        booking = {
          _id: created._id,
          pg_id: Number(pg_id),
          owner_id: Number(owner_id),
          booked_price: null,
        };
      }
    }

    const finalBookingId = booking._id;
    // The booking is the source of truth for who is being paid and where.
    const resolvedPgId = Number(booking.pg_id);
    const resolvedOwnerId = Number(booking.owner_id);

    const baseAmount =
      Number(booking.booked_price) > 0 ? Number(booking.booked_price) : Number(amount_in_rupees);

    if (!Number.isFinite(baseAmount) || baseAmount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid payment amount." });
    }

    // ── 2. Claim the promo code before creating the order. Claiming here (not
    //       at verification) is what prevents a single-use code being spent
    //       twice — by verify time the money is already captured. ──
    let finalAmount = baseAmount;
    let discountAmount = 0;
    let appliedCode = null;

    if (coupon_code) {
      const reservation = await reservePromoCode({
        code: coupon_code,
        pgId: resolvedPgId,
        amount: baseAmount,
      });

      if (!reservation.ok) {
        return res.status(400).json({ success: false, message: reservation.error });
      }

      reservedCouponId = reservation.coupon._id;
      finalAmount = reservation.finalAmount;
      discountAmount = reservation.discount;
      appliedCode = reservation.coupon.code;
    }

    // ── 3. Create the Razorpay order (amount in paise) ──
    const order = await razorpayInstance.orders.create({
      amount: Math.round(finalAmount * 100),
      currency: "INR",
      receipt: `receipt_pg_${resolvedPgId}_user_${user_id}`,
    });

    if (reservedCouponId) {
      await setReservedOrder(reservedCouponId, order.id);
    }

    await Payment.create({
      booking_id: finalBookingId,
      user_id: Number(user_id),
      pg_id: resolvedPgId,
      owner_id: resolvedOwnerId,
      razorpay_order_id: order.id,
      amount: finalAmount,
      original_amount: baseAmount,
      discount_amount: discountAmount,
      coupon_id: reservedCouponId,
      coupon_code: appliedCode,
      status: "created",
    });

    return res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      booking_id: finalBookingId,
      original_amount: baseAmount,
      discount_applied: discountAmount,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    // Never burn a claimed code because the order failed to initialise.
    if (reservedCouponId) {
      await releasePromoCode(reservedCouponId).catch(() => {});
    }

    console.error("Razorpay Create Order Error:", error);
    return res.status(500).json({ success: false, message: "Failed to initialize payment" });
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
        .select("_id booking_id user_id coupon_id status")
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

        // 5. Advance the booking's stay. Rent is paid month by month, so a
        //    multi-month booking stays in the student's dues until the agreed
        //    number of months have been settled. Skipped on a replayed verify so
        //    a retry can't count the same month twice.
        if (payRecord.status !== "successful") {
          const bookingDoc = await Booking.findById(verifiedBookingId)
            .select("duration_months months_paid")
            .lean();

          const totalMonths = clampMonths(bookingDoc?.duration_months || 1);
          const monthsPaid = Number(bookingDoc?.months_paid || 0) + 1;
          const fullyPaid = monthsPaid >= totalMonths;

          await Booking.updateOne(
            { _id: verifiedBookingId },
            {
              status: "approved",
              payment_status: fullyPaid ? "paid" : "pending",
              months_paid: monthsPaid,
            }
          );

          // 5a. Payroll: deduct the company fee and queue the owner's payout.
          //     Never allowed to fail the verification — the money is already in.
          createSettlementForPayment(payRecord._id).catch((err) =>
            console.error("[Settlement] create error:", err.message)
          );
        }

        // 5b. The promo code is now spent for good.
        if (payRecord.coupon_id) {
          await consumePromoCode(payRecord.coupon_id, {
            userId,
            bookingId: verifiedBookingId,
          }).catch((promoErr) =>
            console.error("[Payment] Promo consume error:", promoErr.message)
          );
        }

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

        // Hand the claimed promo code back — no money changed hands.
        if (payRecord.coupon_id) {
          await releasePromoCode(payRecord.coupon_id).catch((promoErr) =>
            console.error("[Payment] Promo release error:", promoErr.message)
          );
        }

        res.status(400).json({ success: false, message: "Payment verification failed. Invalid signature." });
      }
    } catch (error) {
      console.error("Payment Verification Error:", error);
      res.status(500).json({ success: false, message: "Internal server error during verification." });
    }
  };
