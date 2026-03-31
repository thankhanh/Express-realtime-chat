# 📚 BÀI TẬP - KHANH
## Module: Database · User · Session · Authentication API

> **Mục tiêu:** Hiểu cách kết nối MongoDB Atlas, thiết kế schema, xây dựng toàn bộ luồng xác thực (đăng ký, đăng nhập, đổi mật khẩu, xóa tài khoản, cập nhật thông tin) bằng JWT + Refresh Token — đúng như cách đồ án chính đang làm.

---

## PHẦN 1 — LÝ THUYẾT

### 1.1 Kết nối MongoDB Atlas với Mongoose
- **MongoDB Atlas** là dịch vụ cloud database của MongoDB. Thay vì cài MongoDB trên máy, bạn kết nối qua **Connection String** dạng:
  ```
  mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>
  ```
- **Mongoose** là ODM (Object Document Mapper) giúp định nghĩa schema và tương tác với MongoDB bằng JavaScript.
- Hàm `mongoose.connect()` nhận Connection String và trả về Promise — vì vậy cần dùng `async/await`.

### 1.2 Schema & Model trong Mongoose
- **Schema** định nghĩa cấu trúc dữ liệu (các trường, kiểu dữ liệu, ràng buộc).
- **Model** là class được tạo từ Schema, đại diện cho một **collection** trong MongoDB.
- Các option quan trọng:
  - `required: true` — trường bắt buộc.
  - `unique: true` — không được trùng trong collection.
  - `trim: true` — tự động cắt khoảng trắng đầu/cuối.
  - `lowercase: true` — tự động chuyển thành chữ thường.
  - `timestamps: true` — tự thêm `createdAt`, `updatedAt`.

### 1.3 Mã hóa mật khẩu với bcrypt
- **Không bao giờ** lưu mật khẩu dạng plain text vào DB.
- `bcrypt.hash(password, saltRounds)` — mã hóa mật khẩu. `saltRounds = 10` là tiêu chuẩn phổ biến.
- `bcrypt.compare(inputPassword, hashedPassword)` — so sánh và trả về `true/false`.

### 1.4 Xác thực với JWT (JSON Web Token)
- **Access Token:** Tồn tại ngắn (15–30 phút). Được gửi trong `Authorization: Bearer <token>` header mỗi request.
- **Refresh Token:** Tồn tại dài (7–14 ngày). Được lưu trong HTTP-only cookie (an toàn, không thể đọc bằng JS).
- **Luồng hoạt động:**
  1. Đăng nhập → Server cấp `accessToken` + `refreshToken`.
  2. Mỗi request gởi `accessToken` trong header.
  3. Khi `accessToken` hết hạn → Client gọi API `/auth/refresh` với `refreshToken` trong cookie → Server cấp `accessToken` mới.
  4. Đăng xuất → Server xóa `refreshToken` khỏi DB và xóa cookie.

### 1.5 Middleware trong Express
- **Middleware** là hàm chạy giữa request và response: `(req, res, next) => { ... }`.
- `next()` — cho phép request tiếp tục đến middleware/route tiếp theo.
- **Auth Middleware** xác minh JWT, tìm user và đính kèm vào `req.user` để các route sau dùng.

### 1.6 Session-based Refresh Token
- Thay vì ký Refresh Token bằng JWT, dự án này dùng `crypto.randomBytes(64).toString('hex')` để tạo token ngẫu nhiên, sau đó lưu vào collection `sessions` trong MongoDB.
- Khi client gửi Refresh Token → server tra cứu trong DB → nếu tìm thấy và chưa hết hạn → cấp Access Token mới.
- TTL index (`expireAfterSeconds: 0`) giúp MongoDB **tự động xóa** session hết hạn.

---

## PHẦN 2 — CODE MẪU

### 2.1 Kết nối Database (`libs/db.js`)
```javascript
import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING);
        console.log("Liên kết CSDL thành công!");
    } catch (error) {
        console.log("Lỗi khi kết nối CSDL:", error);
        process.exit(1); // thoát nếu không kết nối được
    }
};
```

### 2.2 Schema User (`models/User.js`)
```javascript
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    hashedPassword: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    avatarUrl: { type: String },
    bio:       { type: String, maxlength: 500 },
    phone:     { type: String, sparse: true },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
```

### 2.3 Schema Session (`models/Session.js`)
```javascript
import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    refreshToken: { type: String, required: true, unique: true },
    expiresAt:    { type: Date, required: true },
}, { timestamps: true });

// MongoDB tự xóa document khi expiresAt < now
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Session", sessionSchema);
```

### 2.4 Auth Controller — Đăng ký (`signUp`)
```javascript
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

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            username,
            hashedPassword,
            email,
            displayName: `${lastName} ${firstName}`,
        });

        return res.sendStatus(204); // No Content — thành công
    } catch (error) {
        console.error("Lỗi signUp:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};
```

### 2.5 Auth Controller — Đăng nhập (`signIn`)
```javascript
const ACCESS_TOKEN_TTL  = "30m";
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; // 14 ngày (ms)

export const signIn = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Thiếu username hoặc password" });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: "Username hoặc password không đúng" });
        }

        const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);
        if (!passwordCorrect) {
            return res.status(401).json({ message: "Username hoặc password không đúng" });
        }

        // Tạo Access Token
        const accessToken = jwt.sign(
            { userId: user._id },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: ACCESS_TOKEN_TTL }
        );

        // Tạo Refresh Token ngẫu nhiên
        const refreshToken = crypto.randomBytes(64).toString("hex");

        // Lưu Session vào DB
        await Session.create({
            userId: user._id,
            refreshToken,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
        });

        // Gửi Refresh Token qua HTTP-only cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: REFRESH_TOKEN_TTL,
        });

        return res.status(200).json({ accessToken });
    } catch (error) {
        console.error("Lỗi signIn:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};
```

### 2.6 Auth Middleware (`middlewares/authMiddleware.js`)
```javascript
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protectedRoute = (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

        if (!token) {
            return res.status(401).json({ message: "Không tìm thấy access token" });
        }

        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decodedUser) => {
            if (err) {
                return res.status(403).json({ message: "Token hết hạn hoặc không hợp lệ" });
            }

            const user = await User.findById(decodedUser.userId).select("-hashedPassword");
            if (!user) {
                return res.status(404).json({ message: "Người dùng không tồn tại" });
            }

            req.user = user; // đính kèm user vào request
            next();
        });
    } catch (error) {
        console.error("Lỗi authMiddleware:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};
```

---

## PHẦN 3 — BÀI TẬP NHỎ

> Tạo một project Node.js + Express mới (hoặc dùng thư mục riêng trong project). Cài đặt: `express`, `mongoose`, `bcrypt`, `jsonwebtoken`, `dotenv`, `cookie-parser`.

---

### 🟢 Bài 1 — Kết nối MongoDB Atlas
**Yêu cầu:**
1. Tạo file `.env` với biến `MONGODB_CONNECTIONSTRING` trỏ tới cluster của bạn.
2. Viết hàm `connectDB()` trong `libs/db.js` (ES Module).
3. Gọi `connectDB()` trong `server.js` và in ra `"Kết nối thành công!"` khi thành công.
4. **Kiểm tra:** Chạy server, xem log trên terminal. Thử đổi password sai → xem lỗi xảy ra như thế nào.

---

### 🟢 Bài 2 — Thiết kế Schema User & Session
**Yêu cầu:**
1. Tạo `models/User.js` với các trường: `username`, `hashedPassword`, `email`, `displayName`, `bio`, `phone`.
2. Thêm `timestamps: true`.
3. Đảm bảo `username` và `email` là `unique`.
4. Tạo `models/Session.js` với các trường: `userId` (ref đến User), `refreshToken`, `expiresAt`.
5. Thêm TTL index `{ expireAfterSeconds: 0 }` trên trường `expiresAt`.
6. **Kiểm tra:** Dùng MongoDB Compass để xem collection vừa tạo sau khi insert một document.

---

### 🟡 Bài 3 — API Đăng ký (`POST /api/auth/signup`)
**Yêu cầu:**
- Nhận: `{ username, password, email, firstName, lastName }` từ `req.body`.
- Validate: thiếu trường nào → trả `400`.
- Kiểm tra `username` đã tồn tại → trả `409`.
- Hash password với `bcrypt.hash(password, 10)`.
- Tạo user mới, `displayName = lastName + " " + firstName`.
- Thành công → trả `204 No Content`.

**Test bằng Postman/Thunder Client:**
- Đăng ký thành công.
- Đăng ký lại cùng username → phải trả `409`.

---

### 🟡 Bài 4 — API Đăng nhập (`POST /api/auth/signin`)
**Yêu cầu:**
- Nhận: `{ username, password }`.
- Tìm user trong DB → không có → `401`.
- So sánh password với `bcrypt.compare()` → không khớp → `401`.
- Tạo `accessToken` (JWT, hết hạn 30 phút).
- Tạo `refreshToken` (random 64 bytes hex).
- Lưu session vào DB với `expiresAt = now + 14 ngày`.
- Gửi `refreshToken` trong `httpOnly cookie`.
- Trả `{ accessToken }` trong body.

---

### 🟡 Bài 5 — API Đăng xuất (`POST /api/auth/signout`)
**Yêu cầu:**
- Lấy `refreshToken` từ cookie (`req.cookies.refreshToken`).
- Xóa session tương ứng trong DB (`Session.deleteOne()`).
- Xóa cookie bằng `res.clearCookie("refreshToken")`.
- Trả `204 No Content`.

---

### 🟡 Bài 6 — API Làm mới Token (`POST /api/auth/refresh`)
**Yêu cầu:**
- Lấy `refreshToken` từ cookie.
- Không có → `401`.
- Tra cứu trong DB → không có → `403`.
- Kiểm tra `expiresAt` → hết hạn → `403`.
- Tạo `accessToken` mới và trả về.

---

### 🔴 Bài 7 — Middleware Bảo vệ Route (`protectedRoute`)
**Yêu cầu:**
1. Viết middleware `protectedRoute` trong `middlewares/authMiddleware.js`.
2. Lấy token từ header `Authorization: Bearer <token>`.
3. Xác minh bằng `jwt.verify()`.
4. Tìm user theo `userId` trong payload, gắn vào `req.user`.
5. Apply middleware vào route `/api/users/me` (GET).

**Test:** Gọi route không có token → `401`. Gọi có token hợp lệ → trả thông tin user.

---

### 🔴 Bài 8 — API Cập nhật thông tin User (`PATCH /api/users/profile`)
**Yêu cầu:**
- Route này phải đi qua `protectedRoute`.
- Nhận: `{ displayName, bio, phone }` (các trường không bắt buộc).
- Dùng `User.findByIdAndUpdate(req.user._id, { ... }, { new: true })`.
- Trả về user đã cập nhật (không gửi `hashedPassword`).
- **Lọc:** Thêm query param `?fields=displayName,bio` để chỉ trả về các trường được yêu cầu (dùng `.select()`).

---

### 🔴 Bài 9 — API Đổi mật khẩu (`PATCH /api/users/change-password`)
**Yêu cầu:**
- Route phải đi qua `protectedRoute`.
- Nhận: `{ oldPassword, newPassword }`.
- Tìm user trong DB (bao gồm `hashedPassword`).
- So sánh `oldPassword` với `hashedPassword` hiện tại → không khớp → `401`.
- Hash `newPassword` rồi cập nhật vào DB.
- Trả `204 No Content`.

**Bonus:** Sau khi đổi mật khẩu, xóa tất cả sessions cũ (`Session.deleteMany({ userId })`).

---

### 🔴 Bài 10 — API Xóa tài khoản (`DELETE /api/users/me`)
**Yêu cầu:**
- Route phải đi qua `protectedRoute`.
- Nhận: `{ password }` để xác nhận.
- Kiểm tra password đúng không.
- Xóa user: `User.findByIdAndDelete(req.user._id)`.
- Xóa tất cả sessions của user: `Session.deleteMany({ userId: req.user._id })`.
- Xóa cookie refreshToken.
- Trả `204 No Content`.

---

### 🏆 Bài 11 — Tích hợp & Bổ sung (CRUD đầy đủ)
**Yêu cầu bổ sung:**
1. **Tìm kiếm User bằng Regex (đã implement trong đồ án):**
   - `GET /api/users/search?username=kha` — dùng `{ $regex: query, $options: 'i' }`.
   - Trả về mảng `users[]` tối đa 10 kết quả (thay vì chỉ 1 user).
   - Gõ `"kha"` sẽ ra `"khanh"`, `"khang"`, `"khaLong"`, ...
   - **Khác biệt với cũ:** Cũ dùng `findOne({ username })` tìm chính xác 1 người. Mới dùng `find({ username: { $regex } })`.
2. **Phân trang:** `GET /api/users?page=1&limit=10` — dùng `.skip((page-1) * limit)` và `.limit(limit)`.
3. **Bảo vệ route:** Đảm bảo mọi route `/api/users/*` đều cần token trừ route search.

---

## 📋 BẢNG TỔNG HỢP API

| Method | Endpoint | Auth? | Mô tả |
|--------|----------|-------|-------|
| POST | `/api/auth/signup` | ❌ | Đăng ký |
| POST | `/api/auth/signin` | ❌ | Đăng nhập |
| POST | `/api/auth/signout` | ❌ | Đăng xuất |
| POST | `/api/auth/refresh` | ❌ (cookie) | Làm mới token |
| GET | `/api/users/me` | ✅ | Lấy thông tin bản thân |
| PATCH | `/api/users/profile` | ✅ | Cập nhật thông tin |
| PATCH | `/api/users/change-password` | ✅ | Đổi mật khẩu |
| DELETE | `/api/users/me` | ✅ | Xóa tài khoản |
| GET | `/api/users/search?username=` | ✅ | Tìm kiếm user |

---

## 🛠️ Gợi ý Cấu trúc Thư mục

```
bai-tap-khanh/
├── .env
├── package.json
├── src/
│   ├── server.js
│   ├── libs/
│   │   └── db.js
│   ├── models/
│   │   ├── User.js
│   │   └── Session.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── userController.js
│   ├── middlewares/
│   │   └── authMiddleware.js
│   └── routes/
│       ├── authRoute.js
│       └── userRoute.js
```

---

> 💡 **Lưu ý:** Sau khi hoàn thành bài tập nhỏ, bạn có thể so sánh code của mình với code trong thư mục `backend/src/` của đồ án chính để thấy sự khác biệt và hiểu tại sao đồ án lại tổ chức như vậy.
