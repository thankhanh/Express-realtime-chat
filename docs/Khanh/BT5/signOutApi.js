import Session from "./models/Session.js";

export const signOut = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        if (refreshToken) {
            await Session.deleteOne({ refreshToken });
        }
        res.clearCookie("refreshToken");
        return res.sendStatus(204);
    } catch (error) {
        console.error("Lỗi signOut:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};
