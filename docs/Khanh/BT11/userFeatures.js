import User from "./models/User.js";

export const searchUsers = async (req, res) => {
    try {
        const { username } = req.query;
        if (!username) {
            return res.status(400).json({ message: "Vui lòng nhập từ khóa username" });
        }

        const users = await User.find({ username: { $regex: username, $options: 'i' } })
            .select("-hashedPassword")
            .limit(10);
            
        return res.status(200).json(users);
    } catch (error) {
        console.error("Lỗi searchUsers:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const users = await User.find()
            .select("-hashedPassword")
            .skip(skip)
            .limit(limit);

        return res.status(200).json(users);
    } catch (error) {
        console.error("Lỗi getAllUsers:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};
