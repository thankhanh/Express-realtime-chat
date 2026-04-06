import { Server } from "socket.io";
import http from "http";
import express from "express";
import { socketAuthMiddleware } from "../middlewares/socketMiddleware.js";
import { getUserConversationsForSocketIO } from "../controllers/conversationController.js";

// http.createServer
const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        credentials: true,
    },
});

io.use(socketAuthMiddleware);

const onlineUsers = new Map(); // {userId: socketId}
const hiddenUsers = new Set(); // userId của những người đang ẩn trạng thái

// Broadcast danh sách online (loại bỏ người đang ẩn trạng thái)
const broadcastOnlineUsers = () => {
    const visibleIds = Array.from(onlineUsers.keys()).filter(
        (id) => !hiddenUsers.has(id)
    );
    io.emit("online-users", visibleIds);
};

io.on("connection", async (socket) => {
    const user = socket.user;

    console.log(`${user.displayName} online với socket ${socket.id}`);

    onlineUsers.set(user._id.toString(), socket.id);

    broadcastOnlineUsers();

    const conversationIds = await getUserConversationsForSocketIO(user._id);
    conversationIds.forEach((id) => {
        socket.join(id);
    });

    socket.on("join-conversation", (conversationId) => {
        socket.join(conversationId);
    });

    // ── Online Visibility (real-time) ─────────────────────
    socket.on("set-online-visibility", ({ visible }) => {
        const userId = user._id.toString();
        if (visible) {
            hiddenUsers.delete(userId);
        } else {
            hiddenUsers.add(userId);
        }
        // Broadcast ngay cho tất cả client
        broadcastOnlineUsers();
    });
    // ─────────────────────────────────────────────────────

    // ── Typing Indicator ──────────────────────────────────
    socket.on("typing", ({ conversationId }) => {
        socket.to(conversationId).emit("user-typing", {
            userId: user._id,
            displayName: user.displayName,
            conversationId,
        });
    });

    socket.on("stop-typing", ({ conversationId }) => {
        socket.to(conversationId).emit("user-stop-typing", {
            userId: user._id,
            conversationId,
        });
    });
    // ─────────────────────────────────────────────────────

    socket.join(user._id.toString());

    socket.on("disconnect", () => {
        onlineUsers.delete(user._id.toString());
        // Không cần xóa khỏi hiddenUsers khi disconnect (sẽ tự loại qua onlineUsers)
        broadcastOnlineUsers();
        console.log(`socket disconnected: ${socket.id}`);
    });
});

export { io, app, server };