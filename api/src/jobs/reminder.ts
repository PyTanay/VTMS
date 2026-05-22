import cron from "node-cron";
import { runReminders, getReminderSummary } from "../services/reminder.service";

const logError = (context: string, error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[REMINDER_CRON] ${context}: ${message}`);
};

/**
 * Schedule daily reminder job at 8:00 AM
 */
export const scheduleReminders = () => {
  cron.schedule("0 8 * * *", async () => {
    console.log("[REMINDER_CRON] Running daily reminder job at 8:00 AM...");
    try {
      const results = await runReminders();
      const totalSent = results.reduce((sum, r) => sum + r.sent, 0);
      console.log(`[REMINDER_CRON] Completed. Sent ${totalSent} reminder emails.`);
      results.forEach((r) => {
        if (r.sent > 0) console.log(`  ${r.type}: ${r.sent} sent`);
      });
    } catch (err) {
      logError("scheduleReminders cron", err);
    }
  });

  // Also schedule a mid-day check at 2:00 PM
  cron.schedule("0 14 * * *", async () => {
    console.log("[REMINDER_CRON] Running mid-day reminder check at 2:00 PM...");
    try {
      const results = await runReminders();
      const totalSent = results.reduce((sum, r) => sum + r.sent, 0);
      if (totalSent > 0) {
        console.log(`[REMINDER_CRON] Mid-day check: Sent ${totalSent} reminders.`);
      }
    } catch (err) {
      logError("mid-day reminder", err);
    }
  });
};
