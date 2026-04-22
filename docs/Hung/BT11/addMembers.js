import Conversation from "../models/Conversation.js";
import { io } from "../socket/index.js";

// BÀI TẬP 11: Thêm thành viên vào nhóm
// PATCH /api/conversations/:conversationId/members/add
export const addMembers = async (req, res) => {
    try {
        const conversation = req.conversation;
        const userId = req.user._id;
        const { memberIds } = req.body;

        if (conversation.type !== "group") {
            return res.status(400).json({ message: "Chỉ nhóm mới có thể thêm thành viên" });
        }
        
        // Xác thực admin
        if (conversation.group.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Chỉ admin được duyệt thêm member" });
        }

        // Lọc người dùng để tránh trùng lắp
        const currentIds = conversation.participants.map(p => p.userId.toString());
        const newMembers = memberIds
            .filter(id => !currentIds.includes(id))
            .map(id => ({ userId: id, joinedAt: new Date() })); // add joinedAt date manually or DB resolves it

        if (newMembers.length > 0) {
            conversation.participants.push(...newMembers);
            await conversation.save();

            // Notify cả nhóm qua Socket.io
            io.to(conversation._id.toString()).emit("member-added", {
                conversationId: conversation._id.toString(),
                newMemberIds: newMembers.map(m => m.userId.toString())
            });

            // Notify thành viên mới qua Room riêng của họ
            newMembers.forEach(m => {
                io.to(m.userId.toString()).emit("added-to-group", { 
                    conversationId: conversation._id 
                });
            });
        }

        return res.status(200).json({ conversation });
    } catch (error) {
        console.error("Lỗi addMembers:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};
