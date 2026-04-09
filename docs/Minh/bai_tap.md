# 📚 BÀI TẬP - MINH

## Module: Friend · FriendRequest · Hệ thống Kết bạn

> **Mục tiêu:** Hiểu cách thiết kế schema quan hệ bạn bè (không có thứ tự), xây dựng đầy đủ API gửi/chấp nhận/từ chối/lấy danh sách lời mời kết bạn và danh sách bạn bè với lọc nâng cao — đúng như cách đồ án chính đang làm.

---

## PHẦN 1 — LÝ THUYẾT

### 1.1 Thiết kế Schema quan hệ đối xứng (Symmetric Relationship)

- Quan hệ bạn bè là **đối xứng**: nếu A là bạn của B thì B cũng là bạn của A.
- **Vấn đề:** Nếu lưu `{ userA: A, userB: B }` và `{ userA: B, userB: A }` thì sẽ bị trùng lặp, khó kiểm tra.
- **Giải pháp:** Luôn sắp xếp cặp `(userA, userB)` theo thứ tự `_id` trước khi lưu sao cho `userA < userB`. Dùng Mongoose **pre-save hook** để tự động làm điều này.
- Sau đó đặt **unique index** trên `{ userA, userB }` để DB không cho phép trùng.

### 1.2 Pre-save Hook trong Mongoose

```javascript
schema.pre("save", function (next) {
  // "this" là document đang được save
  if (this.userA.toString() > this.userB.toString()) {
    [this.userA, this.userB] = [this.userB, this.userA];
  }
  next();
});
```

- Hook `pre("save")` chạy **trước** khi document được lưu vào DB.
- `next()` phải được gọi để tiếp tục quá trình save.

### 1.3 Schema FriendRequest

- **FriendRequest** lưu lời mời đang chờ xác nhận. Khi được chấp nhận → tạo `Friend` và xóa `FriendRequest`. Khi từ chối → chỉ xóa `FriendRequest`.
- Cần index `{ from, to }` unique → không thể gửi 2 lời mời cho cùng 1 người.
- Cần index riêng trên `{ from }` và `{ to }` → để query nhanh "tôi đã gửi những lời mời nào" và "tôi nhận được lời mời nào".

### 1.4 Populate — Lấy dữ liệu liên kết

- `.populate("userA", "_id displayName avatarUrl")` thay thế ObjectId bằng document thực tế.
- Có thể populate nhiều trường: `.populate("userA", ...).populate("userB", ...)`.
- Dùng `Promise.all([query1, query2])` để chạy 2 query song song → nhanh hơn.

### 1.5 Logic nghiệp vụ quan trọng

- Không được gửi lời mời cho chính mình.
- Không được gửi lời mời nếu đã là bạn bè.
- Không được gửi lời mời nếu đã có lời mời đang chờ (theo cả 2 chiều: tôi → họ, họ → tôi).
- Chỉ người **nhận** lời mời mới được chấp nhận hoặc từ chối.

---

## PHẦN 2 — CODE MẪU

### 2.1 Schema Friend (`models/Friend.js`)

```javascript
import mongoose from "mongoose";

const friendSchema = new mongoose.Schema(
  {
    userA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// Tự động sắp xếp để userA luôn < userB (lexicographic order)
friendSchema.pre("save", function (next) {
  const a = this.userA.toString();
  const b = this.userB.toString();

  if (a > b) {
    this.userA = new mongoose.Types.ObjectId(b);
    this.userB = new mongoose.Types.ObjectId(a);
  }

  next();
});

// Unique: mỗi cặp bạn bè chỉ tồn tại 1 lần
friendSchema.index({ userA: 1, userB: 1 }, { unique: true });

const Friend = mongoose.model("Friend", friendSchema);
export default Friend;
```

### 2.2 Schema FriendRequest (`models/FriendRequest.js`)

```javascript
import mongoose from "mongoose";

const friendRequestSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      maxlength: 300, // lời nhắn kèm theo (tuỳ chọn)
    },
  },
  { timestamps: true },
);

// Unique: không thể gửi 2 lời mời cho cùng người
friendRequestSchema.index({ from: 1, to: 1 }, { unique: true });

// Index riêng để query nhanh
friendRequestSchema.index({ from: 1 }); // lấy lời mời đã gửi
friendRequestSchema.index({ to: 1 }); // lấy lời mời đã nhận

const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema);
export default FriendRequest;
```

### 2.3 Controller — Gửi lời mời kết bạn

```javascript
export const sendFriendRequest = async (req, res) => {
  try {
    const { to, message } = req.body;
    const from = req.user._id;

    // Không gửi cho chính mình
    if (from.toString() === to) {
      return res
        .status(400)
        .json({ message: "Không thể gửi lời mời cho chính mình" });
    }

    // Kiểm tra người nhận tồn tại
    const userExists = await User.exists({ _id: to });
    if (!userExists) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // Chuẩn hóa thứ tự để kiểm tra Friend
    let userA = from.toString();
    let userB = to.toString();
    if (userA > userB) [userA, userB] = [userB, userA];

    // Kiểm tra song song: đã là bạn? và đã có lời mời chưa?
    const [alreadyFriends, existingRequest] = await Promise.all([
      Friend.findOne({ userA, userB }),
      FriendRequest.findOne({
        $or: [
          { from, to },
          { from: to, to: from }, // cả 2 chiều
        ],
      }),
    ]);

    if (alreadyFriends) {
      return res.status(400).json({ message: "Hai người đã là bạn bè" });
    }

    if (existingRequest) {
      return res
        .status(400)
        .json({ message: "Đã có lời mời kết bạn đang chờ" });
    }

    const request = await FriendRequest.create({ from, to, message });

    return res.status(201).json({ message: "Gửi lời mời thành công", request });
  } catch (error) {
    console.error("Lỗi gửi lời mời kết bạn:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
```

### 2.4 Controller — Chấp nhận lời mời

```javascript
export const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await FriendRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Không tìm thấy lời mời" });
    }

    // Chỉ người nhận mới được chấp nhận
    if (request.to.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền chấp nhận lời mời này" });
    }

    // Tạo quan hệ bạn bè và xóa lời mời
    const friend = await Friend.create({
      userA: request.from,
      userB: request.to,
    });
    await FriendRequest.findByIdAndDelete(requestId);

    const newFriendData = await User.findById(request.from)
      .select("_id displayName avatarUrl")
      .lean();

    return res.status(200).json({
      message: "Chấp nhận thành công",
      newFriend: newFriendData,
    });
  } catch (error) {
    console.error("Lỗi chấp nhận lời mời:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
```

### 2.5 Controller — Lấy danh sách bạn bè

```javascript
export const getAllFriends = async (req, res) => {
  try {
    const userId = req.user._id;

    // Tìm tất cả friendship có chứa userId (dù ở userA hay userB)
    const friendships = await Friend.find({
      $or: [{ userA: userId }, { userB: userId }],
    })
      .populate("userA", "_id displayName avatarUrl username")
      .populate("userB", "_id displayName avatarUrl username")
      .lean();

    // Map ra chỉ thông tin của "người kia" (không phải mình)
    const friends = friendships.map((f) =>
      f.userA._id.toString() === userId.toString() ? f.userB : f.userA,
    );

    return res.status(200).json({ friends });
  } catch (error) {
    console.error("Lỗi lấy danh sách bạn bè:", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
```

---

## PHẦN 3 — BÀI TẬP NHỎ

> Yêu cầu: Cài đặt `express`, `mongoose`, `dotenv`, `jsonwebtoken`.  
> Dùng lại `models/User.js` và `middlewares/authMiddleware.js` (từ bài của Khanh).

---

### 🟢 Bài 1 — Tạo Schema Friend với Pre-save Hook

**Yêu cầu:**

1. Tạo `models/Friend.js` với trường `userA`, `userB` (đều là ObjectId ref User).
2. Viết pre-save hook để đảm bảo `userA < userB` (theo thứ tự string).
3. Thêm unique index `{ userA: 1, userB: 1 }`.
4. **Kiểm tra:** Insert `{ userA: "BBB", userB: "AAA" }` và kiểm tra xem DB có tự đổi thành `{ userA: "AAA", userB: "BBB" }` không. Insert lại cùng cặp → phải lỗi unique.

---

### 🟢 Bài 2 — Tạo Schema FriendRequest

**Yêu cầu:**

1. Tạo `models/FriendRequest.js` với trường `from`, `to` (ObjectId ref User), `message` (String, max 300 ký tự).
2. Thêm unique index `{ from: 1, to: 1 }`.
3. Thêm index riêng trên `{ from: 1 }` và `{ to: 1 }`.
4. **Kiểm tra:** Dùng MongoDB Compass xem 3 index đã được tạo chưa.

---

### 🟡 Bài 3 — API Gửi lời mời kết bạn (`POST /api/friends/request`)

**Yêu cầu:**

- Nhận: `{ to, message? }`.
- Không gửi cho chính mình → `400`.
- Người nhận không tồn tại → `404`.
- Đã là bạn bè → `400`.
- Đã có lời mời (2 chiều) → `400`.
- Tạo FriendRequest → trả `201`.

**Test:** Gửi lời mời thành công → gửi lại → phải lỗi `400`.

---

### 🟡 Bài 4 — API Chấp nhận lời mời (`PATCH /api/friends/request/:requestId/accept`)

**Yêu cầu:**

- Tìm FriendRequest theo `requestId`.
- Không tìm thấy → `404`.
- `request.to !== req.user._id` → `403`.
- Tạo Friend, xóa FriendRequest.
- Trả về `{ newFriend }` với thông tin người bạn mới.

---

### 🟡 Bài 5 — API Từ chối lời mời (`DELETE /api/friends/request/:requestId/decline`)

**Yêu cầu:**

- Tương tự Bài 4 nhưng chỉ xóa FriendRequest, không tạo Friend.
- Chỉ người **nhận** mới được từ chối → `403` nếu không phải.
- Trả `204 No Content`.

---

### 🟡 Bài 6 — API Hủy lời mời đã gửi (`DELETE /api/friends/request/:requestId/cancel`)

**Yêu cầu:**

- Tìm FriendRequest.
- Nicht tìm thấy → `404`.
- Chỉ người **gửi** mới được hủy (`request.from === req.user._id`) → `403` nếu không phải.
- Xóa FriendRequest → `204`.

---

### 🟡 Bài 7 — API Lấy danh sách lời mời (`GET /api/friends/requests`)

**Yêu cầu:**

- Dùng `Promise.all` để query song song:
  - `sent`: lời mời tôi đã gửi (`from = userId`), populate thông tin người nhận.
  - `received`: lời mời tôi nhận được (`to = userId`), populate thông tin người gửi.
- Trả về `{ sent, received }`.

---

### 🔴 Bài 8 — API Lấy danh sách bạn bè (`GET /api/friends`)

**Yêu cầu:**

- Query `Friend` với `$or: [{ userA: userId }, { userB: userId }]`.
- Populate cả `userA` và `userB`.
- Map kết quả: với mỗi friendship, lấy ra thông tin của **người kia** (không phải mình).
- Trả về `{ friends }`.

**Bổ sung — Lọc:**

- `?search=an` → lọc theo `displayName` chứa "an" (case-insensitive, filter trên mảng result sau khi map).

---

### 🔴 Bài 9 — API Xóa bạn bè / Unfriend (`DELETE /api/friends/:friendId`)

**Yêu cầu:**

- Nhận `friendId` (userId của người muốn unfriend).
- Chuẩn hóa thứ tự `userA < userB` giống pre-save hook.
- Tìm và xóa document Friend tương ứng.
- Không tìm thấy → `404`.
- Trả `204 No Content`.

---

### 🔴 Bài 10 — API Kiểm tra trạng thái quan hệ (`GET /api/friends/status/:targetUserId`)

**Yêu cầu:**

- Trả về trạng thái quan hệ giữa `req.user` và `targetUserId`:
  - `"friend"` — nếu đã là bạn bè.
  - `"request_sent"` — nếu mình đã gửi lời mời.
  - `"request_received"` — nếu nhận được lời mời từ họ.
  - `"none"` — không có quan hệ gì.
- **Gợi ý:** Dùng `Promise.all` query cả `Friend` và `FriendRequest` song song.

---

### 🏆 Bài 11 — API Danh sách bạn chung (`GET /api/friends/mutual/:targetUserId`)

**Yêu cầu:**

- Nhận `targetUserId` từ `req.params`.
- Nếu `targetUserId` không tồn tại trong hệ thống → `404`.
- Lấy danh sách bạn của `req.user` và của `targetUserId`.
- Tính giao nhau để lấy **bạn chung**.
- Trả về `200` với `{ mutualFriends }`, mỗi phần tử gồm `_id`, `displayName`, `avatarUrl`, `username`.

**Gợi ý triển khai:**

- Viết hàm helper `getFriendIds(userId)` trả về mảng ObjectId bạn bè từ collection `Friend`.
- Dùng `Promise.all` để lấy song song danh sách bạn của hai người.
- Dùng `Set` để lọc nhanh danh sách giao nhau.
- Query `User.find({ _id: { $in: mutualIds } }).select("_id displayName avatarUrl username")` để trả dữ liệu đầy đủ.

**Test:**

- A và B có bạn chung C, D → API trả đúng 2 người C, D.
- Không có bạn chung → trả mảng rỗng `[]`.
- `targetUserId` không hợp lệ/tồn tại → xử lý lỗi đúng mã trạng thái.

---

## 📋 BẢNG TỔNG HỢP API

| Method | Endpoint                            | Auth? | Mô tả                       |
| ------ | ----------------------------------- | ----- | --------------------------- |
| POST   | `/api/friends/request`              | ✅    | Gửi lời mời kết bạn         |
| PATCH  | `/api/friends/request/:id/accept`   | ✅    | Chấp nhận lời mời           |
| DELETE | `/api/friends/request/:id/decline`  | ✅    | Từ chối lời mời             |
| DELETE | `/api/friends/request/:id/cancel`   | ✅    | Hủy lời mời đã gửi          |
| GET    | `/api/friends/requests`             | ✅    | Lấy danh sách lời mời       |
| GET    | `/api/friends`                      | ✅    | Lấy danh sách bạn bè        |
| DELETE | `/api/friends/:friendId`            | ✅    | Xóa bạn bè (unfriend)       |
| GET    | `/api/friends/status/:targetUserId` | ✅    | Kiểm tra trạng thái quan hệ |
| GET    | `/api/friends/mutual/:targetUserId` | ✅    | Lấy danh sách bạn chung     |

---

## 🛠️ Gợi ý Cấu trúc Thư mục

```
bai-tap-minh/
├── .env
├── package.json
├── src/
│   ├── server.js
│   ├── libs/
│   │   └── db.js
│   ├── models/
│   │   ├── User.js           (copy đơn giản)
│   │   ├── Friend.js         ← tự viết
│   │   └── FriendRequest.js  ← tự viết
│   ├── controllers/
│   │   └── friendController.js
│   ├── middlewares/
│   │   └── authMiddleware.js  (copy từ Khanh)
│   └── routes/
│       └── friendRoute.js
```

---

> 💡 **Lưu ý quan trọng:** Logic chuẩn hóa thứ tự `userA < userB` phải nhất quán ở cả 2 nơi: trong **pre-save hook** (khi tạo Friend) và trong **controller** (khi kiểm tra cặp đã là bạn chưa). Nếu không nhất quán sẽ dẫn đến bug khó phát hiện.
