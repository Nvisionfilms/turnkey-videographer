import express from 'express';
import Stripe from 'stripe';
import pool from '../db.js';
import { generateUniqueUnlockCode } from '../utils/unlockCodeGenerator.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Stripe webhook endpoint - must use raw body
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('⚠️  Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Handle successful checkout completion
 */
async function handleCheckoutCompleted(session) {
  console.log('💳 Checkout completed:', session.id);

  const customerEmail = session.customer_email || session.customer_details?.email;
  const customerName = session.customer_details?.name || 'Customer';
  const amountPaid = session.amount_total / 100; // Convert from cents
  const affiliateCode = session.metadata?.affiliateCode || session.client_reference_id;
  const discountCode = session.metadata?.discountCode;

  if (!customerEmail) {
    console.error('❌ No customer email found in session');
    return;
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Generate unique unlock code
    const unlockCode = await generateUniqueUnlockCode(pool);
    console.log(`Generated unlock code: ${unlockCode}`);

    // 2. Mark code as used and assign to customer
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year from now

    await client.query(
      `UPDATE unlock_codes 
       SET status = $1, user_email = $2, affiliate_code = $3, activated_at = NOW()
       WHERE code = $4`,
      ['used', customerEmail.toLowerCase(), affiliateCode, unlockCode]
    );

    // 3. Create user account
    await client.query(
      `INSERT INTO users (email, unlock_code, subscription_type, expires_at, status)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE 
       SET unlock_code = $2, expires_at = $4, status = $5`,
      [customerEmail.toLowerCase(), unlockCode, 'one-time', expiresAt, 'active']
    );

    // 4. Track conversion for affiliate (if affiliate code provided)
    if (affiliateCode) {
      const commissionAmount = 39.99 * 0.15; // 15% commission on full price

      await client.query(
        `INSERT INTO conversions (affiliate_code, unlock_key, amount, status)
         VALUES ($1, $2, $3, $4)`,
        [affiliateCode, unlockCode, commissionAmount, 'completed']
      );

      await client.query(
        `UPDATE affiliates 
         SET total_conversions = total_conversions + 1,
             total_earnings = total_earnings + $1,
             pending_payout = pending_payout + $1
         WHERE code = $2`,
        [commissionAmount, affiliateCode]
      );

      console.log(`✅ Affiliate commission tracked: ${affiliateCode} earned $${commissionAmount}`);
    }

    // 5. If discount code was used, increment usage
    if (discountCode) {
      await client.query(
        'UPDATE discount_codes SET uses_count = uses_count + 1 WHERE code = $1',
        [discountCode.toUpperCase()]
      );
      console.log(`✅ Discount code usage tracked: ${discountCode}`);
    }

    await client.query('COMMIT');

    // 6. TODO: Send email with unlock code
    // await sendUnlockCodeEmail({
    //   to: customerEmail,
    //   customerName: customerName,
    //   unlockCode: unlockCode,
    //   amountPaid: amountPaid
    // });

    console.log(`✅ Order processed successfully for ${customerEmail}`);
    console.log(`   Unlock Code: ${unlockCode}`);
    console.log(`   Amount Paid: $${amountPaid}`);
    console.log(`   Affiliate: ${affiliateCode || 'None'}`);
    console.log(`   Discount Code: ${discountCode || 'None'}`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error processing checkout:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Handle successful payment intent
 */
async function handlePaymentSucceeded(paymentIntent) {
  console.log('💰 Payment succeeded:', paymentIntent.id);
  
  // Additional payment tracking if needed
  // Most logic is handled in checkout.session.completed
}

export default router;
