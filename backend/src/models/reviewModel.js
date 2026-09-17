import pool from "../config/db.js";

// ==========================================
// PUBLIC & USER FUNCTIONS
// ==========================================

// Fetch approved reviews for the frontend
export const getApprovedReviews = async () => {
  const query = `
    SELECT 
      r.id, 
      r.rating, 
      r.description, 
      u.full_name AS title, 
      IF(u.role = 'student', 'Verified Student', 'Working Professional') AS tag
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.status = 'approved'
    ORDER BY r.created_at DESC
  `;
  const [rows] = await pool.execute(query);
  return rows;
};

// Create a new review
export const createReview = async (userId, rating, description) => {
  const query = `INSERT INTO reviews (user_id, rating, description) VALUES (?, ?, ?)`;
  const [result] = await pool.execute(query, [userId, rating, description]);
  return result;
};


// ==========================================
// SUPER ADMIN FUNCTIONS
// ==========================================

// Fetch ALL reviews with bulletproof fallbacks and LEFT JOIN
export const getAllReviewsForAdmin = async () => {
    const query = `
      SELECT 
        r.id, 
        r.user_id, 
        r.rating, 
        r.description, 
        r.status, 
        r.created_at,
        COALESCE(u.full_name, u.name, 'Unknown User') AS full_name,
        COALESCE(u.email, u.mail, 'No Email provided') AS email
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `;
    const [rows] = await pool.execute(query);
    return rows;
  };

// Update Review Status (Hide or Approve)
export const updateReviewStatus = async (id, status) => {
  const query = `UPDATE reviews SET status = ? WHERE id = ?`;
  const [result] = await pool.execute(query, [status, id]);
  return result;
};

// Admin: Delete a Review permanently
export const deleteReview = async (id) => {
  const [result] = await pool.execute(`DELETE FROM reviews WHERE id = ?`, [id]);
  return result;
};