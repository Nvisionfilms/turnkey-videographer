import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Affiliate landing page - redirects based on login status
 * If logged in: go to dashboard
 * If not logged in: go to login
 */
export default function Affiliate() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if affiliate is logged in
    const affiliateCode = localStorage.getItem('affiliateCode');
    
    if (affiliateCode) {
      // Logged in - go to dashboard
      navigate(`/affiliate/dashboard?code=${affiliateCode}`, { replace: true });
    } else {
      // Not logged in - go to login
      navigate('/affiliate/login', { replace: true });
    }
  }, [navigate]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-primary)' }}>
      <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
    </div>
  );
}
