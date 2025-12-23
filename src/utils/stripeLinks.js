// STRIPE PAYMENT LINKS - Centralized for auditability
// Do not inline these in components

export const STRIPE_LINKS = {
  operatorMonthly: "https://buy.stripe.com/00w3cvh1l8eIanf2hccIE05",
  operatorAnnual: "https://buy.stripe.com/7sY3cvaCXeD666ZaNIcIE06",
  foundingOperator: "https://buy.stripe.com/bJebJ17qL2Uo2UNbRMcIE07"
};

export const STRIPE_PRODUCTS = {
  operatorMonthly: "prod_TehfhDouskoIkz",
  operatorAnnual: "prod_TehhXkCkSiXDaj",
  foundingOperator: "prod_TehiV9xE4EoS7B"
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
  },
  foundingOperator: {
    name: "Founding Operator",
    price: 299,
    period: "one-time",
    tagline: "You believed early.",
    limited: true,
    spots: 98
  }
};
