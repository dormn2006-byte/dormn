import { useState, useEffect, useRef, useCallback, memo } from "react";
import { Link } from "react-router-dom";
import {
  Send, User, Sparkles, RefreshCw, PanelLeft, Plus, MessageSquare, Trash2,
  Clock, X, Square, AlertCircle, MapPin, BrainCircuit, Building2,
} from "lucide-react";
import { IMAGE_BASE_URL } from "../../services/api";
import {
  clearMemory,
  deleteConversation,
  getConversationMessages,
  getConversations,
  streamChat,
} from "../../services/drDormnApi";

const BOT_AVATAR = "/icons/dr.dormn-removebg-preview.png";

// ══════════════════════════════════════════════════════════════
// QUICK SUGGESTION CARDS
// ══════════════════════════════════════════════════════════════
const QUICK_PROMPTS = [
  {
    icon: "🔍",
    title: "Find a PG for me",
    subtitle: "Search real listings",
    query: "I'm looking for a PG. Can you help me find one?",
  },
  {
    icon: "🏫",
    title: "PG near my college",
    subtitle: "Search by landmark",
    query: "Find me a PG near Amity University under ₹9000 per month.",
  },
  {
    icon: "💰",
    title: "Rent & Invoices",
    subtitle: "How payments work",
    query: "How do I pay my rent and view my invoices?",
  },
  {
    icon: "🔧",
    title: "Raise a Request",
    subtitle: "Maintenance & repairs",
    query: "How do I raise a maintenance and repair request?",
  },
  {
    icon: "🍽️",
    title: "Mess & Curfew",
    subtitle: "Rules & timings",
    query: "What are the mess timings and the gate curfew rules?",
  },
  {
    icon: "📌",
    title: "My Bookings",
    subtitle: "Your PG requests",
    query: "Show me my bookings and their current status.",
  },
];

// ══════════════════════════════════════════════════════════════
// LIGHTWEIGHT MARKDOWN RENDERER (bold + links, no raw HTML)
// ══════════════════════════════════════════════════════════════
const renderInline = (text, keyPrefix) => {
  const pattern = /(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)\s]+\))/g;
  const nodes = [];
  let lastIndex = 0;
  let index = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));

    const token = match[0];

    if (token.startsWith("**")) {
      nodes.push(
        <strong key={`${keyPrefix}-b${index}`} className="font-black">
          {token.slice(2, -2)}
        </strong>
      );
    } else {
      const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(token);
      const label = link[1];
      const href = link[2];
      const className =
        "font-bold text-[#4E700F] dark:text-[#93B733] underline underline-offset-2 hover:text-[#0D3A1D] dark:hover:text-[#a8d63a]";

      nodes.push(
        href.startsWith("/") ? (
          <Link key={`${keyPrefix}-l${index}`} to={href} className={className}>
            {label}
          </Link>
        ) : (
          <a
            key={`${keyPrefix}-l${index}`}
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            className={className}
          >
            {label}
          </a>
        )
      );
    }

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
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="space-y-1 my-0.5">
        {list}
      </ul>
    );
    list = [];
  };

  text.split("\n").forEach((rawLine, index) => {
    const line = rawLine.trimEnd();
    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    const heading = /^\s*#{1,4}\s+(.*)$/.exec(line);

    if (bullet) {
      list.push(
        <li key={`li-${index}`} className="flex gap-1.5">
          <span className="text-[#93B733] shrink-0">•</span>
          <span className="min-w-0">{renderInline(bullet[1], `li-${index}`)}</span>
        </li>
      );
      return;
    }

    if (numbered) {
      list.push(
        <li key={`li-${index}`} className="flex gap-1.5">
          <span className="text-[#93B733] font-bold shrink-0">
            {list.length + 1}.
          </span>
          <span className="min-w-0">{renderInline(numbered[1], `li-${index}`)}</span>
        </li>
      );
      return;
    }

    flushList();

    if (!line.trim()) return;

    blocks.push(
      heading ? (
        <p key={`h-${index}`} className="font-black mt-1.5 first:mt-0">
          {renderInline(heading[1], `h-${index}`)}
        </p>
      ) : (
        <p key={`p-${index}`}>{renderInline(line, `p-${index}`)}</p>
      )
    );
  });

  flushList();
  return <div className="space-y-1.5">{blocks}</div>;
};

// ══════════════════════════════════════════════════════════════
// PG RESULT CARD (rendered from tool output)
// ══════════════════════════════════════════════════════════════
const PGCard = ({ pg }) => {
  const image = pg.image ? `${IMAGE_BASE_URL}/uploads/${pg.image}` : null;
  const place = [pg.area, pg.city].filter(Boolean).join(", ");

  return (
    <Link
      to={`/pg/${pg.id}`}
      className="group flex items-center gap-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0f141f] p-2 hover:border-[#93B733] dark:hover:border-[#93B733]/60 hover:shadow-sm transition-all"
    >
      <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-white/5 shrink-0">
        {image ? (
          <img
            src={image}
            alt={pg.title}
            loading="lazy"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 size={18} className="text-gray-400" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-extrabold truncate text-[#0D3A1D] dark:text-[#93B733] group-hover:text-[#4E700F] dark:group-hover:text-[#a8d63a] transition-colors">
          {pg.title}
        </p>

        {place && (
          <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
            <MapPin size={9} className="shrink-0" />
            {place}
          </p>
        )}

        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {pg.rent_per_month ? (
            <span className="text-[11px] font-black text-[#0D3A1D] dark:text-white">
              ₹{Number(pg.rent_per_month).toLocaleString("en-IN")}
              <span className="text-[9px] font-bold text-gray-400">/mo</span>
            </span>
          ) : null}

          {pg.pg_type && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#93B733]/15 text-[#4E700F] dark:text-[#93B733]">
              {pg.pg_type}
            </span>
          )}

          {Number(pg.rooms_available) > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              {pg.rooms_available} left
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

const TypingDots = () => (
  <div className="flex gap-1 sm:gap-1.5 py-0.5">
    <span className="w-1.5 h-1.5 bg-[#93B733] rounded-full animate-bounce [animation-delay:0ms]" />
    <span className="w-1.5 h-1.5 bg-[#93B733] rounded-full animate-bounce [animation-delay:150ms]" />
    <span className="w-1.5 h-1.5 bg-[#93B733] rounded-full animate-bounce [animation-delay:300ms]" />
  </div>
);

// ══════════════════════════════════════════════════════════════
// MAIN CHAT
// ══════════════════════════════════════════════════════════════
export const DrDormnChat = memo(({ userName }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);

  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [statusLabel, setStatusLabel] = useState(null);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  const hasChatted = messages.length > 0;

  const refreshConversations = useCallback(async () => {
    try {
      setConversations(await getConversations());
    } catch {
      /* sidebar refresh is best-effort */
    }
  }, []);

  useEffect(() => {
    refreshConversations().finally(() => setIsLoadingConversations(false));
  }, [refreshConversations]);

  // Abort any in-flight stream on unmount.
  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (hasChatted) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isStreaming, hasChatted]);

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
    async (text, { regenerate = false } = {}) => {
      const msg = (text ?? input).trim();
      if (!msg || isStreaming) return;

      const blank = {
        role: "assistant",
        text: "",
        pgs: [],
        streaming: true,
        error: null,
      };

      setMessages((prev) =>
        regenerate
          ? [...prev, blank]
          : [...prev, { role: "user", text: msg }, blank]
      );

      setInput("");
      setIsStreaming(true);
      setStatusLabel("Thinking…");

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await streamChat({
          conversationId: activeConvId,
          message: msg,
          regenerate,
          signal: controller.signal,
          onEvent: (event, payload) => {
            if (event === "meta") {
              if (payload?.conversationId) setActiveConvId(payload.conversationId);
            } else if (event === "status") {
              setStatusLabel(payload?.label || null);
            } else if (event === "token") {
              patchAssistant((m) => ({ ...m, text: m.text + payload.text }));
            } else if (event === "pgs") {
              patchAssistant((m) => {
                const seen = new Set((m.pgs || []).map((p) => p.id));
                const merged = [...(m.pgs || [])];
                for (const pg of payload.pgs || []) {
                  if (!seen.has(pg.id)) merged.push(pg);
                }
                return { ...m, pgs: merged };
              });
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
            error: err?.message || "Something went wrong. Please try again.",
          }));
        }
      } finally {
        patchAssistant({ streaming: false });
        setIsStreaming(false);
        setStatusLabel(null);
        abortRef.current = null;
        refreshConversations();
      }
    },
    [input, isStreaming, activeConvId, patchAssistant, refreshConversations]
  );

  const handleStop = useCallback(() => abortRef.current?.abort(), []);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const closeSidebarOnMobile = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleStartNewChat = () => {
    if (isStreaming) return;
    setActiveConvId(null);
    setMessages([]);
    setInput("");
    closeSidebarOnMobile();
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSelectConversation = async (convId) => {
    closeSidebarOnMobile();

    if (isStreaming || convId === activeConvId) return;

    setActiveConvId(convId);
    setIsLoadingMessages(true);
    setMessages([]);

    try {
      const history = await getConversationMessages(convId);
      setMessages(
        history.map((m) => ({
          role: m.role,
          text: m.content,
          pgs: [],
          streaming: false,
          error: null,
        }))
      );
    } catch {
      setMessages([
        {
          role: "assistant",
          text: "",
          pgs: [],
          streaming: false,
          error: "Could not load this chat. Please try again.",
        },
      ]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();

    try {
      await deleteConversation(convId);
    } catch {
      /* the list refresh below is the source of truth */
    }

    if (activeConvId === convId) {
      setActiveConvId(null);
      setMessages([]);
    }

    refreshConversations();
  };

  const handleClearMemory = async () => {
    const ok = window.confirm(
      "Clear everything Dr.Dormn remembers about you?\n\nYour chats stay, but future answers won't reuse your saved preferences."
    );
    if (!ok) return;

    try {
      await clearMemory();
      window.alert("Done — Dr.Dormn has forgotten your saved preferences.");
    } catch {
      window.alert("Could not clear memory right now. Please try again.");
    }
  };

  const lastAssistantText = (() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === "assistant") return messages[i].text;
    }
    return "";
  })();

  const showThinkingRow = isStreaming && !lastAssistantText;

  const composer = (
    <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2.5 pl-3 sm:pl-5 rounded-xl sm:rounded-2xl bg-white dark:bg-[#121620] border-2 border-gray-200 dark:border-gray-800/90 shadow-sm focus-within:border-[#93B733] dark:focus-within:border-[#93B733]/80 focus-within:ring-2 focus-within:ring-[#93B733]/15 dark:focus-within:ring-[#93B733]/20 transition-all">
      <input
        ref={inputRef}
        type="text"
        autoFocus
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isStreaming}
        placeholder="Ask Dr.Dormn anything — find a PG, rent, maintenance, curfew..."
        className="flex-1 bg-transparent text-xs sm:text-sm font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none disabled:opacity-60"
      />

      {isStreaming ? (
        <button
          onClick={handleStop}
          className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-sm transition-all active:scale-95 shrink-0 cursor-pointer"
          title="Stop generating"
        >
          <Square className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
        </button>
      ) : (
        <button
          onClick={() => handleSend()}
          disabled={!input.trim()}
          className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-[#0D3A1D] hover:bg-[#16502a] text-white disabled:opacity-30 disabled:cursor-not-allowed shadow-sm transition-all active:scale-95 shrink-0 cursor-pointer"
          title="Send message"
        >
          <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      )}
    </div>
  );

  return (
    <div className="w-full h-full flex transition-all duration-300 relative overflow-hidden bg-white dark:bg-[#070A11]">

      {/* Mobile backdrop for the history drawer */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/60 z-40 animate-[fadeIn_0.2s_ease-out]"
        />
      )}

      {/* ══════════ LEFT SIDEBAR: CHAT HISTORY ══════════ */}
      {isSidebarOpen && (
        <aside className="fixed inset-y-0 left-0 z-50 w-72 sm:w-80 h-full lg:static lg:h-full lg:z-auto flex-shrink-0 bg-white dark:bg-[#111625] border-r border-gray-200/80 dark:border-white/10 p-3 sm:p-4 flex flex-col shadow-2xl lg:shadow-none transition-all duration-300 animate-[slideInLeft_0.25s_ease-out]">

          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={handleStartNewChat}
              disabled={isStreaming}
              className="flex-1 py-2 sm:py-3 px-3 rounded-xl bg-[#0D3A1D] hover:bg-[#16502a] disabled:opacity-50 text-white font-extrabold text-xs tracking-wide flex items-center justify-between shadow-md shadow-[#0D3A1D]/15 transition-all active:scale-[0.98] cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Plus size={15} className="text-[#93B733]" />
                <span>New Conversation</span>
              </div>
              <Sparkles size={13} className="text-[#93B733]" />
            </button>

            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white cursor-pointer"
              title="Close history"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-gray-400 px-2 mb-2">
            <div className="flex items-center gap-1.5">
              <Clock size={12} />
              <span>Previous Chats</span>
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
              {conversations.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 sm:space-y-1.5 pr-1 scrollbar-thin">
            {isLoadingConversations ? (
              <div className="space-y-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-10 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse"
                  />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-10 px-2">
                <MessageSquare className="mx-auto text-gray-300 dark:text-gray-600 mb-2" size={24} />
                <p className="text-xs font-semibold text-gray-400">No chat history yet</p>
                <p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5">
                  Start typing to save conversations!
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = activeConvId === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`group relative flex items-center justify-between p-2.5 sm:p-3 rounded-xl cursor-pointer text-xs font-bold transition-all ${
                      isActive
                        ? "bg-[#93B733]/15 text-[#0D3A1D] dark:text-[#93B733] border border-[#93B733]/30"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <MessageSquare
                        size={13}
                        className={`shrink-0 ${isActive ? "text-[#93B733]" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200"}`}
                      />
                      <span className="truncate text-[11px] sm:text-xs">{conv.title}</span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteConversation(e, conv.id)}
                      className="opacity-0 group-hover:opacity-100 hover:text-rose-500 p-1 transition cursor-pointer text-gray-400"
                      title="Delete chat"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2.5 sm:pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between px-2 gap-2">
            <span className="text-[10px] sm:text-[11px] font-semibold text-gray-400 flex items-center gap-1.5 min-w-0">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="truncate">Resident Assistant</span>
            </span>

            <button
              onClick={handleClearMemory}
              className="text-[10px] font-bold text-gray-400 hover:text-rose-500 flex items-center gap-1 transition cursor-pointer shrink-0"
              title="Clear what Dr.Dormn remembers about you"
            >
              <BrainCircuit size={11} />
              Forget me
            </button>
          </div>
        </aside>
      )}

      {/* ══════════ RIGHT PANE ══════════ */}
      <main className="w-full flex-1 h-full flex flex-col min-w-0 bg-white dark:bg-[#070A11] overflow-hidden transition-all duration-300">

        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3 border-b border-gray-200/80 dark:border-gray-800/80 bg-gray-50/70 dark:bg-[#0B0F19] shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="p-1.5 sm:p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition cursor-pointer border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#121622]"
              title={isSidebarOpen ? "Close history" : "Open history"}
              aria-label="Toggle chat history"
            >
              <PanelLeft size={16} className="text-[#0D3A1D] dark:text-[#93B733]" />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <div className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center shrink-0">
                <img src={BOT_AVATAR} alt="Dr.Dormn" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-black text-gray-900 dark:text-white leading-tight block">
                  Dr.Dormn AI
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-[#4E700F] dark:text-[#93B733] flex items-center gap-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isStreaming ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`}
                  />
                  {isStreaming ? statusLabel || "Working…" : "Online & Ready"}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleStartNewChat}
            disabled={isStreaming}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#121622] text-[11px] sm:text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-40 transition cursor-pointer"
            title="Start new chat"
          >
            <RefreshCw size={11} />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>

        {isLoadingMessages ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#93B733] border-t-transparent" />
          </div>
        ) : !hasChatted ? (
          /* ── EMPTY STATE ── */
          <div className="flex-1 min-h-0 flex flex-col justify-between sm:justify-center items-center px-3 sm:px-8 py-2.5 sm:py-8 overflow-y-auto animate-in fade-in duration-200">
            <div className="w-full max-w-4xl flex flex-col items-center justify-between sm:justify-center h-full sm:h-auto sm:my-auto">

              <div className="flex flex-col items-center text-center my-auto sm:my-0 sm:mb-8 group pt-2 sm:pt-0 shrink-0">
                <div className="relative mb-2 sm:mb-3.5 flex items-center justify-center">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                    <img
                      src={BOT_AVATAR}
                      alt="Dr.Dormn AI"
                      className="w-full h-full object-contain drop-shadow-md"
                    />
                  </div>
                </div>

                <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                  Dr.Dormn <span className="text-[#4E700F] dark:text-[#93B733]">AI</span>
                </h1>
                <p className="text-[10px] sm:text-sm font-semibold text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1 max-w-md">
                  Ask me anything — I search real PG listings, explain how Dormn works,
                  and check your bookings.
                </p>
              </div>

              <div className="w-full flex flex-col mt-auto sm:mt-0 shrink-0 pb-1 sm:pb-0">
                <div className="w-full grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 mb-2.5 sm:mb-5">
                  {QUICK_PROMPTS.map((item) => (
                    <button
                      key={item.title}
                      onClick={() => handleSend(item.query)}
                      disabled={isStreaming}
                      className="group flex items-center gap-2 sm:gap-3.5 p-2 sm:px-5 sm:py-4 rounded-xl sm:rounded-2xl bg-gray-50/90 hover:bg-gray-100/90 dark:bg-[#121620] dark:hover:bg-[#181e2b] border border-gray-200/90 hover:border-[#93B733] dark:border-gray-800/90 dark:hover:border-[#93B733]/60 shadow-xs hover:shadow-md transition-all duration-200 text-left cursor-pointer active:scale-[0.98] disabled:opacity-50"
                    >
                      <span className="text-lg sm:text-3xl select-none shrink-0 transition-transform duration-200 group-hover:scale-110">
                        {item.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[10px] sm:text-sm md:text-[14px] font-extrabold text-[#0D3A1D] dark:text-[#93B733] leading-tight sm:leading-snug group-hover:text-[#4E700F] dark:group-hover:text-[#a8d63a] transition-colors truncate">
                          {item.title}
                        </h3>
                        <p className="text-[8px] sm:text-[11px] font-semibold text-gray-400 mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="w-full">
                  <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2.5 pl-3 sm:pl-5 rounded-xl sm:rounded-[22px] bg-white dark:bg-[#121620] border-2 border-gray-200 hover:border-[#93B733]/70 focus-within:border-[#93B733] dark:border-gray-800/90 dark:focus-within:border-[#93B733]/80 shadow-md focus-within:ring-2 focus-within:ring-[#93B733]/15 transition-all">
                    <input
                      ref={inputRef}
                      type="text"
                      autoFocus
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isStreaming}
                      placeholder="Ask Dr.Dormn anything about PG, mess, rent, maintenance, curfew..."
                      className="flex-1 bg-transparent text-xs sm:text-sm md:text-base font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none disabled:opacity-60"
                    />
                    <button
                      onClick={() => handleSend()}
                      disabled={!input.trim() || isStreaming}
                      className="flex h-8 w-8 sm:h-11 sm:w-11 items-center justify-center rounded-lg sm:rounded-xl bg-[#0D3A1D] hover:bg-[#16502a] text-white disabled:opacity-30 disabled:cursor-not-allowed shadow-md transition-all active:scale-95 shrink-0 cursor-pointer"
                      title="Send message"
                    >
                      <Send className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* ── ACTIVE CONVERSATION ── */
          <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#070A11]">

            <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 p-2.5 sm:p-6 scrollbar-thin">
              {messages.map((msg, i) => {
                const isUser = msg.role === "user";

                return (
                  <div key={i} className="animate-in fade-in slide-in-from-bottom-2 duration-150">
                    <div className={`flex items-start gap-2 sm:gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                      {!isUser && (
                        <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
                          <img src={BOT_AVATAR} alt="Dr.Dormn" className="w-full h-full object-contain" />
                        </div>
                      )}

                      <div
                        className={`max-w-[88%] sm:max-w-[75%] px-3 py-2 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-sm leading-relaxed shadow-xs ${
                          isUser
                            ? "bg-[#0D3A1D] text-white rounded-tr-xs font-semibold whitespace-pre-line"
                            : "bg-gray-100/90 dark:bg-[#121622] text-gray-900 dark:text-gray-100 border border-gray-200/80 dark:border-gray-800/90 rounded-tl-xs font-medium"
                        }`}
                      >
                        {isUser ? (
                          msg.text
                        ) : msg.text ? (
                          <>
                            <MessageBody text={msg.text} />
                            {msg.streaming && (
                              <span className="inline-block w-1.5 h-3.5 ml-0.5 align-middle bg-[#93B733] animate-pulse rounded-xs" />
                            )}
                          </>
                        ) : msg.streaming ? (
                          <TypingDots />
                        ) : null}

                        {msg.error && (
                          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-white/10 flex items-start gap-1.5 text-[10px] sm:text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                            <AlertCircle size={12} className="shrink-0 mt-0.5" />
                            <span>{msg.error}</span>
                          </div>
                        )}
                      </div>

                      {isUser && (
                        <div className="flex-shrink-0 w-6 h-6 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[#93B733] flex items-center justify-center text-[#0D3A1D] font-black text-[10px] sm:text-xs uppercase shadow-sm">
                          {userName ? userName.charAt(0) : <User size={13} className="text-[#0D3A1D]" />}
                        </div>
                      )}
                    </div>

                    {/* PG listings returned by a tool */}
                    {msg.pgs?.length > 0 && (
                      <div className="mt-2 ml-8 sm:ml-11 max-w-[88%] sm:max-w-[75%] space-y-1.5">
                        {msg.pgs.map((pg) => (
                          <PGCard key={pg.id} pg={pg} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {showThinkingRow && statusLabel && (
                <div className="flex items-center gap-2 sm:gap-2.5 justify-start animate-in fade-in duration-150">
                  <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
                    <img src={BOT_AVATAR} alt="Dr.Dormn" className="w-full h-full object-contain" />
                  </div>
                  <div className="bg-gray-100/90 dark:bg-[#121622] border border-gray-200/80 dark:border-gray-800 rounded-xl sm:rounded-2xl rounded-tl-xs px-3 py-1.5 sm:px-3.5 sm:py-2 shadow-xs flex items-center gap-2">
                    <TypingDots />
                    <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400">
                      {statusLabel}
                    </span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick chips */}
            <div className="px-2.5 sm:px-5 py-1.5 sm:py-2 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar border-t border-gray-200/80 dark:border-gray-800/80 bg-gray-50/80 dark:bg-[#0B0F19]">
              {QUICK_PROMPTS.map((item) => (
                <button
                  key={item.title}
                  onClick={() => handleSend(item.query)}
                  disabled={isStreaming}
                  className="shrink-0 flex items-center gap-1 sm:gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white hover:bg-gray-100 dark:bg-[#121620] dark:hover:bg-[#181e2b] border border-gray-200 hover:border-[#93B733]/50 dark:border-gray-800 dark:hover:border-[#93B733]/50 text-[10px] sm:text-[11px] font-bold text-[#0D3A1D] dark:text-[#93B733] transition-all cursor-pointer shadow-xs disabled:opacity-40"
                >
                  <span className="text-[11px] sm:text-xs">{item.icon}</span>
                  <span>{item.title}</span>
                </button>
              ))}
            </div>

            <div className="p-2 sm:p-4 border-t border-gray-200/80 dark:border-gray-800/80 bg-gray-50/80 dark:bg-[#0B0F19]">
              {composer}
            </div>
          </div>
        )}
      </main>
    </div>
  );
});

DrDormnChat.displayName = "DrDormnChat";
export default DrDormnChat;
