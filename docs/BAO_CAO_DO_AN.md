# BÁO CÁO ĐỒ ÁN MÔN HỌC
## Ứng dụng Chat Thời gian Thực — CCNLTHD

---

| Thông tin | Chi tiết |
|-----------|----------|
| **Tên đồ án** | CCNLTHD — Ứng dụng nhắn tin thời gian thực |
| **Môn học** | Công nghệ Phần mềm / Lập trình Web Nâng cao |
| **Nhóm thực hiện** | Khánh · Cường · Minh · Hùng |
| **Công nghệ chính** | Node.js · Express · MongoDB · React · Socket.IO · Cloudinary |
| **Thời gian thực hiện** | 2025 – 2026 |

---

## MỤC LỤC

1. [Tổng quan đồ án](#1-tổng-quan-đồ-án)
2. [Công nghệ sử dụng](#2-công-nghệ-sử-dụng)
3. [Kiến trúc hệ thống](#3-kiến-trúc-hệ-thống)
4. [Cơ sở dữ liệu — MongoDB](#4-cơ-sở-dữ-liệu--mongodb)
5. [Backend — Node.js + Express](#5-backend--nodejs--express)
6. [Frontend — React + TypeScript](#6-frontend--react--typescript)
7. [Socket.IO — Realtime Communication](#7-socketio--realtime-communication)
8. [Cloudinary — Lưu trữ ảnh](#8-cloudinary--lưu-trữ-ảnh)
9. [Bảo mật & Xác thực](#9-bảo-mật--xác-thực)
10. [Danh sách API đầy đủ](#10-danh-sách-api-đầy-đủ)
11. [Phân chia công việc](#11-phân-chia-công-việc)
12. [Kết quả và hướng phát triển](#12-kết-quả-và-hướng-phát-triển)

---

## 1. TỔNG QUAN ĐỒ ÁN

### 1.1 Giới thiệu

**CCNLTHD** là ứng dụng nhắn tin thời gian thực cho phép người dùng:

- Đăng ký, đăng nhập, quản lý tài khoản cá nhân
- Kết bạn, gửi/chấp nhận/từ chối lời mời kết bạn
- Nhắn tin trực tiếp (1-1) và nhóm
- Gửi ảnh trong chat qua Cloudinary
- Trả lời (reply/quote) tin nhắn
- Thu hồi tin nhắn đã gửi
- Quản lý nhóm: thêm/xóa thành viên, đổi tên, rời nhóm
- Hiển thị trạng thái online/offline theo thời gian thực
- Hiển thị thông báo "đang nhập..." (typing indicator)
- Đánh dấu đã đọc tin nhắn (read receipt)

### 1.2 Mục tiêu

- Xây dựng hệ thống backend RESTful API với Express.js
- Sử dụng MongoDB Atlas làm cơ sở dữ liệu đám mây
- Implement realtime bằng Socket.IO (WebSocket)
- Xây dựng frontend SPA với React + TypeScript + Vite
- Quản lý trạng thái ứng dụng với Zustand
- Bảo mật bằng JWT Access Token + Refresh Token

---

## 2. CÔNG NGHỆ SỬ DỤNG

### 2.1 Backend

| Thư viện | Phiên bản | Mục đích |
|----------|-----------|---------|
| `express` | ^5.2.1 | Web framework |
| `mongoose` | ^8.23.0 | MongoDB ODM |
| `socket.io` | ^4.8.3 | Realtime WebSocket |
| `jsonwebtoken` | ^9.0.3 | JWT access token |
| `bcrypt` | ^6.0.0 | Mã hóa mật khẩu |
| `cloudinary` | ^2.9.0 | Lưu trữ ảnh trên cloud |
| `multer` | ^2.1.1 | Upload file |
| `cookie-parser` | ^1.4.7 | Đọc HTTP-only cookie |
| `cors` | ^2.8.6 | Cross-Origin Resource Sharing |
| `dotenv` | ^17.3.1 | Biến môi trường |
| `swagger-ui-express` | ^5.0.1 | Tài liệu API tương tác |
| `nodemon` | ^3.1.14 | Auto-reload trong dev |

### 2.2 Frontend

| Thư viện | Mục đích |
|----------|---------|
| `react` + `react-dom` | UI framework |
| `typescript` | Type safety |
| `vite` | Build tool, dev server |
| `react-router` | Client-side routing |
| `zustand` | State management |
| `axios` | HTTP client |
| `socket.io-client` | Kết nối WebSocket |
| `tailwindcss` | Utility CSS framework |
| `shadcn/ui` | UI component library |
| `sonner` | Toast notifications |
| `lucide-react` | Icon library |

### 2.3 Dịch vụ đám mây

| Dịch vụ | Mục đích |
|--------|---------|
| **MongoDB Atlas** | Lưu trữ dữ liệu trên cloud |
| **Cloudinary** | Lưu trữ và xử lý ảnh/video |

---

## 3. KIẾN TRÚC HỆ THỐNG

### 3.1 Tổng quan kiến trúc

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                      │
│   React + TypeScript + Vite  (port 5173)                │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│   │ AuthStore│ │ChatStore │ │FriendStr │ │SocketStr │  │
│   └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │
│        │             │             │             │        │
│   ┌────▼─────────────▼─────────────▼─────────────▼────┐ │
│   │         Axios (HTTP) + Socket.IO Client            │ │
│   └────────────────────┬────────────────────┬──────────┘ │
└───────────────────────-│────────────────────│────────────┘
                         │ HTTP REST           │ WebSocket
                  ┌──────▼──────────────────────▼──────┐
                  │        EXPRESS SERVER (port 5001)   │
                  │  ┌──────────┐  ┌──────────────────┐ │
                  │  │  Routes  │  │   Socket.IO      │ │
                  │  └────┬─────┘  └────────┬─────────┘ │
                  │  ┌────▼─────────────────▼─────────┐ │
                  │  │         Controllers             │ │
                  │  └────────────────┬───────────────┘ │
                  │  ┌───────────────-▼───────────────┐ │
                  │  │    Mongoose Models              │ │
                  │  └────────────────┬───────────────┘ │
                  └───────────────────│────────────────-┘
                                      │
                  ┌───────────────────▼─────────────────┐
                  │       MongoDB Atlas (Cloud DB)        │
                  │  users · sessions · conversations     │
                  │  messages · friends · friendrequests  │
                  └─────────────────────────────────────-┘
```

### 3.2 Cấu trúc thư mục

```
CCNLTHD/
├── backend/
│   ├── .env                          # Biến môi trường
│   ├── package.json
│   └── src/
│       ├── server.js                 # Entry point
│       ├── libs/
│       │   └── db.js                 # Kết nối MongoDB
│       ├── models/
│       │   ├── User.js
│       │   ├── Session.js
│       │   ├── Conversation.js
│       │   ├── Message.js
│       │   ├── Friend.js
│       │   └── FriendRequest.js
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── userController.js
│       │   ├── conversationController.js
│       │   ├── messageController.js
│       │   └── friendController.js
│       ├── middlewares/
│       │   ├── authMiddleware.js     # JWT verification
│       │   ├── friendMiddleware.js   # Friendship/membership check
│       │   ├── socketMiddleware.js   # Socket.IO auth
│       │   └── uploadMiddleware.js   # Multer + Cloudinary
│       ├── routes/
│       │   ├── authRoute.js
│       │   ├── userRoute.js
│       │   ├── conversationRoute.js
│       │   ├── messageRoute.js
│       │   └── friendRoute.js
│       ├── socket/
│       │   └── index.js             # Socket.IO server
│       ├── utils/
│       │   └── messageHelper.js     # Helpers cho tin nhắn
│       └── swagger.json             # API documentation
│
├── frontend/
│   ├── .env.development             # Biến môi trường dev
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── src/
│       ├── App.tsx                  # Root component + routing
│       ├── main.tsx
│       ├── index.css                # Global styles
│       ├── pages/
│       │   ├── SignInPage.tsx
│       │   ├── SignUpPage.tsx
│       │   └── ChatAppPage.tsx
│       ├── components/
│       │   ├── auth/                # Signin/Signup forms, ProtectedRoute
│       │   ├── chat/                # MessageItem, MessageInput, ChatWindow...
│       │   ├── sidebar/             # App sidebar, navigation
│       │   ├── profile/             # Profile dialog, avatar uploader
│       │   ├── AddFriendModal/      # Tìm kiếm + gửi lời mời
│       │   ├── friendRequest/       # Danh sách lời mời
│       │   ├── createNewChat/       # Tạo chat mới
│       │   └── newGroupChat/        # Tạo nhóm chat
│       ├── stores/                  # Zustand stores
│       │   ├── useAuthStore.ts
│       │   ├── useChatStore.ts
│       │   ├── useFriendStore.ts
│       │   ├── useSocketStore.ts
│       │   ├── useThemeStore.ts
│       │   └── useUserStore.ts
│       ├── services/                # API calls
│       │   ├── authService.ts
│       │   ├── chatService.ts
│       │   ├── friendService.ts
│       │   └── userService.ts
│       ├── types/                   # TypeScript interfaces
│       │   ├── chat.ts
│       │   ├── store.ts
│       │   └── user.ts
│       ├── lib/
│       │   ├── axios.ts             # Axios instance + interceptor
│       │   └── utils.ts
│       └── hooks/
│           └── use-mobile.ts
│
└── docs/
    ├── Khanh/                       # Bài tập Khánh
    ├── Cuong/                       # Bài tập Cường
    ├── Minh/                        # Bài tập Minh
    └── Hung/                        # Bài tập Hùng
```

---

## 4. CƠ SỞ DỮ LIỆU — MONGODB

### 4.1 Collection: `users`

Lưu thông tin tài khoản người dùng.

| Trường | Kiểu | Ràng buộc | Mô tả |
|--------|------|-----------|-------|
| `_id` | ObjectId | PK | ID tự động |
| `username` | String | unique, lowercase | Tên đăng nhập |
| `hashedPassword` | String | required | Mật khẩu đã mã hóa bcrypt |
| `email` | String | unique, lowercase | Email |
| `displayName` | String | required | Tên hiển thị |
| `avatarUrl` | String | — | URL ảnh từ Cloudinary |
| `avatarId` | String | — | Public ID Cloudinary (để xóa) |
| `bio` | String | max 500 | Tiểu sử |
| `phone` | String | sparse | Số điện thoại |
| `createdAt` | Date | auto | Ngày tạo |
| `updatedAt` | Date | auto | Ngày cập nhật |

### 4.2 Collection: `sessions`

Lưu Refresh Token để duy trì đăng nhập.

| Trường | Kiểu | Ràng buộc | Mô tả |
|--------|------|-----------|-------|
| `_id` | ObjectId | PK | ID tự động |
| `userId` | ObjectId | ref: User | Người dùng sở hữu |
| `refreshToken` | String | unique | Token ngẫu nhiên (64 bytes hex) |
| `expiresAt` | Date | TTL index | Thời điểm hết hạn (14 ngày) |

> **TTL Index:** MongoDB tự động xóa session sau khi `expiresAt < now`.

### 4.3 Collection: `conversations`

Lưu cuộc hội thoại (direct 1-1 hoặc group).

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `type` | String (enum) | `"direct"` hoặc `"group"` |
| `participants` | Array | `[{ userId, joinedAt }]` — danh sách thành viên |
| `group` | Object | `{ name, createdBy }` — chỉ có nếu type = group |
| `lastMessage` | Object | `{ _id, content, senderId, createdAt }` |
| `lastMessageAt` | Date | Thời điểm tin nhắn cuối |
| `seenBy` | [ObjectId] | Danh sách user đã đọc |
| `unreadCounts` | Map | `{ userId: number }` — số tin chưa đọc |

### 4.4 Collection: `messages`

Lưu nội dung từng tin nhắn.

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `conversationId` | ObjectId | Thuộc conversation nào |
| `senderId` | ObjectId | Người gửi |
| `content` | String | Nội dung text (null nếu bị xóa/ảnh) |
| `imgUrl` | String | URL ảnh Cloudinary |
| `replyTo` | ObjectId | Tin nhắn đang trả lời (null = không reply) |
| `isDeleted` | Boolean | Soft delete — giữ trong DB, ẩn nội dung |

> **Index:** `{ conversationId: 1, createdAt: -1 }` — tối ưu truy vấn lịch sử chat.

### 4.5 Collection: `friends`

Lưu quan hệ bạn bè (đối xứng).

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `userA` | ObjectId | Luôn là ID nhỏ hơn (pre-save hook sắp xếp tự động) |
| `userB` | ObjectId | Luôn là ID lớn hơn |

> **Unique Index:** `{ userA, userB }` — mỗi cặp bạn bè chỉ tồn tại 1 bản ghi.

### 4.6 Collection: `friendrequests`

Lưu lời mời kết bạn đang chờ.

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `from` | ObjectId | Người gửi lời mời |
| `to` | ObjectId | Người nhận lời mời |
| `message` | String | Lời nhắn kèm theo (tùy chọn, max 300 ký tự) |

---

## 5. BACKEND — NODE.JS + EXPRESS

### 5.1 Entry Point (`server.js`)

Server được khởi tạo với các thành phần:
- **Express** xử lý HTTP request
- **Socket.IO** gắn vào HTTP server để xử lý WebSocket
- **Cloudinary** được cấu hình qua biến môi trường
- **Swagger UI** tại `/api-docs` cho tài liệu API
- **CORS** cho phép frontend (`CLIENT_URL`) kết nối với credentials

```javascript
// Luồng khởi động:
connectDB() → server.listen(PORT)
```

### 5.2 Hệ thống Middleware

| Middleware | File | Chức năng |
|-----------|------|----------|
| `protectedRoute` | `authMiddleware.js` | Xác minh JWT, gắn `req.user` |
| `socketAuthMiddleware` | `socketMiddleware.js` | Xác minh JWT cho Socket.IO |
| `checkFriendship` | `friendMiddleware.js` | Kiểm tra 2 user có là bạn bè không |
| `checkGroupMembership` | `friendMiddleware.js` | Kiểm tra user có trong nhóm không |
| `upload.single()` | `uploadMiddleware.js` | Nhận file qua Multer (memoryStorage) |

### 5.3 Module Auth (`authController.js`)

| Hàm | Chức năng |
|-----|----------|
| `signUp` | Đăng ký: validate → kiểm tra trùng username → hash password → tạo User |
| `signIn` | Đăng nhập: so sánh password → tạo JWT access token → tạo refresh token ngẫu nhiên → lưu Session → gửi cookie |
| `signOut` | Đăng xuất: xóa Session trong DB → xóa cookie |
| `refreshToken` | Làm mới token: tra cứu refresh token trong DB → kiểm tra hết hạn → cấp access token mới |

**Cơ chế bảo mật JWT:**
- **Access Token:** Ký bằng `ACCESS_TOKEN_SECRET`, TTL 30 phút, gửi trong Authorization header
- **Refresh Token:** Chuỗi random 64 bytes hex, TTL 14 ngày, lưu trong HTTP-only cookie và MongoDB

### 5.4 Module User (`userController.js`)

| Hàm | Chức năng |
|-----|----------|
| `authMe` | Lấy thông tin user từ `req.user` (đã được middleware populate) |
| `searchUserByUsername` | Tìm kiếm user theo regex, trả về tối đa 10 kết quả |
| `uploadAvatar` | Upload ảnh → Cloudinary → cập nhật `avatarUrl` và `avatarId` trong DB |

### 5.5 Module Friend (`friendController.js`)

| Hàm | Chức năng |
|-----|----------|
| `sendFriendRequest` | Gửi lời mời: kiểm tra không gửi cho mình, không trùng lặp, chưa là bạn |
| `acceptFriendRequest` | Chấp nhận: chỉ người nhận được accept → tạo Friend, xóa FriendRequest |
| `declineFriendRequest` | Từ chối: chỉ người nhận được decline → xóa FriendRequest |
| `getAllFriends` | Lấy danh sách bạn bè, populate thông tin user |
| `getFriendRequests` | Lấy lời mời đã gửi và đã nhận song song bằng `Promise.all` |

### 5.6 Module Message (`messageController.js`)

| Hàm | Chức năng |
|-----|----------|
| `sendDirectMessage` | Gửi tin nhắn 1-1 (hỗ trợ replyTo), tạo conversation mới nếu chưa có |
| `sendGroupMessage` | Gửi tin nhắn nhóm (hỗ trợ replyTo) |
| `sendImageMessage` | Upload ảnh lên Cloudinary → tạo message với `imgUrl` |
| `deleteMessage` | Soft delete: set `isDeleted=true`, xóa nội dung, emit Socket event |

### 5.7 Module Conversation (`conversationController.js`)

| Hàm | Chức năng |
|-----|----------|
| `createConversation` | Tạo direct (idempotent) hoặc group conversation |
| `getConversations` | Lấy danh sách conversation của user, sắp xếp theo `lastMessageAt` |
| `getMessages` | Lấy tin nhắn với **cursor-based pagination**, populate `replyTo` |
| `markAsSeen` | Đánh dấu đã đọc: `$addToSet seenBy`, reset `unreadCounts` |
| `leaveGroup` | Rời nhóm, tự động chuyển quyền admin cho thành viên kế tiếp |
| `updateGroup` | Đổi tên nhóm (chỉ admin) |
| `addGroupMembers` | Thêm thành viên vào nhóm (chỉ admin) |
| `removeGroupMember` | Xóa thành viên khỏi nhóm (chỉ admin) |

---

## 6. FRONTEND — REACT + TYPESCRIPT

### 6.1 Routing

```
/signin    → SignInPage     (public)
/signup    → SignUpPage     (public)
/          → ChatAppPage    (protected — cần đăng nhập)
```

`ProtectedRoute` kiểm tra `accessToken` trong Zustand store. Nếu không có → redirect sang `/signin`.

### 6.2 Quản lý trạng thái — Zustand

| Store | Trạng thái quản lý |
|-------|-------------------|
| `useAuthStore` | user, accessToken, loading; actions: signIn, signOut, signUp, fetchMe, refresh |
| `useChatStore` | conversations, messages (theo conversationId), activeConversationId; cursor pagination |
| `useFriendStore` | danh sách bạn bè, lời mời kết bạn |
| `useSocketStore` | socket instance, onlineUsers; xử lý tất cả socket events |
| `useThemeStore` | isDark (dark mode) |
| `useUserStore` | kết quả tìm kiếm user |

**Persist middleware:** `useAuthStore` persist `user` vào localStorage. `useChatStore` persist `conversations`.

### 6.3 Axios Interceptor (`lib/axios.ts`)

- Tự động gắn `Authorization: Bearer <accessToken>` vào mọi request
- Khi gặp lỗi `401 Unauthorized` → gọi `refresh()` để lấy access token mới → retry request gốc
- Nếu refresh thất bại → clear state, redirect `/signin`

### 6.4 Socket.IO Client (`useSocketStore.ts`)

Kết nối Socket.IO khi `accessToken` thay đổi (trong `App.tsx`):

```typescript
// Events lắng nghe:
"online-users"  → cập nhật danh sách user online
"new-message"   → thêm tin nhắn + cập nhật conversation preview
"read-message"  → cập nhật seenBy và unreadCounts
"new-group"     → thêm group mới + join socket room
```

### 6.5 Các component chính

| Component | Chức năng |
|-----------|----------|
| `signin-form.tsx` | Form đăng nhập với validation |
| `signup-form.tsx` | Form đăng ký với validation |
| `app-sidebar.tsx` | Sidebar chính: navigation, user info |
| `ChatWindowLayout.tsx` | Layout cửa sổ chat |
| `ChatWindowHeader.tsx` | Header: tên, avatar, trạng thái online |
| `ChatWindowBody.tsx` | Danh sách tin nhắn (infinite scroll) |
| `MessageItem.tsx` | Hiển thị 1 tin nhắn: bubble, avatar, timestamp, seen badge |
| `MessageInput.tsx` | Input gửi tin nhắn + emoji picker + ảnh |
| `DirectMessageCard.tsx` | Card conversation 1-1 trong sidebar |
| `GroupChatCard.tsx` | Card conversation nhóm trong sidebar |
| `NewGroupChatModal.tsx` | Modal tạo nhóm |
| `AddFriendModal.tsx` | Tìm kiếm và gửi lời mời kết bạn |
| `FriendRequestDialog.tsx` | Xem và xử lý lời mời kết bạn |
| `ProfileDialog.tsx` | Xem và chỉnh sửa thông tin cá nhân |
| `AvatarUploader.tsx` | Upload ảnh đại diện |

### 6.6 Tính năng Cursor-based Pagination

```typescript
// Mỗi lần fetchMessages:
cursor = "" (lần đầu) → lấy 50 tin mới nhất
cursor = nextCursor   → lấy 50 tin cũ hơn
nextCursor = null     → đã lấy hết, dừng

// Merge: [...newMessages, ...existingMessages]
```

---

## 7. SOCKET.IO — REALTIME COMMUNICATION

### 7.1 Kiến trúc Socket

```
Client connect → io.use() middleware → xác minh JWT → socket.user = user
↓
io.on("connection") →
  - onlineUsers.set(userId, socketId)
  - io.emit("online-users", [...])
  - socket.join(userId)          // room cá nhân
  - socket.join(conversationId)  // join tất cả conversation room
```

### 7.2 Bảng Socket Events

| Event (C → S) | Event (S → C) | Mô tả |
|---------------|---------------|-------|
| `join-conversation` | — | Client join vào room conversation |
| `typing` | `user-typing` | Thông báo đang nhập cho room |
| `stop-typing` | `user-stop-typing` | Dừng nhập |
| — | `online-users` | Danh sách user đang online |
| — | `new-message` | Tin nhắn mới trong conversation |
| — | `delete-message` | Tin nhắn bị thu hồi |
| — | `read-message` | Ai đó đã đọc tin nhắn |
| — | `new-group` | Được thêm vào nhóm mới |
| — | `member-left` | Thành viên rời nhóm |
| — | `member-added` | Thành viên mới được thêm |
| — | `added-to-group` | Bản thân được thêm vào nhóm |
| — | `member-removed` | Thành viên bị xóa |
| — | `group-updated` | Thông tin nhóm thay đổi |

### 7.3 Online Tracking

```javascript
const onlineUsers = new Map(); // { userId: socketId }
// connect → set | disconnect → delete | mỗi thay đổi → broadcast tất cả
```

---

## 8. CLOUDINARY — LƯU TRỮ ẢNH

### 8.1 Luồng upload ảnh

```
Client gửi request multipart/form-data
    ↓
Multer nhận file, lưu vào RAM (memoryStorage)
    ↓
uploadImageFromBuffer(file.buffer) → upload_stream → Cloudinary
    ↓
Cloudinary trả về { secure_url, public_id }
    ↓
Lưu secure_url vào DB, public_id dùng để xóa sau này
```

### 8.2 Cấu hình Upload

| Loại | Folder | Transformation |
|------|--------|---------------|
| Avatar | `CCNLTHD/avatars` | 200×200, crop fill |
| Ảnh chat | `CCNLTHD/messages` | width 800, quality auto, crop limit |

---

## 9. BẢO MẬT & XÁC THỰC

### 9.1 JWT + Refresh Token Flow

```
1. POST /api/auth/signin
   → Server tạo accessToken (JWT, 30 phút)
   → Server tạo refreshToken (random, 14 ngày)
   → Lưu refreshToken vào MongoDB (Session collection)
   → Gửi refreshToken trong HTTP-only cookie
   → Trả accessToken trong response body

2. Mọi request sau đó:
   → Client gửi: Authorization: Bearer <accessToken>
   → Server verify JWT → lấy userId → query User

3. Khi accessToken hết hạn (401):
   → Client dùng Axios interceptor
   → Gọi POST /api/auth/refresh (cookie tự động đính kèm)
   → Server tra cứu refreshToken trong DB
   → Nếu hợp lệ → cấp accessToken mới
   → Client retry request gốc

4. POST /api/auth/signout:
   → Xóa Session trong DB
   → Xóa HTTP-only cookie
```

### 9.2 Middleware bảo vệ

- Tất cả route `/api/users/*`, `/api/friends/*`, `/api/messages/*`, `/api/conversations/*` đều qua `protectedRoute`
- Chỉ `/api/auth/*` là public
- Socket.IO cũng xác minh JWT qua `io.use()` middleware
- Middleware `checkFriendship`: chỉ bạn bè mới được nhắn tin 1-1
- Middleware `checkGroupMembership`: chỉ thành viên mới được gửi tin trong nhóm

---

## 10. DANH SÁCH API ĐẦY ĐỦ

**Base URL:** `http://localhost:5001/api`  
**Tài liệu Swagger:** `http://localhost:5001/api-docs`

### 10.1 Auth API

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/auth/signup` | ❌ | Đăng ký tài khoản |
| POST | `/auth/signin` | ❌ | Đăng nhập, nhận JWT |
| POST | `/auth/signout` | ❌ | Đăng xuất, xóa session |
| POST | `/auth/refresh` | ❌ (cookie) | Làm mới access token |

### 10.2 User API

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/users/me` | ✅ | Lấy thông tin bản thân |
| GET | `/users/search?username=` | ✅ | Tìm kiếm user (regex, max 10) |
| POST | `/users/uploadAvatar` | ✅ | Upload ảnh đại diện |

### 10.3 Friend API

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/friends/request` | ✅ | Gửi lời mời kết bạn |
| PATCH | `/friends/request/:id/accept` | ✅ | Chấp nhận lời mời |
| DELETE | `/friends/request/:id/decline` | ✅ | Từ chối lời mời |
| GET | `/friends` | ✅ | Lấy danh sách bạn bè |
| GET | `/friends/requests` | ✅ | Lấy lời mời đã gửi/nhận |

### 10.4 Conversation API

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/conversations` | ✅ | Tạo direct hoặc group conversation |
| GET | `/conversations` | ✅ | Lấy danh sách conversation |
| GET | `/conversations/:id/messages` | ✅ | Lấy tin nhắn (cursor pagination) |
| PATCH | `/conversations/:id/seen` | ✅ | Đánh dấu đã đọc |
| PATCH | `/conversations/:id/leave` | ✅ | Rời nhóm |
| PATCH | `/conversations/:id` | ✅ | Đổi tên nhóm (chỉ admin) |
| PATCH | `/conversations/:id/members/add` | ✅ | Thêm thành viên (chỉ admin) |
| DELETE | `/conversations/:id/members/:memberId` | ✅ | Xóa thành viên (chỉ admin) |

### 10.5 Message API

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/messages/direct` | ✅ | Gửi tin nhắn 1-1 (hỗ trợ replyTo) |
| POST | `/messages/group` | ✅ | Gửi tin nhắn nhóm (hỗ trợ replyTo) |
| POST | `/messages/image` | ✅ | Gửi ảnh (upload Cloudinary) |
| DELETE | `/messages/:messageId` | ✅ | Thu hồi tin nhắn (soft delete) |

---

## 11. PHÂN CHIA CÔNG VIỆC

### Khánh — Module Auth & User
- Thiết kế và implement schema `User`, `Session`
- API đăng ký (`signUp`), đăng nhập (`signIn`), đăng xuất (`signOut`)
- Cơ chế Refresh Token với HTTP-only cookie
- Middleware `protectedRoute` bảo vệ route bằng JWT
- API tìm kiếm user với regex
- API upload ảnh đại diện tích hợp Cloudinary

### Cường — Module Message & Realtime
- Thiết kế và implement schema `Message` (có `replyTo`, `isDeleted`)
- API gửi tin nhắn 1-1 và nhóm
- API gửi ảnh trong chat (Cloudinary)
- API thu hồi tin nhắn (soft delete)
- Cursor-based pagination cho lịch sử chat
- Phát triển Socket.IO server cơ bản
- Xử lý helper `updateConversationAfterCreateMessage` và `emitNewMessage`

### Minh — Module Friend & FriendRequest
- Thiết kế schema `Friend` (pre-save hook đảm bảo thứ tự đối xứng)
- Thiết kế schema `FriendRequest` với index compound
- API gửi, chấp nhận, từ chối lời mời kết bạn
- API lấy danh sách bạn bè và lời mời
- Middleware `checkFriendship` đảm bảo chỉ bạn bè mới chat được

### Hùng — Module Conversation & Group
- Thiết kế schema `Conversation` với sub-schema (participant, group, lastMessage)
- API tạo direct/group conversation (idempotent cho direct)
- API lấy danh sách conversation có sort và populate
- API đánh dấu đã đọc với `$addToSet` và `$set` Map key động
- API quản lý nhóm: rời nhóm (chuyển quyền admin tự động), đổi tên, thêm/xóa thành viên
- Socket events cho group management

### Tất cả thành viên — Socket.IO & Cloudinary
- Typing indicator events (`typing`, `stop-typing`)
- Online users tracking
- Cloudinary integration (cấu hình, upload, xóa ảnh cũ)

---

## 12. KẾT QUẢ VÀ HƯỚNG PHÁT TRIỂN

### 12.1 Tính năng đã hoàn thành

| Tính năng | Backend | Frontend |
|-----------|---------|----------|
| Đăng ký / Đăng nhập | ✅ | ✅ |
| JWT + Refresh Token | ✅ | ✅ (auto-refresh interceptor) |
| Upload ảnh đại diện | ✅ | ✅ |
| Kết bạn (gửi/chấp nhận/từ chối) | ✅ | ✅ |
| Nhắn tin 1-1 | ✅ | ✅ |
| Nhắn tin nhóm | ✅ | ✅ |
| Tạo nhóm | ✅ | ✅ |
| Gửi ảnh trong chat | ✅ | ⚠️ (UI button có, chưa nối API) |
| Reply tin nhắn | ✅ | ⚠️ (backend xong, frontend chưa UI) |
| Thu hồi tin nhắn | ✅ | ⚠️ (backend xong, frontend chưa UI) |
| Đánh dấu đã đọc (seen) | ✅ | ✅ |
| Typing indicator | ✅ | ⚠️ (backend xong, frontend chưa UI) |
| Online users | ✅ | ✅ |
| Cursor pagination tin nhắn | ✅ | ✅ |
| Tìm kiếm user (regex) | ✅ | ✅ |
| Quản lý nhóm (rời/đổi tên/thêm/xóa) | ✅ | ⚠️ (backend xong, frontend chưa UI) |
| Dark/Light mode | — | ✅ |
| Emoji picker | — | ✅ |

### 12.2 Hướng phát triển

1. **Hoàn thiện UI** cho các tính năng backend đã có: gửi ảnh, reply, thu hồi, typing, quản lý nhóm
2. **Rate Limiting** chống spam bằng `express-rate-limit`
3. **Push Notifications** dùng Firebase Cloud Messaging (FCM)
4. **Video/Voice Call** tích hợp WebRTC
5. **End-to-End Encryption** bảo mật nội dung tin nhắn
6. **Deploy** lên cloud (Railway/Render cho backend, Vercel cho frontend)

---

## PHỤ LỤC — BIẾN MÔI TRƯỜNG

### Backend (`.env`)
```env
PORT=5001
MONGODB_CONNECTIONSTRING=mongodb+srv://<user>:<pass>@cluster.mongodb.net/
ACCESS_TOKEN_SECRET=<64-char-hex-secret>
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=<cloud_name>
CLOUDINARY_API_KEY=<api_key>
CLOUDINARY_API_SECRET=<api_secret>
```

### Frontend (`.env.development`)
```env
VITE_API_URL=http://localhost:5001/api
VITE_SOCKET_URL=http://localhost:5001
```

---

*Báo cáo được tạo tự động — Express Realtime Chat · CCNLTHD · 2026*
