import React, { useEffect, useMemo, useState } from 'react';

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

  const { monthExports, previousCount, totalQuotedThisMonth, belowFloorCount } = useMemo(() => {
    const all = Array.isArray(exports) ? exports : [];
    const month = all.filter(e => isInThisMonth(e.timestamp));
    const previous = all.filter(e => !isInThisMonth(e.timestamp));
    const totalQuoted = month.reduce((sum, e) => sum + Number(e.sent || 0), 0);
    const belowFloor = month.filter(e => Number(e.sent || 0) < Number(e.floor || 0)).length;
    return {
      monthExports: month,
      previousCount: previous.length,
      totalQuotedThisMonth: totalQuoted,
      belowFloorCount: belowFloor
    };
  }, [exports]);

  // Hide if restricted mode
  if (!canReadExportedDecisions()) {
    return null;
  }

  // Show empty state if no exports
  const hasExports = Array.isArray(exports) && exports.length > 0;

  return (
    <div className="mb-6 p-4" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', borderLeft: '3px solid var(--color-border-dark)' }}>
      <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-primary)', letterSpacing: '0.05em' }}>
        Pricing Ledger
      </div>
      <div className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>
        Recorded pricing decisions and outcomes.
      </div>

      {!hasExports ? (
        <div style={{ fontVariantNumeric: 'tabular-nums' }}>
          <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            No pricing decisions recorded.
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Export a quote to begin recording.
          </div>
        </div>
      ) : (
        <div style={{ fontVariantNumeric: 'tabular-nums' }}>
          {/* THIS MONTH */}
          <div className="mb-3">
            <div className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-muted)' }}>
              This Month
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>Exports recorded</span>
                <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{monthExports.length}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>Total quoted value</span>
                <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{formatCurrency(totalQuotedThisMonth)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>Quotes below floor</span>
                <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{belowFloorCount}</span>
              </div>
            </div>
          </div>

          {/* PREVIOUS */}
          <div className="pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
            <div className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-muted)' }}>
              Previous
            </div>
            <div className="flex justify-between items-center text-sm">
              <span style={{ color: 'var(--color-text-secondary)' }}>{previousCount} recorded</span>
              <a 
                href="/history" 
                className="text-xs"
                style={{ color: 'var(--color-text-muted)' }}
              >
                View history →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
