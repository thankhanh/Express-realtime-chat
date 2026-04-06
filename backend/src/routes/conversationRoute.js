import express from "express";
import {
    createConversation,
    getConversations,
    getMessages,
    markAsSeen,
    leaveGroup,
    updateGroup,
    uploadGroupAvatar,
    addGroupMembers,
    removeGroupMember,
    deleteConversation,
} from "../controllers/conversationController.js";
import { checkFriendship } from "../middlewares/friendMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post("/", checkFriendship, createConversation);              // tạo conversation
router.get("/", getConversations);                                   // lấy danh sách
router.get("/:conversationId/messages", getMessages);               // lấy tin nhắn (+ ?search=...)
router.patch("/:conversationId/seen", markAsSeen);                  // đánh dấu đã đọc
// Group
router.patch("/:conversationId/leave", leaveGroup);                 // rời nhóm
router.post("/:conversationId/avatar", upload.single("file"), uploadGroupAvatar); // upload avatar nhóm
router.patch("/:conversationId/members/add", addGroupMembers);      // thêm thành viên
router.delete("/:conversationId/members/:memberId", removeGroupMember); // xóa thành viên
router.patch("/:conversationId", updateGroup);                      // cập nhật đổi tên nhóm chung
router.delete("/:conversationId", deleteConversation);               // xóa cuộc hội thoại

export default router;
