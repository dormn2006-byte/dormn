import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { verifyChatAccess } from "./controllers/pgChatController.js";

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

    socket.on("disconnect", () => {
      console.log(`[Socket] Client disconnected: ${socket.user?.id}`);
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
