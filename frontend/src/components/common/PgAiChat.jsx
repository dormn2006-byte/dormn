import { useState, useRef, useEffect, useCallback, memo } from "react";
import { Send, X, Square, Sparkles, MessageCircle, AlertCircle } from "lucide-react";
import { streamPgAiChat } from "../../services/pgAiApi";

const BOT_AVATAR = "/icons/dr.dormn-removebg-preview.png";

const QUICK_PROMPTS = [
  { label: "💸 Rent & rooms", query: "What is the monthly rent and which room options are available?" },
  { label: "✨ Amenities", query: "What amenities does this PG offer?" },
  { label: "📜 Rules", query: "What are the house rules of this PG?" },
  { label: "📍 Location", query: "Where exactly is this PG located?" },
];

// Lightweight inline renderer: **bold** only (no raw HTML).
const renderInline = (text, keyPrefix) => {
  const pattern = /\*\*([^*]+)\*\*/g;
  const nodes = [];
  let lastIndex = 0;
  let index = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    nodes.push(
      <strong key={`${keyPrefix}-b${index}`} className="font-black">
        {match[1]}
      </strong>
    );
    lastIndex = pattern.lastIndex;
    index += 1;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes.length ? nodes : [text];
};

const MessageBody = ({ text }) => {
  const blocks = [];
  let list = [];

  const flushList = () => {
    if (list.length === 0) return;
    blocks.push(<ul key={`ul-${blocks.length}`} className="space-y-0.5 my-0.5">{list}</ul>);
    list = [];
  };

  text.split("\n").forEach((rawLine, index) => {
    const line = rawLine.trimEnd();
    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);

    if (bullet) {
      list.push(
        <li key={`li-${index}`} className="flex gap-1.5">
          <span className="text-[#93B733] shrink-0">•</span>
          <span>{renderInline(bullet[1], `li-${index}`)}</span>
        </li>
      );
      return;
    }

    flushList();
    if (!line.trim()) return;
    blocks.push(<p key={`p-${index}`}>{renderInline(line, `p-${index}`)}</p>);
  });

  flushList();
  return <div className="space-y-1">{blocks}</div>;
};

const TypingDots = () => (
  <div className="flex gap-1 py-0.5">
    <span className="w-1.5 h-1.5 bg-[#93B733] rounded-full animate-bounce [animation-delay:0ms]" />
    <span className="w-1.5 h-1.5 bg-[#93B733] rounded-full animate-bounce [animation-delay:150ms]" />
    <span className="w-1.5 h-1.5 bg-[#93B733] rounded-full animate-bounce [animation-delay:300ms]" />
  </div>
);

/**
 * AI manager chatbot for a single PG listing. Works without login — anyone on
 * the page can ask questions about this specific PG.
 *
 * Two variants:
 *  - "floating" (default): a fixed launcher button + collapsible chat panel,
 *    used on mobile / smaller screens.
 *  - "inline": a normal, non-sticky chat section rendered in the page flow
 *    (used on the desktop listing, right under "About this PG").
 */
export const PgAiChat = memo(({ pgId, pgTitle, variant = "floating", className = "" }) => {
  const isInline = variant === "inline";
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");

  const chatEndRef = useRef(null);
  const chatScrollRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  const hasChatted = messages.length > 0;
  // Inline sections are always "open" — the chat body is always visible.
  const isPanelOpen = isInline ? true : open;

  useEffect(() => {
    // Scroll only the messages container — never the page. This keeps the
    // layout pinned so a new message doesn't bump the whole webpage down.
    if (isPanelOpen && hasChatted) {
      const el = chatScrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [messages, isStreaming, isPanelOpen, hasChatted]);

  // Abort any in-flight stream when the panel is closed / unmounted.
  useEffect(() => {
    if (!open) abortRef.current?.abort();
  }, [open]);
  useEffect(() => () => abortRef.current?.abort(), []);

  const patchAssistant = useCallback((patch) => {
    setMessages((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i >= 0; i -= 1) {
        if (next[i].role === "assistant") {
          next[i] =
            typeof patch === "function" ? patch(next[i]) : { ...next[i], ...patch };
          break;
        }
      }
      return next;
    });
  }, []);

  const handleSend = useCallback(
    async (text) => {
      const msg = (text ?? input).trim();
      if (!msg || isStreaming) return;

      setError("");
      setMessages((prev) => [
        ...prev,
        { role: "user", text: msg },
        { role: "assistant", text: "", streaming: true, error: null },
      ]);
      setInput("");
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      // Send the recent turns as context (drop the still-streaming placeholder).
      const history = messages
        .filter((m) => m.text)
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.text }));

      try {
        await streamPgAiChat({
          pgId,
          message: msg,
          history,
          signal: controller.signal,
          onEvent: (event, payload) => {
            if (event === "token") {
              patchAssistant((m) => ({ ...m, text: m.text + payload.text }));
            } else if (event === "error") {
              patchAssistant((m) => ({
                ...m,
                error: payload?.message || "Something went wrong.",
              }));
            }
          },
        });
      } catch (err) {
        if (err?.name === "AbortError") {
          patchAssistant((m) => ({ ...m, error: m.text ? null : "Response stopped." }));
        } else {
          patchAssistant((m) => ({
            ...m,
            error: err?.message || "Could not reach the AI manager. Please try again.",
          }));
        }
      } finally {
        patchAssistant({ streaming: false });
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [input, isStreaming, pgId, messages, patchAssistant]
  );

  const handleStop = useCallback(() => abortRef.current?.abort(), []);
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const openPanel = () => {
    setError("");
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 120);
  };

  // ── Shared chat body (used by both the inline section and floating panel) ──
  const chatBody = (
    <>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-gray-200/80 dark:border-white/10 bg-inherit text-gray-900 dark:text-white shrink-0">
        <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#93B733]/15 shrink-0">
          <img src={BOT_AVATAR} alt="AI manager" className="w-7 h-7 object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black leading-tight flex items-center gap-1.5">
            <Sparkles size={13} className="text-[#4E700F] dark:text-[#93B733]" /> AI Manager
          </p>
          <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 truncate">
            {pgTitle ? `Ask about ${pgTitle}` : "Ask about this PG"}
          </p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
        </span>
        {!isInline && (
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition cursor-pointer"
            title="Close chat"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={chatScrollRef} className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5 bg-[#FAF9F5] dark:bg-[#0d0f16] scrollbar-thin">
        {!hasChatted && !isStreaming ? (
          <div className="text-center pt-4">
            <div className="mx-auto w-14 h-14 flex items-center justify-center mb-2">
              <img src={BOT_AVATAR} alt="AI manager" className="w-full h-full object-contain" />
            </div>
            <p className="text-xs font-black text-gray-800 dark:text-white">
              Hi! I'm the <span className="text-[#4E700F] dark:text-[#93B733]">AI manager</span> for this PG.
            </p>
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mt-1">
              Ask me anything about the rent, rooms, amenities, rules or location.
            </p>
          </div>
        ) : null}

        {messages.map((msg, i) => (
          <div key={i} className={`flex items-start gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-6 h-6 flex items-center justify-center shrink-0 mt-0.5">
                <img src={BOT_AVATAR} alt="AI" className="w-full h-full object-contain" />
              </div>
            )}
            <div
              className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-[#0D3A1D] text-white font-semibold rounded-br-xs"
                  : "bg-white dark:bg-[#161a28] text-gray-900 dark:text-gray-100 border border-gray-200/80 dark:border-white/10 rounded-tl-xs"
              }`}
            >
              {msg.role === "assistant" ? (
                msg.text ? (
                  <MessageBody text={msg.text} />
                ) : msg.streaming ? (
                  <TypingDots />
                ) : null
              ) : (
                msg.text
              )}

              {msg.error && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-white/10 flex items-start gap-1.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                  <AlertCircle size={12} className="shrink-0 mt-0.5" />
                  <span>{msg.error}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {error && !messages.length && (
          <p className="text-center text-[11px] font-semibold text-rose-500">{error}</p>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quick prompts */}
      {!hasChatted && (
        <div className="px-3 pb-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {QUICK_PROMPTS.map((item) => (
            <button
              key={item.label}
              onClick={() => handleSend(item.query)}
              disabled={isStreaming}
              className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white dark:bg-[#161a28] border border-gray-200 hover:border-[#93B733]/60 dark:border-white/10 dark:hover:border-[#93B733]/50 text-[10px] font-bold text-[#0D3A1D] dark:text-[#93B733] transition cursor-pointer disabled:opacity-40"
            >
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Composer */}
      <div className="p-2.5 border-t border-gray-200/80 dark:border-white/10 bg-white dark:bg-[#0d0f16] flex items-center gap-1.5 shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isStreaming}
          placeholder="Ask about this PG..."
          className="flex-1 bg-transparent text-xs font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none disabled:opacity-60"
        />
        {isStreaming ? (
          <button
            onClick={handleStop}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500 hover:bg-rose-600 text-white transition active:scale-95 cursor-pointer shrink-0"
            title="Stop"
          >
            <Square size={11} className="fill-current" />
          </button>
        ) : (
          <button
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0D3A1D] hover:bg-[#16502a] text-white disabled:opacity-30 disabled:cursor-not-allowed transition active:scale-95 cursor-pointer shrink-0"
            title="Send"
          >
            <Send size={13} />
          </button>
        )}
      </div>
    </>
  );

  if (isInline) {
    return (
      <div className={`rounded-xl sm:rounded-[2rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0d0d0d] shadow-sm md:rounded-[2.5rem] overflow-hidden ${className}`}>
        <div className="flex flex-col h-[26rem] sm:h-[30rem]">{chatBody}</div>
      </div>
    );
  }

  return (
    <>
      {/* ── Chat panel ── */}
      {isPanelOpen && (
        <div className="fixed bottom-24 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm sm:bottom-28 sm:right-6 sm:w-[24rem] h-[26rem] sm:h-[30rem] flex flex-col overflow-hidden rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0d0f16] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          {chatBody}
        </div>
      )}

      {/* ── Floating launcher button ── */}
      {!isPanelOpen && (
        <button
          onClick={openPanel}
          className="fixed bottom-6 right-4 sm:bottom-8 sm:right-6 z-50 group flex items-center gap-2 rounded-full bg-[#0D3A1D] hover:bg-[#16502a] text-white pl-2 pr-3 sm:pr-4 py-2 shadow-xl shadow-[#0D3A1D]/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Ask the AI manager about this PG"
        >
          <span className="relative w-8 h-8 flex items-center justify-center">
            <img src={BOT_AVATAR} alt="AI manager" className="w-7 h-7 object-contain" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0D3A1D] animate-pulse" />
          </span>
          <span className="hidden sm:inline text-xs font-black tracking-wide">
            Ask the AI Manager
          </span>
          <MessageCircle size={15} className="text-[#93B733] sm:hidden" />
        </button>
      )}
    </>
  );
});

PgAiChat.displayName = "PgAiChat";
export default PgAiChat;