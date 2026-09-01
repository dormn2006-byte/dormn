import { useState, useEffect, useRef, useCallback, memo } from "react";
import { Bot, Send, User, Sparkles } from "lucide-react";

export const DR_DORMN_QUICK_PROMPTS = [
  { label: "Mess Timings & Menu", query: "What are the mess timings?", icon: "🍽️" },
  { label: "Raise Maintenance Request", query: "How do I raise a maintenance request?", icon: "🔧" },
  { label: "Curfew & Entry Rules", query: "What's the late entry policy?", icon: "🌙" },
  { label: "Rent Payment & Invoices", query: "How do I pay my rent?", icon: "💰" },
  { label: "WiFi & High-Speed Internet", query: "What are the WiFi details?", icon: "📶" },
  { label: "Laundry & Washing", query: "How does laundry work?", icon: "👕" },
];

export function getBotReply(userMsg) {
  const msg = userMsg.toLowerCase();

  if (msg.includes("mess") || msg.includes("food") || msg.includes("timing") || msg.includes("lunch") || msg.includes("dinner") || msg.includes("breakfast")) {
    return "🍽️ **Daily Mess Timings & Dining Schedule**:\n\n• **Breakfast**: 7:30 AM – 9:30 AM (Tea/Coffee, Fresh Breakfast)\n• **Lunch**: 12:30 PM – 2:30 PM (Full Meal + Dal, Sabzi & Roti)\n• **Evening Snacks**: 5:00 PM – 6:00 PM (Tea & Light Snacks)\n• **Dinner**: 7:30 PM – 9:30 PM (Hot Dinner)\n\n💡 *Tip: If you'll be late for dinner due to classes or work, inform your PG warden in advance to have your plate packed!*";
  }

  if (msg.includes("maintenance") || msg.includes("repair") || msg.includes("fix") || msg.includes("broken") || msg.includes("plumber") || msg.includes("electrician")) {
    return "🔧 **Maintenance & Repair Requests**:\n\n1. Go to your **My PG** tab in the navbar.\n2. Click on the **Requests** action card.\n3. Specify your room number and select the repair category (Plumbing, Electrical, AC, WiFi, Furniture).\n4. Submit photos if needed — your PG manager receives an instant notification to dispatch a technician!";
  }

  if (msg.includes("late") || msg.includes("entry") || msg.includes("curfew") || msg.includes("gate") || msg.includes("night")) {
    return "🌙 **Curfew & Gate Entry Policy**:\n\n• **Standard Main Gate Closing**: 10:30 PM\n• **Late Entry Buffer**: Up to 11:30 PM with prior digital register approval.\n• **Night Out Permissions**: Submit an overnight request through the resident portal at least 4 hours in advance.\n\n🔒 *Always carry your Dormn Digital Resident ID when entering after hours.*";
  }

  if (msg.includes("rent") || msg.includes("pay") || msg.includes("payment") || msg.includes("bill") || msg.includes("invoice") || msg.includes("due")) {
    return "💰 **Rent Payments & Invoices**:\n\n• You can securely pay your monthly rent directly on Dormn with **Razorpay** (UPI, Credit/Debit Cards, NetBanking).\n• Head to **My PG > Pay Rent** to see your active invoice, due dates, and breakdown.\n• Once paid, an instant GST-compliant PDF receipt is generated and stored in your records.";
  }

  if (msg.includes("wifi") || msg.includes("internet") || msg.includes("speed") || msg.includes("password")) {
    return "📶 **High-Speed WiFi Access**:\n\n• Dormn-verified properties provide 100+ Mbps fiber connections across all floors.\n• Network Name: Look for `Dormn_Resident_WiFi` or your property's custom SSID.\n• Password: Given upon room check-in or visible under your resident welcome packet.\n• Having speed issues? Submit a quick ticket under **Requests**.";
  }

  if (msg.includes("laundry") || msg.includes("wash") || msg.includes("clothes") || msg.includes("iron")) {
    return "👕 **Laundry & Washing Facilities**:\n\n• **Automatic Washing Machines**: Available on designated terrace/utility areas for self-service.\n• **Professional Ironing & Laundry Service**: Weekly pickup schedules are posted on the notices board.\n• Check your PG's amenities card for free load quotas per month.";
  }

  if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey") || msg.includes("yo")) {
    return "Hey there! 😊 Great to see you! How can I assist you with your PG accommodation today?\n\nYou can ask me about:\n• 🍽️ Mess menus & schedules\n• 💰 Paying rent & invoices\n• 🔧 Filing maintenance tickets\n• 🌙 Gate timings & curfew rules\n• 📶 WiFi & amenities";
  }

  if (msg.includes("thank") || msg.includes("thanks") || msg.includes("helpful")) {
    return "You're very welcome! 😊 Always here to make your hostel life easy and smooth. Feel free to ask anytime!";
  }

  return "Got it! 🤔 I have logged your query. While I'm continuing to learn more specific property policies, you can reach out directly to your property manager via the **Requests** tab or contact 24/7 Dormn Support from the menu slider!";
}

export const DrDormnChat = memo(({ userName }) => {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "👋 Welcome to **Dr.Dormn AI**!\n\nI'm your dedicated 24/7 PG Resident Assistant. Ask me anything regarding your hostel stay, dining schedules, rent payments, rules, or maintenance repairs."
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = useCallback((text) => {
    const msg = text || input.trim();
    if (!msg) return;

    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const botReply = getBotReply(msg);
      setMessages((prev) => [...prev, { role: "bot", text: botReply }]);
      setIsTyping(false);
    }, 700 + Math.random() * 600);
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-160px)] sm:h-[calc(100vh-140px)]">
      {/* Big Hero Header */}
      <div className="text-center pb-6 sm:pb-8 flex flex-col items-center">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-[#0D3A1D] via-[#1b5e34] to-[#93B733] flex items-center justify-center mb-4 shadow-xl shadow-[#93B733]/20 border-2 border-white/20">
          <Bot className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-md" />
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-[#0D3A1D] dark:text-white tracking-tight">
          Dr.Dormn
        </h2>
        <p className="text-sm sm:text-base font-bold text-gray-500 dark:text-gray-300 mt-1 max-w-lg">
          Your Smart AI Resident Assistant • Instant guidance on all PG services
        </p>
      </div>

      {/* Spacious Chat Stream */}
      <div className="flex-1 overflow-y-auto space-y-6 pb-6 px-2 sm:px-4 scrollbar-hide">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-start gap-3.5 sm:gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "bot" && (
              <div className="flex-shrink-0 w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-br from-[#0D3A1D] to-[#93B733] flex items-center justify-center shadow-md">
                <Bot className="w-6 h-6 text-white" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[78%] px-6 py-4 sm:px-7 sm:py-5 rounded-3xl text-base sm:text-lg leading-relaxed shadow-sm ${
                msg.role === "user"
                  ? "bg-[#0D3A1D] text-white rounded-tr-sm font-semibold"
                  : "bg-white dark:bg-[#121824] text-gray-900 dark:text-gray-100 border border-gray-200/80 dark:border-white/10 rounded-tl-sm font-medium whitespace-pre-line"
              }`}
            >
              {msg.text}
            </div>

            {msg.role === "user" && (
              <div className="flex-shrink-0 w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-[#93B733] flex items-center justify-center text-[#0D3A1D] font-black text-base sm:text-lg uppercase shadow-md">
                {userName ? userName.charAt(0) : <User className="w-6 h-6 text-white" />}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-3.5 sm:gap-4 justify-start">
            <div className="flex-shrink-0 w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-br from-[#0D3A1D] to-[#93B733] flex items-center justify-center shadow-md">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="bg-white dark:bg-[#121824] border border-gray-200/80 dark:border-white/10 rounded-3xl rounded-tl-sm px-6 py-4 shadow-sm">
              <div className="flex gap-2">
                <span className="w-2.5 h-2.5 bg-[#93B733] rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2.5 h-2.5 bg-[#93B733] rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2.5 h-2.5 bg-[#93B733] rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Large Quick Prompt Cards */}
      {messages.length <= 2 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3.5 pb-4 pt-2">
          {DR_DORMN_QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt.query}
              onClick={() => handleSend(prompt.query)}
              className="flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl border-2 border-gray-200/90 dark:border-white/10 bg-white/90 dark:bg-white/[0.04] text-left hover:border-[#93B733] hover:bg-[#93B733]/10 dark:hover:bg-[#93B733]/10 transition-all active:scale-[0.98] group shadow-sm"
            >
              <span className="text-xl sm:text-2xl shrink-0 group-hover:scale-110 transition-transform">
                {prompt.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-black text-gray-900 dark:text-white group-hover:text-[#0D3A1D] dark:group-hover:text-[#93B733] truncate">
                  {prompt.label}
                </p>
                <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 truncate">
                  Click to ask
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Big Prominent Input Bar */}
      <div className="sticky bottom-0 pt-3 pb-2 bg-[#FAF9F5] dark:bg-black">
        <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-3xl border-2 border-gray-300 dark:border-white/15 bg-white dark:bg-[#101726] shadow-xl focus-within:border-[#93B733] focus-within:shadow-[0_0_20px_rgba(147,183,51,0.25)] transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Dr.Dormn anything about mess, rent, maintenance, curfew..."
            className="flex-1 px-4 py-2.5 bg-transparent text-base sm:text-lg font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 outline-none"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-[#0D3A1D] hover:bg-[#16502a] text-white disabled:opacity-30 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all active:scale-95 shrink-0"
            title="Send Message"
          >
            <Send className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>
    </div>
  );
});

DrDormnChat.displayName = "DrDormnChat";
export default DrDormnChat;
