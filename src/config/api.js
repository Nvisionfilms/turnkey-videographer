// API Configuration for Railway Backend
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://backend-backend-c520.up.railway.app';

export const API_ENDPOINTS = {
  // Affiliates
  affiliateSignup: '/api/affiliates/signup',
  affiliateLogin: '/api/affiliates/login',
  getAffiliate: (code) => `/api/affiliates/${code}`,
  trackClick: (code) => `/api/affiliates/${code}/click`,
  
  // Unlock Codes
  activateCode: '/api/unlock/activate',
  checkStatus: (email) => `/api/unlock/status/${email}`,
  availableCount: '/api/unlock/available-count',
  
  // Conversions
  trackConversion: '/api/conversions',
  getConversions: (code) => `/api/conversions/affiliate/${code}`,
  
  // Admin
  getAllAffiliates: '/api/admin/affiliates',
  markPayout: (id) => `/api/admin/affiliates/${id}/payout`,
  deleteAffiliate: (id) => `/api/admin/affiliates/${id}`,
  
  // Health
  health: '/health'
};

// Helper function for API calls
export async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };
  
  const response = await fetch(url, { ...defaultOptions, ...options });
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || data.message || 'API request failed');
  }
  
  return data;
}
