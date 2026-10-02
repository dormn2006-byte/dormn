// Thin REST client for RazorpayX Payouts.
//
// The `razorpay` npm SDK bundled with this project (v2.9.8) ships transfers,
// fund accounts and settlements, but no payouts API — so payouts are called
// over REST directly. We use the built-in fetch (Node 18+) to avoid a new
// dependency.
//
// Payouts let the company push money to an owner's bank account without the
// owner having a Razorpay account: we register them once as a Contact with a
// bank Fund Account, then create payouts against it.

import crypto from "crypto";

const API_BASE = process.env.RAZORPAYX_API_BASE || "https://api.razorpay.com/v1";

const credentials = () => ({
  keyId: process.env.RAZORPAYX_KEY_ID,
  keySecret: process.env.RAZORPAYX_KEY_SECRET,
  accountNumber: process.env.RAZORPAYX_ACCOUNT_NUMBER,
});

/** True when every credential needed to move money is present. */
export const isConfigured = () => {
  const { keyId, keySecret, accountNumber } = credentials();
  return Boolean(keyId && keySecret && accountNumber);
};

const authHeader = () => {
  const { keyId, keySecret } = credentials();
  const token = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  return `Basic ${token}`;
};

const request = async (method, path, body) => {
  if (!isConfigured()) {
    throw new Error("RazorpayX is not configured (missing RAZORPAYX_KEY_ID/SECRET/ACCOUNT_NUMBER).");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }

  if (!res.ok) {
    const detail =
      payload?.error?.description || payload?.error?.reason || payload?.message || res.statusText;
    const err = new Error(`RazorpayX ${method} ${path} failed (${res.status}): ${detail}`);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }

  return payload;
};

/** Registers the owner as a payout contact (idempotent on reference_id). */
export const createContact = ({ name, email, phone, referenceId }) =>
  request("POST", "/contacts", {
    name,
    email: email || undefined,
    contact: phone || undefined,
    type: "vendor",
    reference_id: referenceId,
  });

/** Links a bank account to a contact. */
export const createFundAccount = ({ contactId, name, ifsc, accountNumber }) =>
  request("POST", "/fund_accounts", {
    contact_id: contactId,
    account_type: "bank_account",
    bank_account: {
      name,
      ifsc,
      account_number: accountNumber,
    },
  });

/** Creates the outbound payout from the company account to the fund account. */
export const createPayout = ({ fundAccountId, amountPaise, referenceId, narration }) => {
  const { accountNumber } = credentials();
  return request("POST", "/payouts", {
    account_number: accountNumber,
    fund_account_id: fundAccountId,
    amount: amountPaise,
    currency: "INR",
    mode: "IMPS",
    purpose: "payout",
    queue_if_low_balance: true,
    reference_id: referenceId,
    narration: narration || "Dormn rent settlement",
  });
};

/** Reads back a payout's current state (used by the reconciliation sweep). */
export const fetchPayout = (payoutId) => request("GET", `/payouts/${payoutId}`);

/**
 * Verifies a Razorpay webhook signature. `rawBody` must be the exact bytes
 * Razorpay sent, which is why the webhook route is mounted with express.raw.
 */
export const verifyWebhookSignature = (rawBody, signature) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected, "utf-8");
  const gotBuf = Buffer.from(String(signature), "utf-8");

  return (
    expectedBuf.length === gotBuf.length && crypto.timingSafeEqual(expectedBuf, gotBuf)
  );
};
