# 📚 BÀI TẬP - HÙNG
## Module: Conversation · Quản lý Cuộc hội thoại

> **Mục tiêu:** Hiểu cách thiết kế schema cho cuộc hội thoại (direct & group chat), quản lý participants, xây dựng đầy đủ API CRUD cho Conversation (tạo, lấy danh sách, đánh dấu đã đọc, rời nhóm, cập nhật thông tin nhóm), tích hợp Socket.IO để thông báo realtime — đúng như cách đồ án chính đang làm.

---

## PHẦN 1 — LÝ THUYẾT

### 1.1 Thiết kế Schema Conversation đa dạng
- **Direct Chat (1-1):** Hai người. Khi đã có conversation, không tạo mới mà dùng lại (idempotent).
- **Group Chat (nhóm):** Nhiều người. Có thêm metadata: `group.name`, `group.createdBy`.
- **Embedded Documents** (Sub-schema): `participants`, `group`, `lastMessage` được nhúng trực tiếp vào Conversation thay vì lưu ở collection riêng → truy vấn nhanh hơn vì không cần join.
- **Map type** (`type: Map, of: Number`): dùng để lưu `unreadCounts` — Map từ `userId → số tin nhắn chưa đọc`. Rất tiện vì key là động (userId không cố định).

### 1.2 Populate nhiều cấp (Nested Populate)
- Trong Conversation, `participants` là array of `{ userId: ObjectId }`. Để lấy thông tin user, cần:
  ```javascript
  .populate({ path: "participants.userId", select: "displayName avatarUrl" })
  ```
- Sau khi populate, cần **transform** lại shape data để frontend dễ xài:
  ```javascript
  participants.map(p => ({
      _id: p.userId?._id,
      displayName: p.userId?.displayName,
      avatarUrl: p.userId?.avatarUrl ?? null,
      joinedAt: p.joinedAt,
  }))
  ```

### 1.3 Query nâng cao với điều kiện trên nested field
- Tìm conversation có userId trong participants:
  ```javascript
  Conversation.find({ "participants.userId": userId })
  ```
- Tìm direct conversation giữa 2 người:
  ```javascript
  Conversation.findOne({
      type: "direct",
      "participants.userId": { $all: [userId, participantId] }
  })
  ```
- `$all` — mảng phải chứa **tất cả** phần tử được liệt kê.

### 1.4 Cursor-based Pagination cho danh sách Conversation
- Sắp xếp theo `lastMessageAt: -1` (conversation có tin nhắn mới nhất lên đầu).
- Tương tự Message, có thể dùng cursor-based để tải thêm danh sách chat khi scroll.

### 1.5 `$addToSet` và `$set` trong Update
- `$addToSet`: thêm phần tử vào mảng nếu chưa tồn tại (dùng để đánh dấu `seenBy`).
- `$set`: gán giá trị cho trường, hỗ trợ dot notation cho nested field và Map key:
  ```javascript
  { $set: { [`unreadCounts.${userId}`]: 0 } }
  ```

### 1.6 Socket.IO trong Conversation
- Mỗi conversation có một **room** tương ứng với `conversationId`.
- Khi tạo group mới → emit event `"new-group"` đến từng thành viên (dùng userId room).
- Khi đánh dấu đã đọc → emit event `"read-message"` đến room → tất cả cùng cập nhật badge.

---

## PHẦN 2 — CODE MẪU

### 2.1 Schema Conversation (`models/Conversation.js`)
```javascript
import mongoose from "mongoose";

// Sub-schema cho thành viên
const participantSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        joinedAt: { type: Date, default: Date.now },
    },
    { _id: false } // không tạo _id riêng cho sub-document
);

// Sub-schema cho thông tin nhóm
const groupSchema = new mongoose.Schema(
    {
        name: { type: String, trim: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    { _id: false }
);

// Sub-schema cho tin nhắn cuối
const lastMessageSchema = new mongoose.Schema(
    {
        _id: { type: String },
        content: { type: String, default: null },
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: null },
    },
    { _id: false }
);

const conversationSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["direct", "group"],
            required: true,
        },
        participants: {
            type: [participantSchema],
            required: true,
        },
        group: { type: groupSchema },
        lastMessageAt: { type: Date },
        seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        lastMessage: { type: lastMessageSchema, default: null },
        unreadCounts: { type: Map, of: Number, default: {} },
    },
    { timestamps: true }
);

conversationSchema.index({ "participants.userId": 1, lastMessageAt: -1 });

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
```

### 2.2 Controller tạo Conversation
```javascript
export const createConversation = async (req, res) => {
    try {
        const { type, name, memberIds } = req.body;
        const userId = req.user._id;

        if (!type || !memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
            return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
        }

        if (type === "group" && !name) {
            return res.status(400).json({ message: "Nhóm cần có tên" });
        }

        let conversation;

        if (type === "direct") {
            const participantId = memberIds[0];

            // Nếu đã có conversation với người này, trả về luôn
            conversation = await Conversation.findOne({
                type: "direct",
                "participants.userId": { $all: [userId, participantId] },
            });

            if (!conversation) {
                conversation = new Conversation({
                    type: "direct",
                    participants: [{ userId }, { userId: participantId }],
                    lastMessageAt: new Date(),
                });
                await conversation.save();
            }
        }

        if (type === "group") {
            conversation = new Conversation({
                type: "group",
                participants: [{ userId }, ...memberIds.map((id) => ({ userId: id }))],
                group: { name, createdBy: userId },
                lastMessageAt: new Date(),
            });
            await conversation.save();
        }

        // Populate để trả về dữ liệu đầy đủ
        await conversation.populate([
            { path: "participants.userId", select: "displayName avatarUrl" },
            { path: "seenBy", select: "displayName avatarUrl" },
            { path: "lastMessage.senderId", select: "displayName avatarUrl" },
        ]);

        const participants = (conversation.participants || []).map((p) => ({
            _id: p.userId?._id,
            displayName: p.userId?.displayName,
            avatarUrl: p.userId?.avatarUrl ?? null,
            joinedAt: p.joinedAt,
        }));

        const formatted = { ...conversation.toObject(), participants };

        // Thông báo cho thành viên khác về group mới
        if (type === "group") {
            memberIds.forEach((memberId) => {
                io.to(memberId).emit("new-group", formatted);
            });
        }

        return res.status(201).json({ conversation: formatted });
    } catch (error) {
        console.error("Lỗi tạo conversation:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};
```

### 2.3 Controller đánh dấu đã đọc (`markAsSeen`)
```javascript
export const markAsSeen = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user._id.toString();

        const conversation = await Conversation.findById(conversationId).lean();
        if (!conversation) {
            return res.status(404).json({ message: "Conversation không tồn tại" });
        }

        // Người gửi không cần mark as seen
        if (!conversation.lastMessage) {
            return res.status(200).json({ message: "Không có tin nhắn" });
        }
        if (conversation.lastMessage.senderId.toString() === userId) {
            return res.status(200).json({ message: "Người gửi không cần đánh dấu" });
        }

        const updated = await Conversation.findByIdAndUpdate(
            conversationId,
            {
                $addToSet: { seenBy: userId },     // thêm vào danh sách đã đọc
                $set: { [`unreadCounts.${userId}`]: 0 }, // reset về 0
            },
            { new: true }
        );

        // Emit realtime để các thành viên khác thấy ai đã đọc
        io.to(conversationId).emit("read-message", {
            conversationId,
            seenBy: updated?.seenBy,
            unreadCounts: updated?.unreadCounts,
        });

        return res.status(200).json({ message: "Đã đánh dấu đã đọc" });
    } catch (error) {
        console.error("Lỗi markAsSeen:", error);
        return res.status(500).json({ message: "Lỗi hệ thống" });
    }
};
```

---

## PHẦN 3 — BÀI TẬP NHỎ

> Yêu cầu: Cài đặt `express`, `mongoose`, `socket.io`, `dotenv`, `jsonwebtoken`.  
> Dùng lại `models/User.js` và `middlewares/authMiddleware.js` từ bài của Khanh.

---

### 🟢 Bài 1 — Tạo Schema Conversation
**Yêu cầu:**
1. Tạo `models/Conversation.js` với các sub-schema: `participantSchema`, `groupSchema`, `lastMessageSchema`.
2. Schema chính có trường: `type` (enum `["direct","group"]`), `participants`, `group`, `lastMessageAt`, `seenBy`, `lastMessage`, `unreadCounts` (Map).
3. Thêm `timestamps: true` và index `{ "participants.userId": 1, lastMessageAt: -1 }`.
4. **Kiểm tra:** Insert một document conversation vào DB và xem trong MongoDB Compass.

---

### 🟢 Bài 2 — Thiết lập Socket.IO với Rooms
**Yêu cầu:**
1. Khởi tạo Socket.IO (tương tự bài của Cường).
2. Khi user kết nối, join vào room theo `userId` (để nhận sự kiện riêng tư như `"new-group"`).
3. Khi user connect, query DB lấy tất cả conversation của user và `socket.join(conversationId)` cho từng cái.
4. **Kiểm tra:** Log ra danh sách rooms mà socket đã join.

---

### 🟡 Bài 3 — API Tạo Direct Chat (`POST /api/conversations`)
**Yêu cầu:**
- Body: `{ type: "direct", memberIds: ["userId_nguoi_kia"] }`.
- Kiểm tra xem đã có conversation direct với người đó chưa → nếu có thì trả về conversation cũ (không tạo mới).
- Nếu chưa có → tạo mới với `participants: [{ userId: mình }, { userId: người_kia }]`.
- Populate participants và trả về.
- Status `201`.

**Test:** Gọi API 2 lần với cùng `memberIds` → phải chỉ có 1 conversation trong DB.

---

### 🟡 Bài 4 — API Tạo Group Chat (`POST /api/conversations`)
**Yêu cầu:**
- Body: `{ type: "group", name: "Nhóm Study", memberIds: ["id1", "id2", "id3"] }`.
- Không có `name` → `400`.
- Tạo conversation mới với `group: { name, createdBy: userId }`.
- Participants gồm creator + memberIds.
- Emit event `"new-group"` đến từng member (dùng userId room).
- Trả về conversation đã populate.

---

### 🟡 Bài 5 — API Lấy danh sách Conversation (`GET /api/conversations`)
**Yêu cầu:**
- Tìm tất cả conversation có `participants.userId === req.user._id`.
- Sort: `lastMessageAt: -1` (mới nhất lên đầu).
- Populate: `participants.userId` (displayName, avatarUrl), `lastMessage.senderId`, `seenBy`.
- Transform participants thành format phẳng (không nested).
- Trả về `{ conversations }`.

---

### 🟡 Bài 6 — API Lấy tin nhắn của Conversation (`GET /api/conversations/:conversationId/messages`)
**Yêu cầu:**
- Kiểm tra user có trong conversation không (middleware).
- Dùng cursor-based pagination (giống bài của Cường nhưng tích hợp vào conversation route).
- Nhận `?limit=20&cursor=<ISO>`.
- Trả `{ messages, nextCursor }`.

---

### 🔴 Bài 7 — API Đánh dấu đã đọc (`POST /api/conversations/:conversationId/seen`)
**Yêu cầu:**
- Tìm conversation.
- Bỏ qua nếu: không có `lastMessage`, hoặc `senderId === req.user._id`.
- Update: `$addToSet: { seenBy: userId }`, `$set: { "unreadCounts.userId": 0 }`.
- Emit `"read-message"` đến room `conversationId`.
- Trả về `{ seenBy, myUnreadCount }`.

---

### 🔴 Bài 8 — Middleware kiểm tra quyền truy cập Conversation
**Yêu cầu:**
1. Viết middleware `isConversationParticipant` trong `middlewares/friendMiddleware.js`.
2. Lấy `conversationId` từ `req.params`.
3. Tìm conversation trong DB.
4. Kiểm tra xem `req.user._id` có trong `participants.userId` không.
5. Không có → `403`.
6. Gắn `req.conversation` để controller dùng.
7. Apply middleware vào các route cần bảo vệ (gửi tin nhắn, lấy tin nhắn của nhóm).

---

### 🔴 Bài 9 — API Rời nhóm (`PATCH /api/conversations/:conversationId/leave`)
**Yêu cầu:**
- Phải đi qua `isConversationParticipant`.
- Conversation phải là type `"group"` → không cho rời direct chat.
- Dùng `$pull` để xóa user khỏi `participants`: `{ $pull: { participants: { userId: req.user._id } } }`.
- Nếu sau khi rời, `participants.length === 0` → xóa conversation luôn.
- Emit event `"member-left"` đến room `conversationId` với `{ userId, conversationId }`.
- Trả `204 No Content`.

---

### 🔴 Bài 10 — API Cập nhật thông tin nhóm (`PATCH /api/conversations/:conversationId`)
**Yêu cầu:**
- Chỉ type `"group"` mới như cập nhật.
- Chỉ `group.createdBy === req.user._id` mới được cập nhật → `403` nếu không phải.
- Nhận: `{ name }`.
- Dùng `$set: { "group.name": name }`.
- Trả về conversation đã cập nhật.

---

### 🔴 Bài 11 — API Thêm thành viên vào nhóm (`PATCH /api/conversations/:conversationId/members/add`)
**Yêu cầu:**
- Chỉ admin (`group.createdBy`) mới được thêm thành viên.
- Nhận: `{ memberIds: ["id1", "id2"] }`.
- Kiểm tra từng user có tồn tại không.
- Lọc ra những người chưa có trong nhóm — bỏ qua những ai đã có.
- Emit `"member-added"` đến room và `"added-to-group"` đến từng member mới.
- Trả về conversation đã cập nhật.

---

### 🔴 Bài 12 — API Xóa thành viên khỏi nhóm (`DELETE /api/conversations/:conversationId/members/:memberId`)
**Yêu cầu:**
- Chỉ admin mới được xóa thành viên → `403` nếu không phải.
- Admin không thể tự xóa mình (dùng API rời nhóm thay thế).
- Filter participants loại `memberId` ra khỏi mảng.
- Emit `"member-removed"` vào room với `{ memberId, conversationId }`.
- Trả `204 No Content`.

---

### 🏆 Bài 13 — Lọc & Tìm kiếm Conversation nâng cao
**Yêu cầu:**
1. **Lọc theo type:** `GET /api/conversations?type=group` — thêm `{ type }` vào query.
2. **Tìm kiếm theo tên nhóm:** `GET /api/conversations?search=nhom+study` — thêm `{ "group.name": { $regex: q, $options: 'i' } }`.
3. **Phân trang cursor:** Thêm `?cursor=<lastMessageAt ISO>` để lazy load thêm conversation.
4. **Chưa đọc:** `GET /api/conversations?unread=true` — lọc các conversation có `unreadCounts.userId > 0`.

---

## 📋 BẢNG TỔNG HỢP API

| Method | Endpoint | Auth? | Mô tả |
|--------|----------|-------|-------|
| POST | `/api/conversations` | ✅ | Tạo direct/group conversation |
| GET | `/api/conversations` | ✅ | Lấy danh sách conversation |
| GET | `/api/conversations/:id/messages` | ✅ | Lấy tin nhắn (cursor-based) |
| PATCH | `/api/conversations/:id/seen` | ✅ | Đánh dấu đã đọc |
| PATCH | `/api/conversations/:id` | ✅ | Cập nhật tên nhóm |
| PATCH | `/api/conversations/:id/leave` | ✅ | Rời nhóm (chuyển quyền nếu là admin) |
| PATCH | `/api/conversations/:id/members/add` | ✅ | Thêm thành viên (chỉ admin) |
| DELETE | `/api/conversations/:id/members/:memberId` | ✅ | Xóa thành viên (chỉ admin) |

### Socket.IO Events

| Event (Server → Client) | Mô tả |
|--------------------------|-------|
| `new-group` | Được tạo vào nhóm mới |
| `read-message` | Ai đó đã đọc tin nhắn |
| `member-left` | Thành viên rời nhóm |
| `member-added` | Thành viên mới được thêm vào |
| `added-to-group` | Bạn được thêm vào nhóm mới |
| `member-removed` | Thành viên bị xóa khỏi nhóm |
| `group-updated` | Tên nhóm đã thay đổi |

---

## 🛠️ Gợi ý Cấu trúc Thư mục

```
bai-tap-hung/
├── .env
├── package.json
├── src/
│   ├── server.js
│   ├── libs/
│   │   └── db.js
│   ├── models/
│   │   ├── User.js           (copy đơn giản)
│   │   ├── Message.js        (copy từ Cường)
│   │   └── Conversation.js   ← tự viết
│   ├── controllers/
│   │   └── conversationController.js
│   ├── middlewares/
│   │   ├── authMiddleware.js           (copy từ Khanh)
│   │   └── conversationMiddleware.js   ← tự viết
│   ├── socket/
│   │   └── index.js          (copy + extend từ Cường)
│   └── routes/
│       └── conversationRoute.js
```

---

> 💡 **Lưu ý Map trong Mongoose:** Khi trả `unreadCounts` về client từ `.toObject()`, Map sẽ tự convert thành plain object. Nhưng khi update bằng `$set: { [\`unreadCounts.${userId}\`]: 0 }`, cần dùng template literal với key động — đây là syntax đặc biệt của MongoDB update operators với Map field.
