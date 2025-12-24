// STRIPE PAYMENT LINKS - Centralized for auditability
// Do not inline these in components

export const STRIPE_LINKS = {
  operatorMonthly: "https://buy.stripe.com/test_5kQ28qfwd7sP3wu47A8IU01",
  operatorAnnual: "https://buy.stripe.com/test_28E9AS3NvfZl0ki47A8IU00"
};

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
