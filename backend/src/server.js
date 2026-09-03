import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";
import Booking from "./schemas/bookingSchema.js";
import authRoutes from "./routes/authRoutes.js";
import pgRoutes from "./routes/pgRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import enrollmentRoutes from "./routes/enrollmentRoutes.js";
import { fileURLToPath } from "url";
import path from "path";
import paymentRoutes from "./routes/paymentRoutes.js";
import clubRoutes from "./routes/clubRoutes.js";

// Node built-in modules for webhook processing
import { exec } from "child_process";
import crypto from "crypto";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 8000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// Rate Limiters
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests from this IP, please try again later." }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many login attempts. Please try again after 15 minutes." }
});

app.use("/api/", globalLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// Automated Deployment Webhook Endpoint
app.post("/api/v1/webhook/deploy", (req, res) => {
  const signature = req.headers["x-hub-signature-256"];
  const secret = process.env.WEBHOOK_SECRET;

  if (!signature || !secret) {
    return res.status(401).json({ success: false, message: "Unauthorized missing credentials" });
  }

  // Validate payload signature using fixed-time comparison
  const hmac = crypto.createHmac("sha256", secret);
  const expectedSignature = "sha256=" + hmac.update(JSON.stringify(req.body)).digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return res.status(403).json({ success: false, message: "Forbidden signature mismatch" });
  }

  // Safely write the incoming .env content if present in payload
  if (req.body.secure_env_payload) {
    try {
      const envPath = path.join(process.cwd(), ".env");
      fs.writeFileSync(envPath, req.body.secure_env_payload, "utf8");
      console.log("[Webhook] .env configuration file updated successfully.");
    } catch (err) {
      console.error("[Webhook] File write error:", err.message);
    }
  }

  // Respond quickly to prevent GitHub workflow timeouts
  res.status(200).json({ success: true, message: "Deployment sync initiated." });

  // Execute Git pull and trigger a background task restart
  const taskName = process.env.SERVICE_TASK_NAME || "DormnBackendService";
  const deployCmd = `cmd.exe /c cd ${process.cwd()} && git pull && timeout /t 2 && schtasks /end /tn "${taskName}" && schtasks /run /tn "${taskName}"`;

  exec(deployCmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`[Webhook] Exec error: ${error.message}`);
      return;
    }
    if (stderr) console.warn(`[Webhook] Stderr: ${stderr}`);
    console.log(`[Webhook] Stdout: ${stdout}`);
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/pg", pgRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/clubs", clubRoutes);

app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("PG Platform Backend Running");
});

// Connect to MongoDB, then start server + cron
connectDB().then(() => {
  // Auto-cancel paused bookings older than 30 minutes (runs every 5 min)
  setInterval(async () => {
    try {
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
      const result = await Booking.updateMany(
        { status: "paused", booking_date: { $lt: thirtyMinAgo } },
        { status: "cancelled" }
      );
      if (result.modifiedCount > 0) {
        console.log("[Auto-Cancel] Cancelled " + result.modifiedCount + " paused booking(s)");
      }
    } catch (err) {
      if (err.message && err.message.includes("timed out")) {
        console.warn("[Auto-Cancel] Skipped — MongoDB connection pool temporarily unavailable");
      } else {
        console.error("[Auto-Cancel] Error:", err.message);
      }
    }
  }, 5 * 60 * 1000);

  app.listen(PORT, '0.0.0.0', () => {
    console.log("");
    console.log("========================================");
    console.log("  SERVER IS RUNNING!");
    console.log("  Port: " + PORT);
    console.log("  MongoDB: Connected");
    console.log("========================================");
    console.log("");
  });
});
