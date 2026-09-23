import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  clearAllConversations,
  deleteConversation,
  deleteMemory,
  getConversationMessages,
  getMemory,
  listConversations,
  renameConversation,
  streamChat,
} from "../controllers/drDormnController.js";

const router = express.Router();

// Dr.Dormn AI is only available to signed-in users.
router.use(protect);

router.post("/chat", streamChat);

router.get("/conversations", listConversations);
router.delete("/conversations", clearAllConversations);
router.get("/conversations/:id/messages", getConversationMessages);
router.patch("/conversations/:id", renameConversation);
router.delete("/conversations/:id", deleteConversation);

router.get("/memory", getMemory);
router.delete("/memory", deleteMemory);

export default router;
