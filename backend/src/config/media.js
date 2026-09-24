// Upload limits for PG media, in one place so the multer config, the controller
// validation and the error messages can't drift apart.
//
// dotenv is loaded here (the same pattern emailService.js uses) because in ESM
// every import is evaluated before server.js reaches its own dotenv.config(),
// so a module-level read of process.env would otherwise see nothing.

import dotenv from "dotenv";

dotenv.config({ quiet: true });

const MB = 1024 * 1024;

const positiveInt = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
};

// ── Images (existing behaviour: 20 photos, 5 MB each) ──
export const IMAGE_MAX_COUNT = positiveInt(process.env.IMAGE_MAX_COUNT, 20);
export const IMAGE_MAX_MB = positiveInt(process.env.IMAGE_MAX_MB, 5);
export const IMAGE_MAX_BYTES = IMAGE_MAX_MB * MB;

// ── Videos (3 clips, 10 minutes, 250 MB each) ──
export const VIDEO_MAX_COUNT = positiveInt(process.env.VIDEO_MAX_COUNT, 3);
export const VIDEO_MAX_MB = positiveInt(process.env.VIDEO_MAX_MB, 250);
export const VIDEO_MAX_BYTES = VIDEO_MAX_MB * MB;
export const VIDEO_MAX_SECONDS = positiveInt(process.env.VIDEO_MAX_SECONDS, 600);

export const VIDEO_ALLOWED_MIME = [
  "video/mp4",
  "video/webm",
  "video/quicktime", // .mov
  "video/x-m4v", // .m4v
  "video/ogg",
];

export const VIDEO_ALLOWED_EXT = /\.(mp4|webm|mov|m4v|ogv|ogg)$/i;
