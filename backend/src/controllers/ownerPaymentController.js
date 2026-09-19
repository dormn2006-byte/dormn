import Payment from "../schemas/paymentSchema.js";
import User from "../schemas/userSchema.js";
import PG from "../schemas/pgSchema.js";

// Get all successful payments received by the logged-in PG Owner
export const getOwnerPayments = async (req, res) => {
  try {
    const owner_id = req.user.id; // From owner auth middleware

    const payments = await Payment.find({ owner_id: Number(owner_id), status: "successful" })
      .sort({ created_at: -1 })
      .lean();

    const userIds = [...new Set(payments.map((p) => p.user_id).filter((v) => v != null))];
    const pgIds = [...new Set(payments.map((p) => p.pg_id).filter((v) => v != null))];

    const [users, pgs] = await Promise.all([
      User.find({ _id: { $in: userIds } }).lean(),
      PG.find({ _id: { $in: pgIds } }).lean(),
    ]);

    const userMap = new Map(users.map((u) => [u._id, u]));
    const pgMap = new Map(pgs.map((p) => [p._id, p]));

    const rows = payments.map((pay) => {
      const student = userMap.get(pay.user_id) || {};
      const pg = pgMap.get(pay.pg_id) || {};
      return {
        payment_id: pay._id,
        amount: pay.amount,
        razorpay_payment_id: pay.razorpay_payment_id,
        status: pay.status,
        payment_date: pay.created_at,
        student_name: student.full_name ?? null,
        student_email: student.email ?? null,
        student_phone: student.phone ?? null,
        pg_title: pg.title ?? null,
      };
    });

    // Calculate total revenue earned
    const totalRevenue = rows.reduce((sum, item) => sum + Number(item.amount), 0);

    res.status(200).json({
      success: true,
      totalRevenue,
      payments: rows
    });
  } catch (error) {
    console.error("Owner Payments Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch owner revenue records." });
  }
};
