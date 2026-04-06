const nodemailer = require('nodemailer');
const logger = require('./logger');

const createTransporter = () => {
  // Gmail SMTP (or use SMTP_HOST/PORT for custom)
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  // Fallback: Gmail
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send an email
 * @param {Object} options - { to, subject, html, text }
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: `"Smart College ERP" <${process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@college.edu'}>`,
      to,
      subject,
      html,
      text,
    };
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error(`Failed to send email to ${to}: ${err.message}`);
    throw err;
  }
};

/**
 * Email templates
 */
const emailTemplates = {
  verification: (name, token, baseUrl) => ({
    subject: 'Verify Your Email — Smart College ERP',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#f9f9f9;padding:30px;border-radius:10px">
        <h2 style="color:#6366f1">Smart College ERP</h2>
        <h3>Email Verification</h3>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Please click the button below to verify your email address:</p>
        <a href="${baseUrl}/verify-email/${token}"
           style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0">
          Verify Email
        </a>
        <p style="color:#888;font-size:12px">This link expires in 24 hours. If you didn't register, ignore this email.</p>
      </div>
    `,
  }),

  passwordReset: (name, token, baseUrl) => ({
    subject: 'Password Reset — Smart College ERP',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;background:#f9f9f9;padding:30px;border-radius:10px">
        <h2 style="color:#6366f1">Smart College ERP</h2>
        <h3>Password Reset Request</h3>
        <p>Hello <strong>${name}</strong>,</p>
        <p>You requested a password reset. Click the button below to set a new password:</p>
        <a href="${baseUrl}/reset-password/${token}"
           style="display:inline-block;background:#ef4444;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0">
          Reset Password
        </a>
        <p style="color:#888;font-size:12px">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>
    `,
  }),
};

module.exports = { sendEmail, emailTemplates };
