import Razorpay from "razorpay";
import Booking from "../schemas/bookingSchema.js";
import Payment from "../schemas/paymentSchema.js";
import Coupon from "../schemas/couponSchema.js";
import crypto from "crypto";

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ==========================================
// 1. API: APPLY COUPON (For Frontend Preview)
// ==========================================
export const applyCoupon = async (req, res) => {
  try {
    const { code, original_amount } = req.body;

    const coupon = await Coupon.findOne({ code, is_active: true }).lean();

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Invalid or inactive coupon code." });
    }

    // Security Checks
    if (new Date(coupon.expiry_date) < new Date()) {
      return res.status(400).json({ success: false, message: "This coupon has expired." });
    }
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return res.status(400).json({ success: false, message: "This coupon usage limit has been reached." });
    }
    if (Number(original_amount) < Number(coupon.min_booking_amount)) {
      return res.status(400).json({ success: false, message: `Requires a minimum booking of ₹${coupon.min_booking_amount}.` });
    }

    // Calculate Discount
    let discount = 0;
    if (coupon.discount_type === "flat") {
      discount = Number(coupon.discount_value);
    } else if (coupon.discount_type === "percentage") {
      discount = (Number(original_amount) * Number(coupon.discount_value)) / 100;
      if (coupon.max_discount_amount && discount > Number(coupon.max_discount_amount)) {
        discount = Number(coupon.max_discount_amount);
      }
    }

    let final_amount = Number(original_amount) - discount;
    if (final_amount < 1) final_amount = 1.00;

    res.status(200).json({
      success: true,
      discount_applied: discount,
      final_amount,
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
  try {
    const { pg_id, owner_id, amount_in_rupees, coupon_code } = req.body;
    const user_id = req.user.id;
    let final_amount = Number(amount_in_rupees);

    // If frontend sends a coupon, backend MUST re-verify it securely
    if (coupon_code) {
      const coupon = await Coupon.findOne({ code: coupon_code, is_active: true }).lean();

      if (coupon) {
        if (new Date(coupon.expiry_date) >= new Date() && (!coupon.usage_limit || coupon.used_count < coupon.usage_limit)) {
          let discount = 0;
          if (coupon.discount_type === "flat") discount = Number(coupon.discount_value);
          else if (coupon.discount_type === "percentage") discount = (final_amount * Number(coupon.discount_value)) / 100;

          final_amount = final_amount - discount;
          if (final_amount < 1) final_amount = 1.00;
        }
      }
    }

    const amount_in_paise = Math.round(final_amount * 100);

    const options = {
      amount: amount_in_paise,
      currency: "INR",
      receipt: `receipt_pg_${pg_id}_user_${user_id}`,
    };

    const order = await razorpayInstance.orders.create(options);

    const booking = await Booking.create({
      student_id: user_id,
      pg_id,
      owner_id,
      status: "pending",
      payment_status: "pending",
    });

    await Payment.create({
      booking_id: booking._id,
      user_id,
      pg_id,
      owner_id,
      razorpay_order_id: order.id,
      amount: final_amount,
      status: "created",
    });

    res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      booking_id: booking._id,
    });
  } catch (error) {
    console.error("Razorpay Create Order Error:", error);
    res.status(500).json({ success: false, message: "Failed to initialize payment" });
  }
};
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_id } = req.body;

    // 1. Create the expected signature using your Secret Key
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    // 2. Compare signatures to prevent fraud/tampering
    if (expectedSignature === razorpay_signature) {
      // 3. Update the Payment to 'successful'
      await Payment.findOneAndUpdate(
        { razorpay_order_id },
        { razorpay_payment_id, razorpay_signature, status: "successful" }
      );

      // 4. Update the Booking to 'approved' and 'paid'
      await Booking.findByIdAndUpdate(booking_id, {
        status: "approved",
        payment_status: "paid",
      });

      res.status(200).json({ success: true, message: "Payment verified successfully!" });
    } else {
      // Signatures didn't match
      await Payment.findOneAndUpdate(
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