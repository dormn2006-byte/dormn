import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getMyChatRooms,
  getConversations,
  createGroup,
  getChatMessages,
  sendMessage,
  getMembers,
  togglePinMessage,
  updateMessage,
  deleteMessage
} from "../controllers/pgChatController.js";

const router = express.Router();

router.get("/my-rooms", protect, getMyChatRooms);
router.get("/:pgId/conversations", protect, getConversations);
router.post("/:pgId/groups", protect, createGroup);
router.get("/:pgId/messages", protect, getChatMessages);
router.post("/:pgId/messages", protect, sendMessage);
router.get("/:pgId/members", protect, getMembers);
router.post("/:pgId/pin/:messageId", protect, togglePinMessage);
router.put("/:pgId/messages/:messageId", protect, updateMessage);
router.delete("/:pgId/messages/:messageId", protect, deleteMessage);

export default router;
