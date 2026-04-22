import Conversation from "../models/Conversation.js";
import { io } from "../socket/index.js";

// BÀI TẬP 4: API Tạo Group Chat (POST /api/conversations)
export const createGroupChat = async (req, res) => {
    try {
        const { type, name, memberIds } = req.body; // type === 'group'
        const userId = req.user._id;

        if (type !== "group") return res.status(400).json({ message: "Type mismatch" });
        if (!name) return res.status(400).json({ message: "Nhóm cần có tên" });
        if (!memberIds || memberIds.length === 0) return res.status(400).json({ message: "Thiếu thành viên" });

        // 1. Tạo conversation mới
        const conversation = new Conversation({
            type: "group",
            participants: [{ userId }, ...memberIds.map((id) => ({ userId: id }))],
            group: { name, createdBy: userId },
            lastMessageAt: new Date(),
        });
        
        await conversation.save();

        // 2. Populate
        await conversation.populate([
            { path: "participants.userId", select: "displayName avatarUrl" },
        ]);

        // 3. Transform format
        const formatted = { 
            ...conversation.toObject(),
            participants: conversation.participants.map((p) => ({
                _id: p.userId?._id,
                displayName: p.userId?.displayName,
                avatarUrl: p.userId?.avatarUrl ?? null,
                joinedAt: p.joinedAt,
            }))
        };

        // 4. Emit sự kiện đến các thành viên bằng user room tương ứng
        memberIds.forEach((id) => {
            io.to(id.toString()).emit("new-group", formatted);
        });

        return res.status(201).json({ conversation: formatted });
    } catch (error) {
        console.error("Lỗi tạo group chat:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};
