import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinary } from "../utils/cloudinary.js";

// ─── Cloudinary Storage Config ────────────────────────────────
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isImage = file.mimetype.startsWith("image/");
    const folder = isImage
      ? "legalsaathi/documents/images"
      : "legalsaathi/documents/pdfs";

    return {
      folder,
      resource_type: isImage ? "image" : "raw", // PDFs need "raw" for public access
      allowed_formats: ["pdf", "jpg", "jpeg", "png", "webp"],
      public_id: `${req.user?._id || "unknown"}_${Date.now()}`,
      ...(isImage && {
        transformation: [{ quality: "auto:good" }],
      }),
    };
  },
});

// ─── File Filter ──────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only PDF, JPG, PNG, and WEBP are allowed."),
      false
    );
  }
};

// ─── Multer Instance ──────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 1,
  },
});

// ─── Single File Upload Middleware ────────────────────────────
export const uploadDocument = upload.single("file");

// ─── Upload Error Handler ─────────────────────────────────────
export const handleUploadError = (req, res, next) => {
  uploadDocument(req, res, (err) => {
    if (!err) return next();

    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 10MB.",
      });
    }

    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Only one file can be uploaded at a time.",
      });
    }

    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: 'File field must be named "file".',
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message || "File upload failed.",
    });
  });
};