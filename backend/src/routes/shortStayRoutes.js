import express from 'express';
import { protect, ownerOnly } from '../middleware/authMiddleware.js';
import { createShortStayRequest, getStudentShortStays, getOwnerShortStays, updateShortStayStatus, cancelStudentShortStay } from '../controllers/shortStayController.js';

const router = express.Router();
router.post('/', protect, createShortStayRequest);
router.get('/my', protect, getStudentShortStays);
router.get('/owner', protect, ownerOnly, getOwnerShortStays);
router.put('/:id/status', protect, ownerOnly, updateShortStayStatus);
router.put('/:id/cancel', protect, cancelStudentShortStay);
export default router;
