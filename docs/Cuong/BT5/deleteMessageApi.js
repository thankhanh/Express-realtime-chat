import express from "express";
import jwt from "jsonwebtoken";

import User from "../../../backend/src/models/User.js";
import Message from "../../../backend/src/models/Message.js";
import { io } from "../../../backend/src/socket/index.js";

const router = express.Router();

// Middleware auth đơn giản (protectedRoute)
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

// DELETE /api/messages/:messageId
export const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        // 1) Tìm message theo messageId
        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: "Không tìm thấy tin nhắn" });
        }

        // 2) Chỉ người gửi mới được xóa
        if (message.senderId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Bạn không có quyền xóa tin nhắn này" });
        }

        const conversationId = message.conversationId.toString();

        // 3) Hard delete
        await Message.findByIdAndDelete(messageId);

        // 4) Emit event delete-message vào room conversationId
        io.to(conversationId).emit("delete-message", {
            messageId,
        });

        // 5) Trả 204 No Content
        return res.status(204).send();
    } catch (error) {
        console.error("Lỗi deleteMessage:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

router.delete("/api/messages/:messageId", protectedRoute, deleteMessage);

export default router;

/*
Test nhanh:

1) Xóa tin nhắn của chính mình
curl -X DELETE "http://localhost:5001/api/messages/<messageId>" \
  -H "Authorization: Bearer <accessToken>"

Kết quả: HTTP 204, không có body.

2) Xóa tin nhắn của người khác
Kết quả: HTTP 403.

3) messageId không tồn tại
Kết quả: HTTP 404.
*/
