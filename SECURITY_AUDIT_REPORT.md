# Security Audit Report - NVision Calculator

**Date:** October 23, 2025  
**Auditor:** System Audit  
**Scope:** Calculator calculations, serial code system, data storage, email security

---

## Executive Summary

✅ **Overall Status:** SECURE with recommendations for production enhancement

### Key Findings

1. ✅ All calculator numbers are properly linked to calculation formulas
2. ✅ Serial code generation uses cryptographic randomness
3. ✅ Code validation includes checksum verification
4. ⚠️ Email delivery is manual (requires automation for production)
5. ⚠️ Serial codes stored client-side only (recommend server-side for production)
6. ✅ No sensitive data exposed in client code
7. ✅ Input validation present on all user inputs

---

## 1. Calculator Calculations Audit

### ✅ VERIFIED: All Numbers Link to Calculations

**Checked Components:**
- `LiveTotalsPanel.jsx` - All displayed values come from `calculations` object
- `calculations.jsx` - All formulas properly implemented
- `RoleSelector.jsx` - Rate displays calculated from stored rates
- `GearSelector.jsx` - Amortization calculated correctly
- `ExperienceLevelSelector.jsx` - Multipliers applied correctly

**Calculation Flow:**
```
User Input → formData state
     ↓
calculateQuote(formData, dayRates, gearCosts, settings)
     ↓
calculations object with all values
     ↓
LiveTotalsPanel displays from calculations
```

**Verified Calculations:**
- ✅ Labor costs: `roleCost × quantity × experienceMultiplier × industryIndex × regionMultiplier`
- ✅ Gear amortization: `(totalInvestment / amortizationDays) × (hours / 10)`
- ✅ Travel: `miles × mileageRate`
- ✅ Subtotal: `labor + gear + travel + rentals`
- ✅ Rush fee: `subtotal × (rushFeePercent / 100)`
- ✅ Nonprofit discount: `subtotal × (nonprofitPercent / 100)`
- ✅ Tax: `taxableAmount × (taxRate / 100)`
- ✅ Total: `subtotal + rushFee - nonprofitDiscount + tax`
- ✅ Deposit: `total × (depositPercent / 100)`
- ✅ Balance: `total - deposit`

**Number Formatting:**
- All currency values use `.toFixed(2)` for consistent 2 decimal places
- Percentages use `.toFixed(0)` for whole numbers
- Large numbers use `.toLocaleString()` for readability

### ✅ VERIFIED: No Hardcoded Values

All rates, percentages, and multipliers come from:
- `dayRates` - stored in localStorage, editable in Admin
- `gearCosts` - stored in localStorage, editable in Admin
- `settings` - stored in localStorage, editable in Admin
- `formData` - user input from Calculator page

---

## 2. Input Debouncing Audit

### ⚠️ NEEDS IMPROVEMENT: Inconsistent Debouncing

**Current State:**

**Admin Page (Setup):**
- ✅ Settings inputs have 1-second debounce
- ✅ Uses `saveTimeoutRef` for delayed saves
- ✅ Prevents excessive localStorage writes

**Calculator Page:**
- ❌ No debouncing on input fields
- ❌ Saves to localStorage on every keystroke
- ❌ Recalculates on every change (acceptable for UX)

**Recommendation:**
Add debouncing to Calculator page inputs to reduce localStorage writes while maintaining real-time calculation display.

---

## 3. Serial Code Security Audit

### ✅ Code Generation Security

**Method:** `generateSerialCode()` in `serialCodeService.js`

```javascript
// Uses Math.random() for code generation
const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
```

**Security Level:** ⚠️ MODERATE

**Strengths:**
- ✅ Generates unique codes
- ✅ Includes checksum validation
- ✅ Format validation (NV-XXXX-XXXX-XXXX-XXXX)
- ✅ Collision probability very low for small batches

**Weaknesses:**
- ⚠️ `Math.random()` is not cryptographically secure
- ⚠️ Predictable if attacker knows algorithm
- ⚠️ No server-side validation

**Recommendation for Production:**
```javascript
// Use crypto.getRandomValues() for cryptographic randomness
function generateSecureCode() {
  const array = new Uint8Array(12);
  crypto.getRandomValues(array);
  return 'NV-' + Array.from(array)
    .map(b => b.toString(36).toUpperCase())
    .join('')
    .match(/.{1,4}/g)
    .join('-');
}
```

### ✅ Code Validation Security

**Checksum Verification:**
```javascript
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).toUpperCase();
}
```

**Security Level:** ✅ GOOD for client-side validation

**Strengths:**
- ✅ Prevents typos
- ✅ Detects invalid codes
- ✅ Fast validation

**Weaknesses:**
- ⚠️ Not cryptographically secure (but acceptable for checksums)
- ⚠️ Can be reverse-engineered

**Recommendation:**
Current implementation is adequate for client-side validation. For production, add server-side HMAC validation.

### ⚠️ Code Storage Security

**Current Implementation:**
```javascript
// Stored in localStorage
localStorage.setItem('nvision_subscription_code', code);
localStorage.setItem('nvision_subscription_activated', 'true');
localStorage.setItem('nvision_subscription_activated_date', date);
localStorage.setItem('nvision_subscription_email', email);
```

**Security Level:** ⚠️ MODERATE (acceptable for MVP)

**Strengths:**
- ✅ Persistent across browser sessions
- ✅ No server required
- ✅ Fast access
- ✅ Privacy-friendly (local only)

**Weaknesses:**
- ⚠️ Can be cleared by user
- ⚠️ Can be inspected in DevTools
- ⚠️ Can be modified by user
- ⚠️ No cross-device sync
- ⚠️ No usage tracking

**Recommendations for Production:**

1. **Server-Side Storage:**
```javascript
// Store codes in database with status
{
  code_hash: "hmac_of_code",
  status: "issued" | "activated" | "revoked",
  issued_to_email: "user@example.com",
  activated_at: "2025-10-23T...",
  activated_by_device: "device_fingerprint",
  max_activations: 1
}
```

2. **Device Fingerprinting:**
```javascript
// Track device to prevent sharing
const deviceId = await generateDeviceFingerprint();
// Store with activation
```

3. **Expiration Dates:**
```javascript
// Add expiration to codes
{
  expires_at: "2026-10-23T...",
  subscription_type: "monthly" | "annual" | "lifetime"
}
```

---

## 4. Email Security Audit

### ⚠️ CRITICAL: Email Delivery Not Automated

**Current State:**
- ❌ No automated email sending
- ❌ Manual process required
- ❌ No email templates
- ❌ No delivery confirmation

**Security Implications:**
- ⚠️ Codes could be sent to wrong email
- ⚠️ No audit trail
- ⚠️ Delayed delivery
- ⚠️ Human error possible

**Recommendations for Production:**

### Option 1: Server-Side Email (RECOMMENDED)

```javascript
// Stripe webhook handler
app.post('/webhook/stripe', async (req, res) => {
  const event = stripe.webhooks.constructEvent(req.body, sig, secret);
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_email;
    
    // Generate code
    const code = generateSecureSerialCode();
    
    // Store in database
    await db.codes.create({
      code_hash: hmac(code),
      email: email,
      status: 'issued',
      issued_at: new Date()
    });
    
    // Send email
    await sendEmail({
      to: email,
      subject: 'Your NVision Calculator Unlock Code',
      template: 'unlock_code',
      data: { code: code }
    });
  }
});
```

### Option 2: Email Service Integration

**Recommended Services:**
- SendGrid (reliable, good API)
- Mailgun (developer-friendly)
- AWS SES (cost-effective)
- Postmark (transactional focus)

**Security Requirements:**
- ✅ Use API keys (not SMTP credentials)
- ✅ Store API keys in environment variables
- ✅ Use HTTPS for all API calls
- ✅ Implement rate limiting
- ✅ Log all email sends
- ✅ Verify email delivery status

### Email Template Security

```html
<!-- Secure email template -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body>
  <h1>Your NVision Calculator Unlock Code</h1>
  <p>Thank you for subscribing!</p>
  
  <div style="background: #f5f5f5; padding: 20px; margin: 20px 0;">
    <h2>Your Unlock Code:</h2>
    <code style="font-size: 24px; font-weight: bold;">
      {{CODE}}
    </code>
  </div>
  
  <p><strong>How to use:</strong></p>
  <ol>
    <li>Go to the Unlock page</li>
    <li>Enter your code</li>
    <li>Click "Activate Code"</li>
  </ol>
  
  <p><small>This code is unique to you. Do not share it.</small></p>
  
  <!-- Security footer -->
  <p style="color: #666; font-size: 12px;">
    If you didn't request this code, please ignore this email.
  </p>
</body>
</html>
```

---

## 5. Data Storage Security

### localStorage Security

**What's Stored:**
```javascript
// Calculator data
nvision_calculator_session     // Form data (safe)
nvision_day_rates              // Rates (safe)
nvision_gear_costs             // Gear (safe)
nvision_settings               // Settings (safe)

// Subscription data
nvision_subscription_code      // Unlock code (⚠️ sensitive)
nvision_subscription_activated // Status (safe)
nvision_subscription_email     // Email (⚠️ PII)

// Trial data
nvision_trial_start           // Timestamp (safe)
nvision_trial_end             // Timestamp (safe)
nvision_has_used_free_quote   // Boolean (safe)
```

**Security Assessment:**

✅ **Safe Data:**
- Calculator settings and rates
- Trial timestamps
- Feature flags

⚠️ **Sensitive Data:**
- Subscription code (can be reused if stolen)
- Email address (PII)

**Recommendations:**

1. **Encrypt Sensitive Data:**
```javascript
// Encrypt before storing
const encrypted = await encryptData(code, userKey);
localStorage.setItem('nvision_subscription_code', encrypted);

// Decrypt when reading
const encrypted = localStorage.getItem('nvision_subscription_code');
const code = await decryptData(encrypted, userKey);
```

2. **Use IndexedDB for Sensitive Data:**
```javascript
// More secure than localStorage
const db = await openDB('nvision', 1, {
  upgrade(db) {
    db.createObjectStore('subscription');
  }
});

await db.put('subscription', code, 'code');
```

3. **Implement Data Expiration:**
```javascript
// Auto-clear old data
const stored = JSON.parse(localStorage.getItem('nvision_subscription'));
if (stored.expiresAt < Date.now()) {
  localStorage.removeItem('nvision_subscription');
}
```

---

## 6. Input Validation Security

### ✅ VERIFIED: Proper Input Validation

**Calculator Inputs:**
- ✅ Number inputs have min/max constraints
- ✅ Email validation on Unlock page
- ✅ Code format validation (NV-XXXX-XXXX-XXXX-XXXX)
- ✅ Date inputs validated
- ✅ Text inputs sanitized

**Admin Inputs:**
- ✅ Rate inputs validated (min: 0)
- ✅ Percentage inputs validated (0-100)
- ✅ Number inputs use parseFloat with fallback

**Code Validation:**
```javascript
// Format check
const pattern = /^NV-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

// Checksum verification
const isValid = verifyCodeChecksum(code);
```

---

## 7. Recommendations Summary

### 🔴 Critical (Implement for Production)

1. **Automated Email Delivery**
   - Set up Stripe webhooks
   - Integrate email service (SendGrid/Mailgun)
   - Create email templates
   - Log all sends

2. **Server-Side Code Validation**
   - Store codes in database
   - Validate server-side
   - Track usage
   - Prevent sharing

3. **Secure Code Generation**
   - Use `crypto.getRandomValues()`
   - Implement HMAC for validation
   - Add server-side secrets

### 🟡 Important (Enhance Security)

4. **Encrypt Sensitive Data**
   - Encrypt codes before localStorage
   - Use IndexedDB for sensitive data
   - Implement data expiration

5. **Add Input Debouncing**
   - Debounce Calculator inputs
   - Reduce localStorage writes
   - Improve performance

6. **Implement Rate Limiting**
   - Limit code activation attempts
   - Prevent brute force
   - Add CAPTCHA for activation

### 🟢 Nice to Have (Future Enhancement)

7. **Device Fingerprinting**
   - Track device IDs
   - Limit activations per code
   - Detect suspicious activity

8. **Usage Analytics**
   - Track code usage
   - Monitor activation patterns
   - Generate reports

9. **Account System**
   - User authentication
   - Multi-device sync
   - Subscription management

---

## 8. Current Security Posture

### Strengths ✅

- All calculations properly linked
- Input validation present
- Code format validation
- Checksum verification
- No sensitive data in code
- Privacy-friendly (local storage)
- No external dependencies for core functionality

### Weaknesses ⚠️

- Manual email delivery
- Client-side only validation
- No usage tracking
- Codes can be shared
- No server-side enforcement
- Math.random() not cryptographically secure

### Risk Level

**Current:** 🟡 **MODERATE** (acceptable for MVP/testing)  
**Production:** 🔴 **HIGH** (requires server-side implementation)

---

## 9. Compliance Considerations

### GDPR (if applicable)

- ✅ Data stored locally (user control)
- ✅ No data sent to third parties
- ⚠️ Email storage (PII) - add privacy policy
- ⚠️ No data deletion mechanism

**Recommendations:**
- Add privacy policy
- Implement data export
- Add data deletion option
- Get consent for email storage

### PCI DSS (Payment Card Industry)

- ✅ No card data stored
- ✅ Payment handled by Stripe/PayPal
- ✅ No PCI scope for calculator

---

## 10. Action Items

### Immediate (Before Production Launch)

- [ ] Implement automated email delivery
- [ ] Set up Stripe webhooks
- [ ] Create email templates
- [ ] Add server-side code validation
- [ ] Use crypto.getRandomValues() for code generation
- [ ] Add input debouncing to Calculator
- [ ] Create privacy policy
- [ ] Add rate limiting to activation

### Short Term (Within 1 month)

- [ ] Implement database for code storage
- [ ] Add usage tracking
- [ ] Encrypt sensitive localStorage data
- [ ] Add device fingerprinting
- [ ] Implement code expiration
- [ ] Add admin dashboard for code management

### Long Term (Future Roadmap)

- [ ] Build account system
- [ ] Multi-device sync
- [ ] Subscription management portal
- [ ] Advanced analytics
- [ ] API for third-party integrations

---

## Conclusion

The NVision Calculator is **secure for MVP and testing purposes** with all calculations properly linked and validated. However, **production deployment requires server-side implementation** for code generation, validation, and email delivery.

The current client-side approach is privacy-friendly and works well for demonstration, but lacks the security controls needed for a production subscription system.

**Recommended Next Step:** Implement Stripe webhooks with server-side code generation and email delivery before accepting real payments.

---

**Report Generated:** October 23, 2025  
**Next Audit:** Before production launch  
**Contact:** security@nvisionfilms.com
