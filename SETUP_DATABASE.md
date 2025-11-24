# 🗄️ Database Setup Instructions

## ✅ Frontend Already Deployed!

Your frontend is live at: **https://helpmefilm.com**

Now we need to set up the Railway database.

---

## 📋 Run These Commands on Railway

Since the migrations can't run from your local machine (internal hostname issue), you need to run them **on Railway's server**.

### **Option 1: Railway Dashboard (Easiest)**

1. Go to: https://railway.app
2. Open your project: **abundant-energy**
3. Click on your **backend service** (the Node.js one, not Postgres)
4. Look for **"Deployments"** tab
5. Click on the latest deployment
6. Find **"View Logs"** or **"Console"** button
7. In the deployment, look for a way to run commands

Unfortunately Railway's UI doesn't make this super obvious. Let me give you the alternative:

### **Option 2: Use Railway's Public Database URL**

The issue is that `railway run` uses the internal hostname which doesn't work from your machine. We need to use the public URL.

**In Railway Dashboard:**
1. Go to your **Postgres service** (not backend)
2. Click **"Variables"** tab
3. Look for `DATABASE_PUBLIC_URL` or similar
4. Copy that URL (it should have `metro.proxy.rlwy.net` or similar)

Then create a file `backend/.env.local`:
```
DATABASE_URL=<paste the public URL here>
NODE_ENV=production
```

Then run locally:
```bash
cd backend
npm run migrate
npm run import-codes
npm run create-admin
```

---

## 🎯 What These Commands Do:

### 1. `npm run migrate`
Creates all database tables:
- `affiliates` - Affiliate accounts
- `unlock_codes` - Your 100 unlock codes
- `users` - People who activate codes
- `conversions` - Sales tracking
- `admins` - Admin accounts

### 2. `npm run import-codes`
Imports all 100 codes from `UNLOCK_CODES_BATCH_1.csv` into the database

### 3. `npm run create-admin`
Creates your admin account:
- **Email:** nvisionmg@gmail.com
- **Password:** NOPmg512!

---

## ✅ Verify It Worked

After running the commands, check these URLs:

1. **Health check:**
   ```
   https://postgres-production-13af.up.railway.app/health
   ```
   Should return: `{"status":"ok"}`

2. **Available codes:**
   ```
   https://postgres-production-13af.up.railway.app/api/unlock/available-count
   ```
   Should return: `{"availableCount":100}`

---

## 🔐 Admin Login

Once the database is set up, you can log in as admin:

1. Go to: https://helpmefilm.com/admin/affiliates
2. Login with:
   - **Email:** nvisionmg@gmail.com
   - **Password:** NOPmg512!

---

## 🐛 Troubleshooting

### "getaddrinfo ENOTFOUND postgres.railway.internal"
This means you're trying to connect from your local machine using the internal hostname. You need either:
- Run commands on Railway's server (Option 1)
- Use the public DATABASE_URL (Option 2)

### "Table already exists"
That's fine! The migrations use `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times.

### "Admin already exists"
The create-admin script will update the password if the admin already exists.

---

## 📝 Summary

**What you need to do:**
1. Get the public `DATABASE_URL` from Railway Postgres service
2. Create `backend/.env.local` with that URL
3. Run the 3 commands locally
4. Verify the URLs work
5. Login as admin!

---

**Backend is deploying now...** Once it finishes, the database setup will be the last step!
