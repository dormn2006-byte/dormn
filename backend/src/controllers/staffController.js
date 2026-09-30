import mongoose from 'mongoose';
import '../schemas/staffSchema.js';
import '../schemas/pgSchema.js';
import { serialize } from '../utils/serialize.js';

const Staff = mongoose.model('Staff');
const PG = mongoose.model('PG');

export const createStaff = async (req, res) => {
  try {
    const { pg_id, name, role, custom_role, phone, whatsapp, timings } = req.body;
    const ownerId = Number(req.user.id) || req.user.id;
    const targetPgId = Number(pg_id) || pg_id;

    // Verify ownership
    const pg = await PG.findOne({ _id: targetPgId, owner_id: ownerId });
    if (!pg) {
      return res.status(403).json({ success: false, message: 'PG not found or you do not have permission' });
    }

    let image_url = null;
    const uploadedFile = req.file || req.files?.image?.[0] || req.files?.photo?.[0];
    if (uploadedFile) {
      image_url = uploadedFile.filename;
    } else if (req.body.image_url) {
      image_url = req.body.image_url;
    }

    const newStaff = await Staff.create({
      pg_id: targetPgId,
      owner_id: ownerId,
      name,
      role: role || 'Other',
      custom_role,
      phone,
      whatsapp,
      timings,
      image_url,
      is_active: true
    });

    const serialized = serialize(newStaff);
    res.status(201).json({ success: true, staff: serialized, data: serialized });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating staff', error: error.message });
  }
};

export const getOwnerStaff = async (req, res) => {
  try {
    const ownerId = Number(req.user.id) || req.user.id;
    const { pgId } = req.query;

    const query = { owner_id: ownerId };
    if (pgId && pgId !== 'all') {
      query.pg_id = Number(pgId) || pgId;
    }

    const staff = await Staff.find(query).populate('pg_id', 'title city').lean();
    const serialized = serialize(staff);
    res.json({ success: true, staff: serialized, data: serialized });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching staff', error: error.message });
  }
};

export const getStaffByPgId = async (req, res) => {
  try {
    const { pgId } = req.params;
    const targetPgId = Number(pgId) || pgId;
    const staff = await Staff.find({ pg_id: targetPgId, is_active: true })
      .select('name role phone whatsapp image_url timings is_active created_at')
      .lean();
      
    const serialized = serialize(staff);
    res.json({ success: true, staff: serialized, data: serialized });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching staff', error: error.message });
  }
};

export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const staffId = Number(id) || id;
    const ownerId = Number(req.user.id) || req.user.id;
    const updateData = { ...req.body };
    
    if (updateData.pg_id) {
      updateData.pg_id = Number(updateData.pg_id) || updateData.pg_id;
    }

    const uploadedFile = req.file || req.files?.image?.[0] || req.files?.photo?.[0];
    if (uploadedFile) {
      updateData.image_url = uploadedFile.filename;
    }
    
    // Convert string 'true'/'false' to boolean if needed
    if (updateData.is_active !== undefined) {
      updateData.is_active = updateData.is_active === 'true' || updateData.is_active === true;
    }

    const staff = await Staff.findOneAndUpdate(
      { _id: staffId, owner_id: ownerId },
      updateData,
      { new: true }
    ).lean();

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff not found' });
    }

    const serialized = serialize(staff);
    res.json({ success: true, staff: serialized, data: serialized });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating staff', error: error.message });
  }
};

export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const staffId = Number(id) || id;
    const ownerId = Number(req.user.id) || req.user.id;

    const staff = await Staff.findOneAndDelete({ _id: staffId, owner_id: ownerId });

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff not found' });
    }

    res.json({ success: true, message: 'Staff deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting staff', error: error.message });
  }
};
