// BEHAVIOR RECORDER - Records finalized quote decisions
// Only records on export (decisions, not anxiety)

import { loadBehaviorHistory, saveBehaviorHistory, MAX_QUOTES } from "./behaviorStore";
import { safeNumber, calcMarkupPercent, calcUnrealizedGap, isBelow } from "./behaviorMath";

function computeContext(formData = {}) {
  const rolesCount = Array.isArray(formData.selected_roles) ? formData.selected_roles.length : 0;

  // Calculate total days from selected roles
  let totalDays = 0;
  if (Array.isArray(formData.selected_roles)) {
    for (const role of formData.selected_roles) {
      totalDays += safeNumber(role.half_days, 0) * 0.5;
      totalDays += safeNumber(role.full_days, 0);
    }
  }

  return {
    clientName: formData.client_name || "Unnamed",
    projectType: formData.project_type || "general",
    rolesCount,
    totalDays: Math.round(totalDays * 10) / 10
  };
}

function computeQuoteRecord({ calculations, formData, finalPrice, wasExported }) {
  const minimumPrice = safeNumber(calculations?.negotiationLow);
  const currentQuote = safeNumber(calculations?.total);
  const desiredProfit = safeNumber(calculations?.negotiationHigh);

  const finalP = safeNumber(finalPrice, currentQuote);

  const wentBelowMinimum = isBelow(finalP, minimumPrice);
  const wentBelowDesired = isBelow(finalP, desiredProfit);

  return {
    id: `q_${Date.now()}`,
    createdAt: new Date().toISOString(),

    minimumPrice,
    currentQuote,
    desiredProfit,
    finalPrice: finalP,

    wasCustomOverride: Math.abs(finalP - currentQuote) > 0.01,
    wentBelowMinimum,
    wentBelowDesired,

    markupPercent: calcMarkupPercent(minimumPrice, finalP),
    unrealizedGap: calcUnrealizedGap(desiredProfit, finalP),

    ...computeContext(formData),

    wasExported: !!wasExported
  };
}

function getMonthKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function isInThisMonth(iso) {
  if (!iso) return false;
  const thisMonthKey = getMonthKey();
  const d = new Date(iso);
  const key = getMonthKey(d);
  return key === thisMonthKey;
}

function recalcStats(history) {
  const quotes = history.quotes;

  let totalQuotes = quotes.length;
  let quotesThisMonth = 0;
  let quotesBelowMinimum = 0;
  let quotesBelowMinimumThisMonth = 0;

  let totalQuotedValue = 0;
  let totalQuotedValueThisMonth = 0;

  let sumMarkup = 0;
  let sumMarkupThisMonth = 0;

  let unrealizedProfit = 0;
  let protectedValue = 0;

  for (const q of quotes) {
    const fp = safeNumber(q.finalPrice);
    totalQuotedValue += fp;
    sumMarkup += safeNumber(q.markupPercent);

    unrealizedProfit += safeNumber(q.unrealizedGap);

    if (!q.wentBelowMinimum) {
      // "protected value" = how far above minimum they stayed
      protectedValue += Math.max(0, fp - safeNumber(q.minimumPrice));
    } else {
      quotesBelowMinimum += 1;
    }

    if (isInThisMonth(q.createdAt)) {
      quotesThisMonth += 1;
      totalQuotedValueThisMonth += fp;
      sumMarkupThisMonth += safeNumber(q.markupPercent);

      if (q.wentBelowMinimum) quotesBelowMinimumThisMonth += 1;
    }
  }

  history.stats.totalQuotes = totalQuotes;
  history.stats.quotesThisMonth = quotesThisMonth;
  history.stats.quotesBelowMinimum = quotesBelowMinimum;
  history.stats.quotesBelowMinimumThisMonth = quotesBelowMinimumThisMonth;

  history.stats.totalQuotedValue = Math.round(totalQuotedValue);
  history.stats.totalQuotedValueThisMonth = Math.round(totalQuotedValueThisMonth);

  history.stats.averageMarkupPercent = totalQuotes ? Math.round((sumMarkup / totalQuotes) * 10) / 10 : 0;
  history.stats.averageMarkupThisMonth = quotesThisMonth ? Math.round((sumMarkupThisMonth / quotesThisMonth) * 10) / 10 : 0;

  history.stats.unrealizedProfit = Math.round(unrealizedProfit);
  history.stats.protectedValue = Math.round(protectedValue);
}

function recalcPatterns(history) {
  const quotes = history.quotes;

  // Below-minimum streak (from most recent backwards)
  let streak = 0;
  for (const q of quotes) {
    if (q.wentBelowMinimum) streak += 1;
    else break;
  }
  history.patterns.belowMinimumStreak = streak;

  // Last quote date
  history.patterns.lastQuoteDate = quotes[0]?.createdAt || null;

  // Days active: unique days with at least one quote
  const daySet = new Set();
  for (const q of quotes) {
    if (!q.createdAt) continue;
    const d = new Date(q.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    daySet.add(key);
  }
  history.patterns.daysActive = daySet.size;

  // Quotes per week (simple, over last 28 days)
  const now = Date.now();
  const days28 = 28 * 24 * 60 * 60 * 1000;
  const recent = quotes.filter(q => q.createdAt && (now - new Date(q.createdAt).getTime()) <= days28);
  history.patterns.quotesPerWeek = Math.round((recent.length / 4) * 10) / 10;

  // Markup trend (compare last 7 vs previous 7, only if enough data)
  const last7 = quotes.slice(0, 7);
  const prev7 = quotes.slice(7, 14);

  const avg = (arr) => arr.length ? arr.reduce((s, q) => s + safeNumber(q.markupPercent), 0) / arr.length : null;

  const a1 = avg(last7);
  const a2 = avg(prev7);

  if (a1 == null || a2 == null) {
    history.patterns.averageMarkupTrend = "stable";
  } else {
    const delta = a1 - a2;
    // Threshold avoids noise
    if (delta > 2) history.patterns.averageMarkupTrend = "improving";
    else if (delta < -2) history.patterns.averageMarkupTrend = "declining";
    else history.patterns.averageMarkupTrend = "stable";
  }
}

/**
 * Record a finalized quote (called on export)
 * @param {Object} params
 * @param {Object} params.calculations - The calculations object from calculateQuote
 * @param {Object} params.formData - The form data
 * @param {number} params.finalPrice - The final price (custom override or calculations.total)
 * @returns {Object} The recorded quote
 */
export function recordFinalizedQuote({ calculations, formData, finalPrice }) {
  const history = loadBehaviorHistory();
  
  const record = computeQuoteRecord({
    calculations,
    formData,
    finalPrice,
    wasExported: true
  });

  // Add to front of array (most recent first)
  history.quotes.unshift(record);
  
  // Enforce max quotes limit
  history.quotes = history.quotes.slice(0, MAX_QUOTES);

  // Recalculate aggregates
  recalcStats(history);
  recalcPatterns(history);

  // Persist
  saveBehaviorHistory(history);

  return record;
}

/**
 * Get current behavior stats without recording
 * @returns {Object} Current stats and patterns
 */
export function getBehaviorStats() {
  const history = loadBehaviorHistory();
  return {
    stats: history.stats,
    patterns: history.patterns,
    recentQuotes: history.quotes.slice(0, 10)
  };
}

/**
 * Get full quote history
 * @returns {Array} All recorded quotes
 */
export function getQuoteHistory() {
  const history = loadBehaviorHistory();
  return history.quotes;
}
