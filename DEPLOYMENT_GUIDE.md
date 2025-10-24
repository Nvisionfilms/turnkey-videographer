# Complete Deployment Guide - Step by Step

This guide will walk you through deploying your NVision Calculator server and completing the production setup.

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] Stripe account created
- [ ] SendGrid account created
- [ ] Domain name (optional but recommended)
- [ ] Git repository set up
- [ ] Node.js installed locally (v18+)

---

## 🚀 Step 1: Deploy the Server

Choose one of these deployment options:

### Option A: Railway (Recommended - Easiest)

**Why Railway?**
- ✅ Free $5 credit monthly
- ✅ Automatic HTTPS
- ✅ GitHub integration
- ✅ Environment variables UI
- ✅ Automatic deployments

**Steps:**

1. **Sign up for Railway**
   - Go to [railway.app](https://railway.app)
   - Click "Login with GitHub"
   - Authorize Railway

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your turnkeyvideo repository
   - Railway will detect it's a Node.js project

3. **Configure Root Directory**
   - Click on your service
   - Go to "Settings"
   - Set "Root Directory" to `server`
   - Set "Start Command" to `npm start`

4. **Add Environment Variables**
   - Click "Variables" tab
   - Click "Raw Editor"
   - Paste this template and fill in your values:

   ```env
   PORT=3001
   NODE_ENV=production
   STRIPE_SECRET_KEY=sk_live_your_key_here
   STRIPE_WEBHOOK_SECRET=whsec_will_add_after_webhook_setup
   SENDGRID_API_KEY=SG.your_key_here
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   SENDGRID_FROM_NAME=NVision Calculator
   HMAC_SECRET_KEY=generate_32_char_random_string
   ENCRYPTION_KEY=generate_32_char_random_string
   ALLOWED_ORIGINS=https://yourdomain.com
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

5. **Generate Secure Keys**
   
   Run this in your local terminal:
   ```bash
   # Generate HMAC secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   
   # Generate encryption key
   node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
   ```
   
   Copy these values to your Railway environment variables.

6. **Deploy**
   - Click "Deploy"
   - Wait for deployment (usually 2-3 minutes)
   - Railway will provide a URL like: `https://your-app.up.railway.app`

7. **Get Your API URL**
   - Click "Settings" → "Domains"
   - Copy your Railway domain
   - This is your API URL for webhooks

---

### Option B: Heroku

**Steps:**

1. **Install Heroku CLI**
   ```bash
   # Windows (with Chocolatey)
   choco install heroku-cli
   
   # Or download from heroku.com/cli
   ```

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create Heroku App**
   ```bash
   cd server
   heroku create nvision-calculator-api
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set STRIPE_SECRET_KEY=sk_live_your_key
   heroku config:set SENDGRID_API_KEY=SG.your_key
   heroku config:set SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   heroku config:set SENDGRID_FROM_NAME="NVision Calculator"
   heroku config:set HMAC_SECRET_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
   heroku config:set ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(16).toString('hex'))")
   heroku config:set ALLOWED_ORIGINS=https://yourdomain.com
   heroku config:set NODE_ENV=production
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

6. **View Logs**
   ```bash
   heroku logs --tail
   ```

---

### Option C: DigitalOcean App Platform

1. Go to [DigitalOcean](https://www.digitalocean.com)
2. Create new App
3. Connect GitHub repository
4. Set root directory to `server`
5. Add environment variables in dashboard
6. Deploy

---

## 📧 Step 2: Set Up SendGrid

### 2.1 Create SendGrid Account

1. Go to [sendgrid.com](https://sendgrid.com)
2. Click "Start for Free"
3. Fill in your details
4. Verify your email address

### 2.2 Create API Key

1. Log in to SendGrid
2. Go to **Settings** → **API Keys**
3. Click **Create API Key**
4. Name: `NVision Calculator Production`
5. Permissions: **Full Access** (or **Mail Send** only)
6. Click **Create & View**
7. **IMPORTANT:** Copy the API key immediately (starts with `SG.`)
8. Save it securely - you won't see it again!

### 2.3 Verify Sender Email

**Quick Setup (Single Sender):**

1. Go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Fill in:
   - **From Name:** NVision Calculator
   - **From Email:** noreply@yourdomain.com (or your email)
   - **Reply To:** support@yourdomain.com
   - **Company Address:** Your business address
4. Click **Create**
5. Check your email inbox
6. Click the verification link
7. Wait for "Verified" status

**Production Setup (Domain Authentication):**

1. Go to **Settings** → **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Select your DNS host (e.g., GoDaddy, Cloudflare)
4. Enter your domain
5. Copy the DNS records provided
6. Add DNS records to your domain:
   - CNAME records for email authentication
   - Usually 3 records: `em1234`, `s1._domainkey`, `s2._domainkey`
7. Wait for DNS propagation (up to 48 hours)
8. Verify in SendGrid dashboard

### 2.4 Test Email Sending

Create a test file locally:

```javascript
// test-sendgrid.js
import sgMail from '@sendgrid/mail';

sgMail.setApiKey('SG.your_api_key_here');

const msg = {
  to: 'your-email@example.com',
  from: 'noreply@yourdomain.com',
  subject: 'SendGrid Test',
  text: 'This is a test email from NVision Calculator',
  html: '<strong>This is a test email from NVision Calculator</strong>',
};

sgMail.send(msg)
  .then(() => console.log('✅ Email sent successfully'))
  .catch((error) => console.error('❌ Error:', error));
```

Run it:
```bash
node test-sendgrid.js
```

Check your inbox (and spam folder).

---

## 💳 Step 3: Configure Stripe Webhook

### 3.1 Get Your Server URL

From your deployment (Railway/Heroku/etc):
- Example: `https://your-app.up.railway.app`

Your webhook URL will be:
- `https://your-app.up.railway.app/webhook/stripe`

### 3.2 Create Webhook in Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Click **Developers** → **Webhooks**
3. Click **+ Add endpoint**
4. Enter your webhook URL:
   ```
   https://your-app.up.railway.app/webhook/stripe
   ```
5. Click **Select events**
6. Search and select these events:
   - ✅ `checkout.session.completed` (REQUIRED)
   - ✅ `customer.subscription.created` (recommended)
   - ✅ `customer.subscription.deleted` (recommended)
   - ✅ `customer.subscription.updated` (optional)
7. Click **Add events**
8. Click **Add endpoint**

### 3.3 Get Webhook Secret

1. Click on your newly created webhook
2. Click **Reveal** under "Signing secret"
3. Copy the secret (starts with `whsec_`)
4. Add to your server environment variables:
   - Railway: Variables tab → Add `STRIPE_WEBHOOK_SECRET`
   - Heroku: `heroku config:set STRIPE_WEBHOOK_SECRET=whsec_...`

### 3.4 Update Payment Link Success URL

1. Go to Stripe Dashboard → **Payment Links**
2. Click on your payment link
3. Edit "After payment" settings
4. Set redirect URL to: `https://yourdomain.com/?payment=success`
5. Save changes

---

## 🧪 Step 4: Test with Test Payment

### 4.1 Test Mode Setup

1. Ensure you're in **Test mode** in Stripe (toggle in top right)
2. Your webhook should be in test mode too
3. Use test API keys (start with `sk_test_`)

### 4.2 Make Test Payment

1. Go to your calculator app
2. Navigate to the Unlock page
3. Click the **Stripe** payment button
4. You'll be redirected to Stripe checkout
5. Use test card:
   ```
   Card Number: 4242 4242 4242 4242
   Expiry: 12/34 (any future date)
   CVC: 123 (any 3 digits)
   ZIP: 12345 (any 5 digits)
   ```
6. Enter test email: `test@example.com`
7. Click **Pay**

### 4.3 Verify Webhook Received

**Check Server Logs:**

Railway:
- Click on your service
- Click "Deployments"
- Click "View Logs"
- Look for: `💳 Checkout completed`

Heroku:
```bash
heroku logs --tail
```

**Check Stripe Dashboard:**
1. Go to **Developers** → **Webhooks**
2. Click on your webhook
3. Click **Events** tab
4. You should see `checkout.session.completed`
5. Click on the event to see details
6. Check "Response" - should be `200 OK`

### 4.4 Verify Email Sent

1. Check the email inbox for `test@example.com`
2. Look for email from `noreply@yourdomain.com`
3. Subject: "Your NVision Calculator Unlock Code"
4. Verify unlock code is displayed
5. Check spam folder if not in inbox

### 4.5 Verify Code in Database

Check your server's `data/codes.json` file:

Railway:
- Not directly accessible, but check logs for "💾 Code stored"

Heroku:
```bash
heroku run bash
cat data/codes.json
```

### 4.6 Test Code Activation

1. Copy the unlock code from the email
2. Go to your calculator Unlock page
3. Paste the code
4. Click "Activate Code"
5. Should redirect to Calculator
6. Verify unlimited access granted

---

## ✅ Step 5: Verification Checklist

### Server Deployment
- [ ] Server is running (check health endpoint: `https://your-api.com/health`)
- [ ] Environment variables are set
- [ ] HTTPS is enabled
- [ ] Logs are accessible

### SendGrid
- [ ] API key is valid
- [ ] Sender email is verified
- [ ] Test email sent successfully
- [ ] Email appears professional (not in spam)

### Stripe
- [ ] Webhook endpoint created
- [ ] Webhook secret added to server
- [ ] Test payment completed successfully
- [ ] Webhook received by server (check logs)
- [ ] Event shows 200 OK in Stripe dashboard

### Email Automation
- [ ] Email received after test payment
- [ ] Unlock code is visible and correct format
- [ ] Email template looks professional
- [ ] Instructions are clear

### Code System
- [ ] Code generated and stored
- [ ] Code format is correct (NV-XXXX-XXXX-XXXX-XXXX)
- [ ] Code activates successfully
- [ ] Unlimited access granted after activation

---

## 🔄 Step 6: Switch to Production

Once everything works in test mode:

### 6.1 Update Stripe to Live Mode

1. Toggle to **Live mode** in Stripe Dashboard
2. Get your **live** secret key (starts with `sk_live_`)
3. Create new webhook in live mode
4. Get new webhook secret (starts with `whsec_`)

### 6.2 Update Server Environment

Update these variables to live values:
```env
STRIPE_SECRET_KEY=sk_live_your_live_key
STRIPE_WEBHOOK_SECRET=whsec_your_live_secret
NODE_ENV=production
```

### 6.3 Update Payment Link

1. Create new payment link in **Live mode**
2. Update Stripe button URL in `src/pages/Unlock.jsx`
3. Deploy frontend changes

### 6.4 Final Test

1. Make a real $0.01 test payment (you can refund it)
2. Verify entire flow works
3. Refund the test payment in Stripe Dashboard

---

## 📊 Monitoring

### Check Server Health

```bash
curl https://your-api.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-24T..."
}
```

### Monitor Webhooks

Stripe Dashboard → Webhooks → Your endpoint → Events

Look for:
- ✅ Green checkmarks (successful)
- ❌ Red X's (failed - check logs)

### Monitor Emails

SendGrid Dashboard → Activity

Check:
- Delivered count
- Bounce rate (should be < 1%)
- Spam reports (should be 0)

### Server Logs

Railway: Deployments → View Logs
Heroku: `heroku logs --tail`

Look for:
- `💳 Checkout completed`
- `💾 Code stored`
- `✅ Email sent`
- `✅ Code activated`

---

## 🐛 Troubleshooting

### Webhook Not Receiving Events

**Problem:** Stripe shows webhook failed

**Solutions:**
1. Check server is running: `curl https://your-api.com/health`
2. Verify webhook URL is correct (no typos)
3. Check webhook secret matches
4. Review server logs for errors
5. Test with Stripe CLI:
   ```bash
   stripe listen --forward-to https://your-api.com/webhook/stripe
   stripe trigger checkout.session.completed
   ```

### Email Not Sending

**Problem:** No email received after payment

**Solutions:**
1. Check SendGrid API key is correct
2. Verify sender email is verified in SendGrid
3. Check SendGrid Activity logs for delivery status
4. Look in spam folder
5. Check server logs for SendGrid errors
6. Test SendGrid separately with test script

### Code Not Activating

**Problem:** Code validation fails on frontend

**Solutions:**
1. Verify code format is correct
2. Check HMAC secret is set on server
3. Test validation API directly:
   ```bash
   curl -X POST https://your-api.com/api/codes/validate \
     -H "Content-Type: application/json" \
     -d '{"code":"NV-XXXX-XXXX-XXXX-XXXX"}'
   ```
4. Check server logs for validation errors

### Server Crashes

**Problem:** Server stops responding

**Solutions:**
1. Check logs for error messages
2. Verify all environment variables are set
3. Check database file permissions
4. Restart server
5. Check memory/CPU usage

---

## 📞 Support Resources

- **Railway:** https://railway.app/help
- **Heroku:** https://help.heroku.com
- **Stripe:** https://support.stripe.com
- **SendGrid:** https://support.sendgrid.com

---

## 🎉 Success!

Once all checks pass, you have:

✅ Fully automated subscription system
✅ Instant code delivery via email
✅ Production-grade security
✅ Server-side validation
✅ Professional customer experience

**You're live!** 🚀

---

**Next:** Monitor your first real customer purchase and celebrate! 🎊
