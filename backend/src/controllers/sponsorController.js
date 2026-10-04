import crypto from "crypto";
import Razorpay from "razorpay";

import PG from "../schemas/pgSchema.js";
import { getPGsByOwner } from "../models/pgModel.js";
import {
  createPendingSponsorship,
  activateSponsorship,
  cancelSponsorship,
  findActiveSponsorship,
  findSponsorshipByOrder,
  getAllSlotUsage,
  getActiveSponsoredPGs,
  getOwnerSponsorships,
  getSlotUsage,
  isValidPlacement,
  markSponsorshipFailed,
} from "../services/sponsorService.js";
import {
  SPONSOR_PRICE_INR,
  SPONSOR_DURATION_DAYS,
} from "../config/sponsorship.js";

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ── Public ── */

// GET /api/sponsors?placement=home|explore
export const getSponsoredPGsController = async (req, res) => {
  try {
    const placement = isValidPlacement(req.query.placement) ? req.query.placement : "home";
    const pgs = await getActiveSponsoredPGs(placement);

    return res.status(200).json({ success: true, placement, total: pgs.length, pgs });
  } catch (error) {
    console.error("Get Sponsored PGs Error:", error);
    return res.status(500).json({ success: false, message: "Failed to load sponsored PGs." });
  }
};

// GET /api/sponsors/slots
export const getSlotStatusController = async (req, res) => {
  try {
    const slots = await getAllSlotUsage();
    return res.status(200).json({ success: true, slots });
  } catch (error) {
    console.error("Get Sponsor Slots Error:", error);
    return res.status(500).json({ success: false, message: "Failed to load sponsor slots." });
  }
};

/* ── Owner ── */

// GET /api/sponsors/owner
export const getOwnerSponsorshipsController = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const [sponsorships, slots, pgs] = await Promise.all([
      getOwnerSponsorships(ownerId),
      getAllSlotUsage(),
      getPGsByOwner(ownerId),
    ]);

    const byId = new Map(pgs.map((pg) => [pg.id, pg]));
    const enriched = sponsorships.map((row) => {
      const pg = byId.get(row.pg_id);
      return {
        ...row,
        pg_title: pg?.title || null,
        pg_image: pg?.profile_image || null,
      };
    });

    return res.status(200).json({
      success: true,
      sponsorships: enriched,
      slots,
      price: SPONSOR_PRICE_INR,
      durationDays: SPONSOR_DURATION_DAYS,
    });
  } catch (error) {
    console.error("Get Owner Sponsorships Error:", error);
    return res.status(500).json({ success: false, message: "Failed to load your sponsorships." });
  }
};

// POST /api/sponsors/create-order  { pg_id, placement }
export const createSponsorOrderController = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const { pg_id, placement } = req.body;

    if (!isValidPlacement(placement)) {
      return res.status(400).json({ success: false, message: "Invalid placement." });
    }

    const pg = await PG.findOne({ _id: Number(pg_id), owner_id: Number(ownerId) }).lean();
    if (!pg) {
      return res.status(404).json({ success: false, message: "PG not found." });
    }
    if (pg.status !== "approved") {
      return res.status(400).json({ success: false, message: "Only approved PGs can be sponsored." });
    }

    const existing = await findActiveSponsorship(pg_id, placement);
    if (existing) {
      const label = placement === "home" ? "Home" : "Explore";
      return res.status(409).json({
        success: false,
        message: `You have already paid for this PG on the ${label} placement.`,
      });
    }

    const usage = await getSlotUsage(placement);
    if (usage.available <= 0) {
      return res.status(409).json({
        success: false,
        message: `All ${usage.total} sponsored slots for the ${placement} page are currently taken. Please try again later.`,
      });
    }

    const order = await razorpayInstance.orders.create({
      amount: SPONSOR_PRICE_INR * 100, // paise
      currency: "INR",
      receipt: `sponsor_${placement}_${pg_id}_${Date.now()}`,
    });

    await createPendingSponsorship({
      ownerId,
      pgId: pg_id,
      placement,
      amount: SPONSOR_PRICE_INR,
      orderId: order.id,
    });

    return res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Create Sponsor Order Error:", error);
    return res.status(500).json({ success: false, message: "Failed to start the sponsorship payment." });
  }
};

// POST /api/sponsors/verify  { razorpay_order_id, razorpay_payment_id, razorpay_signature }
export const verifySponsorPaymentController = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing payment details." });
    }

    const row = await findSponsorshipByOrder(razorpay_order_id, ownerId);
    if (!row) {
      return res.status(404).json({ success: false, message: "Sponsorship order not found." });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const signatureBuffer = Buffer.from(String(razorpay_signature), "utf8");
    const isAuthentic =
      expectedBuffer.length === signatureBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, signatureBuffer);

    if (!isAuthentic) {
      await markSponsorshipFailed(row.id, {
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
      });
      return res.status(400).json({ success: false, message: "Payment verification failed." });
    }

    // Re-check the slot: another owner may have taken the last one while this
    // checkout was open. Payment succeeded, so support handles any refund.
    const usage = await getSlotUsage(row.placement);
    if (usage.available <= 0) {
      await markSponsorshipFailed(row.id, {
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
      });
      return res.status(409).json({
        success: false,
        message: "The last slot was taken before your payment completed. Please contact support for a refund.",
      });
    }

    const expiresAt = await activateSponsorship(row.id, {
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      durationDays: SPONSOR_DURATION_DAYS,
    });

    return res.status(200).json({
      success: true,
      message: "Sponsorship activated!",
      expiresAt,
    });
  } catch (error) {
    console.error("Verify Sponsor Payment Error:", error);
    return res.status(500).json({ success: false, message: "Failed to verify the sponsorship payment." });
  }
};

// DELETE /api/sponsors/:id — remove a sponsorship and free its slot.
export const cancelSponsorshipController = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const cancelled = await cancelSponsorship(req.params.id, ownerId);

    if (!cancelled) {
      return res.status(404).json({ success: false, message: "Sponsorship not found." });
    }

    return res.status(200).json({ success: true, message: "Sponsorship removed." });
  } catch (error) {
    console.error("Cancel Sponsorship Error:", error);
    return res.status(500).json({ success: false, message: "Failed to remove the sponsorship." });
  }
};
