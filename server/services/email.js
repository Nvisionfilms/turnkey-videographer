import sgMail from '@sendgrid/mail';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send unlock code email to customer
 */
export async function sendUnlockCodeEmail({ to, customerName, unlockCode, amountPaid }) {
  const msg = {
    to: to,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: process.env.SENDGRID_FROM_NAME || 'NVision Calculator'
    },
    subject: 'Your NVision Calculator Unlock Code',
    text: generatePlainTextEmail(customerName, unlockCode, amountPaid),
    html: generateHTMLEmail(customerName, unlockCode, amountPaid),
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('❌ SendGrid error:', error);
    if (error.response) {
      console.error(error.response.body);
    }
    throw error;
  }
}

/**
 * Generate plain text email
 */
function generatePlainTextEmail(customerName, unlockCode, amountPaid) {
  return `
Hi ${customerName},

Thank you for subscribing to NVision Turnkey Videographer Calculator!

Your unlock code is: ${unlockCode}

HOW TO ACTIVATE:
1. Go to the Unlock page in the calculator
2. Enter your unlock code
3. Click "Activate Code"
4. Enjoy unlimited access!

IMPORTANT:
- This code is unique to you and should not be shared
- Keep this email for your records
- The code does not expire

Amount paid: $${amountPaid.toFixed(2)}

If you have any questions or need help, just reply to this email.

Best regards,
The NVision Team

---
NVision Films
Professional Videography Tools
https://nvisionfilms.com
`.trim();
}

/**
 * Generate HTML email
 */
function generateHTMLEmail(customerName, unlockCode, amountPaid) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your NVision Unlock Code</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #D4AF37;
      margin-bottom: 10px;
    }
    .title {
      font-size: 28px;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 10px;
    }
    .subtitle {
      color: #666;
      font-size: 16px;
    }
    .code-box {
      background: linear-gradient(135deg, #D4AF37 0%, #C9A961 100%);
      border-radius: 8px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
    }
    .code-label {
      color: #ffffff;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
    }
    .code {
      font-size: 32px;
      font-weight: bold;
      color: #ffffff;
      letter-spacing: 2px;
      font-family: 'Courier New', monospace;
      word-break: break-all;
    }
    .instructions {
      background-color: #f9f9f9;
      border-left: 4px solid #D4AF37;
      padding: 20px;
      margin: 20px 0;
    }
    .instructions h3 {
      margin-top: 0;
      color: #1a1a1a;
      font-size: 18px;
    }
    .instructions ol {
      margin: 10px 0;
      padding-left: 20px;
    }
    .instructions li {
      margin: 8px 0;
      color: #555;
    }
    .important {
      background-color: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 4px;
      padding: 15px;
      margin: 20px 0;
    }
    .important strong {
      color: #856404;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      color: #999;
      font-size: 14px;
    }
    .amount {
      text-align: center;
      color: #666;
      font-size: 14px;
      margin-top: 20px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #D4AF37 0%, #C9A961 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 12px 30px;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">⚡ NVISION</div>
      <h1 class="title">Welcome to Unlimited Access!</h1>
      <p class="subtitle">Your unlock code is ready</p>
    </div>

    <p>Hi ${customerName},</p>
    
    <p>Thank you for subscribing to the <strong>NVision Turnkey Videographer Calculator</strong>! We're excited to have you on board.</p>

    <div class="code-box">
      <div class="code-label">Your Unlock Code</div>
      <div class="code">${unlockCode}</div>
    </div>

    <div class="instructions">
      <h3>🚀 How to Activate</h3>
      <ol>
        <li>Go to the <strong>Unlock page</strong> in the calculator</li>
        <li>Enter your unlock code in the input field</li>
        <li>Click <strong>"Activate Code"</strong></li>
        <li>Start creating unlimited professional quotes!</li>
      </ol>
    </div>

    <div class="important">
      <strong>⚠️ Important:</strong>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>This code is unique to you and should not be shared</li>
        <li>Keep this email for your records</li>
        <li>The code does not expire</li>
        <li>You can use it on one device at a time</li>
      </ul>
    </div>

    <div class="amount">
      <strong>Amount paid:</strong> $${amountPaid.toFixed(2)}
    </div>

    <p style="margin-top: 30px;">If you have any questions or need assistance, just reply to this email. We're here to help!</p>

    <p>Best regards,<br>
    <strong>The NVision Team</strong></p>

    <div class="footer">
      <p>NVision Films | Professional Videography Tools</p>
      <p style="font-size: 12px; color: #ccc; margin-top: 10px;">
        This email was sent because you purchased a subscription to NVision Calculator.<br>
        If you didn't make this purchase, please contact us immediately.
      </p>
    </div>
  </div>
</body>
</html>
`.trim();
}

/**
 * Send subscription cancellation email
 */
export async function sendCancellationEmail({ to, customerName }) {
  const msg = {
    to: to,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: process.env.SENDGRID_FROM_NAME || 'NVision Calculator'
    },
    subject: 'Your NVision Calculator Subscription Has Been Cancelled',
    text: `Hi ${customerName},\n\nYour subscription to NVision Calculator has been cancelled. Your access will continue until the end of your current billing period.\n\nIf this was a mistake, you can resubscribe at any time.\n\nBest regards,\nThe NVision Team`,
    html: `<p>Hi ${customerName},</p><p>Your subscription to NVision Calculator has been cancelled. Your access will continue until the end of your current billing period.</p><p>If this was a mistake, you can resubscribe at any time.</p><p>Best regards,<br>The NVision Team</p>`
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Cancellation email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('❌ SendGrid error:', error);
    throw error;
  }
}

export default {
  sendUnlockCodeEmail,
  sendCancellationEmail
};
