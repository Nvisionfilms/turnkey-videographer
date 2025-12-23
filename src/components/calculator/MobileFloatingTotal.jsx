import React, { useState } from 'react';
import { DollarSign, ChevronUp, ChevronDown } from 'lucide-react';

export default function MobileFloatingTotal({ total, onExpand }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!total) return null;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      <div 
        className="border-t-2 shadow-2xl"
        style={{ 
          background: 'var(--color-bg-secondary)', 
          borderColor: 'var(--color-accent-primary)' 
        }}
      >
        <button
          onClick={() => {
            setIsExpanded(!isExpanded);
            if (onExpand) onExpand(!isExpanded);
          }}
          className="w-full px-4 py-3 flex items-center justify-between active:scale-98 transition-transform"
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(212, 175, 55, 0.2)' }}
            >
              <DollarSign className="w-5 h-5" style={{ color: 'var(--color-accent-primary)' }} />
            </div>
            <div className="text-left">
              <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Quote Total
              </div>
              <div className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                ${total.toLocaleString()}
              </div>
            </div>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
          ) : (
            <ChevronUp className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
          )}
        </button>
      </div>
    </div>
  );
}
