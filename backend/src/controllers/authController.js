import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import {
  createUser,
  findUserByEmail,
  findUserById,
  updateUserOTP, 
  clearUserOTP,
  updateUserPassword,
  saveEmailVerificationOTP,
  verifyUserEmail,
} from "../models/userModel.js";
import User from "../schemas/userSchema.js";
import {
  sendOTPEmail,
  sendEmailVerificationOTP,
  sendLoginAlert,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordChangedAlert,
} from "../utils/emailService.js";
import { validatePasswordStrength, logSecurityAudit } from "../utils/securityAuditService.js";
import { encrypt } from "../utils/encryptionService.js";

/** Helper to format user response safely */
export const formatAuthUser = (user) => ({
  id: user.id,
  full_name: user.full_name,
  email: user.email,
  role: user.role,
  phone: user.phone || null,
  secondary_phone: user.secondary_phone || null,
  gender: user.gender,
  profile_image: user.profile_image || null,
  is_email_verified: Boolean(user.is_email_verified) || user.auth_provider === "google",
  auth_provider: user.auth_provider || "local",
  subscription_tier: user.subscription_tier,
  subscription_status: user.subscription_status,
  max_pg_listings: user.max_pg_listings,
  bank_name: user.bank_name || null,
  account_holder: user.account_holder || null,
  account_number: user.account_number || null,
  ifsc_code: user.ifsc_code || null,
  upi_id: user.upi_id || null,
  business_name: user.business_name || null,
  office_address: user.office_address || null,
  city: user.city || null,
  state: user.state || null,
  pincode: user.pincode || null,
  operating_since: user.operating_since || null,
  pan_number: user.pan_number || null,
  gstin: user.gstin || null,
  aadhaar_masked: user.aadhaar_masked || null,
  is_payout_configured: Boolean(user.account_number && user.ifsc_code && user.account_holder),
});

/** Helper to resolve user from request session or email */
const getRequestUser = async (req) => {
  if (req.user?.id) return findUserById(req.user.id);
  if (req.body?.email) return findUserByEmail(req.body.email);
  return null;
};

/** Helper to generate and save a 6-digit numeric OTP */
const generateAndSaveOTP = async (userId, expiryMinutes = 5) => {
  const otp = crypto.randomInt(100000, 999999).toString();
  const expiry = new Date(Date.now() + expiryMinutes * 60 * 1000);
  await updateUserOTP(userId, otp, expiry);
  return otp;
};

/** Helper to generate JWT Token */
const signToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// 1. REGISTER USER
export const registerUser = async (req, res) => {
  try {
    const { full_name, email, password, role = "student", phone, profile_image, gender } = req.body;

    if (!full_name || !email || !password) {
      await logSecurityAudit({ req, eventType: "REGISTER_FAILED", email, status: "FAILED", details: "Missing required registration fields" });
      return res.status(400).json({ success: false, message: "Please provide all required fields" });
    }

    // Password Security Audit Validation: > 8 chars, 1 uppercase, 1 lowercase, 1 number
    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.isValid) {
      await logSecurityAudit({
        req,
        eventType: "REGISTER_FAILED",
        email,
        status: "FAILED",
        details: `Password rejected by security audit: ${passwordCheck.message}`,
      });
      return res.status(400).json({
        success: false,
        message: passwordCheck.message,
        errors: passwordCheck.errors,
      });
    }

    let cleanGender = gender ? String(gender).toLowerCase().trim().replace(/\s+/g, "_") : null;
    if (["prefer_not_to_say", "other", "prefer_not_to_disclose"].includes(cleanGender)) {
      cleanGender = "prefer_not_to_say";
    }

    // Public self-registration allows 'student' or 'owner'. Restrict administrative roles.
    let targetRole = role;
    if (!["student", "owner"].includes(targetRole)) {
      targetRole = "student";
    }

    if (targetRole === "student" || targetRole === "owner") {
      if (!cleanGender || !["male", "female", "prefer_not_to_say"].includes(cleanGender)) {
        return res.status(400).json({ success: false, message: "Please select your gender (Male, Female, or Prefer not to say)" });
      }
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      await logSecurityAudit({
        req,
        eventType: "REGISTER_FAILED",
        email,
        status: "FAILED",
        details: "Attempted to register existing email address",
      });
      return res.status(409).json({ success: false, message: "User already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await createUser({
      full_name,
      email,
      password: hashedPassword,
      role: targetRole,
      phone,
      profile_image,
      gender: cleanGender,
      is_email_verified: 0,
      auth_provider: "local",
      ...(targetRole === "owner" && {
        subscription_tier: "free",
        subscription_status: "trial",
        subscription_started_at: new Date(),
        subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        max_pg_listings: 1,
      }),
    });

    sendWelcomeEmail(email, full_name, role).catch(() => {});

    // Security Audit Log: Successful registration
    await logSecurityAudit({
      req,
      eventType: "REGISTER_SUCCESS",
      userId: result.insertId,
      email,
      status: "SUCCESS",
      details: `Account registered successfully with role: ${role}`,
    });

    const newUser = {
      id: result.insertId,
      full_name,
      email,
      role,
      gender: cleanGender,
      is_email_verified: false,
      auth_provider: "local",
    };
    const token = signToken(newUser);

    return res.status(201).json({ success: true, message: "User registered successfully", token, user: newUser });
  } catch (error) {
    console.error("Register Error:", error);
    logSecurityAudit({ req, eventType: "REGISTER_ERROR", email: req.body?.email, status: "ERROR", details: error.message });
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// 2. REQUEST OTP (For Login)
export const requestOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ success: false, message: "Account not found" });

    const otp = await generateAndSaveOTP(user.id, 5);
    await sendOTPEmail(email, otp);

    return res.status(200).json({ success: true, message: "OTP sent to email" });
  } catch (error) {
    console.error("Request OTP Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// 3. LOGIN USER (Password OR OTP)
export const loginUser = async (req, res) => {
  try {
    const { email, password, otp } = req.body;

    if (!email || (!password && !otp)) {
      logSecurityAudit({ req, eventType: "LOGIN_FAILED", email, status: "FAILED", details: "Missing email or credentials" });
      return res.status(400).json({ success: false, message: "Email and either password or OTP are required" });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      logSecurityAudit({ req, eventType: "LOGIN_FAILED", email, status: "FAILED", details: "User not found" });
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (otp) {
      const now = new Date();
      if (!user.otp_code || user.otp_code !== String(otp).trim() || new Date(user.otp_expiry) < now) {
        logSecurityAudit({ req, eventType: "LOGIN_FAILED", userId: user.id, email, status: "FAILED", details: "Invalid or expired OTP" });
        return res.status(401).json({ success: false, message: "Invalid or expired OTP" });
      }
      await clearUserOTP(user.id);
    } else {
      const isPasswordMatched = await bcrypt.compare(password, user.password);
      if (!isPasswordMatched) {
        logSecurityAudit({ req, eventType: "LOGIN_FAILED", userId: user.id, email, status: "FAILED", details: "Invalid password credentials" });
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }
    }

    const token = signToken(user);
    if (user.email) sendLoginAlert(user.email, user.full_name).catch(() => {});

    logSecurityAudit({
      req,
      eventType: "LOGIN_SUCCESS",
      userId: user.id,
      email: user.email,
      status: "SUCCESS",
      details: `Login successful via ${otp ? "OTP" : "password"}`,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        gender: user.gender,
        profile_image: user.profile_image,
        is_email_verified: Boolean(user.is_email_verified) || user.auth_provider === "google",
        auth_provider: user.auth_provider || "local",
        subscription_tier: user.subscription_tier,
        subscription_status: user.subscription_status,
      }
    });
  } catch (error) {
    console.error("Login Error:", error);
    logSecurityAudit({ req, eventType: "LOGIN_ERROR", email: req.body?.email, status: "ERROR", details: error.message });
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// 4. FORGOT PASSWORD (Request Reset Code)
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ success: false, message: "No account registered with this email" });

    const otp = await generateAndSaveOTP(user.id, 10);
    await sendPasswordResetEmail(email, otp, user.full_name);

    logSecurityAudit({
      req,
      eventType: "PASSWORD_RESET_REQUESTED",
      userId: user.id,
      email: user.email,
      status: "SUCCESS",
      details: "Password reset OTP dispatched to email",
    });

    return res.status(200).json({ success: true, message: "Password reset code sent to your email." });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
};

// 5. RESET PASSWORD (Verify Code & Save New Password)
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "Email, reset code, and new password are required" });
    }

    // Password Security Audit Validation: > 8 chars, 1 uppercase, 1 lowercase, 1 number
    const passwordCheck = validatePasswordStrength(newPassword);
    if (!passwordCheck.isValid) {
      logSecurityAudit({
        req,
        eventType: "PASSWORD_RESET_FAILED",
        email,
        status: "FAILED",
        details: `Reset password rejected by security audit: ${passwordCheck.message}`,
      });
      return res.status(400).json({
        success: false,
        message: passwordCheck.message,
        errors: passwordCheck.errors,
      });
    }

    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ success: false, message: "Account not found" });

    const now = new Date();
    if (!user.otp_code || user.otp_code !== String(otp).trim() || new Date(user.otp_expiry) < now) {
      logSecurityAudit({
        req,
        eventType: "PASSWORD_RESET_FAILED",
        userId: user.id,
        email,
        status: "FAILED",
        details: "Invalid or expired reset OTP code",
      });
      return res.status(400).json({ success: false, message: "Invalid or expired reset code. Please request a new one." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await updateUserPassword(user.id, hashedPassword);

    sendPasswordChangedAlert(user.email, user.full_name).catch(() => {});

    logSecurityAudit({
      req,
      eventType: "PASSWORD_RESET_SUCCESS",
      userId: user.id,
      email: user.email,
      status: "SUCCESS",
      details: "Password reset completed successfully",
    });

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully. Please log in with your new password."
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
};

// 6. GOOGLE AUTH (Verify ID Token & Login / Register)
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth = async (req, res) => {
  try {
    const { token, role = "student", gender } = req.body;
    if (!token) return res.status(400).json({ success: false, message: "Google token is required" });

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { email, name, picture } = ticket.getPayload() || {};
    if (!email) return res.status(400).json({ success: false, message: "Invalid Google token payload" });

    let user = await findUserByEmail(email);

    if (!user) {
      const assignedRole = ["owner", "student"].includes(role) ? role : "student";
      const cleanGender = ["male", "female"].includes(gender) ? gender : "prefer_not_to_say";
      const hashedPassword = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);

      const result = await createUser({
        full_name: name || "Google User",
        email,
        password: hashedPassword,
        role: assignedRole,
        phone: null,
        profile_image: picture || null,
        gender: cleanGender,
        is_email_verified: 1,
        auth_provider: "google",
        ...(assignedRole === "owner" && {
          subscription_tier: "free",
          subscription_status: "trial",
          subscription_started_at: new Date(),
          subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          max_pg_listings: 1,
        }),
      });

      user = {
        id: result.insertId,
        full_name: name || "Google User",
        email,
        role: assignedRole,
        gender: cleanGender,
        profile_image: picture,
        is_email_verified: 1,
        auth_provider: "google",
      };
      sendWelcomeEmail(email, user.full_name, assignedRole).catch(() => {});
    } else {
      // If user exists, mark email as verified since authenticated via Google
      if (!user.is_email_verified) {
        await User.updateOne({ _id: user.id }, { is_email_verified: 1 });
        user.is_email_verified = 1;
      }
    }

    const authToken = signToken(user);
    sendLoginAlert(user.email, user.full_name).catch(() => {});

    return res.status(200).json({
      success: true,
      message: "Google authentication successful",
      token: authToken,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        gender: user.gender,
        profile_image: user.profile_image || picture,
        is_email_verified: true,
        auth_provider: user.auth_provider || "google",
        subscription_tier: user.subscription_tier,
        subscription_status: user.subscription_status,
      }
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    return res.status(401).json({ success: false, message: "Google token verification failed. Please try again." });
  }
};

// 7. CHANGE PASSWORD (Authenticated)
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Current password and new password are required" });
    }

    // Password Security Audit Validation: > 8 chars, 1 uppercase, 1 lowercase, 1 number
    const passwordCheck = validatePasswordStrength(newPassword);
    if (!passwordCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: passwordCheck.message,
        errors: passwordCheck.errors,
      });
    }

    const user = await findUserById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User account not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Current password does not match" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await updateUserPassword(userId, hashedPassword);

    if (user.email) sendPasswordChangedAlert(user.email, user.full_name).catch(() => {});

    return res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    console.error("Change Password Error:", error);
    return res.status(500).json({ success: false, message: "Failed to change password. Please try again." });
  }
};

// 8. GET PROFILE (Authenticated)
export const getProfile = async (req, res) => {
  try {
    const user = await findUserById(req.user?.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.status(200).json({
      success: true,
      user: formatAuthUser(user),
    });
  } catch (error) {
    console.error("Get Profile Error:", error);
    return res.status(500).json({ success: false, message: "Failed to retrieve profile" });
  }
};

// 9. UPDATE PROFILE (Authenticated)
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const {
      full_name, phone, secondary_phone, gender, profile_image,
      business_name, office_address, city, state, pincode, operating_since,
      pan_number, gstin, aadhaar_masked
    } = req.body;

    const user = await findUserById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const updatedName = full_name !== undefined ? full_name : user.full_name;
    const updatedPhone = phone !== undefined ? phone : user.phone;
    const updatedSecPhone = secondary_phone !== undefined ? encrypt(secondary_phone) : (user.secondary_phone ? encrypt(user.secondary_phone) : null);
    const updatedGender = gender !== undefined ? gender : user.gender;
    const updatedImage = profile_image !== undefined ? profile_image : user.profile_image;
    const updatedBusiness = business_name !== undefined ? business_name : user.business_name;
    const updatedAddress = office_address !== undefined ? office_address : user.office_address;
    const updatedCity = city !== undefined ? city : user.city;
    const updatedState = state !== undefined ? state : user.state;
    const updatedPincode = pincode !== undefined ? pincode : user.pincode;
    const updatedOperatingSince = operating_since !== undefined ? operating_since : user.operating_since;
    const updatedPan = pan_number !== undefined ? encrypt(pan_number) : (user.pan_number ? encrypt(user.pan_number) : null);
    const updatedGstin = gstin !== undefined ? encrypt(gstin) : (user.gstin ? encrypt(user.gstin) : null);
    const updatedAadhaar = aadhaar_masked !== undefined ? encrypt(aadhaar_masked) : (user.aadhaar_masked ? encrypt(user.aadhaar_masked) : null);

    await User.updateOne(
      { _id: userId },
      {
        full_name: updatedName,
        phone: updatedPhone,
        secondary_phone: updatedSecPhone,
        gender: updatedGender,
        profile_image: updatedImage,
        business_name: updatedBusiness,
        office_address: updatedAddress,
        city: updatedCity,
        state: updatedState,
        pincode: updatedPincode,
        operating_since: updatedOperatingSince,
        pan_number: updatedPan,
        gstin: updatedGstin,
        aadhaar_masked: updatedAadhaar,
      }
    );

    const updatedUser = await findUserById(userId);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: formatAuthUser(updatedUser)
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

// 10. UPDATE PAYOUT DETAILS (Authenticated)
export const updatePayoutDetails = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { account_holder, bank_name, account_number, ifsc_code, upi_id } = req.body;

    if (!account_holder || !String(account_holder).trim()) {
      return res.status(400).json({ success: false, message: "Beneficiary Name is required" });
    }
    if (!bank_name || !String(bank_name).trim()) {
      return res.status(400).json({ success: false, message: "Bank Name is required" });
    }
    if (!account_number || !String(account_number).trim()) {
      return res.status(400).json({ success: false, message: "Account Number is required" });
    }
    if (!ifsc_code || !String(ifsc_code).trim()) {
      return res.status(400).json({ success: false, message: "IFSC Code is required" });
    }

    const cleanHolder = encrypt(String(account_holder).trim());
    const cleanBank = encrypt(String(bank_name).trim());
    const cleanAccount = encrypt(String(account_number).trim());
    const cleanIfsc = encrypt(String(ifsc_code).trim().toUpperCase());
    const cleanUpi = upi_id ? encrypt(String(upi_id).trim()) : null;

    await User.updateOne(
      { _id: userId },
      {
        account_holder: cleanHolder,
        bank_name: cleanBank,
        account_number: cleanAccount,
        ifsc_code: cleanIfsc,
        upi_id: cleanUpi,
      }
    );

    const updatedUser = await findUserById(userId);

    return res.status(200).json({
      success: true,
      message: "Bank account and payout details saved successfully",
      user: formatAuthUser(updatedUser),
      is_payout_configured: true
    });
  } catch (error) {
    console.error("Update Payout Details Error:", error);
    return res.status(500).json({ success: false, message: "Failed to save payout details" });
  }
};

// 11. GET PAYOUT STATUS (Authenticated)
export const getPayoutStatus = async (req, res) => {
  try {
    const user = await findUserById(req.user?.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const isConfigured = Boolean(
      user.account_holder &&
      user.bank_name &&
      user.account_number &&
      user.ifsc_code
    );

    return res.status(200).json({
      success: true,
      is_configured: isConfigured,
      account_holder: user.account_holder || "",
      bank_name: user.bank_name || "",
      account_number_masked: user.account_number ? `••••••••${String(user.account_number).slice(-4)}` : "",
      ifsc_code: user.ifsc_code || "",
      upi_id: user.upi_id || "",
    });
  } catch (error) {
    console.error("Get Payout Status Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch payout status" });
  }
};

// 9. SEND EMAIL VERIFICATION OTP (Strict 10-minute validity)
export const sendVerificationOTP = async (req, res) => {
  try {
    const user = await getRequestUser(req);
    if (!user) return res.status(404).json({ success: false, message: "User account not found" });

    if (Boolean(user.is_email_verified) || user.auth_provider === "google") {
      return res.status(200).json({ success: true, message: "Email is already verified", is_email_verified: true });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 600000); // 10 minutes

    await saveEmailVerificationOTP(user.id, otp, expiry);
    await sendEmailVerificationOTP(user.email, otp, user.full_name);

    return res.status(200).json({
      success: true,
      message: "A 6-digit verification code has been sent to your email (valid for 10 minutes).",
      email: user.email,
      expires_in_seconds: 600,
    });
  } catch (error) {
    console.error("Send Verification OTP Error:", error);
    return res.status(500).json({ success: false, message: "Failed to send verification code" });
  }
};

// 10. VERIFY EMAIL OTP (Strict 10-minute expiry validation)
export const verifyEmailOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp || String(otp).trim().length !== 6) {
      return res.status(400).json({ success: false, message: "Please enter the complete 6-digit verification code" });
    }

    const user = await getRequestUser(req);
    if (!user) return res.status(404).json({ success: false, message: "User account not found" });

    if (Boolean(user.is_email_verified)) {
      return res.status(200).json({ success: true, message: "Email is already verified", user: formatAuthUser(user) });
    }

    if (!user.email_otp_code) {
      return res.status(400).json({ success: false, message: "No active verification code. Please request a new one." });
    }

    if (!user.email_otp_expiry || new Date(user.email_otp_expiry) <= new Date()) {
      return res.status(400).json({
        success: false,
        code: "OTP_EXPIRED",
        message: "Verification code has expired (valid for 10 minutes only). Please request a new code.",
      });
    }

    if (String(user.email_otp_code).trim() !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: "Invalid verification code. Please check and try again." });
    }

    await verifyUserEmail(user.id);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully! You can now book PGs and events.",
      user: formatAuthUser({ ...user, is_email_verified: 1, email_otp_code: null, email_otp_expiry: null }),
    });
  } catch (error) {
    console.error("Verify Email OTP Error:", error);
    return res.status(500).json({ success: false, message: "Failed to verify email code" });
  }
};

// 11. GET EMAIL VERIFICATION STATUS (Authenticated)
export const getVerificationStatus = async (req, res) => {
  try {
    const user = await findUserById(req.user?.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.status(200).json({
      success: true,
      email: user.email,
      is_email_verified: Boolean(user.is_email_verified) || user.auth_provider === "google",
      auth_provider: user.auth_provider || "local",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};