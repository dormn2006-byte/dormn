import express from 'express';
import { protect, ownerOnly } from '../middleware/authMiddleware.js';
import { createStaff, getOwnerStaff, getStaffByPgId, updateStaff, deleteStaff } from '../controllers/staffController.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();
const staffUpload = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]);

router.post('/', protect, ownerOnly, staffUpload, createStaff);
router.get('/owner', protect, ownerOnly, getOwnerStaff);
router.get('/pg/:pgId', getStaffByPgId);
router.put('/:id', protect, ownerOnly, staffUpload, updateStaff);
router.delete('/:id', protect, ownerOnly, deleteStaff);
export default router;
