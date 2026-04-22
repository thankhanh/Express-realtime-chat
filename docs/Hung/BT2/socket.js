import { Server } from "socket.io";
import http from "http";
import express from "express";
import Conversation from "../models/Conversation.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL, credentials: true },
});

// Giả định đã có middleware io.use để xác thực jwt, gán user vào socket.user
io.on("connection", async (socket) => {
    const user = socket.user;
    console.log(`Client kết nối: ${socket.id} - ${user.displayName}`);

    // BÀI TẬP 2: User join vào room theo userId
    socket.join(user._id.toString());

    try {
        // Query DB lấy tất cả conversation của user và join vào từng room
        const conversations = await Conversation.find({ "participants.userId": user._id }, { _id: 1 });
        conversations.forEach((c) => {
            socket.join(c._id.toString());
        });
        
        console.log(`Socket đã join các rooms: `, Array.from(socket.rooms));
    } catch (err) {
        console.error("Lỗi khi join rooms", err);
    }

    socket.on("disconnect", () => {
        console.log(`Client ngắt kết nối: ${socket.id}`);
    });
});

export { io, app, server };
