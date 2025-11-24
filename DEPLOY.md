# 🚀 Complete Deployment Guide

## ✅ What's Been Done

All code has been updated to use Railway backend instead of localStorage:

- ✅ Affiliate signup → Railway API
- ✅ Affiliate login → Railway API  
- ✅ Affiliate dashboard → Railway API
- ✅ Unlock code system → Railway API
- ✅ Admin pages → Railway API
- ✅ API configuration created

---

## 📋 Step-by-Step Deployment

### **Step 1: Set Up Railway Database**

1. **Go to Railway Dashboard:** https://railway.app
2. **Find your backend service** (the one running Node.js, not just Postgres)
3. **Open the service** and look for deployment logs
4. **In the service settings**, find "Run Command" or use Railway CLI:

```bash
# From your terminal in the backend folder:
cd backend
railway link  # If not already linked
railway run npm run migrate
railway run npm run import-codes
```

**Expected output:**
- ✓ Created affiliates table
- ✓ Created unlock_codes table
- ✓ Created users table
- ✓ Created conversions table
- ✅ Migration completed!
- ✅ Import completed! Imported: 100 codes

---

### **Step 2: Verify Railway Backend**

Open these URLs in your browser:

1. **Health check:**
   ```
   https://postgres-production-13af.up.railway.app/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. **Check codes:**
   ```
   https://postgres-production-13af.up.railway.app/api/unlock/available-count
   ```
   Should return: `{"availableCount":100}`

---

### **Step 3: Create Environment File**

Create `.env` in the root folder:

```bash
VITE_API_URL=https://postgres-production-13af.up.railway.app
```

---

### **Step 4: Build Frontend**

```bash
npm run build
```

This creates the `dist` folder with your production build.

---

### **Step 5: Deploy to Netlify**

```bash
netlify deploy --prod
```

**OR** in Netlify Dashboard:
1. Go to Site settings
2. Add environment variable:
   - Key: `VITE_API_URL`
   - Value: `https://postgres-production-13af.up.railway.app`
3. Trigger new deploy

---

## 🧪 Testing Checklist

After deployment, test these flows:

### **Affiliate System**
- [ ] Go to `/affiliate/signup`
- [ ] Create new affiliate account
- [ ] Login at `/affiliate/login`
- [ ] View dashboard with stats
- [ ] Copy referral link

### **Unlock System**
- [ ] Go to `/unlock`
- [ ] Enter one of your unlock codes from CSV
- [ ] Enter email address
- [ ] Click "Unlock"
- [ ] Should redirect to calculator
- [ ] Code should be marked as "used" (can't use again)

### **Admin Pages**
- [ ] Go to `/admin/affiliates`
- [ ] See all affiliates from Railway
- [ ] Mark a payout as paid
- [ ] Go to `/admin/analytics`
- [ ] See real-time stats

---

## 🔗 Important URLs

- **Frontend:** https://helpmefilm.com
- **Backend API:** https://postgres-production-13af.up.railway.app
- **Railway Dashboard:** https://railway.app/project/abundant-energy
- **Netlify Dashboard:** https://app.netlify.com

---

## 📊 What Changed

### **Before (localStorage)**
- Data only in browser
- Lost if cleared
- No cross-device access
- Codes reusable
- Manual tracking

### **After (Railway)**
- ✅ Global PostgreSQL database
- ✅ Permanent storage
- ✅ Access from any device
- ✅ One-time code use
- ✅ Automatic affiliate tracking
- ✅ Real-time stats
- ✅ Secure authentication

---

## 🐛 Troubleshooting

### **"Failed to load affiliate data"**
- Check Railway backend is running
- Verify `VITE_API_URL` is set correctly
- Check browser console for CORS errors

### **"Invalid unlock code"**
- Verify codes were imported: check `/api/unlock/available-count`
- Make sure code format is correct: `NV-XXXX-XXXX-XXXX-XXXX`
- Check if code was already used

### **"Database connection error"**
- Verify Railway Postgres service is running
- Check `DATABASE_URL` environment variable in Railway
- Look at Railway function logs

---

## 💰 Cost Summary

- **Netlify:** Free (current plan)
- **Railway:** $5/month
  - Includes PostgreSQL database
  - Includes backend API hosting
  - Unlimited requests (within fair use)

---

## 🎯 Next Steps

After successful deployment:

1. **Test everything** with the checklist above
2. **Monitor Railway logs** for any errors
3. **Share affiliate links** and start tracking conversions
4. **Distribute unlock codes** to customers
5. **Check admin dashboard** regularly for payouts

---

## 📝 Notes

- All 100 unlock codes are now in Railway database
- Each code can only be used once
- Users get 1-year access after activation
- Affiliate commissions tracked automatically (15% of $39.99 = $5.99 per sale)
- Minimum payout: $50

---

**Need help?** Check Railway logs or Netlify deploy logs for errors.
