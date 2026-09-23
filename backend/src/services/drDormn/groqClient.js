// Thin wrapper over Groq's OpenAI-compatible chat completions API.
//
// We deliberately use the global fetch instead of an SDK: Groq speaks the same
// wire format as OpenAI, and fetch streams SSE for free. That keeps the
// dependency list (and therefore install/CI) untouched.

const GROQ_API_URL =
  process.env.GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions";

// Groq retires models periodically — check what your key can access at
// https://console.groq.com/docs/models before changing these.
export const CHAT_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
export const SUMMARY_MODEL =
  process.env.GROQ_SUMMARY_MODEL || "openai/gpt-oss-20b";

const REQUEST_TIMEOUT_MS = 60_000;
// A streamed reply can legitimately take a while, but it must never hang.
const STREAM_TIMEOUT_MS = 180_000;

export class GroqError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = "GroqError";
    this.status = status;
  }
}

const requireApiKey = () => {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new GroqError(
      "Dr.Dormn AI is not configured. Missing GROQ_API_KEY.",
      503
    );
  }
  return key;
};

// Node 18 has no AbortSignal.any(), so combine the request timeout with the
// caller's signal by hand. The combined controller must stay alive for the
// whole response — a stream is aborted mid-flight by the caller's signal, so
// the listener is only removed once the body has been consumed.
const createRequestSignal = (externalSignal, timeoutMs) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const abort = () => controller.abort();

  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener("abort", abort, { once: true });
  }

  return {
    signal: controller.signal,
    dispose: () => {
      clearTimeout(timer);
      externalSignal?.removeEventListener("abort", abort);
    },
  };
};

// The free tier is metered per minute, so a burst of turns can trip 429 even
// when everything is working. Groq tells us how long to wait — honour it and
// retry, rather than failing the user's message.
const MAX_RATE_LIMIT_RETRIES = 2;
const MAX_RETRY_WAIT_MS = 10_000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const retryDelayMs = (res, attempt) => {
  const header = res.headers.get("retry-after");
  const seconds = Number(header);

  if (Number.isFinite(seconds) && seconds > 0) {
    return Math.min(seconds * 1000, MAX_RETRY_WAIT_MS);
  }

  return Math.min(1000 * 2 ** attempt, MAX_RETRY_WAIT_MS);
};

const post = async (body, requestSignal) => {
  for (let attempt = 0; ; attempt += 1) {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${requireApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: requestSignal.signal,
    });

    if (res.ok) return res;

    // A 429 means nothing has been generated yet, so retrying the whole request
    // is safe. Anything else (or a request we cannot retry) is a real failure.
    if (
      res.status === 429 &&
      attempt < MAX_RATE_LIMIT_RETRIES &&
      !requestSignal.signal.aborted
    ) {
      const waitMs = retryDelayMs(res, attempt);
      await res.text().catch(() => "");
      console.warn(`[DrDormn] Groq rate limited, retrying in ${waitMs}ms`);
      await sleep(waitMs);
      continue;
    }

    const detail = await res.text().catch(() => "");

    let parsed = null;
    try {
      parsed = JSON.parse(detail);
    } catch {
      /* non-JSON error body */
    }

    const code = parsed?.error?.code;
    const upstream = parsed?.error?.message;

    console.error(
      "[DrDormn] Groq error",
      res.status,
      code || "-",
      (upstream || detail).slice(0, 300)
    );

    if (res.status === 429) {
      throw new GroqError(
        "Dr.Dormn is getting a lot of requests right now (the Groq free tier is limited to 8,000 tokens/minute). Please wait a few seconds and try again.",
        429
      );
    }

    if (code === "model_not_found" || res.status === 404) {
      throw new GroqError(
        `The AI model "${CHAT_MODEL}" is no longer available on this Groq account. Set GROQ_MODEL in backend/.env to a model your account can access.`,
        502
      );
    }

    if (res.status === 401 || res.status === 403) {
      throw new GroqError(
        "The AI service rejected our API key. Check GROQ_API_KEY in backend/.env.",
        503
      );
    }

    throw new GroqError("The AI service is temporarily unavailable.", 502);
  }
};

/**
 * Streaming completion. Yields:
 *   { type: "token", text }             — incremental assistant text
 *   { type: "tool_calls", toolCalls }   — accumulated tool calls (name + args)
 *   { type: "done", finishReason }
 */
export async function* streamGroq({ messages, tools, model = CHAT_MODEL, signal }) {
  const requestSignal = createRequestSignal(signal, STREAM_TIMEOUT_MS);

  let res;
  try {
    res = await post(
      {
        model,
        messages,
        ...(tools?.length ? { tools, tool_choice: "auto" } : {}),
        temperature: 0.2,
        max_tokens: 2048,
        stream: true,
      },
      requestSignal
    );
  } catch (err) {
    requestSignal.dispose();
    throw err;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    requestSignal.dispose();
    throw new GroqError("The AI service returned an empty stream.");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let finishReason = null;

  // Tool call deltas arrive fragmented and must be stitched by index.
  const pending = new Map();
  const mergeToolCallDelta = (delta) => {
    const index = delta.index ?? 0;
    const current = pending.get(index) || {
      id: null,
      type: "function",
      function: { name: "", arguments: "" },
    };

    if (delta.id) current.id = delta.id;
    if (delta.function?.name) current.function.name += delta.function.name;
    if (delta.function?.arguments) {
      current.function.arguments += delta.function.arguments;
    }

    pending.set(index, current);
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE frames are separated by a blank line.
      const frames = buffer.split("\n\n");
      buffer = frames.pop() ?? "";

      for (const frame of frames) {
        for (const line of frame.split("\n")) {
          if (!line.startsWith("data:")) continue;

          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;

          let parsed;
          try {
            parsed = JSON.parse(payload);
          } catch {
            continue; // ignore malformed keep-alive fragments
          }

          const choice = parsed.choices?.[0];
          if (!choice) continue;

          const text = choice.delta?.content;
          if (text) yield { type: "token", text };

          for (const call of choice.delta?.tool_calls || []) {
            mergeToolCallDelta(call);
          }

          if (choice.finish_reason) finishReason = choice.finish_reason;
        }
      }
    }
  } finally {
    reader.cancel().catch(() => {});
    requestSignal.dispose();
  }

  if (pending.size > 0) {
    yield {
      type: "tool_calls",
      toolCalls: [...pending.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([, call], i) => ({
          id: call.id || `call_${i}`,
          type: "function",
          function: {
            name: call.function.name,
            arguments: call.function.arguments || "{}",
          },
        })),
    };
  }

  yield { type: "done", finishReason: finishReason || "stop" };
}

/**
 * Non-streaming completion used for background work (memory summarisation),
 * where we only care about the final text.
 */
export async function jsonCompletion({
  system,
  user,
  model = SUMMARY_MODEL,
  temperature = 0.2,
  signal,
}) {
  const requestSignal = createRequestSignal(signal, REQUEST_TIMEOUT_MS);

  try {
    const res = await post(
      {
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature,
        max_tokens: 700,
        response_format: { type: "json_object" },
      },
      requestSignal
    );

    const data = await res.json().catch(() => null);
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;

    try {
      return JSON.parse(content);
    } catch {
      console.error("[DrDormn] Summariser returned non-JSON output");
      return null;
    }
  } finally {
    requestSignal.dispose();
  }
}
