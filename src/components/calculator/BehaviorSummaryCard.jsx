// BEHAVIOR SUMMARY CARD - Phase 2 UI Reflection Moment
// Shows user their pricing behavior patterns without judgment
// Design principle: Mirror, not coach. Calm, not exciting.

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Check, AlertTriangle, ChevronRight } from "lucide-react";
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

  // Don't render if no quotes yet
  if (!stats || stats.totalQuotes === 0) {
    return null;
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Card className={`${className}`} style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
      <CardContent className="p-5">
        {/* Title - No icons, no hype */}
        <h3 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Your Pricing Behavior
        </h3>

        {/* Section Label */}
        <div className="text-xs font-medium uppercase tracking-wide mb-3" style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
          This Month
        </div>
        
        {/* Metrics - Simple list, not grid */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Quotes created</span>
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{stats.quotesThisMonth}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total quoted value</span>
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(stats.totalQuotedValueThisMonth)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Average markup</span>
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{stats.averageMarkupThisMonth}%</span>
          </div>
        </div>

        {/* Status - Binary: healthy or warning */}
        <div className="flex items-center gap-2 py-3" style={{ borderTop: '1px solid var(--color-border)' }}>
          {stats.quotesBelowMinimumThisMonth === 0 ? (
            <>
              <Check className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                No quotes below minimum
              </span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4" style={{ color: '#f59e0b' }} />
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {stats.quotesBelowMinimumThisMonth} quote{stats.quotesBelowMinimumThisMonth > 1 ? 's' : ''} below your minimum
              </span>
            </>
          )}
        </div>

        {/* View History Link - Defers deeper reflection */}
        <button 
          className="flex items-center gap-1 text-xs font-medium mt-2 hover:opacity-80 transition-opacity"
          style={{ color: 'var(--color-accent-primary)' }}
          onClick={() => navigate(createPageUrl("QuoteHistory"))}
        >
          View History
          <ChevronRight className="w-3 h-3" />
        </button>
      </CardContent>
    </Card>
  );
}
