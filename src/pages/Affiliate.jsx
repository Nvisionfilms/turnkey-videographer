import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Affiliate landing page - redirects based on login status
 * Priority: Admin > Affiliate > Guest
 */
export default function Affiliate() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if admin is logged in first
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      // Admin - go to admin affiliate management
      navigate('/admin/affiliates', { replace: true });
      return;
    }
    
    // Check if affiliate is logged in
    const affiliateCode = localStorage.getItem('affiliateCode');
    if (affiliateCode) {
      // Affiliate logged in - go to their dashboard
      navigate(`/affiliate/dashboard?code=${affiliateCode}`, { replace: true });
      return;
    }
    
    // Not logged in - go to login
    navigate('/affiliate/login', { replace: true });
  }, [navigate]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-primary)' }}>
      <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
    </div>
  );
}
