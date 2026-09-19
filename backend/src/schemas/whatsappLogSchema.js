import mongoose from "mongoose";
import { autoIncrement } from "../models/plugins/autoIncrement.js";

const whatsappLogSchema = new mongoose.Schema(
  {
    _id: { type: Number },

    event_type: { type: String, required: true },
    event_ref_id: { type: String, required: true },
    recipient_phone: { type: String, required: true },
    message_status: {
      type: String,
      enum: ["sent", "failed", "queued"],
      default: "sent",
    },
    sent_at: { type: Date, default: Date.now },
  },
  {
    collection: "whatsapp_logs",
    versionKey: false,
  }
);

whatsappLogSchema.index(
  { event_type: 1, event_ref_id: 1, recipient_phone: 1 },
  { unique: true }
);
whatsappLogSchema.index({ sent_at: 1 });

autoIncrement(whatsappLogSchema, "whatsapp_logs");

const WhatsappLog = mongoose.model("WhatsappLog", whatsappLogSchema);
export default WhatsappLog;
