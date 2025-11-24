exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { email, code, name } = JSON.parse(event.body);

    // Validate inputs
    if (!email || !code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email and code are required' })
      };
    }

    // Check if API key exists
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Email service not configured' })
      };
    }

    console.log('Sending email to:', email);
    console.log('API Key exists:', !!process.env.RESEND_API_KEY);

    // Send email via Resend API
    const emailPayload = {
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Your Affiliate Login Verification Code',
      html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background: #f8f9fa;
                border-radius: 10px;
                padding: 30px;
                margin: 20px 0;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .code-box {
                background: #fff;
                border: 2px solid #D4AF37;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
                margin: 30px 0;
              }
              .code {
                font-size: 36px;
                font-weight: bold;
                letter-spacing: 8px;
                color: #D4AF37;
                font-family: 'Courier New', monospace;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                font-size: 12px;
                color: #666;
              }
              .warning {
                background: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 15px;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="color: #D4AF37; margin: 0;">🔐 Affiliate Login</h1>
                <p style="color: #666; margin: 10px 0 0 0;">NVision Turn-Key Videographer</p>
              </div>

              <p>Hi ${name || 'there'},</p>
              
              <p>You requested to log in to your affiliate dashboard. Here's your verification code:</p>

              <div class="code-box">
                <div class="code">${code}</div>
                <p style="margin: 10px 0 0 0; color: #666;">Enter this code to access your dashboard</p>
              </div>

              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li>This code expires in 10 minutes</li>
                  <li>Never share this code with anyone</li>
                  <li>If you didn't request this, ignore this email</li>
                </ul>
              </div>

              <p>Need help? Reply to this email or contact us at <a href="mailto:nvisionmg@gmail.com">nvisionmg@gmail.com</a></p>

              <div class="footer">
                <p>© ${new Date().getFullYear()} NVision Films. All rights reserved.</p>
                <p><a href="https://helpmefilm.com" style="color: #D4AF37;">helpmefilm.com</a></p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
Hi ${name || 'there'},

You requested to log in to your affiliate dashboard.

Your verification code is: ${code}

Enter this code to access your dashboard.

⚠️ Security Notice:
- This code expires in 10 minutes
- Never share this code with anyone
- If you didn't request this, ignore this email

Need help? Contact us at nvisionmg@gmail.com

© ${new Date().getFullYear()} NVision Films
https://helpmefilm.com
        `,
      text: `
Hi ${name || 'there'},

You requested to log in to your affiliate dashboard.

Your verification code is: ${code}

Enter this code to access your dashboard.

⚠️ Security Notice:
- This code expires in 10 minutes
- Never share this code with anyone
- If you didn't request this, ignore this email

Need help? Contact us at nvisionmg@gmail.com

© ${new Date().getFullYear()} NVision Films
https://helpmefilm.com
        `
    };

    console.log('Email payload:', JSON.stringify(emailPayload, null, 2));

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', JSON.stringify(data, null, 2));
      console.error('Request was:', JSON.stringify({ from: 'Acme <onboarding@resend.dev>', to: [email], subject: 'Your Affiliate Login Verification Code' }));
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          error: 'Failed to send email', 
          details: data,
          message: data.message || 'Unknown error from Resend'
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Email sent successfully' })
    };

  } catch (error) {
    console.error('Error sending email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};
