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

  useEffect(() => {
    const history = getQuoteHistory() || [];
    // Get last 12 exports, newest first
    const recent = history.slice(-12).reverse().map(q => ({
      id: q.id,
      wentBelowMinimum: q.wentBelowMinimum || false,
      landedAtMinimum: q.landedAtMinimum || (q.finalPrice === q.minimumPrice)
    }));
    setExports(recent);
  }, []);

  // Show empty state if no exports
  if (exports.length === 0) {
    return (
      <section className={`memory ${className}`}>
        <div className="text-sm" style={{ color: 'var(--ledger-muted, #a6a6a6)' }}>
          No exports yet. Your decision history will appear here.
        </div>
      </section>
    );
  }

  return (
    <section className={`memory ${className}`}>
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
