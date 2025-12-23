const STORAGE_KEY = "turnkey_exported_decisions_v1";
const MAX_ITEMS = 100;

function canUseStorage() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const k = '__turnkey_storage_test__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

function safeParse(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function getExportedDecisions() {
  if (!canUseStorage()) return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed = safeParse(raw, []);
  return Array.isArray(parsed) ? parsed : [];
}

export function recordExportedDecision({
  formData,
  calculations,
  exportType,
  finalPrice,
}) {
  if (!canUseStorage()) return { ok: false };

  const now = new Date();
  const id = `ed_${now.getTime()}`;

  const decision = {
    id,
    timestamp: now.toISOString(),
    exportType: exportType || 'quote',

    projectType: formData?.project_type || 'general',

    floor: Number(calculations?.negotiationLow || 0),
    intent: Number(calculations?.negotiationHigh || 0),
    sent: Number(finalPrice ?? formData?.custom_price_override ?? calculations?.total ?? 0),

    customDiscountPercent: Number(formData?.custom_discount_percent || 0),

    formData: formData || null,
  };

  const existing = getExportedDecisions() || [];
  const updated = [decision, ...existing].slice(0, MAX_ITEMS);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  return { ok: true, decision };
}

export function clearExportedDecisions() {
  if (!canUseStorage()) return { ok: false };
  window.localStorage.removeItem(STORAGE_KEY);
  return { ok: true };
}

export function canReadExportedDecisions() {
  return canUseStorage();
}

export function getExportedDecisionsStorageKey() {
  return STORAGE_KEY;
}
