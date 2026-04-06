import bcrypt from "bcrypt";
import User from "./models/User.js";
import Session from "./models/Session.js";

export const deleteAccount = async (req, res) => {
    try {
        const { password } = req.body;
        
        if (!password) {
            return res.status(400).json({ message: "Thiếu mật khẩu xác nhận" });
        }

        const user = await User.findById(req.user._id);
        const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);
        
        if (!passwordCorrect) {
            return res.status(401).json({ message: "Mật khẩu không đúng" });
        }

        await User.findByIdAndDelete(req.user._id);
        await Session.deleteMany({ userId: req.user._id });
        res.clearCookie("refreshToken");

        return res.sendStatus(204);
    } catch (error) {
        console.error("Lỗi deleteAccount:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};
