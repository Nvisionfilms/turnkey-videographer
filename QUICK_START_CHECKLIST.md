# Quick Start Checklist - Get Live in 30 Minutes

Follow this checklist to deploy your production server quickly.

## ⏱️ Time Estimate: 30 minutes

---

## 📋 Before You Start

Have these ready:
- [ ] Stripe account (sign up at stripe.com)
- [ ] SendGrid account (sign up at sendgrid.com)
- [ ] GitHub account (for Railway deployment)

---

## 🚀 Part 1: Deploy Server (10 minutes)

### Option A: Railway (Recommended)

1. [ ] Go to [railway.app](https://railway.app)
2. [ ] Click "Login with GitHub"
3. [ ] Click "New Project" → "Deploy from GitHub repo"
4. [ ] Select your `turnkeyvideo` repository
5. [ ] Click on your service
6. [ ] Go to "Settings"
7. [ ] Set "Root Directory" to `server`
8. [ ] Set "Start Command" to `npm start`
9. [ ] Click "Variables" tab
10. [ ] Generate secure keys:
    ```bash
    # Run in terminal:
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
    node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
    ```
11. [ ] Add these variables (click "Raw Editor"):
    ```env
    PORT=3001
    NODE_ENV=production
    STRIPE_SECRET_KEY=sk_test_get_from_stripe
    STRIPE_WEBHOOK_SECRET=whsec_add_after_webhook_setup
    SENDGRID_API_KEY=SG.get_from_sendgrid
    SENDGRID_FROM_EMAIL=your-email@domain.com
    SENDGRID_FROM_NAME=NVision Calculator
    HMAC_SECRET_KEY=paste_first_generated_key
    ENCRYPTION_KEY=paste_second_generated_key
    ALLOWED_ORIGINS=https://yourdomain.com
    ```
12. [ ] Click "Deploy"
13. [ ] Wait for deployment (2-3 minutes)
14. [ ] Copy your Railway URL (e.g., `https://your-app.up.railway.app`)

**✅ Server deployed!**

---

## 📧 Part 2: Set Up SendGrid (5 minutes)

1. [ ] Go to [sendgrid.com](https://sendgrid.com)
2. [ ] Sign up for free account
3. [ ] Verify your email
4. [ ] Go to **Settings** → **API Keys**
5. [ ] Click "Create API Key"
6. [ ] Name: `NVision Production`
7. [ ] Permissions: **Full Access**
8. [ ] Click "Create & View"
9. [ ] **COPY THE API KEY** (starts with `SG.`) - you won't see it again!
10. [ ] Go to **Settings** → **Sender Authentication**
11. [ ] Click "Verify a Single Sender"
12. [ ] Fill in:
    - From Name: `NVision Calculator`
    - From Email: `your-email@domain.com`
    - Reply To: `support@yourdomain.com`
13. [ ] Click "Create"
14. [ ] Check your email and click verification link
15. [ ] Update Railway variables:
    - `SENDGRID_API_KEY` = your API key
    - `SENDGRID_FROM_EMAIL` = verified email

**✅ SendGrid configured!**

---

## 💳 Part 3: Configure Stripe (10 minutes)

### 3.1 Get Stripe Keys

1. [ ] Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. [ ] Make sure you're in **Test mode** (toggle top right)
3. [ ] Click **Developers** → **API keys**
4. [ ] Copy **Secret key** (starts with `sk_test_`)
5. [ ] Update Railway variable: `STRIPE_SECRET_KEY`

### 3.2 Set Up Webhook

1. [ ] Go to **Developers** → **Webhooks**
2. [ ] Click "+ Add endpoint"
3. [ ] Enter webhook URL:
    ```
    https://your-railway-url.up.railway.app/webhook/stripe
    ```
4. [ ] Click "Select events"
5. [ ] Search and check:
    - [x] `checkout.session.completed`
    - [x] `customer.subscription.created`
    - [x] `customer.subscription.deleted`
6. [ ] Click "Add events"
7. [ ] Click "Add endpoint"
8. [ ] Click "Reveal" under "Signing secret"
9. [ ] Copy the secret (starts with `whsec_`)
10. [ ] Update Railway variable: `STRIPE_WEBHOOK_SECRET`

**✅ Stripe configured!**

---

## 🧪 Part 4: Test Everything (5 minutes)

### 4.1 Test Server

1. [ ] Open browser
2. [ ] Go to: `https://your-railway-url.up.railway.app/health`
3. [ ] Should see: `{"status":"ok","timestamp":"..."}`

### 4.2 Test Payment Flow

1. [ ] Go to your calculator app
2. [ ] Click Unlock page
3. [ ] Click **Stripe** button
4. [ ] Use test card:
    ```
    Card: 4242 4242 4242 4242
    Expiry: 12/34
    CVC: 123
    ZIP: 12345
    Email: your-test-email@example.com
    ```
5. [ ] Click "Pay"
6. [ ] Check Railway logs (Deployments → View Logs)
7. [ ] Should see: `💳 Checkout completed`
8. [ ] Check your test email inbox
9. [ ] Should receive email with unlock code
10. [ ] Copy the code
11. [ ] Go to Unlock page
12. [ ] Paste code and click "Activate"
13. [ ] Should redirect to Calculator

**✅ Everything works!**

---

## 🎉 Part 5: Go Live (Optional)

When ready for production:

1. [ ] Toggle Stripe to **Live mode**
2. [ ] Get live secret key (`sk_live_...`)
3. [ ] Create new webhook in live mode
4. [ ] Get new webhook secret
5. [ ] Update Railway variables with live keys
6. [ ] Create live payment link in Stripe
7. [ ] Update frontend with live payment link
8. [ ] Test with $0.01 payment (refund after)

**✅ You're live!**

---

## 📊 Verification Checklist

After completing all steps, verify:

- [ ] Server health endpoint returns 200 OK
- [ ] Test payment completes successfully
- [ ] Webhook shows in Stripe dashboard (green checkmark)
- [ ] Email arrives within 30 seconds
- [ ] Email contains valid unlock code
- [ ] Code activates on frontend
- [ ] Unlimited access granted

---

## 🐛 Quick Troubleshooting

### Server not responding
- Check Railway logs for errors
- Verify all environment variables are set
- Restart deployment

### Email not received
- Check SendGrid Activity logs
- Verify sender email is verified
- Check spam folder
- Verify SENDGRID_API_KEY is correct

### Webhook failing
- Check webhook URL is correct
- Verify webhook secret matches
- Check Railway logs for errors
- Test with Stripe CLI

### Code not activating
- Verify code format is correct
- Check server logs
- Test validation API directly

---

## 📞 Need Help?

1. Check `DEPLOYMENT_GUIDE.md` for detailed instructions
2. Review `SERVER_SETUP_GUIDE.md` for configuration details
3. Check Railway/Stripe/SendGrid documentation
4. Review server logs for error messages

---

## 🎊 Success!

Once all checkboxes are marked, you have:

✅ Fully deployed production server
✅ Automated email delivery
✅ Stripe webhook integration
✅ End-to-end tested system

**Time to celebrate!** 🚀

Your customers can now:
1. Pay via Stripe
2. Receive unlock code instantly
3. Activate and use unlimited access

**You're officially live!** 🎉
