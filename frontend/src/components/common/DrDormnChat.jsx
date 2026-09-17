import { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  Bot, Send, User, Sparkles, RefreshCw, PanelLeftClose, PanelLeft,
  Plus, MessageSquare, Trash2, Clock, ChevronRight, X
} from "lucide-react";

// ══════════════════════════════════════════════════════════════
// Pure Frontend Intelligent Resident AI Knowledge Base
// (No backend required - instant zero-latency responses)
// ══════════════════════════════════════════════════════════════
export function getBotReply(userMsg) {
  const msg = userMsg.toLowerCase().trim();

  if (
    msg.includes("mess") ||
    msg.includes("food") ||
    msg.includes("timing") ||
    msg.includes("menu") ||
    msg.includes("lunch") ||
    msg.includes("dinner") ||
    msg.includes("breakfast")
  ) {
    return "🍽️ **Daily Mess Timings & Dining Schedule**:\n\n• **Breakfast**: 7:30 AM – 9:30 AM (Tea/Coffee, Hot Breakfast)\n• **Lunch**: 12:30 PM – 2:30 PM (Full Meal + Dal, Seasonal Veg & Fresh Rotis)\n• **Evening Snacks**: 5:00 PM – 6:00 PM (Tea & Light Refreshments)\n• **Dinner**: 7:30 PM – 9:30 PM (Hot Dinner)\n\n💡 *Tip: If you have late classes or shift timings, inform your PG warden in advance to have your plate packed!*";
  }

  if (
    msg.includes("maintenance") ||
    msg.includes("repair") ||
    msg.includes("fix") ||
    msg.includes("broken") ||
    msg.includes("plumber") ||
    msg.includes("electrician") ||
    msg.includes("complaint")
  ) {
    return "🔧 **Filing Maintenance & Repair Tickets**:\n\n1. Go to your **My PG** dashboard in the top menu.\n2. Tap the **Requests** tab.\n3. Specify your room number and select the repair category (Plumbing, Electrical, AC, WiFi, Furniture).\n4. Submit photos if needed — your PG manager receives an instant notification to dispatch a technician!";
  }

  if (
    msg.includes("late") ||
    msg.includes("entry") ||
    msg.includes("curfew") ||
    msg.includes("gate") ||
    msg.includes("night") ||
    msg.includes("rule")
  ) {
    return "🌙 **Curfew & Gate Entry Policy**:\n\n• **Standard Main Gate Closing**: 10:30 PM\n• **Late Entry Buffer**: Up to 11:30 PM with prior digital register entry.\n• **Night Out Permissions**: Submit an overnight request through the resident portal at least 4 hours in advance.\n\n🔒 *Always keep your Dormn Digital Resident ID accessible on your phone when entering after hours.*";
  }

  if (
    msg.includes("rent") ||
    msg.includes("pay") ||
    msg.includes("payment") ||
    msg.includes("bill") ||
    msg.includes("invoice") ||
    msg.includes("due") ||
    msg.includes("deposit")
  ) {
    return "💰 **Rent Payments & Invoices**:\n\n• You can securely pay your monthly rent directly on Dormn with **Razorpay** (UPI, Credit/Debit Cards, NetBanking).\n• Head to **My PG > Pay Rent** to view your active invoice, due dates, and breakdown.\n• Once paid, an instant GST-compliant PDF receipt is generated and stored in your records.";
  }

  if (
    msg.includes("wifi") ||
    msg.includes("internet") ||
    msg.includes("speed") ||
    msg.includes("password") ||
    msg.includes("router")
  ) {
    return "📶 **High-Speed WiFi Access**:\n\n• Dormn-verified properties provide 100+ Mbps fiber connections across all floors.\n• Network Name: Look for `Dormn_Resident_WiFi` or your property's custom SSID.\n• Password: Provided upon room check-in or visible under your resident welcome packet.\n• Experiencing speed drops? Submit a quick ticket under **Requests**.";
  }

  if (
    msg.includes("laundry") ||
    msg.includes("wash") ||
    msg.includes("clothes") ||
    msg.includes("iron") ||
    msg.includes("machine")
  ) {
    return "👕 **Laundry & Washing Facilities**:\n\n• **Automatic Washing Machines**: Available on designated terrace/utility areas for resident self-service.\n• **Professional Ironing & Laundry Service**: Weekly pickup schedules are posted on the notices board.\n• Check your PG's amenities card for free load quotas per month.";
  }

  if (
    msg.includes("event") ||
    msg.includes("club") ||
    msg.includes("concert") ||
    msg.includes("party") ||
    msg.includes("ticket")
  ) {
    return "🎉 **Dormn Events & Nightlife Passes**:\n\n• Head over to the **Events** tab in the top navigation.\n• Explore live concerts, DJ club nights, and student meetups across Delhi NCR & Jaipur.\n• Singles pay discounted student rates, while **couples enter FREE** on guestlist!";
  }

  if (
    msg.includes("hello") ||
    msg.includes("hi") ||
    msg.includes("hey") ||
    msg.includes("yo") ||
    msg.includes("hii")
  ) {
    return "Hey there! 😊 Great to see you! How can I assist you with your hostel or PG accommodation today?\n\nFeel free to ask me anything about:\n• 🍽️ Mess menus & dining hours\n• 💰 Paying rent & invoices\n• 🔧 Filing maintenance tickets\n• 🌙 Gate timings & curfew rules\n• 📶 WiFi & amenities";
  }

  if (
    msg.includes("thank") ||
    msg.includes("thanks") ||
    msg.includes("helpful") ||
    msg.includes("great")
  ) {
    return "You're very welcome! 😊 Always here to make your hostel life smooth and stress-free. Let me know if you need anything else!";
  }

  return `Got it! 🤔 I have noted your question: "${userMsg}".\n\nFor property-specific matters, you can reach out directly to your property manager through the **Requests** tab in your dashboard, or contact 24/7 Dormn Support anytime!`;
}

// ══════════════════════════════════════════════════════════════
// DEFAULT INITIAL CONVERSATION HISTORY
// ══════════════════════════════════════════════════════════════
const INITIAL_CONVERSATIONS = [
  {
    id: "conv-1",
    title: "Mess Timings & Schedule",
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    messages: [
      { role: "user", text: "What are the mess timings?" },
      {
        role: "bot",
        text: "🍽️ **Daily Mess Timings & Dining Schedule**:\n\n• **Breakfast**: 7:30 AM – 9:30 AM\n• **Lunch**: 12:30 PM – 2:30 PM\n• **Snacks**: 5:00 PM – 6:00 PM\n• **Dinner**: 7:30 PM – 9:30 PM",
      },
    ],
  },
  {
    id: "conv-2",
    title: "Late Night Gate Policy",
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    messages: [
      { role: "user", text: "What is the curfew time?" },
      {
        role: "bot",
        text: "🌙 **Curfew & Gate Entry Policy**:\n\n• **Main Gate Closing**: 10:30 PM\n• **Late Entry Buffer**: Up to 11:30 PM with digital register sign-in.",
      },
    ],
  },
];

// ══════════════════════════════════════════════════════════════
// QUICK SUGGESTION CARDS (Matching Reference Design)
// ══════════════════════════════════════════════════════════════
const QUICK_PROMPTS = [
  {
    icon: "🍽️",
    title: "Mess Timings & Menu",
    subtitle: "Click to ask",
    query: "What are the mess timings and daily menu schedule?",
  },
  {
    icon: "🔧",
    title: "Raise Maintenance Request",
    subtitle: "Click to ask",
    query: "How do I raise a maintenance and repair request?",
  },
  {
    icon: "🌙",
    title: "Curfew & Entry Rules",
    subtitle: "Click to ask",
    query: "What are the curfew and late night gate entry rules?",
  },
  {
    icon: "💰",
    title: "Rent Payment & Invoices",
    subtitle: "Click to ask",
    query: "How do I pay my rent and view invoices?",
  },
  {
    icon: "📶",
    title: "WiFi & High-Speed Internet",
    subtitle: "Click to ask",
    query: "How do I connect to high-speed WiFi and check internet speed?",
  },
  {
    icon: "👕",
    title: "Laundry & Washing",
    subtitle: "Click to ask",
    query: "What are the laundry and washing facilities?",
  },
];

export const DrDormnChat = memo(({ userName }) => {
  // Slider / Sidebar toggle state: closed by default (only opens when user clicks slider icon)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Conversations History list stored in localStorage
  const [conversations, setConversations] = useState(() => {
    try {
      const saved = localStorage.getItem("dormn_ai_conversations");
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_CONVERSATIONS;
  });

  // Active conversation ID (null = new empty chat)
  const [activeConvId, setActiveConvId] = useState(null);

  // Messages in current view
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Sync active conversation messages
  useEffect(() => {
    if (activeConvId) {
      const found = conversations.find((c) => c.id === activeConvId);
      if (found) {
        setMessages(found.messages || []);
      }
    } else {
      setMessages([]);
    }
  }, [activeConvId, conversations]);

  // Persist conversations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("dormn_ai_conversations", JSON.stringify(conversations));
    } catch {}
  }, [conversations]);

  const hasChatted = messages.length > 0;

  useEffect(() => {
    if (hasChatted) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, hasChatted]);

  // Send Message & Auto Update / Create Conversation in History
  const handleSend = useCallback(
    (text) => {
      const msg = (text || input).trim();
      if (!msg) return;

      const userMessageObj = { role: "user", text: msg };
      const updatedMessages = [...messages, userMessageObj];
      setMessages(updatedMessages);
      setInput("");
      setIsTyping(true);

      setTimeout(() => {
        const botReply = getBotReply(msg);
        const finalMessages = [...updatedMessages, { role: "bot", text: botReply }];
        setMessages(finalMessages);
        setIsTyping(false);

        // Update or create conversation in history
        setConversations((prev) => {
          if (activeConvId) {
            return prev.map((c) =>
              c.id === activeConvId
                ? { ...c, messages: finalMessages, updatedAt: new Date().toISOString() }
                : c
            );
          } else {
            const newId = `conv-${Date.now()}`;
            const newTitle = msg.length > 28 ? `${msg.slice(0, 28)}...` : msg;
            const newConv = {
              id: newId,
              title: newTitle.charAt(0).toUpperCase() + newTitle.slice(1),
              updatedAt: new Date().toISOString(),
              messages: finalMessages,
            };
            setActiveConvId(newId);
            return [newConv, ...prev];
          }
        });
      }, 500 + Math.random() * 400);
    },
    [input, messages, activeConvId]
  );

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStartNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
    setInput("");
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSelectConversation = (convId) => {
    setActiveConvId(convId);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleDeleteConversation = (e, convId) => {
    e.stopPropagation();
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    if (activeConvId === convId) {
      setActiveConvId(null);
      setMessages([]);
    }
  };

  return (
    <div className="w-full h-full flex transition-all duration-300 relative overflow-hidden bg-white dark:bg-[#070A11]">
      
      {/* ══════════════════════════════════════════════════════════════
          MOBILE BACKDROP FOR SLIDER
          ══════════════════════════════════════════════════════════════ */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-40 animate-[fadeIn_0.2s_ease-out]"
        />
      )}

      {/* ══════════════════════════════════════════════════════════════
          LEFT SIDEBAR SLIDER: PREVIOUS CONVERSATIONS HISTORY
          (Slide-in drawer on mobile, collapsible left panel on desktop)
          ══════════════════════════════════════════════════════════════ */}
      {isSidebarOpen && (
        <aside className="fixed inset-y-0 left-0 z-50 w-72 sm:w-80 h-full lg:static lg:h-full lg:z-auto flex-shrink-0 bg-white dark:bg-[#111625] border-r border-gray-200/80 dark:border-white/10 p-3 sm:p-4 flex flex-col shadow-2xl lg:shadow-none transition-all duration-300 animate-[slideInLeft_0.25s_ease-out]">
          
          {/* Top Row: New Chat + Mobile Close Button */}
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={handleStartNewChat}
              className="flex-1 py-2 sm:py-3 px-3 sm:px-3.5 rounded-xl bg-[#0D3A1D] hover:bg-[#16502a] text-white font-extrabold text-xs tracking-wide flex items-center justify-between shadow-md shadow-[#0D3A1D]/15 transition-all active:scale-[0.98] cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Plus size={15} className="text-[#93B733]" />
                <span>New Conversation</span>
              </div>
              <Sparkles size={13} className="text-[#93B733]" />
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white cursor-pointer"
              title="Close history"
            >
              <X size={16} />
            </button>
          </div>

          {/* Section Header */}
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-gray-400 px-2 mb-2">
            <div className="flex items-center gap-1.5">
              <Clock size={12} />
              <span>Previous Chats</span>
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
              {conversations.length}
            </span>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto space-y-1 sm:space-y-1.5 pr-1 scrollbar-thin">
            {conversations.length === 0 ? (
              <div className="text-center py-10 px-2">
                <MessageSquare className="mx-auto text-gray-300 dark:text-gray-600 mb-2" size={24} />
                <p className="text-xs font-semibold text-gray-400">No chat history yet</p>
                <p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5">Start typing to save conversations!</p>
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
                        ? "bg-[#93B733]/15 text-[#0D3A1D] dark:text-[#93B733] border border-[#93B733]/30 shadow-xs"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <MessageSquare
                        size={13}
                        className={`shrink-0 ${isActive ? "text-[#93B733]" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200"}`}
                      />
                      <span className="truncate capitalize text-[11px] sm:text-xs">{conv.title}</span>
                    </div>

                    {/* Delete button on hover */}
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

          {/* Footer Status */}
          <div className="pt-2.5 sm:pt-3 border-t border-gray-100 dark:border-white/5 text-[10px] sm:text-[11px] font-semibold text-gray-400 flex items-center justify-between px-2">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Resident Assistant</span>
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-gray-400">v2.0</span>
          </div>

        </aside>
      )}

      {/* ══════════════════════════════════════════════════════════════
          RIGHT CHAT CONTAINER: FULL EDGE-TO-EDGE VIEW
          ══════════════════════════════════════════════════════════════ */}
      <main className="w-full flex-1 h-full flex flex-col min-w-0 bg-white dark:bg-[#070A11] overflow-hidden transition-all duration-300">
        
        {/* Top Navbar Toolbar */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3 border-b border-gray-200/80 dark:border-gray-800/80 bg-gray-50/70 dark:bg-[#0B0F19] shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Toggle Sidebar Slider Button */}
            <button
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="p-1.5 sm:p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white transition cursor-pointer border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#121622]"
              title={isSidebarOpen ? "Close history" : "Open history slider"}
              aria-label="Toggle chat history"
            >
              <PanelLeft size={16} className="text-[#0D3A1D] dark:text-[#93B733]" />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <div className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center shrink-0">
                <img src="/icons/dr.dormn-removebg-preview.png" alt="Dr.Dormn" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-black text-gray-900 dark:text-white leading-tight block">
                  Dr.Dormn AI
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-[#4E700F] dark:text-[#93B733]">
                  Online & Ready
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStartNewChat}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-[#121622] text-[11px] sm:text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition cursor-pointer shadow-xs"
              title="Start New Chat"
            >
              <RefreshCw size={11} />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </div>

        {/* Dynamic Chat Area */}
        {!hasChatted ? (
          /* ── STATE 1: INITIAL PROMPT (HERO TOP, ACTION CARDS & INPUT AT BOTTOM ON MOBILE) ── */
          <div className="flex-1 min-h-0 flex flex-col justify-between sm:justify-center items-center px-3 sm:px-8 py-2.5 sm:py-8 overflow-y-auto animate-in fade-in duration-200">
            <div className="w-full max-w-4xl flex flex-col items-center justify-between sm:justify-center h-full sm:h-auto sm:my-auto">
              
              {/* AI Bot Logo Hero Section */}
              <div className="flex flex-col items-center text-center my-auto sm:my-0 sm:mb-8 group pt-2 sm:pt-0 shrink-0">
                <div className="relative mb-2 sm:mb-3.5 flex items-center justify-center">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                    <img
                      src="/icons/dr.dormn-removebg-preview.png"
                      alt="Dr.Dormn AI"
                      className="w-full h-full object-contain drop-shadow-md"
                    />
                  </div>
                </div>

                <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                  Dr.Dormn <span className="text-[#4E700F] dark:text-[#93B733]">AI</span>
                </h1>
                <p className="text-[10px] sm:text-sm font-semibold text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1 max-w-md">
                  Instant 24/7 Hostel & PG Resident Intelligence
                </p>
              </div>

              {/* Bottom Container on Mobile: Quick Action Cards + Input Bar */}
              <div className="w-full flex flex-col mt-auto sm:mt-0 shrink-0 pb-1 sm:pb-0">
                {/* Quick Action Cards (2-cols on mobile, 3-cols on desktop) */}
                <div className="w-full grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 mb-2.5 sm:mb-5">
                  {QUICK_PROMPTS.map((item) => (
                    <button
                      key={item.title}
                      onClick={() => handleSend(item.query)}
                      className="group flex items-center gap-2 sm:gap-3.5 p-2 sm:px-5 sm:py-4 rounded-xl sm:rounded-2xl bg-gray-50/90 hover:bg-gray-100/90 dark:bg-[#121620] dark:hover:bg-[#181e2b] border border-gray-200/90 hover:border-[#93B733] dark:border-gray-800/90 dark:hover:border-[#93B733]/60 shadow-xs sm:shadow-sm hover:shadow-md dark:shadow-lg dark:hover:shadow-2xl transition-all duration-200 text-left cursor-pointer active:scale-[0.98]"
                    >
                      <span className="text-lg sm:text-3xl select-none shrink-0 transition-transform duration-200 group-hover:scale-110">
                        {item.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[10px] sm:text-sm md:text-[14px] font-extrabold text-[#0D3A1D] dark:text-[#93B733] leading-tight sm:leading-snug group-hover:text-[#4E700F] dark:group-hover:text-[#a8d63a] transition-colors truncate">
                          {item.title}
                        </h3>
                        <p className="text-[8px] sm:text-[11px] font-semibold text-gray-400 dark:text-gray-400 mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Large Rounded Input Bar */}
                <div className="w-full">
                  <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2.5 pl-3 sm:pl-5 rounded-xl sm:rounded-[22px] bg-white dark:bg-[#121620] border-2 border-gray-200 hover:border-[#93B733]/70 focus-within:border-[#93B733] dark:border dark:border-gray-800/90 dark:focus-within:border-[#93B733]/80 shadow-md dark:shadow-xl focus-within:ring-2 focus-within:ring-[#93B733]/15 dark:focus-within:ring-[#93B733]/20 transition-all">
                    <input
                      ref={inputRef}
                      type="text"
                      autoFocus
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask Dr.Dormn anything about mess, rent, maintenance, curfew..."
                      className="flex-1 bg-transparent text-xs sm:text-sm md:text-base font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none"
                    />
                    <button
                      onClick={() => handleSend()}
                      disabled={!input.trim()}
                      className="flex h-8 w-8 sm:h-11 sm:w-11 items-center justify-center rounded-lg sm:rounded-xl bg-[#0D3A1D] hover:bg-[#16502a] text-white dark:text-[#93B733] dark:border dark:border-[#93B733]/30 disabled:opacity-30 disabled:cursor-not-allowed shadow-md transition-all active:scale-95 shrink-0 cursor-pointer"
                      title="Send Message"
                    >
                      <Send className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white dark:text-[#93B733]" />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* ── STATE 2: ACTIVE CONVERSATION & BOTTOM PROMPT ── */
          <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#070A11]">
            
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 p-2.5 sm:p-6 scrollbar-thin">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 sm:gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-150`}
                >
                  {msg.role === "bot" && (
                    <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
                      <img src="/icons/dr.dormn-removebg-preview.png" alt="Dr.Dormn" className="w-full h-full object-contain" />
                    </div>
                  )}

                  <div
                    className={`max-w-[88%] sm:max-w-[75%] px-3 py-2 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-sm leading-relaxed shadow-xs ${
                      msg.role === "user"
                        ? "bg-[#0D3A1D] text-white rounded-tr-xs font-semibold"
                        : "bg-gray-100/90 dark:bg-[#121622] text-gray-900 dark:text-gray-100 border border-gray-200/80 dark:border-gray-800/90 rounded-tl-xs font-medium whitespace-pre-line"
                    }`}
                  >
                    {msg.text}
                  </div>

                  {msg.role === "user" && (
                    <div className="flex-shrink-0 w-6 h-6 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[#93B733] flex items-center justify-center text-[#0D3A1D] font-black text-[10px] sm:text-xs uppercase shadow-sm">
                      {userName ? userName.charAt(0) : <User size={13} className="text-[#0D3A1D]" />}
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 sm:gap-2.5 justify-start animate-in fade-in duration-150">
                  <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
                    <img src="/icons/dr.dormn-removebg-preview.png" alt="Dr.Dormn" className="w-full h-full object-contain" />
                  </div>
                  <div className="bg-gray-100/90 dark:bg-[#121622] border border-gray-200/80 dark:border-gray-800 rounded-xl sm:rounded-2xl rounded-tl-xs px-3 py-1.5 sm:px-3.5 sm:py-2 shadow-xs">
                    <div className="flex gap-1 sm:gap-1.5">
                      <span className="w-1.5 h-1.5 bg-[#93B733] rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 bg-[#93B733] rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-[#93B733] rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick action chips during active chat */}
            <div className="px-2.5 sm:px-5 py-1.5 sm:py-2 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar border-t border-gray-200/80 dark:border-gray-800/80 bg-gray-50/80 dark:bg-[#0B0F19]">
              {QUICK_PROMPTS.map((item) => (
                <button
                  key={item.title}
                  onClick={() => handleSend(item.query)}
                  className="shrink-0 flex items-center gap-1 sm:gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white hover:bg-gray-100 dark:bg-[#121620] dark:hover:bg-[#181e2b] border border-gray-200 hover:border-[#93B733]/50 dark:border-gray-800 dark:hover:border-[#93B733]/50 text-[10px] sm:text-[11px] font-bold text-[#0D3A1D] dark:text-[#93B733] transition-all cursor-pointer shadow-xs"
                >
                  <span className="text-[11px] sm:text-xs">{item.icon}</span>
                  <span>{item.title}</span>
                </button>
              ))}
            </div>

            {/* Bottom Docked Input Bar */}
            <div className="p-2 sm:p-4 border-t border-gray-200/80 dark:border-gray-800/80 bg-gray-50/80 dark:bg-[#0B0F19]">
              <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2.5 pl-3 sm:pl-5 rounded-xl sm:rounded-2xl bg-white dark:bg-[#121620] border-2 border-gray-200 dark:border dark:border-gray-800/90 shadow-sm focus-within:border-[#93B733] dark:focus-within:border-[#93B733]/80 focus-within:ring-2 focus-within:ring-[#93B733]/15 dark:focus-within:ring-[#93B733]/20 transition-all">
                <input
                  ref={inputRef}
                  type="text"
                  autoFocus
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Dr.Dormn anything about mess, rent, maintenance, curfew..."
                  className="flex-1 bg-transparent text-xs sm:text-sm font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                  className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-[#0D3A1D] hover:bg-[#16502a] text-white dark:text-[#93B733] dark:border dark:border-[#93B733]/30 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm transition-all active:scale-95 shrink-0 cursor-pointer"
                  title="Send Message"
                >
                  <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white dark:text-[#93B733]" />
                </button>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
});

DrDormnChat.displayName = "DrDormnChat";
export default DrDormnChat;
