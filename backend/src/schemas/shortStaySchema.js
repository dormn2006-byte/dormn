import mongoose from 'mongoose';
import { autoIncrement } from '../models/plugins/autoIncrement.js';

const shortStaySchema = new mongoose.Schema(
  {
    _id: { type: Number },
    pg_id: { type: Number, ref: 'PG', required: true, index: true },
    student_id: { type: Number, ref: 'User', required: true, index: true },
    owner_id: { type: Number, ref: 'User', required: true, index: true },
    check_in_date: { type: Date, required: true },
    check_out_date: { type: Date, required: true },
    total_days: { type: Number, required: true },
    room_type: { type: String, default: 'Standard' },
    is_ac: { type: Boolean, default: false },
    guest_count: { type: Number, default: 1 },
    daily_price: Number,
    total_amount: Number,
    student_name: String,
    student_phone: String,
    student_email: String,
    purpose: String,
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'], 
      default: 'pending', 
      index: true 
    },
    owner_notes: String
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'pg_short_stays',
  }
);

shortStaySchema.index({ check_in_date: 1, check_out_date: 1 });

autoIncrement(shortStaySchema, 'pg_short_stays');

const ShortStay = mongoose.model('ShortStay', shortStaySchema);
export default ShortStay;
