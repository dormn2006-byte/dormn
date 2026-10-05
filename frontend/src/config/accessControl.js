// ─────────────────────────────────────────────────────────────────────────────
// Access control for Dormn's pre-launch "Coming Soon" state.
//
// Launch rules (front-page gate):
//  - Logged-out visitors  → see the Coming Soon page ("Pre Register" CTA)
//  - Students / Owners    → access only their dashboard + Dormgle
//  - The master account   → full access to every feature of the project
// ─────────────────────────────────────────────────────────────────────────────

export const FULL_ACCESS_EMAIL = "mitanshu94paliwal@gmail.com";

/**
 * True when the logged-in user may browse the full public site (home, PGs,
 * events, blogs, gym, etc.):
 *  - the master account email, or
 *  - platform superadmin (admin role already has universal access everywhere)
 */
export const hasFullAccess = (user) => {
  if (!user) return false;
  if (user.email && String(user.email).trim().toLowerCase() === FULL_ACCESS_EMAIL) {
    return true;
  }
  if (user.role === "superadmin") return true;
  return false;
};

/** Role-based dashboard path (mirrors Navbar/Navbar routing). */
export const dashboardPathFor = (user) => {
  if (!user) return "/auth";
  if (user.role === "superadmin") return "/superadmin/dashboard";
  if (user.role === "owner") return "/owner/dashboard";
  if (user.role === "event_admin" || user.role === "event_manager") return "/event-admin/dashboard";
  return "/student/dashboard";
};