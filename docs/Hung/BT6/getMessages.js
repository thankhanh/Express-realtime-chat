import Message from "../models/Message.js";

// BÀI TẬP 6: Lấy tin nhắn của Conversation (Cursor-based pagination)
// GET /api/conversations/:conversationId/messages
export const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { limit = 20, cursor } = req.query;

        const query = { conversationId };

        // Nếu có cursor, lọc theo thời gian trước đó
        if (cursor) {
            query.createdAt = { $lt: new Date(cursor) };
        }

        // Truy vấn giới hạn limit + 1
        let messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit) + 1);

        let nextCursor = null;

        // Nếu lấy được nhiều hơn limit thì có trang tiếp theo
        if (messages.length > Number(limit)) {
            const nextMessage = messages[messages.length - 1];
            nextCursor = nextMessage.createdAt.toISOString();
            messages.pop(); // loại bỏ cái thừa
        }

        // Đảo ngược để frontend hiển thị đúng thứ tự cũ đến mới
        messages = messages.reverse();

        return res.status(200).json({ messages, nextCursor });
    } catch (error) {
        console.error("Lỗi getMessages:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};
