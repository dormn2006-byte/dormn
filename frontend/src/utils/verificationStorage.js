const SNOOZE_PREFIX = "dormn_verify_snooze_";

export const getVerifyUserKey = (user) => (!user ? "guest" : String(user.id || user.email || "guest").toLowerCase().trim());

export const isEmailVerified = (user) => {
  if (!user) return false;
  if (user.auth_provider === "google") return true;
  return Boolean(
    user.is_email_verified === 1 ||
    user.is_email_verified === true ||
    user.is_email_verified === "1" ||
    user.email_verified === 1 ||
    user.email_verified === true ||
    user.email_verified === "1" ||
    user.isEmailVerified === true ||
    user.isEmailVerified === 1 ||
    user.isEmailVerified === "1"
  );
};

export const isVerificationSnoozed = (user) => {
  if (!user || isEmailVerified(user)) return true;
  try {
    return Date.now() < Number(localStorage.getItem(`${SNOOZE_PREFIX}${getVerifyUserKey(user)}`) || 0);
  } catch {
    return false;
  }
};

export const snoozeVerification = (user, days = 3) => {
  if (!user) return;
  try {
    localStorage.setItem(`${SNOOZE_PREFIX}${getVerifyUserKey(user)}`, String(Date.now() + days * 86400000));
  } catch {}
};

export const clearVerificationSnooze = (user) => {
  if (!user) return;
  try {
    localStorage.removeItem(`${SNOOZE_PREFIX}${getVerifyUserKey(user)}`);
  } catch {}
};
