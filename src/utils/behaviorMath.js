// BEHAVIOR MATH - Pure calculation helpers for behavior tracking
// Avoids NaN, Infinity, and negative nonsense

export function safeNumber(n, fallback = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

export function round2(n) {
  return Math.round(safeNumber(n) * 100) / 100;
}

// Markup relative to minimum floor (user-defined "survival" base)
// This is markup relative to the survival floor, not cost basis
// If minimumPrice is 0, markupPercent is 0 (avoid divide-by-zero)
export function calcMarkupPercent(minimumPrice, finalPrice) {
  const minP = safeNumber(minimumPrice);
  const finalP = safeNumber(finalPrice);
  if (minP <= 0) return 0;
  return round2(((finalP - minP) / minP) * 100);
}

// Gap relative to desired tier (your "green" number)
// Always returns 0 or positive - how much was left on the table
export function calcUnrealizedGap(desiredProfit, finalPrice) {
  const desired = safeNumber(desiredProfit);
  const finalP = safeNumber(finalPrice);
  return Math.max(0, round2(desired - finalP));
}

// Simple comparison helper
export function isBelow(a, b) {
  return safeNumber(a) < safeNumber(b);
}

// Calculate protected value (how far above minimum they stayed)
export function calcProtectedValue(minimumPrice, finalPrice) {
  const minP = safeNumber(minimumPrice);
  const finalP = safeNumber(finalPrice);
  return Math.max(0, round2(finalP - minP));
}
