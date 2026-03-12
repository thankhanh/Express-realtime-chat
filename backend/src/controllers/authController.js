import bcrypt from "bcrypt";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Session from "../models/Session.js";

const ACCESS_TOKEN_TTL = '30m'; // Thời gian sống của access token, có thể điều chỉnh theo nhu cầu (ví dụ: '15m' cho 15 phút)
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; // Thời gian sống của refresh token (14 ngày) 

export const signUp = async (req, res) => {
    try{
        const { username , password, email, firstName, lastName } = req.body;

        if(!username || !password || !email || !firstName || !lastName) {
            return res.status(400).json({ message: "Không thể thiếu username , password, email, firstName và lastName" });
        }
        // Kiểm tra xem username đã tồn tại chưa
        const duplicate = await User.findOne({username});
        if(duplicate) {
            return res.status(409).json({ message: "Username đã tồn tại" });
        }

        //mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        //tạo user mới
        await User.create({
            username,
            hashedPassword,
            email,
            displayName: `${firstName} ${lastName}`,
        });

        //return
        return res.sendStatus(204);

    }
    catch(error){
        console.error('Lỗi khi gọi signUp',error);
        return res.status(500).json({ message: "Lỗi server" });
    }
};

export const signIn = async (req, res) => {
    try{
        // lấy inputs
        const { username, password } = req.body;
        if(!username || !password) {
            return res.status(400).json({ message: "Thiếu username hoặc password" });
        }

        // lấy hashedPassword từ db để so với password người dùng nhập vào
        const user = await User.findOne({ username });
        if(!user) {
            return res.status(401).json({ message: "username hoặc password không chính xác" });
        }

        // kiểm tra password
        const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);
        if(!passwordCorrect) {
            return res.status(401).json({ message: "username hoặc password không chính xác" });
        }

        // nếu khớp, tạo accessToken với JWT
        const accessToken = jwt.sign({userId: user._id}, 
            // @ts-ignore
            process.env.ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_TTL });

        // tạo refreshToken
        const refreshToken = crypto.randomBytes(64).toString('hex'); // Tạo refresh token ngẫu nhiên

        // tạo session mới để lưu refreshToken
        await Session.create({
            userId: user._id,
            refreshToken,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL), // Đặt thời gian hết hạn cho refresh token
        });

        // trả refreshToken về trong cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true, // Chỉ cho phép truy cập cookie từ server
            secure: true,
            sameSite: 'none', // backend, frontend deloy riêng
            maxAge: REFRESH_TOKEN_TTL, // Thời gian sống của cookie
        });

        // trả accessToken về trong ress
        return res.status(200).json({message: `User ${user.displayName} đã logged in`,accessToken});
    }
    catch(error){
        console.error('Lỗi khi gọi signIn',error);
        return res.status(500).json({ message: "Lỗi server" });
    }
};

export const signOut = async (req, res) => {
    try {
        // lấy refreshToken từ cookie
        const token = req.cookies?.refreshToken;
        if(!token) {
            // xóa refreshToken trong Session
            await Session.deleteOne({ refreshToken: token });

            // xóa cookie
            res.clearCookie('refreshToken');           
        }

        return res.status(400);      
    }
    catch(error){
        console.error('Lỗi khi gọi signOut',error);
        return res.status(500).json({ message: "Lỗi server" });
    }
};