// NEGOTIATION TICKER - Behavioral Self-Confrontation
// Cards are REACTIVE, not informative. Slider creates tension.
// Psychology: The system reacts, it doesn't explain.

import React, { useEffect, useRef } from 'react';

export default function NegotiationTicker({ calculations, settings, customPriceOverride, onPriceChange, isUnlocked }) {
  const prevCurrentRef = useRef(null);
  
  if (!calculations || !calculations.total) {
    return null;
  }

  const minimum = calculations.negotiationLow || 0;
  const baseQuote = calculations.total;
  const desired = calculations.negotiationHigh || baseQuote;
  const range = desired - minimum;
  
  // Use custom override if set, otherwise use base quote
  const current = customPriceOverride || baseQuote;

  const sliderPct = range > 0 ? ((Math.max(minimum, Math.min(current, desired)) - minimum) / range) * 100 : 0;
  const hasOverride = customPriceOverride !== null && customPriceOverride !== undefined;
  
  const isBelowMinimum = current < minimum;
  const isAboveDesired = current >= desired;
  
  // Detect threshold crossings for visual feedback
  useEffect(() => {
    if (prevCurrentRef.current !== null) {
      const prev = prevCurrentRef.current;
    }
    prevCurrentRef.current = current;
  }, [current, minimum, desired]);
  
  // Dynamic consequence text for DECISION card - no emotional adjectives
  const getDecisionText = () => {
    return 'What you are choosing.';
  };

  const formatMoney = (n) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(n);
  };

  // Calculate position for range bar (0-1)
  const currentPos = range > 0 ? Math.max(0, Math.min(1, (current - minimum) / range)) : 0.5;

  const handleSliderChange = (e) => {
    const value = Number(e.target.value);
    // Floor is the hard stop - can't go below minimum
    const clampedValue = Math.max(minimum, value);
    if (onPriceChange) {
      onPriceChange(clampedValue);
    }
  };

  const clearOverride = () => {
    if (onPriceChange) {
      onPriceChange(null);
    }
  };

  // Dynamic text for FLOOR card - consequence framing only
  const getFloorText = () => {
    return 'Cannot go below this';
  };

  const getIntentText = () => {
    return 'Set before pressure';
  };

  return (
    <div className="rounded-lg p-4" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
      {/* Minimal header */}
      <div className="text-xs uppercase tracking-wide mb-3" style={{ color: 'var(--color-text-muted)' }}>
        Decision Boundaries
      </div>
      
      {/* Three cards row - REACTIVE, responsive */}
      <div className="flex flex-row gap-2 md:gap-4 mb-4 overflow-x-auto" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {/* FLOOR Card - Amber */}
        <div 
          className="flex-1 min-w-0 p-3 md:p-4 rounded-lg text-center transition-all duration-150" 
          style={{ 
            background: 'rgba(139, 94, 52, 0.12)',
            border: isBelowMinimum ? '2px solid #8B5E34' : '1px solid rgba(139, 94, 52, 0.35)'
          }}
        >
          <div 
            className="text-xs font-semibold uppercase tracking-wide mb-1"
            style={{ color: '#8B5E34' }}
          >
            FLOOR
          </div>
          <div className="text-lg md:text-2xl font-bold mb-1" style={{ color: '#8B5E34' }}>
            {isUnlocked ? formatMoney(minimum) : 'HIDDEN'}
          </div>
          <div 
            className="text-xs font-medium transition-all duration-150 hidden md:block" 
            style={{ color: isBelowMinimum ? '#8B5E34' : 'rgba(139, 94, 52, 0.75)' }}
          >
            {getFloorText()}
          </div>
        </div>

        {/* DECISION Card - Steel Blue */}
        <div 
          className="flex-1 min-w-0 p-3 md:p-4 rounded-lg text-center transition-all duration-150" 
          style={{ 
            background: 'rgba(76, 111, 255, 0.12)',
            border: '2px solid #4C6FFF'
          }}
        >
          <div 
            className="text-xs font-semibold uppercase tracking-wide mb-1"
            style={{ color: '#4C6FFF' }}
          >
            DECISION
          </div>
          <div 
            className="text-lg md:text-2xl font-bold mb-1" 
            style={{ color: '#4C6FFF' }}
          >
            {isUnlocked ? formatMoney(current) : 'HIDDEN'}
          </div>
          <div 
            className="text-xs font-medium hidden md:block" 
            style={{ color: '#4C6FFF' }}
          >
            {getDecisionText()}
          </div>
        </div>

        {/* INTENT Card - Desaturated Green */}
        <div 
          className="flex-1 min-w-0 p-3 md:p-4 rounded-lg text-center transition-all duration-300" 
          style={{ 
            background: 'rgba(58, 127, 90, 0.12)',
            border: isAboveDesired ? '2px solid #3A7F5A' : '1px solid rgba(58, 127, 90, 0.35)'
          }}
        >
          <div 
            className="text-xs font-semibold uppercase tracking-wide mb-1"
            style={{ color: '#3A7F5A' }}
          >
            INTENT
          </div>
          <div className="text-lg md:text-2xl font-bold mb-1" style={{ color: '#3A7F5A' }}>
            {isUnlocked ? formatMoney(desired) : 'HIDDEN'}
          </div>
          <div className="text-xs hidden md:block" style={{ color: 'rgba(58, 127, 90, 0.80)' }}>
            {getIntentText()}
          </div>
        </div>
      </div>

      {/* Interactive Slider - Pill shape, steel blue fill */}
      {range > 0 && onPriceChange && (
        <div className="mb-3 py-4">
          <div className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Explore price pressure between floor and intent.
          </div>
          <input
            type="range"
            min={minimum}
            max={desired}
            step={Math.max(1, Math.floor(range / 100))}
            value={Math.max(minimum, current)}
            onChange={handleSliderChange}
            className="w-full rounded-full cursor-pointer negotiation-slider"
            style={{
              height: '16px',
              WebkitAppearance: 'none',
              appearance: 'none',
              borderRadius: '9999px',
              outline: 'none',
              background: 'transparent',
              '--turnkeyPct': sliderPct
            }}
          />

          <div className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
            Moving this does not change your floor or intent. It shows trade-offs.
          </div>

          <style>{`
            .negotiation-slider {
              -webkit-appearance: none;
              appearance: none;
            }
            .negotiation-slider::-webkit-slider-runnable-track {
              height: 16px;
              border-radius: 9999px;
              background:
                linear-gradient(to right, #4C6FFF, #4C6FFF) 0 0 / calc(var(--turnkeyPct) * 1%) 100% no-repeat,
                #1F2533;
              box-shadow: inset 0 0 0 1px rgba(230, 233, 239, 0.06);
            }
            .negotiation-slider::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 18px;
              height: 18px;
              border-radius: 9999px;
              background: var(--color-bg-tertiary);
              border: 2px solid rgba(230, 233, 239, 0.22);
              margin-top: -1px;
            }

            .negotiation-slider::-moz-range-track {
              height: 16px;
              border-radius: 9999px;
              background:
                linear-gradient(to right, #4C6FFF, #4C6FFF) 0 0 / calc(var(--turnkeyPct) * 1%) 100% no-repeat,
                #1F2533;
              box-shadow: inset 0 0 0 1px rgba(230, 233, 239, 0.06);
            }
            .negotiation-slider::-moz-range-thumb {
              width: 18px;
              height: 18px;
              border-radius: 9999px;
              background: var(--color-bg-tertiary);
              cursor: grab;
              border: 2px solid rgba(230, 233, 239, 0.22);
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            }
            .negotiation-slider::-moz-range-thumb:active {
              cursor: grabbing;
              transform: scale(1.1);
            }
          `}</style>
        </div>
      )}

      {/* Range bar visual (when no slider) */}
      {range > 0 && !onPriceChange && (
        <div className="relative h-2 mb-3" style={{ background: 'var(--color-border)', borderRadius: '2px' }}>
          <div 
            className="absolute top-0 bottom-0 w-0.5"
            style={{ left: '0%', background: '#b84a4a' }}
          />
          <div 
            className="absolute top-1/2 w-3 h-3 rounded-full"
            style={{ 
              left: `${currentPos * 100}%`,
              transform: 'translate(-50%, -50%)',
              background: isBelowMinimum ? '#b84a4a' : 'var(--color-text-primary)',
              border: '2px solid var(--color-border)'
            }}
          />
          <div 
            className="absolute top-0 bottom-0 w-0.5"
            style={{ right: '0%', background: 'var(--color-text-muted)' }}
          />
        </div>
      )}

      {/* Clear override link */}
      {hasOverride && onPriceChange && (
        <button 
          onClick={clearOverride}
          className="text-xs hover:underline"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Reset to calculated price
        </button>
      )}

      {/* Warning text - only if below minimum, no icons */}
      {isBelowMinimum && (
        <div className="mt-3 text-sm" style={{ color: '#b84a4a' }}>
          Current quote is below your minimum. This is visible now.
        </div>
      )}
    </div>
  );
}
