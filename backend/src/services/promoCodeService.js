// Promo-code rules shared by the checkout preview and the payment flow, so the
// two can never disagree about what a code is worth.

import Coupon from "../schemas/couponSchema.js";

// Razorpay rejects any order below ₹1.
const MIN_PAYABLE = 1;

export const normalizeCode = (code) => String(code ?? "").trim().toUpperCase();

const round2 = (value) => Math.round(value * 100) / 100;

/**
 * Discount maths only — no database access, so it is directly unit testable.
 * `discount` is what was actually taken off, which is what makes a flat
 * discount larger than the bill settle at the ₹1 floor.
 */
export const computeDiscount = (coupon, amount) => {
  const base = Math.max(Number(amount) || 0, 0);

  const raw =
    coupon.discount_type === "flat"
      ? Number(coupon.discount_value) || 0
      : (base * (Number(coupon.discount_value) || 0)) / 100;

  const cap = Number(coupon.max_discount_amount);
  const capped =
    coupon.discount_type === "percentage" && cap > 0 ? Math.min(raw, cap) : raw;

  const finalAmount = Math.max(round2(base - capped), MIN_PAYABLE);

  return { discount: round2(base - finalAmount), finalAmount };
};

/**
 * Checks a code against a specific checkout. Read-only — it does NOT claim the
 * code, so it is safe to call for a live preview.
 */
export const validatePromoCode = async ({ code, pgId, amount }) => {
  const normalized = normalizeCode(code);
  if (!normalized) {
    return { ok: false, error: "Please enter a promo code." };
  }

  const coupon = await Coupon.findOne({ code: normalized }).lean();
  if (!coupon) {
    return { ok: false, error: "That promo code doesn't exist." };
  }

  if (coupon.is_active === 0) {
    return { ok: false, error: "That promo code is no longer active." };
  }

  if (coupon.status !== "active") {
    return {
      ok: false,
      error:
        coupon.status === "used"
          ? "That promo code has already been used."
          : "That promo code is being used by another payment right now. Try again in a few minutes.",
    };
  }

  if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
    return { ok: false, error: "That promo code has expired." };
  }

  // Empty pg_ids means the owner intended it for all of their PGs.
  if (Array.isArray(coupon.pg_ids) && coupon.pg_ids.length > 0) {
    if (!pgId || !coupon.pg_ids.includes(Number(pgId))) {
      return { ok: false, error: "That promo code doesn't apply to this PG." };
    }
  }

  const minAmount = Number(coupon.min_booking_amount) || 0;
  if (Number(amount) < minAmount) {
    return {
      ok: false,
      error: `That promo code needs a minimum booking amount of ₹${minAmount}.`,
    };
  }

  const { discount, finalAmount } = computeDiscount(coupon, amount);

  return { ok: true, coupon, discount, finalAmount };
};

/**
 * Validates then claims a code for one checkout.
 *
 * The claim is a single conditional update guarded on `status: "active"`, which
 * is what stops two simultaneous checkouts from both spending a single-use
 * code. A read-then-write here would allow exactly that.
 */
export const reservePromoCode = async ({ code, pgId, amount }) => {
  const check = await validatePromoCode({ code, pgId, amount });
  if (!check.ok) return check;

  const claimed = await Coupon.findOneAndUpdate(
    { _id: check.coupon._id, status: "active" },
    { $set: { status: "reserved", reserved_at: new Date() } },
    { new: true }
  ).lean();

  if (!claimed) {
    return {
      ok: false,
      error: "That promo code was just used by someone else.",
    };
  }

  return {
    ok: true,
    coupon: claimed,
    discount: check.discount,
    finalAmount: check.finalAmount,
  };
};

/** Records which Razorpay order is holding the reservation (for diagnostics). */
export const setReservedOrder = async (couponId, orderId) => {
  if (!couponId || !orderId) return;
  await Coupon.updateOne(
    { _id: couponId, status: "reserved" },
    { $set: { reserved_order_id: orderId } }
  );
};

/** Puts a reservation back so it can be used again (failed/abandoned checkout). */
export const releasePromoCode = async (couponId) => {
  if (!couponId) return;
  await Coupon.updateOne(
    { _id: couponId, status: "reserved" },
    { $set: { status: "active", reserved_order_id: null, reserved_at: null } }
  );
};

/**
 * Marks the code spent after a verified payment. Also accepts an `active` code,
 * because a reservation may have been swept back before a slow payment landed —
 * the payment still happened, so the code must not become reusable.
 */
export const consumePromoCode = async (couponId, { userId, bookingId } = {}) => {
  if (!couponId) return;
  await Coupon.updateOne(
    { _id: couponId, status: { $in: ["reserved", "active"] } },
    {
      $set: {
        status: "used",
        used_at: new Date(),
        used_by_user_id: userId ?? null,
        used_booking_id: bookingId ?? null,
      },
    }
  );
};

/** Sweeps reservations whose checkout was never finished. */
export const releaseStaleReservations = async (maxAgeMinutes = 30) => {
  const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000);

  const result = await Coupon.updateMany(
    { status: "reserved", reserved_at: { $lt: cutoff } },
    { $set: { status: "active", reserved_order_id: null, reserved_at: null } }
  );

  return result.modifiedCount;
};

// No 0/O/1/I so codes survive being read aloud or retyped.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const generatePromoCode = (prefix = "DORMN") => {
  let suffix = "";
  for (let i = 0; i < 6; i += 1) {
    suffix += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return `${prefix}-${suffix}`;
};
