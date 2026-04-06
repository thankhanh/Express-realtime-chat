import express from "express";
import {
    authMe,
    searchUserByUsername,
    uploadAvatar,
    updateProfile,
    changePassword,
    blockUser,
    unblockUser,
    getBlockedUsers,
    deleteAccount,
} from "../controllers/userController.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.get("/me", authMe);
router.get("/search", searchUserByUsername);
router.patch("/profile", updateProfile);
router.patch("/change-password", changePassword);
router.post("/uploadAvatar", upload.single("file"), uploadAvatar);

// Block/Unblock
router.post("/block/:targetUserId", blockUser);
router.delete("/block/:targetUserId", unblockUser);
router.get("/blocked", getBlockedUsers);

// Delete Account
router.delete("/account", deleteAccount);

export default router;
