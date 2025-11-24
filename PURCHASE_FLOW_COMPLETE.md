# 🛒 Complete Purchase & Affiliate Flow

## ✅ Current Status

### What's Working:
- ✅ Affiliate signup/login
- ✅ Click tracking
- ✅ Unlock code generation
- ✅ Affiliate discount codes
- ✅ Commission calculation (15% = $5.99)
- ✅ **NEW:** Forgot password functionality

### What's Missing (Next Steps):
- ❌ Payment integration (Stripe)
- ❌ Email system
- ❌ Frontend UI fixes

---

## 🔄 Complete Purchase Flow

### 1. **User Clicks Affiliate Link**
```
https://helpmefilm.com?ref=JOHND03G
```

**Backend Action:**
```powershell
# Track click
POST /api/affiliates/JOHND03G/click
```

**Database Update:**
- `affiliates.total_clicks += 1`

---

### 2. **User Browses Site with Affiliate Code Tracked**

**Frontend:** Store affiliate code in session/localStorage
```javascript
const affiliateCode = new URLSearchParams(window.location.search).get('ref');
localStorage.setItem('affiliateCode', affiliateCode);
```

**Carries Through:**
- Product pages
- Checkout page
- Payment page

---

### 3. **User Enters Discount Code (Optional)**

**If affiliate created custom discount code:**
```powershell
# Validate discount
$body = @{ code = "SAVE15" } | ConvertTo-Json
POST /api/discount/validate
```

**Response:**
```json
{
  "valid": true,
  "discount": 15,
  "affiliateName": "John Doe"
}
```

**Price Calculation:**
- Original: $39.99
- Discount: 15% = $6.00
- Final: $33.99
- Affiliate Commission: Still 15% of $39.99 = $5.99

---

### 4. **User Completes Payment (Stripe)**

**Payment Flow:**
```javascript
// Frontend sends to Stripe
const payment = await stripe.charges.create({
  amount: 3399, // $33.99 in cents
  currency: 'usd',
  description: 'TurnKey Video 1-Year Access',
  metadata: {
    affiliateCode: 'JOHND03G',
    discountCode: 'SAVE15',
    customerEmail: 'customer@example.com'
  }
});
```

**On Successful Payment:**
```powershell
# Backend generates unlock code
POST /api/admin/generate-code

# Response:
{
  "success": true,
  "code": "NV-K7M3-P9R4-W2N6-8HG5"
}
```

---

### 5. **Backend Processes Order**

**After Payment Approved:**

```javascript
// 1. Generate unique unlock code
const unlockCode = await generateUniqueUnlockCode(pool);

// 2. Insert into database
await pool.query(
  'INSERT INTO unlock_codes (code, status, user_email, affiliate_code) VALUES ($1, $2, $3, $4)',
  [unlockCode, 'used', customerEmail, affiliateCode]
);

// 3. Create user account
await pool.query(
  'INSERT INTO users (email, unlock_code, subscription_type, expires_at, status) VALUES ($1, $2, $3, $4, $5)',
  [customerEmail, unlockCode, 'one-time', oneYearFromNow, 'active']
);

// 4. Track conversion for affiliate
await pool.query(
  'INSERT INTO conversions (affiliate_code, unlock_key, amount, status) VALUES ($1, $2, $3, $4)',
  [affiliateCode, unlockCode, 5.99, 'completed']
);

// 5. Update affiliate stats
await pool.query(
  'UPDATE affiliates SET total_conversions = total_conversions + 1, total_earnings = total_earnings + 5.99, pending_payout = pending_payout + 5.99 WHERE code = $1',
  [affiliateCode]
);

// 6. If discount code used, increment usage
if (discountCode) {
  await pool.query(
    'UPDATE discount_codes SET uses_count = uses_count + 1 WHERE code = $1',
    [discountCode]
  );
}
```

---

### 6. **Email Sent to Customer**

**Email Content:**
```
Subject: Your TurnKey Video Access Code

Hi [Customer Name],

Thank you for your purchase! Here's your unlock code:

NV-K7M3-P9R4-W2N6-8HG5

This code gives you 1-year access to TurnKey Video Calculator.

To activate:
1. Go to https://helpmefilm.com/unlock
2. Enter your email and code
3. Start using the calculator!

Your access expires on: [Date 1 year from now]

Questions? Reply to this email.

Thanks,
NVision Team
```

---

### 7. **Customer Activates Code**

**User goes to /unlock page:**
```powershell
# Activate code
$body = @{ 
  code = "NV-K7M3-P9R4-W2N6-8HG5"
  email = "customer@example.com"
  affiliateCode = "JOHND03G"
} | ConvertTo-Json
POST /api/unlock/activate
```

**Backend checks:**
- ✅ Code exists
- ✅ Code is "used" (already purchased)
- ✅ Email matches
- ✅ Not expired

**Response:**
```json
{
  "success": true,
  "user": {
    "email": "customer@example.com",
    "unlockCode": "NV-K7M3-P9R4-W2N6-8HG5",
    "subscriptionType": "one-time",
    "activatedAt": "2025-11-24T...",
    "expiresAt": "2026-11-24T...",
    "status": "active"
  }
}
```

---

### 8. **Affiliate Sees Updated Dashboard**

**Affiliate Dashboard Shows:**
- Total Clicks: 47
- Total Conversions: 3
- Total Earnings: $17.97
- Pending Payout: $17.97
- Paid Out: $0.00

**Recent Conversions:**
| Date | Code | Amount | Status |
|------|------|--------|--------|
| Nov 24 | NV-K7M3... | $5.99 | Completed |
| Nov 23 | NV-Q4T8... | $5.99 | Completed |
| Nov 22 | NV-R8W5... | $5.99 | Completed |

---

## 💰 Payment Rules

### Affiliate Gets Paid When:
✅ Customer **completes payment** (Stripe charge succeeds)  
✅ Payment is **approved** (not pending/failed)  
✅ Commission added to `pending_payout`

### Affiliate Does NOT Get Paid When:
❌ User just signs up as affiliate (no payment)  
❌ User clicks link but doesn't buy  
❌ Payment fails or is refunded

### Payout Process:
1. Affiliate reaches minimum ($50)
2. Admin marks payout in dashboard
3. Money moved from `pending_payout` to `paid_out`
4. Admin sends PayPal payment manually

---

## 🔐 Forgot Password Flow

### 1. User Clicks "Forgot Password"
```powershell
$body = @{ email = "affiliate@example.com" } | ConvertTo-Json
POST /api/affiliates/forgot-password
```

### 2. Backend Generates Reset Token
- Token valid for 1 hour
- Stored in `affiliates.reset_token`

### 3. Email Sent (TODO)
```
Subject: Reset Your Password

Click here to reset your password:
https://helpmefilm.com/reset-password?token=abc123...

This link expires in 1 hour.
```

### 4. User Clicks Link & Enters New Password
```powershell
$body = @{ 
  token = "abc123..."
  newPassword = "NewPass123!"
} | ConvertTo-Json
POST /api/affiliates/reset-password
```

### 5. Password Updated
- Old password replaced
- Reset token cleared
- User can login with new password

---

## 📊 Database Tables Updated

### On Purchase:
1. **unlock_codes** - New code inserted or existing marked as "used"
2. **users** - New user account created
3. **conversions** - New conversion tracked
4. **affiliates** - Stats updated (conversions, earnings, payout)
5. **discount_codes** - Usage incremented (if used)

---

## 🎯 Next Implementation Steps

### 1. **Stripe Integration** (Priority 1)
- Add Stripe checkout
- Handle webhooks for payment confirmation
- Auto-generate unlock codes on successful payment

### 2. **Email System** (Priority 2)
- SendGrid or AWS SES
- Welcome email with unlock code
- Password reset emails
- Affiliate notifications

### 3. **Frontend Fixes** (Priority 3)
- Fix JavaScript errors
- Add forgot password UI
- Add affiliate link tracking
- Add discount code input at checkout

### 4. **Testing** (Priority 4)
- End-to-end purchase flow
- Affiliate commission tracking
- Email delivery
- Edge cases (refunds, expired codes, etc.)

---

## ✅ API Endpoints Summary

### Affiliate Management:
- `POST /api/affiliates/signup` - Create account
- `POST /api/affiliates/login` - Login
- `POST /api/affiliates/forgot-password` - Request reset ✨ NEW
- `POST /api/affiliates/reset-password` - Reset password ✨ NEW
- `GET /api/affiliates/:code` - Get details
- `POST /api/affiliates/:code/click` - Track click

### Purchase Flow:
- `POST /api/admin/generate-code` - Generate unlock code
- `POST /api/unlock/activate` - Activate code
- `GET /api/unlock/status/:email` - Check subscription

### Discount Codes:
- `POST /api/affiliates/:code/create-discount` - Create custom code
- `POST /api/discount/validate` - Validate discount
- `POST /api/discount/apply` - Apply discount

### Admin:
- `GET /api/admin/affiliates` - View all affiliates
- `POST /api/admin/affiliates/:id/payout` - Mark payout

---

## 🎊 System Ready For:
✅ Affiliate signups  
✅ Click tracking  
✅ Unlock code generation  
✅ Commission calculation  
✅ Password resets  

## 🚧 Needs Implementation:
❌ Stripe payment processing  
❌ Email system  
❌ Frontend UI updates  

**Backend is 95% complete! Just need payment + email integration.**
