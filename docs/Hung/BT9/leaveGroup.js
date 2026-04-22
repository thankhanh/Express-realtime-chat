import Conversation from "../models/Conversation.js";
import { io } from "../socket/index.js";

// BÀI TẬP 9: API Rời nhóm
// PATCH /api/conversations/:conversationId/leave
export const leaveGroup = async (req, res) => {
    try {
        const conversation = req.conversation; // gắn từ middleware
        const userId = req.user._id;

        if (conversation.type !== "group") {
            return res.status(400).json({ message: "Chỉ rời được group chat" });
        }

        // Xoá user khỏi mảng participants bằng toán tử $pull
        const updated = await Conversation.findByIdAndUpdate(
            conversation._id,
            { $pull: { participants: { userId: userId } } },
            { new: true }
        );

        // Nếu nhóm ko còn ai thì xoá luôn conversation
        if (updated.participants.length === 0) {
            await Conversation.findByIdAndDelete(conversation._id);
        }

        // Báo cho các người dùng khác trong realtime
        io.to(conversation._id.toString()).emit("member-left", { 
            userId: userId.toString(), 
            conversationId: conversation._id.toString() 
        });

        return res.status(204).json(); // 204 No Content
    } catch (error) {
        console.error("Lỗi leaveGroup:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};
