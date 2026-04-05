import express from "express";
import jwt from "jsonwebtoken";

import User from "../../../backend/src/models/User.js";
import Message from "../../../backend/src/models/Message.js";

const router = express.Router();

// Auth middleware
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

// GET /api/messages/:conversationId?limit=20&cursor=<ISO date string>
export const getMessagesWithCursor = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { limit = "20", cursor } = req.query;

        const parsedLimit = Number.parseInt(limit, 10);
        const safeLimit = Number.isNaN(parsedLimit) ? 20 : Math.min(Math.max(parsedLimit, 1), 100);

        const query = { conversationId };

        if (cursor) {
            const cursorDate = new Date(cursor);
            if (Number.isNaN(cursorDate.getTime())) {
                return res.status(400).json({ message: "cursor không phải ISO date hợp lệ" });
            }

            query.createdAt = { $lt: cursorDate };
        }

        // Query theo mới -> cũ và lấy dư 1 bản ghi để biết còn trang hay không
        const rawMessages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(safeLimit + 1)
            .populate("senderId", "displayName username")
            .populate("replyTo", "content senderId imgUrl isDeleted createdAt");

        let nextCursor = null;
        let messages = rawMessages;

        if (rawMessages.length > safeLimit) {
            nextCursor = rawMessages[safeLimit].createdAt.toISOString();
            messages = rawMessages.slice(0, safeLimit);
        }

        // Trả mảng theo thứ tự cũ -> mới để render chat
        messages.reverse();

        return res.status(200).json({ messages, nextCursor });
    } catch (error) {
        console.error("Lỗi getMessagesWithCursor:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

// Route cần auth
router.get("/api/messages/:conversationId", protectedRoute, getMessagesWithCursor);

export default router;

