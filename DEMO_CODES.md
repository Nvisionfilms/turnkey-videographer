# Demo Subscription Codes

## Pre-configured Test Codes

These codes are built into the system and will always work for testing purposes:

### Demo Code 1
```
NV-DEMO-TEST-CODE-A1B2
```
**Purpose:** General testing and demonstration  
**Status:** Always valid

### Demo Code 2
```
NV-PROD-FULL-YEAR-C3D4
```
**Purpose:** Production testing (annual subscription simulation)  
**Status:** Always valid

### Demo Code 3
```
NV-LIFE-TIME-UNLK-E5F6
```
**Purpose:** Lifetime unlock simulation  
**Status:** Always valid

## Trial Codes

These codes activate the 3-day free trial:

```
TRIAL3DAY
NVISION3DAY
```

**Note:** Trial can only be used once per device.

## How to Use Demo Codes

1. Navigate to the **Unlock** page
2. (Optional) Enter an email address
3. Enter one of the demo codes above
4. Click **Activate Code**
5. You'll be redirected to the Calculator with unlimited access

## Generating New Codes

Open the browser console (F12) and use:

```javascript
// Generate a single code
NVisionCodeGen.generateSingleCode()

// Generate 10 codes
NVisionCodeGen.generateCodes(10)

// Generate 100 codes and download as CSV
NVisionCodeGen.downloadCodesAsCSV(100)

// Test a code
NVisionCodeGen.testCode("NV-XXXX-XXXX-XXXX-XXXX")
```

## Code Format

All codes follow this pattern:
```
NV-XXXX-XXXX-XXXX-XXXX
```

- **NV** = NVision prefix
- **XXXX** = 4 alphanumeric characters (repeated 4 times)
- Last segment includes a checksum for validation
- Dashes are automatically added when typing

## Testing Workflow

### Test Subscription Activation

1. Open the app in an incognito/private window
2. Navigate through the app until you hit the unlock screen
3. Enter demo code: `NV-DEMO-TEST-CODE-A1B2`
4. Verify activation succeeds
5. Verify unlimited access is granted
6. Close and reopen the window
7. Verify subscription persists

### Test Code Validation

```javascript
// In browser console
NVisionCodeGen.testCode("NV-DEMO-TEST-CODE-A1B2")
// Should return: true

NVisionCodeGen.testCode("NV-INVALID-CODE-XXXX")
// Should return: false
```

### Test Code Generation

```javascript
// Generate and test a new code
const newCode = NVisionCodeGen.generateSingleCode()
NVisionCodeGen.testCode(newCode)
// Should return: true
```

## Deactivating for Testing

To test activation multiple times:

```javascript
// In browser console
localStorage.clear()
// Then refresh the page
```

Or use the serialCodeService directly:

```javascript
import { deactivateSubscription } from '@/services/serialCodeService'
deactivateSubscription()
```

## Production Codes

For production use:

1. Generate codes using `NVisionCodeGen.downloadCodesAsCSV(100)`
2. Store codes securely
3. Distribute codes to customers after payment
4. Track which codes have been sent/used (manual process currently)

## Important Notes

⚠️ **Current Limitations:**
- Codes are validated client-side only
- No server-side tracking of code usage
- Codes can be shared between users
- Activation is device-specific (localStorage)

✅ **For Production:**
- Consider implementing server-side validation
- Track code usage in a database
- Limit activations per code
- Implement email verification
- Add account system for multi-device support

## Support

If you encounter issues with demo codes:

1. Clear browser cache and localStorage
2. Try in incognito/private mode
3. Check browser console for errors
4. Verify code format is correct
5. Contact support if issues persist
