# Railway Migration Status

## ✅ Completed

### Backend (Railway)
- ✅ Node.js/Express API created (`backend/server.js`)
- ✅ PostgreSQL database configured
- ✅ Database schema designed (affiliates, unlock_codes, users, conversions)
- ✅ API endpoints created for all operations
- ✅ Deployed to Railway: `https://postgres-production-13af.up.railway.app`

### Frontend API Integration
- ✅ API configuration file created (`src/config/api.js`)
- ✅ Affiliate signup wired to Railway (`AffiliateSignup.jsx`)
- ✅ Affiliate login wired to Railway (`AffiliateLogin.jsx`)
- ✅ Affiliate dashboard wired to Railway (`AffiliateDashboard.jsx`)

---

## 🚧 Remaining Work

### 1. Complete Railway Setup (REQUIRED FIRST)

**In Railway Dashboard → Backend Service:**

Run these commands:
```bash
# 1. Create database tables
npm run migrate

# 2. Import 100 unlock codes from CSV
npm run import-codes
```

**Verify:**
- Visit: `https://postgres-production-13af.up.railway.app/health`
- Visit: `https://postgres-production-13af.up.railway.app/api/unlock/available-count`

---

### 2. Wire Unlock System

**File: `src/pages/Unlock.jsx`**

Current: Uses localStorage for unlock codes
Needed: Call Railway API

Changes:
```javascript
// When user enters unlock code
const response = await apiCall(API_ENDPOINTS.activateCode, {
  method: 'POST',
  body: JSON.stringify({
    code: unlockCode,
    email: userEmail,
    affiliateCode: getAffiliateCodeFromURL() // if present
  })
});

// On app load - check if user has access
const status = await apiCall(API_ENDPOINTS.checkStatus(userEmail));
if (status.isActive) {
  // Show unlocked calculator
} else {
  // Show trial/paywall
}
```

---

### 3. Wire Admin Pages

**File: `src/pages/AdminAffiliates.jsx`**
- Replace `getAllAffiliates()` with `apiCall(API_ENDPOINTS.getAllAffiliates)`
- Wire "Mark Paid" button to `apiCall(API_ENDPOINTS.markPayout(id), ...)`
- Add delete functionality with `apiCall(API_ENDPOINTS.deleteAffiliate(id), ...)`

**File: `src/pages/AdminAnalytics.jsx`**
- Replace localStorage reads with API calls
- Fetch real-time stats from Railway

---

### 4. Track Affiliate Clicks

**File: `src/pages/Calculator.jsx` (or wherever affiliate links are clicked)**

When user arrives via affiliate link:
```javascript
const affiliateCode = new URLSearchParams(window.location.search).get('ref');
if (affiliateCode) {
  await apiCall(API_ENDPOINTS.trackClick(affiliateCode), { method: 'POST' });
  localStorage.setItem('affiliateCode', affiliateCode); // Save for later conversion
}
```

---

### 5. Environment Variables

**Create `.env` file in root:**
```
VITE_API_URL=https://postgres-production-13af.up.railway.app
```

**In Netlify:**
Add environment variable:
- Key: `VITE_API_URL`
- Value: `https://postgres-production-13af.up.railway.app`

---

## 📊 What This Achieves

### Before (localStorage)
- ❌ Data only on one browser
- ❌ Lost if browser cleared
- ❌ No cross-device access
- ❌ Codes can be reused
- ❌ Manual tracking

### After (Railway)
- ✅ Global database
- ✅ Permanent storage
- ✅ Access from any device
- ✅ One-time code use
- ✅ Automatic tracking
- ✅ Real-time stats
- ✅ Secure authentication

---

## 🚀 Deployment Steps

1. **Complete Railway setup** (migrations + import codes)
2. **Create `.env` file** with Railway URL
3. **Build frontend:**
   ```bash
   npm run build
   ```
4. **Deploy to Netlify:**
   ```bash
   netlify deploy --prod
   ```
5. **Test complete flow:**
   - Affiliate signup
   - Affiliate login
   - Unlock code activation
   - Dashboard stats
   - Admin pages

---

## 🔗 Important URLs

- **Frontend:** https://helpmefilm.com
- **Backend API:** https://postgres-production-13af.up.railway.app
- **Railway Dashboard:** https://railway.app
- **Netlify Dashboard:** https://app.netlify.com

---

## 📝 Notes

- All affiliate data now in Railway Postgres
- Unlock codes are one-time use
- Users get permanent accounts
- Affiliate commissions tracked automatically
- Admin can manage everything from dashboard
