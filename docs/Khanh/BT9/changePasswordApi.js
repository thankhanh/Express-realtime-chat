import bcrypt from "bcrypt";
import User from "./models/User.js";
import Session from "./models/Session.js";

export const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: "Thiếu mật khẩu cũ hoặc mới" });
        }

        const user = await User.findById(req.user._id);
        const passwordCorrect = await bcrypt.compare(oldPassword, user.hashedPassword);
        
        if (!passwordCorrect) {
            return res.status(401).json({ message: "Mật khẩu cũ không đúng" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.findByIdAndUpdate(req.user._id, { hashedPassword });
        
        await Session.deleteMany({ userId: req.user._id });

        return res.sendStatus(204);
    } catch (error) {
        console.error("Lỗi changePassword:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};
