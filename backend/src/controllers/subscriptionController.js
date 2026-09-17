import Razorpay from 'razorpay';
import pool from '../config/db.js';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { logSecurityAudit } from '../utils/securityAuditService.js';
import { sendSubscriptionReceiptToOwnerEmail } from '../utils/emailService.js';

dotenv.config();

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const PLAN_PRICES = {
  standard: { monthly: 999, yearly: 799 },
  pro: { monthly: 1999, yearly: 1599 },
};

export const getMySubscription = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const [users] = await pool.query(
      `SELECT subscription_tier as tier, subscription_status as status, subscription_cycle as cycle, 
       subscription_started_at as started_at, subscription_expires_at as expires_at, 
       DATEDIFF(subscription_expires_at, NOW()) as days_remaining, max_pg_listings, custom_plan_config 
       FROM users WHERE id = ?`,
      [ownerId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const [pgs] = await pool.query(`SELECT COUNT(*) as count FROM pgs WHERE owner_id = ?`, [ownerId]);

    const subscriptionData = {
      ...users[0],
      current_pg_count: pgs[0].count,
    };

    res.json({ success: true, data: subscriptionData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching subscription', error: error.message });
  }
};

export const createSubscriptionOrder = async (req, res) => {
  try {
    const { plan, cycle, customConfig } = req.body;
    const ownerId = req.user.id;

    if (!['monthly', 'yearly'].includes(cycle)) {
      return res.status(400).json({ message: 'Invalid cycle' });
    }

    let monthlyPrice = 0;
    if (plan === 'standard' || plan === 'pro') {
      monthlyPrice = PLAN_PRICES[plan][cycle];
    } else if (plan === 'custom') {
      const maxListings = customConfig?.maxListings || 1;
      monthlyPrice = 499 + (Math.max(0, maxListings - 1) * 100);
      if (customConfig?.priorityPlacement) monthlyPrice += 300;
      if (customConfig?.analytics) monthlyPrice += 200;
      if (cycle === 'yearly') {
        monthlyPrice = Math.round(monthlyPrice * 0.8); // 20% discount
      }
    } else {
      return res.status(400).json({ message: 'Invalid plan' });
    }

    const amount = cycle === 'yearly' ? monthlyPrice * 12 : monthlyPrice;

    const options = {
      amount: amount * 100, // amount in paise
      currency: 'INR',
      receipt: `receipt_order_${ownerId}_${Date.now()}`
    };

    const order = await razorpayInstance.orders.create(options);

    const validFrom = new Date();
    const validUntil = new Date();
    if (cycle === 'yearly') {
      validUntil.setFullYear(validUntil.getFullYear() + 1);
    } else {
      validUntil.setMonth(validUntil.getMonth() + 1);
    }

    await pool.query(
      `INSERT INTO owner_subscriptions 
      (owner_id, plan_name, billing_cycle, amount, razorpay_order_id, valid_from, valid_until, status, custom_plan_config) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 'created', ?)`,
      [ownerId, plan, cycle, amount, order.id, validFrom, validUntil, customConfig ? JSON.stringify(customConfig) : null]
    );

    res.json({ success: true, order_id: order.id, amount: order.amount, currency: order.currency });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating order', error: error.message });
  }
};

export const verifySubscriptionPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const ownerId = req.user.id;

    const [subscriptions] = await pool.query(
      `SELECT * FROM owner_subscriptions WHERE razorpay_order_id = ? AND owner_id = ?`,
      [razorpay_order_id, ownerId]
    );

    if (subscriptions.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const subscription = subscriptions[0];

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(razorpay_signature)
    );

    if (isAuthentic) {
      await pool.query(
        `UPDATE owner_subscriptions SET status = 'successful', razorpay_payment_id = ?, razorpay_signature = ? WHERE id = ?`,
        [razorpay_payment_id, razorpay_signature, subscription.id]
      );

      let verifiedCustomConfig = null;
      if (subscription.custom_plan_config) {
        try {
          verifiedCustomConfig = typeof subscription.custom_plan_config === 'string'
            ? JSON.parse(subscription.custom_plan_config)
            : subscription.custom_plan_config;
        } catch {
          verifiedCustomConfig = null;
        }
      }

      let maxListings = 1;
      const planName = subscription.plan_name;
      if (planName === 'standard') maxListings = 5;
      else if (planName === 'pro') maxListings = 999;
      else if (planName === 'custom') {
        maxListings = verifiedCustomConfig?.maxListings ? Number(verifiedCustomConfig.maxListings) : 1;
      }

      const cycle = subscription.billing_cycle;
      const days = cycle === 'yearly' ? 365 : 30;

      await pool.query(
        `UPDATE users SET 
         subscription_tier = ?, subscription_status = 'active', subscription_cycle = ?, 
         subscription_started_at = NOW(), subscription_expires_at = DATE_ADD(NOW(), INTERVAL ? DAY), 
         max_pg_listings = ?, custom_plan_config = ? 
         WHERE id = ?`,
        [planName, cycle, days, maxListings, verifiedCustomConfig ? JSON.stringify(verifiedCustomConfig) : null, ownerId]
      );

      // Re-activate owner's PGs
      await pool.query(
        `UPDATE pgs SET status = 'approved' WHERE owner_id = ? AND status = 'blocked'`,
        [ownerId]
      );

      // Email: Send subscription payment receipt to owner
      try {
        const [ownerRows] = await pool.query(`SELECT full_name, email, subscription_expires_at FROM users WHERE id = ?`, [ownerId]);
        if (ownerRows[0]?.email) {
          sendSubscriptionReceiptToOwnerEmail(ownerRows[0].email, ownerRows[0].full_name, {
            planName,
            billingCycle: cycle,
            amount: subscription.amount,
            paymentId: razorpay_payment_id,
            expiresAt: ownerRows[0].subscription_expires_at,
            maxListings,
          }).catch(err => console.error('[EmailService] Subscription receipt error:', err.message));
        }
      } catch (subEmailErr) {
        console.error('[EmailService] Subscription hook error:', subEmailErr.message);
      }

      // Optional check since the user didn't mention this explicitly in their instruction to use it.
      if (typeof logSecurityAudit === 'function') {
        logSecurityAudit('subscription_payment_verified', ownerId, { order_id: razorpay_order_id });
      }

      res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      await pool.query(
        `UPDATE owner_subscriptions SET status = 'failed' WHERE id = ?`,
        [subscription.id]
      );
      res.status(400).json({ success: false, message: 'Invalid signature' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error verifying payment', error: error.message });
  }
};

export const cancelSubscription = async (req, res) => {
  try {
    const ownerId = req.user.id;

    await pool.query(`UPDATE users SET subscription_status = 'cancelled' WHERE id = ?`, [ownerId]);
    await pool.query(
      `UPDATE owner_subscriptions SET cancelled_at = NOW() WHERE owner_id = ? AND status = 'successful' ORDER BY id DESC LIMIT 1`,
      [ownerId]
    );

    const [users] = await pool.query(
      `SELECT DATEDIFF(subscription_expires_at, NOW()) as days_remaining FROM users WHERE id = ?`,
      [ownerId]
    );

    res.json({ success: true, message: 'Subscription cancelled', days_remaining: users[0]?.days_remaining || 0 });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error cancelling subscription', error: error.message });
  }
};

export const activateFreePlan = async (req, res) => {
  try {
    const ownerId = req.user.id;

    const [paidSubscriptions] = await pool.query(
      `SELECT id FROM owner_subscriptions WHERE owner_id = ? AND status = 'successful'`,
      [ownerId]
    );

    if (paidSubscriptions.length > 0) {
      return res.status(400).json({ message: 'Free trial is only available for new owners' });
    }

    await pool.query(
      `UPDATE users SET 
       subscription_tier = 'free', 
       subscription_status = 'trial', 
       max_pg_listings = 1, 
       subscription_expires_at = DATE_ADD(NOW(), INTERVAL 30 DAY) 
       WHERE id = ?`,
      [ownerId]
    );

    res.json({ success: true, message: 'Free trial activated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error activating free plan', error: error.message });
  }
};
