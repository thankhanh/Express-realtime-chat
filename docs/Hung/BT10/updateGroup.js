import Conversation from "../models/Conversation.js";

// BÀI TẬP 10: Cập nhật thông tin nhóm
// PATCH /api/conversations/:conversationId
export const updateGroup = async (req, res) => {
    try {
        const conversation = req.conversation; // Lấy từ authMiddleware/isParticipant
        const userId = req.user._id;
        const { name } = req.body;

        if (conversation.type !== "group") {
            return res.status(400).json({ message: "Chỉ cập nhật được type là group" });
        }

        // Kiểm tra quyền (chỉ admin)
        if (conversation.group.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Chỉ admin mới được quyền đổi thông tin nhóm" });
        }

        // Cập nhật tên nhóm
        const updated = await Conversation.findByIdAndUpdate(
            conversation._id,
            { $set: { "group.name": name } },
            { new: true }
        );

        return res.status(200).json({ conversation: updated });
    } catch (error) {
        console.error("Lỗi updateGroup:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};
