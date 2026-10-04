// Sponsorship pricing and slot caps, in one place so the pricing shown on the
// owner dashboard, the amount charged by Razorpay and the slot checks can't
// drift apart.
//
// dotenv is loaded here (same pattern as config/media.js) because in ESM every
// import is evaluated before server.js reaches its own dotenv.config(), so a
// module-level read of process.env would otherwise see nothing.

import dotenv from "dotenv";

dotenv.config({ quiet: true });

const positiveInt = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
};

// Flat price to sponsor one PG in one placement, in INR.
export const SPONSOR_PRICE_INR = positiveInt(process.env.SPONSOR_PRICE_INR, 5000);

// How long a paid slot stays live before it expires and frees up.
export const SPONSOR_DURATION_DAYS = positiveInt(process.env.SPONSOR_DURATION_DAYS, 30);

// Slots per placement.
export const SPONSOR_PLACEMENTS = ["home", "explore"];

export const SPONSOR_SLOTS = {
  home: positiveInt(process.env.SPONSOR_HOME_SLOTS, 10),
  explore: positiveInt(process.env.SPONSOR_EXPLORE_SLOTS, 10),
};

// An unpaid order holds its slot for this long before it's released.
export const SPONSOR_RESERVATION_TTL_MS = 20 * 60 * 1000;
