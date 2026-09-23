// Shared sender/recipient address resolution for the Dormn email system.
//
// The sending domain is configurable via EMAIL_DOMAIN (defaults to "dormn.com"),
// so the local part — the word before the @ — can be built dynamically in code:
//
//   buildSender("bookings")                 -> { name: "Dormn",        email: "bookings@dormn.com" }
//   buildSender("events", "Dormn Events")   -> { name: "Dormn Events", email: "events@dormn.com" }
//
// A full address ("someone@otherdomain.com") is passed through untouched, and
// `"Name" <addr@x.com>` is parsed into { name, email }.

export const getEmailDomain = () =>
  (process.env.EMAIL_DOMAIN || "dormn.com").trim().replace(/^@/, "");

export const getDefaultSenderName = () =>
  process.env.BREVO_SENDER_NAME || process.env.SMTP_SENDER_NAME || "Dormn";

/** Accepts "a@b.com", `"Name" <a@b.com>`, a local part ("bookings"), or `{ name, email }`. */
export const parseAddress = (raw) => {
  if (raw === null || raw === undefined) return null;

  if (typeof raw === "object") {
    const email = String(raw.email || "").trim();
    if (!email) return null;
    return { name: String(raw.name || "").trim(), email };
  }

  const value = String(raw).trim();
  if (!value) return null;

  const match = /^\s*(?:"?([^"<]*?)"?\s*)?<([^>]+)>\s*$/.exec(value);
  if (match) return { name: (match[1] || "").trim(), email: match[2].trim() };

  return { name: "", email: value };
};

/** Expands a bare local part to a full address on the configured domain. */
const qualify = (email) =>
  email.includes("@") ? email : `${email}@${getEmailDomain()}`;

/**
 * Builds a sender from a local part (the word before the @) and display name.
 * Both are optional — the local part falls back to BREVO_SENDER_LOCAL_PART or
 * "no-reply", the name to BREVO_SENDER_NAME or "Dormn".
 */
export const buildSender = (localPart, name) => {
  const raw = String(localPart || process.env.BREVO_SENDER_LOCAL_PART || "no-reply").trim();
  const parsed = parseAddress(raw) || { name: "", email: "no-reply" };

  return {
    name: (name || parsed.name || getDefaultSenderName()).trim(),
    email: qualify(parsed.email),
  };
};

/**
 * Resolves the sender for a message. Resolution order:
 *   override -> BREVO_SENDER_EMAIL -> SMTP_FROM -> SMTP_USER -> no-reply@<domain>
 * An override may be a local part ("receipts"), a full address, or `{ name, email }`.
 */
export const resolveSender = (override, name) => {
  const candidate =
    override ||
    process.env.BREVO_SENDER_EMAIL ||
    process.env.SMTP_FROM ||
    process.env.SMTP_USER;

  const parsed = parseAddress(candidate);
  if (parsed && parsed.email) {
    return {
      name: (name || parsed.name || getDefaultSenderName()).trim(),
      email: qualify(parsed.email),
    };
  }

  return buildSender(null, name);
};

/** Normalises a recipient (or array of them) into Brevo/nodemailer `{ name, email }`. */
export const normalizeRecipients = (to) => {
  if (!to) return [];

  const list = Array.isArray(to) ? to : [to];

  return list
    .map((item) => {
      const parsed = parseAddress(item);
      if (!parsed || !parsed.email) return null;
      return parsed.name
        ? { name: parsed.name, email: parsed.email }
        : { email: parsed.email };
    })
    .filter(Boolean);
};
