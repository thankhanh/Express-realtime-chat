# Dự án môn học: Các công nghệ lập trình hiện đại - Nghiên cứu sử dụng ExpressJS của sinh viên SGU (2025-2026 , nhóm 22 , thầy Vương) 💬

## 📝 Giới thiệu chung
Dự án này là một hệ thống nhắn tin thời gian thực (Real-time Messaging Service) toàn diện, được phát triển và tối ưu hóa trong khuôn khổ môn học **Các công nghệ lập trình hiện đại**. Trong bối cảnh truyền thông số ngày càng phát triển, việc xây dựng một hệ thống có khả năng xử lý hàng nghìn kết nối đồng thời với độ trễ tối thiểu là một thách thức lớn về mặt kỹ thuật. 

Mục tiêu trọng tâm của dự án không chỉ dừng lại ở việc tạo ra một ứng dụng chat thông thường, mà còn là một công trình nghiên cứu chuyên sâu về khả năng điều phối của framework **ExpressJS**. Dự án tập trung giải quyết các bài toán về đồng bộ hóa trạng thái (State Synchronization) giữa Client và Server thông qua giao thức WebSockets, quản lý phiên làm việc bảo mật với cơ chế JWT, và tối ưu hóa tài nguyên hệ thống khi xử lý dữ liệu truyền thông đa phương tiện tích hợp Cloud Storage. Thông qua dự án này, nhóm hướng tới việc làm chủ các công nghệ web thế hệ mới, từ đó xây dựng nền tảng vững chắc cho việc phát triển các ứng dụng phân tán quy mô lớn trong tương lai.

## 📚 Bối cảnh & Động lực
Sự bùng nổ của các ứng dụng OTT (Over-the-top) như Messenger, Telegram đã đặt ra yêu cầu cao về trải nghiệm người dùng: tin nhắn phải được chuyển đi ngay lập tức, trạng thái online phải được cập nhật thời gian thực và dữ liệu phải được bảo mật tuyệt đối. Nhóm thực hiện dự án đã quyết định chọn đề tài này để áp dụng thực tiễn các kiến thức về lập trình hướng sự kiện (Event-driven Programming) và kiến trúc Client-Server hiện đại. Việc làm chủ **ExpressJS** - một framework tối giản nhưng mạnh mẽ của Node.js - là chìa khóa để xây dựng các Micro-services có khả năng mở rộng linh hoạt.

---

## 🏗️ Kiến trúc hệ thống (Architecture)

Hệ thống được thiết kế theo mô hình **Client-Server** với sự kết hợp của **RESTful API** và **WebSockets**:

*   **API Layer (HTTP):** Xử lý các tác vụ truyền thống như Đăng ký, Đăng nhập, Quản lý hồ sơ, và Truy xuất lịch sử tin nhắn.
*   **Real-time Layer (WebSockets):** Sử dụng Socket.io để duy trì kết nối song công (Bidirectional), cho phép truyền tin nhắn và cập nhật trạng thái online tức thì.
*   **Persistence Layer:** MongoDB lưu trữ dữ liệu phi cấu trúc, tối ưu cho việc lưu giữ tin nhắn và các mối quan hệ bạn bè phức tạp.

---

## 🚀 Tính năng chi tiết

### 🔐 1. Hệ thống Hội thoại & Nhắn tin (Messaging Core)
*   **Real-time Delivery:** Tin nhắn được truyền qua Socket.io Rooms, đảm bảo chỉ những thành viên trong cuộc hội thoại mới nhận được dữ liệu.
*   **Hỗ trợ đa phương tiện:** Tích hợp **Cloudinary API** để xử lý hình ảnh, giúp tối ưu dung lượng server Backend.
*   **Smart Unread Counts:** Hệ thống tự động tính toán số lượng tin nhắn chưa đọc cho từng đối tượng trong cuộc hội thoại.
*   **Typing Indicator:** Thông báo trạng thái đang soạn tin nhắn thời gian thực.

### 👥 2. Quản lý Mối quan hệ (Social Logic)
*   **Quy trình kết bạn 3 bước:** Gửi yêu cầu -> Chờ phê duyệt -> Trở thành bạn bè.
*   **Online/Offline Tracking:** Theo dõi trạng thái hoạt động dựa trên sự kiện `connection` và `disconnect` của Socket.
*   **Phân quyền truy cập:** Chỉ bạn bè mới có thể bắt đầu cuộc hội thoại trực tiếp (Direct Message).

### 🛡️ 3. Bảo mật & Xác thực (Security)
*   **JWT Authentication:** Sử dụng cặp Access Token và Refresh Token để duy trì phiên đăng nhập bảo mật.
*   **Middleware Protection:** Mọi API riêng tư đều được bảo vệ bởi lớp `protectedRoute`.
*   **Socket Authentication:** Sử dụng middleware tùy chỉnh để xác thực người dùng ngay khi bắt đầu kết nối WebSocket.

---

## 🛠️ Chi tiết công nghệ sử dụng (Tech Stack)

### **Backend (Node.js & Express)**
*   **Express.js 5.x:** Framework xử lý request/response hiệu năng cao.
*   **Socket.io 4.x:** Công nghệ WebSocket cho phép giao tiếp thời gian thực.
*   **Mongoose 8.x:** ODM mạnh mẽ để làm việc với MongoDB.
*   **Cloudinary:** Lưu trữ và tối ưu hóa tài nguyên hình ảnh.
*   **Swagger:** Cung cấp giao diện tương tác với API trực quan.

### **Frontend (Vite + React 19)**
*   **Tailwind CSS 4:** Engine CSS thế hệ mới, tối ưu hóa tốc độ build và hiệu năng render.
*   **Zustand:** Thư viện quản lý State tập trung, giúp đồng bộ dữ liệu giữa UI và Socket server.
*   **Radix UI:** Bộ thư viện component không style, đảm bảo tính tiếp cận (Accessibility).

---

## 📂 Cơ cấu thư mục (Project Structure)

```text
├── backend/
│   ├── src/
│   │   ├── controllers/   # Xử lý logic nghiệp vụ (Auth, Friend, Message)
│   │   ├── models/        # Định nghĩa các Schema Database
│   │   ├── routes/        # Phân tuyến và cấu hình API Endpoints
│   │   ├── middlewares/   # Các lớp bảo vệ (Auth) và xử lý trung gian
│   │   ├── socket/        # Lớp điều phối giao thức truyền tin WebSockets
│   │   ├── libs/          # Kết nối các thư viện ngoại vi (DB, Cloudinary)
│   │   ├── utils/         # Các hàm tiện ích hỗ trợ logic nghiệp vụ
│   │   ├── swagger.json   # Cấu hình tài liệu API tương tác
│   │   └── server.js      # Điểm khởi tạo ứng dụng chính
├── frontend/
│   ├── src/
│   │   ├── components/    # Các thành phần giao diện (UI Components)
│   │   ├── pages/         # Các trang chính (Chat, Login, Home)
│   │   ├── stores/        # Quản lý trạng thái toàn cục (Zustand)
│   │   ├── services/      # Các module tương tác với API Backend
│   │   ├── hooks/         # Các Custom React Hooks để xử lý logic UI
│   │   ├── types/         # Định nghĩa kiểu dữ liệu TypeScript
│   │   ├── assets/        # Tài nguyên tĩnh (Hình ảnh, Icons)
│   │   ├── lib/           # Các cấu hình thư viện bổ trợ
│   │   ├── App.tsx        # Container chính và cấu hình Routing
│   │   └── main.tsx       # Root entry point của ứng dụng
```

---

## 📡 Các sự kiện Socket chính
| Sự kiện | Mô tả |
| :--- | :--- |
| `online-users` | Gửi danh sách ID người dùng đang online cho toàn bộ client |
| `join-conversation` | Đưa người dùng vào Room của một cuộc hội thoại cụ thể |
| `new-message` | Phát tán nội dung tin nhắn mới đến các thành viên trong Room |

---

## ⚙️ Hướng dẫn thiết lập môi trường

1. **Backend:**
   * Tạo tệp `.env` dựa trên `.env.example`.
   * Cung cấp các chuỗi kết nối: `MONGODB_CONNECTIONSTRING`, `CLOUDINARY_API_KEY`, `ACCESS_TOKEN_SECRET`.
   * Chạy `npm install` và `npm run dev`.

2. **Frontend:**
   * Cấu hình URL API backend trong tệp `.env.development`.
   * Chạy `npm install` và `npm run dev`.

---

## 👨‍🏫 Thông tin khóa học & Nhóm thực hiện
*   **Môn học:** Các công nghệ lập trình hiện đại
*   **Đề tài:** Nghiên cứu và xây dựng hệ thống Chat Real-time dựa trên kiến trúc Micro-services và WebSockets.
*   **Nhóm thực hiện:** Nhóm CNCNLTHD-nhóm 22
*   **Thành viên:**
    1. Hà Thanh Khánh - 3122410178
    2. Cao Tiến Cường - 3122410043
    3. Hà Văn Hưng - 3122410159
    4. MinhMafia- 

---

## 📄 Giấy phép & Cam kết
Mã nguồn này được phát triển cho mục tiêu học thuật, nghiên cứu và báo cáo cuối kỳ của môn học. Mọi hành vi sao chép cho mục đích thương mại đều không được khuyến khích.  nghĩ ra cái tên cho repo này
