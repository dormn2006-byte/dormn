const superAdminMiddleware = (req, res, next) => {
  try {
    // Check if user exists
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    // Check superadmin role
    if (req.user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Superadmin access only",
      });
    }

    next();
  } catch (error) {
    console.log("SuperAdmin Middleware Error:", error);

    return res.status(500).json({
      success: false,
      message: "Middleware Error",
    });
  }
};

export default superAdminMiddleware;
