import { useState, useEffect, useCallback } from "react";
import { Building2, ChevronDown } from "lucide-react";
import api from "../../services/api";
import PGChatRoom from "../../components/chat/PGChatRoom";

export default function OwnerPGChat() {
  const [pgRooms, setPgRooms] = useState([]);
  const [selectedPgId, setSelectedPgId] = useState(null);
  const [selectedPg, setSelectedPg] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMyRooms = useCallback(async () => {
    try {
      const res = await api.get("/pg-chat/my-rooms");
      if (res.data?.success && Array.isArray(res.data.rooms)) {
        setPgRooms(res.data.rooms);
        if (res.data.rooms.length > 0 && !selectedPgId) {
          setSelectedPgId(res.data.rooms[0].id);
          setSelectedPg(res.data.rooms[0]);
        }
      }
    } catch (err) {
      console.error("[OwnerPGChat] fetchMyRooms error:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedPgId]);

  useEffect(() => {
    fetchMyRooms();
  }, [fetchMyRooms]);

  const handleSelectPg = (pg) => {
    setSelectedPgId(pg.id);
    setSelectedPg(pg);
  };

  if (loading) {
    return (
      <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-white dark:bg-[#0c1017] rounded-none border-0 shadow-none">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#93B733] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Loading Property Chats...</p>
        </div>
      </div>
    );
  }

  if (pgRooms.length === 0) {
    return (
      <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-white dark:bg-[#0c1017] rounded-none border-0 shadow-none p-8 text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400">
          <Building2 size={26} />
        </div>
        <h3 className="text-base font-black text-gray-900 dark:text-white">No Properties Listed Yet</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm">
          Once your PG properties are published and have verified bookings, their community lounges will appear here.
        </p>
      </div>
    );
  }

  const pgSelectorDropdown = pgRooms.length > 1 ? (
    <div className="relative">
      <select
        value={selectedPgId || ""}
        onChange={(e) => {
          const found = pgRooms.find((p) => Number(p.id) === Number(e.target.value));
          if (found) handleSelectPg(found);
        }}
        className="w-full appearance-none bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 pr-8 text-xs font-bold text-gray-800 dark:text-gray-200 focus:outline-none focus:border-[#93B733] cursor-pointer"
      >
        {pgRooms.map((pg) => (
          <option key={pg.id} value={pg.id} className="bg-white dark:bg-[#0c1017] text-gray-900 dark:text-white">
            {pg.title} ({pg.city || "Active"})
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  ) : null;

  return (
    <PGChatRoom
      key={selectedPgId}
      pgId={selectedPgId}
      initialPgInfo={selectedPg}
      isOwnerMode={true}
      headerPrefix={pgSelectorDropdown}
    />
  );
}
