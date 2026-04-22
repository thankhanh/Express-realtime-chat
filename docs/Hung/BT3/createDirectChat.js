import Conversation from "../models/Conversation.js";

// BÀI TẬP 3: API Tạo Direct Chat (POST /api/conversations)
export const createDirectChat = async (req, res) => {
    try {
        const { type, memberIds } = req.body; // type === 'direct'
        const userId = req.user._id;

        if (type !== "direct") return res.status(400).json({ message: "Type mismatch" });
        if (!memberIds || memberIds.length === 0) return res.status(400).json({ message: "Thiếu memberIds" });

        const participantId = memberIds[0];

        // 1. Kiểm tra conversation direct có sẵn
        let conversation = await Conversation.findOne({
            type: "direct",
            "participants.userId": { $all: [userId, participantId] },
        });

        // 2. Nếu chưa có, tạo mới
        if (!conversation) {
            conversation = new Conversation({
                type: "direct",
                participants: [{ userId }, { userId: participantId }],
                lastMessageAt: new Date(),
            });
            await conversation.save();
        }

        // 3. Populate
        await conversation.populate([
            { path: "participants.userId", select: "displayName avatarUrl" },
        ]);

        return res.status(201).json({ conversation });
    } catch (error) {
        console.error("Lỗi tạo direct chat:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};
