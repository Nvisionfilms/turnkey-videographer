# Stripe Payment Setup Guide

## Overview

The NVision Turnkey Videographer Calculator now supports both PayPal and Stripe payment options for subscriptions. This guide explains how to set up Stripe Payment Links.

## Current Implementation

The Unlock page (`src/pages/Unlock.jsx`) includes both payment options:

- **PayPal** - Already configured with button ID
- **Stripe** - Placeholder link that needs to be configured

## Setting Up Stripe Payment Links

### Step 1: Create a Stripe Account

1. Go to [https://stripe.com](https://stripe.com)
2. Click "Sign up" or "Start now"
3. Complete the registration process
4. Verify your email address

### Step 2: Create a Product

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Products** in the left sidebar
3. Click **+ Add product**
4. Fill in the product details:
   - **Name:** NVision Videographer Calculator - Monthly Subscription
   - **Description:** Unlimited access to the NVision Turnkey Videographer Calculator
   - **Pricing model:** Recurring
   - **Price:** $9.99
   - **Billing period:** Monthly
   - **Currency:** USD
5. Click **Save product**

### Step 3: Create a Payment Link

1. In the Stripe Dashboard, go to **Payment Links**
2. Click **+ New**
3. Select your product from the list
4. Configure the payment link:
   - **Collect customer email:** ✅ Yes (required for sending unlock codes)
   - **Collect customer name:** ✅ Yes (optional but recommended)
   - **Allow promotion codes:** ✅ Yes (optional)
   - **After payment:** Redirect to a custom URL
     - URL: `https://your-app-url.com/?payment=success`
5. Click **Create link**
6. Copy the generated payment link URL

### Step 4: Update the Code

Replace the placeholder Stripe link in `src/pages/Unlock.jsx`:

```javascript
// Find this line (around line 180):
<form action="https://buy.stripe.com/test_your_payment_link" method="GET" target="_blank" className="w-full">

// Replace with your actual Stripe Payment Link:
<form action="https://buy.stripe.com/YOUR_ACTUAL_LINK_ID" method="GET" target="_blank" className="w-full">
```

### Step 5: Set Up Webhooks (Optional but Recommended)

To automatically send unlock codes after payment:

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **+ Add endpoint**
3. Enter your webhook URL (you'll need a server endpoint)
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.deleted`
5. Click **Add endpoint**
6. Copy the **Signing secret** for webhook verification

## Payment Link URL Format

Stripe Payment Links follow this format:

```
https://buy.stripe.com/LINK_ID
```

Example:
```
https://buy.stripe.com/test_dR6aEU1234567890
```

For production:
```
https://buy.stripe.com/live_dR6aEU1234567890
```

## Testing with Stripe Test Mode

### Test Mode Setup

1. In Stripe Dashboard, ensure you're in **Test mode** (toggle in top right)
2. Create a test product and payment link
3. Use test card numbers for testing:

**Successful Payment:**
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

**Declined Payment:**
```
Card Number: 4000 0000 0000 0002
```

**Requires Authentication:**
```
Card Number: 4000 0025 0000 3155
```

### Testing the Flow

1. Click the Stripe button on the Unlock page
2. You'll be redirected to Stripe's checkout page
3. Enter test card details
4. Complete the payment
5. You'll be redirected back to your app
6. Manually send the unlock code to the customer's email

## Automating Code Delivery

### Option 1: Stripe Webhooks + Server

Create a server endpoint to handle Stripe webhooks:

```javascript
// Example Node.js/Express webhook handler
app.post('/webhook/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = 'whsec_YOUR_WEBHOOK_SECRET';
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const customerEmail = session.customer_email;
    
    // Generate unlock code
    const unlockCode = generateSerialCode();
    
    // Send email with code
    await sendEmail({
      to: customerEmail,
      subject: 'Your NVision Calculator Unlock Code',
      body: `Your unlock code is: ${unlockCode}`
    });
    
    // Store code in database
    await storeCode(unlockCode, customerEmail);
  }
  
  res.json({ received: true });
});
```

### Option 2: Manual Process

1. Check Stripe Dashboard for new payments
2. Note customer email
3. Generate code using browser console:
   ```javascript
   NVisionCodeGen.generateSingleCode()
   ```
4. Manually email the code to the customer

### Option 3: Zapier Integration

1. Create a Zapier account
2. Set up a Zap:
   - **Trigger:** Stripe - New Payment
   - **Action:** Email - Send Email
   - **Template:** Include unlock code generation
3. Test and activate the Zap

## Updating Payment Links

### To Change Price

1. Go to Stripe Dashboard → **Products**
2. Select your product
3. Click **Add another price**
4. Enter new price amount
5. Create a new Payment Link with the new price
6. Update the link in your code

### To Switch from Test to Live Mode

1. Toggle from **Test mode** to **Live mode** in Stripe Dashboard
2. Create the same product in Live mode
3. Create a new Payment Link
4. Update the link in your code
5. Update webhook endpoints to use live mode

## Security Considerations

### Best Practices

1. **Never hardcode secrets** - Use environment variables
2. **Verify webhook signatures** - Always validate Stripe webhooks
3. **Use HTTPS** - Ensure your webhook endpoint uses HTTPS
4. **Log events** - Keep records of all payment events
5. **Handle errors** - Implement proper error handling

### Webhook Security

```javascript
// Verify webhook signature
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/webhook/stripe', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    // Process event
    handleStripeEvent(event);
    
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
});
```

## Comparing PayPal vs Stripe

### PayPal
**Pros:**
- ✅ Widely recognized and trusted
- ✅ No coding required for basic setup
- ✅ Supports PayPal balance payments
- ✅ Easy subscription management

**Cons:**
- ❌ Higher fees (2.9% + $0.30)
- ❌ Less developer-friendly
- ❌ Limited customization

### Stripe
**Pros:**
- ✅ Developer-friendly API
- ✅ Better webhook support
- ✅ More customization options
- ✅ Lower fees (2.9% + $0.30 for standard)
- ✅ Better documentation

**Cons:**
- ❌ Requires more technical setup
- ❌ Less familiar to some users
- ❌ Requires Stripe account for customers

## Troubleshooting

### Payment Link Not Working

**Issue:** Clicking Stripe button does nothing or shows error

**Solutions:**
1. Verify the payment link URL is correct
2. Check if you're using test mode link in production
3. Ensure the product is active in Stripe Dashboard
4. Check browser console for errors

### Webhooks Not Firing

**Issue:** Payments succeed but no unlock codes sent

**Solutions:**
1. Verify webhook endpoint is accessible (use ngrok for local testing)
2. Check webhook signature verification
3. Review Stripe Dashboard → Webhooks → Event logs
4. Ensure correct events are selected
5. Check server logs for errors

### Test Payments Not Working

**Issue:** Test card numbers not working

**Solutions:**
1. Ensure you're in Test mode in Stripe Dashboard
2. Use correct test card format: 4242 4242 4242 4242
3. Use future expiry date
4. Check if 3D Secure is required (use 4000 0025 0000 3155)

## Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Payment Links Guide](https://stripe.com/docs/payment-links)
- [Webhooks Guide](https://stripe.com/docs/webhooks)
- [Test Cards](https://stripe.com/docs/testing)
- [API Reference](https://stripe.com/docs/api)

## Support

For Stripe-specific issues:
- [Stripe Support](https://support.stripe.com)
- [Stripe Community](https://stripe.com/community)

For NVision Calculator issues:
- Check SUBSCRIPTION_SYSTEM_GUIDE.md
- Contact: support@nvisionfilms.com

## Next Steps

1. ✅ Create Stripe account
2. ✅ Set up test product and payment link
3. ✅ Update code with test link
4. ✅ Test payment flow
5. ✅ Set up webhooks (optional)
6. ✅ Switch to live mode when ready
7. ✅ Update code with live link
8. ✅ Test live payments with real card

---

**Last Updated:** October 23, 2025  
**Version:** 1.0
