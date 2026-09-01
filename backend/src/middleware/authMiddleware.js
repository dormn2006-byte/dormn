import jwt from "jsonwebtoken";

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
    if (req.user.role !== "owner") {
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
