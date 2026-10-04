/**
 * Dormgle — in-memory match-making service for the Omegle-style video chat.
 *
 * The server only facilitates *signaling* (SDP + ICE candidate exchange) and
 * random pairing logic. Once two peers are connected, the media stream flows
 * P2P — the server never relays audio/video.
 */

const RECENT_COOLDOWN_MS = parseInt(
  process.env.DORMGLE_RECENT_COOLDOWN_MS || "120000",
  10
); // 2 min default — recently paired strangers won't re-match
const MATCH_COOLDOWN_MS = parseInt(
  process.env.DORMGLE_MATCH_COOLDOWN_MS || "10000",
  10
); // min time between auto-matches after a skip — default 10s

// ── Active pool ──────────────────────────────────────────────
// userId → { socketId, name, avatar, joinedAt }
const waitingPool = new Map();

// userId → Set of userIds they've recently been paired with (for cooldown)
const recentPairs = new Map();

// roomId → { userIdA, userIdB, createdAt }
const activeRooms = new Map();

// userId → socketId  (fast lookup on disconnect)
const userSocketMap = new Map();

function now() {
  return Date.now();
}

function addRecentPair(userIdA, userIdB) {
  for (const [a, b] of [[userIdA, userIdB], [userIdB, userIdA]]) {
    let set = recentPairs.get(a);
    if (!set) {
      set = new Set();
      recentPairs.set(a, set);
    }
    set.add(b);
    // Schedule cleanup of this entry after the cooldown expires
    setTimeout(() => {
      const s = recentPairs.get(a);
      if (s) {
        s.delete(b);
        if (s.size === 0) recentPairs.delete(a);
      }
    }, RECENT_COOLDOWN_MS);
  }
}

function getRecentPartners(userId) {
  return recentPairs.get(userId) || new Set();
}

function isInPool(userId) {
  return waitingPool.has(userId);
}

function addToPool(userId, socketId, name, avatar) {
  waitingPool.set(userId, { socketId, name, avatar, joinedAt: now() });
  userSocketMap.set(userId, socketId);
}

function removeFromPool(userId) {
  waitingPool.delete(userId);
  userSocketMap.delete(userId);
}

function clearRecentFor(userId) {
  recentPairs.delete(userId);
}

/**
 * Pick a random match for `userId` from the waiting pool, excluding the user
 * themselves and anyone in their recent-partner cooldown.
 *
 * @returns {{ matchId, matchName, matchAvatar, roomId, role } | null}
 */
function findMatchForUser(userId) {
  const candidates = [];
  for (const [otherId, info] of waitingPool) {
    if (otherId === userId) continue;
    if (getRecentPartners(userId).has(otherId)) continue;
    candidates.push({ otherId, info });
  }

  if (candidates.length === 0) return null;

  const chosen = candidates[Math.floor(Math.random() * candidates.length)];

  // Remove both from the pool — they've been paired.
  removeFromPool(userId);
  removeFromPool(chosen.otherId);

  // Record the recent pair so they don't re-match immediately.
  addRecentPair(userId, chosen.otherId);

  const roomId = `${userId}_${chosen.otherId}_${Date.now()}`;
  activeRooms.set(roomId, {
    userIdA: userId,
    userIdB: chosen.otherId,
    createdAt: now(),
  });

  // `caller` starts the WebRTC offer; `callee` receives it.
  // The user who triggered the search is the caller (they initiated the request).
  const matchResult = {
    matchId: chosen.otherId,
    matchName: chosen.info.name,
    matchAvatar: chosen.info.avatar,
    matchSocketId: chosen.info.socketId,
    roomId,
    role: "caller",
  };

  return matchResult;
}

/** Called when a user wants to be put back into the pool after skipping. */
function requeueUser(userId, socketId, name, avatar) {
  removeFromPool(userId);
  addToPool(userId, socketId, name, avatar);
}

/** Called when a user ends their Dormgle session entirely. */
function leaveDormgle(userId) {
  removeFromPool(userId);
  clearRecentFor(userId);

  // Remove from any active room
  for (const [roomId, room] of activeRooms) {
    if (room.userIdA === userId || room.userIdB === userId) {
      const partnerId = room.userIdA === userId ? room.userIdB : room.userIdA;
      activeRooms.delete(roomId);
      // Partner gets put back in pool so they can find someone new
      return { roomId, partnerId };
    }
  }
  return null;
}

/** Clean up on socket disconnect. */
function cleanupSocket(userId, socketId) {
  // Only remove from pool if this socketId is the current one for the user
  if (userSocketMap.get(userId) === socketId) {
    removeFromPool(userId);
  }
}

export {
  waitingPool,
  activeRooms,
  addRecentPair,
  getRecentPartners,
  isInPool,
  addToPool,
  removeFromPool,
  findMatchForUser,
  requeueUser,
  leaveDormgle,
  cleanupSocket,
};
