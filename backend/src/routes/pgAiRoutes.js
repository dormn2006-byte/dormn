import express from "express";
import { streamPgAiChat } from "../controllers/pgAiController.js";

const router = express.Router();

// Public endpoint — anyone on a PG listing can ask the AI manager. No auth.
router.post("/chat", streamPgAiChat);

export default router;