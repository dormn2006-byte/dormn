import PgChatConversation from "../schemas/pgChatConversationSchema.js";
import PgChatMessage from "../schemas/pgChatMessageSchema.js";
import PG from "../schemas/pgSchema.js";
import User from "../schemas/userSchema.js";
import Booking from "../schemas/bookingSchema.js";
import { emitToPGRoom } from "../socket.js";
import { serialize } from "../utils/serialize.js";

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// members_json is native now but legacy rows may still hold a JSON string.
const parseMaybeJson = (v) => {
  if (typeof v !== "string") return v;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
};

// Owner member row (joined pgs -> users) for a PG.
const buildOwnerRow = async (pgId, roomInfo) => {
  const pg = await PG.findById(Number(pgId)).lean();
  if (!pg || pg.owner_id == null) return null;

  const owner = await User.findById(pg.owner_id).lean();
  if (!owner) return null;

  return {
    id: owner._id,
    full_name: owner.full_name,
    email: owner.email,
    phone: owner.phone,
    profile_image: owner.profile_image,
    role: "owner",
    room_info: roomInfo,
  };
};

// Residents = students with an approved + paid booking, grouped per user,
// ordered by their latest booking id DESC and room_info = MAX(selected_room_type).
const buildResidentRows = async (pgId) => {
  const bookings = await Booking.find({
    pg_id: Number(pgId),
    status: "approved",
    payment_status: "paid",
  })
    .sort({ _id: -1 })
    .lean();

  const perUser = new Map();
  for (const b of bookings) {
    const room = b.selected_room_type ?? null;
    const cur = perUser.get(b.student_id);
    if (!cur) {
      perUser.set(b.student_id, { maxId: b._id, room });
    } else {
      if (b._id > cur.maxId) cur.maxId = b._id;
      if (room != null && (cur.room == null || room > cur.room)) cur.room = room;
    }
  }

  const ordered = [...perUser.entries()].sort((a, b) => b[1].maxId - a[1].maxId);
  const userIds = ordered.map(([id]) => id);

  const users = await User.find({ _id: { $in: userIds } }).lean();
  const userMap = new Map(users.map((u) => [u._id, u]));

  return ordered
    .map(([studentId, meta]) => {
      const u = userMap.get(studentId);
      if (!u) return null;
      return {
        id: u._id,
        full_name: u.full_name,
        email: u.email,
        phone: u.phone,
        profile_image: u.profile_image,
        role: "student",
        room_info: meta.room,
      };
    })
    .filter(Boolean);
};

/**
 * Automatically post a welcome announcement from the PG owner to the resident upon joining/payment.
 */
export const postWelcomeMessageForBooking = async (bookingIdOrStudentId, pgId = null) => {
  try {
    let booking;
    if (pgId) {
      booking = await Booking.findOne({
        student_id: Number(bookingIdOrStudentId),
        pg_id: Number(pgId),
        status: "approved",
        payment_status: "paid",
      })
        .sort({ _id: -1 })
        .lean();
    } else {
      booking = await Booking.findById(Number(bookingIdOrStudentId)).lean();
    }

    if (!booking) return null;

    const [student, pg] = await Promise.all([
      booking.student_id != null ? User.findById(booking.student_id).lean() : null,
      booking.pg_id != null ? PG.findById(booking.pg_id).lean() : null,
    ]);
    const ownerUser =
      pg?.owner_id != null ? await User.findById(pg.owner_id).lean() : null;

    const studentName = student?.full_name || "Resident";
    const pgTitle = pg?.title || "our PG";
    const ownerName = ownerUser?.full_name || "Property Owner";

    const existing = await PgChatMessage.findOne({
      pg_id: booking.pg_id,
      message_type: "announcement",
      $or: [
        { message: { $regex: escapeRegex(studentName), $options: "i" } },
        { message: { $regex: escapeRegex(`Congratulations ${studentName}`), $options: "i" } },
      ],
    }).lean();

    if (existing) return { id: existing._id };

    const welcomeText = `🎉 Congratulations ${studentName}! Welcome to ${pgTitle}. We are delighted to have you as part of our PG community! Feel free to introduce yourself here. 🏠✨`;

    const created = await PgChatMessage.create({
      pg_id: booking.pg_id,
      conversation_id: null,
      recipient_id: null,
      sender_id: pg?.owner_id ?? null,
      sender_role: "owner",
      sender_name: ownerName,
      sender_avatar: ownerUser?.profile_image || null,
      room_no: "Host / Management",
      message: welcomeText,
      message_type: "announcement",
      is_pinned: 0,
      is_encrypted: 1,
    });

    return { id: created._id, message: welcomeText };
  } catch (err) {
    console.error("[PG-Chat] postWelcomeMessageForBooking error:", err.message);
    return null;
  }
};

/** Verify user permissions for PG chat */
export const verifyChatAccess = async (userId, userRole, pgId) => {
  try {
    const user = await User.findById(Number(userId)).lean();
    if (!user) return { allowed: false, reason: "User not found" };

    const pg = await PG.findById(Number(pgId)).lean();
    if (!pg) return { allowed: false, reason: "PG not found" };

    const base = { pgTitle: pg.title, pgImage: pg.profile_image, ownerId: pg.owner_id, avatar: user.profile_image || null };

    if (user.role === "superadmin" || userRole === "superadmin") {
      return { allowed: true, role: "superadmin", name: user.full_name || "Super Admin", roomNo: "Admin Desk", ...base };
    }

    if (Number(pg.owner_id) === Number(userId) || (user.role === "owner" && Number(pg.owner_id) === Number(userId))) {
      return { allowed: true, role: "owner", name: user.full_name || "Property Owner", roomNo: "Host / Management", ...base };
    }

    const booking = await Booking.findOne({
      student_id: Number(userId),
      pg_id: Number(pgId),
      status: "approved",
      payment_status: "paid",
    })
      .sort({ _id: -1 })
      .lean();

    if (booking) {
      return { allowed: true, role: "student", name: user.full_name || "Resident", roomNo: booking.selected_room_type || "Resident", ...base };
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
    const groupRows = await PgChatConversation.find({ pg_id: Number(pgId), type: "group" })
      .sort({ _id: -1 })
      .lean();

    const visibleGroups = (groupRows || []).filter((g) => {
      if (!g.members_json) return true;
      const mems = parseMaybeJson(g.members_json);
      return Array.isArray(mems) ? mems.map(Number).includes(Number(userId)) : true;
    });

    const customGroups = await Promise.all(
      visibleGroups.map(async (g) => {
        const last = await PgChatMessage.findOne({ conversation_id: g._id })
          .sort({ created_at: -1 })
          .lean();
        return {
          id: g._id,
          title: g.title,
          description: g.description,
          icon: g.icon,
          created_by: g.created_by,
          members_json: parseMaybeJson(g.members_json),
          created_at: g.created_at,
          last_message: last?.message ?? null,
        };
      })
    );

    // 2. Fetch owner & residents
    const ownerRow = await buildOwnerRow(pgId, "Host / Management");
    const residentRows = await buildResidentRows(pgId);

    const allMembers = [...(ownerRow ? [ownerRow] : []), ...residentRows];
    const dmContacts = allMembers.filter((m) => Number(m.id) !== Number(userId));

    // 3. Batch fetch recent DMs in a single query
    const recentDms = await PgChatMessage.find({
      pg_id: Number(pgId),
      recipient_id: { $ne: null },
      $or: [{ sender_id: Number(userId) }, { recipient_id: Number(userId) }],
    })
      .sort({ created_at: -1 })
      .lean();

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

    const created = await PgChatConversation.create({
      pg_id: Number(pgId),
      type: "group",
      title: cleanTitle,
      description: cleanDesc,
      icon,
      created_by: Number(userId),
      members_json: includedMembers,
    });

    return res.status(201).json({
      success: true,
      group: { id: created._id, pg_id: Number(pgId), type: "group", title: cleanTitle, description: cleanDesc, icon, created_by: Number(userId), members_json: includedMembers, created_at: new Date().toISOString() }
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

    const buildLastMessage = async (pg) => {
      const last = await PgChatMessage.findOne({ pg_id: pg._id })
        .sort({ created_at: -1 })
        .lean();
      return last?.message ?? null;
    };

    if (userRole === "owner") {
      const pgs = await PG.find({ owner_id: Number(userId) }).sort({ _id: -1 }).lean();

      const rooms = await Promise.all(
        pgs.map(async (p) => {
          const active_residents = await Booking.countDocuments({
            pg_id: p._id,
            status: "approved",
            payment_status: "paid",
          });
          return {
            id: p._id,
            title: p.title,
            profile_image: p.profile_image,
            city: p.city,
            area: p.area,
            active_residents,
            last_message: await buildLastMessage(p),
          };
        })
      );

      return res.json({ success: true, rooms });
    }

    const bookings = await Booking.find({
      student_id: Number(userId),
      status: "approved",
      payment_status: "paid",
    })
      .sort({ _id: -1 })
      .lean();

    const pgIds = [...new Set(bookings.map((b) => b.pg_id).filter((v) => v != null))];
    const pgs = await PG.find({ _id: { $in: pgIds } }).lean();
    const pgMap = new Map(pgs.map((p) => [p._id, p]));

    const ownerIds = [...new Set(pgs.map((p) => p.owner_id).filter((v) => v != null))];
    const owners = await User.find({ _id: { $in: ownerIds } }).lean();
    const ownerMap = new Map(owners.map((o) => [o._id, o]));

    const seen = new Set();
    const rooms = [];
    for (const b of bookings) {
      if (seen.has(b.pg_id)) continue;
      seen.add(b.pg_id);

      const p = pgMap.get(b.pg_id);
      if (!p) continue;

      const active_residents = await Booking.countDocuments({
        pg_id: p._id,
        status: "approved",
        payment_status: "paid",
      });

      rooms.push({
        id: p._id,
        title: p.title,
        profile_image: p.profile_image,
        city: p.city,
        area: p.area,
        owner_id: p.owner_id,
        owner_name: ownerMap.get(p.owner_id)?.full_name ?? null,
        selected_room_type: b.selected_room_type,
        active_residents,
        last_message: await buildLastMessage(p),
      });
    }

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

    const match = { pg_id: Number(pgId) };

    if (directUserId) {
      match.$or = [
        { sender_id: Number(userId), recipient_id: Number(directUserId) },
        { sender_id: Number(directUserId), recipient_id: Number(userId) },
      ];
    } else if (conversationId && conversationId !== "main") {
      match.conversation_id = Number(conversationId);
    } else {
      match.conversation_id = null;
      match.recipient_id = null;
    }

    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) match.created_at = { $gt: sinceDate };
    }

    const safeLimit = Math.max(1, Math.min(200, parseInt(limit, 10) || 100));

    const messageRows = await PgChatMessage.find(match)
      .sort({ created_at: 1 })
      .limit(safeLimit)
      .lean();
    const messages = serialize(messageRows);

    let pinned = [];
    if (!directUserId && (!conversationId || conversationId === "main")) {
      const pinnedRows = await PgChatMessage.find({
        pg_id: Number(pgId),
        conversation_id: null,
        recipient_id: null,
        is_pinned: 1,
      })
        .sort({ created_at: -1 })
        .limit(5)
        .lean();
      pinned = serialize(pinnedRows);
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

    const created = await PgChatMessage.create({
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
      is_pinned: isPinned,
      is_encrypted: isEncrypted ? 1 : 0,
    });

    const newMsg = {
      id: created._id,
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

    const ownerRow = await buildOwnerRow(pgId, "Verified Host / Management");
    const residentRows = await buildResidentRows(pgId);

    return res.json({ success: true, members: [...(ownerRow ? [ownerRow] : []), ...residentRows] });
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

    const row = await PgChatMessage.findOne({ _id: Number(messageId), pg_id: Number(pgId) }).lean();
    if (!row) return res.status(404).json({ success: false, message: "Message not found." });

    const newPinned = row.is_pinned ? 0 : 1;
    await PgChatMessage.updateOne(
      { _id: Number(messageId), pg_id: Number(pgId) },
      { is_pinned: newPinned }
    );

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

    const row = await PgChatMessage.findOne({ _id: Number(messageId), pg_id: Number(pgId) })
      .select("sender_id")
      .lean();
    if (!row) return res.status(404).json({ success: false, message: "Message not found." });

    if (Number(row.sender_id) !== Number(userId)) {
      return res.status(403).json({ success: false, message: "You can only edit your own messages." });
    }

    const cleanMsg = message.trim();
    await PgChatMessage.updateOne(
      { _id: Number(messageId), pg_id: Number(pgId) },
      { message: cleanMsg }
    );

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

    const row = await PgChatMessage.findOne({ _id: Number(messageId), pg_id: Number(pgId) })
      .select("sender_id")
      .lean();
    if (!row) return res.status(404).json({ success: false, message: "Message not found." });

    if (Number(row.sender_id) !== Number(userId)) {
      return res.status(403).json({ success: false, message: "You can only delete your own messages." });
    }

    await PgChatMessage.deleteOne({ _id: Number(messageId), pg_id: Number(pgId) });

    emitToPGRoom(pgId, "message_deleted", { id: Number(messageId), pg_id: Number(pgId) });

    return res.json({ success: true, message: "Message deleted successfully." });
  } catch (err) {
    console.error("[PG-Chat] deleteMessage error:", err);
    return res.status(500).json({ success: false, message: "Failed to delete message." });
  }
};
