import { sendEmail } from "../utils/email";
import pdfService from "../services/pdf.service";
import prisma from "../prisma";

type Job = { id: number; type: string; payload: any };

const queue: Job[] = [];
let nextId = 1;
let running = false;

export const enqueue = (type: string, payload: any) => {
  const job: Job = { id: nextId++, type, payload };
  queue.push(job);
  process.nextTick(() => run());
  return job.id;
};

const run = async () => {
  if (running) return;
  running = true;
  while (queue.length) {
    const job = queue.shift();
    if (!job) break;
    try {
      if (job.type === "sendEmail") {
        await sendEmail(job.payload.to, job.payload.subject, job.payload.html);
        // Optionally log EmailLog in DB
        await prisma.emailLog.create({
          data: { to_email: job.payload.to, subject: job.payload.subject, body: job.payload.html, sent_status: true },
        });
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
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Job failed", job, err);
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
        console.error("Failed to log queue error to DB", logErr);
      }
    }
  }
  running = false;
};

export const startQueue = () => {
  // nothing to do for in-process queue; placeholder to keep API stable
  console.log("In-process job queue initialized");
};

export default { enqueue, startQueue };
