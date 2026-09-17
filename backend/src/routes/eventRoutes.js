import express from 'express';
import { protect, adminOrOwner } from '../middleware/authMiddleware.js';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../controllers/eventController.js';

const router = express.Router();

// Public routes: fetch all active events or single event
router.get('/', getEvents);
router.get('/:id', getEventById);

// Protected routes: admin / owner / superadmin only can create/update/delete
router.post('/', protect, adminOrOwner, createEvent);
router.put('/:id', protect, adminOrOwner, updateEvent);
router.delete('/:id', protect, adminOrOwner, deleteEvent);

export default router;
