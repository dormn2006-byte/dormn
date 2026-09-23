import API from "./api";

const API_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "http://localhost:8000/api";

/**
 * Streams a Dr.Dormn reply.
 *
 * The endpoint is a POST that returns Server-Sent Events, so EventSource can't
 * be used — we read the response body manually and parse the frames.
 *
 * `onEvent(eventName, payload)` receives: meta | status | token | pgs | error | done
 * Returns once the stream closes. Pass an AbortSignal to support a Stop button.
 *
 * Set `regenerate: true` to answer the previous user turn again without storing
 * a duplicate message (used when retrying a failed reply).
 */
export const streamChat = async ({
  conversationId,
  message,
  regenerate = false,
  onEvent,
  signal,
}) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/dr-dormn/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      conversationId: conversationId ?? null,
      message,
      regenerate,
    }),
    signal,
  });

  if (!res.ok) {
    let detail = "Could not reach Dr.Dormn. Please try again.";
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

export const getConversations = async () => {
  const { data } = await API.get("/dr-dormn/conversations");
  return data.conversations || [];
};

export const getConversationMessages = async (conversationId) => {
  const { data } = await API.get(
    `/dr-dormn/conversations/${conversationId}/messages`
  );
  return data.messages || [];
};

export const renameConversation = async (conversationId, title) => {
  const { data } = await API.patch(`/dr-dormn/conversations/${conversationId}`, {
    title,
  });
  return data;
};

export const deleteConversation = async (conversationId) => {
  const { data } = await API.delete(`/dr-dormn/conversations/${conversationId}`);
  return data;
};

export const clearAllConversations = async () => {
  const { data } = await API.delete("/dr-dormn/conversations");
  return data;
};

export const getMemory = async () => {
  const { data } = await API.get("/dr-dormn/memory");
  return data.memory;
};

export const clearMemory = async () => {
  const { data } = await API.delete("/dr-dormn/memory");
  return data;
};
