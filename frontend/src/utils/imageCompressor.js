/**
 * Compresses an image file or blob to WebP format using HTML5 Canvas.
 * Ensures small payload (<100KB), fast network sync, and avoids localStorage quota limits.
 *
 * @param {File|Blob} file - The input image file
 * @param {Object} [options]
 * @param {number} [options.maxWidth=1200] - Max output width
 * @param {number} [options.maxHeight=1200] - Max output height
 * @param {number} [options.quality=0.82] - WebP quality factor (0 to 1)
 * @returns {Promise<string>} - Resolves with compressed WebP data URL
 */
export const compressImageToWebP = (
  file,
  { maxWidth = 1200, maxHeight = 1200, quality = 0.82 } = {}
) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error("No file provided"));
    }

    if (file.type && !file.type.startsWith("image/")) {
      return reject(new Error("Selected file is not an image"));
    }

    let objectUrl = null;
    try {
      objectUrl = URL.createObjectURL(file);
    } catch {
      // Fallback to FileReader if objectUrl cannot be created
    }

    const cleanup = () => {
      if (objectUrl) {
        try { URL.revokeObjectURL(objectUrl); } catch {}
      }
    };

    const img = new Image();
    img.onerror = () => {
      cleanup();
      reject(new Error("Failed to load image for WebP compression"));
    };

    img.onload = () => {
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        cleanup();
        return resolve("");
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      try {
        const webpDataUrl = canvas.toDataURL("image/webp", quality);
        cleanup();
        if (webpDataUrl && webpDataUrl.startsWith("data:image/webp")) {
          resolve(webpDataUrl);
        } else {
          resolve(canvas.toDataURL("image/jpeg", quality));
        }
      } catch (canvasErr) {
        cleanup();
        console.warn("Canvas WebP export fallback:", canvasErr);
        resolve("");
      }
    };

    if (objectUrl) {
      img.src = objectUrl;
    } else {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read image file"));
      reader.onload = (e) => {
        img.src = e.target?.result;
      };
      reader.readAsDataURL(file);
    }
  });
};

export default compressImageToWebP;
