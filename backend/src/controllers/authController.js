import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  createUser,
  findUserByEmail,
  updateUserOTP, 
  clearUserOTP,
} from "../models/userModel.js";
import crypto from "crypto";
// Updated import to include sendWelcomeEmail
import { sendOTPEmail, sendLoginAlert, sendWelcomeEmail } from "../utils/emailService.js";

// =========================================================================
// 1. REGISTER USER
// =========================================================================
export const registerUser = async (req, res) => {
  try {
    const {
      full_name,
      email,
      password,
      role,
      phone,
      profile_image,
    } = req.body;

    // Validation
    if (!full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Check Existing User
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    const result = await createUser({
      full_name,
      email,
      password: hashedPassword,
      role,
      phone,
      profile_image,
    });

    // --- TRIGGER WELCOME EMAIL ---
    // We trigger this asynchronously so it doesn't slow down the API response
    sendWelcomeEmail(email, full_name, role || "student").catch((err) => 
      console.error("Welcome email failed to send:", err)
    );

    // Generate JWT Token
    // result.insertId is the MongoDB _id from createUser
    const token = jwt.sign(
      {
        id: result.insertId,
        email,
        role: role || "student",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: result.insertId,
        full_name,
        email,
        role: role || "student",
      },
    });
  } catch (error) {
    console.log("Register Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// =========================================================================
// 2. REQUEST OTP
// =========================================================================
export const requestOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email required" });
    }

    // Verify user exists in the system
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    // Generate secure 6-digit numeric OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // Valid for 5 minutes

    // Save the generated OTP and expiry to the user's database record
    await updateUserOTP(user.id, otp, expiry);

    // Dispatch OTP email through Nodemailer
    await sendOTPEmail(email, otp);

    return res.status(200).json({ success: true, message: "OTP sent to email" });
  } catch (error) {
    console.error("Request OTP Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// =========================================================================
// 3. LOGIN USER (With Dual Auth: Password OR OTP)
// =========================================================================
export const loginUser = async (req, res) => {
  try {
    const { email, password, otp } = req.body;

    // Validation: Require email and at least one authentication credential
    if (!email || (!password && !otp)) {
      return res.status(400).json({
        success: false,
        message: "Email and either password or OTP are required",
      });
    }

    // Find User
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // --- DUAL AUTHENTICATION SYSTEM ---
    if (otp) {
      // METHOD A: OTP Verification Route
      const now = new Date();

      // Ensure the user has an active OTP, it matches, and is not expired
      if (!user.otp_code || user.otp_code !== otp || new Date(user.otp_expiry) < now) {
        return res.status(401).json({
          success: false,
          message: "Invalid or expired OTP",
        });
      }

      // Clear the OTP on successful verification to prevent reuse attacks
      await clearUserOTP(user._id);

    } else if (password) {
      // METHOD B: Traditional Password Verification Route
      const isPasswordMatched = await bcrypt.compare(
        password,
        user.password
      );

      if (!isPasswordMatched) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }
    }

    // Generate JWT Token
    // Note: user is a plain object from .lean(), so use _id (not id virtual)
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // Asynchronous Login Alert Notification
    //if (typeof sendLoginAlert === "function") {
     // sendLoginAlert(user.email, user.full_name).catch((err) => 
    //    console.error("Login notification alert failed to send:", err)
     // );
  //  }

    // Return Authentication Payload
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.log("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};