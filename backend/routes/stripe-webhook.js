import express from 'express';
import Stripe from 'stripe';
import { Resend } from 'resend';
import pool from '../db.js';
import { generateUniqueUnlockCode } from '../utils/unlockCodeGenerator.js';
import { COMMISSION_RATES, HOLD_DAYS, REFUND_PAUSE_THRESHOLD } from '../config/commissionRates.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);

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
        await handleCheckoutCompleted(event.data.object, event.id);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object, event.id);
        break;

      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object, event.id);
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
async function handleCheckoutCompleted(session, eventId) {
  console.log('💳 Checkout completed:', session.id);

  const customerEmail = session.customer_email || session.customer_details?.email;
  const customerName = session.customer_details?.name || 'Customer';
  const amountPaid = session.amount_total / 100; // Convert from cents
  const affiliateCode = session.metadata?.affiliateCode || session.client_reference_id;
  const discountCode = session.metadata?.discountCode;
  const sessionId = session.id; // Store session ID for validation

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

    // 2. Insert the new code into unlock_codes table and mark as used
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year from now

    await client.query(
      `INSERT INTO unlock_codes (code, status, user_email, affiliate_code, activated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (code) DO UPDATE 
       SET status = $2, user_email = $3, affiliate_code = $4, activated_at = NOW()`,
      [unlockCode, 'used', customerEmail.toLowerCase(), affiliateCode]
    );

    // 3. Check if user has an affiliate account with same email (auto-link)
    const userAffiliateCheck = await client.query(
      'SELECT id, code FROM affiliates WHERE email = $1',
      [customerEmail.toLowerCase()]
    );
    const userAffiliateId = userAffiliateCheck.rows[0]?.id || null;
    const userAffiliateCode = userAffiliateCheck.rows[0]?.code || null;

    // 4. Create user account (with affiliate link if they have one)
    await client.query(
      `INSERT INTO users (email, unlock_code, subscription_type, expires_at, status, stripe_session_id, affiliate_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE 
       SET unlock_code = $2, expires_at = $4, status = $5, stripe_session_id = $6, affiliate_id = COALESCE(users.affiliate_id, $7)`,
      [customerEmail.toLowerCase(), unlockCode, 'one-time', expiresAt, 'active', sessionId, userAffiliateId]
    );
    
    if (userAffiliateId) {
      console.log(`✅ User auto-linked to their affiliate account: ${userAffiliateCode}`);
    }

    // 5. Track conversion for affiliate (if affiliate code provided)
    if (affiliateCode) {
      // Block self-referral: check if customer email matches affiliate email
      const affiliateCheck = await client.query(
        'SELECT id, email FROM affiliates WHERE code = $1',
        [affiliateCode]
      );
      
      const affiliate = affiliateCheck.rows[0];
      const isSelfReferral = affiliate && affiliate.email.toLowerCase() === customerEmail.toLowerCase();
      
      if (affiliate && !isSelfReferral) {
        // Determine product key from amount
        let productKey = 'operator_monthly';
        if (amountPaid >= 100) {
          productKey = 'operator_annual';
        }
        
        const commissionConfig = COMMISSION_RATES[productKey] || COMMISSION_RATES.operator_monthly;
        const commissionCents = commissionConfig.commissionCents;
        const grossCents = Math.round(amountPaid * 100);
        
        // Calculate eligible date (14 days from now)
        const eligibleAt = new Date();
        eligibleAt.setDate(eligibleAt.getDate() + HOLD_DAYS);
        
        // Insert into commissions ledger (PENDING status)
        await client.query(
          `INSERT INTO affiliate_commissions 
           (affiliate_id, affiliate_code, stripe_event_id, checkout_session_id, 
            payment_intent_id, customer_email, product_key, gross_amount_cents, 
            commission_cents, status, eligible_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', $10)
           ON CONFLICT (stripe_event_id) DO NOTHING`,
          [affiliate.id, affiliateCode, eventId, sessionId, 
           session.payment_intent, customerEmail.toLowerCase(), productKey, 
           grossCents, commissionCents, eligibleAt]
        );
        
        // Update affiliate conversion count (but NOT pending_payout - that's derived from ledger now)
        await client.query(
          `UPDATE affiliates SET total_conversions = total_conversions + 1 WHERE code = $1`,
          [affiliateCode]
        );
        
        console.log(`✅ Affiliate commission PENDING: ${affiliateCode} will earn $${(commissionCents/100).toFixed(2)} after ${HOLD_DAYS} days`);
      } else if (isSelfReferral) {
        console.log(`⚠️ Self-referral blocked: ${customerEmail} tried to use own affiliate code`);
      } else {
        console.log(`⚠️ Affiliate code not found: ${affiliateCode}`);
      }
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

    // 7. Send email with unlock code via Resend
    // Include affiliate info if user has an affiliate account
    const affiliateSection = userAffiliateCode ? `
      <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: #166534;">You're also an affiliate!</p>
        <p style="margin: 0; color: #166534;">Your referral code: <strong>${userAffiliateCode}</strong></p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #166534;">Share your link to earn commissions: <a href="https://helpmefilm.com?ref=${userAffiliateCode}">helpmefilm.com?ref=${userAffiliateCode}</a></p>
      </div>
    ` : '';
    
    try {
      await resend.emails.send({
        from: 'noreply@helpmefilm.com',
        to: [customerEmail],
        subject: 'Your TurnKey Access Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">Payment Successful!</h2>
            <p>Hi ${customerName},</p>
            <p>Thank you for your payment of $${amountPaid}. Your access code is ready:</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="font-size: 24px; font-weight: bold; color: #2563eb; letter-spacing: 2px; text-align: center;">
                ${unlockCode}
              </p>
            </div>
            <p>To activate your access:</p>
            <ol>
              <li>Go to <a href="https://helpmefilm.com/#/Unlock">helpmefilm.com/#/Unlock</a></li>
              <li>Enter your email: ${customerEmail}</li>
              <li>Enter your access code: ${unlockCode}</li>
              <li>Click "Activate"</li>
            </ol>
            ${affiliateSection}
            <p style="color: #666; font-size: 14px;">This code is valid for one year from activation.</p>
            <p>Best regards,<br>The TurnKey Team</p>
          </div>
        `
      });
      console.log('✅ Email sent to:', customerEmail);
    } catch (emailError) {
      console.error('❌ Failed to send email:', emailError);
      // Continue anyway - the code is still generated and stored
    }

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

/**
 * Handle charge refunded - reverse affiliate commission
 */
async function handleChargeRefunded(charge, eventId) {
  console.log('💸 Charge refunded:', charge.id);
  
  const paymentIntentId = charge.payment_intent;
  
  if (!paymentIntentId) {
    console.log('No payment_intent on refund, skipping commission reversal');
    return;
  }
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Find commission by payment_intent_id and reverse it
    const result = await client.query(
      `UPDATE affiliate_commissions 
       SET status = 'reversed', 
           reversed_at = NOW(), 
           reversal_reason = 'refund'
       WHERE payment_intent_id = $1 
       AND status IN ('pending', 'cleared')
       RETURNING affiliate_id, affiliate_code, commission_cents`,
      [paymentIntentId]
    );
    
    if (result.rows.length > 0) {
      const commission = result.rows[0];
      
      // Update affiliate refund count
      await client.query(
        `UPDATE affiliates 
         SET refund_count = refund_count + 1,
             last_refund_at = NOW()
         WHERE id = $1`,
        [commission.affiliate_id]
      );
      
      // Check if affiliate should be auto-paused (too many refunds)
      const affiliateCheck = await client.query(
        `SELECT refund_count FROM affiliates WHERE id = $1`,
        [commission.affiliate_id]
      );
      
      if (affiliateCheck.rows[0]?.refund_count >= REFUND_PAUSE_THRESHOLD) {
        await client.query(
          `UPDATE affiliates SET status = 'paused' WHERE id = $1`,
          [commission.affiliate_id]
        );
        console.log(`⚠️ Affiliate ${commission.affiliate_code} AUTO-PAUSED due to ${REFUND_PAUSE_THRESHOLD}+ refunds`);
      }
      
      console.log(`✅ Commission REVERSED for ${commission.affiliate_code}: $${(commission.commission_cents/100).toFixed(2)}`);
    } else {
      console.log('No commission found for this payment_intent');
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error reversing commission:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Handle dispute created - reverse commission and flag affiliate
 */
async function handleDisputeCreated(dispute, eventId) {
  console.log('⚠️ Dispute created:', dispute.id);
  
  const paymentIntentId = dispute.payment_intent;
  
  if (!paymentIntentId) {
    console.log('No payment_intent on dispute, skipping');
    return;
  }
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Find commission by payment_intent_id and reverse it
    const result = await client.query(
      `UPDATE affiliate_commissions 
       SET status = 'reversed', 
           reversed_at = NOW(), 
           reversal_reason = 'dispute'
       WHERE payment_intent_id = $1 
       AND status IN ('pending', 'cleared')
       RETURNING affiliate_id, affiliate_code, commission_cents`,
      [paymentIntentId]
    );
    
    if (result.rows.length > 0) {
      const commission = result.rows[0];
      
      // Update affiliate refund count and pause immediately for disputes
      await client.query(
        `UPDATE affiliates 
         SET refund_count = refund_count + 1,
             last_refund_at = NOW(),
             status = 'paused'
         WHERE id = $1`,
        [commission.affiliate_id]
      );
      
      console.log(`⚠️ Affiliate ${commission.affiliate_code} PAUSED due to dispute. Commission reversed: $${(commission.commission_cents/100).toFixed(2)}`);
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error handling dispute:', error);
    throw error;
  } finally {
    client.release();
  }
}

export default router;
