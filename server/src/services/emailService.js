import dotenv from 'dotenv';

/**
 * Validates whether a given string is a properly formatted email address.
 * @param {string} email
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

/**
 * Sends a transactional OTP email using the Brevo Email API.
 * 
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.otp - 6-digit OTP code
 * @param {number} [params.expiresInMinutes=5] - Expiration duration in minutes
 * @returns {Promise<{ success: boolean, messageId?: string }>}
 */
export const sendOtpEmail = async ({ to, otp, expiresInMinutes = 5 }) => {
  if (!isValidEmail(to)) {
    throw new Error('Invalid recipient email address');
  }

  if (!otp || String(otp).trim().length !== 6) {
    throw new Error('Invalid OTP code provided');
  }

  const provider = process.env.EMAIL_PROVIDER;
  if (provider !== 'brevo') {
    throw new Error(`Unsupported or unconfigured email provider: ${provider}`);
  }

  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || 'Gauseva';

  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not configured in environment variables');
  }

  if (!senderEmail || !isValidEmail(senderEmail)) {
    throw new Error('BREVO_SENDER_EMAIL is invalid or missing in environment variables');
  }

  const payload = {
    sender: {
      name: senderName,
      email: senderEmail.trim()
    },
    to: [
      {
        email: to.trim().toLowerCase()
      }
    ],
    subject: 'Your Gauseva verification code',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verification Code</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
  <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
    <div style="text-align: center; margin-bottom: 24px;">
      <h2 style="color: #2563eb; font-size: 24px; font-weight: 800; margin: 0 0 4px 0;">Gauseva</h2>
      <p style="color: #64748b; font-size: 14px; margin: 0;">Dairy &amp; Medical Management System</p>
    </div>
    <div style="border-top: 1px solid #f1f5f9; padding-top: 24px;">
      <h3 style="color: #1e293b; font-size: 16px; margin: 0 0 12px 0;">Email Verification</h3>
      <p style="color: #475569; font-size: 14px; line-height: 1.5; margin: 0 0 20px 0;">
        Your verification code is:
      </p>
      <div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 20px;">
        <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #0f172a;">${otp}</span>
      </div>
      <p style="color: #475569; font-size: 14px; margin: 0 0 20px 0;">
        This code expires in <strong>${expiresInMinutes} minutes</strong>.
      </p>
      <p style="color: #94a3b8; font-size: 12px; line-height: 1.4; margin: 0 0 8px 0;">
        If you did not request this verification code, you can safely ignore this email.
      </p>
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">
        Do not share this code with anyone.
      </p>
    </div>
  </div>
</body>
</html>`
  };

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let errorDetails = '';
    try {
      const errJson = await response.json();
      errorDetails = errJson.message || JSON.stringify(errJson);
    } catch {
      errorDetails = response.statusText;
    }
    console.error(`[Brevo Delivery Error] HTTP ${response.status}: ${errorDetails}`);
    throw new Error(`Failed to send email via Brevo: HTTP ${response.status}`);
  }

  const responseData = await response.json();
  return {
    success: true,
    messageId: responseData.messageId
  };
};
