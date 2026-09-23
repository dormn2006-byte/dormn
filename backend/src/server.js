import dotenv from "dotenv";
import http from "http";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import Booking from "./schemas/bookingSchema.js";
import User from "./schemas/userSchema.js";
import { initSocket } from "./socket.js";

import authRoutes from "./routes/authRoutes.js";
import pgRoutes from "./routes/pgRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import enrollmentRoutes from "./routes/enrollmentRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import maintenanceRoutes from "./routes/maintenanceRoutes.js";
import eventTicketRoutes from "./routes/eventTicketRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import pgChatRoutes from "./routes/pgChatRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import clubRoutes from "./routes/clubRoutes.js";
import drDormnRoutes from "./routes/drDormnRoutes.js";

dotenv.config({ quiet: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// ── Rate limiters ──
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests from this IP, please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many login attempts. Please try again after 15 minutes." },
});

const otpSendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many verification code requests. Please wait a few minutes before trying again." },
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many verification attempts. Please try again after 15 minutes." },
});

// Dr.Dormn AI calls a paid LLM on every turn, so it gets its own budget.
const drDormnLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many AI requests. Please wait a few minutes and try again." },
});

app.use("/api/", globalLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/send-verification-otp", otpSendLimiter);
app.use("/api/auth/request-otp", otpSendLimiter);
app.use("/api/auth/forgot-password", otpSendLimiter);
app.use("/api/auth/verify-email-otp", otpVerifyLimiter);
app.use("/api/auth/reset-password", otpVerifyLimiter);
app.use("/api/dr-dormn/chat", drDormnLimiter);

// ── Routes ──
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/pg", pgRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/bookings", bookingRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/event-tickets", eventTicketRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/pg-chat", pgChatRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/dr-dormn", drDormnRoutes);

app.get("/", (req, res) => {
  res.send("PG Platform Backend Running");
});

// ── Scheduled maintenance ──

// Auto-cancel paused bookings older than 30 minutes
setInterval(async () => {
  try {
    const result = await Booking.updateMany(
      {
        status: "paused",
        booking_date: { $lt: new Date(Date.now() - 30 * 60 * 1000) },
      },
      { status: "cancelled" }
    );
    if (result.modifiedCount > 0) {
      console.log(`[Auto-Cancel] Cancelled ${result.modifiedCount} paused booking(s)`);
    }
  } catch (err) {
    console.error("[Auto-Cancel] Error:", err.message);
  }
}, 5 * 60 * 1000);

// Auto-expire owner subscriptions past their expiry date
setInterval(async () => {
  try {
    const result = await User.updateMany(
      {
        role: "owner",
        subscription_status: { $in: ["trial", "active", "cancelled"] },
        subscription_expires_at: { $ne: null, $lt: new Date() },
      },
      { subscription_status: "expired" }
    );
    if (result.modifiedCount > 0) {
      console.log(`[Sub-Expiry] Expired ${result.modifiedCount} owner subscription(s)`);
    }
  } catch (err) {
    console.error("[Sub-Expiry] Error:", err.message);
  }
}, 30 * 60 * 1000);

const PORT = process.env.PORT || 8000;

const start = async () => {
  await connectDB();

  const server = http.createServer(app);
  initSocket(server);

  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
};

start().catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});
