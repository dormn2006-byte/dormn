import mongoose from "mongoose";
import { autoIncrement } from "../models/plugins/autoIncrement.js";

const maintenanceRequestSchema = new mongoose.Schema(
  {
    _id: { type: Number },

    pg_id: { type: Number, ref: "PG", required: true },
    student_id: { type: Number, ref: "User", required: true },
    category: { type: String, default: "General" },
    location: { type: String, default: null },
    title: { type: String, required: true },
    description: { type: String, default: null },
    priority: {
      type: String,
      enum: ["Low", "Normal", "Urgent", "Emergency"],
      default: "Normal",
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
    },
    resolution_note: { type: String, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "maintenance_requests",
  }
);

maintenanceRequestSchema.index({ pg_id: 1, status: 1 });
maintenanceRequestSchema.index({ student_id: 1 });

autoIncrement(maintenanceRequestSchema, "maintenance_requests");

const MaintenanceRequest = mongoose.model(
  "MaintenanceRequest",
  maintenanceRequestSchema
);
export default MaintenanceRequest;
