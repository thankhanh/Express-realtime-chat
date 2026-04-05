import express from "express";
import jwt from "jsonwebtoken";

import User from "../../../backend/src/models/User.js";
import Message from "../../../backend/src/models/Message.js";

const router = express.Router();

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

// GET /api/messages/:conversationId/search?q=xin+chao
export const searchMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { q = "" } = req.query;

        const query = {
            conversationId,
            content: { $regex: q, $options: "i" },
        };

        const messages = await Message.find(query).sort({ createdAt: -1 });
        return res.status(200).json({ messages });
    } catch (error) {
        console.error("searchMessages error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// GET /api/messages/:conversationId?from=2024-01-01&to=2024-01-31&type=image
export const getFilteredMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { from, to, type } = req.query;

        const query = { conversationId };

        if (from || to) {
            query.createdAt = {};
            if (from) {
                query.createdAt.$gte = new Date(from);
            }
            if (to) {
                query.createdAt.$lte = new Date(to);
            }
        }

        if (type === "image") {
            query.imgUrl = { $exists: true, $ne: null };
        }

        const messages = await Message.find(query).sort({ createdAt: -1 });
        return res.status(200).json({ messages });
    } catch (error) {
        console.error("getFilteredMessages error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

router.get("/api/messages/:conversationId/search", protectedRoute, searchMessages);
router.get("/api/messages/:conversationId", protectedRoute, getFilteredMessages);

export default router;
