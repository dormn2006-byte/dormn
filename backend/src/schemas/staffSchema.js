import mongoose from 'mongoose';
import { autoIncrement } from '../models/plugins/autoIncrement.js';

const staffSchema = new mongoose.Schema(
  {
    _id: { type: Number },
    pg_id: { type: Number, ref: 'PG', required: true, index: true },
    owner_id: { type: Number, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    role: { 
      type: String, 
      default: 'Other' 
    },
    custom_role: String,
    phone: String,
    whatsapp: String,
    image_url: String,
    timings: String,
    is_active: { type: Boolean, default: true }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'pg_staff',
  }
);

autoIncrement(staffSchema, 'pg_staff');

const Staff = mongoose.model('Staff', staffSchema);
export default Staff;
