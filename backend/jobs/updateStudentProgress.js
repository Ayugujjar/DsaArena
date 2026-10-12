const cron = require('node-cron');
const progressService = require('../services/progressService');
let progressTask = null;

/**
 * Initializes scheduled progress updates for all students.
 * Default: runs every 6 hours ("0 *\/6 * * *").
 */
const initProgressCron = () => {
  if (progressTask) return;

  const cronSchedule = process.env.CRON_SCHEDULE || '0 */6 * * *';

  console.log(`[CronJob] Initializing progress synchronization with schedule: "${cronSchedule}"`);

  progressTask = cron.schedule(cronSchedule, async () => {
    console.log(`[CronJob] Starting periodic student progress synchronization: ${new Date().toISOString()}`);
    try {
      const results = await progressService.syncAllStudents();
      console.log(`[CronJob] Synchronization completed. Updated ${results.length} students.`);
    } catch (err) {
      console.error(`[CronJob] Error executing scheduled progress update:`, err.message);
    }
  });
};

const isProgressCronActive = () => Boolean(progressTask);

module.exports = { initProgressCron, isProgressCronActive };
