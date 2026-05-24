import cron from "node-cron";
import axios from "axios";
import * as cheerio from "cheerio";
import bcrypt from "bcryptjs";
import prisma from "../prisma";
import { logger } from "../utils/logger";
import { broadcastLog } from "../controllers/samvad.controller";

const log = logger.child("SAMVAD_SYNC");
const MAX_RETRIES = 3;
const EMPLOYEE_DEFAULT_PASSWORD = process.env.EMPLOYEE_DEFAULT_PASSWORD || "gnfc123";
const CREATE_EMPLOYEE_USERS = process.env.CREATE_EMPLOYEE_USERS === "true";

// Generate unique sync run ID for grouping logs
const generateSyncRunId = () => `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// ── Log to SamvadSyncLog table and broadcast via SSE ──
const logSyncEvent = async (level: string, message: string, details?: any, syncRunId?: string) => {
  try {
    const logEntry = await (prisma as any).samvadSyncLog.create({
      data: {
        level,
        message,
        details: details ? JSON.stringify(details) : undefined,
        syncRunId,
      },
    });
    // Broadcast to SSE clients
    broadcastLog(logEntry);
  } catch (err) {
    log.error("Failed to log sync event", err);
  }
};

// ── Error logging helper ──
const logError = (context: string, error: unknown) => {
  log.error(context, error);

  // Also log to EmailLog table for visibility
  prisma.emailLog
    .create({
      data: {
        to_email: "admin@gnfc.in",
        subject: `SAMVAD Sync Error: ${context}`,
        body: `Error: ${error instanceof Error ? error.message : String(error)}\nTime: ${new Date().toISOString()}`,
        sent_status: false,
      },
    })
    .catch((err) => log.error("Failed to log error to DB", err));
};

const normalizeLabel = (text: string) =>
  text
    .replace(/\s*:\s*$/, "")
    .trim()
    .toLowerCase();

const extractText = ($: cheerio.CheerioAPI, selectors: string[]) => {
  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length) {
      const text = element.text().trim();
      if (text) return text;
    }
  }
  return "";
};

const extractFieldValue = ($: cheerio.CheerioAPI, labels: string[]) => {
  const normalizedLabels = labels.map(normalizeLabel);

  for (const label of normalizedLabels) {
    const row = $("tr")
      .filter((_, el) => {
        const texts = $(el)
          .find("td, th")
          .map((_, cell) => normalizeLabel($(cell).text()))
          .get();
        return texts.some((text) => text === label);
      })
      .first();

    if (row.length) {
      const cells = row.find("td, th");
      for (let index = 0; index < cells.length; index++) {
        const cell = cells.eq(index);
        if (normalizeLabel(cell.text()) === label && index + 1 < cells.length) {
          return cells
            .eq(index + 1)
            .text()
            .trim();
        }
      }
    }

    const td = $("td")
      .filter((_, el) => normalizeLabel($(el).text()) === label)
      .first();
    if (td.length) {
      const nextCell = td.next("td");
      if (nextCell.length) return nextCell.text().trim();

      const cells = td.closest("tr").find("td");
      if (cells.length > 1) {
        return cells.eq(1).text().trim();
      }
    }
  }
  return "";
};

const fetchEmployeeDetails = async (empId: number, retryCount = 0): Promise<any | null> => {
  try {
    const url = `http://egnfc/isdweb/telecom/TEmpDetails.aspx?EmpId=${empId}`;
    const response = await axios.get(url, {
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    const fullName = extractText($, [
      "#CPHolderContent_lblShortName",
      "#CPHolderContent_lblFName",
      "#CPHolderContent_lblMName",
      "#CPHolderContent_lblLName",
    ]);

    const firstName = extractText($, ["#CPHolderContent_lblFName"]);
    const middleName = extractText($, ["#CPHolderContent_lblMName"]);
    const lastName = extractText($, ["#CPHolderContent_lblLName"]);
    const name = fullName || [firstName, middleName, lastName].filter(Boolean).join(" ").trim();

    const department =
      extractText($, ["#CPHolderContent_lblDepartment", "#CPHolderContent_lblSubDepartment", "#CPHolderContent_lblLocation"]) ||
      extractFieldValue($, ["Department", "Dept", "Sub Department", "Location"]);
    const designation = extractText($, ["#CPHolderContent_lblDesignation"]) || extractFieldValue($, ["Designation", "Desig"]);
    const email =
      extractText($, ['a[href^="mailto:"]']).replace(/^mailto:/i, "") || extractFieldValue($, ["Email", "Official Email", "E-mail"]);

    // Extract status and contact number from SAMVAD
    const status = extractFieldValue($, ["Status", "Emp Status", "Employment Status"]) || "ACTIVE";
    const contactNo = extractFieldValue($, ["Contact No", "Mobile", "Phone", "Contact Number"]) || undefined;

    if (!name) {
      return null;
    }

    // Skip employees with invalid names (phone numbers, placeholders, single-word garbage data)
    const nameStr = name.trim();
    const invalidWordPattern = /^(n\/a|na|none|unknown|not available|employee|test|phone)$/i;
    const phonePattern = /^\d{10,}$/;
    if (phonePattern.test(nameStr) || invalidWordPattern.test(nameStr) || nameStr.length < 3) {
      log.warn(`Skipping employee #${empId} - invalid name: "${nameStr}"`);
      return null;
    }

    // Skip if name is just a phone number (10+ digits)
    if (/^\d+$/.test(nameStr) && nameStr.length >= 10) {
      log.warn(`Skipping employee #${empId} - name is a phone number: "${nameStr}"`);
      return null;
    }

    // Only create active employees (check status from SAMVAD)
    const isActive = status.toUpperCase() === "ACTIVE";

    return {
      employee_no: empId.toString(),
      name,
      department: department || "Unknown",
      designation: designation || "Employee",
      email: email || `${empId}@gnfc.in`,
      status,
      contact_no: contactNo,
      active: isActive,
    };
  } catch (error: any) {
    if (retryCount < MAX_RETRIES) {
      console.warn(`Retry ${retryCount + 1} for EmpId ${empId}`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return fetchEmployeeDetails(empId, retryCount + 1);
    }
    logError(`fetchEmployeeDetails EmpId ${empId}`, error);
    return null;
  }
};

/**
 * Resolve the best email for an employee, avoiding unique constraint violations.
 * Strategy:
 * 1. Use the SAMVAD-provided email if it's not taken by another user
 * 2. If it IS taken, append the employee_no to make it unique
 * 3. Fall back to `{employee_no}@gnfc.in`
 */
const normalizeEmail = (value: string) => value.trim().toLowerCase();

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const resolveSafeEmail = async (employee: any, excludeUserId?: number): Promise<string> => {
  const preferredRaw = normalizeEmail(employee.email || `${employee.employee_no}@gnfc.in`);
  const preferredEmail = isValidEmail(preferredRaw) ? preferredRaw : `${employee.employee_no}@gnfc.in`;
  const [localPart, domainPart] = preferredEmail.split("@");
  const domain = domainPart || "gnfc.in";
  let candidate = `${localPart}@${domain}`;
  let suffix = 0;

  // Add a max iteration limit to prevent infinite loops
  const MAX_ITERATIONS = 1000;
  while (suffix < MAX_ITERATIONS) {
    const existingWithEmail = await prisma.user.findFirst({
      where: {
        email: candidate,
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
    });

    if (!existingWithEmail) return candidate;
    suffix += 1;
    candidate = `${localPart}${suffix}@${domain}`;
  }

  // Fallback: use employee_no as local part
  return `${employee.employee_no}@${domain}`;
};

const ensureEmployeeUser = async (employee: any, hashedPassword: string, allowCreate = true) => {
  // ── Case 1: User already linked via employeeId ──
  const existingUser = await prisma.user.findUnique({ where: { employeeId: employee.id } });
  if (existingUser) {
    const safeEmail = await resolveSafeEmail(employee, existingUser.id);
    if (safeEmail !== normalizeEmail(existingUser.email || "")) {
      try {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { email: safeEmail },
        });
        log.info(`Updated email for user #${existingUser.id}: ${existingUser.email} → ${safeEmail}`);
      } catch (err: any) {
        log.error(`Failed to update email for user #${existingUser.id}:`, err.message);
      }
    }
    return false;
  }

  if (!allowCreate) return false;

  // ── Case 2: No linked user, but username (employee_no) already exists ──
  const username = employee.employee_no;
  const existingByUsername = await prisma.user.findUnique({ where: { username } });
  if (existingByUsername) {
    const safeEmail = await resolveSafeEmail(employee, existingByUsername.id);
    const needsUpdate = !existingByUsername.employeeId || normalizeEmail(existingByUsername.email || "") !== safeEmail;
    if (needsUpdate) {
      try {
        await prisma.user.update({
          where: { id: existingByUsername.id },
          data: {
            employeeId: employee.id,
            email: safeEmail,
          },
        });
        log.info(`Linked user #${existingByUsername.id} to employee #${employee.id}, email: ${safeEmail}`);
      } catch (err: any) {
        log.error(`Failed to link user #${existingByUsername.id} to employee:`, err.message);
      }
    }
    return false;
  }

  // ── Case 3: Completely new user ──
  const safeEmail = await resolveSafeEmail(employee);
  try {
    await prisma.user.create({
      data: {
        username,
        email: safeEmail,
        password: hashedPassword,
        role: "RECOMMENDING_EMPLOYEE",
        employeeId: employee.id,
        designation: employee.designation,
      },
    });
    console.log(`[SAMVAD_SYNC] Created user "${username}" with email: ${safeEmail}`);
    return true;
  } catch (err: any) {
    console.error(`[SAMVAD_SYNC] Failed to create user for emp ${employee.employee_no}:`, err.message);
    return false;
  }
};

export const runSyncJob = async (syncRunId?: string) => {
  const runId = syncRunId || generateSyncRunId();
  console.log(`Starting SAMVAD Employee Sync (Run: ${runId})...`);
  await logSyncEvent("INFO", "Starting SAMVAD Employee Sync", { runId }, runId);

  let updatedCount = 0;
  let createdUserCount = 0;
  let skippedCount = 0;

  const hashedPassword = CREATE_EMPLOYEE_USERS ? await bcrypt.hash(EMPLOYEE_DEFAULT_PASSWORD, 10) : "";

  try {
    const BATCH_SIZE = 50;
    for (let i = 1; i <= 12000; i += BATCH_SIZE) {
      const batchPromises = [];
      for (let j = i; j < i + BATCH_SIZE && j <= 12000; j++) {
        batchPromises.push(fetchEmployeeDetails(j));
      }

      const batchResults = await Promise.all(batchPromises);

      for (const emp of batchResults) {
        if (emp) {
          // Skip inactive employees
          if (!emp.active) {
            skippedCount++;
            await logSyncEvent("INFO", `Skipped inactive employee`, { empId: emp.employee_no, status: emp.status }, runId);
            continue;
          }

          try {
            const savedEmployee = await prisma.employee.upsert({
              where: { employee_no: emp.employee_no },
              update: {
                name: emp.name,
                department: emp.department,
                designation: emp.designation,
                email: emp.email,
                status: emp.status,
                contact_no: emp.contact_no,
                active: emp.active,
              },
              create: {
                ...emp,
                status: emp.status,
                contact_no: emp.contact_no,
              },
            });
            updatedCount++;

            const created = await ensureEmployeeUser(savedEmployee, hashedPassword, CREATE_EMPLOYEE_USERS);
            if (created) {
              createdUserCount++;
            }
          } catch (dbError: any) {
            logError(`DB upsert for EmpId ${emp.employee_no}`, dbError);
            await logSyncEvent("ERROR", `DB upsert failed`, { empId: emp.employee_no, error: dbError.message }, runId);
          }
        }
      }

      if ((i - 1 + BATCH_SIZE) % 1000 === 0) {
        console.log(`Processed up to EmpId ${i - 1 + BATCH_SIZE}`);
        await logSyncEvent("INFO", `Progress update`, { processedUpTo: i - 1 + BATCH_SIZE }, runId);
      }
    }
  } catch (err) {
    logError("runSyncJob main loop", err);
    await logSyncEvent("ERROR", "Sync job failed", { error: String(err) }, runId);
  }

  console.log(
    `SAMVAD Employee Sync completed. Updated ${updatedCount} records. Created ${createdUserCount} employee users. Skipped ${skippedCount} inactive.`,
  );
  await logSyncEvent("INFO", "SAMVAD Employee Sync completed", { updatedCount, createdUserCount, skippedCount }, runId);

  return {
    updatedCount,
    createdUserCount,
    skippedCount,
    createEmployeeUsers: CREATE_EMPLOYEE_USERS,
    runId,
  };
};

export const scheduleSamvadSync = () => {
  cron.schedule("0 2 * * *", async () => {
    console.log("Running nightly SAMVAD sync job at 2 AM...");
    try {
      await runSyncJob();
    } catch (err) {
      logError("scheduleSamvadSync cron", err);
    }
  });
};
