import mongoose from 'mongoose';
import '../schemas/shortStaySchema.js';
import '../schemas/pgSchema.js';
import { serialize } from '../utils/serialize.js';

const ShortStay = mongoose.model('ShortStay');
const PG = mongoose.model('PG');

export const createShortStayRequest = async (req, res) => {
  try {
    const { 
      pg_id, check_in_date, check_out_date, room_type, 
      is_ac, guest_count, student_name, student_phone, student_email, purpose 
    } = req.body;
    const studentId = req.user.id;

    const checkIn = new Date(check_in_date);
    const checkOut = new Date(check_out_date);
    
    if (checkOut <= checkIn) {
      return res.status(400).json({ success: false, message: 'Check-out date must be after check-in date' });
    }

    const pg = await PG.findById(pg_id).select('owner_id short_stay_enabled short_stay_price_per_day').lean();
    if (!pg) {
      return res.status(404).json({ success: false, message: 'PG not found' });
    }

    if (!pg.short_stay_enabled) {
      return res.status(400).json({ success: false, message: 'Short stays are not enabled for this PG' });
    }

    // Check for existing pending/approved stay
    const existing = await ShortStay.findOne({
      student_id: studentId,
      status: { $in: ['pending', 'approved'] }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'You already have an active short stay request.' });
    }

    const totalDays = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const dailyPrice = pg.short_stay_price_per_day || 0;
    const totalAmount = totalDays * dailyPrice * (guest_count || 1);

    const stay = await ShortStay.create({
      pg_id,
      student_id: studentId,
      owner_id: pg.owner_id,
      check_in_date: checkIn,
      check_out_date: checkOut,
      total_days: totalDays,
      room_type,
      is_ac,
      guest_count,
      daily_price: dailyPrice,
      total_amount: totalAmount,
      student_name,
      student_phone,
      student_email,
      purpose,
      status: 'pending'
    });

    res.status(201).json({ success: true, data: serialize(stay) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating short stay', error: error.message });
  }
};

export const getStudentShortStays = async (req, res) => {
  try {
    const studentId = req.user.id;
    const stays = await ShortStay.find({ student_id: studentId })
      .populate('pg_id', 'title area city profile_image')
      .populate('owner_id', 'full_name phone')
      .sort({ check_in_date: -1 })
      .lean();

    res.json({ success: true, data: serialize(stays) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching short stays', error: error.message });
  }
};

export const getOwnerShortStays = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const stays = await ShortStay.find({ owner_id: ownerId })
      .populate('student_id', 'full_name phone email profile_image')
      .populate('pg_id', 'title area city profile_image')
      .sort({ check_in_date: 1 })
      .lean();

    res.json({ success: true, data: serialize(stays) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching short stays', error: error.message });
  }
};

export const updateShortStayStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, owner_notes } = req.body;
    const ownerId = req.user.id;

    if (!['pending', 'approved', 'rejected', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const updateData = { status };
    if (owner_notes !== undefined) updateData.owner_notes = owner_notes;

    const stay = await ShortStay.findOneAndUpdate(
      { _id: id, owner_id: ownerId },
      updateData,
      { new: true }
    ).lean();

    if (!stay) {
      return res.status(404).json({ success: false, message: 'Short stay not found' });
    }

    res.json({ success: true, data: serialize(stay) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating short stay', error: error.message });
  }
};

export const cancelStudentShortStay = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    const stay = await ShortStay.findOneAndUpdate(
      { _id: id, student_id: studentId, status: { $in: ['pending', 'approved'] } },
      { status: 'cancelled' },
      { new: true }
    ).lean();

    if (!stay) {
      return res.status(404).json({ success: false, message: 'Short stay not found or cannot be cancelled' });
    }

    res.json({ success: true, data: serialize(stay) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error cancelling short stay', error: error.message });
  }
};
