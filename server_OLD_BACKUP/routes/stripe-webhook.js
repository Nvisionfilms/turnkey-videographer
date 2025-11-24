import express from 'express';
import Stripe from 'stripe';
import { sendUnlockCodeEmail } from '../services/email.js';
import { generateSecureCode, storeCode } from '../services/codeManager.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Stripe webhook endpoint - must use raw body
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
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

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
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

  if (!customerEmail) {
    console.error('❌ No customer email found in session');
    return;
  }

  try {
    // Generate secure unlock code
    const unlockCode = await generateSecureCode();

    // Store code in database/file (implement based on your storage choice)
    await storeCode({
      code: unlockCode,
      email: customerEmail,
      customerName: customerName,
      amountPaid: amountPaid,
      stripeSessionId: session.id,
      stripeCustomerId: session.customer,
      status: 'issued',
      issuedAt: new Date().toISOString()
    });

    // Send email with unlock code
    await sendUnlockCodeEmail({
      to: customerEmail,
      customerName: customerName,
      unlockCode: unlockCode,
      amountPaid: amountPaid
    });

    console.log(`✅ Unlock code sent to ${customerEmail}: ${unlockCode}`);
  } catch (error) {
    console.error('❌ Error processing checkout:', error);
    // In production, you might want to retry or alert admins
    throw error;
  }
}

/**
 * Handle new subscription creation
 */
async function handleSubscriptionCreated(subscription) {
  console.log('📅 Subscription created:', subscription.id);
  
  // You can add additional logic here if needed
  // For example, tracking subscription start dates
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionDeleted(subscription) {
  console.log('❌ Subscription cancelled:', subscription.id);
  
  // You might want to:
  // - Mark codes as expired
  // - Send cancellation confirmation email
  // - Update database records
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(subscription) {
  console.log('🔄 Subscription updated:', subscription.id);
  
  // Handle subscription changes like:
  // - Plan upgrades/downgrades
  // - Payment method updates
}

export default router;
