import jwt from "jsonwebtoken";
import pool from "../config/db.js";

// Verify User Authentication
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check Authorization Header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // No Token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. No token provided",
      });
    }

    // Verify Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach User Data
    req.user = decoded;

    next();
  } catch (error) {
    console.log("Auth Middleware Error:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// Admin Authorization
export const adminOnly = (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Authorization failed",
    });
  }
};

// PG Owner Authorization
export const ownerOnly = (req, res, next) => {
  try {
    if (req.user.role !== "owner" && req.user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. PG Owners only",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Authorization failed",
    });
  }
};

// Admin or Owner Authorization (Event managers & property management)
export const adminOrOwner = (req, res, next) => {
  try {
    const role = req.user?.role;
    if (role === "admin" || role === "owner" || role === "superadmin") {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Access denied. Admin or Property Owner privileges required",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Authorization failed",
    });
  }
};

// Email Verification Check Middleware
// Blocks PG & Event bookings if email is not verified (Google OAuth logins are pre-verified)
export const requireVerifiedEmail = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const [rows] = await pool.execute(
      "SELECT id, email, is_email_verified, auth_provider FROM users WHERE id = ?",
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User account not found",
      });
    }

    const user = rows[0];
    const isVerified = Boolean(user.is_email_verified) || user.auth_provider === "google";

    if (!isVerified) {
      return res.status(403).json({
        success: false,
        code: "EMAIL_NOT_VERIFIED",
        message: "Please verify your email address to book PGs or events.",
      });
    }

    next();
  } catch (error) {
    console.error("requireVerifiedEmail Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify email authorization",
    });
  }
};
