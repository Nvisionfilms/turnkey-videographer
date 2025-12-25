# Free Quote Tracking Migration

## Overview
This migration creates a database table to track free quote usage by device fingerprint and IP address, preventing users from bypassing the one-free-quote limit by clearing browser data or using different browsers.

## What This Does
- Creates `free_quote_usage` table to track device IDs and IP addresses
- Adds indexes for fast lookups
- Prevents same machine/IP from generating multiple free quotes

## Running the Migration

### On Railway (Production)
1. Connect to your Railway database
2. Run the migration:
```bash
cd backend/migrations
node create-free-quote-tracking.js
```

### Manual SQL (Alternative)
If you prefer to run SQL directly:

```sql
CREATE TABLE IF NOT EXISTS free_quote_usage (
  id SERIAL PRIMARY KEY,
  device_id TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_free_quote_device_id ON free_quote_usage (device_id);
CREATE INDEX IF NOT EXISTS idx_free_quote_ip_address ON free_quote_usage (ip_address);
CREATE INDEX IF NOT EXISTS idx_free_quote_used_at ON free_quote_usage (used_at);
```

## How It Works

### Frontend
1. When user generates a free quote, system:
   - Generates device fingerprint (browser characteristics)
   - Sends device ID to backend
   - Backend records device ID + IP address

2. When checking if user can generate free quote:
   - Frontend sends device ID to backend
   - Backend checks if device ID OR IP address exists in database
   - Returns whether free quote has been used

### Backend Endpoints
- `POST /api/free-quote/check` - Check if device/IP has used free quote
- `POST /api/free-quote/mark-used` - Mark device/IP as having used free quote

## Security Features
- **Device Fingerprinting**: Tracks browser/device characteristics
- **IP Address Tracking**: Prevents using different devices on same network
- **Dual Check**: Must pass both device AND IP checks
- **Fallback**: If server check fails, falls back to localStorage

## Testing
After migration, test:
1. Generate free quote on one browser ✓
2. Try to generate another on same browser ✗ (should be blocked)
3. Try to generate on different browser, same machine ✗ (should be blocked)
4. Try to generate on different device, same IP ✗ (should be blocked)
