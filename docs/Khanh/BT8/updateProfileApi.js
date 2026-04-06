import User from "./models/User.js";

export const updateProfile = async (req, res) => {
    try {
        const { displayName, bio, phone } = req.body;
        const updates = {};
        if (displayName !== undefined) updates.displayName = displayName;
        if (bio !== undefined) updates.bio = bio;
        if (phone !== undefined) updates.phone = phone;

        let query = User.findByIdAndUpdate(req.user._id, updates, { new: true });
        
        const { fields } = req.query;
        if (fields) {
            const selectFields = fields.split(",").join(" ");
            query = query.select(selectFields);
        } else {
            query = query.select("-hashedPassword");
        }

        const updatedUser = await query;
        return res.status(200).json(updatedUser);
    } catch (error) {
        console.error("Lỗi updateProfile:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};
