import express from "express";

import {
    sendDirectMessage,
    sendGroupMessage,
    sendImageMessage,
    deleteMessage,
} from "../controllers/messageController.js";
import {
    checkFriendship,
    checkGroupMembership,
} from "../middlewares/friendMiddleware.js";
import { uploadMessageImage } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// gửi tin nhắn riêng
router.post("/direct", checkFriendship, sendDirectMessage);
// gửi tin nhắn nhóm
router.post("/group", checkGroupMembership, sendGroupMessage);
// gửi tin nhắn ảnh riêng và nhóm
router.post("/image", uploadMessageImage, sendImageMessage); 
// xóa / thu hồi tin nhắn (cả riêng và nhóm)
router.delete("/:messageId", deleteMessage);                       

export default router;
