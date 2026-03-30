# TÌM HIỂU VÀ ỨNG DỤNG CÔNG NGHỆ EXPRESS

## Tóm tắt

Trong bối cảnh các ứng dụng web hiện đại ngày càng yêu cầu tốc độ phản hồi nhanh, khả năng mở rộng linh hoạt và hỗ trợ giao tiếp thời gian thực, Express.js trở thành một trong những framework backend phổ biến nhất trên nền tảng Node.js. Báo cáo này tập trung tìm hiểu cơ sở lý thuyết của Express.js, cách thức framework này hỗ trợ xây dựng RESTful API, tổ chức mã nguồn theo hướng module, kết nối cơ sở dữ liệu MongoDB và triển khai xác thực người dùng bằng JWT.

Bên cạnh phần lý thuyết, báo cáo còn gắn với một bài toán thực tế là xây dựng backend cho ứng dụng chat thời gian thực. Hệ thống được phát triển theo mô hình client-server, trong đó Express.js đảm nhiệm vai trò xử lý request/response, tổ chức route, middleware, controller và kết nối dữ liệu. Từ mã nguồn hiện có của dự án, nhóm tiến hành phân tích cấu trúc thư mục, mô tả các module chức năng chính như đăng ký, đăng nhập, quản lý bạn bè và làm rõ cách áp dụng các khái niệm nền tảng vào sản phẩm.

Kết quả của phần nghiên cứu đến hết Phần 2 cho thấy Express.js phù hợp với các dự án backend vừa và nhỏ, đặc biệt là các hệ thống API cần tốc độ phát triển nhanh, cấu trúc rõ ràng và dễ tích hợp thêm các công nghệ như MongoDB, JWT, Socket.io hoặc dịch vụ lưu trữ đám mây. Báo cáo đồng thời chỉ ra một số điểm cần hoàn thiện thêm trong dự án để tiến tới một hệ thống chat hoàn chỉnh hơn ở các phần sau.

## Lời mở đầu

### 1. Lý do chọn đề tài

Express.js là framework phổ biến được xây dựng trên nền tảng Node.js, hỗ trợ phát triển ứng dụng web và xây dựng RESTful API nhanh chóng, gọn nhẹ và hiệu quả. Việc lựa chọn Express.js để nghiên cứu xuất phát từ các lý do sau:

- Express.js có mức độ phổ biến cao và được sử dụng rộng rãi trong thực tế. Nhiều hệ thống backend, website và ứng dụng hiện nay sử dụng Express.js làm nền tảng chính.
- Express.js có cấu trúc đơn giản, dễ học và dễ triển khai, phù hợp cho người mới bắt đầu học backend.
- Express.js hỗ trợ xây dựng RESTful API tốt, phù hợp với website, ứng dụng di động và các hệ thống phân tán hiện đại.
- Express.js có cộng đồng lớn, tài liệu phong phú, dễ tìm ví dụ và giải pháp khi gặp khó khăn.
- Express.js dễ mở rộng và dễ tích hợp với MongoDB, JWT, Socket.io, Cloudinary và các thư viện JavaScript khác.

Đối với dự án môn học này, nhóm lựa chọn Express.js để xây dựng backend cho một ứng dụng chat thời gian thực. Đây là bài toán phù hợp để kiểm chứng khả năng xử lý API, quản lý người dùng, xác thực, và tổ chức luồng nghiệp vụ trong một hệ thống thực tế.

### 2. Mục tiêu báo cáo

Mục tiêu của đề tài là nghiên cứu và làm rõ vai trò của Express.js trong phát triển ứng dụng web backend trên nền tảng Node.js. Thông qua quá trình tìm hiểu lý thuyết và phân tích mã nguồn thực tế, đề tài hướng đến:

- Hiểu rõ khái niệm, cấu trúc và nguyên lý hoạt động của Express.js.
- Nắm được cách xây dựng server và RESTful API bằng Express.js.
- Phân tích cách tổ chức mã nguồn theo route, controller, middleware và model.
- Tìm hiểu cách kết nối MongoDB bằng Mongoose trong ứng dụng Express.
- Tìm hiểu cơ chế xác thực người dùng bằng JWT kết hợp refresh token.
- Áp dụng kiến thức vào hệ thống backend cho ứng dụng chat thời gian thực.
- Đánh giá ưu điểm, hạn chế và khả năng ứng dụng thực tế của Express.js.

### 3. Phạm vi nghiên cứu

Trong phạm vi của báo cáo này, nhóm tập trung nghiên cứu và triển khai phần backend cho ứng dụng chat thời gian thực bằng Express.js. Các nội dung chính bao gồm:

- Xây dựng server Express và tổ chức cấu trúc dự án backend.
- Kết nối cơ sở dữ liệu MongoDB bằng thư viện Mongoose.
- Xây dựng API xác thực người dùng: đăng ký, đăng nhập, đăng xuất.
- Xây dựng API quản lý quan hệ bạn bè: gửi lời mời, chấp nhận, từ chối, lấy danh sách bạn bè.
- Sử dụng middleware để bảo vệ các route riêng tư bằng JWT.
- Phân tích mô hình dữ liệu của các thực thể như `User`, `Session`, `Friend`, `FriendRequest`, `Conversation`, `Message`.

Do giới hạn thời gian và hiện trạng mã nguồn, một số chức năng nâng cao như nhắn tin thời gian thực bằng Socket.io, tài liệu Swagger, upload ảnh Cloudinary và một số route khác mới dừng ở mức định hướng hoặc đang được chuẩn bị tích hợp.

### 4. Kế hoạch và tiến độ thực hiện

| STT | Nội dung | Thời gian dự kiến |
| --- | --- | --- |
| 1 | Nghiên cứu tổng quan đề tài và phân công công việc | 1 tuần |
| 2 | Tìm hiểu Express.js, MongoDB, JWT, Socket.io | 1 tuần |
| 3 | Phân tích yêu cầu và thiết kế mô hình dữ liệu | 1 tuần |
| 4 | Xây dựng backend với Express.js và MongoDB | 2 tuần |
| 5 | Xây dựng API xác thực và API quản lý bạn bè | 1 tuần |
| 6 | Kiểm thử API bằng Postman | 1 tuần |
| 7 | Viết báo cáo và hoàn thiện tài liệu | 1 tuần |

### 5. Cấu trúc báo cáo

Báo cáo được tổ chức theo các phần chính sau:

- Tóm tắt.
- Lời mở đầu.
- Phần 1: Tổng quan và phân tích công nghệ.
- Phần 2: Kiến thức cốt lõi và thực hành.
- Các phần tiếp theo sẽ trình bày phân tích hệ thống, triển khai thực nghiệm, kết luận và hướng phát triển.

---

# PHẦN 1: TỔNG QUAN VÀ PHÂN TÍCH CÔNG NGHỆ

## Chương 1: Giới thiệu về Express.js

### 1.1. Lịch sử và bối cảnh ra đời

Express.js ra đời vào năm 2010 bởi TJ Holowaychuk và được lấy cảm hứng từ framework Sinatra của Ruby. Trong giai đoạn Node.js ngày càng phát triển, lập trình viên cần một framework đơn giản để giảm bớt khối lượng xử lý thủ công khi xây dựng server HTTP, quản lý route và phản hồi dữ liệu. Express.js ra đời để giải quyết nhu cầu đó.

Nếu chỉ dùng Node.js thuần, lập trình viên phải tự xử lý nhiều tác vụ như:

- Phân tích URL và HTTP method.
- Tự viết logic định tuyến.
- Tự đọc `req.body`.
- Tự chuẩn hóa response JSON.
- Tự tổ chức mã nguồn cho các chức năng lớn.

Express.js đóng vai trò như một lớp trừu tượng mỏng trên Node.js, giúp đơn giản hóa quá trình phát triển backend nhưng vẫn giữ được hiệu năng và tính linh hoạt.

### 1.2. Khái niệm Express.js

Express.js là một web framework tối giản cho Node.js, cung cấp tập hợp các tính năng cốt lõi để xây dựng ứng dụng web và RESTful API. Framework này không ép buộc quá nhiều về cấu trúc, thay vào đó cho phép lập trình viên chủ động tổ chức dự án theo nhu cầu.

Một số khả năng chính của Express.js:

- Định tuyến request theo URL và HTTP method.
- Hỗ trợ middleware để xử lý trung gian.
- Hỗ trợ gửi response ở nhiều định dạng.
- Dễ dàng tích hợp với cơ sở dữ liệu và thư viện bên thứ ba.
- Phù hợp cho cả web app truyền thống lẫn API backend.

### 1.3. Kiến trúc và nguyên lý hoạt động

Express.js hoạt động dựa trên ba thành phần chính là `request`, `response` và `middleware`.

Khi client gửi một HTTP request đến server:

1. Request đi vào ứng dụng Express.
2. Hệ thống kiểm tra route tương ứng.
3. Request đi qua các middleware đã khai báo.
4. Controller xử lý nghiệp vụ.
5. Server trả response về cho client.

Điểm quan trọng trong Express.js là cơ chế `middleware pipeline`. Mỗi middleware là một hàm nhận ba tham số `req`, `res`, `next`. Middleware có thể:

- Đọc và chỉnh sửa dữ liệu request.
- Kiểm tra quyền truy cập.
- Ghi log.
- Xử lý lỗi.
- Chuyển tiếp request sang middleware tiếp theo bằng `next()`.

Ví dụ luồng xử lý trong dự án:

- `express.json()` dùng để đọc JSON body.
- `cookieParser()` dùng để đọc cookie.
- `protectedRoute` kiểm tra access token.
- Sau đó request mới được chuyển tới controller nghiệp vụ.

### 1.4. Vai trò của Express.js trong dự án chat

Trong dự án này, Express.js là khung xương của toàn bộ backend. Cụ thể:

- Tạo server HTTP tại file `backend/src/server.js`.
- Đăng ký các route như `/api/auth` và `/api/friends`.
- Kết hợp middleware để tách biệt phần công khai và phần yêu cầu đăng nhập.
- Tổ chức mã nguồn theo mô hình module gồm `routes`, `controllers`, `models`, `middlewares`, `libs`.
- Kết nối với MongoDB để lưu dữ liệu người dùng, phiên đăng nhập và quan hệ bạn bè.

Nhờ Express.js, mã nguồn trở nên rõ ràng hơn so với cách viết bằng Node.js thuần, giúp nhóm dễ phân chia công việc giữa các thành viên.

### 1.5. So sánh Express.js với một số lựa chọn khác

#### a. So sánh Node.js thuần và Express.js

Node.js thuần cung cấp module `http` để tạo server nhưng yêu cầu lập trình viên tự xử lý rất nhiều logic. Express.js giúp rút gọn phần lớn thao tác lặp lại và cung cấp sẵn cơ chế route, middleware, parser.

Ưu điểm của Express.js so với Node.js thuần:

- Viết ít mã hơn.
- Tổ chức code dễ hơn.
- Phù hợp để xây dựng API nhanh.
- Dễ mở rộng với nhiều package từ NPM.

#### b. So sánh Express.js và NestJS

NestJS là framework có cấu trúc chặt chẽ, mạnh về TypeScript, Dependency Injection và phù hợp cho hệ thống lớn. Trong khi đó, Express.js nhẹ hơn, dễ tiếp cận hơn và phù hợp với các dự án học thuật hoặc các hệ thống vừa và nhỏ.

Đối với đề tài này, Express.js phù hợp hơn vì:

- Dễ học và dễ triển khai.
- Phù hợp với nhóm sinh viên đang tập trung vào nền tảng backend.
- Tốc độ hiện thực chức năng nhanh.
- Dễ tích hợp với MongoDB và JWT.

### 1.6. Ưu điểm và hạn chế của Express.js

#### Ưu điểm

- Nhẹ, nhanh, đơn giản.
- Hệ sinh thái lớn.
- Linh hoạt trong cách tổ chức mã nguồn.
- Phù hợp cho REST API và ứng dụng hướng dịch vụ.
- Dễ tích hợp với middleware bên ngoài.

#### Hạn chế

- Không áp đặt cấu trúc mạnh, nên dự án dễ rối nếu nhóm tổ chức không tốt.
- Cần tự quyết định nhiều thành phần như xác thực, validation, phân tầng code.
- Khi hệ thống mở rộng lớn, nếu không chuẩn hóa từ đầu sẽ khó bảo trì.

### 1.7. Đánh giá chương

Qua việc tìm hiểu tổng quan, có thể thấy Express.js là một framework phù hợp để học tập và ứng dụng vào các bài toán backend thực tế. Với đặc tính gọn nhẹ, dễ tiếp cận và linh hoạt, Express.js đáp ứng tốt yêu cầu xây dựng backend cho ứng dụng chat thời gian thực của nhóm.

## Chương 2: Cơ hội nghề nghiệp với Express.js và Node.js

### 2.1. Vị trí việc làm liên quan

Việc nắm vững Express.js mở ra nhiều vị trí công việc trong lĩnh vực phát triển phần mềm, tiêu biểu như:

- Backend Developer sử dụng Node.js.
- Fullstack Developer kết hợp React hoặc Vue ở frontend với Express ở backend.
- API Developer chuyên xây dựng dịch vụ RESTful.
- Software Engineer tham gia phát triển hệ thống web hoặc microservices.

### 2.2. Ý nghĩa thực tiễn của kỹ năng Express.js

JavaScript hiện nay là một trong những ngôn ngữ phổ biến nhất. Khi sử dụng Node.js và Express.js, lập trình viên có thể viết cả frontend lẫn backend bằng cùng một ngôn ngữ. Điều này giúp:

- Giảm thời gian học công nghệ mới.
- Dễ phối hợp giữa frontend và backend.
- Tăng khả năng làm fullstack.
- Phù hợp với nhiều startup và doanh nghiệp vừa, nơi cần tốc độ phát triển nhanh.

### 2.3. Nhu cầu tuyển dụng

Trong thực tế, nhiều doanh nghiệp tuyển dụng lập trình viên Node.js để phát triển:

- REST API cho ứng dụng web và mobile.
- Hệ thống quản trị nội bộ.
- Dịch vụ chat, thông báo, đồng bộ dữ liệu thời gian thực.
- Hệ thống microservices.

Express.js là một trong những kỹ năng nền tảng được yêu cầu vì đây là framework lâu đời, phổ biến và dễ tích hợp vào nhiều loại dự án.

### 2.4. Kỹ năng cần có ngoài Express.js

Để làm việc hiệu quả với Express.js, lập trình viên backend còn cần bổ sung:

- Kiến thức về HTTP, RESTful API.
- Kiến thức về MongoDB hoặc SQL.
- Xử lý xác thực và phân quyền.
- Kiểm thử API bằng Postman hoặc Swagger.
- Sử dụng Git/GitHub để quản lý mã nguồn.
- Triển khai ứng dụng lên cloud hoặc VPS.

### 2.5. Định hướng cá nhân sau khi học Express.js

Thông qua đề tài này, sinh viên có thể xây dựng nền tảng tốt cho lộ trình backend developer. Từ Express.js, có thể tiếp tục học sâu hơn về:

- Socket.io cho realtime.
- Redis cho caching.
- Docker cho triển khai.
- CI/CD cho tự động hóa.
- Kiến trúc microservices.
- TypeScript và NestJS để nâng cao tính chuẩn hóa cho dự án lớn.

### 2.6. Đánh giá chương

Express.js không chỉ là công cụ phù hợp cho bài tập môn học mà còn là nền tảng nghề nghiệp thực tế. Việc nghiên cứu và triển khai Express.js giúp sinh viên tiếp cận gần hơn với công việc của một backend developer hiện đại.

---

# PHẦN 2: KIẾN THỨC CỐT LÕI VÀ THỰC HÀNH

Mục tiêu của phần này là làm rõ những kiến thức nền tảng quan trọng nhất khi xây dựng backend bằng Express.js, đồng thời minh họa chúng trên chính mã nguồn dự án chat đang được nhóm phát triển.

## Chương 3: Thiết lập môi trường và kiến trúc hệ thống

### 3.1. Công cụ và môi trường cần thiết

Để xây dựng và chạy backend bằng Express.js, nhóm sử dụng các công cụ sau:

- **Node.js**: môi trường thực thi JavaScript phía server.
- **NPM**: công cụ quản lý package.
- **Visual Studio Code**: môi trường lập trình chính.
- **Postman**: dùng để kiểm thử các API endpoint.
- **MongoDB**: cơ sở dữ liệu NoSQL lưu thông tin người dùng và nghiệp vụ.
- **MongoDB Compass** hoặc MongoDB Atlas: hỗ trợ quan sát dữ liệu.
- **Git/GitHub**: quản lý phiên bản và làm việc nhóm.

### 3.2. Cài đặt và khởi tạo dự án

#### a. Khởi tạo project backend

Quy trình khởi tạo dự án Express cơ bản:

```bash
npm init -y
npm install express mongoose dotenv cookie-parser cors jsonwebtoken bcrypt
npm install -D nodemon
```

#### b. Các thư viện đang được dùng trong dự án

Theo file `backend/package.json`, backend hiện sử dụng các thư viện chính:

- `express`: xây dựng server và route.
- `mongoose`: kết nối và thao tác MongoDB.
- `dotenv`: đọc biến môi trường từ file `.env`.
- `cookie-parser`: đọc cookie từ request.
- `jsonwebtoken`: tạo và xác minh JWT.
- `bcrypt`: mã hóa mật khẩu.
- `nodemon`: tự động khởi động lại server khi mã nguồn thay đổi.

#### c. Biến môi trường

Từ file `.env` hiện có, dự án đang sử dụng các biến cấu hình:

```env
PORT=
MONGODB_CONNECTIONSTRING=
ACCESS_TOKEN_SECRET=
```

Ý nghĩa:

- `PORT`: cổng chạy backend.
- `MONGODB_CONNECTIONSTRING`: chuỗi kết nối tới MongoDB.
- `ACCESS_TOKEN_SECRET`: khóa bí mật dùng để ký JWT.

Nếu sau này mở rộng thêm upload ảnh hoặc frontend deploy riêng, có thể bổ sung các biến như `CLIENT_URL`, `CLOUDINARY_*`, `REFRESH_TOKEN_SECRET`.

### 3.3. Kiến trúc tổng quát của hệ thống

Hệ thống được xây dựng theo mô hình client-server:

- Client gửi request HTTP đến backend.
- Express.js tiếp nhận request và định tuyến đến module phù hợp.
- Controller xử lý nghiệp vụ.
- Model tương tác với MongoDB qua Mongoose.
- Server trả kết quả JSON cho client.

Ở giai đoạn hiện tại, kiến trúc của backend chủ yếu tập trung vào hai nhóm chức năng:

- **Khối xác thực**: đăng ký, đăng nhập, đăng xuất.
- **Khối quan hệ bạn bè**: gửi lời mời, chấp nhận lời mời, từ chối lời mời, lấy danh sách bạn bè.

Trong tương lai, hệ thống có thể mở rộng thêm:

- Quản lý người dùng.
- Quản lý hội thoại.
- Gửi nhận tin nhắn.
- Realtime bằng Socket.io.
- Upload ảnh và media.

### 3.4. Phân tích cấu trúc thư mục thực tế của dự án

Cấu trúc backend hiện tại:

```text
backend/
├── src/
│   ├── controllers/
│   │   ├── authController.js
│   │   └── friendController.js
│   ├── libs/
│   │   └── db.js
│   ├── middlewares/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Session.js
│   │   ├── Friend.js
│   │   ├── FriendRequest.js
│   │   ├── conversation.js
│   │   └── message.js
│   ├── routes/
│   │   ├── authRoute.js
│   │   └── friendRoute.js
│   └── server.js
└── package.json
```

Ý nghĩa từng thư mục:

#### a. `routes`

Thư mục này định nghĩa các endpoint và gắn endpoint với controller tương ứng. Ví dụ:

- `authRoute.js` chứa các route `/signup`, `/signin`, `/signout`.
- `friendRoute.js` chứa các route liên quan đến lời mời kết bạn và danh sách bạn bè.

#### b. `controllers`

Controller là nơi xử lý nghiệp vụ chính. Ví dụ:

- `authController.js` xử lý đăng ký, đăng nhập, đăng xuất, refresh token.
- `friendController.js` xử lý gửi lời mời kết bạn, chấp nhận, từ chối, lấy danh sách bạn bè.

#### c. `models`

Thư mục này chứa các schema Mongoose mô tả dữ liệu trong MongoDB:

- `User`: thông tin tài khoản người dùng.
- `Session`: lưu refresh token.
- `Friend`: lưu quan hệ bạn bè đã được xác nhận.
- `FriendRequest`: lưu lời mời kết bạn đang chờ xử lý.
- `Conversation` và `Message`: chuẩn bị cho chức năng chat.

#### d. `middlewares`

Chứa các hàm xử lý trung gian. Hiện tại nổi bật là:

- `authMiddleware.js`: xác minh access token và gắn người dùng vào `req.user`.

#### e. `libs`

Chứa các tiện ích dùng chung. Hiện tại:

- `db.js`: thực hiện kết nối MongoDB.

#### f. `server.js`

Đây là điểm khởi động của ứng dụng. File này thực hiện:

- Nạp biến môi trường.
- Tạo app Express.
- Đăng ký middleware toàn cục.
- Khai báo các route.
- Kết nối database.
- Lắng nghe kết nối tại một cổng cụ thể.

### 3.5. Phân tích file `server.js`

Mã nguồn khởi tạo server:

```js
import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./libs/db.js";
import authRoute from "./routes/authRoute.js";
import friendRoute from "./routes/friendRoute.js";
import cookieParser from "cookie-parser";
import { protectedRoute } from "./middlewares/authMiddleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoute);
app.use("/api/friends", protectedRoute, friendRoute);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`server bắt đầu trên cổng ${PORT}`);
  });
});
```

Nhận xét:

- Server chỉ khởi động sau khi kết nối database thành công.
- Route được tách rõ thành public và protected.
- Middleware `express.json()` và `cookieParser()` được dùng toàn cục.
- Hướng tổ chức này phù hợp với dự án module hóa.

### 3.6. Kiến trúc module và lợi ích

Dự án áp dụng tổ chức theo hướng module. Cách làm này mang lại nhiều lợi ích:

- Dễ bảo trì vì logic được tách theo chức năng.
- Dễ mở rộng vì thêm tính năng mới chỉ cần thêm route, controller, model tương ứng.
- Dễ kiểm thử vì từng phần có trách nhiệm rõ ràng.
- Dễ làm việc nhóm vì các thành viên có thể phụ trách từng module độc lập.

### 3.7. Bài tập ứng dụng của chương

Sinh viên có thể minh chứng nội dung chương này bằng:

- Ảnh chụp cấu trúc thư mục dự án trong VS Code.
- Ảnh chụp file `.env`.
- Ảnh chụp terminal khi chạy lệnh `npm run dev`.
- Ảnh chụp thông báo kết nối MongoDB thành công.

### 3.8. Đánh giá chương

Chương này cho thấy Express.js không chỉ đơn giản trong cách khởi tạo mà còn tạo điều kiện thuận lợi để tổ chức một backend thực tế theo cấu trúc rõ ràng. Với dự án chat của nhóm, phần nền tảng triển khai server và phân tầng thư mục đã được hình thành tương đối tốt.

## Chương 4: Các khái niệm nền tảng trong Express.js

### 4.1. Routing

Routing là cơ chế định nghĩa cách server phản hồi theo từng URL và HTTP method. Trong Express.js, route thường có dạng:

```js
router.post("/signup", signUp);
router.post("/signin", signIn);
router.post("/signout", signOut);
```

Trong dự án:

- `POST /api/auth/signup`: đăng ký tài khoản.
- `POST /api/auth/signin`: đăng nhập.
- `POST /api/auth/signout`: đăng xuất.
- `POST /api/friends/requests`: gửi lời mời kết bạn.
- `GET /api/friends`: lấy danh sách bạn bè.

Routing giúp chia nhỏ chức năng và giúp backend dễ theo dõi hơn.

### 4.2. Controller

Controller là nơi nhận request từ route, xử lý nghiệp vụ và trả kết quả cho client. Ví dụ trong dự án:

- `signUp` kiểm tra dữ liệu đầu vào, kiểm tra username trùng, mã hóa mật khẩu và tạo user mới.
- `signIn` xác minh thông tin đăng nhập, tạo access token, tạo refresh token và lưu session.
- `sendFriendRequest` kiểm tra điều kiện gửi lời mời kết bạn.

Ví dụ rút gọn từ `signUp`:

```js
export const signUp = async (req, res) => {
  const { username, password, email, firstName, lastName } = req.body;

  if (!username || !password || !email || !firstName || !lastName) {
    return res.status(400).json({ message: "Thiếu dữ liệu" });
  }

  const duplicate = await User.findOne({ username });
  if (duplicate) {
    return res.status(409).json({ message: "username đã tồn tại" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({
    username,
    hashedPassword,
    email,
    displayName: `${lastName} ${firstName}`,
  });

  return res.sendStatus(204);
};
```

### 4.3. Middleware

Middleware là hàm chạy giữa request và response. Đây là khái niệm rất quan trọng trong Express.js.

Các middleware đang được dùng trong dự án:

- `express.json()`: chuyển JSON body thành đối tượng JavaScript.
- `cookieParser()`: đọc cookie từ request.
- `protectedRoute`: xác minh JWT cho các route riêng tư.

Ví dụ middleware xác thực:

```js
export const protectedRoute = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Không tìm thấy access token" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decodedUser) => {
    if (err) {
      return res.status(403).json({ message: "Access token hết hạn hoặc không đúng" });
    }

    const user = await User.findById(decodedUser.userId).select("-hashedPassword");
    req.user = user;
    next();
  });
};
```

Middleware này cho thấy Express.js rất phù hợp để tách biệt logic kiểm tra quyền truy cập khỏi logic nghiệp vụ.

### 4.4. Request và Response

Trong Express.js:

- `req` chứa dữ liệu từ client như header, params, query, body, cookie.
- `res` dùng để trả dữ liệu về client.

Ví dụ trong dự án:

- `req.body` chứa `username`, `password`, `email`.
- `req.params.requestId` chứa mã lời mời kết bạn.
- `req.cookies.refreshToken` chứa refresh token.
- `res.status(200).json(...)` trả dữ liệu JSON.
- `res.sendStatus(204)` trả về trạng thái thành công nhưng không có nội dung.

### 4.5. Model và Mongoose ODM

Mongoose là công cụ giúp làm việc với MongoDB theo kiểu schema. Nhờ Mongoose, dữ liệu được quản lý có cấu trúc hơn.

Ví dụ model `User`:

```js
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    hashedPassword: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    displayName: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);
```

Mongoose giúp:

- Khai báo ràng buộc dữ liệu.
- Tạo model thao tác dễ dàng.
- Hỗ trợ index, middleware, populate.
- Giúp mã nguồn dễ đọc hơn so với truy vấn MongoDB thuần.

### 4.6. Dependency và sự phụ thuộc giữa các thành phần

Trong backend Express, dependency có thể hiểu là sự phụ thuộc giữa các module:

- Route phụ thuộc vào controller.
- Controller phụ thuộc vào model.
- Middleware phụ thuộc vào JWT hoặc các tiện ích xác thực.
- Server phụ thuộc vào route, middleware và kết nối database.

Ví dụ:

- `authRoute.js` import `signUp`, `signIn`, `signOut` từ `authController.js`.
- `authController.js` import `User`, `Session`, `bcrypt`, `jsonwebtoken`.
- `server.js` import `authRoute`, `friendRoute`, `protectedRoute`.

Việc tách dependency hợp lý giúp hệ thống rõ trách nhiệm và dễ bảo trì.

### 4.7. Quy trình xử lý một request trong hệ thống

Ví dụ với API `POST /api/friends/requests`:

1. Client gửi request kèm access token trong header `Authorization`.
2. Express nhận request và chuyển tới route `/api/friends`.
3. Middleware `protectedRoute` xác thực token.
4. Nếu hợp lệ, `req.user` được gán thông tin người dùng.
5. Controller `sendFriendRequest` kiểm tra dữ liệu, kiểm tra người nhận tồn tại, kiểm tra trùng lời mời.
6. Hệ thống tạo bản ghi `FriendRequest` trong MongoDB.
7. Response JSON trả về trạng thái thành công.

Đây là ví dụ điển hình cho cách Express kết hợp route, middleware, controller và model.

### 4.8. Bài tập ứng dụng: CRUD cơ bản

Mặc dù dự án hiện tại chưa xây dựng đầy đủ toàn bộ CRUD cho mọi thực thể, nhưng đã có các thao tác tiêu biểu:

#### a. Tạo dữ liệu

- Đăng ký tài khoản bằng `POST /api/auth/signup`.
- Tạo lời mời kết bạn bằng `POST /api/friends/requests`.
- Tạo session đăng nhập khi gọi `POST /api/auth/signin`.

#### b. Đọc dữ liệu

- Lấy danh sách bạn bè bằng `GET /api/friends`.
- Dự kiến lấy danh sách lời mời kết bạn bằng `GET /api/friends/requests`.

#### c. Cập nhật dữ liệu

- Chấp nhận lời mời kết bạn bằng `POST /api/friends/requests/:requestId/accept`.
- Thao tác này làm thay đổi trạng thái từ lời mời sang quan hệ bạn bè.

#### d. Xóa dữ liệu

- Đăng xuất bằng `POST /api/auth/signout` sẽ xóa session theo refresh token.
- Từ chối lời mời bằng `POST /api/friends/requests/:requestId/decline` sẽ xóa bản ghi lời mời.

### 4.9. Minh họa request và response

#### a. API đăng ký

**Request**

```json
{
  "username": "nam22",
  "password": "123456",
  "email": "nam22@gmail.com",
  "firstName": "Nam",
  "lastName": "Nguyen"
}
```

**Response thành công**

```json
204 No Content
```

#### b. API đăng nhập

**Request**

```json
{
  "username": "nam22",
  "password": "123456"
}
```

**Response thành công**

```json
{
  "message": "User Nguyen Nam đã logged in!",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### c. API gửi lời mời kết bạn

**Request**

```json
{
  "to": "67f0c1234567890abc123456",
  "message": "Kết bạn với mình nhé"
}
```

**Response thành công**

```json
{
  "message": "Gửi lời mời kết bạn thành công",
  "request": {
    "_id": "67f0d1234567890abc123456",
    "from": "67f0b1234567890abc123456",
    "to": "67f0c1234567890abc123456",
    "message": "Kết bạn với mình nhé"
  }
}
```

### 4.10. Minh chứng nên bổ sung trong báo cáo bản PDF

Ở bản báo cáo chính thức, nhóm nên chèn thêm:

- Ảnh chụp Postman khi gọi `signup`, `signin`, `send friend request`, `get friends`.
- Ảnh chụp response HTTP status `200`, `201`, `204`.
- Ảnh chụp dữ liệu trong MongoDB Compass sau khi test.

### 4.11. Đánh giá chương

Các khái niệm nền tảng như routing, controller, middleware, request/response và model đã được áp dụng trực tiếp vào dự án. Qua đó có thể thấy Express.js không chỉ dễ học về mặt lý thuyết mà còn rất thực dụng khi đưa vào triển khai sản phẩm thật.

## Chương 5: Kết nối cơ sở dữ liệu MongoDB và Mongoose

### 5.1. Tổng quan về MongoDB

MongoDB là hệ quản trị cơ sở dữ liệu NoSQL dạng document. Dữ liệu được lưu dưới dạng BSON gần giống JSON, phù hợp với các ứng dụng web hiện đại vì có tính linh hoạt cao.

Ưu điểm của MongoDB:

- Không cần schema cứng như cơ sở dữ liệu quan hệ.
- Dễ mở rộng dữ liệu khi yêu cầu thay đổi.
- Phù hợp với dữ liệu bán cấu trúc hoặc thay đổi thường xuyên.
- Tích hợp tốt với Node.js.

Đối với ứng dụng chat, MongoDB phù hợp vì dữ liệu như người dùng, lời mời kết bạn, phiên đăng nhập, hội thoại và tin nhắn có thể thay đổi linh hoạt.

### 5.2. Vai trò của Mongoose

Mongoose là ODM giúp làm việc với MongoDB trong Node.js. Mongoose cho phép:

- Tạo schema.
- Định nghĩa model.
- Thiết lập validation.
- Tạo index.
- Sử dụng `populate()` để tham chiếu dữ liệu.

Nhờ Mongoose, dự án tránh được việc thao tác MongoDB theo kiểu thuần quá thủ công.

### 5.3. Kết nối MongoDB trong dự án

File `backend/src/libs/db.js` chịu trách nhiệm kết nối database:

```js
import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING);
    console.log("Liên kết CSDL thành công!");
  } catch (error) {
    console.log("Lỗi khi kết nối CSDL:", error);
    process.exit(1);
  }
};
```

Phân tích:

- Chuỗi kết nối được lấy từ biến môi trường.
- Nếu kết nối thành công, server tiếp tục hoạt động.
- Nếu thất bại, chương trình dừng để tránh chạy trong trạng thái lỗi.

### 5.4. Phân tích các model chính

#### a. Model `User`

Model này lưu thông tin tài khoản người dùng.

Các trường quan trọng:

- `username`: tên đăng nhập, duy nhất.
- `hashedPassword`: mật khẩu đã mã hóa.
- `email`: email người dùng, duy nhất.
- `displayName`: tên hiển thị.
- `avatarUrl`, `avatarId`: chuẩn bị cho avatar.
- `bio`, `phone`: thông tin hồ sơ bổ sung.
- `timestamps`: tự động thêm `createdAt`, `updatedAt`.

#### b. Model `Session`

Model này lưu refresh token để quản lý phiên đăng nhập.

Các trường:

- `userId`: tham chiếu đến người dùng.
- `refreshToken`: mã ngẫu nhiên lưu trong cookie.
- `expiresAt`: thời điểm hết hạn.

Đặc biệt, model này có TTL index:

```js
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

TTL index giúp MongoDB tự động xóa session khi hết hạn. Đây là một điểm áp dụng tốt tính năng của MongoDB vào bài toán thực tế.

#### c. Model `Friend`

Model lưu quan hệ bạn bè đã được xác nhận giữa hai người dùng.

Đặc điểm:

- Gồm hai trường `userA` và `userB`.
- Có `pre("save")` để chuẩn hóa thứ tự hai id.
- Có unique index trên cặp `userA`, `userB` để tránh trùng quan hệ bạn bè.

Điều này giúp ngăn tình trạng cùng một cặp người dùng bị lưu hai lần theo thứ tự khác nhau.

#### d. Model `FriendRequest`

Model lưu lời mời kết bạn đang chờ xử lý.

Các trường:

- `from`: người gửi.
- `to`: người nhận.
- `message`: lời nhắn kèm theo.

Model có index:

- Unique index trên cặp `from`, `to`.
- Index riêng cho `from`.
- Index riêng cho `to`.

Những index này hỗ trợ tra cứu nhanh khi kiểm tra lời mời đang chờ hoặc lọc lời mời theo người dùng.

#### e. Model `Conversation` và `Message`

Dự án đã có bước chuẩn bị cho chức năng chat với hai model:

- `Conversation`: lưu danh sách thành viên, tin nhắn cuối, số lượng chưa đọc.
- `Message`: lưu nội dung tin nhắn và người gửi.

Tuy nhiên, ở thời điểm hiện tại các model này chưa được tích hợp hoàn chỉnh vào route và controller. Vì vậy trong phạm vi phần thực hành hiện tại, đây được xem là phần thiết kế và chuẩn bị mở rộng hệ thống.

### 5.5. Một số thao tác Mongoose được áp dụng

Trong các controller, nhóm đã sử dụng nhiều thao tác Mongoose thông dụng:

- `findOne()` để tìm user hoặc lời mời.
- `create()` để thêm dữ liệu mới.
- `findById()` để lấy dữ liệu theo id.
- `findByIdAndDelete()` để xóa dữ liệu.
- `exists()` để kiểm tra người dùng có tồn tại hay không.
- `populate()` để lấy thông tin chi tiết từ quan hệ tham chiếu.
- `lean()` để tối ưu kết quả khi chỉ cần object thuần.

Ví dụ trong `getAllFriends`:

```js
const friendships = await Friend.find({
  $or: [{ userA: userId }, { userB: userId }],
})
  .populate("userA", "_id displayName avatarUrl")
  .populate("userB", "_id displayName avatarUrl");
```

Đoạn mã này cho thấy Mongoose hỗ trợ rất tốt việc truy vấn dữ liệu có quan hệ tham chiếu mà vẫn giữ cú pháp đơn giản.

### 5.6. Bài tập ứng dụng của chương

Để minh chứng cho nội dung chương 5, nhóm có thể trình bày:

- Ảnh chụp collection `users`, `sessions`, `friends`, `friendrequests` trong MongoDB Compass.
- Ảnh chụp index trong MongoDB.
- Ảnh chụp dữ liệu session tự hết hạn sau TTL.
- Ảnh chụp dữ liệu trước và sau khi chấp nhận lời mời kết bạn.

### 5.7. Đánh giá chương

Việc kết hợp MongoDB và Mongoose giúp dự án backend sử dụng Express.js có tính linh hoạt cao, phù hợp với bài toán mạng xã hội và chat. Các model hiện tại tuy chưa hoàn chỉnh toàn bộ tính năng nhưng đã thể hiện được cách thiết kế dữ liệu khá sát với ứng dụng thực tế.

## Chương 6: Bảo mật và xác thực người dùng bằng JWT

### 6.1. Tầm quan trọng của xác thực trong backend

Trong các hệ thống có tài khoản người dùng, xác thực là bước bắt buộc để đảm bảo chỉ người hợp lệ mới được phép truy cập vào dữ liệu riêng tư. Đối với ứng dụng chat, xác thực càng quan trọng vì hệ thống quản lý thông tin cá nhân, quan hệ bạn bè và lịch sử giao tiếp.

### 6.2. Các kỹ thuật bảo mật được sử dụng trong dự án

Dự án hiện sử dụng các kỹ thuật bảo mật chính:

- Mã hóa mật khẩu bằng `bcrypt`.
- Xác thực người dùng bằng `JWT access token`.
- Quản lý phiên đăng nhập bằng `refresh token`.
- Lưu refresh token trong cookie `httpOnly`.
- Bảo vệ route riêng tư bằng middleware `protectedRoute`.

### 6.3. Mã hóa mật khẩu với bcrypt

Khi người dùng đăng ký, mật khẩu không được lưu trực tiếp vào database. Thay vào đó, dự án dùng `bcrypt.hash(password, 10)` để tạo chuỗi băm.

Ví dụ:

```js
const hashedPassword = await bcrypt.hash(password, 10);
```

Ưu điểm:

- Tránh lộ mật khẩu gốc nếu database bị rò rỉ.
- Tăng mức an toàn cho tài khoản người dùng.

Khi đăng nhập, hệ thống dùng:

```js
const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);
```

### 6.4. JWT access token

Sau khi đăng nhập thành công, server tạo access token:

```js
const accessToken = jwt.sign(
  { userId: user._id },
  process.env.ACCESS_TOKEN_SECRET,
  { expiresIn: "30m" }
);
```

Access token chứa `userId` và có thời hạn ngắn. Client dùng token này để gửi kèm theo các request tới route riêng tư.

Ví dụ header:

```http
Authorization: Bearer <access_token>
```

Ưu điểm của JWT:

- Không cần lưu session access token trên server.
- Phù hợp với RESTful API.
- Dễ tích hợp với frontend hoặc mobile app.

### 6.5. Refresh token và quản lý phiên

Ngoài access token, hệ thống còn tạo refresh token bằng `crypto.randomBytes(64).toString("hex")`. Refresh token được lưu:

- Trong cookie phía client.
- Trong collection `sessions` ở MongoDB.

Khi cần cấp lại access token, server kiểm tra refresh token có hợp lệ và còn hạn không. Đây là cách kết hợp giữa JWT và session-based refresh management.

Luồng hoạt động:

1. Người dùng đăng nhập.
2. Server tạo access token thời hạn ngắn.
3. Server tạo refresh token thời hạn dài hơn.
4. Refresh token được lưu trong cookie và database.
5. Khi access token hết hạn, client có thể yêu cầu cấp token mới bằng refresh token.

### 6.6. Middleware bảo vệ route

Các route liên quan đến bạn bè được gắn middleware `protectedRoute`:

```js
app.use("/api/friends", protectedRoute, friendRoute);
```

Điều đó có nghĩa:

- Nếu không có token, request bị từ chối với mã `401`.
- Nếu token sai hoặc hết hạn, request bị từ chối với mã `403`.
- Nếu token hợp lệ, thông tin user được gắn vào `req.user`.

Đây là cách rất phổ biến để bảo vệ API trong ứng dụng Express.js.

### 6.7. Phân tích API xác thực hiện có

#### a. `POST /api/auth/signup`

Chức năng:

- Kiểm tra dữ liệu đầu vào.
- Kiểm tra username đã tồn tại hay chưa.
- Mã hóa mật khẩu.
- Tạo người dùng mới.

Mã trạng thái:

- `400`: thiếu dữ liệu.
- `409`: username đã tồn tại.
- `204`: tạo tài khoản thành công.
- `500`: lỗi hệ thống.

#### b. `POST /api/auth/signin`

Chức năng:

- Kiểm tra đầu vào.
- Kiểm tra username có tồn tại không.
- So sánh mật khẩu.
- Tạo access token.
- Tạo refresh token.
- Lưu session.
- Trả cookie và JSON response.

Mã trạng thái:

- `400`: thiếu dữ liệu.
- `401`: sai username hoặc password.
- `200`: đăng nhập thành công.
- `500`: lỗi hệ thống.

#### c. `POST /api/auth/signout`

Chức năng:

- Lấy refresh token từ cookie.
- Xóa session tương ứng trong database.
- Xóa cookie phía client.

Mã trạng thái:

- `204`: đăng xuất thành công.
- `500`: lỗi hệ thống.

### 6.8. Các điểm mạnh trong thiết kế xác thực

Hệ thống xác thực hiện tại có một số điểm tốt:

- Không lưu mật khẩu gốc.
- Tách access token và refresh token.
- Có session riêng cho refresh token.
- Sử dụng cookie `httpOnly` để hạn chế truy cập từ JavaScript phía client.
- Tách xác thực thành middleware dùng lại được.

### 6.9. Hạn chế và hướng cải thiện

Bên cạnh các điểm mạnh, hệ thống vẫn còn một số hạn chế cần cải thiện:

- Route `refreshToken` đã có controller nhưng chưa được khai báo trong `authRoute.js`.
- Cookie `secure: true` phù hợp môi trường HTTPS, nhưng khi chạy local cần cấu hình phù hợp để dễ kiểm thử.
- Chưa có bước validate định dạng email và độ mạnh mật khẩu một cách chặt chẽ.
- Chưa có cơ chế phân quyền theo vai trò như `admin`, `user`.
- Chưa có giới hạn tần suất đăng nhập hoặc chống brute-force.

Những nội dung này có thể được bổ sung ở các phần phát triển tiếp theo để hệ thống hoàn thiện hơn.

### 6.10. Bài tập ứng dụng của chương

Để minh chứng chương này trong bản báo cáo chính thức, nhóm nên bổ sung:

- Ảnh chụp Postman khi đăng nhập thành công và nhận `accessToken`.
- Ảnh chụp cookie `refreshToken`.
- Ảnh chụp gọi API protected khi có token và khi không có token.
- Ảnh chụp collection `sessions` sau khi đăng nhập.
- Ảnh chụp kết quả đăng xuất và session bị xóa.

### 6.11. Đánh giá chương

Phần xác thực và bảo mật là nội dung quan trọng nhất của backend hiện tại, và cũng là phần được triển khai rõ ràng nhất trong dự án. Việc áp dụng `bcrypt`, `JWT`, cookie và middleware cho thấy nhóm đã tiếp cận đúng với quy trình xây dựng API bảo mật cơ bản trong một ứng dụng Express.js thực tế.

---

## Kết luận tạm thời đến hết Phần 2

Đến hết Phần 2, báo cáo đã trình bày được nền tảng lý thuyết của Express.js và cách áp dụng vào dự án backend chat thực tế. Các nội dung trọng tâm gồm khởi tạo môi trường, tổ chức cấu trúc dự án, cơ chế routing, controller, middleware, kết nối MongoDB bằng Mongoose, và xác thực người dùng bằng JWT đã được phân tích tương đối đầy đủ.

Từ mã nguồn hiện tại, có thể thấy dự án đã xây dựng được bộ khung backend tương đối rõ ràng với các chức năng cốt lõi như đăng ký, đăng nhập, đăng xuất và quản lý bạn bè. Đồng thời, dự án cũng đã chuẩn bị dữ liệu và định hướng cho các phần mở rộng như hội thoại, tin nhắn và realtime. Đây là nền tảng phù hợp để tiếp tục triển khai ở các phần sau của báo cáo như phân tích thiết kế hệ thống, triển khai API tổng hợp, kiểm thử và đánh giá kết quả.

## Gợi ý phần minh chứng nên chèn thêm khi xuất PDF

- Ảnh cấu trúc thư mục backend trong VS Code.
- Ảnh chạy terminal `npm run dev`.
- Ảnh MongoDB Compass với các collection đã tạo.
- Ảnh Postman test các API auth và friend.
- Ảnh header `Authorization: Bearer ...`.
- Ảnh cookie `refreshToken`.
- Ảnh response `200`, `201`, `204`, `401`, `403`.
