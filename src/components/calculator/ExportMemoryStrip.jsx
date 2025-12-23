// EXPORT MEMORY STRIP - Ledger UI Section 4
// Persistent continuity without inviting analysis. Prevents "resetting."
// Row of dots showing recent export history

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { getQuoteHistory } from '../../utils/behaviorRecorder';

export default function ExportMemoryStrip({ className = "" }) {
  const navigate = useNavigate();
  const [exports, setExports] = useState([]);
  const [lastExport, setLastExport] = useState(null);

  useEffect(() => {
    const history = getQuoteHistory() || [];
    setLastExport(history[0] || null);
    const recent = history.slice(0, 12).map(q => ({
      id: q.id,
      wentBelowMinimum: q.wentBelowMinimum || false,
      landedAtMinimum: q.landedAtMinimum || (q.finalPrice === q.minimumPrice)
    }));
    setExports(recent);
  }, []);

  const formatCurrency = (amount) => {
    const n = Number(amount || 0);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(n);
  };

  const formatPercent = (value) => {
    const n = Number(value || 0);
    const sign = n >= 0 ? '+' : '';
    return `${sign}${n.toFixed(1)}%`;
  };

  // Show empty state if no exports
  if (exports.length === 0) {
    return (
      <section className={`memory ${className}`}>
        <div className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--ledger-muted, #a6a6a6)' }}>
          RECENT DECISIONS
        </div>
        <div className="text-sm" style={{ color: 'var(--ledger-muted, #a6a6a6)' }}>
          Entries are created only when a quote is exported.
        </div>
      </section>
    );
  }

  return (
    <section className={`memory ${className}`}>
      <div className="text-xs uppercase tracking-wide mb-3" style={{ color: 'var(--ledger-muted, #a6a6a6)' }}>
        RECENT DECISIONS
      </div>

      {lastExport && (
        <div className="mb-3" style={{ fontVariantNumeric: 'tabular-nums' }}>
          <div className="text-sm" style={{ color: 'var(--ledger-muted, #a6a6a6)' }}>
            Last export: <span style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(lastExport.finalPrice)}</span>
          </div>
          <div className="text-sm" style={{ color: 'var(--ledger-muted, #a6a6a6)' }}>
            Minimum at time of export: <span style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(lastExport.minimumPrice)}</span>
          </div>
          <div className="text-sm" style={{ color: 'var(--ledger-muted, #a6a6a6)' }}>
            Margin at send: <span style={{ color: 'var(--color-text-primary)' }}>{formatPercent(lastExport.markupPercent)}</span>
          </div>
          <div className="text-xs mt-2" style={{ color: 'var(--ledger-muted, #a6a6a6)' }}>
            Entries are created only when a quote is exported.
          </div>
        </div>
      )}

      <div className="memory__dots">
        {exports.map((x, i) => {
          const cls = x.wentBelowMinimum
            ? "dot dot--bad"
            : x.landedAtMinimum
            ? "dot dot--floor"
            : "dot";
          return <span key={x.id || i} className={cls} />;
        })}
      </div>

      <button 
        className="link" 
        type="button" 
        onClick={() => navigate(createPageUrl("QuoteHistory"))}
      >
        View Full History →
      </button>
    </section>
  );
}
