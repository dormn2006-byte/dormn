// Company payroll fee. The fee is a one-time charge per booking, expressed as a
// percentage of ONE month's rent where the percentage scales with the agreed
// length of stay. It is recovered from the student's monthly rent payments as
// they arrive; if a payment can't cover the outstanding fee, the shortfall
// carries over to the next payment.
//
// The schedule is linear (10% per month), so a full stay always nets out to a
// flat 10% of total rent — e.g. 6 months => 60% of one month = 10% of 6 months.

export const FEE_TABLE = {
  1: 10,
  2: 20,
  3: 30,
  4: 40,
  5: 50,
  6: 60,
  7: 70,
  8: 80,
  9: 90,
  10: 100,
  11: 110,
  12: 120,
};

export const MIN_MONTHS = 1;
export const MAX_MONTHS = 12;

const round2 = (value) => Math.round(value * 100) / 100;

/** Clamps an arbitrary value to a whole month in the supported 1–12 range. */
export const clampMonths = (months) => {
  const n = Math.round(Number(months));
  if (!Number.isFinite(n)) return MIN_MONTHS;
  return Math.min(Math.max(n, MIN_MONTHS), MAX_MONTHS);
};

/** Fee percentage of one month's rent for a given stay length. */
export const feePercentForMonths = (months) => FEE_TABLE[clampMonths(months)];

/** Total one-time fee for a booking: percent(months) x one month's rent. */
export const bookingFeeTotal = (months, monthlyRent) => {
  const rent = Math.max(Number(monthlyRent) || 0, 0);
  return round2((rent * feePercentForMonths(months)) / 100);
};

/**
 * Works out this payment's slice of the booking fee.
 *
 * `deduction` is capped at the amount actually received, so the owner's net can
 * never go negative when the fee exceeds a single month's payment.
 */
export const computeDeduction = ({ monthlyRent, months, feeCollected = 0, paymentAmount }) => {
  const gross = Math.max(Number(paymentAmount) || 0, 0);
  const feeTotal = bookingFeeTotal(months, monthlyRent);
  const outstanding = Math.max(round2(feeTotal - (Number(feeCollected) || 0)), 0);
  const deduction = round2(Math.min(outstanding, gross));

  return { feeTotal, deduction, net: round2(gross - deduction), outstanding };
};
