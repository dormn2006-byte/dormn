// Tiny SSE client for the per-PG "AI manager" chatbot on each listing page.
// Unlike the main Dr.Dormn chat this endpoint is public (no login) and
// stateless — the browser sends the recent history with every request.

const API_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "http://localhost:8000/api";

/**
 * Streams an AI-manager reply for a given PG.
 *
 * `onEvent(event, payload)` receives: token | error | done
 * Pass an AbortSignal to support a Stop button.
 */
export const streamPgAiChat = async ({ pgId, message, history, onEvent, signal }) => {
  const res = await fetch(`${API_URL}/pg-ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pgId, message, history }),
    signal,
  });

  if (!res.ok) {
    let detail = "Could not reach the AI manager. Please try again.";
    try {
      const data = await res.json();
      if (data?.message) detail = data.message;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(detail);
  }

  if (!res.body) {
    throw new Error("Your browser does not support streaming responses.");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const handleFrame = (frame) => {
    let eventName = "message";
    let data = "";

    for (const line of frame.split("\n")) {
      if (line.startsWith("event:")) eventName = line.slice(6).trim();
      else if (line.startsWith("data:")) data += line.slice(5).trim();
    }

    if (!data) return;

    try {
      onEvent?.(eventName, JSON.parse(data));
    } catch {
      /* ignore malformed frame */
    }
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const frames = buffer.split("\n\n");
      buffer = frames.pop() ?? "";
      frames.forEach(handleFrame);
    }

    if (buffer.trim()) handleFrame(buffer);
  } finally {
    reader.cancel().catch(() => {});
  }
};