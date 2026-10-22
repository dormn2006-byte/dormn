// ─────────────────────────────────────────────────────────────────────────────
// Access control for Dormn's pre-launch "Coming Soon" state.
//
// Launch rules (front-page gate):
//  - Logged-out visitors  → see the Coming Soon page ("Pre Register" CTA)
//  - Students / Owners    → access only their dashboard + Dormgle
//  - The master account   → full access to every feature of the project
// ─────────────────────────────────────────────────────────────────────────────

// Accounts that bypass the pre-launch gate (compared case-insensitively):
//  - the master account, and
//  - additional early-access accounts (e.g. a test student previewing the
//    full platform).
export const FULL_ACCESS_EMAILS = [
  "mitanshu94paliwal@gmail.com",
  "sahilvsabai@gmail.com",
];

/**
 * True when the logged-in user may browse the full public site (home, PGs,
 * events, blogs, gym, etc.):
 *  - one of the full-access account emails, or
 *  - platform superadmin (admin role already has universal access everywhere)
 */
export const hasFullAccess = (user) => {
  if (!user) return false;
  if (user.email) {
    const email = String(user.email).trim().toLowerCase();
    if (FULL_ACCESS_EMAILS.includes(email)) return true;
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