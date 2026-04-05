import express from "express";
import jwt from "jsonwebtoken";

import Conversation from "../../../backend/src/models/Conversation.js";
import Message from "../../../backend/src/models/Message.js";
import User from "../../../backend/src/models/User.js";
import { io } from "../../../backend/src/socket/index.js";

const router = express.Router();

// Middleware auth đơn giản theo bài của Khanh
export const protectedRoute = (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "Không tìm thấy access token" });
        }

        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decodedUser) => {
            if (err) {
                return res.status(403).json({ message: "Token hết hạn hoặc không hợp lệ" });
            }

            const user = await User.findById(decodedUser.userId).select("-hashedPassword");
            if (!user) {
                return res.status(404).json({ message: "Người dùng không tồn tại" });
            }

            req.user = user;
            return next();
        });
    } catch (error) {
        console.error("Lỗi authMiddleware:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

const updateConversationAfterCreateMessage = (conversation, message, senderId) => {
    conversation.set({
        seenBy: [],
        lastMessageAt: message.createdAt,
        lastMessage: {
            _id: message._id,
            content: {
                type: String,
                default: "",
            },
            senderId,
            createdAt: message.createdAt,
        },
    });

    conversation.participants.forEach((participant) => {
        const memberId = participant.userId.toString();
        const isSender = memberId === senderId.toString();
        const prevCount = conversation.unreadCounts.get(memberId) || 0;
        conversation.unreadCounts.set(memberId, isSender ? 0 : prevCount + 1);
    });
};

export const sendMessage = async (req, res) => {
    try {
        const { recipientId, content, conversationId } = req.body;
        const senderId = req.user._id;

        if (!content || (!conversationId && !recipientId)) {
            return res.status(400).json({
                message: "Thiếu dữ liệu: cần content và recipientId (khi chưa có conversationId)",
            });
        }

        let conversation = null;

        if (conversationId) {
            conversation = await Conversation.findById(conversationId);
            if (!conversation) {
                return res.status(404).json({ message: "Conversation không tồn tại" });
            }
        } else {
            conversation = await Conversation.create({
                type: "direct",
                participants: [
                    { userId: senderId, joinedAt: new Date() },
                    { userId: recipientId, joinedAt: new Date() },
                ],
                lastMessageAt: new Date(),
                unreadCounts: new Map(),
            });
        }

        const message = await Message.create({
            conversationId: conversation._id,
            senderId,
            content,
        });

        updateConversationAfterCreateMessage(conversation, message, senderId);
        await conversation.save();

        io.to(conversation._id.toString()).emit("new-message", {
            message,
            conversation: {
                _id: conversation._id,
                lastMessage: conversation.lastMessage,
                lastMessageAt: conversation.lastMessageAt,
            },
            unreadCounts: conversation.unreadCounts,
        });

        return res.status(201).json({ message });
    } catch (error) {
        console.error("Lỗi sendMessage:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

// Route cần auth
router.post("/messages", protectedRoute, sendMessage);

export default router;
