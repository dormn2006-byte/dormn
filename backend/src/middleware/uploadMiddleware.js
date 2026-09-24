

import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import {
  IMAGE_MAX_COUNT,
  VIDEO_ALLOWED_EXT,
  VIDEO_ALLOWED_MIME,
  VIDEO_MAX_BYTES,
  VIDEO_MAX_COUNT,
} from "../config/media.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure destination upload directory exists reliably at backend/src/uploads
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(
      null,
      uniqueName + path.extname(file.originalname)
    );
  },
});

// File Filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;

  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );

  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed"));
  }
};

// Multer Upload Middleware
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter,
});

export default upload;

// ==========================================
// PG MEDIA (photos + videos)
// ==========================================
//
// A single multer instance, because chaining two would not work: the first one
// consumes the multipart stream and the second sees nothing. That also means
// there is only ONE global `fileSize` limit, set to the video cap — the 5 MB
// photo cap is enforced afterwards by validateImageFiles().

export const UPLOAD_DIR = uploadDir;
export const VIDEO_DIR = path.join(uploadDir, "videos");

const mediaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Videos live in their own sub-folder so nginx can treat them separately.
    const destination = file.fieldname === "videos" ? VIDEO_DIR : UPLOAD_DIR;

    try {
      fs.mkdirSync(destination, { recursive: true });
    } catch (err) {
      return cb(err);
    }

    cb(null, destination);
  },

  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname).toLowerCase());
  },
});

// Tagged so the error handler can answer with the right status instead of a 500.
const rejectUpload = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const mediaFileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === "videos") {
    const allowed = VIDEO_ALLOWED_MIME.includes(file.mimetype) && VIDEO_ALLOWED_EXT.test(extension);
    return allowed
      ? cb(null, true)
      : cb(rejectUpload("Videos must be MP4, WebM or MOV format."));
  }

  const allowed = /jpeg|jpg|png|webp/.test(extension) && /jpeg|jpg|png|webp/.test(file.mimetype);
  return allowed
    ? cb(null, true)
    : cb(rejectUpload("Only JPG, PNG or WebP images are allowed."));
};

export const uploadPGMedia = multer({
  storage: mediaStorage,
  limits: {
    fileSize: VIDEO_MAX_BYTES,
    files: IMAGE_MAX_COUNT + VIDEO_MAX_COUNT,
  },
  fileFilter: mediaFileFilter,
}).fields([
  { name: "images", maxCount: IMAGE_MAX_COUNT },
  { name: "videos", maxCount: VIDEO_MAX_COUNT },
]);