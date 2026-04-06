import bcrypt from "bcrypt";
import User from "./models/User.js"; // Giả định import

export const signUp = async (req, res) => {
    try {
        const { username, password, email, firstName, lastName } = req.body;

        if (!username || !password || !email || !firstName || !lastName) {
            return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
        }

        const duplicate = await User.findOne({ username });
        if (duplicate) {
            return res.status(409).json({ message: "Username đã tồn tại" });
        }

        const duplicateEmail = await User.findOne({ email });
        if (duplicateEmail) {
            return res.status(409).json({ message: "Email đã tồn tại" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            username,
            hashedPassword,
            email,
            displayName: `${lastName} ${firstName}`
        });

        return res.sendStatus(204);
    } catch (error) {
        console.error("Lỗi signUp:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};
