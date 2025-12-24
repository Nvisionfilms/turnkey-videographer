# Founding Operator Policy (Internal)

## Cap Enforcement

- **Threshold**: Show "SOLD OUT" when purchases reach 90-95
- **Buffer**: 5-10 spots absorb payment race conditions
- **Claim**: "100 spots" honored without edge-case stress

## UI State

When `FOUNDING_SOLD_OUT = true` in `src/utils/stripeLinks.js`:

- Badge shows "SOLD OUT" (not "98 left")
- CTA button disabled, replaced with static "SOLD OUT" text
- Subline: "Early access is no longer available."
- Card remains visible (signals credibility)

## Stripe Action Required

When flipping to sold out:

1. Set `FOUNDING_SOLD_OUT = true` in `stripeLinks.js`
2. **Deactivate the Founding payment link in Stripe dashboard**
3. Keep product active internally for records only

## Post-Purchase Edge Case (if sales exceed 95)

### Action
Refund immediately via Stripe dashboard.

### Email Template

```
Subject: Founding Operator - Refund Processed

Your purchase was received after Founding access reached capacity.
We've issued a full refund and appreciate your interest.

No action required on your end.
```

### Notes
- No alternatives offered automatically
- No waitlist language unless intentional
- No apology or urgency copy

## Reopening (Future)

If reopening Founding access:
- Use a different name (e.g., "Founding II" or "Early Access")
- Do not break the original "100 spots" promise

---

Last updated: December 2024
