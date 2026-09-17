import pool from "../config/db.js";
import { emitToPGRoom } from "../socket.js";

// Initialize tables once
const initTable = async () => {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS pg_chat_conversations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pg_id INT NOT NULL,
        type ENUM('main', 'group', 'direct') NOT NULL DEFAULT 'group',
        title VARCHAR(200) NOT NULL,
        description VARCHAR(500) NULL,
        icon VARCHAR(50) DEFAULT 'users',
        created_by INT NOT NULL,
        members_json JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_pg_conv (pg_id)
      )
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS pg_chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pg_id INT NOT NULL,
        conversation_id INT NULL DEFAULT NULL,
        recipient_id INT NULL DEFAULT NULL,
        sender_id INT NOT NULL,
        sender_role ENUM('owner', 'student', 'superadmin') NOT NULL DEFAULT 'student',
        sender_name VARCHAR(150) NOT NULL,
        sender_avatar VARCHAR(500) NULL,
        room_no VARCHAR(100) NULL,
        message TEXT NOT NULL,
        message_type ENUM('text', 'image', 'announcement') DEFAULT 'text',
        is_pinned BOOLEAN DEFAULT FALSE,
        is_encrypted BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_pg_chat (pg_id, created_at),
        INDEX idx_sender (sender_id),
        INDEX idx_conv (conversation_id),
        INDEX idx_recipient (recipient_id)
      )
    `);

    try { await pool.execute("ALTER TABLE pg_chat_messages ADD COLUMN conversation_id INT NULL DEFAULT NULL"); } catch {}
    try { await pool.execute("ALTER TABLE pg_chat_messages ADD COLUMN recipient_id INT NULL DEFAULT NULL"); } catch {}
    try { await pool.execute("ALTER TABLE pg_chat_messages ADD COLUMN is_encrypted BOOLEAN DEFAULT TRUE"); } catch {}
  } catch (err) {
    console.error("[PG-Chat] Table init error:", err.message);
  }
};
initTable();

/**
 * Automatically post a welcome announcement from the PG owner to the resident upon joining/payment.
 */
export const postWelcomeMessageForBooking = async (bookingIdOrStudentId, pgId = null) => {
  try {
    const bookingQuery = pgId
      ? `SELECT b.id, b.student_id, b.pg_id, b.owner_id, s.full_name AS student_name, p.title AS pg_title, o.id AS owner_user_id, o.full_name AS owner_name, o.profile_image AS owner_avatar
         FROM bookings b JOIN users s ON b.student_id = s.id JOIN pgs p ON b.pg_id = p.id JOIN users o ON p.owner_id = o.id
         WHERE b.student_id = ? AND b.pg_id = ? AND b.status = 'approved' AND b.payment_status = 'paid' ORDER BY b.id DESC LIMIT 1`
      : `SELECT b.id, b.student_id, b.pg_id, b.owner_id, s.full_name AS student_name, p.title AS pg_title, o.id AS owner_user_id, o.full_name AS owner_name, o.profile_image AS owner_avatar
         FROM bookings b JOIN users s ON b.student_id = s.id JOIN pgs p ON b.pg_id = p.id JOIN users o ON p.owner_id = o.id
         WHERE b.id = ? LIMIT 1`;

    const [rows] = await pool.execute(bookingQuery, pgId ? [bookingIdOrStudentId, pgId] : [bookingIdOrStudentId]);
    if (!rows.length) return null;

    const row = rows[0];
    const studentName = row.student_name || "Resident";
    const pgTitle = row.pg_title || "our PG";
    const ownerName = row.owner_name || "Property Owner";

    const [existing] = await pool.execute(
      `SELECT id FROM pg_chat_messages WHERE pg_id = ? AND message_type = 'announcement' AND (message LIKE ? OR message LIKE ?) LIMIT 1`,
      [row.pg_id, `%${studentName}%`, `%Congratulations ${studentName}%`]
    );

    if (existing.length > 0) return existing[0];

    const welcomeText = `🎉 Congratulations ${studentName}! Welcome to ${pgTitle}. We are delighted to have you as part of our PG community! Feel free to introduce yourself here. 🏠✨`;

    const [result] = await pool.execute(
      `INSERT INTO pg_chat_messages (pg_id, conversation_id, recipient_id, sender_id, sender_role, sender_name, sender_avatar, room_no, message, message_type, is_pinned, is_encrypted)
       VALUES (?, NULL, NULL, ?, 'owner', ?, ?, 'Host / Management', ?, 'announcement', 0, 1)`,
      [row.pg_id, row.owner_user_id, ownerName, row.owner_avatar || null, welcomeText]
    );

    return { id: result.insertId, message: welcomeText };
  } catch (err) {
    console.error("[PG-Chat] postWelcomeMessageForBooking error:", err.message);
    return null;
  }
};

/** Verify user permissions for PG chat */
export const verifyChatAccess = async (userId, userRole, pgId) => {
  try {
    const [uRows] = await pool.execute("SELECT id, full_name, profile_image, role FROM users WHERE id = ?", [userId]);
    if (!uRows.length) return { allowed: false, reason: "User not found" };
    const user = uRows[0];

    const [pgRows] = await pool.execute("SELECT id, title, owner_id, profile_image FROM pgs WHERE id = ?", [pgId]);
    if (!pgRows.length) return { allowed: false, reason: "PG not found" };
    const pg = pgRows[0];

    const base = { pgTitle: pg.title, pgImage: pg.profile_image, ownerId: pg.owner_id, avatar: user.profile_image || null };

    if (user.role === "superadmin" || userRole === "superadmin") {
      return { allowed: true, role: "superadmin", name: user.full_name || "Super Admin", roomNo: "Admin Desk", ...base };
    }

    if (Number(pg.owner_id) === Number(userId) || (user.role === "owner" && Number(pg.owner_id) === Number(userId))) {
      return { allowed: true, role: "owner", name: user.full_name || "Property Owner", roomNo: "Host / Management", ...base };
    }

    const [bRows] = await pool.execute(
      `SELECT selected_room_type FROM bookings WHERE student_id = ? AND pg_id = ? AND status = 'approved' AND payment_status = 'paid' ORDER BY id DESC LIMIT 1`,
      [userId, pgId]
    );

    if (bRows.length > 0) {
      return { allowed: true, role: "student", name: user.full_name || "Resident", roomNo: bRows[0].selected_room_type || "Resident", ...base };
    }

    return { allowed: false, reason: "Access restricted. You must have an approved and paid booking to join this PG Community Chat." };
  } catch (err) {
    console.error("[PG-Chat] verifyChatAccess error:", err);
    return { allowed: false, reason: "Server verification error" };
  }
};

/** GET /api/pg-chat/:pgId/conversations */
export const getConversations = async (req, res) => {
  try {
    const { pgId } = req.params;
    const { id: userId, role: userRole } = req.user;

    const access = await verifyChatAccess(userId, userRole, pgId);
    if (!access.allowed) return res.status(403).json({ success: false, message: access.reason });

    if (access.role === "student") postWelcomeMessageForBooking(userId, pgId).catch(() => {});

    // 1. Fetch sub-groups
    const [groupRows] = await pool.execute(
      `SELECT c.id, c.title, c.description, c.icon, c.created_by, c.members_json, c.created_at,
        (SELECT message FROM pg_chat_messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message
       FROM pg_chat_conversations c WHERE c.pg_id = ? AND c.type = 'group' ORDER BY c.id DESC`,
      [pgId]
    );

    const customGroups = (groupRows || []).filter((g) => {
      if (!g.members_json) return true;
      try {
        const mems = typeof g.members_json === "string" ? JSON.parse(g.members_json) : g.members_json;
        return Array.isArray(mems) ? mems.map(Number).includes(Number(userId)) : true;
      } catch {
        return true;
      }
    });

    // 2. Fetch owner & residents
    const [ownerRows] = await pool.execute(
      `SELECT u.id, u.full_name, u.email, u.phone, u.profile_image, 'owner' as role, 'Host / Management' as room_info FROM pgs p JOIN users u ON u.id = p.owner_id WHERE p.id = ?`,
      [pgId]
    );

    const [residentRows] = await pool.execute(
      `SELECT u.id, u.full_name, u.email, u.phone, u.profile_image, 'student' as role, MAX(b.selected_room_type) as room_info
       FROM bookings b JOIN users u ON u.id = b.student_id
       WHERE b.pg_id = ? AND b.status = 'approved' AND b.payment_status = 'paid'
       GROUP BY u.id, u.full_name, u.email, u.phone, u.profile_image
       ORDER BY MAX(b.id) DESC`,
      [pgId]
    );

    const allMembers = [...(ownerRows || []), ...(residentRows || [])];
    const dmContacts = allMembers.filter((m) => Number(m.id) !== Number(userId));

    // 3. Batch fetch recent DMs in a single query
    const [recentDms] = await pool.execute(
      `SELECT sender_id, recipient_id, message, created_at FROM pg_chat_messages 
       WHERE pg_id = ? AND recipient_id IS NOT NULL AND (sender_id = ? OR recipient_id = ?) ORDER BY created_at DESC`,
      [pgId, userId, userId]
    );

    const dmMessagesMap = new Map();
    for (const msg of recentDms) {
      const partnerId = Number(msg.sender_id) === Number(userId) ? Number(msg.recipient_id) : Number(msg.sender_id);
      if (!dmMessagesMap.has(partnerId)) {
        dmMessagesMap.set(partnerId, { last_message: msg.message, is_sender: Number(msg.sender_id) === Number(userId) });
      }
    }

    return res.json({
      success: true,
      pgInfo: { id: Number(pgId), title: access.pgTitle, image: access.pgImage, ownerId: access.ownerId },
      currentUser: { id: userId, role: access.role, name: access.name, roomNo: access.roomNo, avatar: access.avatar },
      mainGroup: { id: "main", type: "main", title: `${access.pgTitle} Lounge`, membersCount: allMembers.length },
      customGroups,
      dmContacts: dmContacts.map((c) => ({ ...c, ...(dmMessagesMap.get(Number(c.id)) || { last_message: null, is_sender: false }) })),
      allMembers
    });
  } catch (err) {
    console.error("[PG-Chat] getConversations error:", err);
    return res.status(500).json({ success: false, message: "Failed to load chat channels." });
  }
};

/** POST /api/pg-chat/:pgId/groups */
export const createGroup = async (req, res) => {
  try {
    const { pgId } = req.params;
    const { title, description, icon = "users", memberIds = [] } = req.body;
    const { id: userId, role: userRole } = req.user;

    if (!title?.trim()) return res.status(400).json({ success: false, message: "Group title is required." });

    const access = await verifyChatAccess(userId, userRole, pgId);
    if (!access.allowed) return res.status(403).json({ success: false, message: access.reason });

    const cleanTitle = title.trim();
    const cleanDesc = description?.trim() || null;
    const includedMembers = Array.from(new Set([...memberIds.map(Number), Number(userId)]));

    const [result] = await pool.execute(
      `INSERT INTO pg_chat_conversations (pg_id, type, title, description, icon, created_by, members_json) VALUES (?, 'group', ?, ?, ?, ?, ?)`,
      [pgId, cleanTitle, cleanDesc, icon, userId, JSON.stringify(includedMembers)]
    );

    return res.status(201).json({
      success: true,
      group: { id: result.insertId, pg_id: Number(pgId), type: "group", title: cleanTitle, description: cleanDesc, icon, created_by: userId, members_json: includedMembers, created_at: new Date().toISOString() }
    });
  } catch (err) {
    console.error("[PG-Chat] createGroup error:", err);
    return res.status(500).json({ success: false, message: "Failed to create group." });
  }
};

/** GET /api/pg-chat/my-rooms */
export const getMyChatRooms = async (req, res) => {
  try {
    const { id: userId, role: userRole } = req.user;
    const query = userRole === "owner"
      ? `SELECT p.id, p.title, p.profile_image, p.city, p.area,
          (SELECT COUNT(*) FROM bookings b WHERE b.pg_id = p.id AND b.status = 'approved' AND b.payment_status = 'paid') as active_residents,
          (SELECT message FROM pg_chat_messages m WHERE m.pg_id = p.id ORDER BY m.created_at DESC LIMIT 1) as last_message
         FROM pgs p WHERE p.owner_id = ? ORDER BY p.id DESC`
      : `SELECT DISTINCT p.id, p.title, p.profile_image, p.city, p.area, p.owner_id,
          (SELECT u.full_name FROM users u WHERE u.id = p.owner_id) as owner_name, b.selected_room_type,
          (SELECT COUNT(*) FROM bookings b2 WHERE b2.pg_id = p.id AND b2.status = 'approved' AND b2.payment_status = 'paid') as active_residents,
          (SELECT message FROM pg_chat_messages m WHERE m.pg_id = p.id ORDER BY m.created_at DESC LIMIT 1) as last_message
         FROM bookings b JOIN pgs p ON p.id = b.pg_id WHERE b.student_id = ? AND b.status = 'approved' AND b.payment_status = 'paid' ORDER BY b.id DESC`;

    const [rooms] = await pool.execute(query, [userId]);
    return res.json({ success: true, rooms });
  } catch (err) {
    console.error("[PG-Chat] getMyChatRooms error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch chat rooms." });
  }
};

/** GET /api/pg-chat/:pgId/messages */
export const getChatMessages = async (req, res) => {
  try {
    const { pgId } = req.params;
    const { since, limit = 100, conversationId, directUserId } = req.query;
    const { id: userId, role: userRole } = req.user;

    const access = await verifyChatAccess(userId, userRole, pgId);
    if (!access.allowed) return res.status(403).json({ success: false, message: access.reason });

    let query = "SELECT * FROM pg_chat_messages WHERE pg_id = ?";
    const params = [pgId];

    if (directUserId) {
      query += " AND ((sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?))";
      params.push(userId, directUserId, directUserId, userId);
    } else if (conversationId && conversationId !== "main") {
      query += " AND conversation_id = ?";
      params.push(conversationId);
    } else {
      query += " AND conversation_id IS NULL AND recipient_id IS NULL";
    }

    if (since) {
      query += " AND created_at > ?";
      params.push(since);
    }

    const safeLimit = Math.max(1, Math.min(200, parseInt(limit, 10) || 100));
    query += ` ORDER BY created_at ASC LIMIT ${safeLimit}`;

    const [messages] = await pool.execute(query, params);

    let pinned = [];
    if (!directUserId && (!conversationId || conversationId === "main")) {
      const [pinnedRows] = await pool.execute(
        "SELECT * FROM pg_chat_messages WHERE pg_id = ? AND conversation_id IS NULL AND recipient_id IS NULL AND is_pinned = 1 ORDER BY created_at DESC LIMIT 5",
        [pgId]
      );
      pinned = pinnedRows || [];
    }

    return res.json({
      success: true,
      pgInfo: { id: Number(pgId), title: access.pgTitle, image: access.pgImage, ownerId: access.ownerId },
      currentUser: { id: userId, role: access.role, name: access.name, roomNo: access.roomNo, avatar: access.avatar },
      messages: messages || [],
      pinnedMessages: pinned
    });
  } catch (err) {
    console.error("[PG-Chat] getChatMessages error:", err);
    return res.status(500).json({ success: false, message: "Failed to load chat messages." });
  }
};

/** POST /api/pg-chat/:pgId/messages */
export const sendMessage = async (req, res) => {
  try {
    const { pgId } = req.params;
    const { message, messageType = "text", conversationId = null, directUserId = null, isEncrypted = true } = req.body;
    const { id: userId, role: userRole } = req.user;

    if (!message?.trim()) return res.status(400).json({ success: false, message: "Message cannot be empty." });

    const access = await verifyChatAccess(userId, userRole, pgId);
    if (!access.allowed) return res.status(403).json({ success: false, message: access.reason });

    const cleanMsg = message.trim();
    const type = ["text", "image", "announcement"].includes(messageType) ? messageType : "text";
    const isOwnerOrAdmin = access.role === "owner" || access.role === "superadmin";
    const isPinned = isOwnerOrAdmin && type === "announcement" && !directUserId && !conversationId ? 1 : 0;
    const parsedConvId = conversationId && conversationId !== "main" ? Number(conversationId) : null;
    const parsedRecipientId = directUserId ? Number(directUserId) : null;

    const [result] = await pool.execute(
      `INSERT INTO pg_chat_messages (pg_id, conversation_id, recipient_id, sender_id, sender_role, sender_name, sender_avatar, room_no, message, message_type, is_pinned, is_encrypted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [pgId, parsedConvId, parsedRecipientId, userId, access.role, access.name, access.avatar, access.roomNo, cleanMsg, type, isPinned, isEncrypted ? 1 : 0]
    );

    const newMsg = {
      id: result.insertId,
      pg_id: Number(pgId),
      conversation_id: parsedConvId,
      recipient_id: parsedRecipientId,
      sender_id: userId,
      sender_role: access.role,
      sender_name: access.name,
      sender_avatar: access.avatar,
      room_no: access.roomNo,
      message: cleanMsg,
      message_type: type,
      is_pinned: Boolean(isPinned),
      is_encrypted: Boolean(isEncrypted),
      created_at: new Date().toISOString()
    };

    emitToPGRoom(pgId, "new_message", newMsg);

    return res.status(201).json({
      success: true,
      message: newMsg
    });
  } catch (err) {
    console.error("[PG-Chat] sendMessage error:", err);
    return res.status(500).json({ success: false, message: "Failed to send message." });
  }
};

/** GET /api/pg-chat/:pgId/members */
export const getMembers = async (req, res) => {
  try {
    const { pgId } = req.params;
    const access = await verifyChatAccess(req.user.id, req.user.role, pgId);
    if (!access.allowed) return res.status(403).json({ success: false, message: "Access denied." });

    const [ownerRows] = await pool.execute(
      `SELECT u.id, u.full_name, u.email, u.phone, u.profile_image, 'owner' as role, 'Verified Host / Management' as room_info FROM pgs p JOIN users u ON u.id = p.owner_id WHERE p.id = ?`,
      [pgId]
    );

    const [residentRows] = await pool.execute(
      `SELECT u.id, u.full_name, u.email, u.phone, u.profile_image, 'student' as role, MAX(b.selected_room_type) as room_info
       FROM bookings b JOIN users u ON u.id = b.student_id
       WHERE b.pg_id = ? AND b.status = 'approved' AND b.payment_status = 'paid'
       GROUP BY u.id, u.full_name, u.email, u.phone, u.profile_image
       ORDER BY MAX(b.id) DESC`,
      [pgId]
    );

    return res.json({ success: true, members: [...(ownerRows || []), ...(residentRows || [])] });
  } catch (err) {
    console.error("[PG-Chat] getMembers error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch members." });
  }
};

/** POST /api/pg-chat/:pgId/pin/:messageId */
export const togglePinMessage = async (req, res) => {
  try {
    const { pgId, messageId } = req.params;
    const access = await verifyChatAccess(req.user.id, req.user.role, pgId);
    if (!access.allowed || (access.role !== "owner" && access.role !== "superadmin")) {
      return res.status(403).json({ success: false, message: "Only the property owner can pin announcements." });
    }

    const [rows] = await pool.execute("SELECT is_pinned FROM pg_chat_messages WHERE id = ? AND pg_id = ?", [messageId, pgId]);
    if (!rows.length) return res.status(404).json({ success: false, message: "Message not found." });

    const newPinned = rows[0].is_pinned ? 0 : 1;
    await pool.execute("UPDATE pg_chat_messages SET is_pinned = ? WHERE id = ? AND pg_id = ?", [newPinned, messageId, pgId]);

    emitToPGRoom(pgId, "pin_updated", { id: Number(messageId), pg_id: Number(pgId), is_pinned: Boolean(newPinned) });

    return res.json({ success: true, is_pinned: Boolean(newPinned), message: newPinned ? "Message pinned as notice." : "Message unpinned." });
  } catch (err) {
    console.error("[PG-Chat] togglePinMessage error:", err);
    return res.status(500).json({ success: false, message: "Failed to update pin status." });
  }
};

/** PUT /api/pg-chat/:pgId/messages/:messageId */
export const updateMessage = async (req, res) => {
  try {
    const { pgId, messageId } = req.params;
    const { message } = req.body;
    const { id: userId, role: userRole } = req.user;

    if (!message?.trim()) return res.status(400).json({ success: false, message: "Message cannot be empty." });

    const access = await verifyChatAccess(userId, userRole, pgId);
    if (!access.allowed) return res.status(403).json({ success: false, message: "Access denied." });

    const [rows] = await pool.execute("SELECT sender_id FROM pg_chat_messages WHERE id = ? AND pg_id = ?", [messageId, pgId]);
    if (!rows.length) return res.status(404).json({ success: false, message: "Message not found." });

    if (Number(rows[0].sender_id) !== Number(userId)) {
      return res.status(403).json({ success: false, message: "You can only edit your own messages." });
    }

    const cleanMsg = message.trim();
    await pool.execute("UPDATE pg_chat_messages SET message = ? WHERE id = ? AND pg_id = ?", [cleanMsg, messageId, pgId]);

    emitToPGRoom(pgId, "message_updated", { id: Number(messageId), pg_id: Number(pgId), message: cleanMsg, is_edited: true });

    return res.json({ success: true, message: "Message updated successfully.", updatedMessage: { id: Number(messageId), message: cleanMsg } });
  } catch (err) {
    console.error("[PG-Chat] updateMessage error:", err);
    return res.status(500).json({ success: false, message: "Failed to update message." });
  }
};

/** DELETE /api/pg-chat/:pgId/messages/:messageId */
export const deleteMessage = async (req, res) => {
  try {
    const { pgId, messageId } = req.params;
    const { id: userId, role: userRole } = req.user;

    const access = await verifyChatAccess(userId, userRole, pgId);
    if (!access.allowed) return res.status(403).json({ success: false, message: "Access denied." });

    const [rows] = await pool.execute("SELECT sender_id FROM pg_chat_messages WHERE id = ? AND pg_id = ?", [messageId, pgId]);
    if (!rows.length) return res.status(404).json({ success: false, message: "Message not found." });

    if (Number(rows[0].sender_id) !== Number(userId)) {
      return res.status(403).json({ success: false, message: "You can only delete your own messages." });
    }

    await pool.execute("DELETE FROM pg_chat_messages WHERE id = ? AND pg_id = ?", [messageId, pgId]);

    emitToPGRoom(pgId, "message_deleted", { id: Number(messageId), pg_id: Number(pgId) });

    return res.json({ success: true, message: "Message deleted successfully." });
  } catch (err) {
    console.error("[PG-Chat] deleteMessage error:", err);
    return res.status(500).json({ success: false, message: "Failed to delete message." });
  }
};
