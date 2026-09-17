import { useState, useEffect } from "react";
import api from "../../services/api";
import PGChatRoom from "../../components/chat/PGChatRoom";

export default function PGChat({ pgInfo, onBack }) {
  const [activePgId, setActivePgId] = useState(pgInfo?.pg_id || pgInfo?.id || null);
  const [loading, setLoading] = useState(!activePgId);

  useEffect(() => {
    if (pgInfo?.pg_id || pgInfo?.id) {
      setActivePgId(pgInfo.pg_id || pgInfo.id);
      setLoading(false);
    } else if (!activePgId) {
      api.get("/pg-chat/my-rooms")
        .then((res) => {
          if (res.data?.success && Array.isArray(res.data.rooms) && res.data.rooms.length > 0) {
            setActivePgId(res.data.rooms[0].id);
          }
        })
        .catch((err) => console.error("[PG-Chat] Room discovery error:", err))
        .finally(() => setLoading(false));
    }
  }, [pgInfo, activePgId]);

  if (loading && !activePgId) {
    return (
      <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-white dark:bg-[#0c1017] rounded-3xl border border-gray-200/80 dark:border-white/10 shadow-xl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#93B733] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Loading your PG community...</p>
        </div>
      </div>
    );
  }

  return (
    <PGChatRoom
      pgId={activePgId}
      initialPgInfo={pgInfo}
      onBack={onBack}
      isOwnerMode={false}
    />
  );
}
