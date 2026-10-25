import { memo } from "react";
import {
  Bot, Sparkles, Building2, RotateCcw, CalendarClock, KeyRound,
  CalendarRange, MessageSquare, Send
} from "lucide-react";
import { getPgFoodPreference } from "../../utils/amenities";

const MANAGER_PROMPTS = [
  "🍲 Food & Mess Menu",
  "⏰ Gate Closing Time",
  "🛏️ Rooms & Sharing Prices",
  "✨ Amenities Available",
  "📅 How to Visit",
  "🔑 Check-In Process",
];

const renderMessageText = (text) => {
  if (!text) return null;
  return text.split("\n").map((line, i) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return (
      <span key={i} className="block leading-relaxed min-h-[1.2em]">
        {parts.map((part, pi) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={pi} className="font-black text-gray-900 dark:text-white">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        })}
      </span>
    );
  });
};

const DormnAiManagerCard = ({
  pg,
  managerMessages,
  setManagerMessages,
  managerInput,
  setManagerInput,
  managerIsTyping,
  managerChatBoxRef,
  handleManagerSend,
  handleRequestVisitClick,
  handleShortStayClick,
  handleWhatsAppRedirect,
  setActiveTab,
}) => {
  const pgTitle = pg?.title || pg?.name || "this PG";

  const handleResetChat = () => {
    setManagerMessages([
      {
        id: Date.now(),
        sender: "bot",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: `Hello! 👋 I'm **Dormn AI**, the 24/7 Virtual Manager for **${pgTitle}**.\n\nI can answer questions regarding room pricing, food menus, gate curfew, security deposit, or help you schedule a visit or reserve your room instantly.\n\nWhat would you like to know?`,
      },
    ]);
  };

  return (
    <div className="w-full min-w-0">
      <div className="w-full min-w-0 max-w-full rounded-xl sm:rounded-[2rem] md:rounded-[2.5rem] border-2 border-[#93B733]/40 dark:border-[#93B733]/30 bg-white dark:bg-[#0d0d0d] p-3 sm:p-6 md:p-8 shadow-[0_12px_40px_rgb(0,0,0,0.06)] flex flex-col overflow-hidden">
        {/* Dormn AI Header */}
        <div className="flex items-center justify-between border-b-2 border-gray-100 dark:border-gray-800 pb-3.5 sm:pb-5">
          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
            <div className="relative flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#0D3A1D] to-[#93B733] text-white shadow-md shrink-0">
              <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-[#0d0d0d]"></span>
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-base sm:text-lg font-black text-gray-900 dark:text-white truncate">
                  Dormn AI — PG Manager
                </h4>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] sm:text-[10px] font-black bg-[#93B733]/20 text-[#4E700F] dark:text-[#bbf246] border border-[#93B733]/40 uppercase shrink-0">
                  <Sparkles className="w-2.5 h-2.5" /> Virtual Manager
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate mt-0.5">
                Dedicated 24/7 AI manager for <span className="font-semibold text-gray-700 dark:text-gray-200">{pgTitle}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.05] hover:bg-gray-100 dark:hover:bg-white/10 text-xs font-bold text-gray-700 dark:text-gray-200 transition cursor-pointer active:scale-95 shadow-xs"
              title="Back to PG Details"
            >
              <Building2 className="w-3.5 h-3.5 text-[#93B733]" />
              <span className="hidden sm:inline">View PG Details</span>
              <span className="sm:hidden">Details</span>
            </button>

            <button
              type="button"
              onClick={handleResetChat}
              title="Reset Chat"
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition cursor-pointer active:scale-95 shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick PG Snapshot Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-3 px-3.5 bg-gray-50 dark:bg-white/[0.03] rounded-2xl border border-gray-100 dark:border-white/5 my-3 text-xs">
          <div>
            <span className="text-[10px] text-gray-400 uppercase font-bold block">Starting Price</span>
            <span className="font-extrabold text-[#4E700F] dark:text-[#bbf246] text-sm">
              ₹{Number(pg?.price || 0).toLocaleString()}
              <span className="text-[10px] text-gray-400 font-normal">/mo</span>
            </span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 uppercase font-bold block">PG Type</span>
            <span className="font-bold text-gray-800 dark:text-gray-200">
              {String(pg?.pg_type || "PG").toUpperCase()}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 uppercase font-bold block">Food Style</span>
            <span className="font-bold text-gray-800 dark:text-gray-200">
              {getPgFoodPreference(pg).type}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 uppercase font-bold block">Gate Curfew</span>
            <span className="font-bold text-gray-800 dark:text-gray-200 truncate block">
              {pg?.gate_closing_time || "Check Rules"}
            </span>
          </div>
        </div>

        {/* Chat Messages */}
        <div
          ref={managerChatBoxRef}
          className="flex-1 my-3 sm:my-4 max-h-[460px] sm:max-h-[520px] min-h-[300px] overflow-y-auto space-y-3.5 sm:space-y-4 pr-1 sm:pr-2 scrollbar-thin"
        >
          {managerMessages.map((msg) => {
            const isBot = msg.sender === "bot";
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isBot ? "items-start" : "items-end"}`}
              >
                <div
                  className={`max-w-[90%] sm:max-w-[80%] px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl text-xs sm:text-sm shadow-xs ${
                    isBot
                      ? "bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/10 text-gray-800 dark:text-gray-100 rounded-tl-xs leading-relaxed"
                      : "bg-[#93B733] text-black font-semibold rounded-tr-xs"
                  }`}
                >
                  {renderMessageText(msg.text)}

                  {isBot && msg.actionType === "visit" && (
                    <button
                      type="button"
                      onClick={handleRequestVisitClick}
                      className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0D3A1D] hover:bg-[#124b26] text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                    >
                      <CalendarClock className="w-3.5 h-3.5 text-[#93B733]" />
                      <span>Schedule a Free Visit</span>
                    </button>
                  )}

                  {isBot && msg.actionType === "book" && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("details");
                        setTimeout(() => {
                          const el = document.getElementById("booking-card");
                          if (el) el.scrollIntoView({ behavior: "smooth" });
                        }, 100);
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#93B733] hover:bg-[#82a32d] text-black text-xs font-black transition shadow-xs cursor-pointer active:scale-95"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-black" />
                      <span>Select Room & Book</span>
                    </button>
                  )}

                  {isBot && msg.actionType === "shortStay" && (
                    <button
                      type="button"
                      onClick={handleShortStayClick}
                      className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                    >
                      <CalendarRange className="w-3.5 h-3.5 text-white" />
                      <span>Request Short Stay</span>
                    </button>
                  )}

                  {isBot && msg.actionType === "whatsapp" && (
                    <button
                      type="button"
                      onClick={handleWhatsAppRedirect}
                      className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-white" />
                      <span>Chat on WhatsApp</span>
                    </button>
                  )}
                </div>
                <span className="text-[9px] text-gray-400 mt-1 px-1">{msg.time}</span>
              </div>
            );
          })}

          {managerIsTyping && (
            <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-tl-xs bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/10 w-fit">
              <span className="w-2 h-2 rounded-full bg-[#93B733] animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-2 h-2 rounded-full bg-[#93B733] animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-2 h-2 rounded-full bg-[#93B733] animate-bounce"></span>
            </div>
          )}
        </div>

        {/* Suggestion Chips */}
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 w-full min-w-0">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none w-full min-w-0 max-w-full">
            {MANAGER_PROMPTS.map((promptText, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleManagerSend(promptText)}
                className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-gray-700 dark:text-gray-200 transition cursor-pointer border border-gray-200/50 dark:border-white/10 shrink-0 active:scale-95"
              >
                {promptText}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleManagerSend();
            }}
            className="mt-2 flex items-center gap-2 w-full min-w-0"
          >
            <input
              type="text"
              value={managerInput}
              onChange={(e) => setManagerInput(e.target.value)}
              placeholder={`Ask Dormn AI about ${pgTitle}...`}
              className="flex-1 min-w-0 bg-gray-50 dark:bg-white/[0.05] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#93B733] transition"
            />
            <button
              type="submit"
              disabled={!managerInput.trim()}
              className="flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-[#93B733] hover:bg-[#82a32d] disabled:opacity-40 disabled:hover:bg-[#93B733] text-black font-bold transition shadow-xs cursor-pointer active:scale-95 shrink-0"
              title="Send"
            >
              <Send className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default memo(DormnAiManagerCard);
