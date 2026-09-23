import DormnAiConversation from "../schemas/dormnAiConversationSchema.js";
import DormnAiMemory from "../schemas/dormnAiMemorySchema.js";
import DormnAiMessage from "../schemas/dormnAiMessageSchema.js";
import User from "../schemas/userSchema.js";
import { buildSystemPrompt, runAgentLoop } from "../services/drDormn/agent.js";
import { GroqError } from "../services/drDormn/groqClient.js";
import {
  clearLongTermMemory,
  getLongTermMemory,
  getShortTermContext,
  maybeSummarize,
} from "../services/drDormn/memory.js";
import { serialize } from "../utils/serialize.js";

const MAX_MESSAGE_LENGTH = 4000;
const MAX_TITLE_LENGTH = 60;

const FALLBACK_REPLY =
  "Sorry, I couldn't finish that thought. Please try asking again.";

const titleFrom = (text) => {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= MAX_TITLE_LENGTH) return clean || "New chat";
  return `${clean.slice(0, MAX_TITLE_LENGTH - 1).trimEnd()}…`;
};

const parseId = (value) => {
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : null;
};

// @route   POST /api/dr-dormn/chat
// @desc    Stream a Dr.Dormn AI reply over Server-Sent Events
export const streamChat = async (req, res) => {
  const userId = Number(req.user.id);

  try {
    const message =
      typeof req.body?.message === "string" ? req.body.message.trim() : "";

    if (!message) {
      return res
        .status(400)
        .json({ success: false, message: "A message is required." });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Message is too long. Please keep it under ${MAX_MESSAGE_LENGTH} characters.`,
      });
    }

    // ── Resolve the conversation ──
    let requestedId = parseId(req.body?.conversationId);
    let title = titleFrom(message);

    if (requestedId) {
      const existing = await DormnAiConversation.findOne({
        _id: requestedId,
        user_id: userId,
      })
        .select("_id title")
        .lean();

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found.",
        });
      }

      title = existing.title;
    } else {
      const created = await DormnAiConversation.create({
        user_id: userId,
        title,
        last_message_at: new Date(),
      });
      requestedId = created._id;
    }

    const conversationId = requestedId;
    // A regenerate re-answers the previous user turn (used by the UI's retry),
    // so it must not store the question twice.
    const isRegenerate = req.body?.regenerate === true;

    // Context is loaded *before* the new user message is stored so the model
    // does not see it twice.
    const [{ messages: history, summary }, memory, user, lastMessage] =
      await Promise.all([
        getShortTermContext(conversationId),
        getLongTermMemory(userId),
        User.findById(userId).select("full_name role").lean(),
        isRegenerate
          ? DormnAiMessage.findOne({
              conversation_id: conversationId,
              user_id: userId,
            })
              .sort({ _id: -1 })
              .select("role")
              .lean()
          : Promise.resolve(null),
      ]);

    const skipUserMessage = isRegenerate && lastMessage?.role === "user";
    let storedTurns = 0;

    if (!skipUserMessage) {
      await DormnAiMessage.create({
        conversation_id: conversationId,
        user_id: userId,
        role: "user",
        content: message,
      });
      storedTurns = 1;
    }

    // `history` holds only the turns *before* this one. The current question has
    // to be appended explicitly, or the model answers the system prompt instead
    // of the user. On a regenerate the question is already the last history
    // entry, so appending it would duplicate it.
    const conversationMessages = skipUserMessage
      ? history
      : [...history, { role: "user", content: message }];

    // ── Open the SSE stream ──
    res.status(200).set({
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders?.();

    let closed = false;
    const abortController = new AbortController();

    res.on("close", () => {
      closed = true;
      abortController.abort();
    });

    const send = (event, data) => {
      if (closed) return;
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    send("meta", { conversationId, title });

    let answer = "";
    let streamError = null;
    let usedTools = [];

    // PG cards come from tool results during the stream; keep them so the
    // assistant turn can be re-rendered with its listings after a reload.
    const collectedPgs = [];
    const seenPgIds = new Set();

    try {
      const result = await runAgentLoop({
        systemPrompt: buildSystemPrompt({
          user,
          memory,
          conversationSummary: summary,
        }),
        history: conversationMessages,
        ctx: { userId, role: req.user.role },
        signal: abortController.signal,
        onEvent: (event) => {
          if (event.type === "token") {
            answer += event.text;
            send("token", { text: event.text });
          } else if (event.type === "status") {
            send("status", { label: event.label });
          } else if (event.type === "pgs") {
            for (const pg of event.pgs || []) {
              if (pg?.id == null || seenPgIds.has(pg.id)) continue;
              seenPgIds.add(pg.id);
              collectedPgs.push(pg);
            }
            send("pgs", { pgs: event.pgs });
          }
        },
      });

      usedTools = result.usedTools;
    } catch (err) {
      if (err.name === "AbortError") {
        closed = true;
      } else {
        streamError = err;
        console.error("[DrDormn] streamChat error:", err.message);
        send("error", {
          message:
            err instanceof GroqError
              ? err.message
              : "Something went wrong while generating a reply. Please try again.",
        });
      }
    }

    const finalText = answer.trim() || (streamError ? "" : FALLBACK_REPLY);

    // ── Persist the assistant turn (partial text is kept on abort) ──
    let assistantId = null;

    if (finalText) {
      const assistant = await DormnAiMessage.create({
        conversation_id: conversationId,
        user_id: userId,
        role: "assistant",
        content: finalText,
        pgs: collectedPgs,
        tool_calls: usedTools.length ? usedTools : null,
      });
      assistantId = assistant._id;
      storedTurns += 1;
    }

    await DormnAiConversation.updateOne(
      { _id: conversationId },
      { $inc: { message_count: storedTurns }, last_message_at: new Date() }
    );

    send("done", { conversationId, assistantId, title });

    if (!closed) res.end();

    // Compaction runs after the response so it never delays the user.
    if (!streamError) {
      maybeSummarize(conversationId).catch(() => {});
    }
  } catch (err) {
    console.error("[DrDormn] streamChat fatal error:", err);

    if (res.headersSent) {
      res.write(
        `event: error\ndata: ${JSON.stringify({ message: "Unexpected server error." })}\n\n`
      );
      res.end();
      return;
    }

    return res.status(500).json({
      success: false,
      message: "Failed to start the AI response.",
    });
  }
};

// @route   GET /api/dr-dormn/conversations
// @desc    List the user's Dr.Dormn chats for the sidebar
export const listConversations = async (req, res) => {
  try {
    const conversations = await DormnAiConversation.find({
      user_id: Number(req.user.id),
    })
      .sort({ updated_at: -1 })
      .limit(50)
      .select("title message_count last_message_at created_at updated_at")
      .lean();

    return res.status(200).json({
      success: true,
      conversations: serialize(conversations),
    });
  } catch (err) {
    console.error("[DrDormn] listConversations error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to load your chats." });
  }
};

// @route   GET /api/dr-dormn/conversations/:id/messages
// @desc    Full transcript of one of the user's chats
export const getConversationMessages = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const conversationId = parseId(req.params.id);

    if (!conversationId) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid conversation id." });
    }

    const conversation = await DormnAiConversation.findOne({
      _id: conversationId,
      user_id: userId,
    })
      .select("title")
      .lean();

    if (!conversation) {
      return res
        .status(404)
        .json({ success: false, message: "Conversation not found." });
    }

    const messages = await DormnAiMessage.find({
      conversation_id: conversationId,
      user_id: userId,
    })
      .sort({ _id: 1 })
      .select("role content pgs created_at")
      .lean();

    return res.status(200).json({
      success: true,
      conversation: { id: conversation._id, title: conversation.title },
      messages: serialize(messages),
    });
  } catch (err) {
    console.error("[DrDormn] getConversationMessages error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to load that chat." });
  }
};

// @route   PATCH /api/dr-dormn/conversations/:id
// @desc    Rename a chat
export const renameConversation = async (req, res) => {
  try {
    const conversationId = parseId(req.params.id);
    const title =
      typeof req.body?.title === "string" ? req.body.title.trim() : "";

    if (!conversationId) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid conversation id." });
    }

    if (!title || title.length > 120) {
      return res.status(400).json({
        success: false,
        message: "Title must be between 1 and 120 characters.",
      });
    }

    const result = await DormnAiConversation.updateOne(
      { _id: conversationId, user_id: Number(req.user.id) },
      { title }
    );

    if (result.matchedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Conversation not found." });
    }

    return res.status(200).json({ success: true, title });
  } catch (err) {
    console.error("[DrDormn] renameConversation error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to rename that chat." });
  }
};

// @route   DELETE /api/dr-dormn/conversations/:id
// @desc    Delete a chat and its messages
export const deleteConversation = async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const conversationId = parseId(req.params.id);

    if (!conversationId) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid conversation id." });
    }

    const result = await DormnAiConversation.deleteOne({
      _id: conversationId,
      user_id: userId,
    });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Conversation not found." });
    }

    await DormnAiMessage.deleteMany({
      conversation_id: conversationId,
      user_id: userId,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[DrDormn] deleteConversation error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete that chat." });
  }
};

// @route   DELETE /api/dr-dormn/conversations
// @desc    Delete every chat the user has
export const clearAllConversations = async (req, res) => {
  try {
    const userId = Number(req.user.id);

    await Promise.all([
      DormnAiConversation.deleteMany({ user_id: userId }),
      DormnAiMessage.deleteMany({ user_id: userId }),
    ]);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[DrDormn] clearAllConversations error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to clear your chats." });
  }
};

// @route   GET /api/dr-dormn/memory
// @desc    Show what Dr.Dormn remembers about the user
export const getMemory = async (req, res) => {
  try {
    const memory = await DormnAiMemory.findOne({
      user_id: Number(req.user.id),
    }).lean();

    if (!memory) {
      return res.status(200).json({
        success: true,
        memory: { summary: "", facts: [], preferences: {} },
      });
    }

    return res.status(200).json({
      success: true,
      memory: {
        summary: memory.summary || "",
        facts: memory.facts || [],
        preferences: memory.preferences || {},
        updated_at: memory.last_updated_at,
      },
    });
  } catch (err) {
    console.error("[DrDormn] getMemory error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to load stored memory." });
  }
};

// @route   DELETE /api/dr-dormn/memory
// @desc    Forget everything Dr.Dormn has learned about the user
export const deleteMemory = async (req, res) => {
  try {
    await clearLongTermMemory(Number(req.user.id));
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[DrDormn] deleteMemory error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to clear stored memory." });
  }
};
