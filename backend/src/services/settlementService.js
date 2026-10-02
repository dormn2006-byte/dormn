// Turns a successful rent payment into a payroll settlement: deducts the
// company's one-time booking fee (spread across monthly payments), records what
// the owner is owed, and hands it to the payout service.

import Payment from "../schemas/paymentSchema.js";
import Booking from "../schemas/bookingSchema.js";
import PG from "../schemas/pgSchema.js";
import Settlement from "../schemas/settlementSchema.js";
import { findUserById } from "../models/userModel.js";
import { computeDeduction, clampMonths, feePercentForMonths } from "./feeService.js";
import { createNotification } from "./notificationService.js";
import { payoutSettlement } from "./payoutService.js";
import * as razorpayx from "./razorpayxService.js";

const rupees = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

/** Picks which of the owner's saved accounts the payout should target. */
const resolveBankAccountId = async (ownerId, pgId) => {
  const pg = pgId
    ? await PG.findById(pgId).select("connected_bank_account_id").lean()
    : null;

  if (pg?.connected_bank_account_id) return pg.connected_bank_account_id;

  const owner = await findUserById(ownerId);
  const accounts = Array.isArray(owner?.bank_accounts) ? owner.bank_accounts : [];
  const primary = accounts.find((a) => a.is_primary) || accounts[0];
  return primary?.id || null;
};

/**
 * Creates the settlement for a payment. Idempotent: the unique index on
 * payment_id means a retried verify can't double-charge the fee.
 */
export const createSettlementForPayment = async (paymentId) => {
  const existing = await Settlement.findOne({ payment_id: Number(paymentId) }).lean();
  if (existing) return existing;

  const payment = await Payment.findById(paymentId).lean();
  if (!payment || payment.status !== "successful") return null;

  const booking = payment.booking_id
    ? await Booking.findById(payment.booking_id).lean()
    : null;

  const months = clampMonths(booking?.duration_months || 1);
  const monthlyRent =
    Number(payment.original_amount) > 0
      ? Number(payment.original_amount)
      : Number(booking?.booked_price) > 0
        ? Number(booking.booked_price)
        : Number(payment.amount);

  const { feeTotal, deduction, net } = computeDeduction({
    monthlyRent,
    months,
    feeCollected: booking?.fee_collected || 0,
    paymentAmount: payment.amount,
  });

  const bankAccountId = await resolveBankAccountId(payment.owner_id, payment.pg_id);

  let settlement;
  try {
    // Created before touching the booking so the unique index is the concurrency
    // guard — a duplicate here must not increment the fee counter twice.
    settlement = await Settlement.create({
      payment_id: Number(paymentId),
      booking_id: payment.booking_id || null,
      owner_id: payment.owner_id,
      pg_id: payment.pg_id || null,
      student_id: payment.user_id || null,
      gross_amount: Number(payment.amount),
      fee_percent: feePercentForMonths(months),
      fee_total: feeTotal,
      fee_deducted: deduction,
      net_amount: net,
      status: net > 0 ? "pending" : "no_payout",
      bank_account_id: bankAccountId,
    });
  } catch (err) {
    if (err?.code === 11000) {
      return Settlement.findOne({ payment_id: Number(paymentId) }).lean();
    }
    throw err;
  }

  if (booking) {
    // Only the fee ledger is advanced here; the payment controller owns
    // months_paid / payment_status so the two can't disagree.
    await Booking.updateOne(
      { _id: booking._id },
      { $inc: { fee_collected: deduction } }
    );
  }

  const pg = payment.pg_id
    ? await PG.findById(payment.pg_id).select("title").lean()
    : null;

  await createNotification({
    userId: payment.owner_id,
    type: "payment_settlement",
    title: net > 0 ? "Rent payment received" : "Rent payment received (fee applied)",
    message:
      net > 0
        ? `${rupees(payment.amount)} received${pg?.title ? ` for ${pg.title}` : ""}. Company fee ${rupees(deduction)} — transfer ${rupees(net)} to your bank account.`
        : `${rupees(payment.amount)} received${pg?.title ? ` for ${pg.title}` : ""}. The company fee of ${rupees(deduction)} covers this payment, so there is nothing to transfer.`,
    data: {
      settlement_id: settlement._id,
      payment_id: payment._id,
      gross: Number(payment.amount),
      fee: deduction,
      net,
      pg_title: pg?.title || null,
    },
    actionType: net > 0 ? "approve_payout" : null,
    actionRef: settlement._id,
  });

  // Fully autonomous mode: settle without the owner having to tap anything.
  if (process.env.PAYOUT_AUTO === "true" && net > 0) {
    await payoutSettlement(settlement._id).catch((err) =>
      console.error("[Settlement] auto-payout error:", err.message)
    );
  }

  return settlement;
};

/** Owner-triggered transfer to their bank account. */
export const approveSettlement = async (settlementId, ownerId) => {
  const settlement = await Settlement.findById(settlementId);

  if (!settlement) return { ok: false, status: 404, error: "Settlement not found." };
  if (Number(settlement.owner_id) !== Number(ownerId)) {
    return { ok: false, status: 403, error: "This settlement does not belong to you." };
  }
  if (settlement.status === "paid") {
    return { ok: false, status: 400, error: "This payment has already been transferred." };
  }
  if (settlement.status === "processing") {
    return { ok: false, status: 400, error: "This transfer is already in progress." };
  }
  if (Number(settlement.net_amount) <= 0) {
    return { ok: false, status: 400, error: "There is nothing to transfer for this payment." };
  }

  const result = await payoutSettlement(settlement._id);
  if (!result.ok) {
    return { ok: false, status: 400, error: result.error };
  }

  return { ok: true, status: 200, payoutId: result.payoutId };
};

/** Called by the webhook once Razorpay confirms the payout landed. */
export const markSettlementPaid = async (settlementId, { utr = null } = {}) => {
  const settlement = await Settlement.findById(settlementId);
  if (!settlement || settlement.status === "paid") return settlement;

  settlement.status = "paid";
  settlement.payout_utr = utr || settlement.payout_utr || null;
  settlement.paid_at = new Date();
  settlement.failure_reason = null;
  await settlement.save();

  await createNotification({
    userId: settlement.owner_id,
    type: "payout_paid",
    title: "Money transferred to your bank",
    message: `${rupees(settlement.net_amount)} has been transferred to your bank account${utr ? ` (UTR ${utr})` : ""}.`,
    data: { settlement_id: settlement._id },
  });

  return settlement;
};

/**
 * Fallback for when the payout webhook never arrives: re-checks settlements
 * still marked `processing` and moves them to paid/failed from Razorpay's
 * current view of the payout.
 */
export const reconcileProcessingSettlements = async (maxAgeMinutes = 15) => {
  if (!razorpayx.isConfigured()) return 0;

  const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
  const stuck = await Settlement.find({
    status: "processing",
    razorpay_payout_id: { $ne: null },
    updated_at: { $lt: cutoff },
  })
    .limit(50)
    .lean();

  let updated = 0;

  for (const settlement of stuck) {
    try {
      const payout = await razorpayx.fetchPayout(settlement.razorpay_payout_id);

      if (payout?.status === "processed") {
        await markSettlementPaid(settlement._id, { utr: payout.utr || null });
        updated += 1;
      } else if (["failed", "reversed", "rejected"].includes(payout?.status)) {
        await failSettlement(settlement._id, payout.failure_reason || payout.status);
        updated += 1;
      }
    } catch (err) {
      console.error("[Reconcile] payout check error:", err.message);
    }
  }

  return updated;
};

/** Called by the webhook when Razorpay reports a failed/reversed payout. */
export const failSettlement = async (settlementId, reason) => {
  const settlement = await Settlement.findById(settlementId);
  if (!settlement || settlement.status === "paid") return settlement;

  settlement.status = "failed";
  settlement.failure_reason = String(reason || "Payout failed.").slice(0, 500);
  await settlement.save();

  await createNotification({
    userId: settlement.owner_id,
    type: "payout_failed",
    title: "Payout failed",
    message: `We couldn't transfer ${rupees(settlement.net_amount)} to your bank account. ${reason || ""}`.trim(),
    data: { settlement_id: settlement._id },
  });

  return settlement;
};
