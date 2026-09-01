import Payment from "../schemas/paymentSchema.js";

// Get all successful payments received by the logged-in PG Owner
export const getOwnerPayments = async (req, res) => {
  try {
    const owner_id = req.user.id;

    const payments = await Payment.find({ owner_id, status: "successful" })
      .sort({ created_at: -1 })
      .populate("user_id", "full_name email phone")
      .populate("pg_id", "title")
      .lean();

    const formatted = payments.map((p) => ({
      payment_id: p._id,
      amount: p.amount,
      razorpay_payment_id: p.razorpay_payment_id,
      status: p.status,
      payment_date: p.created_at,
      student_name: p.user_id?.full_name,
      student_email: p.user_id?.email,
      student_phone: p.user_id?.phone,
      pg_title: p.pg_id?.title,
    }));

    const totalRevenue = formatted.reduce((sum, item) => sum + Number(item.amount), 0);

    res.status(200).json({ success: true, totalRevenue, payments: formatted });
  } catch (error) {
    console.error("Owner Payments Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch owner revenue records." });
  }
};