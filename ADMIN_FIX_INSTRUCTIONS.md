# 🔧 Admin Account Fix Instructions

## Issue
Admin login not working - credentials are invalid because admin wasn't created in the new Railway database.

## Solution

### Step 1: Run SQL Command in Railway

1. Go to Railway → Your Project → PostgreSQL database
2. Click "Data" tab
3. Click "Query" or open the SQL console
4. Run this SQL command:

```sql
INSERT INTO admins (email, password_hash, name, created_at)
VALUES (
  'nvisionmg@gmail.com',
  '$2b$10$I/4VOuyhX68hVwP07.ap1usoRzxiysMfWoz8aUdmLMCgOGQSFHRFa',
  'Admin',
  NOW()
)
ON CONFLICT (email) DO UPDATE 
SET password_hash = EXCLUDED.password_hash;
```

### Step 2: Test Login

After running the SQL, test the admin login:

**Email:** `nvisionmg@gmail.com`  
**Password:** `NOPmg512!`

### Step 3: Clear Browser Cache

If it still doesn't work:
1. Open DevTools (F12)
2. Go to Application → Storage → Clear site data
3. Refresh the page
4. Try logging in again

---

## ✅ Affiliate Copy Link Feature

**Good news:** The copy link feature is ALREADY implemented in the affiliate dashboard!

### Features Available:
- ✅ Copy affiliate link button (yellow button with copy icon)
- ✅ Share to Twitter button
- ✅ Share to Facebook button
- ✅ Shows "Copied!" toast notification
- ✅ Link format: `https://helpmefilm.com?ref=YOURCODE`

### How Affiliates Use It:
1. Log in to affiliate dashboard
2. See "Your Referral Link" card at the top
3. Click the yellow copy button
4. Paste link anywhere to share
5. Or use Twitter/Facebook share buttons

---

## 🚀 Everything Working:

### Backend:
- ✅ Affiliate signup/login
- ✅ Stripe webhook integration
- ✅ Commission tracking
- ✅ Unlock code generation
- ✅ Password reset

### Frontend:
- ✅ Affiliate dashboard with stats
- ✅ Copy referral link
- ✅ Social sharing buttons
- ✅ Prominent "Get Unlimited Access" button
- ✅ Crew/Project Manager fields added

### Database:
- ✅ All tables created
- ✅ Affiliates tracked
- ✅ Conversions recorded
- ✅ Commissions calculated

**Just need to add the admin account via SQL and you're 100% operational!** 🎉
