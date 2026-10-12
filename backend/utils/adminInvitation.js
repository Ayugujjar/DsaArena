const crypto = require('crypto');
const emailService = require('../services/emailService');

const sendAdminSetupInvitation = async (admin) => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  admin.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  admin.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim();
  const setupUrl = `${frontendUrl.replace(/\/$/, '')}/admin/set-password/${rawToken}`;
  if (process.env.NODE_ENV === 'production' && !setupUrl.startsWith('https://')) {
    throw new Error('Administrator setup links must use HTTPS in production');
  }
  await admin.save();

  const emailSent = emailService.isConfigured();
  if (emailSent) {
    await emailService.sendAdminSetupEmail(admin.email, admin.name, setupUrl);
  }
  return { setupUrl, emailSent };
};

module.exports = { sendAdminSetupInvitation };
