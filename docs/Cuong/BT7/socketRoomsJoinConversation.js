import { Server } from "socket.io";
import http from "http";
import express from "express";

import Conversation from "../../../backend/src/models/Conversation.js";
import Message from "../../../backend/src/models/Message.js";

const app = express();
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        credentials: true,
    },
});

// Helper: lay tat ca conversationId ma user tham gia
const getUserConversationIds = async (userId) => {
    const conversations = await Conversation.find(
        { "participants.userId": userId },
        { _id: 1 }
    );

    return conversations.map((conversation) => conversation._id.toString());
};

io.on("connection", async (socket) => {
    // Gia su user da duoc gan boi auth middleware socket
    const user = socket.user;

    // 1) Join tat ca room conversation khi vua connect
    const conversationIds = await getUserConversationIds(user._id);
    conversationIds.forEach((conversationId) => {
        socket.join(conversationId);
    });

    // 2) Client co the join them mot room conversation bat ky
    socket.on("join-conversation", (conversationId) => {
        socket.join(conversationId);
    });
});

// API gui tin nhan de kiem tra realtime new-message
app.post("/api/messages", async (req, res) => {
    try {
        const { conversationId, senderId, content } = req.body;

        const message = await Message.create({
            conversationId,
            senderId,
            content,
        });

        // 3) Emit vao room conversationId, cac client trong room nhan duoc ngay
        io.to(conversationId).emit("new-message", {
            message,
        });

        return res.status(201).json({ message });
    } catch (error) {
        console.error("send message error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

export { app, io, server };
