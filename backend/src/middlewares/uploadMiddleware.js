import multer, { MulterError, memoryStorage } from "multer";
import { v2 as cloudinary } from "cloudinary";

export const upload = multer({
  storage: memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype?.startsWith("image/")) {
      cb(null, true);
      return;
    }

    cb(new Error("Chỉ chấp nhận file ảnh"));
  },
});

export const uploadMessageImage = (req, res, next) => {
  console.log("🎯 uploadMessageImage middleware called");
  upload.single("image")(req, res, (error) => {
    console.log("🎯 upload.single callback - error:", error ? error.message : "none");
    
    if (!error) {
      console.log("✅ File uploaded:", req.file ? `${req.file.size} bytes` : "null");
      next();
      return;
    }

    if (error instanceof MulterError) {
      console.log("❌ MulterError:", error.code);
      if (error.code === "LIMIT_FILE_SIZE") {
        res.status(413).json({ message: "Ảnh vượt quá dung lượng cho phép 5MB" });
        return;
      }

      res.status(400).json({ message: error.message });
      return;
    }

    console.log("❌ Other error:", error.message);
    res.status(400).json({ message: error.message || "Upload ảnh không hợp lệ" });
  });
};

export const uploadImageFromBuffer = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET?.trim();
    const uploadOptions = {
      folder: "CCNLTHD/avatars",
      resource_type: "image",
      transformation: [{ width: 200, height: 200, crop: "fill" }],
      ...options,
    };

    if (!uploadPreset) {
      reject(
        new Error(
          "Thiếu CLOUDINARY_UPLOAD_PRESET. Hãy tạo unsigned upload preset trong Cloudinary Dashboard."
        )
      );
      return;
    }

    const unsignedStream = cloudinary.uploader.unsigned_upload_stream(
      uploadPreset,
      uploadOptions,
      (error, result) => {
        if (!error) {
          resolve(result);
          return;
        }

        reject(error);
      }
    );

    unsignedStream.end(buffer);
  });
};