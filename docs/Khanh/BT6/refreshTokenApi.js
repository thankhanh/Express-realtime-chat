import jwt from "jsonwebtoken";
import Session from "./models/Session.js";

export const refresh = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) {
            return res.status(401).json({ message: "Không tìm thấy refresh token" });
        }

        const session = await Session.findOne({ refreshToken });
        if (!session) {
            return res.status(403).json({ message: "Token không hợp lệ" });
        }

        if (new Date() > session.expiresAt) {
            await Session.deleteOne({ refreshToken });
            return res.status(403).json({ message: "Token đã hết hạn" });
        }

        const accessToken = jwt.sign(
            { userId: session.userId },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "30m" }
        );

        return res.status(200).json({ accessToken });
    } catch (error) {
        console.error("Lỗi refresh:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};
