// Mirrors backend/src/config/media.js — keep the two in sync.
// The client checks these so owners get instant feedback; the backend enforces
// them again (never trust the browser).

const num = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const IMAGE_MAX_COUNT = num(import.meta.env?.VITE_IMAGE_MAX_COUNT, 20);
export const VIDEO_MAX_COUNT = num(import.meta.env?.VITE_VIDEO_MAX_COUNT, 3);
export const VIDEO_MAX_MB = num(import.meta.env?.VITE_VIDEO_MAX_MB, 250);
export const VIDEO_MAX_BYTES = VIDEO_MAX_MB * 1024 * 1024;
export const VIDEO_MAX_SECONDS = num(import.meta.env?.VITE_VIDEO_MAX_SECONDS, 600);

export const VIDEO_ACCEPT = "video/mp4,video/webm,video/quicktime,video/x-m4v,video/ogg";

export const VIDEO_ALLOWED_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime", // .mov
  "video/x-m4v", // .m4v
  "video/ogg",
];

export const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds)) return "";
  const total = Math.round(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
};
