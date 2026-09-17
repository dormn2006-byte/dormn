import pool from "../config/db.js";
import { decryptUserObject } from "../utils/encryptionService.js";

// Create New User
export const createUser = async ({
  full_name,
  email,
  password,
  role,
  phone,
  profile_image,
  gender,
  is_email_verified = 0,
  auth_provider = "local",
  subscription_tier = "free",
  subscription_status = "trial",
  subscription_started_at = new Date(),
  subscription_expires_at = null,
  max_pg_listings = 1,
}) => {
  const query = `
    INSERT INTO users (
      full_name,
      email,
      password,
      role,
      phone,
      profile_image,
      gender,
      is_email_verified,
      auth_provider,
      subscription_tier,
      subscription_status,
      subscription_started_at,
      subscription_expires_at,
      max_pg_listings
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    full_name,
    email,
    password,
    role || "student",
    phone || null,
    profile_image || null,
    gender || null,
    is_email_verified ? 1 : 0,
    auth_provider || "local",
    role === "owner" ? subscription_tier : null,
    role === "owner" ? subscription_status : null,
    role === "owner" ? subscription_started_at : null,
    role === "owner" ? subscription_expires_at : null,
    role === "owner" ? max_pg_listings : null,
  ];

  const [result] = await pool.execute(query, values);

  return result;
};

// Find User By Email
export const findUserByEmail = async (email) => {
  const query = `
    SELECT * FROM users
    WHERE email = ?
    LIMIT 1
  `;

  const [rows] = await pool.execute(query, [email]);

  return rows[0] ? decryptUserObject(rows[0]) : null;
};

// Find User By ID
export const findUserById = async (id) => {
  const query = `
    SELECT * FROM users
    WHERE id = ?
    LIMIT 1
  `;

  const [rows] = await pool.execute(query, [id]);

  return rows[0] ? decryptUserObject(rows[0]) : null;
};

// Update User OTP
export const updateUserOTP = async (id, otp, expiry) => {
  const query = `
    UPDATE users 
    SET otp_code = ?, otp_expiry = ? 
    WHERE id = ?
  `;
  
  const [result] = await pool.execute(query, [otp, expiry, id]);
  
  return result;
};

// Clear User OTP
export const clearUserOTP = async (id) => {
  const query = `
    UPDATE users 
    SET otp_code = NULL, otp_expiry = NULL 
    WHERE id = ?
  `;
  
  const [result] = await pool.execute(query, [id]);
  
  return result;
};

// Update User Password (and clear OTP)
export const updateUserPassword = async (id, hashedPassword) => {
  const query = `
    UPDATE users 
    SET password = ?, otp_code = NULL, otp_expiry = NULL 
    WHERE id = ?
  `;
  
  const [result] = await pool.execute(query, [hashedPassword, id]);
  
  return result;
};

// Save Email Verification OTP (valid for 10 minutes)
export const saveEmailVerificationOTP = async (id, otp, expiry) => {
  const [res] = await pool.execute("UPDATE users SET email_otp_code = ?, email_otp_expiry = ? WHERE id = ?", [otp, expiry, id]);
  return res;
};

// Mark Email as Verified
export const verifyUserEmail = async (id) => {
  const [res] = await pool.execute("UPDATE users SET is_email_verified = 1, email_otp_code = NULL, email_otp_expiry = NULL WHERE id = ?", [id]);
  return res;
};