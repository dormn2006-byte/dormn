import Coupon from "../schemas/couponSchema.js";
import PG from "../schemas/pgSchema.js";
import { serialize } from "../utils/serialize.js";
import {
  generatePromoCode,
  normalizeCode,
  validatePromoCode as checkPromoCode,
} from "../services/promoCodeService.js";

const MAX_CODE_LENGTH = 32;
const DEFAULT_VALIDITY_DAYS = 30;

const parseId = (value) => {
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : null;
};

/** What the owner's dashboard shows: active | reserved | used | expired. */
const displayStatus = (coupon) => {
  if (coupon.status === "used") return "used";
  if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) return "expired";
  return coupon.status;
};

const defaultExpiry = () =>
  new Date(Date.now() + DEFAULT_VALIDITY_DAYS * 24 * 60 * 60 * 1000);

/** Shared field parsing for create + edit. Returns `{ ok, error, values }`. */
const parseDiscountFields = (body) => {
  const type = body.discount_type === "percentage" ? "percentage" : "flat";
  const value = Number(body.discount_value);

  if (!Number.isFinite(value) || value <= 0) {
    return { ok: false, error: "Enter a discount value greater than 0." };
  }

  if (type === "percentage" && value > 100) {
    return { ok: false, error: "A percentage discount cannot exceed 100%." };
  }

  const minBooking = Number(body.min_booking_amount);
  const maxDiscount = Number(body.max_discount_amount);

  const expires = body.expiry_date ? new Date(body.expiry_date) : defaultExpiry();
  if (Number.isNaN(expires.getTime())) {
    return { ok: false, error: "That expiry date is not valid." };
  }
  if (expires <= new Date()) {
    return { ok: false, error: "The expiry date must be in the future." };
  }

  return {
    ok: true,
    values: {
      discount_type: type,
      discount_value: value,
      min_booking_amount: Number.isFinite(minBooking) && minBooking > 0 ? minBooking : 0,
      max_discount_amount:
        type === "percentage" && Number.isFinite(maxDiscount) && maxDiscount > 0
          ? maxDiscount
          : null,
      expiry_date: expires,
    },
  };
};

/** An owner may only scope codes to their own listings. */
const resolveOwnedPgIds = async (ownerId, rawPgIds) => {
  const requested = Array.isArray(rawPgIds)
    ? [...new Set(rawPgIds.map(Number).filter((id) => Number.isFinite(id) && id > 0))]
    : [];

  if (requested.length === 0) return { ok: true, pgIds: [] };

  const owned = await PG.countDocuments({ _id: { $in: requested }, owner_id: ownerId });
  if (owned !== requested.length) {
    return { ok: false, error: "You can only apply a promo code to your own PGs." };
  }

  return { ok: true, pgIds: requested };
};

// ==========================================
// CUSTOMER: preview a code at checkout
// ==========================================
export const validatePromoCodeForCheckout = async (req, res) => {
  try {
    const { code, pg_id, amount } = req.body;

    const result = await checkPromoCode({ code, pgId: pg_id, amount: Number(amount) });
    if (!result.ok) {
      return res.status(400).json({ success: false, message: result.error });
    }

    return res.status(200).json({
      success: true,
      code: result.coupon.code,
      discount_applied: result.discount,
      final_amount: result.finalAmount,
      message: "Promo code applied!",
    });
  } catch (error) {
    console.error("Validate Promo Code Error:", error);
    return res.status(500).json({ success: false, message: "Failed to apply promo code." });
  }
};

// ==========================================
// OWNER: list my promo codes
// ==========================================
export const listOwnerPromoCodes = async (req, res) => {
  try {
    const ownerId = Number(req.user.id);

    const [coupons, pgs] = await Promise.all([
      Coupon.find({ owner_id: ownerId }).sort({ created_at: -1 }).lean(),
      PG.find({ owner_id: ownerId }).select("_id title").lean(),
    ]);

    const titleById = new Map(pgs.map((pg) => [pg._id, pg.title]));

    const promoCodes = coupons.map((coupon) => ({
      ...serialize(coupon),
      display_status: displayStatus(coupon),
      pg_titles: (coupon.pg_ids || []).map((id) => titleById.get(id) || `PG #${id}`),
    }));

    return res.status(200).json({ success: true, promoCodes });
  } catch (error) {
    console.error("List Promo Codes Error:", error);
    return res.status(500).json({ success: false, message: "Failed to load your promo codes." });
  }
};

// ==========================================
// OWNER: create
// ==========================================
export const createPromoCode = async (req, res) => {
  try {
    const ownerId = Number(req.user.id);

    const parsed = parseDiscountFields(req.body);
    if (!parsed.ok) {
      return res.status(400).json({ success: false, message: parsed.error });
    }

    const pgScope = await resolveOwnedPgIds(ownerId, req.body.pg_ids);
    if (!pgScope.ok) {
      return res.status(403).json({ success: false, message: pgScope.error });
    }

    const requestedCode = normalizeCode(req.body.code);
    if (requestedCode.length > MAX_CODE_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `A promo code can be at most ${MAX_CODE_LENGTH} characters.`,
      });
    }

    // A generated code could in theory collide, so retry a few times; a
    // caller-supplied code is surfaced as a conflict instead.
    const maxAttempts = requestedCode ? 1 : 5;
    let created = null;

    for (let attempt = 0; attempt < maxAttempts && !created; attempt += 1) {
      const code = requestedCode || generatePromoCode();

      try {
        created = await Coupon.create({
          owner_id: ownerId,
          code,
          ...parsed.values,
          pg_ids: pgScope.pgIds,
          status: "active",
        });
      } catch (err) {
        if (err?.code === 11000) {
          if (requestedCode) {
            return res.status(409).json({ success: false, message: "That promo code already exists." });
          }
          continue; // generated collision — try another
        }
        throw err;
      }
    }

    if (!created) {
      return res.status(500).json({
        success: false,
        message: "Could not generate a unique promo code. Please try again.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Promo code created.",
      promoCodeId: created._id,
      code: created.code,
    });
  } catch (error) {
    console.error("Create Promo Code Error:", error);
    return res.status(500).json({ success: false, message: "Failed to create the promo code." });
  }
};

// ==========================================
// OWNER: edit
// ==========================================
export const updatePromoCode = async (req, res) => {
  try {
    const ownerId = Number(req.user.id);
    const id = parseId(req.params.id);

    if (!id) {
      return res.status(400).json({ success: false, message: "Invalid promo code id." });
    }

    const existing = await Coupon.findOne({ _id: id, owner_id: ownerId }).lean();
    if (!existing) {
      return res.status(404).json({ success: false, message: "Promo code not found." });
    }

    // Editing a spent code would rewrite history for an already-discounted payment.
    if (existing.status === "used") {
      return res.status(409).json({ success: false, message: "A used promo code cannot be edited." });
    }

    const parsed = parseDiscountFields(req.body);
    if (!parsed.ok) {
      return res.status(400).json({ success: false, message: parsed.error });
    }

    const pgScope = await resolveOwnedPgIds(ownerId, req.body.pg_ids);
    if (!pgScope.ok) {
      return res.status(403).json({ success: false, message: pgScope.error });
    }

    // `code` is deliberately not editable: it may already have been shared.
    await Coupon.updateOne(
      { _id: id, owner_id: ownerId },
      { $set: { ...parsed.values, pg_ids: pgScope.pgIds } }
    );

    return res.status(200).json({ success: true, message: "Promo code updated." });
  } catch (error) {
    console.error("Update Promo Code Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update the promo code." });
  }
};

// ==========================================
// OWNER: delete
// ==========================================
export const deletePromoCode = async (req, res) => {
  try {
    const ownerId = Number(req.user.id);
    const id = parseId(req.params.id);

    if (!id) {
      return res.status(400).json({ success: false, message: "Invalid promo code id." });
    }

    const result = await Coupon.deleteOne({ _id: id, owner_id: ownerId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Promo code not found." });
    }

    return res.status(200).json({ success: true, message: "Promo code deleted." });
  } catch (error) {
    console.error("Delete Promo Code Error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete the promo code." });
  }
};
