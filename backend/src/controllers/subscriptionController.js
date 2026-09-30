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

export const calculateOwnerPlanPricing = (accountAgeDays = 0) => {
  const isPhase2 = accountAgeDays > 30 && accountAgeDays <= 120; // Months 2, 3, 4: 50% discount
  const isPhase3 = accountAgeDays > 120 && accountAgeDays <= 180; // Months 5, 6: 25% discount

  const cycles = [
    { id: 'monthly', months: 1, label: 'Monthly' },
    { id: '3months', months: 3, label: '3 Months' },
    { id: '6months', months: 6, label: '6 Months' },
    { id: 'yearly', months: 12, label: 'Yearly' },
  ];

  const plans = {
    free: {
      monthlyEffective: 0,
      originalMonthly: null,
      totalAmount: 0,
      label: 'Free',
      discountBadge: null,
      totalLabel: '30-day free trial • 1 PG listing',
    },
    standard: {},
    pro: {},
  };

  const planBases = { standard: 999, pro: 1999 };

  ['standard', 'pro'].forEach((planId) => {
    const base = planBases[planId];
    plans[planId] = {};

    cycles.forEach((cycle) => {
      let effectiveMonthly = base;
      let originalMonthly = null;
      let discountBadge = null;
      let totalLabel = '';

      if (isPhase2) {
        effectiveMonthly = Math.round(base * 0.50);
        originalMonthly = base;
        discountBadge = '50% OFF';
        const total = effectiveMonthly * cycle.months;
        totalLabel = `Billed ₹${total.toLocaleString()} for ${cycle.months} month${cycle.months > 1 ? 's' : ''} (50% Launch Discount)`;
      } else if (isPhase3) {
        effectiveMonthly = Math.round(base * 0.75);
        originalMonthly = base;
        discountBadge = '25% OFF';
        const total = effectiveMonthly * cycle.months;
        totalLabel = `Billed ₹${total.toLocaleString()} for ${cycle.months} month${cycle.months > 1 ? 's' : ''} (25% Launch Discount)`;
      } else {
        if (cycle.id === '3months') {
          effectiveMonthly = Math.round(base * 0.95);
          originalMonthly = base;
          discountBadge = '5% OFF';
          totalLabel = `Billed ₹${(effectiveMonthly * 3).toLocaleString()} for 3 months (Save 5%)`;
        } else if (cycle.id === '6months') {
          effectiveMonthly = Math.round(base * 0.90);
          originalMonthly = base;
          discountBadge = '10% OFF';
          totalLabel = `Billed ₹${(effectiveMonthly * 6).toLocaleString()} for 6 months (Save 10%)`;
        } else if (cycle.id === 'yearly') {
          effectiveMonthly = Math.round(base * 0.80);
          originalMonthly = base;
          discountBadge = '20% OFF';
          totalLabel = `Billed ₹${(effectiveMonthly * 12).toLocaleString()} for 1 year (Save 20%)`;
        } else {
          effectiveMonthly = base;
          originalMonthly = null;
          discountBadge = null;
          totalLabel = 'Billed monthly';
        }
      }

      plans[planId][cycle.id] = {
        monthlyEffective: effectiveMonthly,
        originalMonthly,
        totalAmount: effectiveMonthly * cycle.months,
        label: `₹${effectiveMonthly.toLocaleString()}/m`,
        discountBadge,
        totalLabel,
      };
    });
  });

  return plans;
};

export const getMySubscription = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const user = await User.findById(ownerId)
      .select(
        "subscription_tier subscription_status subscription_cycle subscription_started_at subscription_expires_at max_pg_listings custom_plan_config created_at"
      )
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const current_pg_count = await PG.countDocuments({ owner_id: ownerId });

    // Calculate owner account tenure & progressive promo discount phase
    const registrationDate = user.created_at || user.subscription_started_at || new Date();
    const accountAgeDays = Math.max(0, Math.floor((Date.now() - new Date(registrationDate).getTime()) / (1000 * 60 * 60 * 24)));

    let promoPhase = 'phase1';
    let promoDiscountPercent = 100;
    let promoLabel = 'Month 1: 100% Free Trial';
    let phaseDaysLeft = Math.max(0, 30 - accountAgeDays);

    if (accountAgeDays > 180) {
      promoPhase = 'standard';
      promoDiscountPercent = 0;
      promoLabel = 'Standard Owner Rates';
      phaseDaysLeft = null;
    } else if (accountAgeDays > 120) {
      promoPhase = 'phase3';
      promoDiscountPercent = 25;
      promoLabel = 'Months 5 & 6: 25% Special Discount';
      phaseDaysLeft = Math.max(0, 180 - accountAgeDays);
    } else if (accountAgeDays > 30) {
      promoPhase = 'phase2';
      promoDiscountPercent = 50;
      promoLabel = 'Months 2, 3, 4: 50% Special Discount';
      phaseDaysLeft = Math.max(0, 120 - accountAgeDays);
    }

    // Fully authoritative server-calculated pricing
    const calculatedPlans = calculateOwnerPlanPricing(accountAgeDays);

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
      account_age_days: accountAgeDays,
      promo_phase: promoPhase,
      promo_discount_percent: promoDiscountPercent,
      promo_label: promoLabel,
      phase_days_left: phaseDaysLeft,
      calculated_plans: calculatedPlans,
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

    const normalizedCycle = cycle === '3months' ? '3months' : cycle === 'three_months' ? '3months' : cycle === '6months' ? '6months' : cycle === 'six_months' ? '6months' : cycle === 'yearly' ? 'yearly' : 'monthly';

    if (!['monthly', '3months', 'three_months', '6months', 'six_months', 'yearly'].includes(cycle)) {
      return res.status(400).json({ message: 'Invalid cycle' });
    }

    const user = await User.findById(ownerId).select('created_at subscription_started_at').lean();
    const registrationDate = user?.created_at || user?.subscription_started_at || new Date();
    const accountAgeDays = Math.max(0, Math.floor((Date.now() - new Date(registrationDate).getTime()) / (1000 * 60 * 60 * 24)));

    // Pure server-side calculated pricing - immune to client-side tampering/DevTools modifications
    const calculatedPlans = calculateOwnerPlanPricing(accountAgeDays);

    let amount = 0;
    if (plan === 'standard' || plan === 'pro') {
      const planConfig = calculatedPlans[plan]?.[normalizedCycle];
      if (!planConfig) {
        return res.status(400).json({ message: 'Invalid plan or billing cycle' });
      }
      amount = planConfig.totalAmount;
    } else if (plan === 'custom') {
      const isPhase2 = accountAgeDays > 30 && accountAgeDays <= 120;
      const isPhase3 = accountAgeDays > 120 && accountAgeDays <= 180;
      const maxListings = customConfig?.maxListings || 1;
      const baseMonthly = 499 + (Math.max(0, maxListings - 1) * 100);
      let addOn = 0;
      if (customConfig?.priorityPlacement) addOn += 300;
      if (customConfig?.analytics) addOn += 200;
      const totalBase = baseMonthly + addOn;

      let monthlyPrice = totalBase;
      if (isPhase2) {
        monthlyPrice = Math.round(totalBase * 0.50);
      } else if (isPhase3) {
        monthlyPrice = Math.round(totalBase * 0.75);
      } else if (normalizedCycle === '3months') {
        monthlyPrice = Math.round(totalBase * 0.95);
      } else if (normalizedCycle === '6months') {
        monthlyPrice = Math.round(totalBase * 0.90);
      } else if (normalizedCycle === 'yearly') {
        monthlyPrice = Math.round(totalBase * 0.80);
      }

      let monthsCount = 1;
      if (normalizedCycle === '3months') monthsCount = 3;
      else if (normalizedCycle === '6months') monthsCount = 6;
      else if (normalizedCycle === 'yearly') monthsCount = 12;

      amount = monthlyPrice * monthsCount;
    } else {
      return res.status(400).json({ message: 'Invalid plan' });
    }

    const options = {
      amount: amount * 100, // amount in paise
      currency: 'INR',
      receipt: `receipt_order_${ownerId}_${Date.now()}`
    };

    const order = await razorpayInstance.orders.create(options);

    const validFrom = new Date();
    const validUntil = new Date();
    if (normalizedCycle === 'yearly') {
      validUntil.setFullYear(validUntil.getFullYear() + 1);
    } else if (normalizedCycle === '6months') {
      validUntil.setMonth(validUntil.getMonth() + 6);
    } else if (normalizedCycle === '3months') {
      validUntil.setMonth(validUntil.getMonth() + 3);
    } else {
      validUntil.setMonth(validUntil.getMonth() + 1);
    }

    await OwnerSubscription.create({
      owner_id: ownerId,
      plan_name: plan,
      billing_cycle: normalizedCycle,
      amount,
      razorpay_order_id: order.id,
      valid_from: validFrom,
      valid_until: validUntil,
      status: 'created',
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
      let days = 30;
      if (cycle === 'yearly') days = 365;
      else if (cycle === '6months' || cycle === 'six_months') days = 180;
      else if (cycle === '3months' || cycle === 'three_months') days = 90;

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
