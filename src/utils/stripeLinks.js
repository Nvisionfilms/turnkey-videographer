// STRIPE PAYMENT LINKS - Centralized for auditability
// Do not inline these in components

export const STRIPE_LINKS = {
  operatorMonthly: "https://buy.stripe.com/bJe3cu6XN5ExcQs42E7ss00",
  operatorAnnual: "https://buy.stripe.com/dRmeVcgyn5Ex9EgfLm7ss01"
};

// Get Stripe link with affiliate code appended (for tracking conversions)
export function getStripeLink(plan, affiliateCode = null) {
  const baseUrl = STRIPE_LINKS[plan];
  if (!baseUrl) return null;
  
  // If affiliate code provided, append as client_reference_id
  if (affiliateCode) {
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}client_reference_id=${affiliateCode}`;
  }
  
  return baseUrl;
}

export const STRIPE_PRODUCTS = {
  operatorMonthly: "prod_TehfhDouskoIkz",
  operatorAnnual: "prod_TehhXkCkSiXDaj"
};

// Pricing display values (keep in sync with Stripe)
export const PRICING = {
  free: {
    name: "Free",
    price: 0,
    period: null,
    tagline: "See what you've been missing."
  },
  operatorMonthly: {
    name: "Operator",
    price: 19,
    period: "month",
    tagline: "Commit to seeing your decisions."
  },
  operatorAnnual: {
    name: "Operator Annual",
    price: 149,
    period: "year",
    monthlyEquivalent: 12.42,
    savings: "35%",
    tagline: "A year of discipline."
  }
};
