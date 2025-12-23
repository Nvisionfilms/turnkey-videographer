import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';

import { getExportedDecisions, canReadExportedDecisions } from '@/utils/exportedDecisionStore';

function monthKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function isInThisMonth(iso) {
  if (!iso) return false;
  const d = new Date(iso);
  return monthKey(d) === monthKey(new Date());
}

function formatCurrency(amount) {
  const n = Number(amount || 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function safePct(n) {
  const v = Number.isFinite(n) ? n : 0;
  return `${Math.round(v * 10) / 10}%`;
}

function gapPercent(intent, sent) {
  const i = Number(intent || 0);
  const s = Number(sent || 0);
  if (i <= 0) return 0;
  return ((i - s) / i) * 100;
}

function decisionVsFloorPercent(sent, floor) {
  const s = Number(sent || 0);
  const f = Number(floor || 0);
  if (f <= 0) return 0;
  return ((s - f) / f) * 100;
}

function pickInsight({ monthExports, allExports }) {
  if (monthExports.length < 3) return null;

  const countIntentAboveSent = monthExports.filter(e => Number(e.intent || 0) > Number(e.sent || 0)).length;
  const countNearFloor = monthExports.filter(e => {
    const f = Number(e.floor || 0);
    const s = Number(e.sent || 0);
    if (f <= 0) return false;
    return (s - f) <= (0.05 * f);
  }).length;

  const lastThree = monthExports.slice(0, 3);
  const lastThreeAboveMin = lastThree.length === 3 && lastThree.every(e => Number(e.sent || 0) >= Number(e.floor || 0));

  const commercial = monthExports.filter(e => String(e.projectType || '').toLowerCase().includes('commercial'));
  const nonCommercial = monthExports.filter(e => !String(e.projectType || '').toLowerCase().includes('commercial'));

  const avgDvf = (arr) => {
    const vals = arr.map(e => decisionVsFloorPercent(e.sent, e.floor)).filter(v => Number.isFinite(v));
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  const avgCommercial = avgDvf(commercial);
  const avgNonCommercial = avgDvf(nonCommercial);
  const commercialHoldsMore = avgCommercial != null && avgNonCommercial != null && avgCommercial > avgNonCommercial + 5;

  const hasRevisionsDiscounts = monthExports.filter(e => Number(e.customDiscountPercent || 0) > 0).length;

  const candidates = [];

  if (countIntentAboveSent >= Math.ceil(monthExports.length * 0.6)) {
    candidates.push('You often set a higher intent than you send.');
  }

  if (countNearFloor >= Math.ceil(monthExports.length * 0.6)) {
    candidates.push('Recent decisions cluster near your floor.');
  }

  if (commercialHoldsMore) {
    candidates.push('Your pricing holds more consistently on commercial work.');
  }

  if (hasRevisionsDiscounts >= Math.ceil(monthExports.length * 0.5)) {
    candidates.push('Discounts appear more frequently when revisions are included.');
  }

  if (lastThreeAboveMin) {
    candidates.push('Your last exports stayed above your minimum.');
  }

  if (!candidates.length) return null;

  // Stable choice: first candidate
  return candidates[0];
}

export default function BehavioralPricingSection({ onRestoreDecisionState }) {
  const [exports, setExports] = useState(null);

  useEffect(() => {
    if (!canReadExportedDecisions()) {
      setExports(null);
      return;
    }

    const all = getExportedDecisions();
    setExports(all);
  }, []);

  const { monthExports, lastExport, insight } = useMemo(() => {
    const all = Array.isArray(exports) ? exports : [];
    const month = all.filter(e => isInThisMonth(e.timestamp));
    const last = all[0] || null;
    return {
      monthExports: month,
      lastExport: last,
      insight: pickInsight({ monthExports: month, allExports: all })
    };
  }, [exports]);

  // Hide entire section if no exported quotes or storage unavailable
  if (!Array.isArray(exports) || exports.length === 0) {
    return null;
  }

  // Hide if restricted mode
  if (!canReadExportedDecisions()) {
    return null;
  }

  const quotesExported = monthExports.length;
  const avgDecisionVsFloor = (() => {
    const vals = monthExports.map(e => decisionVsFloorPercent(e.sent, e.floor)).filter(v => Number.isFinite(v));
    if (!vals.length) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  })();

  const floorViolations = monthExports.filter(e => Number(e.sent || 0) < Number(e.floor || 0)).length;

  const highestIntentSet = monthExports.reduce((m, e) => Math.max(m, Number(e.intent || 0)), 0);
  const highestPriceSent = monthExports.reduce((m, e) => Math.max(m, Number(e.sent || 0)), 0);

  const recentList = exports.slice(0, 5);

  return (
    <div className="mb-6 p-4" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderLeft: '3px solid var(--color-border-dark)' }}>
      <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-primary)', letterSpacing: '0.05em' }}>
        Pricing Behavior
      </div>
      <div className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
        A record of what you send, not what you intend.
      </div>

      <div className="mb-4" style={{ fontVariantNumeric: 'tabular-nums' }}>
        <div className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-muted)' }}>
          Monthly Summary
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
          <div>
            <span style={{ color: 'var(--color-text-secondary)' }}>Quotes exported: </span>
            <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{quotesExported}</span>
          </div>
          <div style={{ width: '1px', height: '20px', background: 'var(--color-border)' }} />
          <div>
            <span style={{ color: 'var(--color-text-secondary)' }}>Average decision vs floor: </span>
            <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{safePct(avgDecisionVsFloor)}</span>
          </div>
          <div style={{ width: '1px', height: '20px', background: 'var(--color-border)' }} />
          <div>
            <span style={{ color: 'var(--color-text-secondary)' }}>Floor violations: </span>
            <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{floorViolations}</span>
          </div>
          <div style={{ width: '1px', height: '20px', background: 'var(--color-border)' }} />
          <div>
            <span style={{ color: 'var(--color-text-secondary)' }}>Highest intent set: </span>
            <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{formatCurrency(highestIntentSet)}</span>
          </div>
          <div style={{ width: '1px', height: '20px', background: 'var(--color-border)' }} />
          <div>
            <span style={{ color: 'var(--color-text-secondary)' }}>Highest price sent: </span>
            <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{formatCurrency(highestPriceSent)}</span>
          </div>
        </div>
        <div className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
          Only exported quotes are recorded.
        </div>
      </div>

      {insight && (
        <div className="mb-4">
          <div className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Pattern Insight
          </div>
          <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {insight}
          </div>
        </div>
      )}

      {lastExport && (
        <div className="mb-4" style={{ fontVariantNumeric: 'tabular-nums' }}>
          <div className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Intent vs Decision
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
            <div>
              <span style={{ color: 'var(--color-text-secondary)' }}>Intent: </span>
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{formatCurrency(lastExport.intent)}</span>
            </div>
            <div style={{ width: '1px', height: '20px', background: 'var(--color-border)' }} />
            <div>
              <span style={{ color: 'var(--color-text-secondary)' }}>Sent: </span>
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{formatCurrency(lastExport.sent)}</span>
            </div>
            <div style={{ width: '1px', height: '20px', background: 'var(--color-border)' }} />
            <div>
              <span style={{ color: 'var(--color-text-secondary)' }}>Gap: </span>
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{safePct(gapPercent(lastExport.intent, lastExport.sent))}</span>
            </div>
          </div>
          <div className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
            This gap is neither right nor wrong. It only shows consistency.
          </div>
        </div>
      )}

      <div>
        <div className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-muted)' }}>
          Recent Exports
        </div>

        <div className="space-y-2">
          {recentList.map((e) => (
            <button
              key={e.id}
              type="button"
              className="w-full text-left px-3 py-2 rounded"
              style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              onClick={() => {
                if (onRestoreDecisionState && e.formData) {
                  onRestoreDecisionState(e.formData);
                }
              }}
            >
              <div className="flex items-center justify-between gap-3" style={{ fontVariantNumeric: 'tabular-nums' }}>
                <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {String(e.projectType || 'general')}
                </div>
                <div className="text-sm" style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>
                  {formatCurrency(e.sent)}
                </div>
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                {format(new Date(e.timestamp), 'MMM d, yyyy')}
              </div>
            </button>
          ))}
        </div>

        <div className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
          Selecting an entry restores its decision state.
        </div>
      </div>
    </div>
  );
}
