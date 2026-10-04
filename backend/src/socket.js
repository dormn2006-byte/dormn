import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { verifyChatAccess } from "./controllers/pgChatController.js";
import User from "./schemas/userSchema.js";
import {
  addToPool,
  findMatchForUser,
  requeueUser,
  cleanupSocket,
  activeRooms,
} from "./services/dormgleService.js";

let io = null;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"]
    }
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error("Authentication required"));
      }

      const cleanToken = token.replace("Bearer ", "");
      const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET || "defaultsecret");
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Invalid token authentication"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] ⚡ Client connected: ${socket.user?.id} (${socket.user?.role})`);

    // Join room for a specific PG after permission check
    socket.on("join_pg_room", async ({ pgId }) => {
      if (!pgId) return;
      try {
        const access = await verifyChatAccess(socket.user.id, socket.user.role, pgId);
        if (access.allowed) {
          const roomName = `pg_${pgId}`;
          socket.join(roomName);
          console.log(`[Socket] 🔑 User ${socket.user.id} joined ${roomName}`);
          socket.emit("joined_room", { success: true, room: roomName, pgId });
        } else {
          socket.emit("error_message", { message: access.reason || "Access denied to PG chat room" });
        }
      } catch (err) {
        console.error("[Socket] join_pg_room error:", err.message);
      }
    });

    // Leave room for a PG
    socket.on("leave_pg_room", ({ pgId }) => {
      if (!pgId) return;
      const roomName = `pg_${pgId}`;
      socket.leave(roomName);
      console.log(`[Socket] 👋 User ${socket.user.id} left ${roomName}`);
    });

    // User typing status indicator
    socket.on("typing_start", ({ pgId, channelId }) => {
      if (!pgId) return;
      socket.to(`pg_${pgId}`).emit("user_typing", {
        userId: socket.user.id,
        userName: socket.user.full_name || socket.user.name || "A resident",
        channelId
      });
    });

    socket.on("typing_stop", ({ pgId, channelId }) => {
      if (!pgId) return;
      socket.to(`pg_${pgId}`).emit("user_stopped_typing", {
        userId: socket.user.id,
        channelId
      });
    });

    // ── Dormgle (Omegle-style video chat) ──────────────────────
    // The server only facilitates signaling + random matching. Media flows P2P.

    const findSocketByUserId = (targetUserId) => {
      for (const s of io.sockets.sockets.values()) {
        if (s.user?.id === targetUserId) return s;
      }
      return null;
    };

    const getUserInfo = (s) => {
      const cached = s.data?.dormgleUserInfo || {};
      return {
        id: s.user.id,
        name: cached.name || s.user.full_name || s.user.name || "A resident",
        avatar: cached.avatar || s.user.profile_image || null,
      };
    };

    // Fetch user's display info from DB and cache it on the socket
    const fetchAndCacheUserInfo = async (s) => {
      if (s.data?.dormgleUserInfo) return s.data.dormgleUserInfo;
      try {
        const dbUser = await User.findById(s.user.id)
          .select("full_name profile_image")
          .lean();
        const info = {
          name: dbUser?.full_name || s.user.full_name || s.user.name || "A resident",
          avatar: dbUser?.profile_image || s.user.profile_image || null,
        };
        s.data.dormgleUserInfo = info;
        return info;
      } catch {
        const info = {
          name: s.user.full_name || s.user.name || "A resident",
          avatar: s.user.profile_image || null,
        };
        s.data.dormgleUserInfo = info;
        return info;
      }
    };

    // Join two matched sockets into a room and notify both of the pairing
    const finalizeMatch = (callerSock, calleeSock, match) => {
      const roomName = `dormgle_${match.roomId}`;
      callerSock.join(roomName);
      calleeSock.join(roomName);

      callerSock.data.dormgleRoom = roomName;
      callerSock.data.dormgleRole = "caller";
      callerSock.data.dormglePartner = calleeSock.user.id;

      calleeSock.data.dormgleRoom = roomName;
      calleeSock.data.dormgleRole = "callee";
      calleeSock.data.dormglePartner = callerSock.user.id;

      callerSock.emit("dormgle:matched", {
        roomId: match.roomId,
        role: "caller",
        partner: getUserInfo(calleeSock),
      });

      calleeSock.emit("dormgle:matched", {
        roomId: match.roomId,
        role: "callee",
        partner: getUserInfo(callerSock),
      });
    };

    // Notify both parties in a room that the connection is broken, then clean up
    const breakRoom = (roomName, userId) => {
      for (const s of io.sockets.sockets.values()) {
        if (s.data.dormgleRoom === roomName && s.user.id !== userId) {
          s.data.dormgleRoom = null;
          s.data.dormglePartner = null;
          s.emit("dormgle:partner-left");
        }
      }
      activeRooms.forEach((r, rid) => {
        if (`dormgle_${r.roomId}` === roomName) activeRooms.delete(rid);
      });
    };

    socket.on("dormgle:join", async () => {
      const userId = socket.user.id;
      const info = await fetchAndCacheUserInfo(socket);
      addToPool(userId, socket.id, info.name, info.avatar);

      const match = findMatchForUser(userId);
      if (match) {
        const calleeSock = findSocketByUserId(match.matchId);
        if (calleeSock) {
          finalizeMatch(socket, calleeSock, match);
        } else {
          socket.emit("dormgle:waiting");
        }
      } else {
        socket.emit("dormgle:waiting");
      }
    });

    // Relay WebRTC signaling (offer/answer/ICE) within a matched room
    const relaySignal = (event) => (payload) => {
      const room = socket.data.dormgleRoom;
      if (!room) return;
      socket.to(room).emit(event, payload);
    };

    socket.on("dormgle:offer", relaySignal("dormgle:offer"));
    socket.on("dormgle:answer", relaySignal("dormgle:answer"));
    socket.on("dormgle:ice-candidate", relaySignal("dormgle:ice-candidate"));

    // Skip current match → both go back to the pool and are re-paired (recent pair is on cooldown)
    socket.on("dormgle:skip", () => {
      const userId = socket.user.id;
      const roomName = socket.data.dormgleRoom;
      if (!roomName) return;

      const partnerSock = findSocketByUserId(socket.data.dormglePartner);

      // Tear down the room, notify the partner
      breakRoom(roomName, userId);
      socket.leave(roomName);
      socket.data.dormgleRoom = null;
      socket.data.dormglePartner = null;

      // Put partner back in the pool
      if (partnerSock) {
        const partnerInfo = getUserInfo(partnerSock);
        requeueUser(partnerSock.user.id, partnerSock.id, partnerInfo.name, partnerInfo.avatar);
      }

      // Put skipper back and rematch
      const skipperInfo = getUserInfo(socket);
      requeueUser(userId, socket.id, skipperInfo.name, skipperInfo.avatar);

      const match = findMatchForUser(userId);
      if (match) {
        const calleeSock = findSocketByUserId(match.matchId);
        if (calleeSock) {
          finalizeMatch(socket, calleeSock, match);
        } else {
          socket.emit("dormgle:waiting");
        }
      } else {
        socket.emit("dormgle:waiting");
      }

      // If the partner wasn't matched with the skipper, try to match them too
      if (partnerSock && !partnerSock.data.dormgleRoom) {
        const partnerMatch = findMatchForUser(partnerSock.user.id);
        if (partnerMatch) {
          const calleeSock2 = findSocketByUserId(partnerMatch.matchId);
          if (calleeSock2) {
            finalizeMatch(partnerSock, calleeSock2, partnerMatch);
          } else {
            partnerSock.emit("dormgle:waiting");
          }
        } else {
          partnerSock.emit("dormgle:waiting");
        }
      }
    });

    // End session → leave the room, remove from pool, notify partner
    socket.on("dormgle:end", async () => {
      const userId = socket.user.id;
      const roomName = socket.data.dormgleRoom;

      if (roomName) {
        const partnerSock = findSocketByUserId(socket.data.dormglePartner);
        breakRoom(roomName, userId);
        socket.leave(roomName);

        // Requeue the partner so they can find someone new
        if (partnerSock) {
          await fetchAndCacheUserInfo(partnerSock);
          const partnerInfo = getUserInfo(partnerSock);
          requeueUser(partnerSock.user.id, partnerSock.id, partnerInfo.name, partnerInfo.avatar);
          const partnerMatch = findMatchForUser(partnerSock.user.id);
          if (partnerMatch) {
            const calleeSock = findSocketByUserId(partnerMatch.matchId);
            if (calleeSock) {
              finalizeMatch(partnerSock, calleeSock, partnerMatch);
            } else {
              partnerSock.emit("dormgle:waiting");
            }
          } else {
            partnerSock.emit("dormgle:waiting");
          }
        }

        socket.data.dormgleRoom = null;
        socket.data.dormglePartner = null;
      }

      cleanupSocket(userId, socket.id);
      socket.emit("dormgle:ended");
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] Client disconnected: ${socket.user?.id}`);
      const room = socket.data.dormgleRoom;
      if (room) {
        const partnerSock = findSocketByUserId(socket.data.dormglePartner);
        breakRoom(room, socket.user?.id);
        // Requeue the partner so they can find someone new
        if (partnerSock) {
          requeueUser(
            partnerSock.user.id, partnerSock.id,
            partnerSock.user.full_name || partnerSock.user.name || "A resident",
            partnerSock.user.profile_image || null
          );
          const partnerMatch = findMatchForUser(partnerSock.user.id);
          if (partnerMatch) {
            const calleeSock = findSocketByUserId(partnerMatch.matchId);
            if (calleeSock) {
              finalizeMatch(partnerSock, calleeSock, partnerMatch);
            } else {
              partnerSock.emit("dormgle:waiting");
            }
          } else {
            partnerSock.emit("dormgle:waiting");
          }
        }
      }
      cleanupSocket(socket.user?.id, socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    console.warn("[Socket] IO instance not initialized yet!");
  }
  return io;
};

/** Broadcast event to a specific PG room */
export const emitToPGRoom = (pgId, event, data) => {
  if (io && pgId) {
    io.to(`pg_${pgId}`).emit(event, data);
  }
};
