// QUOTE HISTORY + PATTERNS PAGE - Phase 5
// Exposes behavior over time with calm precision
// No coaching. No prescriptions.

import React, { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { loadBehaviorHistory } from "../utils/behaviorStore";

// ============ MONTH SNAPSHOT LIST ============
function MonthSnapshotList({ stats }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Card style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
      <CardContent className="p-5">
        <div className="text-xs font-medium uppercase tracking-wide mb-4" style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
          This Month
        </div>
        
        <div className="space-y-2">
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
          
          <div className="flex justify-between items-center">
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Quotes below minimum</span>
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{stats.quotesBelowMinimumThisMonth}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============ HISTORY TABLE ============
function HistoryTable({ quotes }) {
  const [statusFilter, setStatusFilter] = useState('all');
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatus = (quote) => {
    if (quote.finalPrice < quote.minimumPrice) return 'Below';
    if (quote.finalPrice === quote.minimumPrice) return 'Floor';
    return 'OK';
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Below':
        return { color: '#f59e0b' }; // muted amber
      case 'Floor':
        return { color: 'var(--color-text-muted)' };
      default:
        return { color: 'var(--color-text-secondary)' };
    }
  };

  const filteredQuotes = useMemo(() => {
    if (statusFilter === 'all') return quotes;
    return quotes.filter(q => getStatus(q).toLowerCase() === statusFilter);
  }, [quotes, statusFilter]);

  if (quotes.length === 0) {
    return (
      <Card style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
        <CardContent className="p-8 text-center">
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            No exported quotes yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
            Export History
          </div>
          
          {/* Status Filter */}
          <div className="flex gap-1">
            {['all', 'ok', 'floor', 'below'].map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className="px-2 py-1 text-xs rounded transition-colors"
                style={{
                  background: statusFilter === filter ? 'var(--color-bg-tertiary)' : 'transparent',
                  color: statusFilter === filter ? 'var(--color-text-primary)' : 'var(--color-text-muted)'
                }}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th className="text-left py-2 font-medium" style={{ color: 'var(--color-text-muted)' }}>Date</th>
                <th className="text-left py-2 font-medium" style={{ color: 'var(--color-text-muted)' }}>Client</th>
                <th className="text-right py-2 font-medium" style={{ color: 'var(--color-text-muted)' }}>Minimum</th>
                <th className="text-right py-2 font-medium" style={{ color: 'var(--color-text-muted)' }}>Final</th>
                <th className="text-right py-2 font-medium" style={{ color: 'var(--color-text-muted)' }}>Markup</th>
                <th className="text-right py-2 font-medium" style={{ color: 'var(--color-text-muted)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotes.map((quote) => {
                const status = getStatus(quote);
                return (
                  <tr key={quote.id} style={{ borderBottom: '1px solid var(--color-border-light, var(--color-border))' }}>
                    <td className="py-3" style={{ color: 'var(--color-text-secondary)' }}>
                      {formatDate(quote.createdAt)}
                    </td>
                    <td className="py-3" style={{ color: 'var(--color-text-primary)' }}>
                      {quote.clientName || 'Unnamed'}
                    </td>
                    <td className="py-3 text-right" style={{ color: 'var(--color-text-secondary)' }}>
                      {formatCurrency(quote.minimumPrice)}
                    </td>
                    <td className="py-3 text-right font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {formatCurrency(quote.finalPrice)}
                    </td>
                    <td className="py-3 text-right" style={{ color: 'var(--color-text-secondary)' }}>
                      {quote.markupPercent}%
                    </td>
                    <td className="py-3 text-right" style={getStatusStyle(status)}>
                      {status}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredQuotes.length === 0 && quotes.length > 0 && (
          <p className="text-center py-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            No quotes match this filter.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ============ PATTERNS PANEL ============
function PatternsPanel({ quotes, patterns }) {
  const MIN_QUOTES_FOR_PATTERNS = 10;
  
  if (quotes.length === 0) {
    return (
      <Card style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
        <CardContent className="p-5">
          <div className="text-xs font-medium uppercase tracking-wide mb-4" style={{ color: 'var(--color-text-muted)' }}>
            Patterns
          </div>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Export your first quote to begin tracking.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (quotes.length < MIN_QUOTES_FOR_PATTERNS) {
    return (
      <Card style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
        <CardContent className="p-5">
          <div className="text-xs font-medium uppercase tracking-wide mb-4" style={{ color: 'var(--color-text-muted)' }}>
            Patterns
          </div>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Not enough history to measure patterns yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate patterns from quotes
  const last14 = quotes.slice(0, 14);
  const last7 = quotes.slice(0, 7);
  const prev7 = quotes.slice(7, 14);
  const last30 = quotes.slice(0, 30);

  // Pattern 1: Markup Drift
  const avg = (arr) => arr.length ? arr.reduce((s, q) => s + (q.markupPercent || 0), 0) / arr.length : 0;
  const last7Avg = Math.round(avg(last7));
  const prev7Avg = Math.round(avg(prev7));
  
  let markupDriftText = '';
  if (prev7.length >= 7) {
    if (last7Avg > prev7Avg + 2) {
      markupDriftText = `Your average markup rose from ${prev7Avg}% to ${last7Avg}% over your last 14 quotes.`;
    } else if (last7Avg < prev7Avg - 2) {
      markupDriftText = `Your average markup fell from ${prev7Avg}% to ${last7Avg}% over your last 14 quotes.`;
    } else {
      markupDriftText = `Your average markup held steady over your last 14 quotes.`;
    }
  }

  // Pattern 2: Below-Minimum Frequency
  const belowCount = last30.filter(q => q.wentBelowMinimum).length;
  const belowPercent = Math.round((belowCount / last30.length) * 100);
  const belowFrequencyText = `You quoted below minimum ${belowPercent}% of the time across your last ${last30.length} exports.`;

  // Pattern 3: Unrealized Profit (optional)
  const unrealizedTotal = last30.reduce((sum, q) => sum + (q.unrealizedGap || 0), 0);
  const unrealizedText = unrealizedTotal > 0 
    ? `$${Math.round(unrealizedTotal).toLocaleString()} gap to your desired tier across your last ${last30.length} exports.`
    : null;

  return (
    <Card style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
      <CardContent className="p-5">
        <div className="text-xs font-medium uppercase tracking-wide mb-4" style={{ color: 'var(--color-text-muted)' }}>
          Patterns
        </div>
        
        <div className="space-y-3">
          {markupDriftText && (
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {markupDriftText}
            </p>
          )}
          
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {belowFrequencyText}
          </p>
          
          {unrealizedText && (
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {unrealizedText}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============ MAIN PAGE ============
export default function QuoteHistory() {
  const navigate = useNavigate();
  const history = loadBehaviorHistory();
  const { stats, quotes, patterns } = history;

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--color-bg-primary)' }}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(createPageUrl("Calculator"))}
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </div>

        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Quote History
        </h1>

        {/* Monthly Snapshot */}
        <MonthSnapshotList stats={stats} />

        {/* History Table */}
        <HistoryTable quotes={quotes} />

        {/* Patterns Panel */}
        <PatternsPanel quotes={quotes} patterns={patterns} />
      </div>
    </div>
  );
}
