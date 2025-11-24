# TurnKey Video Backend API

Backend API for the TurnKey Video affiliate system.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
DATABASE_URL=your_railway_postgres_url
PORT=3000
NODE_ENV=production
```

3. Run database migration:
```bash
npm run migrate
```

4. Start server:
```bash
npm start
```

## API Endpoints

### Affiliates
- `POST /api/affiliates/signup` - Create new affiliate
- `POST /api/affiliates/login` - Login affiliate
- `GET /api/affiliates/:code` - Get affiliate by code
- `POST /api/affiliates/:code/click` - Track click

### Conversions
- `POST /api/conversions` - Track conversion
- `GET /api/conversions/affiliate/:code` - Get conversions for affiliate

### Admin
- `GET /api/admin/affiliates` - Get all affiliates
- `POST /api/admin/affiliates/:id/payout` - Mark payout as paid
- `DELETE /api/admin/affiliates/:id` - Delete affiliate

## Deploy to Railway

1. Push code to GitHub
2. Connect GitHub repo to Railway
3. Add DATABASE_URL environment variable
4. Railway will auto-deploy
5. Run migration: `npm run migrate`
6. Import unlock codes: `npm run import-codes`

## Unlock Code System

The system now includes:
- **unlock_codes table** - Stores all 100 unlock codes from CSV
- **users table** - Tracks who activated which code
- **Automatic affiliate tracking** - Credits affiliate when code is used
- **1-year expiration** - Codes expire 1 year after activation
- **One-time use** - Each code can only be used once
- **Cross-device access** - Users can access from any device with their email
