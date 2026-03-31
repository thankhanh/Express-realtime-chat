import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import {
    emitNewMessage,
    updateConversationAfterCreateMessage,
} from "../utils/messageHelper.js";
import { io } from "../socket/index.js";
import { uploadImageFromBuffer } from "../middlewares/uploadMiddleware.js";

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

        if (!file) {
            return res.status(400).json({ message: "Không có file được upload" });
        }

        // Upload ảnh lên Cloudinary
        const result = await uploadImageFromBuffer(file.buffer, {
            folder: "CCNLTHD/messages",
            transformation: [{ width: 800, quality: "auto", crop: "limit" }],
        });

        let conversation;

        if (conversationId) {
            conversation = await Conversation.findById(conversationId);
        }

        if (!conversation && recipientId) {
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

        if (!conversation) {
            return res.status(400).json({ message: "Thiếu conversationId hoặc recipientId" });
        }

        const message = await Message.create({
            conversationId: conversation._id,
            senderId,
            imgUrl: result.secure_url,
            replyTo: replyTo || null,
        });

        updateConversationAfterCreateMessage(conversation, message, senderId);
        await conversation.save();
        emitNewMessage(io, conversation, message);

        return res.status(201).json({ message });
    } catch (error) {
        console.error("Lỗi xảy ra khi gửi ảnh", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
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