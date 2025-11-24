// AFFILIATE UTILITIES
// Handles affiliate tracking, commission calculations, and data management

const AFFILIATE_STORAGE_KEY = 'affiliates';
const CONVERSIONS_STORAGE_KEY = 'affiliate_conversions';
const REFERRAL_COOKIE_KEY = 'affiliate_ref';
const COOKIE_DURATION_DAYS = 30;

// Commission settings
export const AFFILIATE_CONFIG = {
  commissionPercent: 15,
  unlockPrice: 39.99,
  minimumPayout: 25,
  cookieDurationDays: 30,
  paypalEmail: 'nvisionmg@gmail.com'
};

// Generate unique affiliate code
export function generateAffiliateCode(name) {
  const cleanName = name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 6);
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${cleanName}${randomSuffix}`;
}

// Save affiliate to localStorage
export function saveAffiliate(affiliateData) {
  const affiliates = getAllAffiliates();
  const newAffiliate = {
    id: Date.now().toString(),
    code: generateAffiliateCode(affiliateData.name),
    name: affiliateData.name,
    email: affiliateData.email,
    password: affiliateData.password,
    paypalEmail: affiliateData.paypalEmail,
    createdAt: new Date().toISOString(),
    totalClicks: 0,
    totalConversions: 0,
    totalEarnings: 0,
    pendingPayout: 0,
    paidOut: 0,
    status: 'active'
  };
  
  affiliates.push(newAffiliate);
  localStorage.setItem(AFFILIATE_STORAGE_KEY, JSON.stringify(affiliates));
  return newAffiliate;
}

// Get all affiliates
export function getAllAffiliates() {
  try {
    const data = localStorage.getItem(AFFILIATE_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading affiliates:', error);
    return [];
  }
}

// Get affiliate by code
export function getAffiliateByCode(code) {
  const affiliates = getAllAffiliates();
  return affiliates.find(a => a.code.toLowerCase() === code.toLowerCase());
}

// Update affiliate
export function updateAffiliate(affiliateId, updates) {
  const affiliates = getAllAffiliates();
  const index = affiliates.findIndex(a => a.id === affiliateId);
  if (index !== -1) {
    affiliates[index] = { ...affiliates[index], ...updates };
    localStorage.setItem(AFFILIATE_STORAGE_KEY, JSON.stringify(affiliates));
    return affiliates[index];
  }
  return null;
}

// Set referral cookie
export function setReferralCookie(affiliateCode) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + COOKIE_DURATION_DAYS);
  
  const cookieData = {
    code: affiliateCode,
    timestamp: new Date().toISOString(),
    expires: expiryDate.toISOString()
  };
  
  localStorage.setItem(REFERRAL_COOKIE_KEY, JSON.stringify(cookieData));
  
  // Track click
  trackAffiliateClick(affiliateCode);
}

// Get referral cookie
export function getReferralCookie() {
  try {
    const data = localStorage.getItem(REFERRAL_COOKIE_KEY);
    if (!data) return null;
    
    const cookie = JSON.parse(data);
    const now = new Date();
    const expires = new Date(cookie.expires);
    
    // Check if expired
    if (now > expires) {
      localStorage.removeItem(REFERRAL_COOKIE_KEY);
      return null;
    }
    
    return cookie;
  } catch (error) {
    console.error('Error reading referral cookie:', error);
    return null;
  }
}

// Track affiliate click
export function trackAffiliateClick(affiliateCode) {
  const affiliate = getAffiliateByCode(affiliateCode);
  if (affiliate) {
    updateAffiliate(affiliate.id, {
      totalClicks: affiliate.totalClicks + 1
    });
  }
}

// Track conversion (when someone unlocks)
export function trackConversion(unlockKey) {
  const cookie = getReferralCookie();
  if (!cookie) return null;
  
  const affiliate = getAffiliateByCode(cookie.code);
  if (!affiliate) return null;
  
  // Calculate commission
  const commission = (AFFILIATE_CONFIG.unlockPrice * AFFILIATE_CONFIG.commissionPercent) / 100;
  
  // Create conversion record
  const conversion = {
    id: Date.now().toString(),
    affiliateId: affiliate.id,
    affiliateCode: affiliate.code,
    unlockKey: unlockKey,
    commission: commission,
    timestamp: new Date().toISOString(),
    status: 'pending'
  };
  
  // Save conversion
  const conversions = getAllConversions();
  conversions.push(conversion);
  localStorage.setItem(CONVERSIONS_STORAGE_KEY, JSON.stringify(conversions));
  
  // Update affiliate stats
  updateAffiliate(affiliate.id, {
    totalConversions: affiliate.totalConversions + 1,
    totalEarnings: affiliate.totalEarnings + commission,
    pendingPayout: affiliate.pendingPayout + commission
  });
  
  // Clear cookie after conversion
  localStorage.removeItem(REFERRAL_COOKIE_KEY);
  
  return conversion;
}

// Get all conversions
export function getAllConversions() {
  try {
    const data = localStorage.getItem(CONVERSIONS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading conversions:', error);
    return [];
  }
}

// Get conversions for specific affiliate
export function getAffiliateConversions(affiliateId) {
  const conversions = getAllConversions();
  return conversions.filter(c => c.affiliateId === affiliateId);
}

// Mark payout as complete
export function markPayoutComplete(affiliateId, amount) {
  const affiliate = getAffiliateByCode(affiliateId) || getAllAffiliates().find(a => a.id === affiliateId);
  if (!affiliate) return null;
  
  updateAffiliate(affiliate.id, {
    pendingPayout: Math.max(0, affiliate.pendingPayout - amount),
    paidOut: affiliate.paidOut + amount
  });
  
  // Update conversion statuses
  const conversions = getAllConversions();
  const updated = conversions.map(c => {
    if (c.affiliateId === affiliate.id && c.status === 'pending') {
      return { ...c, status: 'paid', paidAt: new Date().toISOString() };
    }
    return c;
  });
  localStorage.setItem(CONVERSIONS_STORAGE_KEY, JSON.stringify(updated));
  
  return affiliate;
}

// Calculate commission
export function calculateCommission(unlockPrice = AFFILIATE_CONFIG.unlockPrice) {
  return (unlockPrice * AFFILIATE_CONFIG.commissionPercent) / 100;
}

// Check if affiliate can request payout
export function canRequestPayout(affiliate) {
  return affiliate.pendingPayout >= AFFILIATE_CONFIG.minimumPayout;
}

// Generate referral URL
export function generateReferralUrl(affiliateCode) {
  const baseUrl = window.location.origin;
  return `${baseUrl}?ref=${affiliateCode}`;
}
