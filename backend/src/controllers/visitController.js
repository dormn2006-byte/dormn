import mongoose from 'mongoose';
import '../schemas/visitSchema.js';
import '../schemas/pgSchema.js';
import '../schemas/userSchema.js';
import { serialize } from '../utils/serialize.js';
import { sendVisitRequestToOwnerEmail, sendVisitStatusToStudentEmail } from '../utils/emailService.js';

const Visit = mongoose.model('Visit');
const PG = mongoose.model('PG');
const User = mongoose.model('User');

const mapVisitDoc = (v) => {
  const pg = v.pg_id || {};
  const student = v.student_id || {};
  const owner = v.owner_id || {};
  return {
    ...v,
    id: v._id,
    pg_id: pg._id || v.pg_id,
    pg_title: pg.title || v.pg_title || 'PG Accommodation',
    pg_name: pg.title || v.pg_name || 'PG Accommodation',
    pg_area: pg.area,
    pg_city: pg.city,
    pg_address: pg.address,
    pg_profile_image: pg.profile_image,
    pg_price: pg.price,
    student_name: v.student_name || student.full_name || 'Student',
    student_phone: v.student_phone || student.phone || '',
    student_email: v.student_email || student.email || '',
    student_profile_image: student.profile_image,
    owner_name: owner.full_name || v.owner_name || 'PG Owner',
    owner_phone: owner.phone || v.owner_phone || '',
    owner_email: owner.email || v.owner_email || '',
  };
};

export const createVisitRequest = async (req, res) => {
  try {
    const { pg_id, visit_date, visit_time_slot, student_name, student_phone, student_email, notes } = req.body;
    const studentId = req.user.id;

    const pg = await PG.findById(pg_id).select('owner_id title').lean();
    if (!pg) return res.status(404).json({ success: false, message: 'PG not found' });

    const dateQuery = new Date(visit_date);
    const existing = await Visit.findOne({
      pg_id,
      student_id: studentId,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: existing.status === 'confirmed'
          ? 'You already have a confirmed visit scheduled for this PG!'
          : 'You already have an active visit request for this PG awaiting owner confirmation.'
      });
    }

    const visit = await Visit.create({
      pg_id,
      student_id: studentId,
      owner_id: pg.owner_id,
      visit_date: dateQuery,
      visit_time_slot,
      student_name,
      student_phone,
      student_email,
      notes,
      status: 'pending'
    });

    User.findById(pg.owner_id).select('email full_name').lean().then((owner) => {
      if (owner?.email) {
        sendVisitRequestToOwnerEmail(owner.email, owner.full_name, {
          visitId: visit._id,
          studentName: student_name || req.user.full_name || 'Student',
          studentPhone: student_phone || req.user.phone || '',
          pgTitle: pg.title,
          visitDate: typeof visit_date === 'string' ? visit_date : new Date(visit_date).toLocaleDateString(),
          visitTimeSlot: visit_time_slot,
          notes,
        }).catch((err) => console.error('[EmailService] Visit alert error:', err.message));
      }
    }).catch(() => {});

    const serialized = serialize(visit);
    return res.status(201).json({ success: true, visit: serialized, data: serialized });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error creating visit', error: error.message });
  }
};

export const getStudentVisits = async (req, res) => {
  try {
    const rawVisits = await Visit.find({ student_id: req.user.id })
      .populate('pg_id', 'title area city address profile_image price')
      .populate('owner_id', 'full_name phone email')
      .sort({ visit_date: -1 })
      .lean();

    const serialized = serialize(rawVisits.map(mapVisitDoc));
    return res.json({ success: true, visits: serialized, data: serialized });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching visits', error: error.message });
  }
};

export const getOwnerVisits = async (req, res) => {
  try {
    const rawVisits = await Visit.find({ owner_id: req.user.id })
      .populate('student_id', 'full_name phone email profile_image')
      .populate('pg_id', 'title area city address profile_image price')
      .sort({ visit_date: 1 })
      .lean();

    const serialized = serialize(rawVisits.map(mapVisitDoc));
    return res.json({ success: true, visits: serialized, data: serialized });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching visits', error: error.message });
  }
};

export const updateVisitStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const visit = await Visit.findOneAndUpdate(
      { _id: id, owner_id: req.user.id },
      { status },
      { new: true }
    ).populate('pg_id', 'title').populate('student_id', 'full_name email').populate('owner_id', 'full_name').lean();

    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found' });

    const studentEmail = visit.student_email || visit.student_id?.email;
    const studentName = visit.student_name || visit.student_id?.full_name;
    if (studentEmail) {
      sendVisitStatusToStudentEmail(studentEmail, studentName, {
        visitId: visit._id,
        status,
        pgTitle: visit.pg_id?.title || 'Your PG',
        ownerName: visit.owner_id?.full_name || 'PG Owner',
        visitDate: visit.visit_date ? new Date(visit.visit_date).toLocaleDateString() : '',
        visitTimeSlot: visit.visit_time_slot,
      }).catch((err) => console.error('[EmailService] Status update error:', err.message));
    }

    const serialized = serialize(visit);
    return res.json({ success: true, visit: serialized, data: serialized });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error updating visit status', error: error.message });
  }
};

export const cancelStudentVisit = async (req, res) => {
  try {
    const visit = await Visit.findOneAndUpdate(
      { _id: req.params.id, student_id: req.user.id, status: { $in: ['pending', 'confirmed'] } },
      { status: 'cancelled' },
      { new: true }
    ).lean();

    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found or cannot be cancelled' });
    const serialized = serialize(visit);
    return res.json({ success: true, visit: serialized, data: serialized });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error cancelling visit', error: error.message });
  }
};
