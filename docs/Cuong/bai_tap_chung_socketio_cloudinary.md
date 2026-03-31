# 📚 BÀI TẬP CHUNG — Socket.IO & Cloudinary
## Dành cho: Khánh · Cường · Minh · Hùng

> **Mục tiêu:** Mỗi thành viên đều phải nắm vững 2 công nghệ lõi này vì chúng được dùng xuyên suốt trong đồ án chính: Socket.IO cho realtime và Cloudinary cho lưu trữ ảnh.

---

# PHẦN A — SOCKET.IO

## A.1 Lý thuyết

### Socket.IO là gì?
- HTTP là **request-response**: client hỏi → server trả lời. Server không thể chủ động gửi dữ liệu cho client.
- **Socket.IO** giải quyết vấn đề này bằng kết nối **WebSocket** (2 chiều, liên tục). Server có thể đẩy dữ liệu xuống client bất cứ lúc nào mà không cần client yêu cầu.
- **Use case phổ biến:** Chat app, thông báo realtime, live dashboard, game multiplayer.

### Các khái niệm cốt lõi
| Khái niệm | Mô tả |
|-----------|-------|
| **Server** | `new Server(httpServer, options)` — khởi tạo Socket.IO server |
| **Socket** | Đại diện cho 1 kết nối của 1 client |
| **Room** | Nhóm ảo các socket. Emit vào room → tất cả socket trong room nhận |
| **Event** | Tên sự kiện (string), ví dụ `"new-message"`, `"disconnect"` |
| **Emit** | Gửi sự kiện kèm data |
| **On** | Lắng nghe sự kiện |

### Emit patterns quan trọng
```javascript
socket.emit("event", data)           // Chỉ gửi cho client này
socket.broadcast.emit("event", data) // Gửi cho tất cả TRỪ client này
io.emit("event", data)               // Gửi cho TẤT CẢ client
io.to("roomId").emit("event", data)  // Gửi cho tất cả trong room
socket.to("roomId").emit("event", data) // Gửi cho room, trừ socket này
```

### Authentication trong Socket.IO
- HTTP request có `Authorization` header, nhưng WebSocket handshake không có.
- **Cách xử lý:** Client gửi token trong `auth` object khi connect:
  ```javascript
  // Client side
  const socket = io("http://localhost:5001", {
      auth: { token: accessToken },
      withCredentials: true,
  });
  ```
- Server dùng middleware `io.use()` để xác minh trước khi cho kết nối.

---

## A.2 Code mẫu

### Setup Socket.IO Server (`socket/index.js`)
```javascript
import { Server } from "socket.io";
import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        credentials: true,
    },
});

// Middleware xác thực JWT cho socket
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error("Không có token"));
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decoded.userId).select("-hashedPassword");

        if (!user) {
            return next(new Error("User không tồn tại"));
        }

        socket.user = user; // gắn user vào socket
        next();
    } catch (error) {
        next(new Error("Token không hợp lệ"));
    }
});

const onlineUsers = new Map(); // { userId: socketId }

io.on("connection", async (socket) => {
    const user = socket.user;
    console.log(`${user.displayName} kết nối với socket ${socket.id}`);

    // Lưu user vào map online
    onlineUsers.set(user._id.toString(), socket.id);

    // Thông báo danh sách online cho tất cả
    io.emit("online-users", Array.from(onlineUsers.keys()));

    // Join user vào room riêng (để nhận sự kiện cá nhân)
    socket.join(user._id.toString());

    // Client có thể join vào room conversation
    socket.on("join-conversation", (conversationId) => {
        socket.join(conversationId);
        console.log(`${user.displayName} joined room ${conversationId}`);
    });

    // Typing indicator
    socket.on("typing", ({ conversationId }) => {
        socket.to(conversationId).emit("user-typing", {
            userId: user._id,
            displayName: user.displayName,
            conversationId,
        });
    });

    socket.on("stop-typing", ({ conversationId }) => {
        socket.to(conversationId).emit("user-stop-typing", {
            userId: user._id,
            conversationId,
        });
    });

    socket.on("disconnect", () => {
        onlineUsers.delete(user._id.toString());
        io.emit("online-users", Array.from(onlineUsers.keys()));
        console.log(`${user.displayName} đã ngắt kết nối`);
    });
});

export { io, app, server };
```

---

## A.3 Bài tập Socket.IO

### 🟢 Bài A1 — Hello Socket
**Yêu cầu:**
1. Tạo server Express + Socket.IO.
2. Client connect → server log `"Client kết nối: <socketId>"`.
3. Client gửi event `"hello"` với `{ name: "Khánh" }` → server log `"Xin chào Khánh"` và emit lại event `"welcome"` với `{ message: "Chào mừng Khánh!" }` cho đúng client đó.
4. Client disconnect → server log `"Client ngắt kết nối"`.
5. **Test:** Dùng [https://amritb.github.io/socketio-client-tool/](https://amritb.github.io/socketio-client-tool/) hoặc viết HTML đơn giản để test.

---

### 🟢 Bài A2 — Chat Room đơn giản
**Yêu cầu:**
1. Client join vào room bằng event `"join-room"` với `{ room: "phong-A" }`.
2. Client gửi tin nhắn bằng event `"send-message"` với `{ room: "phong-A", text: "xin chào" }`.
3. Server emit `"receive-message"` đến tất cả trong room (trừ người gửi) với `{ from: socketId, text }`.
4. Client leave room bằng event `"leave-room"`.
5. **Test:** Mở 2 tab trình duyệt, join cùng room, gửi tin nhắn từ tab này thấy ở tab kia.

---

### 🟡 Bài A3 — Online Users Tracker
**Yêu cầu:**
1. Dùng `Map<userId, socketId>` để theo dõi ai đang online.
2. Khi user connect → thêm vào Map → emit `"online-users"` với mảng userId đang online cho TẤT CẢ.
3. Khi user disconnect → xóa khỏi Map → emit lại `"online-users"`.
4. Tạo API REST `GET /api/users/online` trả về danh sách userIds đang online (lấy từ Map).
5. **Test:** Mở nhiều tab, xem danh sách online thay đổi theo thời gian thực.

---

### 🟡 Bài A4 — Socket.IO Middleware (Authentication)
**Yêu cầu:**
1. Viết middleware `io.use((socket, next) => { ... })` xác minh JWT từ `socket.handshake.auth.token`.
2. Nếu token không hợp lệ → `next(new Error("Unauthorized"))` → client bị từ chối kết nối.
3. Nếu hợp lệ → gắn `socket.user = user` → `next()`.
4. Trong event handler, dùng `socket.user` để biết ai đang gửi.
5. **Test:** Connect không có token → bị lỗi. Connect có token → kết nối thành công và log tên user.

---

### 🔴 Bài A5 — Private Messaging
**Yêu cầu:**
1. Mỗi user khi connect → `socket.join(userId)` (join vào room riêng của mình).
2. Client gửi event `"private-message"` với `{ toUserId, text }`.
3. Server emit `"private-message"` đến room `toUserId` với `{ fromUserId, text, timestamp }`.
4. Nếu người nhận offline → lưu tin nhắn vào DB (collection `pending_messages`) và gửi khi họ online lại.
5. **Test:** User A gửi tin cho User B. B đang online → nhận ngay. B offline → thấy tin khi login lại.

---

---

# PHẦN B — CLOUDINARY

## B.1 Lý thuyết

### Cloudinary là gì?
- Dịch vụ cloud lưu trữ và xử lý ảnh/video.
- Sau khi upload, Cloudinary trả về **URL công khai** để hiển thị ảnh.
- **Tại sao không lưu ảnh trên server?** Khi deploy (Heroku, Railway...), hệ thống file thường bị reset. Cloudinary giải quyết vấn đề này.

### Luồng upload ảnh trong đồ án
```
Client           Backend              Cloudinary
  |                  |                    |
  |--- POST file --→|                    |
  |     (multipart) |                    |
  |                  |--- upload_stream→|
  |                  |←-- secure_url ---|
  |                  |                    |
  |←-- { avatarUrl }|                    |
```

### Multer — nhận file từ client
- `multer.memoryStorage()` — lưu file vào RAM (buffer), không ghi ra đĩa. Phù hợp khi sẽ stream lên Cloudinary ngay.
- `upload.single("avatar")` — nhận 1 file với field name là `"avatar"`.
- Sau middleware, file có trong `req.file.buffer`.

### Transformations của Cloudinary
```javascript
transformation: [
    { width: 200, height: 200, crop: "fill" }, // crop thành 200x200
    { quality: "auto" },                         // tối ưu chất lượng tự động
    { format: "webp" },                          // convert sang WebP (nhẹ hơn)
]
```

### Quản lý file — Xóa ảnh cũ
```javascript
await cloudinary.uploader.destroy(avatarId); // avatarId là public_id từ lần upload trước
```

---

## B.2 Code mẫu

### Cấu hình Cloudinary (`server.js`)
```javascript
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
```

### Middleware nhận và upload file (`middlewares/uploadMiddleware.js`)
```javascript
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

// Nhận file vào RAM
export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 1024 * 1024 * 5 }, // giới hạn 5MB
    fileFilter: (req, file, cb) => {
        // Chỉ nhận file ảnh
        if (!file.mimetype.startsWith("image/")) {
            return cb(new Error("Chỉ chấp nhận file ảnh"), false);
        }
        cb(null, true);
    },
});

// Upload buffer lên Cloudinary
export const uploadImageFromBuffer = (buffer, options = {}) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "CCNLTHD/avatars",
                resource_type: "image",
                transformation: [{ width: 200, height: 200, crop: "fill" }],
                ...options,
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        stream.end(buffer); // gửi buffer vào stream
    });
};
```

### Controller upload avatar
```javascript
export const uploadAvatar = async (req, res) => {
    try {
        const file = req.file;
        const userId = req.user._id;

        if (!file) {
            return res.status(400).json({ message: "Không có file được upload" });
        }

        // Xóa ảnh cũ nếu có
        const user = await User.findById(userId).select("avatarId");
        if (user?.avatarId) {
            await cloudinary.uploader.destroy(user.avatarId);
        }

        // Upload ảnh mới
        const result = await uploadImageFromBuffer(file.buffer);

        // Lưu URL và public_id vào DB
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { avatarUrl: result.secure_url, avatarId: result.public_id },
            { new: true }
        ).select("avatarUrl");

        return res.status(200).json({ avatarUrl: updatedUser.avatarUrl });
    } catch (error) {
        console.error("Lỗi upload avatar:", error);
        return res.status(500).json({ message: "Upload thất bại" });
    }
};
```

### Route (dùng middleware `upload.single` trước controller)
```javascript
import { upload } from "../middlewares/uploadMiddleware.js";
import { uploadAvatar } from "../controllers/userController.js";

router.post("/avatar", upload.single("avatar"), uploadAvatar);
// "avatar" phải khớp với field name khi client gửi form-data
```

---

## B.3 Bài tập Cloudinary

### 🟢 Bài B1 — Upload ảnh đơn giản
**Yêu cầu:**
1. Đăng ký tài khoản miễn phí tại [cloudinary.com](https://cloudinary.com).
2. Điền `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` vào `.env`.
3. Cấu hình Cloudinary trong `server.js`.
4. Tạo route `POST /api/upload/test` với middleware `upload.single("image")`.
5. Controller lấy `req.file.buffer` và upload lên Cloudinary (folder `test_uploads`).
6. Trả về `{ url: result.secure_url, publicId: result.public_id }`.
7. **Test** bằng Postman: Body → form-data → key `image` (type: File) → chọn ảnh.

---

### 🟢 Bài B2 — Giới hạn file upload
**Yêu cầu:**
1. Chỉ nhận các loại file: `image/jpeg`, `image/png`, `image/webp`.
2. Giới hạn kích thước: 2MB.
3. Nếu file sai loại → trả `400` với message "Chỉ chấp nhận ảnh JPEG/PNG/WebP".
4. Nếu vượt kích thước → trả `400` với message "File không được vượt quá 2MB".
5. **Gợi ý:** Dùng `fileFilter` trong multer config + xử lý `MulterError` trong route.

---

### 🟡 Bài B3 — Upload và lưu URL vào DB
**Yêu cầu:**
1. Route `POST /api/users/avatar` (cần auth).
2. Upload ảnh lên Cloudinary với transformation `200x200`, crop `fill`.
3. Lưu `avatarUrl` (secure_url) và `avatarId` (public_id) vào document User trong DB.
4. Trả về `{ avatarUrl }`.
5. **Test:** Upload ảnh, check DB thấy `avatarUrl` đã cập nhật, mở URL ra thấy ảnh.

---

### 🟡 Bài B4 — Xóa ảnh cũ khi upload mới
**Yêu cầu:**
1. Trước khi upload ảnh mới, kiểm tra xem user đã có `avatarId` chưa.
2. Nếu có → gọi `cloudinary.uploader.destroy(avatarId)` để xóa ảnh cũ.
3. Sau đó mới upload ảnh mới.
4. **Test:** Upload lần 1 → vào Cloudinary Dashboard thấy ảnh. Upload lần 2 → ảnh cũ biến mất, ảnh mới xuất hiện.

---

### 🔴 Bài B5 — Upload ảnh trong Chat
**Yêu cầu:**
1. Route `POST /api/messages/image` (cần auth).
2. Nhận file ảnh + `conversationId` từ form-data.
3. Upload ảnh lên Cloudinary (folder `chat_images`).
4. Tạo Message với `imgUrl = result.secure_url`, `content = null`.
5. Cập nhật Conversation (`lastMessage`, `unreadCounts`...).
6. Emit `"new-message"` qua Socket.IO.
7. Trả về `{ message }`.

---

### 🏆 Bài B6 — Tích hợp đầy đủ
**Yêu cầu kết hợp:**
1. Cho phép upload **nhiều ảnh** cùng lúc bằng `upload.array("images", 5)`.
2. Upload tất cả song song bằng `Promise.all(files.map(f => uploadImageFromBuffer(f.buffer)))`.
3. Tạo nhiều Message cùng lúc (1 message per ảnh).
4. Chỉ giữ lại 1 message làm `lastMessage` của conversation (message ảnh cuối).
5. **Gợi ý:** `Promise.all([...]).then(results => results.map(r => r.secure_url))`.

---

## 📋 CHECKLIST TỰ KIỂM TRA

### Socket.IO ✅
- [ ] Server khởi tạo đúng và attach vào `httpServer`
- [ ] Có middleware xác thực JWT (`io.use()`)
- [ ] Có thể join/leave room
- [ ] `io.to(room).emit()` hoạt động đúng
- [ ] Danh sách online users cập nhật khi connect/disconnect
- [ ] Typing indicator hoạt động
- [ ] Private messaging hoạt động

### Cloudinary ✅
- [ ] Config từ `.env` đúng
- [ ] Multer nhận file và lưu vào RAM
- [ ] `upload_stream` upload lên Cloudinary thành công
- [ ] URL Cloudinary trả về có thể mở được
- [ ] Ảnh cũ bị xóa khi upload ảnh mới
- [ ] Giới hạn file type và size hoạt động

---

> 💡 **Tài nguyên học thêm:**
> - Socket.IO docs: [https://socket.io/docs/v4/](https://socket.io/docs/v4/)
> - Cloudinary Node.js SDK: [https://cloudinary.com/documentation/node_integration](https://cloudinary.com/documentation/node_integration)
> - Test Socket.IO client online: [https://amritb.github.io/socketio-client-tool/](https://amritb.github.io/socketio-client-tool/)
