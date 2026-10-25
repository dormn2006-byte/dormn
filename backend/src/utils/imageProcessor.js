import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

// Disable Sharp disk cache to release file locks immediately on Windows
sharp.cache(false);

/**
 * Processes an uploaded image file: validates dimensions, converts to WebP,
 * resizes, compresses, and cleans up the original file safely.
 *
 * @param {Object} file - The file object from Multer (req.file)
 * @returns {String} - The new WebP filename
 */
export const processImage = async (file) => {
  const originalPath = file.path;

  try {
    // Read image into buffer to prevent open file handle lock on Windows
    const imageBuffer = await fs.readFile(originalPath);

    // Validate image dimensions before processing
    const metadata = await sharp(imageBuffer).metadata();
    
    if (metadata.width > 8000 || metadata.height > 8000) {
      try { await fs.unlink(originalPath); } catch {}
      const error = new Error("Image resolution is too high. Max allowed is 8000x8000 pixels.");
      error.statusCode = 400;
      throw error;
    }

    // Keep Multer's generated filename, just change extension to .webp
    const originalNameWithoutExt = path.parse(file.filename).name;
    const webpFilename = `${originalNameWithoutExt}.webp`;
    const webpPath = path.join(file.destination, webpFilename);

    // Optimize with Sharp: fit: "inside" and effort: 6
    await sharp(imageBuffer)
      .resize({ width: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80, effort: 6 })
      .toFile(webpPath);

    // Delete the original raw file (safe on Windows since sharp used in-memory buffer)
    try {
      await fs.unlink(originalPath);
    } catch (unlinkErr) {
      console.warn("Notice: could not unlink temporary file:", unlinkErr.message);
    }

    // Return the new .webp filename so the controller can save it to the DB
    return webpFilename;

  } catch (error) {
    console.error("Image Processing Error:", error);
    
    // Attempt to delete the partially uploaded/orphaned original file on failure
    try {
      await fs.unlink(originalPath);
    } catch {}
    
    if (!error.statusCode) {
      error.statusCode = 500;
      error.message = error.message || "Failed to process the uploaded image.";
    }
    
    throw error;
  }
};

/**
 * Compresses a base64 Data URI into an optimized WebP base64 Data URI using Sharp.
 *
 * @param {string} dataUrl - e.g. "data:image/jpeg;base64,..."
 * @param {number} [maxDimension=1200] - Max width/height
 * @param {number} [quality=82] - WebP quality
 * @returns {Promise<string>} - "data:image/webp;base64,..."
 */
export const compressBase64ToWebP = async (dataUrl, maxDimension = 1200, quality = 82) => {
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
    return dataUrl;
  }

  try {
    const commaIndex = dataUrl.indexOf(",");
    if (commaIndex === -1) return dataUrl;

    const base64Data = dataUrl.slice(commaIndex + 1);
    const buffer = Buffer.from(base64Data, "base64");
    if (!buffer || buffer.length === 0) return dataUrl;

    const compressedBuffer = await sharp(buffer)
      .resize({ width: maxDimension, height: maxDimension, fit: "inside", withoutEnlargement: true })
      .webp({ quality, effort: 6 })
      .toBuffer();

    return `data:image/webp;base64,${compressedBuffer.toString("base64")}`;
  } catch (err) {
    console.error("Backend WebP compression fallback:", err?.message || err);
    return dataUrl;
  }
};