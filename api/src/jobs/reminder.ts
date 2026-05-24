import cron from "node-cron";
import { runReminders, getReminderSummary } from "../services/reminder.service";
import { logger } from "../utils/logger";

const log = logger.child("REMINDER_CRON");

/**
 * Schedule daily reminder job at 8:00 AM
 */
export const scheduleReminders = () => {
  cron.schedule("0 8 * * *", async () => {
    log.info("Running daily reminder job at 8:00 AM");
    try {
      const results = await runReminders();
      const totalSent = results.reduce((sum, r) => sum + r.sent, 0);
      log.info("Daily reminder job completed", { totalSent, details: results.filter((r) => r.sent > 0) });
    } catch (err) {
      log.error("Daily reminder job failed", err);
    }
  });

  // Also schedule a mid-day check at 2:00 PM
  cron.schedule("0 14 * * *", async () => {
    log.info("Running mid-day reminder check at 2:00 PM");
    try {
      const results = await runReminders();
      const totalSent = results.reduce((sum, r) => sum + r.sent, 0);
      if (totalSent > 0) {
        log.info("Mid-day reminders sent", { totalSent });
      }
    } catch (err) {
      log.error("Mid-day reminder check failed", err);
    }
  });
};
