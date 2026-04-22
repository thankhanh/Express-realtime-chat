import Conversation from "../models/Conversation.js";
import { io } from "../socket/index.js";

// BÀI TẬP 7: Đánh dấu đã đọc
// POST /api/conversations/:conversationId/seen
export const markAsSeen = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id.toString();

        const conversation = await Conversation.findById(conversationId).lean();
        if (!conversation) {
            return res.status(404).json({ message: "Không tìm thấy conversation" });
        }

        // Bỏ qua nếu ko có tin nhắn hoặc người gửi trùng userId
        if (!conversation.lastMessage) {
            return res.status(200).json({ message: "Chưa có tin nhắn để đọc" });
        }
        if (conversation.lastMessage.senderId.toString() === userId) {
            return res.status(200).json({ message: "Sender không cần đánh dấu" });
        }

        // Cập nhật seenBy + reset số count
        const updated = await Conversation.findByIdAndUpdate(
            conversationId,
            {
                $addToSet: { seenBy: userId },
                $set: { [`unreadCounts.${userId}`]: 0 },
            },
            { new: true }
        );

        // Emit realtime
        io.to(conversationId).emit("read-message", {
            conversationId,
            seenBy: updated?.seenBy,
            unreadCounts: updated?.unreadCounts,
        });

        // Trả về số liệu
        return res.status(200).json({ 
            seenBy: updated.seenBy, 
            myUnreadCount: updated.unreadCounts.get(userId) || 0 
        });
    } catch (error) {
        console.error("Lỗi markAsSeen:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};
