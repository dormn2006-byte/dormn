import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

// Ensure a strictly 32-byte (256-bit) master encryption key derived with SHA-256
const SECRET_SEED = process.env.DATA_ENCRYPTION_KEY || process.env.JWT_SECRET || "dormn_secure_enterprise_encryption_key_2026_aes256";
const ENCRYPTION_KEY = crypto.createHash("sha256").update(String(SECRET_SEED)).digest();
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // Standard 96 bits for GCM
const PREFIX = "enc:";

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Output format: enc:<iv_hex>:<authTag_hex>:<cipherText_hex>
 * @param {string|number|null} text
 * @returns {string|null}
 */
export const encrypt = (text) => {
  if (text === null || text === undefined) return null;
  const str = String(text);
  if (str.trim() === "") return "";
  // If already encrypted, do not re-encrypt
  if (str.startsWith(PREFIX)) return str;

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

    let encrypted = cipher.update(str, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    return `${PREFIX}${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
  } catch (error) {
    console.error("[ENCRYPTION] Failed to encrypt data:", error.message);
    return str; // Fallback to avoid data loss
  }
};

/**
 * Decrypts an AES-256-GCM encrypted string.
 * Gracefully returns unencrypted text as-is for backward compatibility.
 * @param {string|null} cipherText
 * @returns {string|null}
 */
export const decrypt = (cipherText) => {
  if (!cipherText || typeof cipherText !== "string") return cipherText;
  if (!cipherText.startsWith(PREFIX)) return cipherText; // Not encrypted, return plain

  try {
    const parts = cipherText.slice(PREFIX.length).split(":");
    if (parts.length !== 3) return cipherText;

    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.warn("[ENCRYPTION] Decryption failed or tag mismatch, returning raw text:", error.message);
    return cipherText;
  }
};

/**
 * Helper to decrypt sensitive user fields when reading a user from the database.
 * @param {object} user
 * @returns {object}
 */
export const decryptUserObject = (user) => {
  if (!user || typeof user !== "object") return user;
  const decrypted = { ...user };

  const SENSITIVE_FIELDS = [
    "account_number",
    "ifsc_code",
    "upi_id",
    "account_holder",
    "bank_name",
    "pan_number",
    "gstin",
    "aadhaar_masked",
    "secondary_phone"
  ];

  for (const field of SENSITIVE_FIELDS) {
    if (decrypted[field]) {
      decrypted[field] = decrypt(decrypted[field]);
    }
  }

  return decrypted;
};

/**
 * Helper to decrypt sensitive enrollment fields when reading an enrollment form or student profile.
 * @param {object} form
 * @returns {object}
 */
export const decryptEnrollmentObject = (form) => {
  if (!form || typeof form !== "object") return form;
  const decrypted = { ...form };

  const SENSITIVE_FIELDS = [
    "parent_1_phone",
    "parent_2_phone",
    "guardian_phone",
    "parent1Phone",
    "parent2Phone",
    "guardianPhone",
    "college_id_number",
    "collegeIdNumber",
    "aadhar_number",
    "aadharNumber",
    "medical_details",
    "medicalDetails",
    "allergies"
  ];

  for (const field of SENSITIVE_FIELDS) {
    if (decrypted[field]) {
      decrypted[field] = decrypt(decrypted[field]);
    }
  }

  return decrypted;
};

export default {
  encrypt,
  decrypt,
  decryptUserObject,
  decryptEnrollmentObject,
};
