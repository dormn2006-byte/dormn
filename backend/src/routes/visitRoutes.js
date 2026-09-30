import express from 'express';
import { protect, ownerOnly } from '../middleware/authMiddleware.js';
import { createVisitRequest, getStudentVisits, getOwnerVisits, updateVisitStatus, cancelStudentVisit } from '../controllers/visitController.js';

const router = express.Router();
router.post('/', protect, createVisitRequest);
router.get('/my', protect, getStudentVisits);
router.get('/owner', protect, ownerOnly, getOwnerVisits);
router.put('/:id/status', protect, ownerOnly, updateVisitStatus);
router.put('/:id/cancel', protect, cancelStudentVisit);
export default router;
