import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./libs/db.js";
import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import friendRoute from "./routes/friendRoute.js";
// import messageRoute from "./routes/messageRoute.js";
// import conversationRoute from "./routes/conversationRoute.js";
import cookieParser from "cookie-parser";
import { protectedRoute } from "./middlewares/authMiddleware.js";
import cors from "cors";
// import swaggerUi from "swagger-ui-express";
// import fs from "fs";
// import { app, server } from "./socket/index.js";
// import { v2 as cloudinary } from "cloudinary";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const allowedOrigins = [process.env.CLIENT_URL].filter(Boolean);
const localhostOriginRegex = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

// middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser clients and explicitly allow configured frontend origins.
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        localhostOriginRegex.test(origin)
      ) {
        return callback(null, true);
      }

      return callback(new Error("CORS không cho phép origin này."));
    },
    credentials: true,
  }),
);

// CLOUDINARY Configuration
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// swagger
// const swaggerDocument = JSON.parse(fs.readFileSync("./src/swagger.json", "utf8"));

// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// public routes
app.use("/api/auth", authRoute);

// private routes
// app.use(protectedRoute);
app.use("/api/users", protectedRoute, userRoute);
app.use("/api/friends", protectedRoute, friendRoute);
// app.use("/api/messages", messageRoute);
// app.use("/api/conversations", conversationRoute);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`server bắt đầu trên cổng ${PORT}`);
  });
});
