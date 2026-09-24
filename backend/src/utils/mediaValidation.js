// Pure validation helpers for multipart uploads.
//
// Kept free of Express/multer so they can be unit tested directly. multer only
// supports a single global `fileSize` limit, so the per-type caps (5 MB images
// vs 250 MB videos) have to be enforced here rather than in the middleware.

import fs from "fs/promises";
import {
  IMAGE_MAX_BYTES,
  IMAGE_MAX_COUNT,
  IMAGE_MAX_MB,
  VIDEO_ALLOWED_MIME,
  VIDEO_MAX_BYTES,
  VIDEO_MAX_COUNT,
  VIDEO_MAX_MB,
} from "../config/media.js";

const ok = () => ({ ok: true });
const fail = (error) => ({ ok: false, error });

export const validateImageFiles = (files = []) => {
  if (files.length > IMAGE_MAX_COUNT) {
    return fail(`You can upload a maximum of ${IMAGE_MAX_COUNT} photos.`);
  }

  const oversized = files.find((file) => file.size > IMAGE_MAX_BYTES);
  if (oversized) {
    return fail(`Each photo must be ${IMAGE_MAX_MB} MB or smaller.`);
  }

  return ok();
};

export const validateVideoFiles = (files = []) => {
  if (files.length > VIDEO_MAX_COUNT) {
    return fail(`You can upload a maximum of ${VIDEO_MAX_COUNT} videos.`);
  }

  for (const file of files) {
    if (!VIDEO_ALLOWED_MIME.includes(file.mimetype)) {
      return fail("Videos must be MP4, WebM or MOV format.");
    }

    if (file.size > VIDEO_MAX_BYTES) {
      return fail(`Each video must be ${VIDEO_MAX_MB} MB or smaller.`);
    }
  }

  return ok();
};

/**
 * Pairs uploaded video files with the durations measured in the browser, which
 * arrive as a parallel JSON array. A missing or shorter array simply leaves the
 * affected durations null rather than failing the whole upload.
 *
 * `video_url` is stored relative to the uploads root ("videos/<file>") so the
 * frontend's existing `/uploads/` prefix produces the right URL.
 */
export const buildVideoEntries = (videoFiles = [], rawDurations) => {
  const durations = Array.isArray(rawDurations) ? rawDurations : [];

  return videoFiles.map((file, index) => {
    const seconds = Number(durations[index]);

    return {
      video_url: `videos/${file.filename}`,
      duration_seconds: Number.isFinite(seconds) ? Math.round(seconds) : null,
    };
  });
};

/**
 * Best-effort cleanup used to roll back a rejected upload. Accepts multer file
 * objects (which carry `.path`) or plain absolute paths.
 */
export const unlinkFiles = async (entries = []) => {
  await Promise.all(
    entries.map(async (entry) => {
      const target = typeof entry === "string" ? entry : entry?.path;
      if (!target) return;
      try {
        await fs.unlink(target);
      } catch {
        /* already gone — nothing to do */
      }
    })
  );
};
