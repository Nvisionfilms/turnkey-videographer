// POST-EXPORT REFLECTION MODAL - Phase 3
// One sentence. One moment. After agency, never during it.
// This is a receipt for a decision, not a celebration or alert.

import React, { useEffect, useState } from 'react';

/**
 * Generate reflection copy based on quote outcome
 * Three states only: above, below, or exactly at minimum
 */
export function getReflectionCopy({ finalPrice, minimumPrice }) {
  const delta = Math.round(Math.abs(finalPrice - minimumPrice));

  if (finalPrice > minimumPrice) {
    return `You protected $${delta.toLocaleString()} above your minimum on this quote.`;
  }

  if (finalPrice < minimumPrice) {
    return `This quote was $${delta.toLocaleString()} below your minimum. It's visible now.`;
  }

  return `This quote landed exactly at your minimum.`;
}

/**
 * PostExportReflection Modal
 * - No title, no icon, no buttons
 * - Auto-dismisses after ~2.8 seconds
 * - Fade in/out animation
 * - One sentence only
 */
export default function PostExportReflection({ text, onClose }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Fade in after brief delay
    const fadeInTimer = setTimeout(() => setIsVisible(true), 50);
    
    // Start fade out
    const fadeOutTimer = setTimeout(() => setIsFadingOut(true), 2500);
    
    // Close after fade out completes
    const closeTimer = setTimeout(onClose, 2800);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(closeTimer);
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      style={{
        opacity: isVisible && !isFadingOut ? 1 : 0,
        transition: 'opacity 300ms ease-in-out'
      }}
    >
      <div 
        className="max-w-md mx-4 px-8 py-6 rounded-lg text-center"
        style={{
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
        }}
      >
        <p 
          className="text-sm leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {text}
        </p>
      </div>
    </div>
  );
}
