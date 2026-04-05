import express from "express";
import {
    createConversation,
    getConversations,
    getMessages,
    markAsSeen,
    leaveGroup,
    updateGroup,
    addGroupMembers,
    removeGroupMember,
} from "../controllers/conversationController.js";
import { checkFriendship } from "../middlewares/friendMiddleware.js";

const router = express.Router();

router.post("/", checkFriendship, createConversation);              // tạo conversation
router.get("/", getConversations);                                   // lấy danh sách
router.get("/:conversationId/messages", getMessages);               // lấy tin nhắn (+ ?search=...)
router.patch("/:conversationId/seen", markAsSeen);                  // đánh dấu đã đọc
router.patch("/:conversationId/leave", leaveGroup);                 // rời nhóm
router.patch("/:conversationId", updateGroup);                      // cập nhật tên nhóm
router.patch("/:conversationId/members/add", addGroupMembers);      // thêm thành viên
router.delete("/:conversationId/members/:memberId", removeGroupMember); // xóa thành viên

export default router;
