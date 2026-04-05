# 📚 BÀI TẬP - CƯỜNG
## Module: Message · Gửi & Nhận Tin Nhắn Realtime

> **Mục tiêu:** Hiểu cách thiết kế schema tin nhắn, xây dựng API CRUD đầy đủ cho Message, tích hợp Socket.IO để đẩy tin nhắn realtime, và tích hợp Cloudinary để gửi ảnh trong chat — đúng như cách đồ án chính đang làm.

---

## PHẦN 1 — LÝ THUYẾT

### 1.1 Thiết kế Schema cho Message
- **Message** liên kết với hai collection khác: `Conversation` (thuộc cuộc trò chuyện nào) và `User` (ai gửi).
- Dùng `ObjectId` với `ref` để định nghĩa quan hệ, và dùng `.populate()` khi query để lấy dữ liệu liên quan.
- **Index** giúp tăng tốc truy vấn. Vì hay tìm tin nhắn theo `conversationId` và sắp xếp theo `createdAt`, ta đặt index kép: `{ conversationId: 1, createdAt: -1 }`.

### 1.2 Phân trang bằng Cursor (Cursor-based Pagination)
- **Tại sao không dùng `skip()`?** Với 1 triệu tin nhắn, `skip(500000)` phải đọc qua 500,000 records — rất chậm.
- **Cursor-based:** Client gửi `cursor` (timestamp của tin nhắn cũ nhất đã nhận). Server tìm các tin nhắn có `createdAt < cursor`. Chỉ đọc đúng số bản ghi cần thiết.
- Đây là kỹ thuật được dùng bởi Facebook, Instagram, WhatsApp.

### 1.3 Cập nhật Conversation khi gửi Message
- Mỗi khi có tin nhắn mới, cần cập nhật `Conversation`:
  - `lastMessage`: tin nhắn mới nhất (để hiển thị preview).
  - `lastMessageAt`: thời điểm tin nhắn mới nhất (để sắp xếp danh sách chat).
  - `unreadCounts`: tăng số chưa đọc cho tất cả thành viên trừ người gửi.
  - `seenBy`: reset về `[]` vì có tin mới.

### 1.4 Socket.IO — Cơ bản
- **Socket.IO** cho phép server đẩy sự kiện xuống client theo thời gian thực (không cần client hỏi).
- **Room**: Các socket có thể join vào một "phòng" (thường là `conversationId`). Khi server emit vào room đó, tất cả socket trong phòng đều nhận sự kiện.
- `io.to(roomId).emit("event-name", data)` — đẩy event đến tất cả client trong room.
- `socket.join(roomId)` — client join vào room.

### 1.5 Cloudinary — Upload ảnh
- **Cloudinary** là dịch vụ lưu trữ ảnh/video trên cloud.
- Thay vì lưu file trên server (dễ mất khi deploy), ta upload lên Cloudinary và chỉ lưu URL.
- Dùng **multer** để nhận file từ client (lưu vào RAM với `memoryStorage()`), sau đó upload lên Cloudinary bằng stream.

---

## PHẦN 2 — CODE MẪU

### 2.1 Schema Message (`models/Message.js`)
```javascript
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
            index: true,
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: {
            type: String,
            trim: true,
        },
        imgUrl: {
            type: String, // URL ảnh từ Cloudinary (nếu có)
        },
        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null, // null = không phải reply
        },
        isDeleted: {
            type: Boolean,
            default: false, // soft delete — vẫn giữ trong DB, chỉ ẩn nội dung
        },
    },
    { timestamps: true }
);

// Index kép để query nhanh
messageSchema.index({ conversationId: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;
```

### 2.2 Helper cập nhật Conversation sau khi gửi Message
```javascript
// utils/messageHelper.js

// Cập nhật các trường của conversation sau khi có tin nhắn mới
export const updateConversationAfterCreateMessage = (conversation, message, senderId) => {
    conversation.set({
        seenBy: [],                    // reset vì có tin mới
        lastMessageAt: message.createdAt,
        lastMessage: {
            _id: message._id,
            content: message.content,
            senderId,
            createdAt: message.createdAt,
        },
    });

    // Tăng unreadCounts cho tất cả thành viên trừ người gửi
    conversation.participants.forEach((p) => {
        const memberId = p.userId.toString();
        const isSender = memberId === senderId.toString();
        const prevCount = conversation.unreadCounts.get(memberId) || 0;
        conversation.unreadCounts.set(memberId, isSender ? 0 : prevCount + 1);
    });
};

// Emit event "new-message" tới tất cả client trong conversation room
export const emitNewMessage = (io, conversation, message) => {
    io.to(conversation._id.toString()).emit("new-message", {
        message,
        conversation: {
            _id: conversation._id,
            lastMessage: conversation.lastMessage,
            lastMessageAt: conversation.lastMessageAt,
        },
        unreadCounts: conversation.unreadCounts,
    });
};
```

### 2.3 Controller gửi tin nhắn trực tiếp
```javascript
// controllers/messageController.js
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { updateConversationAfterCreateMessage, emitNewMessage } from "../utils/messageHelper.js";
import { io } from "../socket/index.js";

export const sendDirectMessage = async (req, res) => {
    try {
        const { recipientId, content, conversationId } = req.body;
        const senderId = req.user._id;

        if (!content) {
            return res.status(400).json({ message: "Thiếu nội dung" });
        }

        let conversation;

        // Nếu đã có conversationId, tìm lại
        if (conversationId) {
            conversation = await Conversation.findById(conversationId);
        }

        // Nếu chưa có conversation, tạo mới
        if (!conversation) {
            conversation = await Conversation.create({
                type: "direct",
                participants: [
                    { userId: senderId, joinedAt: new Date() },
                    { userId: recipientId, joinedAt: new Date() },
                ],
                lastMessageAt: new Date(),
                unreadCounts: new Map(),
            });
        }

        // Tạo tin nhắn
        const message = await Message.create({
            conversationId: conversation._id,
            senderId,
            content,
        });

        // Cập nhật conversation và lưu
        updateConversationAfterCreateMessage(conversation, message, senderId);
        await conversation.save();

        // Đẩy realtime qua Socket.IO
        emitNewMessage(io, conversation, message);

        return res.status(201).json({ message });
    } catch (error) {
        console.error("Lỗi gửi tin nhắn:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};
```

### 2.4 Lấy tin nhắn với Cursor Pagination
```javascript
export const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { limit = 50, cursor } = req.query;

        const query = { conversationId };

        // Cursor: chỉ lấy tin nhắn cũ hơn cursor
        if (cursor) {
            query.createdAt = { $lt: new Date(cursor) };
        }

        // Lấy thêm 1 để biết có trang tiếp không
        let messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit) + 1);

        let nextCursor = null;

        if (messages.length > Number(limit)) {
            const nextMessage = messages[messages.length - 1];
            nextCursor = nextMessage.createdAt.toISOString();
            messages.pop(); // bỏ phần tử dư
        }

        messages = messages.reverse(); // sắp xếp lại cũ → mới

        return res.status(200).json({ messages, nextCursor });
    } catch (error) {
        console.error("Lỗi lấy messages:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};
```

### 2.5 Upload ảnh lên Cloudinary
```javascript
// middlewares/uploadMiddleware.js
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

export const upload = multer({
    storage: multer.memoryStorage(), // lưu vào RAM, không ghi file
    limits: { fileSize: 1024 * 1024 * 5 }, // 5MB
});

export const uploadImageFromBuffer = (buffer, options = {}) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: "chat_images", resource_type: "image", ...options },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        stream.end(buffer);
    });
};
```

---

## PHẦN 3 — BÀI TẬP NHỎ

> Yêu cầu: Cài đặt `express`, `mongoose`, `socket.io`, `multer`, `cloudinary`, `dotenv`, `jsonwebtoken`.  
> Giả sử đã có model `User` và `Conversation` sẵn (copy từ đồ án chính hoặc tự viết đơn giản).

---

### 🟢 Bài 1 — Tạo Schema Message
**Yêu cầu:**
1. Tạo `models/Message.js` với các trường: `conversationId` (ObjectId ref Conversation), `senderId` (ObjectId ref User), `content` (String), `imgUrl` (String).
2. Thêm `timestamps: true`.
3. Thêm index kép `{ conversationId: 1, createdAt: -1 }`.
4. **Kiểm tra:** Insert vài message thủ công bằng MongoDB Compass, xem index đã tạo chưa.

---

### 🟢 Bài 2 — Thiết lập Socket.IO cơ bản
**Yêu cầu:**
1. Tạo `socket/index.js` — khởi tạo `Server` từ `socket.io`, gắn vào `http.createServer(app)`.
2. Lắng nghe event `connection` → in ra `"Client đã kết nối: <socketId>"`.
3. Lắng nghe event `disconnect` → in ra `"Client đã ngắt kết nối"`.
4. Trong `server.js`, export và dùng `server.listen()` thay vì `app.listen()`.
5. **Kiểm tra:** Dùng [socket.io client test](https://amritb.github.io/socketio-client-tool/) để kết nối và xem log trên terminal.

---

### 🟡 Bài 3 — API Gửi tin nhắn text (`POST /api/messages/direct`)
**Yêu cầu:**
- Route cần auth (dùng `protectedRoute` từ bài của Khanh hoặc tự viết đơn giản).
- Nhận: `{ recipientId, content, conversationId? }`.
- Nếu có `conversationId` → tìm conversation đó.
- Nếu không có → tạo conversation mới type `"direct"`.
- Tạo Message mới và lưu vào DB.
- Cập nhật `lastMessage`, `lastMessageAt`, `unreadCounts` trong conversation.
- Emit event `"new-message"` qua Socket.IO đến room `conversationId`.
- Trả về `{ message }` với status `201`.

---

### 🟡 Bài 4 — API Lấy tin nhắn có Cursor Pagination (`GET /api/messages/:conversationId`)
**Yêu cầu:**
- Nhận query param: `?limit=20&cursor=<ISO date string>`.
- Nếu có cursor → thêm điều kiện `createdAt < cursor`.
- Query DB, sort `createdAt: -1`, limit `limit + 1`.
- Nếu lấy được `limit + 1` kết quả → có trang tiếp → lấy `createdAt` của phần tử thứ `limit` làm `nextCursor`.
- Đảo ngược mảng (`.reverse()`) để trả về thứ tự cũ → mới.
- Trả về `{ messages, nextCursor }`.

**Test:** Gọi lần đầu không có cursor. Gọi lần 2 với cursor từ lần 1. Kiểm tra tin nhắn không bị lặp.

---

### 🟡 Bài 5 — API Xóa tin nhắn (`DELETE /api/messages/:messageId`)
**Yêu cầu:**
- Tìm message theo `messageId`.
- Không tìm thấy → `404`.
- Kiểm tra `message.senderId.toString() === req.user._id.toString()` → chỉ người gửi được xóa. Không phải → `403`.
- Xóa message: `Message.findByIdAndDelete(messageId)`.
- Emit event `"delete-message"` qua Socket.IO vào room `conversationId` với payload `{ messageId }`.
- Trả `204 No Content`.

---

### 🔴 Bài 6 — API Gửi ảnh trong chat (`POST /api/messages/upload-image`)
**Yêu cầu:**
1. Cấu hình Cloudinary trong `.env`: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
2. Dùng middleware `multer.memoryStorage()` để nhận file.
3. Upload buffer lên Cloudinary bằng `upload_stream`.
4. Tạo Message với `imgUrl = result.secure_url` và `content = ""`  (hoặc caption nếu có).
5. Cập nhật conversation và emit realtime.
6. Trả về `{ message }`.

**Test:** Dùng Postman → Body → form-data → thêm key `image` kiểu File.

---

### 🔴 Bài 7 — Socket.IO: Rooms & Join Conversation
**Yêu cầu:**
1. Khi client kết nối socket, server query DB lấy tất cả `conversationId` mà user đó tham gia.
2. Gọi `socket.join(conversationId)` cho từng conversation.
3. Lắng nghe event `"join-conversation"` từ client → `socket.join(conversationId)`.
4. **Kiểm tra:** Khi gửi tin nhắn qua API, client socket trong room đó phải nhận được event `"new-message"` tự động (không cần poll).

---

### 🔴 Bài 8 — Lọc & Tìm kiếm Message (CRUD nâng cao)
**Yêu cầu:**
**Lọc theo keyword:**  
   `GET /api/messages/:conversationId/search?q=xin+chào`  

---

### 🏆 Bài 9 — Thêm tính năng "Đang nhập..." (Typing Indicator)
**Yêu cầu (Socket.IO thuần):**
- Client emit event `"typing"` với `{ conversationId }` khi user gõ phím.
- Server emit `"user-typing"` với `{ userId, displayName, conversationId }` đến tất cả trong room (trừ người gửi).
- Client emit event `"stop-typing"` khi dừng gõ.
- Server emit `"user-stop-typing"` đến room.
- **Lưu ý:** Đã implement trong đồ án chính tại `socket/index.js` — chỉ cần tự viết lại để hiểu.

---

### 🏆 Bài 10 — Reply / Trả lời tin nhắn (`replyTo`)
**Yêu cầu:**
1. Thêm trường `replyTo: ObjectId ref Message` vào schema, mặc định `null`.
2. Khi gửi tin nhắn, client có thể gửi kèm `replyTo: messageId`.
3. Controller lưu `replyTo` vào DB.
4. Khi lấy tin nhắn (getMessages), `.populate("replyTo", "content senderId imgUrl isDeleted")` để trả về nội dung tin nhắn gốc.
5. **Kiểm tra:** Gửi tin A, sau đó reply vào A, xem trong response có `replyTo` chứa nội dung tin A không.

---

### 🏆 Bài 11 — Thu hồi tin nhắn (Soft Delete)
**Yêu cầu:**
1. Thêm trường `isDeleted: Boolean, default: false` vào schema.
2. API `DELETE /api/messages/:messageId`:
   - Chỉ người gửi được thu hồi → `403` nếu không phải.
   - **Không xóa khỏi DB** (soft delete): set `isDeleted = true`, `content = null`, `imgUrl = null`.
   - Emit event `"delete-message"` với `{ messageId, conversationId }` đến room.
3. Khi client nhận event `"delete-message"` → hiển thị `"Tin nhắn đã bị thu hồi"` thay vì nội dung.
4. **Tại sao soft delete?** Để giữ lại lịch sử tham chiếu cho các tin nhắn reply vào tin đã xóa.

---

## 📋 BẢNG TỔNG HỢP API

| Method | Endpoint | Auth? | Mô tả |
|--------|----------|-------|-------|
| POST | `/api/messages/direct` | ✅ | Gửi tin nhắn text (direct, hỗ trợ replyTo) |
| POST | `/api/messages/group` | ✅ | Gửi tin nhắn nhóm (hỗ trợ replyTo) |
| GET | `/api/messages/:conversationId` | ✅ | Lấy tin nhắn (cursor pagination + populate replyTo) |
| DELETE | `/api/messages/:messageId` | ✅ | Thu hồi tin nhắn — soft delete |
| POST | `/api/messages/image` | ✅ | Gửi ảnh (Cloudinary) |
| GET | `/api/messages/:conversationId/search` | ✅ | Tìm kiếm tin nhắn |

### Socket.IO Events

| Event (Client → Server) | Event (Server → Client) | Mô tả |
|--------------------------|--------------------------|-------|
| `join-conversation` | — | Join vào room conversation |
| `typing` | `user-typing` | Thông báo đang gõ |
| `stop-typing` | `user-stop-typing` | Dừng gõ |
| — | `new-message` | Có tin nhắn mới |
| — | `delete-message` | Tin nhắn bị xóa |

---

## 🛠️ Gợi ý Cấu trúc Thư mục

```
bai-tap-cuong/
├── .env
├── package.json
├── src/
│   ├── server.js
│   ├── libs/
│   │   └── db.js
│   ├── models/
│   │   ├── User.js          (copy đơn giản)
│   │   ├── Conversation.js  (copy đơn giản)
│   │   └── Message.js       ← tự viết
│   ├── controllers/
│   │   └── messageController.js
│   ├── middlewares/
│   │   ├── authMiddleware.js  (copy từ Khanh)
│   │   └── uploadMiddleware.js
│   ├── utils/
│   │   └── messageHelper.js
│   ├── socket/
│   │   └── index.js
│   └── routes/
│       └── messageRoute.js
```

---

> 💡 **Lưu ý Cloudinary:** Đăng ký tài khoản miễn phí tại [cloudinary.com](https://cloudinary.com), lấy `Cloud Name`, `API Key`, `API Secret` từ Dashboard và điền vào `.env`.
