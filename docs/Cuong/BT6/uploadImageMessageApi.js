import express from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

import User from "../../../backend/src/models/User.js";
import Conversation from "../../../backend/src/models/Conversation.js";
import Message from "../../../backend/src/models/Message.js";
import { io } from "../../../backend/src/socket/index.js";

const router = express.Router();

// ─────────────────────────────────────────────
// Cấu hình Cloudinary từ .env
// ─────────────────────────────────────────────
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─────────────────────────────────────────────
// Multer: lưu file vào bộ nhớ đệm (memory)
// ─────────────────────────────────────────────
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // tối đa 5 MB
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Chỉ chấp nhận file ảnh"), false);
        }
    },
});

// ─────────────────────────────────────────────
// Helper: upload buffer lên Cloudinary
// ─────────────────────────────────────────────
const uploadImageFromBuffer = (buffer, options = {}) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "chat/messages",
                resource_type: "image",
                transformation: [{ width: 800, quality: "auto", crop: "limit" }],
                ...options,
            },
            (error, result) => {
                if (error) return reject(error);
                return resolve(result);
            }
        );

        stream.end(buffer);
    });
};

// ─────────────────────────────────────────────
// Helper: cập nhật conversation sau khi gửi tin
// ─────────────────────────────────────────────
const updateConversationAfterCreateMessage = (conversation, message, senderId) => {
    conversation.set({
        seenBy: [],
        lastMessageAt: message.createdAt,
        lastMessage: {
            _id: message._id,
            content: message.content,
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

// ─────────────────────────────────────────────
// Middleware auth (protectedRoute)
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// POST /api/messages/upload-image
// Body (form-data):
//   image    — file (required)
//   conversationId — string (optional, nếu đã có conversation)
//   recipientId    — string (optional, nếu chưa có conversation)
//   caption        — string (optional)
// ─────────────────────────────────────────────
export const uploadImageMessage = async (req, res) => {
    try {
        const file = req.file;
        const { conversationId, recipientId, caption } = req.body;
        const senderId = req.user._id;

        if (!file) {
            return res.status(400).json({ message: "Không có file ảnh được gửi lên" });
        }

        if (!conversationId && !recipientId) {
            return res.status(400).json({
                message: "Cần cung cấp conversationId hoặc recipientId",
            });
        }

        // 1) Upload buffer lên Cloudinary
        const cloudinaryResult = await uploadImageFromBuffer(file.buffer);

        // 2) Tìm hoặc tạo conversation
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

        // 3) Tạo Message với imgUrl và caption (content)
        const message = await Message.create({
            conversationId: conversation._id,
            senderId,
            imgUrl: cloudinaryResult.secure_url,
            content: caption || "",
        });

        // 4) Cập nhật conversation
        updateConversationAfterCreateMessage(conversation, message, senderId);
        await conversation.save();

        // 5) Emit realtime
        io.to(conversation._id.toString()).emit("new-message", {
            message,
            conversation: {
                _id: conversation._id,
                lastMessage: conversation.lastMessage,
                lastMessageAt: conversation.lastMessageAt,
            },
            unreadCounts: conversation.unreadCounts,
        });

        // 6) Trả về { message }
        return res.status(201).json({ message });
    } catch (error) {
        console.error("Lỗi uploadImageMessage:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

// Route: qua protectedRoute rồi multer rồi handler
router.post(
    "/image",
    protectedRoute,
    upload.single("image"),
    uploadImageMessage
);

export default router;

/*
Test bằng Postman:

  Method : POST
  URL    : http://localhost:5001/api/messages/upload-image
  Headers: Authorization: Bearer <accessToken>

  Body → form-data:
    Key          | Type | Value
    -------------|------|----------------------------
    image        | File | <chọn file ảnh>
    recipientId  | Text | <userId người nhận>  ← nếu chưa có conversation
    conversationId | Text | <conversationId>   ← nếu đã có conversation
    caption      | Text | "Xem ảnh này nè!"   ← tuỳ chọn

  Kết quả thành công: HTTP 201 + { message: { ... imgUrl, ... } }
*/
