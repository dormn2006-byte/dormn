import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { io } from "socket.io-client";
import {
  ArrowLeft, Send, Users, ShieldCheck, Pin, Trash2, Sparkles, RefreshCw,
  MessageSquare, X, Lock, Hash, Plus, Search, MessageCircle, CheckCheck,
  BookOpen, Coffee, Dumbbell, Gamepad2, ChevronRight, Pencil, Check, Megaphone
} from "lucide-react";
import api, { SOCKET_URL } from "../../services/api";

const QUICK_REACTIONS = ["👋 Hello all!", "👍 Noted", "🔑 Key at desk", "🧹 Cleaning update", "⚡ Power status?", "📢 Urgent notice"];
const GROUP_ICONS = [
  { id: "users", label: "General", icon: Users },
  { id: "book", label: "Study", icon: BookOpen },
  { id: "coffee", label: "Mess / Food", icon: Coffee },
  { id: "gym", label: "Fitness", icon: Dumbbell },
  { id: "game", label: "Fun & Games", icon: Gamepad2 }
];

export default function PGChatRoom({
  pgId,
  initialPgInfo = null,
  isOwnerMode = false,
  onBack = null,
  headerPrefix = null
}) {
  const [activeChannel, setActiveChannel] = useState({ type: "main", id: "main", title: "PG Lounge" });
  const [conversationsData, setConversationsData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [allMembers, setAllMembers] = useState([]);
  const [customGroups, setCustomGroups] = useState([]);
  const [dmContacts, setDmContacts] = useState([]);

  const [inputMsg, setInputMsg] = useState("");
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showMembersDrawer, setShowMembersDrawer] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Group creation state
  const [newGroupTitle, setNewGroupTitle] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupIcon, setNewGroupIcon] = useState("users");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Message edit state
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const messagesEndRef = useRef(null);
  const pollTimerRef = useRef(null);
  const scrollToBottom = (smooth = true) => messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });

  const fetchConversations = useCallback(async (isBackground = false) => {
    if (!pgId) return;
    try {
      if (!isBackground) setRefreshing(true);
      const res = await api.get(`/pg-chat/${pgId}/conversations`);
      if (res.data?.success) {
        setConversationsData(res.data);
        setCustomGroups(res.data.customGroups || []);
        setDmContacts(res.data.dmContacts || []);
        setAllMembers(res.data.allMembers || []);
        if (res.data.currentUser) setCurrentUser(res.data.currentUser);
        if (res.data.mainGroup?.title) {
          setActiveChannel((prev) => (prev.type === "main" ? { ...prev, title: res.data.mainGroup.title } : prev));
        }
      }
    } catch (err) {
      console.error("[PG-Chat] fetchConversations error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pgId]);

  const fetchActiveMessages = useCallback(async (isBackground = false) => {
    if (!pgId) return;
    try {
      if (!isBackground) setMessagesLoading(true);
      const param = activeChannel.type === "direct" ? `directUserId=${activeChannel.id}` : `conversationId=${activeChannel.id}`;
      const res = await api.get(`/pg-chat/${pgId}/messages?${param}`);
      if (res.data?.success) {
        setMessages(res.data.messages || []);
        setPinnedMessages(res.data.pinnedMessages || []);
        if (res.data.currentUser) setCurrentUser(res.data.currentUser);
      }
    } catch (err) {
      console.error("[PG-Chat] fetchActiveMessages error:", err);
    } finally {
      setMessagesLoading(false);
    }
  }, [pgId, activeChannel]);

  const [typingUsers, setTypingUsers] = useState([]);
  const socketRef = useRef(null);
  const typingTimerRef = useRef(null);

  useEffect(() => {
    if (pgId) {
      fetchConversations(false);
    }
  }, [pgId, fetchConversations]);

  useEffect(() => {
    if (!pgId) return;

    fetchActiveMessages(false);

    // Initialize Socket.io connection
    const token = localStorage.getItem("token");
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(`[Socket] Connected to server, joining room pg_${pgId}`);
      socket.emit("join_pg_room", { pgId });
    });

    socket.on("new_message", (incomingMsg) => {
      const isForActiveChannel =
        (activeChannel.type === "main" && !incomingMsg.conversation_id && !incomingMsg.recipient_id) ||
        (activeChannel.type === "group" && Number(incomingMsg.conversation_id) === Number(activeChannel.id)) ||
        (activeChannel.type === "direct" &&
          ((Number(incomingMsg.sender_id) === Number(activeChannel.id) && Number(incomingMsg.recipient_id) === Number(currentUser?.id)) ||
           (Number(incomingMsg.sender_id) === Number(currentUser?.id) && Number(incomingMsg.recipient_id) === Number(activeChannel.id))));

      if (isForActiveChannel) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === incomingMsg.id)) return prev;
          return [...prev, incomingMsg];
        });
      }
      fetchConversations(true);
    });

    socket.on("message_updated", ({ id, message }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, message, is_edited: true } : m))
      );
    });

    socket.on("message_deleted", ({ id }) => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    });

    socket.on("pin_updated", () => {
      fetchActiveMessages(true);
    });

    socket.on("user_typing", ({ userId, userName }) => {
      if (Number(userId) !== Number(currentUser?.id)) {
        setTypingUsers((prev) => Array.from(new Set([...prev, userName])));
      }
    });

    socket.on("user_stopped_typing", ({ userId, userName }) => {
      setTypingUsers((prev) => prev.filter((u) => u !== userName));
    });

    // Secondary background sync every 30 seconds for stability
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(() => {
      fetchConversations(true);
    }, 30000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      socket.emit("leave_pg_room", { pgId });
      socket.disconnect();
    };
  }, [pgId, activeChannel, currentUser?.id, fetchConversations, fetchActiveMessages]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputMsg(val);

    if (socketRef.current && pgId) {
      socketRef.current.emit("typing_start", { pgId, channelId: activeChannel.id });
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        socketRef.current?.emit("typing_stop", { pgId, channelId: activeChannel.id });
      }, 2000);
    }
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!inputMsg.trim() || sending || !pgId) return;

    if (socketRef.current && pgId) {
      socketRef.current.emit("typing_stop", { pgId, channelId: activeChannel.id });
    }

    const text = inputMsg.trim();
    const type = isAnnouncement && isOwnerMode ? "announcement" : "text";
    setInputMsg("");
    setIsAnnouncement(false);
    setSending(true);

    const optimisticMsg = {
      id: "temp-" + Date.now(),
      pg_id: pgId,
      conversation_id: activeChannel.type === "group" ? activeChannel.id : null,
      recipient_id: activeChannel.type === "direct" ? activeChannel.id : null,
      sender_id: currentUser?.id,
      sender_name: currentUser?.name || (isOwnerMode ? "Property Owner" : "You"),
      sender_role: currentUser?.role || (isOwnerMode ? "owner" : "student"),
      room_no: isOwnerMode ? "Host" : (currentUser?.roomNo || "Resident"),
      message: text,
      message_type: type,
      is_pinned: type === "announcement" && activeChannel.type === "main",
      is_encrypted: true,
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    scrollToBottom(true);

    try {
      const res = await api.post(`/pg-chat/${pgId}/messages`, {
        message: text,
        messageType: type,
        conversationId: activeChannel.type === "group" ? activeChannel.id : null,
        directUserId: activeChannel.type === "direct" ? activeChannel.id : null,
        isEncrypted: true
      });
      if (res.data?.success && res.data.message) {
        setMessages((prev) => prev.map((m) => (m.id === optimisticMsg.id ? res.data.message : m)));
        fetchConversations(true);
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      alert(err.response?.data?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const handleCreateGroup = async (e) => {
    if (e) e.preventDefault();
    if (!newGroupTitle.trim() || creatingGroup || !pgId) return;

    setCreatingGroup(true);
    try {
      const res = await api.post(`/pg-chat/${pgId}/groups`, {
        title: newGroupTitle.trim(),
        description: newGroupDesc.trim() || null,
        icon: newGroupIcon,
        memberIds: selectedMemberIds
      });
      if (res.data?.success && res.data.group) {
        const created = res.data.group;
        setCustomGroups((prev) => [created, ...prev]);
        setActiveChannel({ type: "group", id: created.id, title: created.title, subtitle: `${selectedMemberIds.length + 1} members` });
        setShowCreateGroup(false);
        setNewGroupTitle("");
        setNewGroupDesc("");
        setSelectedMemberIds([]);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create group.");
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleStartEdit = (msg) => {
    setEditingMessageId(msg.id);
    setEditText(msg.message);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditText("");
  };

  const handleSaveEdit = async (msgId) => {
    if (!editText.trim() || savingEdit || !pgId) return;
    setSavingEdit(true);
    try {
      const res = await api.put(`/pg-chat/${pgId}/messages/${msgId}`, { message: editText.trim() });
      if (res.data?.success) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, message: editText.trim(), is_edited: true } : m))
        );
        handleCancelEdit();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update message.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      const res = await api.delete(`/pg-chat/${pgId}/messages/${msgId}`);
      if (res.data?.success) setMessages((prev) => prev.filter((m) => m.id !== msgId));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete message.");
    }
  };

  const handleTogglePin = async (msgId) => {
    try {
      const res = await api.post(`/pg-chat/${pgId}/pin/${msgId}`);
      if (res.data?.success) fetchActiveMessages(true);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update pin.");
    }
  };

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return customGroups;
    return customGroups.filter((g) => g.title?.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [customGroups, searchQuery]);

  const filteredDMs = useMemo(() => {
    // Never show current logged-in user in DM list
    const baseDMs = dmContacts.filter((m) => Number(m.id) !== Number(currentUser?.id));
    const sorted = [...baseDMs].sort((a, b) => (a.role === "owner" ? -1 : b.role === "owner" ? 1 : 0));
    if (!searchQuery.trim()) return sorted;
    const q = searchQuery.toLowerCase();
    return sorted.filter((m) => m.full_name?.toLowerCase().includes(q) || m.role?.toLowerCase().includes(q) || m.room_info?.toLowerCase().includes(q));
  }, [dmContacts, currentUser, searchQuery]);

  const getChannelIcon = (iconName) => GROUP_ICONS.find((i) => i.id === iconName)?.icon || Users;

  if (loading && !conversationsData) {
    return (
      <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-white dark:bg-[#0c1017] rounded-none border-0 shadow-none">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#93B733] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Loading secure PG Community Chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[calc(100vh-70px)] rounded-none bg-white dark:bg-[#0c1017] border-0 flex overflow-hidden relative">
      {/* ══════════ LEFT SIDEBAR ══════════ */}
      <aside className={`w-full md:w-80 lg:w-88 shrink-0 bg-gray-50/90 dark:bg-[#080b11] border-r border-gray-200/80 dark:border-white/10 flex flex-col z-30 ${mobileSidebarOpen ? "fixed inset-0 bg-white dark:bg-[#0c1017] z-50 flex" : "hidden md:flex"}`}>
        <div className="p-3.5 sm:p-4 border-b border-gray-200/80 dark:border-white/10 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {onBack && (
                <button onClick={onBack} className="p-1.5 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-white/10 transition cursor-pointer shrink-0">
                  <ArrowLeft size={18} />
                </button>
              )}
              <div className="w-8 h-8 rounded-xl bg-[#93B733]/20 border border-[#93B733]/40 text-[#93B733] flex items-center justify-center font-black shrink-0">
                <MessageSquare size={16} />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-black text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                  <span className="truncate">{conversationsData?.pgInfo?.title || initialPgInfo?.title || "PG Hub"}</span>
                  <ShieldCheck size={14} className="text-[#93B733] shrink-0" />
                </h2>
                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 truncate">{allMembers.length} Verified Members</p>
              </div>
            </div>
            {mobileSidebarOpen && (
              <button onClick={() => setMobileSidebarOpen(false)} className="p-1.5 rounded-xl text-gray-400 hover:text-white md:hidden">
                <X size={18} />
              </button>
            )}
          </div>

          {headerPrefix}

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search groups & members..."
              className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#93B733]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-4 custom-scrollbar">
          {/* Main Lounge */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-2.5 mb-1.5 flex items-center justify-between">
              <span>Main Channel</span>
              <span className="text-[9px] text-[#93B733] font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#93B733] animate-pulse"></span>Community</span>
            </div>
            <button
              onClick={() => { setActiveChannel({ type: "main", id: "main", title: `${conversationsData?.pgInfo?.title || "PG"} Lounge`, subtitle: `${allMembers.length} verified residents & host` }); setMobileSidebarOpen(false); }}
              className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition cursor-pointer text-left ${activeChannel.type === "main" ? "bg-[#93B733]/15 text-[#93B733] border border-[#93B733]/30 font-black shadow-xs" : "hover:bg-gray-200/50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 font-bold"}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${activeChannel.type === "main" ? "bg-[#93B733] text-white" : "bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300"}`}><Hash size={16} strokeWidth={2.5} /></div>
                <div className="min-w-0">
                  <p className="text-xs font-black truncate">{conversationsData?.pgInfo?.title || "PG"} Lounge</p>
                  <p className="text-[10px] font-medium text-gray-400 truncate">All residents + Owner</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300">{allMembers.length}</span>
            </button>
          </div>

          {/* Sub-Groups */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-2.5 mb-1.5 flex items-center justify-between">
              <span>Sub-Groups</span>
              <button onClick={() => setShowCreateGroup(true)} className="inline-flex items-center gap-1 text-[10px] text-[#93B733] hover:underline font-black cursor-pointer"><Plus size={12} /> Create Group</button>
            </div>
            {filteredGroups.length === 0 ? (
              <div className="p-3 text-center bg-gray-100/60 dark:bg-white/[0.02] border border-dashed border-gray-200 dark:border-white/10 rounded-2xl">
                <p className="text-[11px] font-semibold text-gray-400">No sub-groups yet</p>
                <button onClick={() => setShowCreateGroup(true)} className="mt-1 text-[10px] font-black text-[#93B733] hover:underline cursor-pointer">+ Start a study or roommate group</button>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredGroups.map((grp) => {
                  const IconComp = getChannelIcon(grp.icon);
                  const isSelected = activeChannel.type === "group" && activeChannel.id === grp.id;
                  return (
                    <button
                      key={grp.id}
                      onClick={() => { setActiveChannel({ type: "group", id: grp.id, title: grp.title, subtitle: grp.description || "Custom Sub-Group" }); setMobileSidebarOpen(false); }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition cursor-pointer text-left ${isSelected ? "bg-[#93B733]/15 text-[#93B733] border border-[#93B733]/30 font-black shadow-xs" : "hover:bg-gray-200/50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 font-bold"}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? "bg-[#93B733] text-white" : "bg-blue-500/10 text-blue-500 dark:text-blue-400"}`}><IconComp size={15} /></div>
                        <div className="min-w-0">
                          <p className="text-xs font-black truncate">{grp.title}</p>
                          <p className="text-[10px] font-medium text-gray-400 truncate">{grp.last_message || grp.description || "Sub-group channel"}</p>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-gray-400 shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* DMs */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-2.5 mb-1.5 flex items-center justify-between">
              <span>Direct Messages</span>
              <span className="text-[9px] text-gray-400 font-bold flex items-center gap-1"><Lock size={10} /> Encrypted</span>
            </div>
            {filteredDMs.length === 0 ? (
              <p className="text-[11px] text-gray-400 px-2.5 py-1">No other members available</p>
            ) : (
              <div className="space-y-1">
                {filteredDMs.map((person) => {
                  const isOwner = person.role === "owner";
                  const isSelected = activeChannel.type === "direct" && Number(activeChannel.id) === Number(person.id);
                  return (
                    <button
                      key={person.id}
                      onClick={() => {
                        setActiveChannel({
                          type: "direct",
                          id: person.id,
                          title: isOwner ? `${person.full_name} (PG Owner)` : (person.full_name || "PG Member"),
                          subtitle: isOwner ? "👑 Property Owner & Host" : (person.room_info || "Resident"),
                          targetUser: person
                        });
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-2xl transition cursor-pointer text-left ${isSelected ? "bg-[#93B733]/15 text-[#93B733] border border-[#93B733]/30 font-black shadow-xs" : isOwner ? "bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 text-gray-800 dark:text-gray-200" : "hover:bg-gray-200/50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 font-bold"}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs uppercase ${isOwner ? "bg-amber-500/20 text-amber-500 border border-amber-500/40" : "bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-white"}`}>
                            {person.full_name?.charAt(0) || "U"}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border-2 border-white dark:border-[#080b11]" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs font-black truncate">{person.full_name}</p>
                            {isOwner && <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">👑 PG Owner</span>}
                          </div>
                          <p className="text-[10px] font-medium text-gray-400 truncate">
                            {person.last_message ? `${person.is_sender ? "You: " : ""}${person.last_message}` : isOwner ? "Chat with Property Owner" : person.room_info || "Tap to chat"}
                          </p>
                        </div>
                      </div>
                      <MessageCircle size={14} className={isOwner ? "text-amber-500 shrink-0" : "text-gray-400 shrink-0"} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="p-3 border-t border-gray-200/80 dark:border-white/10 bg-gray-100/50 dark:bg-white/[0.02] flex items-center justify-between text-[10px] font-bold text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5"><Lock size={12} className="text-[#93B733]" /><span>End-to-End Encrypted</span></div>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#93B733]/20 text-[#93B733]">256-bit AES</span>
        </div>
      </aside>

      {/* ══════════ MAIN CHAT PANEL ══════════ */}
      <main className="flex-1 flex flex-col h-full bg-white dark:bg-[#0c1017] overflow-hidden">
        <header className="px-3.5 sm:px-5 py-3 border-b border-gray-200/80 dark:border-white/10 flex items-center justify-between gap-3 bg-white/80 dark:bg-[#0c1017]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <button onClick={() => setMobileSidebarOpen(true)} className="p-1.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 md:hidden">
              <Users size={18} />
            </button>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${activeChannel.type === "direct" ? "bg-amber-500/20 text-amber-500 border border-amber-500/40" : "bg-[#93B733]/20 text-[#93B733] border border-[#93B733]/40"}`}>
              {activeChannel.type === "direct" ? activeChannel.title.charAt(0) : activeChannel.type === "group" ? <Users size={18} /> : <Hash size={18} />}
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-black text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                <span>{activeChannel.title}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#93B733]/15 border border-[#93B733]/30 text-[9px] font-extrabold text-[#93B733]"><Lock size={9} /> E2EE</span>
              </h1>
              <p className="text-[10px] sm:text-xs font-semibold text-gray-400 truncate">{activeChannel.subtitle || (activeChannel.type === "main" ? "Verified PG Community Chat" : "Private Chat")}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button onClick={() => fetchActiveMessages(false)} className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition cursor-pointer" title="Refresh">
              <RefreshCw size={16} className={refreshing ? "animate-spin text-[#93B733]" : ""} />
            </button>
            <button onClick={() => setShowMembersDrawer(!showMembersDrawer)} className="px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-xs font-bold text-gray-700 dark:text-gray-300 transition flex items-center gap-1.5 cursor-pointer">
              <Users size={14} /><span className="hidden sm:inline">Members</span>
              <span className="px-1 rounded-full bg-[#93B733] text-white text-[10px] font-black">{allMembers.length}</span>
            </button>
          </div>
        </header>

        <div className="bg-emerald-500/5 border-b border-emerald-500/10 px-4 py-1.5 flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
          <div className="flex items-center gap-1.5 truncate">
            <ShieldCheck size={13} className="shrink-0" />
            <span className="truncate">{activeChannel.type === "direct" ? "Direct 1-on-1 private conversation • Only you and the recipient can read these messages." : "Messages are end-to-end encrypted with verified PG resident keys."}</span>
          </div>
          <span className="text-[10px] font-bold opacity-80 shrink-0 hidden sm:inline">Safe &amp; Encrypted</span>
        </div>

        {pinnedMessages.length > 0 && activeChannel.type === "main" && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Pin size={14} className="text-amber-500 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase text-amber-500">Notice: </span>
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{pinnedMessages[0].message}</span>
              </div>
            </div>
            {isOwnerMode && (
              <button onClick={() => handleTogglePin(pinnedMessages[0].id)} className="text-[10px] font-bold text-amber-500 hover:underline cursor-pointer">Unpin</button>
            )}
          </div>
        )}

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3.5 custom-scrollbar">
          {messagesLoading && messages.length === 0 ? (
            <div className="h-full flex items-center justify-center"><div className="w-8 h-8 border-3 border-[#93B733] border-t-transparent rounded-full animate-spin" /></div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-14 h-14 rounded-3xl bg-[#93B733]/15 text-[#93B733] flex items-center justify-center border border-[#93B733]/30"><Sparkles size={26} /></div>
              <div>
                <h3 className="text-base font-black text-gray-900 dark:text-white">Welcome to {activeChannel.title}!</h3>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 max-w-sm mt-1">
                  {activeChannel.type === "direct" ? "Start a safe and encrypted 1-on-1 direct conversation." : "Say hello to your fellow verified residents and property host."}
                </p>
              </div>
              <button onClick={() => setInputMsg(isOwnerMode ? "👋 Hello residents! Welcome to our community chat." : "👋 Hello everyone!")} className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-xs font-bold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 transition cursor-pointer">👋 Say &quot;Hello!&quot;</button>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMine = Number(msg.sender_id) === Number(currentUser?.id);
              const isOwner = msg.sender_role === "owner";
              const isAnnouncementMsg = msg.message_type === "announcement";
              const isEditingThis = editingMessageId === msg.id;

              if (isAnnouncementMsg) {
                return (
                  <div key={msg.id || index} className="w-full my-3 p-4 sm:p-5 rounded-3xl bg-amber-50 dark:bg-[#18140c] border-2 border-amber-400 dark:border-amber-500/60 shadow-lg animate-in fade-in duration-200">
                    <div className="flex items-center justify-between gap-2 mb-2.5 pb-2.5 border-b border-amber-200 dark:border-amber-500/30">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-black flex items-center justify-center font-black shadow-md shrink-0">
                          <Sparkles size={18} />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                            <span>Official Host Announcement</span>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 uppercase">Verified</span>
                          </p>
                          <p className="text-[11px] text-amber-800/80 dark:text-amber-200/70 font-bold">By {msg.sender_name} • {msg.room_no || "Management"}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-amber-700/80 dark:text-amber-400/80">
                        {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now"}
                      </span>
                    </div>

                    {isEditingThis ? (
                      <div className="space-y-2 mt-2">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full bg-white dark:bg-[#10141e] text-gray-900 dark:text-white p-3 text-xs sm:text-sm rounded-xl border border-amber-400 dark:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none font-medium"
                          rows={3}
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <button onClick={handleCancelEdit} disabled={savingEdit} className="px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-gray-200 hover:bg-gray-300 transition cursor-pointer font-bold">Cancel</button>
                          <button onClick={() => handleSaveEdit(msg.id)} disabled={savingEdit || !editText.trim()} className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black transition cursor-pointer font-black flex items-center gap-1 shadow-xs">
                            <Check size={13} />{savingEdit ? "Saving..." : "Save Changes"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm sm:text-base font-black text-amber-950 dark:text-amber-100 leading-relaxed tracking-wide">{msg.message}</p>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-amber-200 dark:border-amber-500/20 text-[11px] font-black">
                      <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-black">
                        <Lock size={12} /><span>Verified Community Announcement</span>
                      </span>
                      {isMine && (
                        <div className="flex items-center gap-3">
                          <button onClick={() => handleStartEdit(msg)} className="text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-black"><Pencil size={12} /> Edit</button>
                          <button onClick={() => handleDeleteMessage(msg.id)} className="text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer font-black"><Trash2 size={13} /> Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id || index} className={`flex items-start gap-2.5 sm:gap-3 group ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 select-none shadow-xs ${isOwner ? "bg-amber-500 text-black border border-amber-400" : isMine ? "bg-[#93B733] text-black border border-[#82a32d]" : "bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white border border-gray-300 dark:border-white/10"}`}>
                    {msg.sender_name ? msg.sender_name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className={`max-w-[80%] sm:max-w-[70%] space-y-1 ${isMine ? "items-end text-right" : "items-start text-left"}`}>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-black text-gray-900 dark:text-white">{isMine ? "You" : msg.sender_name}</span>
                      {isOwner && <span className="text-[8px] font-black px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 uppercase">👑 Host</span>}
                      {msg.room_no && !isOwner && <span className="text-[8px] font-bold px-1.5 py-0.2 rounded-md bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">{msg.room_no}</span>}
                      <span className="text-[9px] font-medium text-gray-400">{msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now"}</span>
                    </div>

                    {isEditingThis ? (
                      <div className="space-y-2 p-2.5 bg-gray-100 dark:bg-[#161c28] rounded-2xl border border-[#93B733]/50 shadow-md">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full bg-white dark:bg-[#0c1017] text-gray-900 dark:text-white p-2.5 text-xs sm:text-sm rounded-xl border border-gray-300 dark:border-white/15 focus:outline-none focus:border-[#93B733] resize-none font-medium"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <button onClick={handleCancelEdit} disabled={savingEdit} className="px-2.5 py-1 rounded-lg bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-300 transition cursor-pointer font-bold">Cancel</button>
                          <button onClick={() => handleSaveEdit(msg.id)} disabled={savingEdit || !editText.trim()} className="px-3 py-1 rounded-lg bg-[#93B733] hover:bg-[#82a32d] text-white transition cursor-pointer font-black flex items-center gap-1 shadow-xs">
                            <Check size={12} />{savingEdit ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={`relative p-3 sm:p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed break-words shadow-sm ${isMine ? "bg-[#93B733] text-[#0A2312] border border-[#83a628] rounded-tr-xs" : "bg-white dark:bg-[#141a24] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-white/10 rounded-tl-xs shadow-xs"}`}>
                        <p className={`font-black text-xs sm:text-sm ${isMine ? "text-[#0A2312]" : "text-gray-900 dark:text-gray-100"}`}>{msg.message}</p>
                        <div className={`flex items-center gap-1.5 mt-1 text-[10px] font-extrabold ${isMine ? "text-[#0A2312]/80 justify-end" : "text-gray-400 justify-start"}`}>
                          <Lock size={10} /><span>Encrypted</span>{isMine && <CheckCheck size={12} className="text-[#0A2312]" />}
                        </div>
                      </div>
                    )}

                    {isMine && !isEditingThis && (
                      <div className="flex items-center gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity justify-end pt-0.5">
                        <button onClick={() => handleStartEdit(msg)} className="text-[11px] text-gray-600 dark:text-gray-300 hover:text-[#93B733] flex items-center gap-0.5 cursor-pointer font-bold transition">
                          <Pencil size={11} /> Edit
                        </button>
                        <button onClick={() => handleDeleteMessage(msg.id)} className="text-[11px] text-rose-500 hover:underline flex items-center gap-0.5 cursor-pointer font-bold transition">
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Reactions */}
        <div className="px-3.5 sm:px-5 py-2 border-t border-gray-100 dark:border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1">Quick:</span>
          {QUICK_REACTIONS.map((r, i) => (
            <button key={i} onClick={() => setInputMsg(r)} className="px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-[#93B733]/15 hover:text-[#93B733] border border-transparent text-[11px] font-bold text-gray-600 dark:text-gray-300 whitespace-nowrap transition cursor-pointer">
              {r}
            </button>
          ))}
        </div>

        {/* Input Footer */}
        <footer className="p-3 sm:p-4 border-t border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-[#080b11]/70 space-y-2">
          {typingUsers.length > 0 && (
            <div className="px-2 py-0.5 text-[11px] font-bold text-[#93B733] flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-[#93B733]" />
              <span>{typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...</span>
            </div>
          )}
          {isOwnerMode && (
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 cursor-pointer">
                <input type="checkbox" checked={isAnnouncement} onChange={(e) => setIsAnnouncement(e.target.checked)} className="accent-amber-500 rounded cursor-pointer" />
                <Megaphone size={14} /><span>Post as Verified Host Announcement</span>
              </label>
            </div>
          )}
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><Lock size={13} className="text-[#93B733]" /></div>
              <input
                type="text"
                value={inputMsg}
                onChange={handleInputChange}
                placeholder={isAnnouncement ? "Write official PG announcement (pinned to notice board)..." : `Message ${activeChannel.title}...`}
                className={`w-full bg-white dark:bg-[#111622] border rounded-2xl pl-9 pr-4 py-3 text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none transition ${isAnnouncement ? "border-amber-400 focus:ring-1 focus:ring-amber-500" : "border-gray-300 dark:border-white/15 focus:border-[#93B733] focus:ring-1 focus:ring-[#93B733]"}`}
              />
            </div>
            <button type="submit" disabled={!inputMsg.trim() || sending} className={`px-5 py-3 rounded-2xl disabled:opacity-50 text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md transition cursor-pointer shrink-0 active:scale-95 ${isAnnouncement ? "bg-amber-500 hover:bg-amber-600 text-black" : "bg-[#93B733] hover:bg-[#82a32d] text-white"}`}>
              <span>{isAnnouncement ? "Post" : "Send"}</span><Send size={15} />
            </button>
          </form>
        </footer>
      </main>

      {/* ══════════ RIGHT MEMBERS DRAWER ══════════ */}
      {showMembersDrawer && (
        <aside className="w-72 bg-gray-50 dark:bg-[#080b11] border-l border-gray-200/80 dark:border-white/10 flex flex-col z-20 animate-in slide-in-from-right duration-200">
          <div className="p-3.5 border-b border-gray-200/80 dark:border-white/10 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-1.5">
              <Users size={14} className="text-[#93B733]" /><span>PG Members ({allMembers.length})</span>
            </h3>
            <button onClick={() => setShowMembersDrawer(false)} className="p-1 rounded-lg text-gray-400 hover:text-white"><X size={16} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {allMembers.map((mem) => {
              const isOwner = mem.role === "owner";
              const isSelf = Number(mem.id) === Number(currentUser?.id);
              return (
                <div
                  key={mem.id}
                  onClick={() => {
                    if (!isSelf) {
                      setActiveChannel({
                        type: "direct",
                        id: mem.id,
                        title: isOwner ? `${mem.full_name} (PG Owner)` : (mem.full_name || "PG Member"),
                        subtitle: isOwner ? "👑 Property Owner & Host" : (mem.room_info || "Resident"),
                        targetUser: mem
                      });
                      setShowMembersDrawer(false);
                    }
                  }}
                  className={`p-2.5 rounded-2xl bg-white dark:bg-white/5 border border-gray-200/60 dark:border-white/10 flex items-center justify-between gap-2 transition ${!isSelf ? "cursor-pointer hover:border-[#93B733]/50 hover:bg-[#93B733]/5" : "opacity-75"}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${isOwner ? "bg-amber-500/20 text-amber-500 border border-amber-500/40" : "bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-white"}`}>{mem.full_name?.charAt(0) || "U"}</div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                        <span>{mem.full_name}</span>
                        {isOwner && <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">👑 PG Owner</span>}
                        {isSelf && <span className="text-[9px] text-[#93B733] font-black">(You)</span>}
                      </p>
                      <p className="text-[10px] font-medium text-gray-400 truncate">{isOwner ? "Property Owner & Management" : (mem.room_info || "Resident")}</p>
                    </div>
                  </div>
                  {!isSelf && <span className="text-[10px] font-bold text-[#93B733]">DM</span>}
                </div>
              );
            })}
          </div>
        </aside>
      )}

      {/* ══════════ CREATE SUB-GROUP MODAL ══════════ */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#0c1017] rounded-3xl border border-gray-200 dark:border-white/15 p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#93B733]/20 text-[#93B733] flex items-center justify-center font-black"><Plus size={18} /></div>
                <div><h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-white">Create Sub-Group</h3><p className="text-[11px] font-semibold text-gray-400">For roommates, study sessions, or events</p></div>
              </div>
              <button onClick={() => setShowCreateGroup(false)} className="p-1 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateGroup} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-black uppercase text-gray-600 dark:text-gray-400 mb-1">Group Title *</label>
                <input type="text" value={newGroupTitle} onChange={(e) => setNewGroupTitle(e.target.value)} placeholder="e.g. Floor 2 Roommates, Late Night Study" required className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#93B733]" />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase text-gray-600 dark:text-gray-400 mb-1">Topic / Purpose (Optional)</label>
                <input type="text" value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} placeholder="e.g. Room cleaning coordination & study" className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#93B733]" />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase text-gray-600 dark:text-gray-400 mb-1.5">Category</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {GROUP_ICONS.map((cat) => {
                    const IconC = cat.icon;
                    return (
                      <button type="button" key={cat.id} onClick={() => setNewGroupIcon(cat.id)} className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${newGroupIcon === cat.id ? "bg-[#93B733]/20 border-[#93B733] text-[#93B733] font-black" : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}>
                        <IconC size={16} /><span className="text-[9px] font-bold truncate">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase text-gray-600 dark:text-gray-400 mb-1.5">Add PG Members ({selectedMemberIds.length} selected)</label>
                <div className="max-h-36 overflow-y-auto space-y-1 p-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl custom-scrollbar">
                  {allMembers.map((mem) => {
                    const isSelected = selectedMemberIds.includes(mem.id);
                    return (
                      <label key={mem.id} className="flex items-center justify-between p-1.5 rounded-xl hover:bg-gray-200/50 dark:hover:bg-white/10 cursor-pointer">
                        <div className="flex items-center gap-2 min-w-0">
                          <input type="checkbox" checked={isSelected} onChange={(e) => setSelectedMemberIds((prev) => e.target.checked ? [...prev, mem.id] : prev.filter((id) => id !== mem.id))} className="accent-[#93B733] rounded cursor-pointer" />
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{mem.full_name} {mem.role === "owner" ? "(👑 Host)" : ""}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium truncate">{mem.room_info || "Member"}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button type="button" onClick={() => setShowCreateGroup(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition cursor-pointer">Cancel</button>
                <button type="submit" disabled={!newGroupTitle.trim() || creatingGroup} className="flex-1 py-2.5 rounded-xl bg-[#93B733] hover:bg-[#82a32d] disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-md">{creatingGroup ? "Creating..." : "Create Group"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
