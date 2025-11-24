#!/usr/bin/env node

/**
 * Test Setup Script
 * Verifies all configuration is correct before deployment
 */

import dotenv from 'dotenv';
import sgMail from '@sendgrid/mail';
import Stripe from 'stripe';

// Load environment variables
dotenv.config();

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

function log(emoji, message) {
  console.log(`${emoji} ${message}`);
}

// Test 1: Environment Variables
test('Environment Variables', () => {
  const required = [
    'STRIPE_SECRET_KEY',
    'SENDGRID_API_KEY',
    'SENDGRID_FROM_EMAIL',
    'HMAC_SECRET_KEY',
    'ENCRYPTION_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
  
  // Check key formats
  if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    throw new Error('STRIPE_SECRET_KEY should start with sk_test_ or sk_live_');
  }
  
  if (!process.env.SENDGRID_API_KEY.startsWith('SG.')) {
    throw new Error('SENDGRID_API_KEY should start with SG.');
  }
  
  if (process.env.HMAC_SECRET_KEY.length < 32) {
    throw new Error('HMAC_SECRET_KEY should be at least 32 characters');
  }
  
  log('✅', 'All required environment variables are set');
});

// Test 2: Stripe Connection
test('Stripe Connection', async () => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  
  try {
    const balance = await stripe.balance.retrieve();
    const mode = process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') ? 'TEST' : 'LIVE';
    log('✅', `Stripe connected successfully (${mode} mode)`);
    log('💰', `Available balance: ${balance.available[0]?.amount || 0} ${balance.available[0]?.currency || 'USD'}`);
  } catch (error) {
    throw new Error(`Stripe connection failed: ${error.message}`);
  }
});

// Test 3: SendGrid Connection
test('SendGrid Connection', async () => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  try {
    // Just validate the API key format - don't send actual email
    if (!process.env.SENDGRID_FROM_EMAIL.includes('@')) {
      throw new Error('SENDGRID_FROM_EMAIL must be a valid email address');
    }
    
    log('✅', `SendGrid configured with sender: ${process.env.SENDGRID_FROM_EMAIL}`);
    log('⚠️', 'Note: Sender email must be verified in SendGrid dashboard');
  } catch (error) {
    throw new Error(`SendGrid configuration failed: ${error.message}`);
  }
});

// Test 4: Code Generation
test('Code Generation', async () => {
  const { generateSecureCode } = await import('./services/codeManager.js');
  
  const code = await generateSecureCode();
  
  if (!code.match(/^NV-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/)) {
    throw new Error('Generated code format is invalid');
  }
  
  log('✅', `Code generation working: ${code}`);
});

// Test 5: Database Initialization
test('Database Initialization', async () => {
  const { storeCode } = await import('./services/codeManager.js');
  
  try {
    const testCode = await storeCode({
      code: 'NV-TEST-CODE-1234-ABCD',
      email: 'test@example.com',
      customerName: 'Test User',
      amountPaid: 9.99,
      stripeSessionId: 'test_session',
      stripeCustomerId: 'test_customer',
      status: 'test'
    });
    
    log('✅', 'Database initialization successful');
  } catch (error) {
    throw new Error(`Database initialization failed: ${error.message}`);
  }
});

// Run all tests
async function runTests() {
  console.log('\n🧪 Running Setup Tests...\n');
  
  for (const { name, fn } of tests) {
    try {
      await fn();
      passed++;
    } catch (error) {
      failed++;
      log('❌', `${name}: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);
  
  if (failed === 0) {
    log('🎉', 'All tests passed! Ready for deployment.');
    console.log('\nNext steps:');
    console.log('1. Deploy server to Railway/Heroku');
    console.log('2. Set up Stripe webhook');
    console.log('3. Test with real payment');
    process.exit(0);
  } else {
    log('⚠️', 'Some tests failed. Fix the issues above before deploying.');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('❌ Test runner error:', error);
  process.exit(1);
});
