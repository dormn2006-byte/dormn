import User from "../schemas/userSchema.js";
import { decryptUserObject } from "../utils/encryptionService.js";
import { serialize, asWriteResult } from "../utils/serialize.js";

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
  const isOwner = role === "owner";

  const user = await User.create({
    full_name,
    email,
    password,
    role: role || "student",
    phone: phone || null,
    profile_image: profile_image || null,
    gender: gender || null,
    is_email_verified: is_email_verified ? 1 : 0,
    auth_provider: auth_provider || "local",
    subscription_tier: isOwner ? subscription_tier : null,
    subscription_status: isOwner ? subscription_status : null,
    subscription_started_at: isOwner ? subscription_started_at : null,
    subscription_expires_at: isOwner ? subscription_expires_at : null,
    max_pg_listings: isOwner ? max_pg_listings : null,
  });

  return asWriteResult(user);
};

// Find User By Email
export const findUserByEmail = async (email) => {
  const user = await User.findOne({ email }).lean();
  return user ? serialize(decryptUserObject(user)) : null;
};

// Find User By ID
export const findUserById = async (id) => {
  const user = await User.findById(id).lean();
  return user ? serialize(decryptUserObject(user)) : null;
};

// Update User OTP
export const updateUserOTP = async (id, otp, expiry) => {
  return User.updateOne({ _id: id }, { otp_code: otp, otp_expiry: expiry });
};

// Clear User OTP
export const clearUserOTP = async (id) => {
  return User.updateOne({ _id: id }, { otp_code: null, otp_expiry: null });
};

// Update User Password (and clear OTP)
export const updateUserPassword = async (id, hashedPassword) => {
  return User.updateOne(
    { _id: id },
    { password: hashedPassword, otp_code: null, otp_expiry: null }
  );
};

// Save Email Verification OTP (valid for 10 minutes)
export const saveEmailVerificationOTP = async (id, otp, expiry) => {
  return User.updateOne(
    { _id: id },
    { email_otp_code: otp, email_otp_expiry: expiry }
  );
};

// Mark Email as Verified
export const verifyUserEmail = async (id) => {
  return User.updateOne(
    { _id: id },
    { is_email_verified: 1, email_otp_code: null, email_otp_expiry: null }
  );
};
