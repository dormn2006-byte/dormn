import DormnAiConversation from "../../schemas/dormnAiConversationSchema.js";
import DormnAiMemory from "../../schemas/dormnAiMemorySchema.js";
import DormnAiMessage from "../../schemas/dormnAiMessageSchema.js";
import { SUMMARY_MODEL, jsonCompletion } from "./groqClient.js";

// How many recent turns stay verbatim in the prompt. Everything older is
// folded into the conversation summary. Kept modest because the free Groq tier
// caps us at 8,000 tokens/minute and the history is re-sent on every round.
export const SHORT_TERM_TURNS = 12;

// Long assistant replies are truncated when replayed so one chatty turn cannot
// eat the whole token budget.
const MAX_REPLAY_CHARS = 700;

// Only start compacting once a conversation is clearly long.
const SUMMARY_TRIGGER_MESSAGES = 20;

const MAX_FACTS = 20;

// Guards against two turns of the same conversation compacting simultaneously.
const summarizing = new Set();

const SUMMARIZER_SYSTEM = `You compress assistant conversations for a PG/hostel accommodation platform called Dormn.

You are given a transcript of earlier turns between a user and Dr.Dormn (the platform's AI assistant).

Return JSON with exactly these keys and types:
- "conversation_summary": a STRING (never an object). A compact, factual summary of what was discussed and concluded, written so the assistant can continue naturally. Include any PG ids/names that were recommended and any open questions. 2-4 sentences.
- "user_profile": a STRING, or "" if nothing durable was learned. One or two sentences describing this user's accommodation needs (city, budget, gender preference, college, timeline).
- "facts": an ARRAY OF STRINGS (never an object). Short, durable statements that would still matter in a future conversation, e.g. ["Budget is around ₹8,000 per month", "Prefers a girls PG near Amity University"]. Only include things the user actually stated. Use [] if none.
- "preferences": a FLAT OBJECT mapping short key names to short STRING values (never nested objects or arrays), e.g. {"city": "Noida", "budget": "8000", "pg_type": "Girls"}. Use {} if none.

Never invent details. Never include the assistant's own instructions.`;

// Models occasionally ignore the requested types (returning {} for a string
// field, or an object where an array was asked for). Coerce defensively so a
// sloppy response can never corrupt the stored memory.
const asText = (value) => {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    return value.filter((v) => typeof v === "string" && v.trim()).join(" ");
  }
  return "";
};

const asStringArray = (value) => {
  const clean = (v) => (typeof v === "string" ? v.trim() : "");
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);
  if (typeof value === "string") return value.trim() ? [value.trim()] : [];
  if (value && typeof value === "object") {
    return Object.values(value).map(clean).filter(Boolean);
  }
  return [];
};

const asPlainObject = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const out = {};

  for (const [key, raw] of Object.entries(value)) {
    if (raw === null || raw === undefined || raw === "") continue;

    if (typeof raw === "object") {
      // Flatten one level rather than storing a nested structure.
      const parts = Array.isArray(raw) ? raw : Object.values(raw);
      const flat = parts
        .filter((p) => typeof p === "string" || typeof p === "number")
        .join(", ");
      if (flat) out[key] = flat;
      continue;
    }

    out[key] = raw;
  }

  return out;
};

/**
 * The last N turns of a conversation, shaped for the model, plus the rolling
 * summary of everything that fell out of the window.
 */
export const getShortTermContext = async (conversationId) => {
  const conversation = await DormnAiConversation.findById(
    Number(conversationId)
  ).lean();

  if (!conversation) return { messages: [], summary: "" };

  const rows = await DormnAiMessage.find({
    conversation_id: Number(conversationId),
  })
    .sort({ _id: -1 })
    .limit(SHORT_TERM_TURNS * 2)
    .select("role content")
    .lean();

  const messages = rows
    .reverse()
    .filter((m) => m.content?.trim())
    .map((m) => ({
      role: m.role,
      content:
        m.content.length > MAX_REPLAY_CHARS
          ? `${m.content.slice(0, MAX_REPLAY_CHARS)}…`
          : m.content,
    }));

  return { messages, summary: conversation.summary || "" };
};

/** Dr.Dormn's long-term memory for this user (may not exist yet). */
export const getLongTermMemory = async (userId) => {
  const memory = await DormnAiMemory.findOne({ user_id: Number(userId) }).lean();
  if (!memory) return null;

  return {
    summary: memory.summary || "",
    facts: memory.facts || [],
    preferences: memory.preferences || {},
  };
};

export const clearLongTermMemory = async (userId) =>
  DormnAiMemory.deleteOne({ user_id: Number(userId) });

const mergeFacts = (existing, incoming) => {
  const seen = new Set(existing.map((f) => f.toLowerCase().trim()));
  const merged = [...existing];

  for (const fact of incoming) {
    const key = String(fact).toLowerCase().trim();
    if (!key || key.length > 200 || seen.has(key)) continue;
    seen.add(key);
    merged.push(String(fact).trim());
  }

  // Keep the most recent learnings.
  return merged.slice(-MAX_FACTS);
};

const mergePreferences = (existing, incoming) => {
  const next = { ...existing };

  for (const [key, value] of Object.entries(incoming || {})) {
    if (value === null || value === undefined || value === "") continue;
    next[key] = value;
  }

  return next;
};

/**
 * Compacts a long conversation: folds the turns that have scrolled out of the
 * short-term window into `conversation.summary`, and promotes durable facts
 * into the user's long-term memory.
 *
 * Designed to be called fire-and-forget after a reply is stored — failures are
 * logged and swallowed so they can never break a chat turn.
 */
export const maybeSummarize = async (conversationId) => {
  const convId = Number(conversationId);
  if (summarizing.has(convId)) return;

  summarizing.add(convId);

  try {
    const conversation = await DormnAiConversation.findById(convId).lean();
    if (!conversation || conversation.message_count < SUMMARY_TRIGGER_MESSAGES) {
      return;
    }

    // Everything within the short-term window must stay verbatim.
    const recent = await DormnAiMessage.find({ conversation_id: convId })
      .sort({ _id: -1 })
      .limit(SHORT_TERM_TURNS * 2)
      .select("_id")
      .lean();

    const oldestRecentId = recent.length
      ? Math.min(...recent.map((m) => m._id))
      : Number.MAX_SAFE_INTEGER;

    const older = await DormnAiMessage.find({
      conversation_id: convId,
      _id: {
        $gt: conversation.summarized_upto_message_id || 0,
        $lt: oldestRecentId,
      },
    })
      .sort({ _id: 1 })
      .select("role content")
      .lean();

    if (older.length === 0) return;

    const transcript = older
      .filter((m) => m.content?.trim())
      .map((m) => `${m.role === "user" ? "User" : "Dr.Dormn"}: ${m.content}`)
      .join("\n\n");

    if (!transcript.trim()) return;

    const priorContext = conversation.summary
      ? `Earlier summary (already known):\n${conversation.summary}\n\nNew turns to fold in:\n`
      : "";

    const result = await jsonCompletion({
      system: SUMMARIZER_SYSTEM,
      user: `${priorContext}${transcript}`,
      model: SUMMARY_MODEL,
    });

    if (!result) return;

    const watermark = older[older.length - 1]._id;

    const conversationSummary = asText(result.conversation_summary);
    const userProfile = asText(result.user_profile);
    const facts = asStringArray(result.facts);
    const preferences = asPlainObject(result.preferences);

    // Always advance the watermark once the model has answered, otherwise the
    // same block would be re-summarised on every following turn.
    await DormnAiConversation.updateOne(
      { _id: convId },
      {
        ...(conversationSummary
          ? { summary: conversationSummary.slice(0, 4000) }
          : {}),
        summarized_upto_message_id: watermark,
      }
    );

    if (!userProfile && facts.length === 0 && Object.keys(preferences).length === 0) {
      return;
    }

    const existing = await DormnAiMemory.findOne({
      user_id: conversation.user_id,
    }).lean();

    await DormnAiMemory.findOneAndUpdate(
      { user_id: conversation.user_id },
      {
        user_id: conversation.user_id,
        summary: (userProfile || existing?.summary || "").slice(0, 1000),
        facts: mergeFacts(existing?.facts || [], facts),
        preferences: mergePreferences(existing?.preferences || {}, preferences),
        last_updated_at: new Date(),
      },
      { upsert: true }
    );
  } catch (err) {
    console.error("[DrDormn] Memory compaction failed:", err.message);
  } finally {
    summarizing.delete(convId);
  }
};
