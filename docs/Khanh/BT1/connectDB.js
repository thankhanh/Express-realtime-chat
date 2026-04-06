import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING);
        console.log("Kết nối thành công!");
    } catch (error) {
        console.log("Lỗi khi kết nối CSDL:", error);
        process.exit(1); 
    }
};

// Gọi thử trong file để mô phỏng server.js
import dotenv from "dotenv";
dotenv.config();

// connectDB();
