import React from 'react';
import { TrendingDown, TrendingUp, Zap, AlertTriangle } from 'lucide-react';

export default function NegotiationTicker({ calculations, settings }) {
  if (!calculations || !calculations.total) {
    return null;
  }

  // Use the pre-calculated negotiation range from calculations.jsx
  // This ensures consistency between the ticker and the negotiation buttons
  const lowTier = calculations.negotiationLow || 0;
  const midTier = calculations.total;
  const highTier = calculations.negotiationHigh || 0;
  
  const desiredProfitPercent = settings?.desired_profit_margin_percent || 60;
  const isBelowFloor = midTier < lowTier;

  return (
    <div className="w-full overflow-hidden" style={{ background: 'var(--color-bg-card)', borderBottom: '2px solid var(--color-accent-primary)' }}>
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* Warning banner when below floor */}
        {isBelowFloor && (
          <div className="mb-4 p-3 rounded-lg flex items-center gap-3" style={{ background: 'rgba(245, 158, 11, 0.2)', border: '2px solid #f59e0b' }}>
            <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
            <div>
              <div className="font-bold text-amber-500">Warning: Below Cost!</div>
              <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Your current quote (${midTier.toFixed(2)}) is below your floor price (${lowTier.toFixed(2)}). 
                You will lose money at this rate.
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-3 gap-4">
          {/* Low Tier - Minimum Price (Costs + minimal markup) */}
          <div className="text-center p-4 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '2px solid #ef4444' }}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-red-500" />
              <span className="text-sm font-bold text-red-500">Minimum Price</span>
            </div>
            <div className="text-3xl font-bold mb-1" style={{ color: '#ef4444' }}>
              ${lowTier.toFixed(2)}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Costs + minimal markup
            </div>
            <div className="mt-2 text-xs font-semibold text-red-400">
              Break-even floor<br />Never go below this
            </div>
          </div>

          {/* Mid Tier - Invoice number (Current calculation) */}
          <div 
            className="text-center p-4 rounded-lg" 
            style={{ 
              background: isBelowFloor ? 'rgba(245, 158, 11, 0.2)' : 'rgba(34, 197, 94, 0.1)', 
              border: isBelowFloor ? '2px solid #f59e0b' : '2px solid #22c55e' 
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              {isBelowFloor ? (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              ) : (
                <Zap className="w-5 h-5 text-green-500" />
              )}
              <span className={`text-sm font-bold ${isBelowFloor ? 'text-amber-500' : 'text-green-500'}`}>
                Current Quote
              </span>
            </div>
            <div className="text-3xl font-bold mb-1" style={{ color: isBelowFloor ? '#f59e0b' : '#22c55e' }}>
              ${midTier.toFixed(2)}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {isBelowFloor ? 'BELOW FLOOR!' : 'Your calculated total'}
            </div>
            <div className={`mt-2 text-xs font-semibold ${isBelowFloor ? 'text-amber-400' : 'text-green-400'}`}>
              {isBelowFloor ? 'Increase rate or\nadjust experience level' : 'Standard pricing\nBased on your selections'}
            </div>
          </div>

          {/* High Tier - Desired profit (Premium) */}
          <div className="text-center p-4 rounded-lg" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '2px solid #3b82f6' }}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-bold text-blue-500">Negotiation High</span>
            </div>
            <div className="text-3xl font-bold mb-1" style={{ color: '#3b82f6' }}>
              ${highTier.toFixed(2)}
            </div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              +{Math.round(desiredProfitPercent)}% premium
            </div>
            <div className="mt-2 text-xs font-semibold text-blue-400">
              Premium pricing<br />For high-value clients
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
