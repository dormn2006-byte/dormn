import express from 'express';
import { protect, requireVerifiedEmail } from '../middleware/authMiddleware.js';
import { createInvites, getInviteDetails, acceptInvite, getMyInvites } from '../controllers/eventTicketController.js';

const router = express.Router();

router.post('/create-invite', protect, requireVerifiedEmail, createInvites);
router.get('/invite/:inviteCode', getInviteDetails);
router.post('/accept-invite', protect, requireVerifiedEmail, acceptInvite);
router.get('/my-invites', protect, getMyInvites);

export default router;
