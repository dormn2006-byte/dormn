import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';
import User from '../schemas/userSchema.js';
import PG from '../schemas/pgSchema.js';
import OwnerSubscription from '../schemas/ownerSubscriptionSchema.js';
import { serialize } from '../utils/serialize.js';
import { logSecurityAudit } from '../utils/securityAuditService.js';
import { sendSubscriptionReceiptToOwnerEmail } from '../utils/emailService.js';

dotenv.config({ quiet: true });

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const PLAN_PRICES = {
  standard: { monthly: 999, yearly: 799 },
  pro: { monthly: 1999, yearly: 1599 },
};

// Tolerant read: native values pass through, legacy JSON strings are parsed.
const parseMaybeJson = (v) =>
  typeof v === "string"
    ? (() => { try { return JSON.parse(v); } catch { return v; } })()
    : v;

// Mirrors MySQL DATEDIFF(a, b): whole calendar days between the two dates.
const datediff = (a, b) => {
  if (a == null || b == null) return null;
  const da = new Date(a);
  const db = new Date(b);
  if (isNaN(da.getTime()) || isNaN(db.getTime())) return null;
  const ua = Date.UTC(da.getFullYear(), da.getMonth(), da.getDate());
  const ub = Date.UTC(db.getFullYear(), db.getMonth(), db.getDate());
  return Math.round((ua - ub) / 86400000);
};

export const getMySubscription = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const user = await User.findById(ownerId)
      .select(
        "subscription_tier subscription_status subscription_cycle subscription_started_at subscription_expires_at max_pg_listings custom_plan_config"
      )
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const current_pg_count = await PG.countDocuments({ owner_id: ownerId });

    const subscriptionData = {
      tier: user.subscription_tier,
      status: user.subscription_status,
      cycle: user.subscription_cycle,
      started_at: user.subscription_started_at,
      expires_at: user.subscription_expires_at,
      days_remaining: datediff(user.subscription_expires_at, new Date()),
      max_pg_listings: user.max_pg_listings,
      custom_plan_config: parseMaybeJson(user.custom_plan_config),
      current_pg_count,
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

    await OwnerSubscription.create({
      owner_id: ownerId,
      plan_name: plan,
      billing_cycle: cycle,
      amount,
      razorpay_order_id: order.id,
      valid_from: validFrom,
      valid_until: validUntil,
      status: 'created',
      // custom_plan_config is now stored as a NATIVE value (was string-serialised).
      custom_plan_config: customConfig ? customConfig : null,
    });

    res.json({ success: true, order_id: order.id, amount: order.amount, currency: order.currency, key_id: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating order', error: error.message });
  }
};

export const verifySubscriptionPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const ownerId = req.user.id;

    const row = await OwnerSubscription.findOne({
      razorpay_order_id,
      owner_id: ownerId,
    }).lean();

    if (!row) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const subscription = serialize(row);

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
      await OwnerSubscription.updateOne(
        { _id: subscription.id },
        { status: 'successful', razorpay_payment_id, razorpay_signature }
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

      const startedAt = new Date();
      const expiresAt = new Date(startedAt.getTime() + days * 24 * 60 * 60 * 1000);

      await User.updateOne(
        { _id: ownerId },
        {
          subscription_tier: planName,
          subscription_status: 'active',
          subscription_cycle: cycle,
          subscription_started_at: startedAt,
          subscription_expires_at: expiresAt,
          max_pg_listings: maxListings,
          // native value (was string-serialised)
          custom_plan_config: verifiedCustomConfig ? verifiedCustomConfig : null,
        }
      );

      // Re-activate owner's PGs
      await PG.updateMany(
        { owner_id: ownerId, status: 'blocked' },
        { status: 'approved' }
      );

      // Email: Send subscription payment receipt to owner
      try {
        const ownerRow = await User.findById(ownerId)
          .select('full_name email subscription_expires_at')
          .lean();
        if (ownerRow?.email) {
          sendSubscriptionReceiptToOwnerEmail(ownerRow.email, ownerRow.full_name, {
            planName,
            billingCycle: cycle,
            amount: subscription.amount,
            paymentId: razorpay_payment_id,
            expiresAt: ownerRow.subscription_expires_at,
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
      await OwnerSubscription.updateOne(
        { _id: subscription.id },
        { status: 'failed' }
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

    await User.updateOne({ _id: ownerId }, { subscription_status: 'cancelled' });

    // UPDATE ... ORDER BY id DESC LIMIT 1 → only the most recent successful row.
    const latest = await OwnerSubscription.findOne({
      owner_id: ownerId,
      status: 'successful',
    })
      .sort({ _id: -1 })
      .select('_id')
      .lean();

    if (latest) {
      await OwnerSubscription.updateOne({ _id: latest._id }, { cancelled_at: new Date() });
    }

    const user = await User.findById(ownerId).select('subscription_expires_at').lean();

    res.json({ success: true, message: 'Subscription cancelled', days_remaining: datediff(user?.subscription_expires_at, new Date()) || 0 });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error cancelling subscription', error: error.message });
  }
};

export const activateFreePlan = async (req, res) => {
  try {
    const ownerId = req.user.id;

    const paidSubscriptions = await OwnerSubscription.find({
      owner_id: ownerId,
      status: 'successful',
    })
      .select('_id')
      .lean();

    if (paidSubscriptions.length > 0) {
      return res.status(400).json({ message: 'Free trial is only available for new owners' });
    }

    await User.updateOne(
      { _id: ownerId },
      {
        subscription_tier: 'free',
        subscription_status: 'trial',
        max_pg_listings: 1,
        subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }
    );

    res.json({ success: true, message: 'Free trial activated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error activating free plan', error: error.message });
  }
};
