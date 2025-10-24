# Server Setup Guide - Production Ready

This guide will help you set up the production server with Stripe webhooks, SendGrid email delivery, and server-side code validation.

## 🎯 Overview

The server provides:
- ✅ Stripe webhook handling for automatic code generation
- ✅ SendGrid email integration for code delivery
- ✅ Server-side code validation API
- ✅ Cryptographically secure code generation
- ✅ Code storage and tracking
- ✅ Rate limiting and security

## 📋 Prerequisites

1. **Node.js** (v18 or higher)
2. **Stripe Account** with payment link configured
3. **SendGrid Account** with API key
4. **Domain** (for production deployment)

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd server
npm install
```

### Step 2: Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_actual_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_from_stripe

# SendGrid Configuration
SENDGRID_API_KEY=SG.your_actual_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=NVision Calculator

# Security
HMAC_SECRET_KEY=generate_a_very_long_random_string_at_least_32_characters
ENCRYPTION_KEY=another_32_character_random_string_here

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Step 3: Start the Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The server will start on `http://localhost:3001`

## 🔧 Detailed Configuration

### 1. Stripe Setup

#### Get Your Stripe Secret Key

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Click **Developers** → **API keys**
3. Copy your **Secret key** (starts with `sk_live_` or `sk_test_`)
4. Add to `.env` as `STRIPE_SECRET_KEY`

#### Set Up Webhook Endpoint

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **+ Add endpoint**
3. Enter your webhook URL:
   - Development: `https://your-ngrok-url.ngrok.io/webhook/stripe`
   - Production: `https://api.yourdomain.com/webhook/stripe`
4. Select events to listen for:
   - `checkout.session.completed` ✅ (required)
   - `customer.subscription.created` ✅ (recommended)
   - `customer.subscription.deleted` ✅ (recommended)
   - `customer.subscription.updated` (optional)
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)
7. Add to `.env` as `STRIPE_WEBHOOK_SECRET`

#### Test Webhook Locally with Stripe CLI

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3001/webhook/stripe

# This will give you a webhook secret starting with whsec_
# Use this in your .env file for local testing
```

### 2. SendGrid Setup

#### Create SendGrid Account

1. Go to [SendGrid](https://sendgrid.com)
2. Sign up for free account (100 emails/day free)
3. Verify your email address

#### Get API Key

1. Go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Name: "NVision Calculator"
4. Permissions: **Full Access** (or **Mail Send** only)
5. Click **Create & View**
6. Copy the API key (starts with `SG.`)
7. Add to `.env` as `SENDGRID_API_KEY`

⚠️ **Important:** Save the API key immediately - you won't be able to see it again!

#### Verify Sender Email

1. Go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Fill in your details:
   - From Name: NVision Calculator
   - From Email: noreply@yourdomain.com
   - Reply To: support@yourdomain.com
4. Check your email and click verification link
5. Use this email in `.env` as `SENDGRID_FROM_EMAIL`

#### Domain Authentication (Production)

For better deliverability:

1. Go to **Settings** → **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Follow DNS setup instructions
4. Wait for verification (can take up to 48 hours)

### 3. Security Configuration

#### Generate Secure Keys

```bash
# Generate HMAC secret (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate encryption key (32 characters)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

Add these to your `.env` file.

#### Configure CORS

Update `ALLOWED_ORIGINS` in `.env`:

```env
# Development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Production
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## 🧪 Testing

### Test Stripe Webhook Locally

1. Start your server:
   ```bash
   npm run dev
   ```

2. In another terminal, start Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3001/webhook/stripe
   ```

3. Trigger a test event:
   ```bash
   stripe trigger checkout.session.completed
   ```

4. Check server logs for webhook processing

### Test Email Delivery

Create a test file `test-email.js`:

```javascript
import { sendUnlockCodeEmail } from './services/email.js';
import dotenv from 'dotenv';

dotenv.config();

await sendUnlockCodeEmail({
  to: 'your-test-email@example.com',
  customerName: 'Test User',
  unlockCode: 'NV-TEST-CODE-1234-ABCD',
  amountPaid: 9.99
});

console.log('Test email sent!');
```

Run it:
```bash
node test-email.js
```

### Test Code Validation API

```bash
# Validate a code
curl -X POST http://localhost:3001/api/codes/validate \
  -H "Content-Type: application/json" \
  -d '{"code":"NV-TEST-CODE-1234-ABCD"}'

# Activate a code
curl -X POST http://localhost:3001/api/codes/activate \
  -H "Content-Type: application/json" \
  -d '{"code":"NV-TEST-CODE-1234-ABCD","email":"user@example.com"}'
```

## 🌐 Deployment

### Option 1: Deploy to Heroku

```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Create app
heroku create nvision-calculator-api

# Set environment variables
heroku config:set STRIPE_SECRET_KEY=sk_live_...
heroku config:set STRIPE_WEBHOOK_SECRET=whsec_...
heroku config:set SENDGRID_API_KEY=SG....
heroku config:set SENDGRID_FROM_EMAIL=noreply@yourdomain.com
heroku config:set HMAC_SECRET_KEY=your_secret
heroku config:set ENCRYPTION_KEY=your_key
heroku config:set ALLOWED_ORIGINS=https://yourdomain.com

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### Option 2: Deploy to Railway

1. Go to [Railway.app](https://railway.app)
2. Click **New Project** → **Deploy from GitHub**
3. Select your repository
4. Add environment variables in Railway dashboard
5. Deploy automatically on push

### Option 3: Deploy to DigitalOcean App Platform

1. Go to [DigitalOcean](https://www.digitalocean.com)
2. Create new App
3. Connect GitHub repository
4. Configure environment variables
5. Deploy

### Option 4: VPS (Ubuntu)

```bash
# SSH into your server
ssh user@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone https://github.com/yourusername/turnkeyvideo.git
cd turnkeyvideo/server

# Install dependencies
npm install --production

# Install PM2 for process management
sudo npm install -g pm2

# Create .env file
nano .env
# (paste your environment variables)

# Start with PM2
pm2 start index.js --name nvision-api

# Save PM2 configuration
pm2 save
pm2 startup

# Set up Nginx reverse proxy
sudo apt install nginx
sudo nano /etc/nginx/sites-available/nvision-api

# Add this configuration:
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/nvision-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Install SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

## 🔒 Security Checklist

- [ ] Use HTTPS in production
- [ ] Set strong HMAC and encryption keys
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Use environment variables (never commit `.env`)
- [ ] Verify Stripe webhook signatures
- [ ] Validate all user inputs
- [ ] Use latest dependencies
- [ ] Enable logging and monitoring
- [ ] Set up error alerting

## 📊 Monitoring

### Check Server Health

```bash
curl https://api.yourdomain.com/health
```

### View Logs

**Heroku:**
```bash
heroku logs --tail
```

**PM2:**
```bash
pm2 logs nvision-api
```

**Railway:**
Check logs in Railway dashboard

### Monitor Webhooks

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click on your webhook endpoint
3. View **Event log** for delivery status

### Monitor Emails

1. Go to SendGrid Dashboard → **Activity**
2. View email delivery status
3. Check bounce and spam reports

## 🐛 Troubleshooting

### Webhook Not Receiving Events

1. Check webhook URL is correct
2. Verify webhook secret matches
3. Check server is running and accessible
4. Review Stripe webhook logs
5. Test with Stripe CLI

### Emails Not Sending

1. Verify SendGrid API key is correct
2. Check sender email is verified
3. Review SendGrid activity logs
4. Check spam folder
5. Verify email template syntax

### Code Validation Failing

1. Check HMAC secret key is set
2. Verify code format is correct
3. Check database file permissions
4. Review server logs for errors

### CORS Errors

1. Verify `ALLOWED_ORIGINS` includes your frontend URL
2. Check protocol (http vs https)
3. Ensure no trailing slashes in URLs

## 📚 API Documentation

### POST /webhook/stripe

Stripe webhook endpoint (handled automatically)

### POST /api/codes/validate

Validate a code without activating it.

**Request:**
```json
{
  "code": "NV-XXXX-XXXX-XXXX-XXXX"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Code is valid and ready to activate",
  "code": "VALID"
}
```

### POST /api/codes/activate

Activate a code.

**Request:**
```json
{
  "code": "NV-XXXX-XXXX-XXXX-XXXX",
  "email": "user@example.com",
  "deviceId": "optional-device-fingerprint"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Code activated successfully",
  "code": "ACTIVATED",
  "activatedAt": "2025-10-23T..."
}
```

### GET /api/codes/status/:code

Check code status.

**Response:**
```json
{
  "success": true,
  "status": "activated",
  "issuedAt": "2025-10-23T...",
  "activatedAt": "2025-10-23T...",
  "activationCount": 1
}
```

## 🎉 Next Steps

1. ✅ Complete server setup
2. ✅ Test webhook with Stripe CLI
3. ✅ Send test email
4. ✅ Deploy to production
5. ✅ Update frontend to use server API
6. ✅ Test end-to-end flow
7. ✅ Monitor first real purchase

## 📞 Support

- **Stripe:** https://support.stripe.com
- **SendGrid:** https://support.sendgrid.com
- **Server Issues:** Check logs and error messages

---

**Last Updated:** October 23, 2025  
**Version:** 1.0.0
