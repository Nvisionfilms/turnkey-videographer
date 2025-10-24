# NVision Subscription Serial Code System

## Overview

The NVision Turnkey Videographer Calculator now includes a subscription system that allows users to unlock unlimited access using serial codes. This system is designed to work entirely client-side with localStorage, making it simple to deploy while maintaining security through code validation.

## Features

- ✅ **Serial Code Generation** - Generate unique unlock codes with checksums
- ✅ **Code Validation** - Verify code format and checksum before activation
- ✅ **Email Tracking** - Optional email association with activated codes
- ✅ **Trial System** - 3-day free trial remains available
- ✅ **Demo Codes** - Pre-configured codes for testing
- ✅ **Auto-formatting** - Code input automatically formats as NV-XXXX-XXXX-XXXX-XXXX
- ✅ **Persistent Storage** - Activation persists in browser localStorage

## Code Format

All subscription codes follow this format:
```
NV-XXXX-XXXX-XXXX-XXXX
```

Where:
- `NV` - Prefix identifying NVision codes
- `XXXX` - Four alphanumeric characters (repeated 4 times)
- Last segment includes a checksum for validation

Example: `NV-A1B2-C3D4-E5F6-G7H8`

## How It Works

### For Users

1. **Purchase Subscription** - User subscribes via PayPal on the Unlock page
2. **Receive Code** - User receives unlock code via email (manual process currently)
3. **Enter Code** - User enters code on the Unlock page
4. **Validation** - System validates format and checksum
5. **Activation** - Code is activated and stored in localStorage
6. **Unlimited Access** - User now has permanent access on that device

### For Administrators

#### Generating Codes

You can generate codes using the browser console:

```javascript
// Generate a single code
NVisionCodeGen.generateSingleCode()
// Output: "NV-A1B2-C3D4-E5F6-G7H8"

// Generate 10 codes
NVisionCodeGen.generateCodes(10)

// Generate 100 codes and download as CSV
NVisionCodeGen.downloadCodesAsCSV(100)

// Test if a code is valid
NVisionCodeGen.testCode("NV-A1B2-C3D4-E5F6-G7H8")
```

#### Demo Codes (Pre-configured for Testing)

The following codes are pre-configured and will always work:

```
NV-DEMO-TEST-CODE-A1B2
NV-PROD-FULL-YEAR-C3D4
NV-LIFE-TIME-UNLK-E5F6
```

## File Structure

```
src/
├── services/
│   └── serialCodeService.js       # Core serial code logic
├── utils/
│   └── codeGenerator.js           # Code generation utilities
├── components/
│   └── hooks/
│       └── useUnlockStatus.jsx    # React hook for unlock status
└── pages/
    └── Unlock.jsx                 # Unlock page UI
```

## API Reference

### serialCodeService.js

#### `generateSerialCode()`
Generates a new unique serial code with checksum.

```javascript
import { generateSerialCode } from '@/services/serialCodeService';

const code = generateSerialCode();
// Returns: "NV-A1B2-C3D4-E5F6-G7H8"
```

#### `validateCodeFormat(code)`
Validates the format of a code.

```javascript
import { validateCodeFormat } from '@/services/serialCodeService';

const isValid = validateCodeFormat("NV-A1B2-C3D4-E5F6-G7H8");
// Returns: true or false
```

#### `verifyCodeChecksum(code)`
Verifies the checksum of a code.

```javascript
import { verifyCodeChecksum } from '@/services/serialCodeService';

const isValid = verifyCodeChecksum("NV-A1B2-C3D4-E5F6-G7H8");
// Returns: true or false
```

#### `activateSubscriptionCode(code, email)`
Activates a subscription code.

```javascript
import { activateSubscriptionCode } from '@/services/serialCodeService';

const result = activateSubscriptionCode("NV-A1B2-C3D4-E5F6-G7H8", "user@example.com");
// Returns: { success: true/false, message: string, code: string }
```

#### `isSubscriptionActive()`
Checks if a subscription is currently active.

```javascript
import { isSubscriptionActive } from '@/services/serialCodeService';

const isActive = isSubscriptionActive();
// Returns: true or false
```

#### `getSubscriptionDetails()`
Gets details about the active subscription.

```javascript
import { getSubscriptionDetails } from '@/services/serialCodeService';

const details = getSubscriptionDetails();
// Returns: { code: string, activatedDate: string, email: string } or null
```

#### `deactivateSubscription()`
Deactivates the current subscription (for testing/admin).

```javascript
import { deactivateSubscription } from '@/services/serialCodeService';

const result = deactivateSubscription();
// Returns: { success: true, message: string }
```

#### `generateBatchCodes(count)`
Generates multiple codes at once.

```javascript
import { generateBatchCodes } from '@/services/serialCodeService';

const codes = generateBatchCodes(100);
// Returns: Array of 100 unique codes
```

### useUnlockStatus Hook

```javascript
import { useUnlockStatus } from '@/components/hooks/useUnlockStatus';

function MyComponent() {
  const {
    isUnlocked,              // boolean - Is user unlocked (trial or subscription)?
    hasUsedFreeQuote,        // boolean - Has user used their free quote?
    trialDaysLeft,           // number - Days left in trial (null if no trial)
    isTrialActive,           // boolean - Is trial currently active?
    subscriptionDetails,     // object - Subscription details or null
    markFreeQuoteUsed,       // function - Mark free quote as used
    hasUsedTrialBefore,      // function - Check if trial was used
    activateTrial,           // function - Activate 3-day trial
    activateSubscription,    // function - Activate subscription code
  } = useUnlockStatus();
  
  // Use the values and functions...
}
```

## Storage Keys

All data is stored in localStorage with these keys:

```javascript
// Subscription System
nvision_subscription_code           // The activated code
nvision_subscription_activated      // "true" if activated
nvision_subscription_activated_date // ISO date string
nvision_subscription_email          // Associated email

// Legacy/Trial System
nvision_is_unlocked                 // Legacy unlock flag
nvision_trial_start                 // Trial start timestamp
nvision_trial_end                   // Trial end timestamp
nvision_trial_ever_used             // "true" if trial was used
nvision_trial_timestamp             // Trial activation timestamp
nvision_has_used_free_quote         // "true" if free quote used
```

## Workflow Examples

### User Activates Subscription

1. User visits Unlock page
2. User enters code: `NV-DEMO-TEST-CODE-A1B2`
3. System validates format ✓
4. System verifies checksum ✓
5. System checks if already activated ✓
6. Code is activated and stored
7. User is redirected to Calculator
8. User has unlimited access

### Admin Generates Codes for Distribution

```javascript
// Open browser console on any page
// Generate 50 codes and download as CSV
NVisionCodeGen.downloadCodesAsCSV(50);

// File "nvision-codes-[timestamp].csv" is downloaded
// Contains: Serial Code, Status, Generated Date
```

### Testing Code Validation

```javascript
// Test a code
NVisionCodeGen.testCode("NV-DEMO-TEST-CODE-A1B2");

// Console output:
// Code Test Results:
// Code: NV-DEMO-TEST-CODE-A1B2
// Format Valid: true
// Checksum Valid: true (for demo codes)
// Overall Valid: true
```

## Security Considerations

### Current Implementation (Client-Side)

**Pros:**
- Simple deployment
- No backend required
- Works offline
- Fast activation

**Cons:**
- Codes can be shared between users
- No centralized tracking
- Limited to device-level activation

### Production Recommendations

For a production environment with better security:

1. **Server-Side Validation**
   - Store codes in a database
   - Validate codes server-side
   - Track usage and prevent sharing

2. **Email Verification**
   - Send codes via email
   - Require email confirmation
   - Link code to user account

3. **Usage Tracking**
   - Track activations per code
   - Limit activations (e.g., 1 per code)
   - Monitor for abuse

4. **External API Integration**
   - Use payment webhook to auto-generate codes
   - Send codes via email automatically
   - Store activation records externally

## Future Enhancements

### Planned Features

- [ ] **Backend Integration** - Connect to external API for code management
- [ ] **Email Automation** - Auto-send codes after PayPal payment
- [ ] **Usage Analytics** - Track code usage and activations
- [ ] **Subscription Tiers** - Different code types for different plans
- [ ] **Expiration Dates** - Time-limited subscriptions
- [ ] **Multi-Device Support** - Sync across devices with account system
- [ ] **Admin Dashboard** - Web interface for code management

### Integration with External Services

The system is designed to be easily integrated with:

- **Payment Processors** - PayPal, Stripe webhooks
- **Email Services** - SendGrid, Mailgun, AWS SES
- **Database Services** - Firebase, Supabase, MongoDB
- **Authentication** - Auth0, Firebase Auth, custom JWT

## Troubleshooting

### Code Not Activating

**Problem:** User enters code but it doesn't activate

**Solutions:**
1. Check code format (must be NV-XXXX-XXXX-XXXX-XXXX)
2. Verify checksum is correct
3. Check if code is in demo codes list
4. Clear localStorage and try again
5. Check browser console for errors

### Subscription Lost After Browser Clear

**Problem:** User cleared browser data and lost activation

**Solutions:**
1. Re-enter the same code (if not tracked externally)
2. Contact support with purchase email
3. For production: implement account-based system

### Testing Codes Not Working

**Problem:** Generated codes fail validation

**Solutions:**
1. Use demo codes for testing
2. Verify code generator is working: `NVisionCodeGen.testCode(code)`
3. Check console for validation errors
4. Ensure code includes checksum

## Support

For issues or questions:

1. Check this documentation
2. Review browser console for errors
3. Test with demo codes first
4. Contact: support@nvisionfilms.com

## License

This subscription system is part of the NVision Turnkey Videographer Calculator.
All rights reserved © 2025 NVision Films
