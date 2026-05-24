import fs from "fs";
import path from "path";
import storageConfig from "../config/storage";
import { logger } from "../utils/logger";

const log = logger.child("CLEANUP");

export const cleanupOldUploads = (daysOld: number = 30) => {
  const uploadsDir = storageConfig.uploadsDir;
  const now = Date.now();
  const cutoff = now - daysOld * 24 * 60 * 60 * 1000;

  try {
    const files = fs.readdirSync(uploadsDir);
    let deletedCount = 0;
    files.forEach((file) => {
      const filePath = path.join(uploadsDir, file);
      const stat = fs.statSync(filePath);
      if (stat.mtimeMs < cutoff) {
        fs.unlinkSync(filePath);
        deletedCount++;
        log.info("Deleted old upload", { file });
      }
    });
    if (deletedCount > 0 || files.length > 0) {
      log.info("Cleanup scan complete", { totalFiles: files.length, deleted: deletedCount, daysOld });
    }
  } catch (err) {
    log.error("Cleanup task error", err);
  }
};

// Run cleanup every day at midnight
export const scheduleCleanup = () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const delay = tomorrow.getTime() - now.getTime();

  setTimeout(() => {
    cleanupOldUploads(30);
    // Run every 24 hours after first run
    setInterval(() => cleanupOldUploads(30), 24 * 60 * 60 * 1000);
  }, delay);
};

export default { cleanupOldUploads, scheduleCleanup };
