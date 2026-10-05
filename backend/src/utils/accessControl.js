// ─────────────────────────────────────────────────────────────────────────────
// Pre-launch access control for the Dormn backend.
//
// While the site is in "Coming Soon" state, students & owners may use their
// dashboards (and Dormgle), but the public browse endpoints (PG listings,
// reviews, etc.) are hidden from them. Only the master account email — and
// superadmin — can read public data.
// ─────────────────────────────────────────────────────────────────────────────

export const FULL_ACCESS_EMAIL = "mitanshu94paliwal@gmail.com";

/**
 * True when a user may read public platform data. `req.user` is JWT-decoded
 * (so it carries id, email and role) or null for anonymous requests.
 */
export const hasFullAccess = (user) => {
  if (!user) return false;
  if (user.email && String(user.email).trim().toLowerCase() === FULL_ACCESS_EMAIL) {
    return true;
  }
  if (user.role === "superadmin") return true;
  return false;
};

/**
 * Express middleware — guards public browse routes during the coming-soon
 * state. Must be mounted after `optionalProtect` so req.user is populated.
 */
export const requireFullAccess = (req, res, next) => {
  if (hasFullAccess(req.user)) return next();

  return res.status(403).json({
    success: false,
    code: "COMING_SOON",
    message: "Dormn is coming soon. Pre-registered members can access their dashboard and Dormgle only.",
  });
};