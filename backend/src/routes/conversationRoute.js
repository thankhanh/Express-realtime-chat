import express from "express";
import {createConversation, getConversations, getMessages} from "../controllers/conversationController.js";

const router = express.Router();

router.post("/", checkFriendship, createConversation);
router.get("/", getConversations);
router.get("/:conversationId/messages", getMessages);

export default router;