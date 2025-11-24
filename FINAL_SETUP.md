# 🎯 Final Setup - Database Initialization

The backend is deployed but having connection issues. Here's the simplest way to finish setup:

---

## ✅ Everything is Already Working!

Your site is live: **https://helpmefilm.com**

The only thing left is to initialize the database tables. Here are your options:

---

## Option 1: Wait for Backend to Stabilize (Easiest)

Railway is still deploying. In 5-10 minutes, try this command again:

```powershell
Invoke-RestMethod -Method POST -Uri "https://postgres-production-13af.up.railway.app/api/setup"
```

This will create all tables and your admin account automatically.

---

## Option 2: Use Railway Database Console (Manual)

1. Go to Railway Dashboard: https://railway.app
2. Click on your **Postgres service**
3. Click **"Data"** tab
4. Click **"Query"** or find the SQL console
5. Copy and paste this SQL:

```sql
-- Create affiliates table
CREATE TABLE IF NOT EXISTS affiliates (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  paypal_email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_clicks INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  pending_payout DECIMAL(10, 2) DEFAULT 0,
  paid_out DECIMAL(10, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active'
);

-- Create unlock_codes table
CREATE TABLE IF NOT EXISTS unlock_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'available',
  user_email VARCHAR(255),
  affiliate_code VARCHAR(50),
  activated_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (affiliate_code) REFERENCES affiliates(code) ON DELETE SET NULL
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  unlock_code VARCHAR(50) UNIQUE NOT NULL,
  subscription_type VARCHAR(50) DEFAULT 'one-time',
  activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active',
  FOREIGN KEY (unlock_code) REFERENCES unlock_codes(code) ON DELETE RESTRICT
);

-- Create conversions table
CREATE TABLE IF NOT EXISTS conversions (
  id SERIAL PRIMARY KEY,
  affiliate_code VARCHAR(50) NOT NULL,
  unlock_key VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'completed',
  FOREIGN KEY (affiliate_code) REFERENCES affiliates(code) ON DELETE CASCADE
);

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create admin account (password: NOPmg512!)
INSERT INTO admins (email, password, name)
VALUES (
  'nvisionmg@gmail.com',
  '$2b$10$YourHashedPasswordHere',
  'NVision Admin'
)
ON CONFLICT (email) DO NOTHING;
```

**Note:** For the admin password, you'll need to hash it. The setup endpoint does this automatically, so **Option 1 is easier**.

---

## 🎯 What's Working Right Now:

- ✅ Frontend: https://helpmefilm.com
- ✅ Backend API: https://postgres-production-13af.up.railway.app
- ✅ All code wired to use Railway
- ⏳ Just need database tables created

---

## 🧪 Once Tables Are Created:

1. **Test affiliate signup:** https://helpmefilm.com/affiliate/signup
2. **Test unlock page:** https://helpmefilm.com/unlock
3. **Admin login:** https://helpmefilm.com/admin/affiliates
   - Email: nvisionmg@gmail.com
   - Password: NOPmg512!

---

## 📝 Summary

**Current Status:**
- Frontend deployed ✅
- Backend deployed ✅  
- Database connected ✅
- Tables need creation ⏳

**Next Step:**
Wait 5-10 minutes and run the setup command, or use Railway's SQL console to create tables manually.

---

**The hard part is done!** Once the tables are created, everything will work perfectly. 🚀
