// COMMISSION RATES - Fixed per product (no drift)
// Update these when pricing changes

export const COMMISSION_RATES = {
  operator_monthly: {
    grossCents: 1900,      // $19.00
    commissionCents: 285   // 15% = $2.85
  },
  operator_annual: {
    grossCents: 14900,     // $149.00
    commissionCents: 2235  // 15% = $22.35
  }
};

// Hold window in days before commission clears
export const HOLD_DAYS = 14;

// Minimum payout threshold in cents
export const MINIMUM_PAYOUT_CENTS = 2500; // $25.00

// Refund threshold for auto-pause (reversals in 30 days)
export const REFUND_PAUSE_THRESHOLD = 3;

// Get commission for a product
export function getCommissionCents(productKey) {
  const rate = COMMISSION_RATES[productKey];
  return rate ? rate.commissionCents : 0;
}

// Get gross amount for a product
export function getGrossCents(productKey) {
  const rate = COMMISSION_RATES[productKey];
  return rate ? rate.grossCents : 0;
}

// Calculate eligible date (14 days from now)
export function getEligibleDate() {
  const date = new Date();
  date.setDate(date.getDate() + HOLD_DAYS);
  return date;
}
