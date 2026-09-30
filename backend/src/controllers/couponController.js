import mongoose from 'mongoose';
import '../schemas/couponSchema.js';
import '../schemas/pgSchema.js';
import { serialize } from '../utils/serialize.js';

const Coupon = mongoose.model('Coupon');

export const createOwnerCoupon = async (req, res) => {
  try {
    const { 
      code, discount_type, discount_value, min_booking_amount, 
      max_discount_amount, expiry_date, usage_limit,
      pg_id, title, description
    } = req.body;
    const ownerId = req.user.id;

    const existing = await Coupon.findOne({ code, owner_id: ownerId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }

    const coupon = await Coupon.create({
      owner_id: ownerId,
      code,
      discount_type,
      discount_value,
      min_booking_amount: min_booking_amount || 0,
      max_discount_amount: max_discount_amount || null,
      expiry_date: new Date(expiry_date),
      usage_limit: usage_limit || null,
      pg_id: pg_id || null,
      title,
      description,
      is_active: 1
    });

    res.status(201).json({ success: true, data: serialize(coupon) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating coupon', error: error.message });
  }
};

export const getOwnerCoupons = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const coupons = await Coupon.find({ owner_id: ownerId }).populate('pg_id', 'title city').lean();

    // Not aggregating promo stats from Payment model here as that model is not imported and might not have those fields ready, 
    // but returning the used_count from Coupon model is available.
    res.json({ success: true, data: serialize(coupons) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching coupons', error: error.message });
  }
};

export const updateOwnerCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.id;
    const updateData = { ...req.body };
    
    if (updateData.expiry_date) {
      updateData.expiry_date = new Date(updateData.expiry_date);
    }

    const coupon = await Coupon.findOneAndUpdate(
      { _id: id, owner_id: ownerId },
      updateData,
      { new: true }
    ).lean();

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    res.json({ success: true, data: serialize(coupon) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating coupon', error: error.message });
  }
};

export const toggleOwnerCouponStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.id;
    const { is_active } = req.body;

    const coupon = await Coupon.findOneAndUpdate(
      { _id: id, owner_id: ownerId },
      { is_active: is_active ? 1 : 0 },
      { new: true }
    ).lean();

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    res.json({ success: true, data: serialize(coupon) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error toggling coupon', error: error.message });
  }
};

export const deleteOwnerCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.id;

    const coupon = await Coupon.findOneAndDelete({ _id: id, owner_id: ownerId });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting coupon', error: error.message });
  }
};

export const validateAndApplyCoupon = async (req, res) => {
  try {
    const { code, amount, pg_id } = req.body;

    const coupon = await Coupon.findOne({ code, is_active: 1 }).lean();

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid or inactive coupon' });
    }

    if (new Date(coupon.expiry_date) < new Date()) {
      return res.status(400).json({ success: false, message: 'Coupon has expired' });
    }

    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    }

    if (coupon.min_booking_amount && amount < coupon.min_booking_amount) {
      return res.status(400).json({ success: false, message: `Minimum booking amount is ${coupon.min_booking_amount}` });
    }

    if (coupon.pg_id && pg_id && coupon.pg_id !== Number(pg_id)) {
      return res.status(400).json({ success: false, message: 'Coupon not applicable for this PG' });
    }

    let discount = 0;
    if (coupon.discount_type === 'flat') {
      discount = coupon.discount_value;
    } else if (coupon.discount_type === 'percentage') {
      discount = (amount * coupon.discount_value) / 100;
      if (coupon.max_discount_amount) {
        discount = Math.min(discount, coupon.max_discount_amount);
      }
    }

    res.json({ 
      success: true, 
      discount,
      final_amount: Math.max(0, amount - discount),
      coupon: serialize(coupon)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error validating coupon', error: error.message });
  }
};
