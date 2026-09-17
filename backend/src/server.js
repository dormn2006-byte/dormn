import "dotenv/config";
import cluster from "cluster";
import os from "os";
import http from "http";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit"; // <-- 1. Import rate limiter
import "./config/testConnection.js";
import pool from "./config/db.js";
import { initSocket } from "./socket.js";
import authRoutes from "./routes/authRoutes.js";
import pgRoutes from "./routes/pgRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import enrollmentRoutes from "./routes/enrollmentRoutes.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import paymentRoutes from "./routes/paymentRoutes.js";
import maintenanceRoutes from "./routes/maintenanceRoutes.js";
import eventTicketRoutes from "./routes/eventTicketRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import pgChatRoutes from "./routes/pgChatRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";

dotenv.config();

const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  console.log(`Primary Master Process ${process.pid} is running`);
  console.log(`Forking server across ${numCPUs} CPU cores for high traffic handling...`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker process ${worker.process.pid} died. Spawning a new worker replacement...`);
    cluster.fork();
  });

  // Auto-cancel paused bookings older than 30 minutes (runs every 5 min, only on primary)
  setInterval(async () => {
    try {
      const [result] = await pool.execute(
        `UPDATE bookings SET status = 'cancelled' WHERE status = 'paused' AND booking_date < NOW() - INTERVAL 30 MINUTE`
      );
      if (result.affectedRows > 0) {
        console.log(`[Auto-Cancel] Cancelled ${result.affectedRows} paused booking(s)`);
      }
    } catch (err) {
      console.error("[Auto-Cancel] Error:", err.message);
    }
  }, 5 * 60 * 1000);

  // Auto-expire owner subscriptions past their expiry date (runs every 30 min, only on primary)
  setInterval(async () => {
    try {
      const [result] = await pool.execute(
        `UPDATE users 
         SET subscription_status = 'expired' 
         WHERE role = 'owner' 
           AND subscription_status IN ('trial', 'active', 'cancelled') 
           AND subscription_expires_at IS NOT NULL 
           AND subscription_expires_at < NOW()`
      );
      if (result.affectedRows > 0) {
        console.log(`[Sub-Expiry] Expired ${result.affectedRows} owner subscription(s)`);
      }
    } catch (err) {
      console.error("[Sub-Expiry] Error:", err.message);
    }
  }, 30 * 60 * 1000);

} else {
  const app = express();

  app.disable("x-powered-by");

  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // --- 2. DEFINE HIGH-TRAFFIC RATE LIMITERS ---
  
  // General Limiter: Max 200 requests per 15 minutes per IP for normal APIs
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200, 
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests from this IP, please try again later." }
  });

  // Strict Limiter: Max 10 requests per 15 minutes for Login/Signup to prevent brute force
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: "Too many login attempts. Please try again after 15 minutes." }
  });

  // OTP Dispatch Limiter: Max 5 requests per 10 minutes to prevent SMS/email flooding
  const otpSendLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: { success: false, message: "Too many verification code requests. Please wait a few minutes before trying again." }
  });

  // OTP Verification Limiter: Max 10 attempts per 15 minutes to prevent code brute-forcing
  const otpVerifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: "Too many verification attempts. Please try again after 15 minutes." }
  });

  // Apply limiters to routes
  app.use("/api/", globalLimiter);
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);

  // OTP Security Limiters
  app.use("/api/auth/send-verification-otp", otpSendLimiter);
  app.use("/api/auth/request-otp", otpSendLimiter);
  app.use("/api/auth/forgot-password", otpSendLimiter);
  app.use("/api/auth/verify-email-otp", otpVerifyLimiter);
  app.use("/api/auth/reset-password", otpVerifyLimiter);

  app.use("/api/enrollments", enrollmentRoutes);

  // --- YOUR EXISTING ROUTES ---
  app.use("/api/auth", authRoutes);
  app.use("/api/pg", pgRoutes);
  app.use("/api/reviews", reviewRoutes);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  app.use(
    "/api/uploads",
    express.static(path.join(__dirname, "uploads"))
  );

  app.use("/api/bookings", bookingRoutes);
  app.use("/api/superadmin", superAdminRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/maintenance", maintenanceRoutes);
  app.use("/api/event-tickets", eventTicketRoutes);
  app.use("/api/events", eventRoutes);
  app.use("/api/student", studentRoutes);
  app.use("/api/pg-chat", pgChatRoutes);
  app.use("/api/subscriptions", subscriptionRoutes);

  app.get("/", (req, res) => {
    res.send("PG Platform Backend Running");
  });

  const PORT = process.env.PORT || 8000;
  const server = http.createServer(app);
  initSocket(server);

  server.listen(PORT, () => {
    console.log(`Worker process ${process.pid} started with WebSockets running on port ${PORT}`);
  });
}