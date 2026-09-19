import SecurityAuditLog from "../schemas/securityAuditLogSchema.js";

/**
 * Validates password strength according to Dormn security policy:
 * - More than 8 characters (> 8 chars, at least 9 characters)
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one number (0-9)
 * - Max 128 characters (DoS prevention against expensive hashing)
 */
export const validatePasswordStrength = (pwd) => {
  if (!pwd || typeof pwd !== "string") return { isValid: false, errors: ["Password is required"], message: "Password is required" };

  const errors = [];
  if (pwd.length <= 8) errors.push("Password must have more than 8 characters (at least 9 characters long)");
  if (pwd.length > 128) errors.push("Password must not exceed 128 characters");
  if (!/[A-Z]/.test(pwd)) errors.push("Password must contain at least one uppercase letter (A-Z)");
  if (!/[a-z]/.test(pwd)) errors.push("Password must contain at least one lowercase letter (a-z)");
  if (!/[0-9]/.test(pwd)) errors.push("Password must contain at least one number (0-9)");

  return { isValid: errors.length === 0, errors, message: errors[0] || "Password meets all security criteria" };
};

/** Extracts client IP address safely */
export const getClientIp = (req) => {
  const forwarded = req?.headers?.["x-forwarded-for"];
  return forwarded ? String(forwarded).split(",")[0].trim() : req?.ip || req?.socket?.remoteAddress || "unknown";
};

/** Logs a security audit event to the security_audit_logs table */
export const logSecurityAudit = async ({ req, eventType, userId = null, email = null, status = "SUCCESS", details = null }) => {
  try {
    const ipAddress = getClientIp(req);
    const userAgent = req?.headers?.["user-agent"] ? String(req.headers["user-agent"]).slice(0, 500) : "unknown";
    const cleanEmail = email ? String(email).trim().toLowerCase() : null;

    console.log(`[SECURITY-AUDIT] 🛡️ [${eventType}] [${status}] Account: ${cleanEmail || userId || "anonymous"} | IP: ${ipAddress} | Details: ${details || "None"}`);

    await SecurityAuditLog.create({
      event_type: eventType,
      user_id: userId,
      email: cleanEmail,
      ip_address: ipAddress,
      user_agent: userAgent,
      status,
      details: details ? String(details).slice(0, 1000) : null,
    });
  } catch (error) {
    console.error("[SECURITY-AUDIT] ⚠️ Failed to record security audit log:", error.message);
  }
};
