# DANH SÁCH CÁC TÍNH NĂNG CẦN BỔ SUNG CHO BACKEND

Dựa trên quá trình kiểm tra mã nguồn hiện tại của dự án **Express-realtime-chat**, dưới đây là danh sách các đầu việc (To-do list) và logic cần bổ sung để hệ thống chat đạt chuẩn hoàn chỉnh.

---

## 1. Hệ thống Tin nhắn (Messaging System)

### ❌ Gửi Hình ảnh / File trong Chat (Media Messages)
- **Hiện tại**: Chỉ gửi được text (`content`).
- **Cần làm**: 
  - Tạo API POST `/api/messages/upload` sử dụng `multer` và `cloudinary` tương tự như `uploadAvatar`.
  - Cập nhật Model `Message` để chứa thêm các trường như `fileUrl`, `fileType` (image/video/pdf).
  - Cập nhật Socket event `new-message` để đẩy cả thông tin file về client.

### ❌ Thu hồi / Xóa tin nhắn (Recall/Delete Message)
- **Hiện tại**: Chưa có logic xóa.
- **Cần làm**: 
  - API `DELETE /api/messages/:messageId`.
  - Logic: Chỉ người gửi (Sender) mới được quyền xóa/thu hồi tin nhắn của mình.
  - Sau khi xóa trong Mongodb, cần dùng Socket để thông báo cho các thành viên khác trong Conversation xóa tin nhắn đó trên UI.

### ❌ Phản hồi tin nhắn (Reply/Quote Message)
- **Hiện tại**: Chưa có.
- **Cần làm**: Thêm trường `replyTo: MessageId` vào Model `Message` để hiển thị tin nhắn đang được phản hồi.

---

## 2. Quản lý Cuộc hội thoại (Conversation Management)

### ❌ Rời nhóm (Leave Group)
- **Cần làm**: 
  - API `POST /api/conversations/:conversationId/leave`.
  - Logic: Loại bỏ `userId` khỏi mảng `participants` trong Model `Conversation`. Nếu là Admin cuối cùng rời nhóm thì cần xóa luôn nhóm hoặc chuyển quyền Admin.

### ❌ Quản lý Thành viên (Member Management)
- **Cần làm**: 
  - Thêm thành viên mới vào nhóm hiện có.
  - Xóa thành viên khỏi nhóm (chỉ Admin mới được làm).

### ❌ Đổi tên / Ảnh đại diện Nhóm
- **Cần làm**: API `PATCH /api/conversations/:conversationId` để cập nhật các trường trong object `group`.

---

## 3. Tìm kiếm & Khám phá (Discovery)

### ❌ Tìm kiếm User theo Gợi ý (Search Suggetions)
- **Hiện tại**: `searchUserByUsername` chỉ dùng `findOne` (tìm chính xác).
- **Cần làm**: 
  - Chuyển sang `find({ username: { $regex: query, $options: 'i' } })`.
  - Giới hạn số lượng kết quả (limit: 10) để tránh quá tải.

---

## 4. Trạng thái & Thông báo (Presence & Notifications)

### ❌ Trạng thái "Đang nhập văn bản" (Typing Indicator)
- **Cần làm**: 
  - Socket event: `typing` và `stop-typing`.
  - Khi người dùng gõ phím, Client gửi event `typing` kèm `conversationId`, Server đẩy event đó tới các thành viên khác để hiện thông báo "X đang nhập...".

### ❌ Thông báo đẩy (Push Notifications)
- **Cần làm**: Tích hợp Firebase Cloud Messaging (FCM) để gửi thông báo về điện thoại/trình duyệt khi người dùng offline nhưng có tin nhắn mới.

---

## 5. Bảo mật & Tối ưu (Security & Optimization)

### ❌ Kiểm tra quyền hạn (Ownership Validation)
- **Cần làm**: Viết một middleware kiểm tra xem `req.user._id` có thực sự nằm trong danh sách `participants` của cuộc trò chuyện đó không trước khi cho phép họ gửi tin nhắn hoặc lấy lịch sử chat. (Đảm bảo người ngoài không "hack" xem trộm tin nhắn).

### ❌ Rate Limiting
- **Cần làm**: Sử dụng `express-rate-limit` để chặn các cuộc tấn công Spam tin nhắn hoặc Spam đăng ký tài khoản hàng loạt.

---
*Tài liệu này được tạo tự động bởi Antigravity để hỗ trợ quá trình phát triển dự án Moji Chat.*
Authentication (100%): Đăng ký, đăng nhập, JWT, Refresh Token đều đã xong.
User Profile (80%): Đã có API lấy thông tin cá nhân (

authMe
), tìm kiếm user và upload ảnh đại diện lên Cloudinary.
Friend System (90%): Đã có logic gửi, chấp nhận, từ chối lời mời và lấy danh sách bạn bè.
Chat Logic (85%):
Đã có gửi tin nhắn trực tiếp (Direct) và nhóm (Group).
Có logic đánh dấu đã đọc (

markAsSeen
).
Có phân trang tin nhắn bằng cursor (rất tốt cho hiệu năng).
Có Socket.IO đẩy tin nhắn realtime.
❌ Những gì CÒN THIẾU (Missing/To-do):
Tìm kiếm User nâng cao:
Hiện tại 

searchUserByUsername
 chỉ tìm bằng findOne (tìm chính xác 1 người). Bạn nên đổi sang tìm theo biểu thức chính quy (Regex) để tìm gợi ý (ví dụ gõ "kha" ra "Khanh", "Khang").
Quản lý danh sách Conversation:
Xóa/Rời nhóm: Chưa có API để một thành viên rời khỏi nhóm chat hoặc xóa cuộc trò chuyện.
Cập nhật thông tin nhóm: Chưa có API đổi tên nhóm hoặc thêm/xóa thành viên vào nhóm hiện có.
Logic Tin nhắn (Messages):
Thu hồi tin nhắn (Delete/Recall): Đây là tính năng cơ bản của app chat nhưng hiện chưa có API xóa tin nhắn.
Gửi file/hình ảnh trong Chat: Hiện tại tin nhắn chỉ hỗ trợ content dạng text. Bạn cần thêm logic để gửi ảnh/file tương tự như cách bạn làm với Avatar.
Trạng thái Online (Update):
Mặc dù Socket có bắt event online-users, nhưng bạn chưa có API để người dùng lấy danh sách những ai đang online ngay khi vừa đăng nhập (Fetch ban đầu).
Bảo mật & Validation:
Bạn đã có 

protectedRoute
, nhưng ở các API cập nhật Profile hay xóa tin nhắn, cần kiểm tra kỹ hơn quyền sở hữu (Ví dụ: không cho phép User A xóa tin nhắn của User B).