import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        credentials: true,
    },
});

io.on("connection", (socket) => {
    const user = socket.user;

    // Client emit typing with { conversationId }
    socket.on("typing", ({ conversationId }) => {
        // Emit to all in room except sender
        socket.to(conversationId).emit("user-typing", {
            userId: user._id,
            displayName: user.displayName,
            conversationId,
        });
    });

    // Client emit stop-typing when user stops typing
    socket.on("stop-typing", ({ conversationId }) => {
        socket.to(conversationId).emit("user-stop-typing", {
            userId: user._id,
            conversationId,
        });
    });
});

export { app, io, server };
