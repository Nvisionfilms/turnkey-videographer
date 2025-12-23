// NEGOTIATION TICKER - Behavioral Self-Confrontation
// Cards are REACTIVE, not informative. Slider creates tension.
// Psychology: The system reacts, it doesn't explain.

import React, { useState, useEffect, useRef } from 'react';

export default function NegotiationTicker({ calculations, settings, customPriceOverride, onPriceChange }) {
  const [floorPulse, setFloorPulse] = useState(false);
  const [desiredDim, setDesiredDim] = useState(false);
  const prevCurrentRef = useRef(null);
  
  if (!calculations || !calculations.total) {
    return null;
  }

  const minimum = calculations.negotiationLow || 0;
  const baseQuote = calculations.total;
  const desired = calculations.negotiationHigh || 0;
  
  // Use custom override if set, otherwise use base quote
  const current = customPriceOverride ?? baseQuote;
  const hasOverride = customPriceOverride !== null && customPriceOverride !== undefined;
  
  const isBelowMinimum = current < minimum;
  const isAboveDesired = current >= desired;
  const isCompromised = current > minimum && current < desired;
  
  // Detect threshold crossings for visual feedback
  useEffect(() => {
    if (prevCurrentRef.current !== null) {
      const prev = prevCurrentRef.current;
      // Crossed below minimum - pulse the floor card
      if (prev >= minimum && current < minimum) {
        setFloorPulse(true);
        setTimeout(() => setFloorPulse(false), 300);
      }
      // Moving away from desired - dim it
      if (current < desired * 0.9) {
        setDesiredDim(true);
      } else {
        setDesiredDim(false);
      }
    }
    prevCurrentRef.current = current;
  }, [current, minimum, desired]);
  
  // Dynamic consequence text for DECISION card - no emotional adjectives
  const getDecisionText = () => {
    return 'What you are choosing to send.';
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
  const range = desired - minimum;
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
    return 'Below this, the work costs you money.';
  };

  return (
    <div className="rounded-lg p-4" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
      {/* Consequence line - appears once, neutral */}
      <div className="text-xs mb-4 text-center" style={{ color: 'var(--color-text-muted)' }}>
        These boundaries were set before this quote existed.
      </div>
      
      {/* Three cards row - REACTIVE, responsive */}
      <div className="flex flex-row gap-2 md:gap-4 mb-4 overflow-x-auto" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {/* FLOOR Card - Reactive to threshold crossing */}
        <div 
          className="flex-1 min-w-0 p-3 md:p-4 rounded-lg text-center transition-all duration-150"
          style={{ 
            background: floorPulse ? 'rgba(184, 74, 74, 0.3)' : 'rgba(184, 74, 74, 0.1)', 
            border: isBelowMinimum ? '2px solid #b84a4a' : '1px solid rgba(184, 74, 74, 0.3)',
            transform: floorPulse ? 'scale(1.02)' : 'scale(1)'
          }}
        >
          <div 
            className="text-xs font-semibold uppercase tracking-wide mb-1"
            style={{ color: '#b84a4a' }}
          >
            FLOOR
          </div>
          <div className="text-lg md:text-2xl font-bold mb-1" style={{ color: '#b84a4a' }}>
            {formatMoney(minimum)}
          </div>
          <div 
            className="text-xs font-medium transition-all duration-150 hidden md:block" 
            style={{ color: isBelowMinimum ? '#b84a4a' : 'rgba(184, 74, 74, 0.7)' }}
          >
            {getFloorText()}
          </div>
        </div>

        {/* DECISION Card - Red/Green/Blue based on position */}
        <div 
          className="flex-1 min-w-0 p-3 md:p-4 rounded-lg text-center transition-all duration-150" 
          style={{ 
            background: isBelowMinimum ? 'rgba(184, 74, 74, 0.15)' : isAboveDesired ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)', 
            border: isBelowMinimum ? '2px solid #b84a4a' : isAboveDesired ? '2px solid #3b82f6' : '2px solid #10b981'
          }}
        >
          <div 
            className="text-xs font-semibold uppercase tracking-wide mb-1"
            style={{ color: isBelowMinimum ? '#b84a4a' : isAboveDesired ? '#3b82f6' : '#10b981' }}
          >
            DECISION
          </div>
          <div 
            className="text-lg md:text-2xl font-bold mb-1" 
            style={{ color: isBelowMinimum ? '#b84a4a' : isAboveDesired ? '#3b82f6' : '#10b981' }}
          >
            {formatMoney(current)}
          </div>
          <div 
            className="text-xs font-medium hidden md:block" 
            style={{ color: isBelowMinimum ? '#b84a4a' : isAboveDesired ? '#3b82f6' : '#10b981' }}
          >
            {getDecisionText()}
          </div>
        </div>

        {/* INTENT Card - Blue, dims when abandoned */}
        <div 
          className="flex-1 min-w-0 p-3 md:p-4 rounded-lg text-center transition-all duration-300" 
          style={{ 
            background: isAboveDesired ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)', 
            border: isAboveDesired ? '2px solid #3b82f6' : '1px solid rgba(59, 130, 246, 0.3)',
            opacity: desiredDim ? 0.5 : 1
          }}
        >
          <div 
            className="text-xs font-semibold uppercase tracking-wide mb-1"
            style={{ color: '#3b82f6' }}
          >
            INTENT
          </div>
          <div className="text-lg md:text-2xl font-bold mb-1" style={{ color: '#3b82f6' }}>
            {formatMoney(desired)}
          </div>
          <div className="text-xs hidden md:block" style={{ color: 'rgba(59, 130, 246, 0.8)' }}>
            What you decided was worth pursuing.
          </div>
        </div>
      </div>

      {/* Interactive Slider - Pill shape, red-green-blue gradient */}
      {range > 0 && onPriceChange && (
        <div className="mb-3 py-4">
          <input
            type="range"
            min={minimum}
            max={desired}
            step={Math.max(1, Math.floor(range / 100))}
            value={Math.max(minimum, current)}
            onChange={handleSliderChange}
            onInput={handleSliderChange}
            className="w-full rounded-full cursor-pointer negotiation-slider"
            style={{
              height: '16px',
              background: `linear-gradient(to right, 
                #b84a4a 0%, 
                #10b981 50%, 
                #3b82f6 100%)`,
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              borderRadius: '9999px',
              outline: 'none'
            }}
          />
          <style>{`
            .negotiation-slider {
              -webkit-appearance: none;
              appearance: none;
            }
            .negotiation-slider::-webkit-slider-runnable-track {
              height: 16px;
              border-radius: 9999px;
            }
            .negotiation-slider::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 36px;
              height: 24px;
              border-radius: 9999px;
              background: #fff;
              cursor: grab;
              border: 2px solid #333;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              margin-top: -4px;
            }
            .negotiation-slider::-webkit-slider-thumb:active {
              cursor: grabbing;
              transform: scale(1.1);
            }
            .negotiation-slider::-moz-range-track {
              height: 16px;
              border-radius: 9999px;
              background: transparent;
            }
            .negotiation-slider::-moz-range-thumb {
              width: 36px;
              height: 24px;
              border-radius: 9999px;
              background: #fff;
              cursor: grab;
              border: 2px solid #333;
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
