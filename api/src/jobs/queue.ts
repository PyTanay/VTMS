import { sendEmail } from "../utils/email";
import pdfService from "../services/pdf.service";
import prisma from "../prisma";
import { logger } from "../utils/logger";

const log = logger.child("QUEUE");

type Job = { id: number; type: string; payload: any };

const queue: Job[] = [];
let nextId = 1;
let running = false;

export const enqueue = (type: string, payload: any) => {
  const job: Job = { id: nextId++, type, payload };
  queue.push(job);
  log.info("Job enqueued", { jobId: job.id, type });
  process.nextTick(() => run());
  return job.id;
};

const run = async () => {
  if (running) return;
  running = true;
  while (queue.length) {
    const job = queue.shift();
    if (!job) break;
    log.info("Processing job", { jobId: job.id, type: job.type });
    try {
      if (job.type === "sendEmail") {
        await sendEmail(job.payload.to, job.payload.subject, job.payload.html);
        // Optionally log EmailLog in DB
        await prisma.emailLog.create({
          data: { to_email: job.payload.to, subject: job.payload.subject, body: job.payload.html, sent_status: true },
        });
        log.info("Email sent via queue", { jobId: job.id, to: job.payload.to });
      }
      if (job.type === "generatePermissionPdf") {
        const { applicationId, ref } = job.payload;
        const application = await prisma.application.findUnique({ where: { id: applicationId }, include: { college: true } });
        if (application) {
          const pdf = await pdfService.generatePermissionLetterPdf(application, { ref });
          // update application with permission_letter_ref/date
          await prisma.application.update({
            where: { id: applicationId },
            data: { permission_letter_ref: ref, permission_letter_date: new Date() },
          });
          log.info("Permission PDF generated via queue", { jobId: job.id, applicationId, ref, filename: pdf.filename });
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error(`Job failed: ${job.type}`, err, { jobId: job.id, payload: job.payload });
      // Log queue failures to DB
      try {
        await prisma.emailLog.create({
          data: {
            to_email: "admin@gnfc.in",
            subject: `Queue Job Failed: ${job.type}`,
            body: `Job ID: ${job.id}\nType: ${job.type}\nPayload: ${JSON.stringify(job.payload)}\nError: ${message}\nTime: ${new Date().toISOString()}`,
            sent_status: false,
          },
        });
      } catch (logErr) {
        log.error("Failed to log queue error to DB", logErr);
      }
    }
  }
  running = false;
  log.info("Queue processing complete");
};

export const startQueue = () => {
  log.info("In-process job queue initialized");
};

export default { enqueue, startQueue };
