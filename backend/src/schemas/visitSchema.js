import mongoose from 'mongoose';
import { autoIncrement } from '../models/plugins/autoIncrement.js';

const visitSchema = new mongoose.Schema(
  {
    _id: { type: Number },
    pg_id: { type: Number, ref: 'PG', required: true, index: true },
    student_id: { type: Number, ref: 'User', required: true, index: true },
    owner_id: { type: Number, ref: 'User', required: true, index: true },
    visit_date: { type: Date, required: true, index: true },
    visit_time_slot: { type: String, default: '10:00 AM - 01:00 PM' },
    student_name: String,
    student_phone: String,
    student_email: String,
    notes: String,
    status: { 
      type: String, 
      enum: ['pending', 'confirmed', 'completed', 'cancelled'], 
      default: 'pending', 
      index: true 
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'pg_visits',
  }
);

autoIncrement(visitSchema, 'pg_visits');

const Visit = mongoose.model('Visit', visitSchema);
export default Visit;
