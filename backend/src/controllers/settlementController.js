import Settlement from "../schemas/settlementSchema.js";
import User from "../schemas/userSchema.js";
import PG from "../schemas/pgSchema.js";
import { approveSettlement } from "../services/settlementService.js";

// List the logged-in owner's settlements with the student/PG names attached.
export const getMySettlements = async (req, res) => {
  try {
    const owner_id = Number(req.user.id);

    const settlements = await Settlement.find({ owner_id })
      .sort({ created_at: -1 })
      .limit(200)
      .lean();

    const studentIds = [...new Set(settlements.map((s) => s.student_id).filter(Boolean))];
    const pgIds = [...new Set(settlements.map((s) => s.pg_id).filter(Boolean))];

    const [students, pgs] = await Promise.all([
      User.find({ _id: { $in: studentIds } }).select("full_name email phone").lean(),
      PG.find({ _id: { $in: pgIds } }).select("title city area").lean(),
    ]);

    const studentMap = new Map(students.map((u) => [u._id, u]));
    const pgMap = new Map(pgs.map((p) => [p._id, p]));

    const rows = settlements.map((s) => {
      const student = studentMap.get(s.student_id) || {};
      const pg = pgMap.get(s.pg_id) || {};
      return {
        settlement_id: s._id,
        payment_id: s.payment_id,
        gross_amount: s.gross_amount,
        fee_percent: s.fee_percent,
        fee_total: s.fee_total,
        fee_deducted: s.fee_deducted,
        net_amount: s.net_amount,
        status: s.status,
        payout_utr: s.payout_utr,
        failure_reason: s.failure_reason,
        created_at: s.created_at,
        paid_at: s.paid_at,
        student_name: student.full_name ?? null,
        student_email: student.email ?? null,
        student_phone: student.phone ?? null,
        pg_title: pg.title ?? null,
        pg_city: pg.city ?? null,
      };
    });

    const sum = (statuses) =>
      rows
        .filter((r) => statuses.includes(r.status))
        .reduce((acc, r) => acc + Number(r.net_amount), 0);

    return res.status(200).json({
      success: true,
      settlements: rows,
      totals: {
        pending_net: sum(["pending", "processing"]),
        paid_net: sum(["paid"]),
        fee_collected: rows.reduce((acc, r) => acc + Number(r.fee_deducted), 0),
        gross_received: rows.reduce((acc, r) => acc + Number(r.gross_amount), 0),
      },
    });
  } catch (error) {
    console.error("Get Settlements Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch settlements." });
  }
};

// Owner action: transfer this payment's net to their bank account.
export const approveSettlementController = async (req, res) => {
  try {
    const result = await approveSettlement(req.params.id, req.user.id);

    if (!result.ok) {
      return res.status(result.status || 400).json({ success: false, message: result.error });
    }

    return res.status(200).json({
      success: true,
      message: "Transfer initiated. The money will reach your bank account shortly.",
      payout_id: result.payoutId,
    });
  } catch (error) {
    console.error("Approve Settlement Error:", error);
    return res.status(500).json({ success: false, message: "Failed to initiate the transfer." });
  }
};
