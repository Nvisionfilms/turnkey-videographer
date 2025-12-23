// BEHAVIOR SUMMARY CARD - Phase 2 UI Reflection Moment
// Shows user their pricing behavior patterns without judgment
// Design principle: Mirror, not coach. Calm, not exciting.
// Ledger UI: No cards, dividers for hierarchy, utilitarian typography

import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getBehaviorStats } from "../../utils/behaviorRecorder";

export default function BehaviorSummaryCard({ className = "" }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const data = getBehaviorStats();
    setStats(data.stats);
  }, []);

  // Show empty state if no quotes yet
  if (!stats || stats.totalQuotes === 0) {
    return (
      <div className={`${className} p-4`} style={{ 
        background: 'var(--color-bg-tertiary)', 
        border: '1px solid var(--color-border)',
        borderLeft: '3px solid var(--color-border-dark)'
      }}>
        <div 
          className="text-xs font-semibold uppercase tracking-wide mb-2"
          style={{ color: 'var(--color-text-primary)', letterSpacing: '0.05em' }}
        >
          RECORDED DECISIONS — THIS MONTH
        </div>
        <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          No exports recorded.
        </div>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const below = stats.quotesBelowMinimumThisMonth || 0;

  return (
    <div className={`${className} p-4`} style={{ 
      background: 'var(--color-bg-tertiary)', 
      border: '1px solid var(--color-border)',
      borderLeft: '3px solid var(--color-accent-primary)'
    }}>
      {/* Title row - ledger style */}
      <div 
        className="text-xs font-semibold uppercase tracking-wide mb-3"
        style={{ color: 'var(--color-text-primary)', letterSpacing: '0.05em' }}
      >
        RECORDED DECISIONS — THIS MONTH
      </div>

      {/* Metrics row - horizontal with dividers, tabular numbers */}
      <div className="flex flex-wrap items-center gap-4 text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
        <div>
          <span style={{ color: 'var(--color-text-secondary)' }}>Exports: </span>
          <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{stats.quotesThisMonth}</span>
        </div>
        
        <div style={{ width: '1px', height: '20px', background: 'var(--color-border)' }} />
        
        <div>
          <span style={{ color: 'var(--color-text-secondary)' }}>Total value: </span>
          <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{formatCurrency(stats.totalQuotedValueThisMonth)}</span>
        </div>
        
        <div style={{ width: '1px', height: '20px', background: 'var(--color-border)' }} />
        
        <div>
          <span style={{ color: 'var(--color-text-secondary)' }}>Avg markup: </span>
          <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{stats.averageMarkupThisMonth}%</span>
        </div>
        
        <div style={{ width: '1px', height: '20px', background: 'var(--color-border)' }} />
        
        {/* Status - just the number */}
        <div style={{ color: 'var(--color-text-secondary)' }}>
          <span>Below minimum: </span>
          <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{below}</span>
        </div>
        
        {/* View History Link */}
        <button 
          className="ml-auto text-xs font-medium hover:underline"
          style={{ color: 'var(--color-text-secondary)' }}
          onClick={() => navigate(createPageUrl("QuoteHistory"))}
        >
          View History →
        </button>
      </div>
    </div>
  );
}
