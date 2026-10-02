// Moves an owner's owed money from the company RazorpayX account to their bank
// account. The owner only ever supplied bank details — RazorpayX pays a bank
// account directly, so they don't need a Razorpay account of their own.

import Settlement from "../schemas/settlementSchema.js";
import User from "../schemas/userSchema.js";
import { findUserById } from "../models/userModel.js";
import { createNotification } from "./notificationService.js";
import * as razorpayx from "./razorpayxService.js";

const rupees = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

/** Picks the bank account a settlement should pay into. */
const resolveBankAccount = (owner, bankAccountId) => {
  const accounts = Array.isArray(owner?.bank_accounts) ? owner.bank_accounts : [];

  if (bankAccountId) {
    const match = accounts.find((a) => String(a.id) === String(bankAccountId));
    if (match) return match;
  }

  return accounts.find((a) => a.is_primary) || accounts[0] || null;
};

/**
 * Pays out one settlement. Safe to call again after a failure: it re-drives the
 * same settlement rather than creating a second payout.
 */
export const payoutSettlement = async (settlementId) => {
  const settlement = await Settlement.findById(settlementId);
  if (!settlement) return { ok: false, error: "Settlement not found" };

  if (settlement.status === "paid") return { ok: false, error: "Already paid out." };
  if (settlement.status === "processing") {
    return { ok: false, error: "A payout for this settlement is already in progress." };
  }

  if (Number(settlement.net_amount) <= 0) {
    settlement.status = "no_payout";
    settlement.failure_reason = "Nothing payable after the company fee.";
    await settlement.save();
    return { ok: false, error: settlement.failure_reason };
  }

  if (!razorpayx.isConfigured()) {
    // Dev-safe: record the intent but never move money without credentials.
    settlement.failure_reason = "Payouts are not configured on the server.";
    await settlement.save();
    return { ok: false, error: settlement.failure_reason };
  }

  const owner = await findUserById(settlement.owner_id);
  if (!owner) {
    settlement.status = "failed";
    settlement.failure_reason = "Owner account not found.";
    await settlement.save();
    return { ok: false, error: settlement.failure_reason };
  }

  const account = resolveBankAccount(owner, settlement.bank_account_id);

  if (!account?.account_number || !account?.ifsc_code || !account?.account_holder) {
    settlement.status = "failed";
    settlement.failure_reason = "Owner has no complete bank account for payout.";
    await settlement.save();

    await createNotification({
      userId: settlement.owner_id,
      type: "payout_failed",
      title: "Payout failed — bank details missing",
      message: `We couldn't transfer ${rupees(settlement.net_amount)} because your bank account details are incomplete. Please update them in your profile.`,
      data: { settlement_id: settlement._id },
    });

    return { ok: false, error: settlement.failure_reason };
  }

  try {
    let { razorpay_contact_id: contactId, razorpay_fund_account_id: fundAccountId } = account;

    if (!contactId) {
      const contact = await razorpayx.createContact({
        name: owner.full_name || account.account_holder,
        email: owner.email,
        phone: owner.phone,
        referenceId: `dormn_owner_${owner._id}`,
      });
      contactId = contact.id;
    }

    if (!fundAccountId) {
      const fund = await razorpayx.createFundAccount({
        contactId,
        name: account.account_holder,
        ifsc: account.ifsc_code,
        accountNumber: account.account_number,
      });
      fundAccountId = fund.id;
    }

    // Persist the linkage so the next payout skips contact/fund-account setup.
    if (account.razorpay_contact_id !== contactId || account.razorpay_fund_account_id !== fundAccountId) {
      await User.updateOne(
        { _id: settlement.owner_id, "bank_accounts.id": account.id },
        {
          $set: {
            "bank_accounts.$.razorpay_contact_id": contactId,
            "bank_accounts.$.razorpay_fund_account_id": fundAccountId,
          },
        }
      );
    }

    const payout = await razorpayx.createPayout({
      fundAccountId,
      amountPaise: Math.round(Number(settlement.net_amount) * 100),
      referenceId: `dormn_settle_${settlement._id}`,
      narration: `Dormn rent settlement #${settlement._id}`,
    });

    settlement.status = "processing";
    settlement.razorpay_payout_id = payout.id;
    settlement.bank_account_id = account.id;
    settlement.approved_at = settlement.approved_at || new Date();
    settlement.failure_reason = null;
    await settlement.save();

    return { ok: true, payoutId: payout.id, status: payout.status };
  } catch (err) {
    const reason =
      err?.payload?.error?.description || err?.payload?.error?.reason || err.message || "Payout failed.";

    settlement.status = "failed";
    settlement.failure_reason = String(reason).slice(0, 500);
    await settlement.save();

    await createNotification({
      userId: settlement.owner_id,
      type: "payout_failed",
      title: "Payout failed",
      message: `We couldn't transfer ${rupees(settlement.net_amount)} to your bank account. ${reason}`,
      data: { settlement_id: settlement._id },
    });

    console.error("[Payout] failed:", reason);
    return { ok: false, error: reason };
  }
};
