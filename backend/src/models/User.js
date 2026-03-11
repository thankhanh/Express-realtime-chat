import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    hashedPassword: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    displayName: {
        type: String,
        required: true,
        trim: true
    },
    avatarUrl: {
        type: String, // link CDN để hiện thị hình
    },
    avatarId: {
        type: String, // Cloudinary public_id để xóa hình
    },
    bio: {
        type: String,
        maxLength: 500
    },
    phone: {
        type: String,
        sparse: true, // cho phép null nhưng không được trống
        match: /^\d{10}$/ // chỉ chấp nhận 10 số
    },
},
    {
        timestamps: true
    }
);

const User = mongoose.model("User", userSchema);
export default User;
