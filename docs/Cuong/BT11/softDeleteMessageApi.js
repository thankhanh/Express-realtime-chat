import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import User from "../../../backend/src/models/User.js";
import { io } from "../../../backend/src/socket/index.js";

const router = express.Router();

// Message schema co isDeleted = false de phuc vu soft delete
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
            default: null,
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

// DELETE /api/messages/:messageId (soft delete)
export const softDeleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        // Only sender can revoke message
        if (message.senderId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You are not allowed to revoke this message" });
        }

        message.isDeleted = true;
        message.content = null;
        message.imgUrl = null;
        await message.save();

        io.to(message.conversationId.toString()).emit("delete-message", {
            messageId: message._id,
            conversationId: message.conversationId,
        });

        return res.status(200).json({ message: "Message revoked" });
    } catch (error) {
        console.error("softDeleteMessage error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

router.delete("/api/messages/:messageId", protectedRoute, softDeleteMessage);

export default router;

/*
Why soft delete:
- Keep history so reply messages still reference an existing id.
- Client can show "Tin nhan da bi thu hoi" instead of old content.
*/
