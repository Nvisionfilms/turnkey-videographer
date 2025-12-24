import React, { useState, useEffect } from 'react';
import { DollarSign, ChevronUp, ChevronDown } from 'lucide-react';

export default function MobileFloatingTotal({ total, onExpand }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);

  // Show/hide based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Show when scrolling down past 200px
      if (currentScrollY > 200) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
      
      // Check if near bottom
      setIsAtBottom(currentScrollY + windowHeight >= documentHeight - 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!total) return null;

  const handleArrowClick = () => {
    if (isAtBottom) {
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Scroll to bottom (to LiveTotalsPanel)
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    }
  };

  return (
    <div 
      className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-bottom transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div 
        className="border-t-2 shadow-2xl"
        style={{ 
          background: 'var(--color-bg-secondary)', 
          borderColor: 'var(--color-accent-primary)' 
        }}
      >
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'var(--color-bg-tertiary)' }}
            >
              <DollarSign className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
            </div>
            <div className="text-left">
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Scope-Locked Total
              </div>
              <div className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                ${total.toLocaleString()}
              </div>
            </div>
          </div>
          <button
            onClick={handleArrowClick}
            className="p-2 rounded-full active:scale-95 transition-transform"
            style={{ background: 'var(--color-bg-tertiary)' }}
          >
            {isAtBottom ? (
              <ChevronUp className="w-6 h-6" style={{ color: 'var(--color-accent-primary)' }} />
            ) : (
              <ChevronDown className="w-6 h-6" style={{ color: 'var(--color-accent-primary)' }} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
