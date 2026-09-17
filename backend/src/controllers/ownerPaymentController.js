import pool from "../config/db.js";

// Get all successful payments received by the logged-in PG Owner
export const getOwnerPayments = async (req, res) => {
  try {
    const owner_id = req.user.id; // From owner auth middleware

    const [payments] = await pool.execute(
      `SELECT 
        pay.id AS payment_id,
        pay.amount,
        pay.razorpay_payment_id,
        pay.status,
        pay.created_at AS payment_date,
        u.full_name AS student_name,
        u.email AS student_email,
        u.phone AS student_phone,
        p.title AS pg_title
       FROM payments pay
       JOIN users u ON pay.user_id = u.id
       JOIN pgs p ON pay.pg_id = p.id
       WHERE pay.owner_id = ? AND pay.status = 'successful'
       ORDER BY pay.created_at DESC`,
      [owner_id]
    );

    // Calculate total revenue earned
    const totalRevenue = payments.reduce((sum, item) => sum + Number(item.amount), 0);

    res.status(200).json({ 
      success: true, 
      totalRevenue, 
      payments 
    });
  } catch (error) {
    console.error("Owner Payments Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch owner revenue records." });
  }
};