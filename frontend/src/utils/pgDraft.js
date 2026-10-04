// Local draft persistence for the "Add PG" wizard.
//
// The typed form state is small, so it lives in localStorage (synchronous and
// always available). The selected photos and videos are real File/Blob objects,
// which localStorage cannot hold — those go to IndexedDB, the one web storage
// that can hand the files back after a reload.

const META_KEY = "dormn:addPgDraft:v1";

const DB_NAME = "dormn-add-pg";
const DB_VERSION = 1;
const MEDIA_STORE = "media";
const MEDIA_KEY = "add-pg";

/* ── Scalar form state (localStorage) ── */

export const loadDraftMeta = () => {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

export const saveDraftMeta = (meta) => {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    /* quota exceeded or storage blocked — the draft simply won't persist */
  }
};

export const clearDraftMeta = () => {
  try {
    localStorage.removeItem(META_KEY);
  } catch {
    /* ignore */
  }
};

/* ── Selected files (IndexedDB) ── */

let dbPromise = null;

const openDB = () => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(MEDIA_STORE)) {
        db.createObjectStore(MEDIA_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }).catch((err) => {
    dbPromise = null; // let a later call retry instead of caching the failure
    throw err;
  });

  return dbPromise;
};

const withStore = async (mode, action) => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(MEDIA_STORE, mode);
    const request = action(tx.objectStore(MEDIA_STORE));

    tx.oncomplete = () => resolve(request ? request.result : undefined);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
};

const EXT_BY_TYPE = {
  "image/png": "png",
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

// Browsers keep a stored File intact through IndexedDB, but if we ever get a
// bare Blob back we rebuild a File so the upload still has a sensible name and
// extension for the server's type checks.
const ensureFile = (blob, fallbackName) => {
  if (!blob) return null;
  if (typeof File === "undefined" || blob instanceof File) return blob;

  const ext = EXT_BY_TYPE[blob.type] || (String(blob.type).startsWith("video/") ? "mp4" : "jpg");
  const name = blob.name || `${fallbackName}.${ext}`;
  return new File([blob], name, { type: blob.type || "" });
};

export const loadDraftMedia = async () => {
  let record;
  try {
    record = await withStore("readonly", (store) => store.get(MEDIA_KEY));
  } catch {
    return null;
  }
  if (!record) return null;

  const images = (record.images || []).map((item) => ensureFile(item, "photo")).filter(Boolean);

  const videos = (record.videos || [])
    .filter((v) => v && v.file)
    .map((v) => {
      const file = ensureFile(v.file, v.name || "video");
      return { file, name: file?.name || v.name || "video", duration: v.duration ?? null };
    });

  return { images, videos };
};

export const saveDraftMedia = async ({ images = [], videos = [] } = {}) => {
  try {
    await withStore("readwrite", (store) => store.put({ images, videos }, MEDIA_KEY));
  } catch {
    /* quota exceeded or IndexedDB blocked — media just won't persist */
  }
};

export const clearDraftMedia = async () => {
  try {
    await withStore("readwrite", (store) => store.delete(MEDIA_KEY));
  } catch {
    /* ignore */
  }
};

/* ── Convenience ── */

export const clearDraft = async () => {
  clearDraftMeta();
  await clearDraftMedia();
};

// A draft only counts as "started" once the owner has moved into the wizard or
// typed something, so opening Add PG fresh never looks like a restored draft.
export const hasDraftContent = (meta) => {
  if (!meta) return false;
  if (Number(meta.currentStep) >= 1) return true;
  const data = meta.formData || {};
  return Object.values(data).some((value) => value !== "" && value !== null && value !== undefined);
};
