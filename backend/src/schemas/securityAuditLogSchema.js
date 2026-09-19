import mongoose from "mongoose";
import { autoIncrement } from "../models/plugins/autoIncrement.js";

const securityAuditLogSchema = new mongoose.Schema(
  {
    _id: { type: Number },

    event_type: { type: String, required: true },
    user_id: { type: Number, ref: "User", default: null },
    email: { type: String, default: null },
    ip_address: { type: String, default: null },
    user_agent: { type: String, default: null },
    status: { type: String, required: true },
    details: { type: String, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
    collection: "security_audit_logs",
  }
);

securityAuditLogSchema.index({ email: 1 });
securityAuditLogSchema.index({ event_type: 1 });
securityAuditLogSchema.index({ created_at: 1 });

autoIncrement(securityAuditLogSchema, "security_audit_logs");

const SecurityAuditLog = mongoose.model(
  "SecurityAuditLog",
  securityAuditLogSchema
);
export default SecurityAuditLog;
