import PGSponsorship from "../schemas/pgSponsorshipSchema.js";
import { getPGsByIds } from "../models/pgModel.js";
import { serialize } from "../utils/serialize.js";
import {
  SPONSOR_SLOTS,
  SPONSOR_PLACEMENTS,
  SPONSOR_RESERVATION_TTL_MS,
} from "../config/sponsorship.js";

const unexpired = () => {
  const now = new Date();
  return { $or: [{ expires_at: null }, { expires_at: { $gt: now } }] };
};

export const isValidPlacement = (placement) => SPONSOR_PLACEMENTS.includes(placement);

// Two lazy cleanups run before every read so callers never see a ticket that has
// passed its window (active) or one that was abandoned mid-checkout (created).
export const expireStale = async () => {
  const now = new Date();
  await Promise.all([
    PGSponsorship.updateMany(
      { status: "created", created_at: { $lt: new Date(now.getTime() - SPONSOR_RESERVATION_TTL_MS) } },
      { status: "expired" }
    ),
    PGSponsorship.updateMany(
      { status: "active", expires_at: { $ne: null, $lt: now } },
      { status: "expired" }
    ),
  ]);
};

export const getSlotUsage = async (placement) => {
  await expireStale();

  const total = SPONSOR_SLOTS[placement] ?? 0;
  const used = await PGSponsorship.countDocuments({
    placement,
    $or: [{ status: "created" }, { status: "active", ...unexpired() }],
  });

  return { placement, used, total, available: Math.max(0, total - used) };
};

export const getAllSlotUsage = async () => {
  const [home, explore] = await Promise.all([
    getSlotUsage("home"),
    getSlotUsage("explore"),
  ]);
  return { home, explore };
};

export const getActiveSponsoredPGs = async (placement) => {
  await expireStale();

  const total = SPONSOR_SLOTS[placement] ?? 0;
  if (total <= 0) return [];

  const rows = await PGSponsorship.find({
    placement,
    status: "active",
    ...unexpired(),
  })
    .sort({ starts_at: 1, _id: 1 })
    .limit(total)
    .lean();

  const ids = [];
  const seen = new Set();
  for (const row of rows) {
    if (!seen.has(row.pg_id)) {
      seen.add(row.pg_id);
      ids.push(row.pg_id);
    }
  }
  if (!ids.length) return [];

  const pgs = await getPGsByIds(ids);
  const byId = new Map(pgs.map((pg) => [pg.id, pg]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
};

export const getOwnerSponsorships = async (ownerId) => {
  await expireStale();

  const rows = await PGSponsorship.find({
    owner_id: Number(ownerId),
    status: { $ne: "cancelled" },
  })
    .sort({ _id: -1 })
    .lean();

  return serialize(rows);
};

// Removes a sponsorship from the owner's list and frees its slot. The row is
// kept (status "cancelled") so the payment stays on record.
export const cancelSponsorship = async (id, ownerId) => {
  const result = await PGSponsorship.updateOne(
    { _id: Number(id), owner_id: Number(ownerId), status: { $ne: "cancelled" } },
    { status: "cancelled", cancelled_at: new Date() }
  );

  return result.modifiedCount > 0;
};

export const findSponsorshipByOrder = async (orderId, ownerId) => {
  const row = await PGSponsorship.findOne({
    razorpay_order_id: orderId,
    owner_id: Number(ownerId),
  }).lean();

  return serialize(row);
};

export const findActiveSponsorship = async (pgId, placement) => {
  const row = await PGSponsorship.findOne({
    pg_id: Number(pgId),
    placement,
    $or: [{ status: "created" }, { status: "active", ...unexpired() }],
  }).lean();

  return serialize(row);
};

export const hasActiveSponsorship = async (pgId) => {
  const row = await PGSponsorship.findOne({
    pg_id: Number(pgId),
    status: "active",
    ...unexpired(),
  }).lean();

  return Boolean(row);
};

export const createPendingSponsorship = async ({ ownerId, pgId, placement, amount, orderId }) => {
  const doc = await PGSponsorship.create({
    owner_id: Number(ownerId),
    pg_id: Number(pgId),
    placement,
    amount,
    razorpay_order_id: orderId,
    status: "created",
  });

  return serialize(doc);
};

export const activateSponsorship = async (id, { paymentId, signature, durationDays }) => {
  const startsAt = new Date();
  const expiresAt = new Date(startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000);

  await PGSponsorship.updateOne(
    { _id: id },
    {
      status: "active",
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
      starts_at: startsAt,
      expires_at: expiresAt,
    }
  );

  return expiresAt;
};

export const markSponsorshipFailed = async (id, { paymentId, signature } = {}) => {
  await PGSponsorship.updateOne(
    { _id: id },
    {
      status: "failed",
      ...(paymentId ? { razorpay_payment_id: paymentId } : {}),
      ...(signature ? { razorpay_signature: signature } : {}),
    }
  );
};
