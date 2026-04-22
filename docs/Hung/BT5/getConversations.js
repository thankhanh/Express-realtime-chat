import Conversation from "../models/Conversation.js";

// BÀI TẬP 5: Lấy danh sách Conversation
// GET /api/conversations
export const getConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        // Tìm tất cả conversation có chứa userId
        const conversations = await Conversation.find({
            "participants.userId": userId,
        })
            .sort({ lastMessageAt: -1 }) // mớ nhất lên đầu
            .populate("participants.userId", "displayName avatarUrl")
            .populate("lastMessage.senderId", "displayName avatarUrl")
            .populate("seenBy", "displayName avatarUrl");

        // Transform participants thành format phẳng (không nested)
        const formatted = conversations.map((convo) => ({
            ...convo.toObject(),
            participants: (convo.participants || []).map((p) => ({
                _id: p.userId?._id,
                displayName: p.userId?.displayName,
                avatarUrl: p.userId?.avatarUrl ?? null,
                joinedAt: p.joinedAt,
            }))
        }));

        return res.status(200).json({ conversations: formatted });
    } catch (error) {
        console.error("Lỗi getConversations:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};
