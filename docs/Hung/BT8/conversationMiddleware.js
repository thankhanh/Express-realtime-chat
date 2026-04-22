import Conversation from "../models/Conversation.js";

// BÀI TẬP 8: Middleware kiểm tra quyền truy cập Conversation
export const isConversationParticipant = async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        // 1. Tìm conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện" });
        }

        // 2. Kiểm tra xem req.user._id có trong participants không
        const isMember = conversation.participants.some(
            (p) => p.userId.toString() === userId.toString()
        );

        // 3. Nếu không → 403
        if (!isMember) {
            return res.status(403).json({ message: "Bạn không có quyền ở trong cuộc trò chuyện này." });
        }

        // 4. Gắn conversation vào req
        req.conversation = conversation;

        // Tiếp tục middleware
        next();
    } catch (error) {
        console.error("Lỗi isConversationParticipant:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};
