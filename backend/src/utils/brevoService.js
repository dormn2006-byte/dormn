// Brevo (formerly Sendinblue) transactional email transport.
//
// Uses the transactional endpoint (/v3/smtp/email), not the campaigns API:
// OTPs, password resets and booking receipts are 1-to-1 transactional mail and
// must never go through a marketing campaign/list.
//
// Uses the global fetch — no SDK dependency needed.
//
// Env is read lazily (at call time) so this module is safe to import before
// dotenv has run.

import { resolveSender } from "./emailAddress.js";

const DEFAULT_API_URL = "https://api.brevo.com/v3";
const REQUEST_TIMEOUT_MS = 15_000;

const apiUrl = () => (process.env.BREVO_API_URL || DEFAULT_API_URL).replace(/\/+$/, "");
const apiKey = () => process.env.BREVO_API_KEY;

export const isBrevoConfigured = () => Boolean(apiKey());

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const envInt = (name, fallback) => {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
};

/** True for failures worth retrying: timeouts, 408/429, and 5xx. */
const isRetryable = (status) => status === 408 || status === 429 || status >= 500;

/** Reads Brevo's Retry-After (seconds or HTTP-date), falling back to backoff. */
const retryDelayMs = (response, attempt) => {
  const header = response?.headers?.get?.("retry-after");
  if (header) {
    const seconds = Number(header);
    if (Number.isFinite(seconds)) return Math.min(seconds * 1000, 30_000);
    const date = Date.parse(header);
    if (Number.isFinite(date)) return Math.max(0, Math.min(date - Date.now(), 30_000));
  }
  const base = envInt("BREVO_RETRY_BASE_MS", 500);
  return Math.min(base * 2 ** (attempt - 1), 8_000);
};

const post = async (path, body) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(`${apiUrl()}${path}`, {
      method: "POST",
      headers: {
        "api-key": apiKey(),
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
};

const describeError = (status, detail) => {
  if (status === 401) {
    return "Brevo rejected the API key. Either the key is wrong, or this server's IP is not in Brevo's authorised IP list (Brevo > Security > Authorised IPs).";
  }
  if (status === 400 && /sender/i.test(detail)) {
    return `Brevo rejected the sender address — it must be a verified sender or on a verified domain. ${detail}`;
  }
  if (status === 402) return "Brevo account has no remaining email credits.";
  if (status === 429) return "Brevo rate limit reached (too many requests).";
  return detail || `Brevo request failed with status ${status}`;
};

const buildAttachments = (attachments) =>
  (attachments || []).map((file) => {
    const name = file.filename || file.name || file.path || "attachment";
    if (file.url) return { name, url: file.url };
    const content = Buffer.isBuffer(file.content)
      ? file.content.toString("base64")
      : file.content;
    return content ? { name, content } : null;
  }).filter(Boolean);

/** Maps a normalised message onto the Brevo /smtp/email payload. */
const toBrevoPayload = (message) => ({
  sender: message.sender,
  to: message.to,
  ...(message.cc?.length ? { cc: message.cc } : {}),
  ...(message.bcc?.length ? { bcc: message.bcc } : {}),
  ...(message.replyTo ? { replyTo: message.replyTo } : {}),
  subject: message.subject,
  htmlContent: message.html,
  ...(message.text ? { textContent: message.text } : {}),
  ...(message.attachments?.length
    ? { attachment: buildAttachments(message.attachments) }
    : {}),
  ...(message.tags?.length ? { tags: message.tags } : {}),
  headers: {
    "X-Entity-Ref-ID": `dormn-${Date.now()}`,
    ...(message.headers || {}),
  },
});

/**
 * Sends one transactional email, retrying transient failures with exponential
 * backoff. Never throws — returns `{ ok, provider, messageId?, error? }`.
 */
export const sendBrevoMessage = async (message) => {
  if (!isBrevoConfigured()) {
    return { ok: false, provider: "brevo", error: "BREVO_API_KEY is not set" };
  }

  const sender = message.sender || resolveSender();
  if (!sender?.email) {
    const error =
      "No sender address. Set BREVO_SENDER_EMAIL (or SMTP_FROM) in backend/.env to an address verified in your Brevo account.";
    console.error("[Brevo] ❌", error);
    return { ok: false, provider: "brevo", error };
  }

  const payload = toBrevoPayload({ ...message, sender });
  const attempts = Math.max(1, envInt("BREVO_MAX_ATTEMPTS", 3));
  let lastError = "unknown error";

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let response;

    try {
      response = await post("/smtp/email", payload);
    } catch (error) {
      lastError =
        error.name === "AbortError"
          ? "request timed out"
          : error.message || String(error);

      if (attempt < attempts) {
        await sleep(retryDelayMs(null, attempt));
        continue;
      }
      break;
    }

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      console.log(
        `[Brevo] ✅ Email sent to ${payload.to.map((r) => r.email).join(", ")} (${data.messageId || "queued"})`
      );
      return { ok: true, provider: "brevo", messageId: data.messageId || null };
    }

    const detail = await response.text().catch(() => "");
    lastError = describeError(response.status, detail);

    if (!isRetryable(response.status) || attempt === attempts) break;

    const delay = retryDelayMs(response, attempt);
    console.warn(
      `[Brevo] ⚠️ Attempt ${attempt}/${attempts} failed (${response.status}); retrying in ${delay}ms.`
    );
    await sleep(delay);
  }

  console.error("[Brevo] ❌ Send failed:", lastError);
  return { ok: false, provider: "brevo", error: lastError };
};

/** Validates the API key by reading the account. Used by the diagnostic script. */
export const verifyBrevoService = async () => {
  const sender = resolveSender();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${apiUrl()}/account`, {
      headers: { "api-key": apiKey(), accept: "application/json" },
      signal: controller.signal,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return {
        configured: true,
        verified: false,
        provider: "brevo",
        sender: sender.email,
        error: describeError(res.status, detail),
      };
    }

    const account = await res.json().catch(() => ({}));
    return {
      configured: true,
      verified: true,
      provider: "brevo",
      sender: sender.email,
      user: account.email,
      message: `Brevo API key is valid (account: ${account.email || "unknown"}); sender: ${sender.name} <${sender.email}>`,
    };
  } catch (error) {
    return {
      configured: true,
      verified: false,
      provider: "brevo",
      sender: sender.email,
      error: error.name === "AbortError" ? "request timed out" : error.message,
    };
  } finally {
    clearTimeout(timer);
  }
};
