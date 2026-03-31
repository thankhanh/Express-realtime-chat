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
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post("/direct", checkFriendship, sendDirectMessage);
router.post("/group", checkGroupMembership, sendGroupMessage);
router.post("/image", upload.single("image"), sendImageMessage);  // gửi ảnh
router.delete("/:messageId", deleteMessage);                       // xóa / thu hồi

export default router;
