import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import User from "../../../backend/src/models/User.js";

const router = express.Router();

// Message schema co replyTo: ObjectId ref Message, default null
const messageSchema = new mongoose.Schema(
    {
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: {
            type: String,
            trim: true,
        },
        imgUrl: {
            type: String,
            default: null,
        },
        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

const Message = mongoose.models.Message || mongoose.model("Message", messageSchema);

export const protectedRoute = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "Missing access token" });
        }

        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decodedUser) => {
            if (err) {
                return res.status(403).json({ message: "Token invalid or expired" });
            }

            const user = await User.findById(decodedUser.userId).select("-hashedPassword");
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            req.user = user;
            return next();
        });
    } catch (error) {
        console.error("auth error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Send message with optional replyTo
export const sendMessage = async (req, res) => {
    try {
        const { conversationId, content, replyTo } = req.body;
        const senderId = req.user._id;

        const message = await Message.create({
            conversationId,
            senderId,
            content,
            replyTo: replyTo || null,
        });

        return res.status(201).json({ message });
    } catch (error) {
        console.error("sendMessage error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Get messages and populate replyTo
export const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;

        const messages = await Message.find({ conversationId })
            .sort({ createdAt: -1 })
            .populate("replyTo", "content senderId imgUrl isDeleted")
            .limit(50);

        return res.status(200).json({ messages: messages.reverse() });
    } catch (error) {
        console.error("getMessages error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

router.post("/api/messages", protectedRoute, sendMessage);
router.get("/api/messages/:conversationId", protectedRoute, getMessages);

export default router;
