import { uploadImageFromBuffer } from "../middlewares/uploadMiddleware.js";
import User from "../models/User.js";
import bcrypt from "bcrypt";

export const authMe = async (req, res) => {
    try {
        const user = req.user; // lấy từ authMiddleware

        return res.status(200).json({
            user,
        });
    } catch (error) {
        console.error("Lỗi khi gọi authMe", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const searchUserByUsername = async (req, res) => {
    try {
        const { username } = req.query;
        const currentUserId = req.user._id;

        if (!username || username.trim() === "") {
            return res.status(400).json({ message: "Cần cung cấp username trong query." });
        }

        // Dùng regex để tìm gợi ý, loại bỏ bản thân khỏi kết quả
        const users = await User.find({
            username: { $regex: username.trim(), $options: "i" },
            _id: { $ne: currentUserId },
        })
            .select("_id displayName username avatarUrl")
            .limit(10);

        return res.status(200).json({ users });
    } catch (error) {
        console.error("Lỗi xảy ra khi searchUserByUsername", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { displayName, bio, phone } = req.body;
        const userId = req.user._id;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { displayName, bio, phone },
            { new: true, runValidators: true }
        ).select("-hashedPassword");

        // Phát sự kiện socket để cập nhật thông tin cho tất cả mọi người
        const { io } = await import("../socket/index.js");
        io.emit("user-updated", { user: updatedUser });

        return res.status(200).json({
            message: "Cập nhật hồ sơ thành công",
            user: updatedUser,
        });
    } catch (error) {
        console.error("Lỗi khi cập nhật hồ sơ", error);
        if (error.code === 11000) {
            return res.status(400).json({ message: "Số điện thoại đã tồn tại" });
        }
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user._id;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: "Thiếu mật khẩu cũ hoặc mới" });
        }

        const user = await User.findById(userId);
        const isMatch = await bcrypt.compare(oldPassword, user.hashedPassword);

        if (!isMatch) {
            return res.status(400).json({ message: "Mật khẩu cũ không chính xác" });
        }

        const salt = await bcrypt.genSalt(10);
        user.hashedPassword = await bcrypt.hash(newPassword, salt);
        await user.save();

        return res.status(200).json({ message: "Đổi mật khẩu thành công" });
    } catch (error) {
        console.error("Lỗi khi đổi mật khẩu", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const uploadAvatar = async (req, res) => {
    try {
        const file = req.file;
        const userId = req.user._id;

        if (!file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const result = await uploadImageFromBuffer(file.buffer);

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                avatarUrl: result.secure_url,
                avatarId: result.public_id,
            },
            {
                new: true,
            }
        ).select("avatarUrl");

        if (!updatedUser.avatarUrl) {
            return res.status(400).json({ message: "Avatar trả về null" });
        }

        return res.status(200).json({ avatarUrl: updatedUser.avatarUrl });
    } catch (error) {
        console.error("Lỗi xảy ra khi upload avatar", error);
        return res.status(500).json({ message: "Upload failed" });
    }
};

export const blockUser = async (req, res) => {
    try {
        const { targetUserId } = req.params;
        const userId = req.user._id;

        if (userId.toString() === targetUserId) {
            return res.status(400).json({ message: "Không thể tự chặn bản thân" });
        }

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ message: "Người dùng không tồn tại" });
        }

        await User.findByIdAndUpdate(userId, {
            $addToSet: { blockedUsers: targetUserId },
        });

        return res.status(200).json({ message: `Đã chặn ${targetUser.displayName}` });
    } catch (error) {
        console.error("Lỗi khi blockUser", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const unblockUser = async (req, res) => {
    try {
        const { targetUserId } = req.params;
        const userId = req.user._id;

        await User.findByIdAndUpdate(userId, {
            $pull: { blockedUsers: targetUserId },
        });

        return res.status(200).json({ message: "Đã bỏ chặn người dùng" });
    } catch (error) {
        console.error("Lỗi khi unblockUser", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const getBlockedUsers = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId)
            .populate("blockedUsers", "_id displayName username avatarUrl")
            .select("blockedUsers");

        return res.status(200).json({ blockedUsers: user.blockedUsers });
    } catch (error) {
        console.error("Lỗi khi getBlockedUsers", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const deleteAccount = async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.user._id;

        if (!password) {
            return res.status(400).json({ message: "Cần cung cấp mật khẩu để xác nhận" });
        }

        const user = await User.findById(userId);
        const isMatch = await bcrypt.compare(password, user.hashedPassword);

        if (!isMatch) {
            return res.status(401).json({ message: "Mật khẩu không chính xác" });
        }

        await User.findByIdAndDelete(userId);

        // Xóa session
        const Session = (await import("../models/Session.js")).default;
        await Session.deleteMany({ userId });

        res.clearCookie("refreshToken");
        return res.status(200).json({ message: "Tài khoản đã được xóa thành công" });
    } catch (error) {
        console.error("Lỗi khi deleteAccount", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};