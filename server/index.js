import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import stripeWebhookRouter from './routes/stripe-webhook.js';
import codeValidationRouter from './routes/code-validation.js';

// Load environment variables
dotenv.config();

/**
 * Validate required environment variables at startup
 * Fail fast if critical configuration is missing
 */
function validateEnvironment() {
  const required = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'SENDGRID_API_KEY',
    'SENDGRID_FROM_EMAIL',
    'HMAC_SECRET_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\n💡 Please check your .env file and ensure all required variables are set.');
    console.error('   See .env.example for reference.\n');
    process.exit(1);
  }

  // Validate formats
  if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    console.error('❌ STRIPE_SECRET_KEY should start with sk_test_ or sk_live_');
    process.exit(1);
  }

  if (!process.env.SENDGRID_API_KEY.startsWith('SG.')) {
    console.error('❌ SENDGRID_API_KEY should start with SG.');
    process.exit(1);
  }

  if (process.env.HMAC_SECRET_KEY.length < 32) {
    console.error('❌ HMAC_SECRET_KEY should be at least 32 characters for security');
    process.exit(1);
  }

  console.log('✅ All required environment variables are set and valid');
}

// Validate environment before starting server
validateEnvironment();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware with Content Security Policy
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://buy.stripe.com", "https://js.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://api.sendgrid.com"],
      frameSrc: ["https://buy.stripe.com", "https://www.paypal.com", "https://js.stripe.com"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      workerSrc: ["'self'", "blob:"],
      childSrc: ["'self'", "blob:"],
      formAction: ["'self'", "https://www.paypal.com", "https://buy.stripe.com"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      manifestSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Allow Stripe/PayPal embeds
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(301, `https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// Request logging middleware for audit trail
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  const method = req.method;
  const url = req.url;
  
  // Log request
  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);
  
  // Log response when finished
  res.on('finish', () => {
    const statusCode = res.statusCode;
    const statusEmoji = statusCode >= 400 ? '❌' : statusCode >= 300 ? '⚠️' : '✅';
    console.log(`[${timestamp}] ${statusEmoji} ${method} ${url} - ${statusCode} - IP: ${ip}`);
  });
  
  next();
});

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/webhook', stripeWebhookRouter); // Stripe webhook (raw body)
app.use('/api/codes', codeValidationRouter); // Code validation API

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ NVision Calculator Server running on port ${PORT}`);
  console.log(`📧 SendGrid configured: ${!!process.env.SENDGRID_API_KEY}`);
  console.log(`💳 Stripe configured: ${!!process.env.STRIPE_SECRET_KEY}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
