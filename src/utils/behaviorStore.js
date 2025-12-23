// BEHAVIOR STORE - Persistence layer for quote behavior tracking
// Schema v1 - localStorage-based, last 100 quotes

const STORAGE_KEY = "turnkey_behavior_history_v1";
const MAX_QUOTES = 100;

function nowISO() {
  return new Date().toISOString();
}

function defaultHistory({ userId = "device_local" } = {}) {
  return {
    schemaVersion: 1,
    userId,
    createdAt: nowISO(),
    stats: {
      totalQuotes: 0,
      quotesThisMonth: 0,
      quotesBelowMinimum: 0,
      quotesBelowMinimumThisMonth: 0,
      averageMarkupPercent: 0,
      averageMarkupThisMonth: 0,
      totalQuotedValue: 0,
      totalQuotedValueThisMonth: 0,
      unrealizedProfit: 0,
      protectedValue: 0
    },
    quotes: [],
    patterns: {
      belowMinimumStreak: 0,
      averageMarkupTrend: "stable", // "improving" | "stable" | "declining"
      lastQuoteDate: null,
      daysActive: 0,
      quotesPerWeek: 0
    }
  };
}

export function loadBehaviorHistory({ userId } = {}) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultHistory({ userId });
    const parsed = JSON.parse(raw);

    // Minimal migration safety
    if (!parsed.schemaVersion) parsed.schemaVersion = 1;
    if (!parsed.userId) parsed.userId = userId || "device_local";
    if (!Array.isArray(parsed.quotes)) parsed.quotes = [];

    // Ensure required keys exist with safe defaults
    return {
      ...defaultHistory({ userId: parsed.userId }),
      ...parsed,
      stats: { ...defaultHistory({}).stats, ...(parsed.stats || {}) },
      patterns: { ...defaultHistory({}).patterns, ...(parsed.patterns || {}) },
      quotes: parsed.quotes.slice(0, MAX_QUOTES)
    };
  } catch (e) {
    // If storage is corrupted, reset to safe defaults
    console.warn("Behavior history corrupted, resetting:", e);
    return defaultHistory({ userId });
  }
}

export function saveBehaviorHistory(history) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.error("Failed to save behavior history:", e);
  }
}

export function clearBehaviorHistory() {
  localStorage.removeItem(STORAGE_KEY);
}

export { MAX_QUOTES, STORAGE_KEY };
