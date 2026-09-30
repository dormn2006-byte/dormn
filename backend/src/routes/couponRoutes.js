import express from 'express';
import { protect, ownerOnly } from '../middleware/authMiddleware.js';
import { createOwnerCoupon, getOwnerCoupons, updateOwnerCoupon, toggleOwnerCouponStatus, deleteOwnerCoupon, validateAndApplyCoupon } from '../controllers/couponController.js';

const router = express.Router();
router.post('/owner', protect, ownerOnly, createOwnerCoupon);
router.get('/owner', protect, ownerOnly, getOwnerCoupons);
router.put('/owner/:id', protect, ownerOnly, updateOwnerCoupon);
router.patch('/owner/:id/status', protect, ownerOnly, toggleOwnerCouponStatus);
router.delete('/owner/:id', protect, ownerOnly, deleteOwnerCoupon);
router.post('/validate', validateAndApplyCoupon);
export default router;
