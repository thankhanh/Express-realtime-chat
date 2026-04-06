import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import {
    emitNewMessage,
    updateConversationAfterCreateMessage,
} from "../utils/messageHelper.js";
import { io } from "../socket/index.js";
import { uploadImageFromBuffer } from "../middlewares/uploadMiddleware.js";
import fs from "fs/promises";
import path from "path";

// ─────────────────────────────────────────────
// Gửi tin nhắn trực tiếp (Direct)
// ─────────────────────────────────────────────
export const sendDirectMessage = async (req, res) => {
    try {
        const { recipientId, content, conversationId, replyTo } = req.body;
        const senderId = req.user._id;

        if (!content) {
            return res.status(400).json({ message: "Thiếu nội dung" });
        }

        let conversation;

        if (conversationId) {
            conversation = await Conversation.findById(conversationId);
        }

        if (!conversation) {
            conversation = await Conversation.create({
                type: "direct",
                participants: [
                    { userId: senderId, joinedAt: new Date() },
                    { userId: recipientId, joinedAt: new Date() },
                ],
                lastMessageAt: new Date(),
                unreadCounts: new Map(),
            });

            // Emit new-conversation to recipient so it appears in their sidebar
            const populatedConvo = await Conversation.findById(conversation._id)
                .populate("participants.userId", "_id username displayName avatarUrl")
                .lean();
            
            io.to(recipientId.toString()).emit("new-conversation", populatedConvo);
        }

        const message = await Message.create({
            conversationId: conversation._id,
            senderId,
            content,
            replyTo: replyTo || null,
        });

        // Populate replyTo để trả về đủ thông tin
        await message.populate("replyTo", "content senderId imgUrl isDeleted");

        updateConversationAfterCreateMessage(conversation, message, senderId);
        await conversation.save();
        emitNewMessage(io, conversation, message);

        return res.status(201).json({ message });
    } catch (error) {
        console.error("Lỗi xảy ra khi gửi tin nhắn trực tiếp", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

// ─────────────────────────────────────────────
// Gửi tin nhắn nhóm (Group)
// ─────────────────────────────────────────────
export const sendGroupMessage = async (req, res) => {
    try {
        const { conversationId, content, replyTo } = req.body;
        const senderId = req.user._id;
        const conversation = req.conversation;

        if (!content) {
            return res.status(400).json("Thiếu nội dung");
        }

        const message = await Message.create({
            conversationId,
            senderId,
            content,
            replyTo: replyTo || null,
        });

        await message.populate("replyTo", "content senderId imgUrl isDeleted");

        updateConversationAfterCreateMessage(conversation, message, senderId);
        await conversation.save();
        emitNewMessage(io, conversation, message);

        return res.status(201).json({ message });
    } catch (error) {
        console.error("Lỗi xảy ra khi gửi tin nhắn nhóm", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

// ─────────────────────────────────────────────
// Gửi ảnh trong chat (Direct hoặc Group)
// ─────────────────────────────────────────────
export const sendImageMessage = async (req, res) => {
    try {
        const file = req.file;
        const { conversationId, recipientId, replyTo } = req.body;
        const senderId = req.user._id;

        console.log("📸 sendImageMessage - file:", file ? `${file.size} bytes` : "null");
        console.log("📸 conversationId:", conversationId, "recipientId:", recipientId);

        if (!file) {
            return res.status(400).json({ message: "Không có file được upload" });
        }

        // Upload ảnh lên Cloudinary, fallback sang local nếu cấu hình Cloudinary lỗi
        console.log("📸 Uploading to Cloudinary...");
        let imageUrl = "";
        try {
            const result = await uploadImageFromBuffer(file.buffer, {
                folder: "CCNLTHD/messages",
                transformation: [{ width: 800, quality: "auto", crop: "limit" }],
            });
            imageUrl = result.secure_url;
            console.log("📸 Cloudinary result:", imageUrl);
        } catch (cloudinaryError) {
            console.warn("⚠️ Cloudinary upload failed, fallback to local storage:", cloudinaryError?.message);

            const ext = path.extname(file.originalname || "") || ".jpg";
            const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
            const uploadDir = path.join(process.cwd(), "uploads", "messages");
            await fs.mkdir(uploadDir, { recursive: true });
            await fs.writeFile(path.join(uploadDir, fileName), file.buffer);

            imageUrl = `${req.protocol}://${req.get("host")}/uploads/messages/${fileName}`;
            console.log("📸 Local fallback result:", imageUrl);
        }

        let conversation;

        if (conversationId) {
            conversation = await Conversation.findById(conversationId);
        }

        if (!conversation && recipientId) {
            console.log("📸 Creating new conversation...");
            conversation = await Conversation.create({
                type: "direct",
                participants: [
                    { userId: senderId, joinedAt: new Date() },
                    { userId: recipientId, joinedAt: new Date() },
                ],
                lastMessageAt: new Date(),
                unreadCounts: new Map(),
            });

            // Emit new-conversation to recipient
            const populatedConvo = await Conversation.findById(conversation._id)
                .populate("participants.userId", "_id username displayName avatarUrl")
                .lean();
            
            io.to(recipientId.toString()).emit("new-conversation", populatedConvo);
        }

        if (!conversation) {
            return res.status(400).json({ message: "Thiếu conversationId hoặc recipientId" });
        }

        const message = await Message.create({
            conversationId: conversation._id,
            senderId,
            imgUrl: imageUrl,
            replyTo: replyTo || null,
        });

        updateConversationAfterCreateMessage(conversation, message, senderId);
        await conversation.save();
        emitNewMessage(io, conversation, message);

        console.log("📸 Image message created successfully:", message._id);
        return res.status(201).json({ message });
    } catch (error) {
        const errorMessage = error?.message || "Lỗi không xác định";
        console.error("❌ Lỗi xảy ra khi gửi ảnh:", errorMessage);
        console.error("Stack:", error?.stack);

        const normalized = errorMessage.toLowerCase();
        if (
            normalized.includes("upload preset not found") ||
            normalized.includes("invalid signature") ||
            normalized.includes("cloudinary")
        ) {
            return res.status(400).json({ message: "Lỗi cấu hình Cloudinary: " + errorMessage });
        }

        return res.status(500).json({ message: "Lỗi hệ thống: " + errorMessage });
    }
};

// ─────────────────────────────────────────────
// Xóa / Thu hồi tin nhắn (Soft Delete)
// ─────────────────────────────────────────────
export const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: "Không tìm thấy tin nhắn" });
        }

        // Chỉ người gửi mới được xóa
        if (message.senderId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Bạn không có quyền xóa tin nhắn này" });
        }

        // Soft delete: đánh dấu isDeleted = true, xóa nội dung
        message.isDeleted = true;
        message.content = null;
        message.imgUrl = null;
        await message.save();

        // Thông báo realtime cho cả conversation
        io.to(message.conversationId.toString()).emit("delete-message", {
            messageId: message._id,
            conversationId: message.conversationId,
        });

        return res.status(200).json({ message: "Đã thu hồi tin nhắn" });
    } catch (error) {
        console.error("Lỗi xảy ra khi xóa tin nhắn", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};