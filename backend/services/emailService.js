const nodemailer = require('nodemailer');

const isConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD && process.env.SMTP_FROM);

const sendPasswordResetEmail = async (email, resetUrl) => {
  if (!isConfigured()) {
    throw new Error('SMTP email delivery is not configured');
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Reset your DsArena password',
    text: `Use this one-time link to reset your DsArena password. It expires in 15 minutes:\n\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
    html: `<p>Use this one-time link to reset your DsArena password. It expires in 15 minutes:</p><p><a href="${resetUrl}">Reset password</a></p><p>If you did not request this, ignore this email.</p>`,
  });
};

const sendAdminSetupEmail = async (email, name, setupUrl) => {
  if (!isConfigured()) {
    throw new Error('SMTP email delivery is not configured');
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
  const safeName = name.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Set up your DsArena administrator account',
    text: `Hello ${name},\n\nYour DsArena administrator account is ready. Use this one-time link to set your password. It expires in 30 minutes:\n\n${setupUrl}\n\nIf you were not expecting this invitation, you can ignore this email.`,
    html: `<p>Hello ${safeName},</p><p>Your DsArena administrator account is ready. Use this one-time link to set your password. It expires in 30 minutes:</p><p><a href="${setupUrl}">Set administrator password</a></p><p>If you were not expecting this invitation, you can ignore this email.</p>`,
  });
};

module.exports = { isConfigured, sendPasswordResetEmail, sendAdminSetupEmail };
