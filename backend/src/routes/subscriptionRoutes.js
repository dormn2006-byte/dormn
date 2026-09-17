import express from 'express';
import { protect, ownerOnly } from '../middleware/authMiddleware.js';
import { getMySubscription, createSubscriptionOrder, verifySubscriptionPayment, cancelSubscription, activateFreePlan } from '../controllers/subscriptionController.js';

const router = express.Router();
router.use(protect, ownerOnly);

router.get('/my-subscription', getMySubscription);
router.post('/create-order', createSubscriptionOrder);
router.post('/verify', verifySubscriptionPayment);
router.post('/cancel', cancelSubscription);
router.post('/activate-free', activateFreePlan);

export default router;
