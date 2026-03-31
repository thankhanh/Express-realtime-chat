import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { io } from "../socket/index.js";

export const createConversation = async (req, res) => {
    try {
        const { type, name, memberIds } = req.body;
        const userId = req.user._id;

        if (
            !type ||
            (type === "group" && !name) ||
            !memberIds ||
            !Array.isArray(memberIds) ||
            memberIds.length === 0
        ) {
            return res
                .status(400)
                .json({ message: "Tên nhóm và danh sách thành viên là bắt buộc" });
        }

        let conversation;

        if (type === "direct") {
            const participantId = memberIds[0];

            conversation = await Conversation.findOne({
                type: "direct",
                "participants.userId": { $all: [userId, participantId] },
            });

            if (!conversation) {
                conversation = new Conversation({
                    type: "direct",
                    participants: [{ userId }, { userId: participantId }],
                    lastMessageAt: new Date(),
                });

                await conversation.save();
            }
        }

        if (type === "group") {
            conversation = new Conversation({
                type: "group",
                participants: [{ userId }, ...memberIds.map((id) => ({ userId: id }))],
                group: {
                    name,
                    createdBy: userId,
                },
                lastMessageAt: new Date(),
            });

            await conversation.save();
        }

        if (!conversation) {
            return res.status(400).json({ message: "Conversation type không hợp lệ" });
        }

        await conversation.populate([
            { path: "participants.userId", select: "displayName avatarUrl" },
            { path: "seenBy", select: "displayName avatarUrl" },
            { path: "lastMessage.senderId", select: "displayName avatarUrl" },
        ]);

        const participants = (conversation.participants || []).map((p) => ({
            _id: p.userId?._id,
            displayName: p.userId?.displayName,
            avatarUrl: p.userId?.avatarUrl ?? null,
            joinedAt: p.joinedAt,
        }));

        const formatted = { ...conversation.toObject(), participants };

        if (type === "group") {
            memberIds.forEach((userId) => {
                io.to(userId).emit("new-group", formatted);
            });
        }

        return res.status(201).json({ conversation: formatted });
    } catch (error) {
        console.error("Lỗi khi tạo conversation", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const getConversations = async (req, res) => {
    try {
        const userId = req.user._id;
        const conversations = await Conversation.find({
            "participants.userId": userId,
        })
            .sort({ lastMessageAt: -1, updatedAt: -1 })
            .populate({ path: "participants.userId", select: "displayName avatarUrl" })
            .populate({ path: "lastMessage.senderId", select: "displayName avatarUrl" })
            .populate({ path: "seenBy", select: "displayName avatarUrl" });

        const formatted = conversations.map((convo) => {
            const participants = (convo.participants || []).map((p) => ({
                _id: p.userId?._id,
                displayName: p.userId?.displayName,
                avatarUrl: p.userId?.avatarUrl ?? null,
                joinedAt: p.joinedAt,
            }));

            return {
                ...convo.toObject(),
                unreadCounts: convo.unreadCounts || {},
                participants,
            };
        });

        return res.status(200).json({ conversations: formatted });
    } catch (error) {
        console.error("Lỗi xảy ra khi lấy conversations", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { limit = 50, cursor } = req.query;

        const query = { conversationId };

        if (cursor) {
            query.createdAt = { $lt: new Date(cursor) };
        }

        let messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit) + 1)
            .populate("replyTo", "content senderId imgUrl isDeleted");

        let nextCursor = null;

        if (messages.length > Number(limit)) {
            const nextMessage = messages[messages.length - 1];
            nextCursor = nextMessage.createdAt.toISOString();
            messages.pop();
        }

        messages = messages.reverse();

        return res.status(200).json({ messages, nextCursor });
    } catch (error) {
        console.error("Lỗi xảy ra khi lấy messages", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const getUserConversationsForSocketIO = async (userId) => {
    try {
        const conversations = await Conversation.find(
            { "participants.userId": userId },
            { _id: 1 }
        );

        return conversations.map((c) => c._id.toString());
    } catch (error) {
        console.error("Lỗi khi fetch conversations: ", error);
        return [];
    }
};

export const markAsSeen = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id.toString();

        const conversation = await Conversation.findById(conversationId).lean();

        if (!conversation) {
            return res.status(404).json({ message: "Conversation không tồn tại" });
        }

        const last = conversation.lastMessage;

        if (!last) {
            return res.status(200).json({ message: "Không có tin nhắn để mark as seen" });
        }

        if (last.senderId.toString() === userId) {
            return res.status(200).json({ message: "Sender không cần mark as seen" });
        }

        const updated = await Conversation.findByIdAndUpdate(
            conversationId,
            {
                $addToSet: { seenBy: userId },
                $set: { [`unreadCounts.${userId}`]: 0 },
            },
            { new: true }
        );

        io.to(conversationId).emit("read-message", {
            conversation: updated,
            lastMessage: {
                _id: updated?.lastMessage._id,
                content: updated?.lastMessage.content,
                createdAt: updated?.lastMessage.createdAt,
                sender: { _id: updated?.lastMessage.senderId },
            },
        });

        return res.status(200).json({
            message: "Marked as seen",
            seenBy: updated?.seenBy || [],
            myUnreadCount: updated?.unreadCounts[userId] || 0,
        });
    } catch (error) {
        console.error("Lỗi khi mark as seen", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

// ─────────────────────────────────────────────
// Rời nhóm (Leave Group)
// ─────────────────────────────────────────────
export const leaveGroup = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;

        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            return res.status(404).json({ message: "Conversation không tồn tại" });
        }

        if (conversation.type !== "group") {
            return res.status(400).json({ message: "Chỉ có thể rời khỏi nhóm chat" });
        }

        const isMember = conversation.participants.some(
            (p) => p.userId.toString() === userId.toString()
        );

        if (!isMember) {
            return res.status(403).json({ message: "Bạn không ở trong nhóm này" });
        }

        // Xóa user khỏi participants
        conversation.participants = conversation.participants.filter(
            (p) => p.userId.toString() !== userId.toString()
        );

        // Nếu nhóm rỗng → xóa hẳn
        if (conversation.participants.length === 0) {
            await Conversation.findByIdAndDelete(conversationId);
            return res.status(200).json({ message: "Nhóm đã bị xóa vì không còn thành viên" });
        }

        // Nếu admin rời → chuyển quyền cho thành viên đầu tiên còn lại
        if (conversation.group.createdBy.toString() === userId.toString()) {
            conversation.group.createdBy = conversation.participants[0].userId;
        }

        await conversation.save();

        // Thông báo realtime
        io.to(conversationId).emit("member-left", {
            conversationId,
            userId: userId.toString(),
        });

        return res.sendStatus(204);
    } catch (error) {
        console.error("Lỗi khi rời nhóm", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

// ─────────────────────────────────────────────
// Cập nhật thông tin nhóm (Đổi tên)
// ─────────────────────────────────────────────
export const updateGroup = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;
        const { name } = req.body;

        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            return res.status(404).json({ message: "Conversation không tồn tại" });
        }

        if (conversation.type !== "group") {
            return res.status(400).json({ message: "Chỉ nhóm mới có thể cập nhật" });
        }

        // Chỉ admin mới được đổi tên
        if (conversation.group.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Chỉ admin mới được đổi tên nhóm" });
        }

        if (!name || name.trim() === "") {
            return res.status(400).json({ message: "Tên nhóm không được để trống" });
        }

        const updated = await Conversation.findByIdAndUpdate(
            conversationId,
            { $set: { "group.name": name.trim() } },
            { new: true }
        );

        io.to(conversationId).emit("group-updated", {
            conversationId,
            name: updated.group.name,
        });

        return res.status(200).json({ conversation: updated });
    } catch (error) {
        console.error("Lỗi khi cập nhật nhóm", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

// ─────────────────────────────────────────────
// Thêm thành viên vào nhóm
// ─────────────────────────────────────────────
export const addGroupMembers = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id;
        const { memberIds } = req.body;

        if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
            return res.status(400).json({ message: "Cần cung cấp danh sách thành viên" });
        }

        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            return res.status(404).json({ message: "Conversation không tồn tại" });
        }

        if (conversation.type !== "group") {
            return res.status(400).json({ message: "Chỉ nhóm mới có thể thêm thành viên" });
        }

        if (conversation.group.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Chỉ admin mới được thêm thành viên" });
        }

        // Lọc ra những người chưa có trong nhóm
        const currentIds = conversation.participants.map((p) => p.userId.toString());
        const newMembers = memberIds
            .filter((id) => !currentIds.includes(id))
            .map((id) => ({ userId: id, joinedAt: new Date() }));

        if (newMembers.length === 0) {
            return res.status(400).json({ message: "Tất cả người dùng đã có trong nhóm" });
        }

        conversation.participants.push(...newMembers);
        await conversation.save();

        // Notify từng thành viên mới
        newMembers.forEach(({ userId: newId }) => {
            io.to(newId.toString()).emit("added-to-group", { conversationId });
        });

        // Notify cả nhóm
        io.to(conversationId).emit("member-added", {
            conversationId,
            newMemberIds: newMembers.map((m) => m.userId.toString()),
        });

        return res.status(200).json({ message: "Thêm thành viên thành công" });
    } catch (error) {
        console.error("Lỗi khi thêm thành viên", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

// ─────────────────────────────────────────────
// Xóa thành viên khỏi nhóm
// ─────────────────────────────────────────────
export const removeGroupMember = async (req, res) => {
    try {
        const { conversationId, memberId } = req.params;
        const userId = req.user._id;

        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            return res.status(404).json({ message: "Conversation không tồn tại" });
        }

        if (conversation.type !== "group") {
            return res.status(400).json({ message: "Chỉ nhóm mới có thể xóa thành viên" });
        }

        if (conversation.group.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Chỉ admin mới được xóa thành viên" });
        }

        if (memberId === userId.toString()) {
            return res.status(400).json({ message: "Admin không thể tự xóa mình. Hãy dùng API rời nhóm." });
        }

        conversation.participants = conversation.participants.filter(
            (p) => p.userId.toString() !== memberId
        );

        await conversation.save();

        io.to(conversationId).emit("member-removed", { conversationId, memberId });

        return res.sendStatus(204);
    } catch (error) {
        console.error("Lỗi khi xóa thành viên", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};