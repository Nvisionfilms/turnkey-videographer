# NVision Turnkey Videographer v3.0
## Complete Platform Brain Hub

---

# 🎯 CORE IDENTITY

**What It Is:** Pricing infrastructure that records and constrains pricing decisions.
**Who It's For:** Independent videographers whose work has outgrown "gut feel" pricing.
**Core Promise:** "See what your pricing decisions actually cost."
**Business Model:** Visibility-first tool → Access unlock ($19/mo or $149/yr)

---

# 🧠 MIND GRAPH: SYSTEM ARCHITECTURE

```
ROOT: NVision Platform
│
├── 👤 USER JOURNEY
│   ├── Discovery
│   │   ├── Landing Page → Problem statement
│   │   ├── Affiliate Referral → ?ref=CODE in URL
│   │   └── Organic/Direct → helpmefilm.com
│   │
│   ├── Evaluation (Free)
│   │   ├── Calculator → 1 free decision entry
│   │   ├── AmIReady Quiz → Readiness check
│   │   └── Content Playbook → Scope definition
│   │
│   ├── Commitment
│   │   ├── Unlock Page → Access tiers shown
│   │   ├── Stripe Checkout → Payment processing
│   │   ├── Webhook → Code generation + email
│   │   └── Activation → Code entry + device binding
│   │
│   └── Continuation
│       ├── Unlimited Entries → Full calculator access
│       ├── Quote History → Decision record
│       ├── Setup Rates → Rate configuration
│       └── Deliverable Calculator → Package pricing
│
├── 💰 REVENUE ENGINE
│   ├── Products
│   │   ├── Operator Monthly → $19/month
│   │   └── Operator Annual → $149/year (35% off)
│   │
│   ├── Payment Flow
│   │   ├── Stripe Payment Links → Hosted checkout
│   │   ├── Webhook Listener → checkout.session.completed
│   │   ├── Unlock Code Generation → NV-XXXX-XXXX-XXXX-XXXX
│   │   ├── Email Delivery → Resend API
│   │   └── Database Storage → Railway PostgreSQL
│   │
│   └── Protection
│       ├── Server-Side Validation → No localStorage bypass
│       ├── Device Fingerprinting → Machine binding
│       ├── Refund Detection → charge.refunded webhook
│       └── Access Revocation → Automatic on refund
│
├── 🤝 AFFILIATE SYSTEM
│   ├── Signup Flow
│   │   ├── /affiliate/signup → Create account
│   │   ├── Unique Code Generation → FIRSTNA + random
│   │   ├── Password Hashing → bcrypt
│   │   └── PayPal Email Storage → For payouts
│   │
│   ├── Tracking Flow
│   │   ├── Referral URL → helpmefilm.com?ref=CODE
│   │   ├── Cookie Storage → 30-day attribution
│   │   ├── Click Tracking → Increment on visit
│   │   └── Stripe Pass-through → client_reference_id
│   │
│   ├── Commission Flow
│   │   ├── Checkout Complete → Webhook fires
│   │   ├── Affiliate Lookup → Match code to affiliate
│   │   ├── Self-Referral Block → Customer ≠ Affiliate email
│   │   ├── Ledger Entry → Status: PENDING
│   │   ├── 14-Day Hold → eligible_at = now + 14 days
│   │   ├── Auto-Clear Cron → PENDING → CLEARED (daily)
│   │   └── Payout Batch → CLEARED → PAID (manual)
│   │
│   ├── Commission Rates (Fixed per product)
│   │   ├── Monthly ($19) → $2.85 commission
│   │   └── Annual ($149) → $22.35 commission
│   │
│   ├── Fraud Protection
│   │   ├── Self-Referral Block → Automatic
│   │   ├── Refund Reversal → charge.refunded → REVERSED
│   │   ├── Dispute Reversal → charge.dispute.created → REVERSED + PAUSE
│   │   ├── Refund Threshold → 3+ refunds → Auto-pause affiliate
│   │   └── Minimum Payout → $25 threshold
│   │
│   └── Payout Flow
│       ├── Auto-Clear → Runs every 24 hours
│       ├── Ready Check → Sum cleared ≥ $25
│       ├── Batch Creation → Groups by affiliate
│       ├── CSV Export → Name, PayPal, Amount
│       ├── Manual PayPal → Admin sends payment
│       └── Mark Paid → CLEARED → PAID
│
├── 🔐 ACCESS CONTROL
│   ├── Admin
│   │   ├── Email: nvisionmg@gmail.com
│   │   ├── Login → /affiliate/login (shared form)
│   │   ├── Token Storage → localStorage.adminToken
│   │   └── Access → /admin/* routes
│   │
│   ├── Affiliate
│   │   ├── Login → /affiliate/login
│   │   ├── Session → localStorage.affiliateCode
│   │   └── Access → /affiliate/dashboard
│   │
│   └── User
│       ├── No Login Required → Code-based access
│       ├── Unlock Code → Stored in localStorage
│       ├── Device Binding → Single-machine activation
│       └── Validation → Server-side on every load
│
└── 🏗️ INFRASTRUCTURE
    ├── Frontend
    │   ├── Framework → React + Vite
    │   ├── Styling → TailwindCSS + CSS Variables
    │   ├── Components → shadcn/ui
    │   ├── Hosting → Netlify (auto-deploy from GitHub)
    │   └── Domain → helpmefilm.com
    │
    ├── Backend
    │   ├── Framework → Express.js
    │   ├── Database → PostgreSQL (Railway)
    │   ├── Hosting → Railway (auto-deploy from GitHub)
    │   └── URL → backend-backend-c520.up.railway.app
    │
    └── Integrations
        ├── Stripe → Payments + Webhooks
        ├── Resend → Transactional Email
        └── GitHub → CI/CD Pipeline
```

---

# 📊 DATABASE SCHEMA

```
ROOT: Railway PostgreSQL
│
├── users
│   ├── id, email, unlock_code
│   ├── subscription_type, status
│   ├── expires_at, stripe_session_id
│   └── device_id (machine binding)
│
├── unlock_codes
│   ├── id, code, email
│   ├── status (unused/active/revoked)
│   ├── device_id, activated_at
│   └── stripe_session_id
│
├── affiliates
│   ├── id, code, name, email, password
│   ├── paypal_email, status
│   ├── total_clicks, total_conversions
│   ├── total_earnings, pending_payout, paid_out
│   ├── refund_count, last_refund_at
│   └── created_at
│
├── affiliate_commissions (LEDGER)
│   ├── id, affiliate_id, affiliate_code
│   ├── stripe_event_id, checkout_session_id
│   ├── payment_intent_id, customer_email
│   ├── product_key, gross_amount_cents, commission_cents
│   ├── status (pending/cleared/paid/reversed)
│   ├── eligible_at, paid_at, reversed_at
│   ├── reversal_reason, batch_id
│   └── created_at
│
├── affiliate_payout_batches
│   ├── id, status (created/paid/void)
│   ├── total_amount_cents, affiliate_count
│   ├── notes, paid_at
│   └── created_at
│
├── conversions (DEPRECATED - READ ONLY)
│   └── affiliate_code, unlock_key, amount, status
│
└── discount_codes
    └── code, discount_percent, max_uses, uses_count
```

---

# 🔄 KEY FLOWS

## Flow 1: Unrecorded → Recorded

```
Visit Site → Use Calculator (1 free entry) → Hit Limit → 
See Access Tiers → Commit → Stripe Checkout → 
Payment Success → Webhook Fires → Code Generated → 
Email Sent → User Enters Code → Full Access
```

## Flow 2: Affiliate Referral → Commission

```
Affiliate Shares Link → User Clicks (?ref=CODE) → 
Cookie Stored (30 days) → User Browses → 
User Pays → Stripe Passes client_reference_id → 
Webhook Matches Affiliate → Commission Created (PENDING) → 
14 Days Pass → Auto-Clear (CLEARED) → 
Admin Creates Batch → Pays via PayPal → Marks Paid
```

## Flow 3: Refund → Commission Reversal

```
Customer Requests Refund → Stripe Processes → 
charge.refunded Webhook → Find Commission by payment_intent → 
Mark REVERSED → Increment Affiliate refund_count → 
If 3+ Refunds → Auto-Pause Affiliate
```

## Flow 4: Daily Automation

```
Server Starts → 10 sec delay → Run Auto-Clear → 
Every 24 Hours → Check PENDING commissions → 
If eligible_at ≤ NOW → Update to CLEARED
```

---

# 🎨 USER INTERFACE PAGES

| Page | Purpose | Access |
|------|---------|--------|
| `/` (Calculator) | Decision entry point | Free (1 entry) / Unlocked (unlimited) |
| `/DeliverableCalculator` | Package pricing | Unlocked |
| `/ContentPlaybook` | Scope definition | Unlocked |
| `/QuoteHistory` | Decision record | Unlocked |
| `/Admin` | Rate configuration | Unlocked |
| `/Unlock` | Access + activation | All |
| `/AmIReady` | Readiness check | Free |
| `/LandingPage` | Problem statement | Free |
| `/Terms` | Terms of service | Free |
| `/Privacy` | Privacy policy | Free |
| `/affiliate` | Smart redirect | All |
| `/affiliate/login` | Affiliate login | Distribution partners |
| `/affiliate/signup` | Affiliate registration | Public |
| `/affiliate/dashboard` | Affiliate stats | Distribution partners |
| `/admin/affiliates` | Manage affiliates | Admin |
| `/admin/analytics` | Platform stats | Admin |

---

# 💡 BUSINESS LOGIC PRINCIPLES

## Pricing Philosophy
- **Free tier exists to demonstrate value** → 1 quote shows the tool works
- **Paywall is soft** → User sees value before being asked to pay
- **Annual discount is significant** → 35% off incentivizes commitment

## Affiliate Philosophy
- **14-day hold is non-negotiable** → Protects against refund fraud
- **Fixed commissions, not percentages** → No drift when pricing changes
- **Self-referral blocked** → Affiliates can't game the system
- **Auto-pause on abuse** → 3 refunds = automatic suspension

## Security Philosophy
- **Server is source of truth** → No localStorage bypass possible
- **Device binding** → One code = one machine
- **Webhook verification** → Stripe signature validation
- **Refund = revocation** → No paying for access you don't keep

## Automation Philosophy
- **Minimize admin work** → Cron handles clearing
- **Manual payouts by design** → Human reviews before money moves
- **Webhooks handle edge cases** → Refunds/disputes auto-process

---

# 📈 MARKETING ANGLES

## For Videographers (Customers)
- "Stop guessing. Start quoting."
- "Your rates, calculated in seconds."
- "Know your worth before the client call."
- "The pricing tool built by videographers, for videographers."

## For Affiliates
- "Earn 15% on every sale you refer."
- "30-day cookie. Get credit for the sale."
- "Payouts every week. $25 minimum."
- "Your audience needs this. You get paid."

## Differentiators
- **Not a generic calculator** → Built specifically for video production
- **Not subscription-locked features** → One price, all features
- **Not complicated** → Enter details, get quote, done

---

# 🔧 ADMIN TOOLS

| Tool | Location | Purpose |
|------|----------|---------|
| `admin-commissions.html` | Local file | Manage payouts, run auto-clear, export CSV |
| `sync-all.html` | Local file | Sync users/affiliates from backup |
| `delete-refunded.html` | Local file | Remove refunded accounts |
| `run-migration.html` | Local file | Run database migrations |
| `/admin/affiliates` | Web app | View/manage all affiliates |
| `/admin/analytics` | Web app | Platform statistics |

---

# 🚀 DEPLOYMENT

```
Code Push (GitHub)
    │
    ├── Frontend (Netlify)
    │   └── Auto-build + deploy → helpmefilm.com
    │
    └── Backend (Railway)
        └── Auto-build + deploy → backend-backend-c520.up.railway.app
```

---

# 📋 VERSION HISTORY

| Version | Date | Major Changes |
|---------|------|---------------|
| 1.0 | - | Initial calculator launch |
| 2.0 | - | Stripe integration, unlock codes |
| 3.0 | Dec 2024 | Affiliate commission ledger, 14-day hold, automated cron, refund protection |

---

# 🎯 FUTURE CONSIDERATIONS

- **Stripe Connect** → Automated affiliate payouts (no manual PayPal)
- **Subscription tiers** → Different feature levels
- **Team accounts** → Multiple users per license
- **API access** → Integrate with other tools
- **Mobile app** → On-the-go quoting

---

*This document serves as the central brain hub for NVision Turnkey Videographer v3.0. All marketing, development, and strategic decisions should reference this architecture.*
