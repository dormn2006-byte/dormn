import Settlement from "../schemas/settlementSchema.js";
import { verifyWebhookSignature } from "../services/razorpayxService.js";
import { markSettlementPaid, failSettlement } from "../services/settlementService.js";

const settlementIdFromReference = (reference) => {
  const match = /^dormn_settle_(\d+)$/.exec(String(reference || ""));
  return match ? Number(match[1]) : null;
};

// Razorpay payout lifecycle -> settlement status. Mounted with express.raw so the
// signature can be checked against the exact bytes Razorpay sent.
export const handleRazorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];

    if (!verifyWebhookSignature(req.body, signature)) {
      return res.status(400).json({ success: false, message: "Invalid webhook signature." });
    }

    const event = JSON.parse(req.body.toString("utf8"));
    const eventName = event?.event || "";
    const payout = event?.payload?.payout?.entity;

    if (!eventName.startsWith("payout.") || !payout) {
      // Acknowledge events we don't act on so Razorpay stops retrying.
      return res.status(200).json({ success: true, ignored: true });
    }

    const settlementId =
      settlementIdFromReference(payout.reference_id) ||
      (payout.id
        ? (await Settlement.findOne({ razorpay_payout_id: payout.id }).select("_id").lean())?._id
        : null);

    if (!settlementId) {
      return res.status(200).json({ success: true, ignored: true });
    }

    if (eventName === "payout.processed") {
      await markSettlementPaid(settlementId, { utr: payout.utr || null });
    } else if (["payout.failed", "payout.reversed", "payout.rejected"].includes(eventName)) {
      await failSettlement(
        settlementId,
        payout.failure_reason || payout.status_details?.description || eventName
      );
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Razorpay Webhook Error:", error);
    // 200 so Razorpay doesn't hammer retries on our own bug; the reconciliation
    // sweep will still pick up any settlement left in `processing`.
    return res.status(200).json({ success: false });
  }
};
